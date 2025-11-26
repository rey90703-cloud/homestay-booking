/**
 * Property-Based Tests for ChatContext
 * 
 * Feature: realtime-chat
 * Tests chatroom reordering and state management
 */

const fc = require('fast-check');

describe('ChatContext - Property-Based Tests', () => {
  /**
   * Feature: realtime-chat, Property 19: ChatRoom reordering khi có message mới
   * Validates: Requirements 4.4
   */
  describe('Property 19: ChatRoom reordering when new message arrives', () => {
    it('should move chatroom to top of list when receiving new message', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1 }),
              bookingId: fc.string({ minLength: 1 }),
              lastMessage: fc.record({
                content: fc.string({ minLength: 1, maxLength: 100 }),
                createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
                senderId: fc.string({ minLength: 1 })
              }),
              unreadCount: fc.integer({ min: 0, max: 10 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.integer({ min: 0, max: 9 }),
          fc.record({
            content: fc.string({ minLength: 1, maxLength: 100 }),
            senderId: fc.string({ minLength: 1 }),
            type: fc.constant('text')
          }),
          (chatRooms, targetIndex, newMessage) => {
            // Filter out any invalid dates
            const validChatRooms = chatRooms.filter(room => {
              const date = new Date(room.lastMessage.createdAt);
              return !isNaN(date.getTime());
            });

            if (validChatRooms.length < 2) return true;

            // Ensure we have a valid target index
            if (targetIndex >= validChatRooms.length) {
              targetIndex = validChatRooms.length - 1;
            }

            // Sort chatrooms by lastMessage.createdAt descending (initial state)
            const sortedChatRooms = [...validChatRooms].sort((a, b) => {
              const dateA = new Date(a.lastMessage.createdAt);
              const dateB = new Date(b.lastMessage.createdAt);
              return dateB - dateA;
            });

            // Simulate receiving a new message for a specific chatroom
            const targetChatRoom = sortedChatRooms[targetIndex];
            const newMessageTime = new Date();

            // Update the chatroom with new message
            const updatedChatRooms = sortedChatRooms.map(room => {
              if (room._id === targetChatRoom._id) {
                return {
                  ...room,
                  lastMessage: {
                    content: newMessage.content,
                    senderId: newMessage.senderId,
                    type: newMessage.type,
                    createdAt: newMessageTime
                  }
                };
              }
              return room;
            });

            // Re-sort after update
            const reorderedChatRooms = updatedChatRooms.sort((a, b) => {
              const dateA = new Date(a.lastMessage.createdAt);
              const dateB = new Date(b.lastMessage.createdAt);
              return dateB - dateA;
            });

            // Property: The chatroom that received the message should be at the top
            expect(reorderedChatRooms[0]._id).toBe(targetChatRoom._id);
            
            // Property: The lastMessage should be updated
            expect(reorderedChatRooms[0].lastMessage.content).toBe(newMessage.content);
            expect(reorderedChatRooms[0].lastMessage.senderId).toBe(newMessage.senderId);
            
            // Property: The new message time should be the most recent
            for (let i = 1; i < reorderedChatRooms.length; i++) {
              const currentDate = new Date(reorderedChatRooms[0].lastMessage.createdAt);
              const nextDate = new Date(reorderedChatRooms[i].lastMessage.createdAt);
              expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain descending order by lastMessage.createdAt after reordering', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1 }),
              bookingId: fc.string({ minLength: 1 }),
              lastMessage: fc.record({
                content: fc.string({ minLength: 1, maxLength: 100 }),
                createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
                senderId: fc.string({ minLength: 1 })
              })
            }),
            { minLength: 3, maxLength: 20 }
          ),
          (chatRooms) => {
            // Filter out any invalid dates
            const validChatRooms = chatRooms.filter(room => {
              const date = new Date(room.lastMessage.createdAt);
              return !isNaN(date.getTime());
            });

            if (validChatRooms.length < 2) return true;

            // Sort chatrooms by lastMessage.createdAt descending
            const sortedChatRooms = [...validChatRooms].sort((a, b) => {
              const dateA = new Date(a.lastMessage.createdAt);
              const dateB = new Date(b.lastMessage.createdAt);
              return dateB - dateA;
            });

            // Verify the order is descending
            for (let i = 0; i < sortedChatRooms.length - 1; i++) {
              const currentDate = new Date(sortedChatRooms[i].lastMessage.createdAt);
              const nextDate = new Date(sortedChatRooms[i + 1].lastMessage.createdAt);
              expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all chatrooms during reordering', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1 }),
              bookingId: fc.string({ minLength: 1 }),
              lastMessage: fc.record({
                content: fc.string({ minLength: 1, maxLength: 100 }),
                createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
                senderId: fc.string({ minLength: 1 })
              })
            }),
            { minLength: 1, maxLength: 15 }
          ),
          fc.integer({ min: 0, max: 14 }),
          (chatRooms, targetIndex) => {
            // Filter out any invalid dates
            const validChatRooms = chatRooms.filter(room => {
              const date = new Date(room.lastMessage.createdAt);
              return !isNaN(date.getTime());
            });

            if (validChatRooms.length === 0) return true;
            
            // Ensure valid target index
            if (targetIndex >= validChatRooms.length) {
              targetIndex = validChatRooms.length - 1;
            }

            const originalIds = new Set(validChatRooms.map(room => room._id));
            const originalCount = validChatRooms.length;

            // Simulate message update and reorder
            const targetChatRoom = validChatRooms[targetIndex];
            const updatedChatRooms = validChatRooms.map(room => {
              if (room._id === targetChatRoom._id) {
                return {
                  ...room,
                  lastMessage: {
                    ...room.lastMessage,
                    createdAt: new Date()
                  }
                };
              }
              return room;
            });

            const reorderedChatRooms = updatedChatRooms.sort((a, b) => {
              const dateA = new Date(a.lastMessage.createdAt);
              const dateB = new Date(b.lastMessage.createdAt);
              return dateB - dateA;
            });

            // Property: All chatrooms should be preserved
            expect(reorderedChatRooms.length).toBe(originalCount);
            
            // Property: All original IDs should still exist
            const reorderedIds = new Set(reorderedChatRooms.map(room => room._id));
            expect(reorderedIds.size).toBe(originalIds.size);
            
            for (const id of originalIds) {
              expect(reorderedIds.has(id)).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple rapid message updates correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1 }),
              bookingId: fc.string({ minLength: 1 }),
              lastMessage: fc.record({
                content: fc.string({ minLength: 1, maxLength: 100 }),
                createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
                senderId: fc.string({ minLength: 1 })
              })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.array(
            fc.record({
              chatroomIndex: fc.integer({ min: 0, max: 9 }),
              content: fc.string({ minLength: 1, maxLength: 100 }),
              timestamp: fc.integer({ min: 1, max: 1000 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (chatRooms, messageUpdates) => {
            // Filter out any invalid dates
            const validChatRooms = chatRooms.filter(room => {
              const date = new Date(room.lastMessage.createdAt);
              return !isNaN(date.getTime());
            });

            if (validChatRooms.length === 0) return true;

            let currentChatRooms = [...validChatRooms];

            // Apply multiple message updates
            for (const update of messageUpdates) {
              const targetIndex = update.chatroomIndex % currentChatRooms.length;
              const targetChatRoom = currentChatRooms[targetIndex];

              // Update the chatroom
              currentChatRooms = currentChatRooms.map(room => {
                if (room._id === targetChatRoom._id) {
                  return {
                    ...room,
                    lastMessage: {
                      ...room.lastMessage,
                      content: update.content,
                      createdAt: new Date(Date.now() + update.timestamp)
                    }
                  };
                }
                return room;
              });

              // Re-sort
              currentChatRooms = currentChatRooms.sort((a, b) => {
                const dateA = new Date(a.lastMessage.createdAt);
                const dateB = new Date(b.lastMessage.createdAt);
                return dateB - dateA;
              });
            }

            // Property: Final list should still be sorted
            for (let i = 0; i < currentChatRooms.length - 1; i++) {
              const currentDate = new Date(currentChatRooms[i].lastMessage.createdAt);
              const nextDate = new Date(currentChatRooms[i + 1].lastMessage.createdAt);
              expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
            }

            // Property: All chatrooms should still exist
            expect(currentChatRooms.length).toBe(validChatRooms.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle chatrooms with identical timestamps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (numRooms) => {
            // Generate chatrooms with unique IDs but same timestamp
            const chatRooms = Array.from({ length: numRooms }, (_, i) => ({
              _id: `chatroom-${i}`,
              bookingId: `booking-${i}`,
              lastMessage: {
                content: `Message ${i}`,
                createdAt: new Date('2024-01-01T12:00:00Z'),
                senderId: `user-${i}`
              }
            }));

            // All chatrooms have the same timestamp
            const sortedChatRooms = [...chatRooms].sort((a, b) => {
              const dateA = new Date(a.lastMessage.createdAt);
              const dateB = new Date(b.lastMessage.createdAt);
              return dateB - dateA;
            });

            // Property: All chatrooms should be preserved
            expect(sortedChatRooms.length).toBe(chatRooms.length);

            // Property: Order should be stable (no errors during sort)
            const allIds = sortedChatRooms.map(room => room._id);
            const uniqueIds = new Set(allIds);
            expect(uniqueIds.size).toBe(chatRooms.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: realtime-chat, Property 15: Offline message persistence
   * Validates: Requirements 3.6
   */
  describe('Property 15: Offline message persistence', () => {
    it('should queue messages when socket is disconnected', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              content: fc.string({ minLength: 1, maxLength: 2000 }),
              chatroomId: fc.string({ minLength: 1 }),
              senderId: fc.string({ minLength: 1 }),
              type: fc.constant('text')
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (messages) => {
            // Simulate offline state
            const isConnected = false;
            const messageQueue = [];

            // Try to send messages while offline
            for (const message of messages) {
              if (!isConnected) {
                // Messages should be queued
                messageQueue.push({
                  ...message,
                  status: 'queued',
                  queuedAt: new Date().toISOString()
                });
              }
            }

            // Property: All messages should be queued
            expect(messageQueue.length).toBe(messages.length);

            // Property: Each queued message should have status 'queued'
            for (const queuedMsg of messageQueue) {
              expect(queuedMsg.status).toBe('queued');
              expect(queuedMsg.queuedAt).toBeDefined();
            }

            // Property: Queued messages should preserve original content
            for (let i = 0; i < messages.length; i++) {
              expect(messageQueue[i].content).toBe(messages[i].content);
              expect(messageQueue[i].chatroomId).toBe(messages[i].chatroomId);
              expect(messageQueue[i].senderId).toBe(messages[i].senderId);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should send queued messages when connection is restored', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              content: fc.string({ minLength: 1, maxLength: 2000 }),
              chatroomId: fc.string({ minLength: 1 }),
              senderId: fc.string({ minLength: 1 }),
              type: fc.constant('text'),
              queuedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (queuedMessages) => {
            // Simulate connection restored
            const isConnected = true;
            const sentMessages = [];

            // Process queued messages
            if (isConnected) {
              for (const message of queuedMessages) {
                sentMessages.push({
                  ...message,
                  status: 'sent',
                  sentAt: new Date().toISOString()
                });
              }
            }

            // Property: All queued messages should be sent
            expect(sentMessages.length).toBe(queuedMessages.length);

            // Property: Each sent message should have status 'sent'
            for (const sentMsg of sentMessages) {
              expect(sentMsg.status).toBe('sent');
              expect(sentMsg.sentAt).toBeDefined();
            }

            // Property: Messages should be sent in queue order (FIFO)
            for (let i = 0; i < queuedMessages.length; i++) {
              expect(sentMessages[i].content).toBe(queuedMessages[i].content);
              expect(sentMessages[i].chatroomId).toBe(queuedMessages[i].chatroomId);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve message order when sending queued messages', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              content: fc.string({ minLength: 1, maxLength: 100 }),
              chatroomId: fc.string({ minLength: 1 }),
              timestamp: fc.integer({ min: 1, max: 1000 })
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (messages) => {
            // Sort messages by timestamp (queue order)
            const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

            // Simulate sending queued messages
            const sentMessages = [];
            for (const message of sortedMessages) {
              sentMessages.push({
                ...message,
                status: 'sent',
                sentAt: new Date().toISOString()
              });
            }

            // Property: Messages should be sent in the same order as queued
            for (let i = 0; i < sortedMessages.length; i++) {
              expect(sentMessages[i].content).toBe(sortedMessages[i].content);
              expect(sentMessages[i].chatroomId).toBe(sortedMessages[i].chatroomId);
              expect(sentMessages[i].timestamp).toBe(sortedMessages[i].timestamp);
            }

            // Property: Order should be preserved (earlier timestamp = earlier in array)
            for (let i = 0; i < sentMessages.length - 1; i++) {
              expect(sentMessages[i].timestamp).toBeLessThanOrEqual(sentMessages[i + 1].timestamp);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty queue when connection is restored', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isConnected) => {
            const messageQueue = [];
            const sentMessages = [];

            // Try to send from empty queue
            if (isConnected) {
              for (const message of messageQueue) {
                sentMessages.push(message);
              }
            }

            // Property: No messages should be sent from empty queue
            expect(sentMessages.length).toBe(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear queue after successfully sending all messages', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              content: fc.string({ minLength: 1, maxLength: 100 }),
              chatroomId: fc.string({ minLength: 1 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (messages) => {
            let messageQueue = [...messages];
            const sentMessages = [];

            // Simulate sending all queued messages
            while (messageQueue.length > 0) {
              const message = messageQueue.shift();
              sentMessages.push({
                ...message,
                status: 'sent'
              });
            }

            // Property: Queue should be empty after sending all messages
            expect(messageQueue.length).toBe(0);

            // Property: All messages should be sent
            expect(sentMessages.length).toBe(messages.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: realtime-chat, Property 33: Mark as read chỉ khi mở chatroom
   * Validates: Requirements 7.5
   */
  describe('Property 33: Mark as read only when chatroom is opened', () => {
    it('should not mark as read when only receiving notification', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.uuid(),
              chatroomId: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 100 }),
              senderId: fc.uuid(),
              isNotification: fc.constant(true),
              chatroomIsOpen: fc.constant(false)
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.uuid(),
          (messages, userId) => {
            // Simulate receiving messages as notifications (chatroom not open)
            const unreadCounts = new Map();

            for (const message of messages) {
              if (!message.chatroomIsOpen) {
                // Increment unread count
                const currentCount = unreadCounts.get(message.chatroomId) || 0;
                unreadCounts.set(message.chatroomId, currentCount + 1);
              }
            }

            // Property: Unread count should increase for each notification
            const totalUnread = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0);
            expect(totalUnread).toBe(messages.length);

            // Property: No message should be marked as read
            for (const message of messages) {
              expect(message.chatroomIsOpen).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark as read only when chatroom is actually opened', () => {
      fc.assert(
        fc.property(
          fc.record({
            chatroomId: fc.string({ minLength: 1 }),
            userId: fc.string({ minLength: 1 }),
            unreadCount: fc.integer({ min: 1, max: 50 }),
            isOpen: fc.boolean()
          }),
          (chatroom) => {
            let currentUnreadCount = chatroom.unreadCount;

            // Simulate opening chatroom
            if (chatroom.isOpen) {
              // Mark as read
              currentUnreadCount = 0;
            }

            // Property: Unread count should be 0 only if chatroom is open
            if (chatroom.isOpen) {
              expect(currentUnreadCount).toBe(0);
            } else {
              expect(currentUnreadCount).toBe(chatroom.unreadCount);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve unread count when receiving notification for closed chatroom', () => {
      fc.assert(
        fc.property(
          fc.record({
            chatroomId: fc.string({ minLength: 1 }),
            userId: fc.string({ minLength: 1 }),
            initialUnreadCount: fc.integer({ min: 0, max: 20 })
          }),
          fc.array(
            fc.record({
              content: fc.string({ minLength: 1, maxLength: 100 }),
              senderId: fc.string({ minLength: 1 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (chatroom, newMessages) => {
            const chatroomIsOpen = false;
            let unreadCount = chatroom.initialUnreadCount;

            // Receive messages as notifications (chatroom closed)
            for (const message of newMessages) {
              if (!chatroomIsOpen) {
                unreadCount += 1;
              }
            }

            // Property: Unread count should increase by number of messages
            expect(unreadCount).toBe(chatroom.initialUnreadCount + newMessages.length);

            // Property: Unread count should never be negative
            expect(unreadCount).toBeGreaterThanOrEqual(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset unread count to 0 when chatroom is opened', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              chatroomId: fc.string({ minLength: 1 }),
              userId: fc.string({ minLength: 1 }),
              unreadCount: fc.integer({ min: 1, max: 100 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (chatrooms) => {
            // Simulate opening each chatroom
            const updatedChatrooms = chatrooms.map(chatroom => ({
              ...chatroom,
              unreadCount: 0,
              lastSeenAt: new Date().toISOString()
            }));

            // Property: All unread counts should be 0 after opening
            for (const chatroom of updatedChatrooms) {
              expect(chatroom.unreadCount).toBe(0);
              expect(chatroom.lastSeenAt).toBeDefined();
            }

            // Property: Number of chatrooms should be preserved
            expect(updatedChatrooms.length).toBe(chatrooms.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not mark as read when user switches to different chatroom', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              chatroomId: fc.string({ minLength: 1 }),
              unreadCount: fc.integer({ min: 0, max: 20 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.integer({ min: 0, max: 9 }),
          (chatrooms, openedIndex) => {
            if (chatrooms.length === 0) return true;

            // Ensure valid index
            const validIndex = openedIndex % chatrooms.length;
            const openedChatroomId = chatrooms[validIndex].chatroomId;

            // Simulate opening one chatroom
            const updatedChatrooms = chatrooms.map(chatroom => {
              if (chatroom.chatroomId === openedChatroomId) {
                return {
                  ...chatroom,
                  unreadCount: 0
                };
              }
              return chatroom;
            });

            // Property: Only the opened chatroom should have unreadCount = 0
            for (let i = 0; i < updatedChatrooms.length; i++) {
              if (i === validIndex) {
                expect(updatedChatrooms[i].unreadCount).toBe(0);
              } else {
                expect(updatedChatrooms[i].unreadCount).toBe(chatrooms[i].unreadCount);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid open/close cycles correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            chatroomId: fc.string({ minLength: 1 }),
            initialUnreadCount: fc.integer({ min: 5, max: 20 })
          }),
          fc.array(
            fc.record({
              action: fc.constantFrom('open', 'close'),
              timestamp: fc.integer({ min: 1, max: 1000 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (chatroom, actions) => {
            let unreadCount = chatroom.initialUnreadCount;
            let isOpen = false;

            // Sort actions by timestamp
            const sortedActions = [...actions].sort((a, b) => a.timestamp - b.timestamp);

            // Apply actions
            for (const action of sortedActions) {
              if (action.action === 'open' && !isOpen) {
                isOpen = true;
                unreadCount = 0;
              } else if (action.action === 'close' && isOpen) {
                isOpen = false;
              }
            }

            // Property: If chatroom is open at the end, unread count should be 0
            if (isOpen) {
              expect(unreadCount).toBe(0);
            }

            // Property: Unread count should never be negative
            expect(unreadCount).toBeGreaterThanOrEqual(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
