const fc = require('fast-check');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const http = require('http');
const jwt = require('jsonwebtoken');
const { initializeSocketIO } = require('../index');

describe('Socket.IO Property-Based Tests', () => {
  let httpServer;
  let io;
  let serverPort;
  const TEST_JWT_SECRET = 'test-secret-key-for-socket-testing';

  beforeAll(() => {
    // Set JWT_SECRET for testing
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    
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
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  describe('Socket Authentication Properties', () => {
    /**
     * Feature: realtime-chat, Property 1: Socket authentication với valid token thành công
     * Feature: realtime-chat, Property 43: Socket authentication với JWT
     * Validates: Requirements 1.1, 1.5, 11.1
     */
    it('should accept connection with valid JWT token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
          }),
          async (userData) => {
            // Skip empty or whitespace-only IDs
            fc.pre(userData.id.trim().length > 0);
            
            // Generate valid JWT token
            const token = jwt.sign(userData, TEST_JWT_SECRET, {
              expiresIn: '1h',
            });

            // Create client with valid token
            const client = Client(`http://localhost:${serverPort}`, {
              auth: { token },
              reconnection: false,
            });

            // Wait for connection
            const connected = await new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(false), 2000);
              
              client.on('connect', () => {
                clearTimeout(timeout);
                resolve(true);
              });

              client.on('connect_error', () => {
                clearTimeout(timeout);
                resolve(false);
              });
            });

            client.close();

            // Assert connection was successful
            expect(connected).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: realtime-chat, Property 5: Invalid token bị từ chối
     * Validates: Requirements 1.5
     */
    it('should reject connection with invalid JWT token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (invalidToken) => {
            // Skip if token happens to be valid format
            fc.pre(!invalidToken.includes('.') || invalidToken.split('.').length !== 3);

            // Create client with invalid token
            const client = Client(`http://localhost:${serverPort}`, {
              auth: { token: invalidToken },
              reconnection: false,
            });

            // Wait for connection error
            const rejected = await new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(false), 2000);
              
              client.on('connect', () => {
                clearTimeout(timeout);
                resolve(false);
              });

              client.on('connect_error', (error) => {
                clearTimeout(timeout);
                resolve(true);
              });
            });

            client.close();

            // Assert connection was rejected
            expect(rejected).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject connection without token', async () => {
      const client = Client(`http://localhost:${serverPort}`, {
        auth: {},
        reconnection: false,
      });

      const rejected = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 2000);
        
        client.on('connect', () => {
          clearTimeout(timeout);
          resolve(false);
        });

        client.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      client.close();
      expect(rejected).toBe(true);
    });

    it('should reject connection with expired token', async () => {
      const userData = { id: 'user123', email: 'test@example.com' };
      
      // Generate expired token
      const token = jwt.sign(userData, TEST_JWT_SECRET, {
        expiresIn: '-1h', // Already expired
      });

      const client = Client(`http://localhost:${serverPort}`, {
        auth: { token },
        reconnection: false,
      });

      const rejected = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 2000);
        
        client.on('connect', () => {
          clearTimeout(timeout);
          resolve(false);
        });

        client.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      client.close();
      expect(rejected).toBe(true);
    });
  });

  describe('Online Status Properties', () => {
    /**
     * Feature: realtime-chat, Property 3: Online status được cập nhật khi connect
     * Validates: Requirements 1.3
     */
    it('should broadcast user_online event when user connects', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
          }),
          async (userData) => {
            // Skip empty or whitespace-only IDs
            fc.pre(userData.id.trim().length > 0);
            
            // Create observer client
            const observerToken = jwt.sign(
              { id: 'observer', email: 'observer@test.com' },
              TEST_JWT_SECRET,
              { expiresIn: '1h' }
            );

            const observer = Client(`http://localhost:${serverPort}`, {
              auth: { token: observerToken },
              reconnection: false,
            });

            await new Promise((resolve) => {
              observer.on('connect', resolve);
            });

            // Setup listener for user_online event
            const onlineEventPromise = new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(null), 3000);
              
              observer.on('user_online', (data) => {
                clearTimeout(timeout);
                resolve(data);
              });
            });

            // Create new user client
            const userToken = jwt.sign(userData, TEST_JWT_SECRET, {
              expiresIn: '1h',
            });

            const userClient = Client(`http://localhost:${serverPort}`, {
              auth: { token: userToken },
              reconnection: false,
            });

            await new Promise((resolve) => {
              userClient.on('connect', resolve);
            });

            // Wait for online event
            const onlineEvent = await onlineEventPromise;

            // Cleanup
            userClient.close();
            observer.close();

            // Assert online event was received with correct userId
            expect(onlineEvent).not.toBeNull();
            expect(onlineEvent.userId).toBe(userData.id);
          }
        ),
        { numRuns: 50 } // Reduced runs for performance
      );
    }, 60000); // 60 second timeout

    /**
     * Feature: realtime-chat, Property 4: Offline status được cập nhật khi disconnect
     * Validates: Requirements 1.4
     */
    it('should broadcast user_offline event when user disconnects', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
          }),
          async (userData) => {
            // Skip empty or whitespace-only IDs
            fc.pre(userData.id.trim().length > 0);
            
            // Create observer client
            const observerToken = jwt.sign(
              { id: 'observer', email: 'observer@test.com' },
              TEST_JWT_SECRET,
              { expiresIn: '1h' }
            );

            const observer = Client(`http://localhost:${serverPort}`, {
              auth: { token: observerToken },
              reconnection: false,
            });

            await new Promise((resolve) => {
              observer.on('connect', resolve);
            });

            // Create user client
            const userToken = jwt.sign(userData, TEST_JWT_SECRET, {
              expiresIn: '1h',
            });

            const userClient = Client(`http://localhost:${serverPort}`, {
              auth: { token: userToken },
              reconnection: false,
            });

            await new Promise((resolve) => {
              userClient.on('connect', resolve);
            });

            // Setup listener for user_offline event
            const offlineEventPromise = new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(null), 3000);
              
              observer.on('user_offline', (data) => {
                clearTimeout(timeout);
                resolve(data);
              });
            });

            // Disconnect user
            userClient.close();

            // Wait for offline event
            const offlineEvent = await offlineEventPromise;

            // Cleanup
            observer.close();

            // Assert offline event was received with correct userId and lastSeenAt
            expect(offlineEvent).not.toBeNull();
            expect(offlineEvent.userId).toBe(userData.id);
            expect(offlineEvent.lastSeenAt).toBeDefined();
            expect(new Date(offlineEvent.lastSeenAt)).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 50 } // Reduced runs for performance
      );
    }, 60000); // 60 second timeout
  });

  describe('Online Status Broadcast Properties', () => {
    /**
     * Feature: realtime-chat, Property 36: Online status change broadcast
     * Validates: Requirements 8.3
     */
    it('should broadcast online status change when user connects', async () => {
      // This test verifies that when a user connects, their online status
      // is broadcast to other connected users
      // Note: Current implementation broadcasts globally to all users
      // Ideally it should only broadcast to chatrooms the user participates in
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
          }),
          async (testData) => {
            // Skip empty or whitespace-only IDs
            fc.pre(testData.userId.trim().length > 0);
            
            // Create observer client
            const observerToken = jwt.sign(
              { id: 'observer', email: 'observer@test.com' },
              TEST_JWT_SECRET,
              { expiresIn: '1h' }
            );

            const observer = Client(`http://localhost:${serverPort}`, {
              auth: { token: observerToken },
              reconnection: false,
            });

            await new Promise((resolve) => {
              observer.on('connect', resolve);
            });

            // Setup listener for user_online event
            const onlineEventPromise = new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(null), 3000);
              
              observer.on('user_online', (data) => {
                clearTimeout(timeout);
                resolve(data);
              });
            });

            // Create user client (this should trigger user_online broadcast)
            const userToken = jwt.sign(
              { id: testData.userId, email: testData.email },
              TEST_JWT_SECRET,
              { expiresIn: '1h' }
            );

            const userClient = Client(`http://localhost:${serverPort}`, {
              auth: { token: userToken },
              reconnection: false,
            });

            await new Promise((resolve) => {
              userClient.on('connect', resolve);
            });

            // Wait for online event
            const onlineEvent = await onlineEventPromise;

            // Cleanup
            userClient.close();
            observer.close();

            // Assert: Observer should have received the user_online event
            expect(onlineEvent).not.toBeNull();
            expect(onlineEvent.userId).toBe(testData.userId);
          }
        ),
        { numRuns: 50 } // Reduced runs for performance
      );
    }, 60000); // 60 second timeout
  });
});
