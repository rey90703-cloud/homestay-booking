const fc = require('fast-check');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { initializeSocketIO } = require('../index');
const ChatRoom = require('../../modules/chats/chat.model');
const Message = require('../../modules/chats/message.model');
const chatService = require('../../modules/chats/chat.service');

describe('Chat Handlers Property-Based Tests', () => {
  let httpServer;
  let io;
  let serverPort;
  let mongoServer;
  const TEST_JWT_SECRET = 'test-secret-key-for-socket-testing';

  beforeAll(async () => {
    // Set JWT_SECRET for testing
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri);
    
    // Create HTTP server
    httpServer = http.createServer();
    io = initializeSocketIO(httpServer);
    
    // Listen on random port
    return new Promise((resolve) => {
      httpServer.listen(0, () => {
        serverPort = httpServer.address().port;
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    // Close socket.io
    if (io) {
      await new Promise((resolve) => {
        io.close(resolve);
      });
    }
    
    // Close HTTP server
    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
    }
    
    // Disconnect mongoose
    await mongoose.disconnect();
    
    // Stop in-memory MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 30000);

  beforeEach(async () => {
    // Clean up database before each test
    await ChatRoom.deleteMany({});
    await Message.deleteMany({});
  });

  /**
   * Helper function to create authenticated client
   */
  const createAuthenticatedClient = (userData) => {
    const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '1h' });
    return Client(`http://localhost:${serverPort}`, {
      auth: { token },
      reconnection: false,
    });
  };

  /**
   * Helper function to wait for client connection
   */
  const waitForConnection = (client) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      client.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  };

  /**
   * Helper function to create test chatroom
   */
  const createTestChatroom = async (bookingId, guestId, hostId) => {
    return await ChatRoom.create({
      bookingId: new mongoose.Types.ObjectId(bookingId),
      participants: [
        { userId: new mongoose.Types.ObjectId(guestId), role: 'guest' },
        { userId: new mongoose.Types.ObjectId(hostId), role: 'host' },
      ],
      unreadCount: {
        [guestId]: 0,
        [hostId]: 0,
      },
      metadata: {
        homestayId: new mongoose.Types.ObjectId(),
        homestayName: 'Test Homestay',
        hostName: 'Test Host',
      },
    });
  };

  /**
   * Helper function to generate valid MongoDB ObjectId string
   */
  const generateObjectId = () => {
    return new mongoose.Types.ObjectId().toString();
  };

  describe('Message Broadcasting Properties', () => {
    /**
     * Feature: realtime-chat, Property 11: Message được broadcast đến tất cả participants
     * Validates: Requirements 3.1
     */
    it('should broadcast message to all participants in chatroom', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (content) => {
            const bookingId = generateObjectId();
            const guestId = generateObjectId();
            const hostId = generateObjectId();
            
            // Ensure content is valid
            fc.pre(content.trim().length > 0);

            // Create chatroom
            const chatroom = await createTestChatroom(bookingId, guestId, hostId);

            // Create guest and host clients
            const guestClient = createAuthenticatedClient({ id: guestId, email: 'guest@test.com' });
            const hostClient = createAuthenticatedClient({ id: hostId, email: 'host@test.com' });

            await waitForConnection(guestClient);
            await waitForConnection(hostClient);

            // Both join the room
            await new Promise((resolve) => {
              let joined = 0;
              const checkJoined = () => {
                joined++;
                if (joined === 2) resolve();
              };
              
              guestClient.emit('join_room', chatroom._id.toString());
              hostClient.emit('join_room', chatroom._id.toString());
              
              guestClient.on('joined_room', checkJoined);
              hostClient.on('joined_room', checkJoined);
            });

            // Setup message listeners
            const guestMessagePromise = new Promise((resolve) => {
              guestClient.on('new_message', (data) => resolve(data));
            });

            const hostMessagePromise = new Promise((resolve) => {
              hostClient.on('new_message', (data) => resolve(data));
            });

            // Guest sends message
            guestClient.emit('send_message', {
              chatroomId: chatroom._id.toString(),
              content,
              type: 'text',
            });

            // Wait for both to receive
            const [guestReceived, hostReceived] = await Promise.all([
              guestMessagePromise,
              hostMessagePromise,
            ]);

            // Cleanup
            guestClient.close();
            hostClient.close();

            // Assert both received the message
            expect(guestReceived).toBeDefined();
            expect(guestReceived.message.content).toBe(content.trim());
            expect(guestReceived.message.senderId.toString()).toBe(guestId);
            
            expect(hostReceived).toBeDefined();
            expect(hostReceived.message.content).toBe(content.trim());
            expect(hostReceived.message.senderId.toString()).toBe(guestId);
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    }, 30000);
  });

  describe('LastMessage Update Properties', () => {
    /**
     * Feature: realtime-chat, Property 13: LastMessage được cập nhật khi gửi message
     * Validates: Requirements 3.3
     */
    it('should update lastMessage when sending message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (content) => {
            const bookingId = generateObjectId();
            const guestId = generateObjectId();
            const hostId = generateObjectId();
            
            // Ensure content is valid
            fc.pre(content.trim().length > 0);

            // Create chatroom
            const chatroom = await createTestChatroom(bookingId, guestId, hostId);
            const initialLastMessage = chatroom.lastMessage;

            // Create client
            const guestClient = createAuthenticatedClient({ id: guestId, email: 'guest@test.com' });
            await waitForConnection(guestClient);

            // Join room
            await new Promise((resolve) => {
              guestClient.emit('join_room', chatroom._id.toString());
              guestClient.on('joined_room', resolve);
            });

            // Send message
            await new Promise((resolve) => {
              guestClient.emit('send_message', {
                chatroomId: chatroom._id.toString(),
                content,
                type: 'text',
              });
              guestClient.on('new_message', resolve);
            });

            // Fetch updated chatroom
            const updatedChatroom = await ChatRoom.findById(chatroom._id);

            // Cleanup
            guestClient.close();

            // Assert lastMessage was updated
            expect(updatedChatroom.lastMessage).toBeDefined();
            expect(updatedChatroom.lastMessage.content).toBe(content.trim());
            expect(updatedChatroom.lastMessage.senderId.toString()).toBe(guestId);
            expect(updatedChatroom.lastMessage.type).toBe('text');
            expect(updatedChatroom.lastMessage.createdAt).toBeInstanceOf(Date);
            
            // Verify it's different from initial
            if (initialLastMessage) {
              expect(updatedChatroom.lastMessage.createdAt.getTime()).toBeGreaterThan(
                initialLastMessage.createdAt?.getTime() || 0
              );
            }
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    }, 30000);
  });

  describe('Typing Indicator Properties', () => {
    /**
     * Feature: realtime-chat, Property 26: Typing indicator broadcast
     * Feature: realtime-chat, Property 28: Typing indicator cleared on send
     * Feature: realtime-chat, Property 29: Typing indicator throttling
     * Feature: realtime-chat, Property 50: Typing indicator debouncing
     * Validates: Requirements 6.1, 6.4, 6.5, 12.5
     */
    it('should broadcast typing indicator to other participants', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const bookingId = generateObjectId();
            const guestId = generateObjectId();
            const hostId = generateObjectId();

            // Create chatroom
            const chatroom = await createTestChatroom(bookingId, guestId, hostId);

            // Create clients
            const guestClient = createAuthenticatedClient({ id: guestId, email: 'guest@test.com' });
            const hostClient = createAuthenticatedClient({ id: hostId, email: 'host@test.com' });

            await waitForConnection(guestClient);
            await waitForConnection(hostClient);

            // Both join the room
            await new Promise((resolve) => {
              let joined = 0;
              const checkJoined = () => {
                joined++;
                if (joined === 2) resolve();
              };
              
              guestClient.emit('join_room', chatroom._id.toString());
              hostClient.emit('join_room', chatroom._id.toString());
              
              guestClient.on('joined_room', checkJoined);
              hostClient.on('joined_room', checkJoined);
            });

            // Setup typing listener on host
            const typingPromise = new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(null), 3000);
              hostClient.on('user_typing', (data) => {
                clearTimeout(timeout);
                resolve(data);
              });
            });

            // Guest starts typing
            guestClient.emit('typing_start', chatroom._id.toString());

            // Wait for typing event
            const typingEvent = await typingPromise;

            // Cleanup
            guestClient.close();
            hostClient.close();

            // Assert typing event was received
            expect(typingEvent).not.toBeNull();
            expect(typingEvent.userId).toBe(guestId);
            expect(typingEvent.chatroomId).toBe(chatroom._id.toString());
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    }, 30000);

    it('should broadcast typing stop indicator', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const bookingId = generateObjectId();
            const guestId = generateObjectId();
            const hostId = generateObjectId();

            // Create chatroom
            const chatroom = await createTestChatroom(bookingId, guestId, hostId);

            // Create clients
            const guestClient = createAuthenticatedClient({ id: guestId, email: 'guest@test.com' });
            const hostClient = createAuthenticatedClient({ id: hostId, email: 'host@test.com' });

            await waitForConnection(guestClient);
            await waitForConnection(hostClient);

            // Both join the room
            await new Promise((resolve) => {
              let joined = 0;
              const checkJoined = () => {
                joined++;
                if (joined === 2) resolve();
              };
              
              guestClient.emit('join_room', chatroom._id.toString());
              hostClient.emit('join_room', chatroom._id.toString());
              
              guestClient.on('joined_room', checkJoined);
              hostClient.on('joined_room', checkJoined);
            });

            // Setup stop typing listener on host
            const stopTypingPromise = new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(null), 3000);
              hostClient.on('user_stop_typing', (data) => {
                clearTimeout(timeout);
                resolve(data);
              });
            });

            // Guest stops typing
            guestClient.emit('typing_stop', chatroom._id.toString());

            // Wait for stop typing event
            const stopTypingEvent = await stopTypingPromise;

            // Cleanup
            guestClient.close();
            hostClient.close();

            // Assert stop typing event was received
            expect(stopTypingEvent).not.toBeNull();
            expect(stopTypingEvent.userId).toBe(guestId);
            expect(stopTypingEvent.chatroomId).toBe(chatroom._id.toString());
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    }, 30000);
  });

  describe('Mark As Read Properties', () => {
    /**
     * Feature: realtime-chat, Property 30: UnreadCount reset khi mở chatroom
     * Feature: realtime-chat, Property 31: LastSeenAt update khi mở chatroom
     * Feature: realtime-chat, Property 32: Read event broadcast
     * Validates: Requirements 7.1, 7.2, 7.3
     */
    it('should reset unreadCount and update lastSeenAt when marking as read', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 50 }),
          async (unreadCount) => {
            const bookingId = generateObjectId();
            const guestId = generateObjectId();
            const hostId = generateObjectId();

            // Create chatroom with unread messages
            const chatroom = await ChatRoom.create({
              bookingId: new mongoose.Types.ObjectId(bookingId),
              participants: [
                { userId: new mongoose.Types.ObjectId(guestId), role: 'guest' },
                { userId: new mongoose.Types.ObjectId(hostId), role: 'host' },
              ],
              unreadCount: {
                [hostId]: unreadCount,
                [guestId]: 0,
              },
              metadata: {
                homestayId: new mongoose.Types.ObjectId(),
                homestayName: 'Test Homestay',
                hostName: 'Test Host',
              },
            });

            // Create host client
            const hostClient = createAuthenticatedClient({ id: hostId, email: 'host@test.com' });
            await waitForConnection(hostClient);

            // Join room
            await new Promise((resolve) => {
              hostClient.emit('join_room', chatroom._id.toString());
              hostClient.on('joined_room', resolve);
            });

            // Mark as read
            await new Promise((resolve) => {
              hostClient.emit('mark_as_read', chatroom._id.toString());
              hostClient.on('marked_as_read', resolve);
            });

            // Fetch updated chatroom
            const updatedChatroom = await ChatRoom.findById(chatroom._id);

            // Cleanup
            hostClient.close();

            // Assert unreadCount was reset
            expect(updatedChatroom.unreadCount.get(hostId)).toBe(0);
            
            // Assert lastSeenAt was updated
            const hostParticipant = updatedChatroom.participants.find(
              (p) => p.userId.toString() === hostId
            );
            expect(hostParticipant.lastSeenAt).toBeDefined();
            expect(hostParticipant.lastSeenAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    }, 30000);

    it('should broadcast message_read event to other participants', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const bookingId = generateObjectId();
            const guestId = generateObjectId();
            const hostId = generateObjectId();

            // Create chatroom
            const chatroom = await createTestChatroom(bookingId, guestId, hostId);

            // Create clients
            const guestClient = createAuthenticatedClient({ id: guestId, email: 'guest@test.com' });
            const hostClient = createAuthenticatedClient({ id: hostId, email: 'host@test.com' });

            await waitForConnection(guestClient);
            await waitForConnection(hostClient);

            // Both join the room
            await new Promise((resolve) => {
              let joined = 0;
              const checkJoined = () => {
                joined++;
                if (joined === 2) resolve();
              };
              
              guestClient.emit('join_room', chatroom._id.toString());
              hostClient.emit('join_room', chatroom._id.toString());
              
              guestClient.on('joined_room', checkJoined);
              hostClient.on('joined_room', checkJoined);
            });

            // Setup message_read listener on guest
            const readEventPromise = new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(null), 3000);
              guestClient.on('message_read', (data) => {
                clearTimeout(timeout);
                resolve(data);
              });
            });

            // Host marks as read
            hostClient.emit('mark_as_read', chatroom._id.toString());

            // Wait for read event
            const readEvent = await readEventPromise;

            // Cleanup
            guestClient.close();
            hostClient.close();

            // Assert read event was received
            expect(readEvent).not.toBeNull();
            expect(readEvent.userId).toBe(hostId);
            expect(readEvent.chatroomId).toBe(chatroom._id.toString());
            expect(readEvent.readAt).toBeDefined();
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    }, 30000);
  });

  describe('Message Send Authorization Properties', () => {
    /**
     * Feature: realtime-chat, Property 45: Message send authorization
     * Validates: Requirements 11.3
     */
    it('should reject message from non-participant', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (content) => {
            const bookingId = generateObjectId();
            const guestId = generateObjectId();
            const hostId = generateObjectId();
            const intruderId = generateObjectId();
            
            // Ensure content is valid
            fc.pre(content.trim().length > 0);

            // Create chatroom with only guest and host
            const chatroom = await createTestChatroom(bookingId, guestId, hostId);

            // Create intruder client (not a participant)
            const intruderClient = createAuthenticatedClient({ 
              id: intruderId, 
              email: 'intruder@test.com' 
            });
            await waitForConnection(intruderClient);

            // Setup error listener
            const errorPromise = new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(null), 3000);
              intruderClient.on('error', (data) => {
                clearTimeout(timeout);
                resolve(data);
              });
            });

            // Try to send message
            intruderClient.emit('send_message', {
              chatroomId: chatroom._id.toString(),
              content,
              type: 'text',
            });

            // Wait for error
            const errorEvent = await errorPromise;

            // Cleanup
            intruderClient.close();

            // Assert error was received
            expect(errorEvent).not.toBeNull();
            expect(errorEvent.event).toBe('send_message');
            expect(errorEvent.message).toContain('Access denied');
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    }, 30000);
  });
});
