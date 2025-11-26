const chatService = require('../../modules/chats/chat.service');
const logger = require('../../utils/logger');

/**
 * Register chat-related socket event handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
function registerChatHandlers(socket, io) {
  /**
   * Join a chat room
   */
  socket.on('join_room', async (chatroomId) => {
    try {
      // Verify user has access to this chatroom
      await chatService.getChatRoomById(chatroomId, socket.userId);

      // Join the socket room
      socket.join(`chatroom:${chatroomId}`);

      logger.info('User joined chatroom', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
      });

      // Emit success event
      socket.emit('joined_room', { chatroomId });
    } catch (error) {
      logger.error('Error joining chatroom', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
        error: error.message,
      });

      socket.emit('error', {
        event: 'join_room',
        message: error.message,
      });
    }
  });

  /**
   * Leave a chat room
   */
  socket.on('leave_room', (chatroomId) => {
    try {
      socket.leave(`chatroom:${chatroomId}`);

      logger.info('User left chatroom', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
      });

      socket.emit('left_room', { chatroomId });
    } catch (error) {
      logger.error('Error leaving chatroom', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
        error: error.message,
      });
    }
  });

  /**
   * Send a message
   */
  socket.on('send_message', async (data) => {
    try {
      const { chatroomId, content, type = 'text' } = data;

      // Send message through service
      const message = await chatService.sendMessage(
        chatroomId,
        socket.userId,
        content,
        type
      );

      // Broadcast to all participants in the room
      io.to(`chatroom:${chatroomId}`).emit('new_message', {
        chatroomId,
        message: {
          _id: message._id,
          content: message.content,
          senderId: message.senderId,
          senderRole: message.senderRole,
          type: message.type,
          createdAt: message.createdAt,
        },
      });

      logger.info('Message sent', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
        messageId: message._id,
      });
    } catch (error) {
      logger.error('Error sending message', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });

      socket.emit('error', {
        event: 'send_message',
        message: error.message,
      });
    }
  });

  /**
   * Typing indicator - start
   */
  socket.on('typing_start', (chatroomId) => {
    try {
      // Broadcast to other participants in the room
      socket.to(`chatroom:${chatroomId}`).emit('user_typing', {
        chatroomId,
        userId: socket.userId,
      });

      logger.debug('User started typing', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
      });
    } catch (error) {
      logger.error('Error in typing_start', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    }
  });

  /**
   * Typing indicator - stop
   */
  socket.on('typing_stop', (chatroomId) => {
    try {
      // Broadcast to other participants in the room
      socket.to(`chatroom:${chatroomId}`).emit('user_stop_typing', {
        chatroomId,
        userId: socket.userId,
      });

      logger.debug('User stopped typing', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
      });
    } catch (error) {
      logger.error('Error in typing_stop', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    }
  });

  /**
   * Mark messages as read
   */
  socket.on('mark_as_read', async (chatroomId) => {
    try {
      // Mark as read in database
      await chatService.markAsRead(chatroomId, socket.userId);

      // Broadcast to other participants
      socket.to(`chatroom:${chatroomId}`).emit('message_read', {
        chatroomId,
        userId: socket.userId,
        readAt: new Date(),
      });

      logger.info('Messages marked as read', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
      });

      // Confirm to sender
      socket.emit('marked_as_read', { chatroomId });
    } catch (error) {
      logger.error('Error marking as read', {
        socketId: socket.id,
        userId: socket.userId,
        chatroomId,
        error: error.message,
      });

      socket.emit('error', {
        event: 'mark_as_read',
        message: error.message,
      });
    }
  });
}

module.exports = { registerChatHandlers };
