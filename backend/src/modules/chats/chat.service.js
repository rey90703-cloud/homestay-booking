const ChatRoom = require('./chat.model');
const Message = require('./message.model');
const { ApiError } = require('../../utils/apiError');

class ChatService {
  /**
   * Create a direct chat room between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID  
   * @param {string} initialMessage - Optional initial message
   * @returns {Promise<ChatRoom>}
   */
  async createDirectChatRoom(userId1, userId2, initialMessage = null) {
    // Check if chatroom already exists between these users
    const existingRoom = await ChatRoom.findOne({
      bookingId: null,
      $and: [
        { 'participants.userId': userId1 },
        { 'participants.userId': userId2 }
      ]
    }).populate('participants.userId', 'fullName email profile.firstName profile.lastName profile.avatar');

    if (existingRoom) {
      // Nếu có tin nhắn đầu tiên, gửi luôn
      if (initialMessage) {
        const message = await Message.create({
          chatroomId: existingRoom._id,
          senderId: userId1,
          content: initialMessage,
          type: 'text'
        });

        // Update last message
        existingRoom.lastMessage = {
          content: message.content,
          senderId: message.senderId,
          createdAt: message.createdAt
        };
        await existingRoom.save();
      }
      
      return existingRoom;
    }

    // Tạo chatroom mới
    const chatRoom = await ChatRoom.create({
      bookingId: null,
      participants: [
        { userId: userId1, role: 'guest' },
        { userId: userId2, role: 'host' },
      ],
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0,
      },
      metadata: {},
    });

    // Populate participants
    await chatRoom.populate('participants.userId', 'fullName email profile.firstName profile.lastName profile.avatar');

    // Nếu có tin nhắn đầu tiên, gửi luôn
    if (initialMessage) {
      const message = await Message.create({
        chatroomId: chatRoom._id,
        senderId: userId1,
        content: initialMessage,
        type: 'text'
      });

      // Update last message
      chatRoom.lastMessage = {
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt
      };
      await chatRoom.save();
    }

    return chatRoom;
  }

  /**
   * Create a new chat room from a booking
   * @param {string} bookingId - Booking ID
   * @param {string} guestId - Guest user ID
   * @param {string} hostId - Host user ID
   * @param {Object} metadata - Additional metadata (homestayId, homestayName, hostName)
   * @returns {Promise<ChatRoom>}
   */
  async createChatRoom(bookingId, guestId, hostId, metadata = {}) {
    // Check if chatroom already exists
    const existingRoom = await ChatRoom.findOne({ bookingId });
    if (existingRoom) {
      throw new ApiError(400, 'ChatRoom already exists for this booking');
    }

    const chatRoom = await ChatRoom.create({
      bookingId,
      participants: [
        { userId: guestId, role: 'guest' },
        { userId: hostId, role: 'host' },
      ],
      unreadCount: {
        [guestId]: 0,
        [hostId]: 0,
      },
      metadata,
    });

    return chatRoom;
  }

  /**
   * Get chat rooms by user ID with pagination
   * @param {string} userId - User ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   * @param {string} bookingId - Optional booking ID filter
   * @returns {Promise<Object>}
   */
  async getChatRoomsByUserId(userId, page = 1, limit = 20, bookingId = null) {
    const skip = (page - 1) * limit;

    const query = {
      'participants.userId': userId,
      status: 'active',
    };

    // Add bookingId filter if provided
    if (bookingId) {
      query.bookingId = bookingId;
    }

    const chatRooms = await ChatRoom.find(query)
      .sort({ 'lastMessage.createdAt': -1 })
      .skip(skip)
      .limit(limit)
      .populate('participants.userId', 'fullName email avatar profile.firstName profile.lastName')
      .lean();

    const total = await ChatRoom.countDocuments(query);

    return {
      chatRooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get chat room by ID with authorization check
   * @param {string} chatroomId - ChatRoom ID
   * @param {string} userId - User ID requesting access
   * @returns {Promise<ChatRoom>}
   */
  async getChatRoomById(chatroomId, userId) {
    const chatRoom = await ChatRoom.findById(chatroomId)
      .populate('participants.userId', 'fullName email avatar profile.firstName profile.lastName')
      .lean();

    if (!chatRoom) {
      throw new ApiError(404, 'ChatRoom not found');
    }

    const requesterId = userId.toString();
    // Check if user is a participant
    const isParticipant = chatRoom.participants.some(
      (p) => {
        // Support both populated and non-populated data, and legacy `user` field if any
        const participantId = p.userId?._id || p.userId || p.user?._id || p.user;
        return participantId?.toString() === requesterId;
      }
    );

    if (!isParticipant) {
      throw new ApiError(403, 'Access denied to this chatroom');
    }

    return chatRoom;
  }

  /**
   * Get messages by chat room with pagination
   * @param {string} chatroomId - ChatRoom ID
   * @param {string} userId - User ID requesting messages
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 50)
   * @returns {Promise<Object>}
   */
  async getMessagesByChatRoom(chatroomId, userId, page = 1, limit = 50) {
    // Verify user has access to this chatroom
    const chatRoom = await this.getChatRoomById(chatroomId, userId);

    const skip = (page - 1) * limit;
    const roomId = `booking:${chatRoom.bookingId}`;

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name email avatar')
      .lean();

    const total = await Message.countDocuments({ roomId });

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Send a message in a chat room
   * @param {string} chatroomId - ChatRoom ID
   * @param {string} senderId - Sender user ID
   * @param {string} content - Message content
   * @param {string} type - Message type (default: 'text')
   * @returns {Promise<Message>}
   */
  async sendMessage(chatroomId, senderId, content, type = 'text') {
    // Validate content
    if (!content || content.trim().length === 0) {
      throw new ApiError(400, 'Message content cannot be empty');
    }

    if (content.length > 2000) {
      throw new ApiError(400, 'Message too long (max 2000 characters)');
    }

    // Get chatroom and verify access
    const chatRoom = await ChatRoom.findById(chatroomId);
    if (!chatRoom) {
      throw new ApiError(404, 'ChatRoom not found');
    }

    const participant = chatRoom.participants.find(
      (p) => p.userId.toString() === senderId
    );

    if (!participant) {
      throw new ApiError(403, 'Access denied to this chatroom');
    }

    const roomId = `booking:${chatRoom.bookingId}`;

    // Create message
    const message = await Message.create({
      roomId,
      bookingId: chatRoom.bookingId,
      senderId,
      senderRole: participant.role,
      content: content.trim(),
      type,
    });

    // Update chatroom lastMessage
    chatRoom.lastMessage = {
      content: content.trim(),
      senderId,
      type,
      createdAt: message.createdAt,
    };

    // Increment unread count for other participants
    chatRoom.participants.forEach((p) => {
      if (p.userId.toString() !== senderId) {
        const currentCount = chatRoom.unreadCount.get(p.userId.toString()) || 0;
        chatRoom.unreadCount.set(p.userId.toString(), currentCount + 1);
      }
    });

    await chatRoom.save();

    return message;
  }

  /**
   * Mark messages as read in a chat room
   * @param {string} chatroomId - ChatRoom ID
   * @param {string} userId - User ID marking as read
   * @returns {Promise<ChatRoom>}
   */
  async markAsRead(chatroomId, userId) {
    const chatRoom = await ChatRoom.findById(chatroomId);
    if (!chatRoom) {
      throw new ApiError(404, 'ChatRoom not found');
    }

    // Verify user is a participant
    const participant = chatRoom.participants.find(
      (p) => p.userId.toString() === userId
    );

    if (!participant) {
      throw new ApiError(403, 'Access denied to this chatroom');
    }

    // Reset unread count
    chatRoom.unreadCount.set(userId, 0);

    // Update lastSeenAt
    participant.lastSeenAt = new Date();

    await chatRoom.save();

    return chatRoom;
  }

  /**
   * Update last seen timestamp for a user in a chat room
   * @param {string} chatroomId - ChatRoom ID
   * @param {string} userId - User ID
   * @returns {Promise<ChatRoom>}
   */
  async updateLastSeen(chatroomId, userId) {
    const chatRoom = await ChatRoom.findById(chatroomId);
    if (!chatRoom) {
      throw new ApiError(404, 'ChatRoom not found');
    }

    const participant = chatRoom.participants.find(
      (p) => p.userId.toString() === userId
    );

    if (participant) {
      participant.lastSeenAt = new Date();
      await chatRoom.save();
    }

    return chatRoom;
  }

  /**
   * Search chat rooms by query
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async searchChatRooms(userId, query) {
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const chatRooms = await ChatRoom.find({
      'participants.userId': userId,
      status: 'active',
      $or: [
        { 'metadata.homestayName': { $regex: escapedQuery, $options: 'i' } },
        { 'metadata.hostName': { $regex: escapedQuery, $options: 'i' } },
      ],
    })
      .sort({ 'lastMessage.createdAt': -1 })
      .populate('participants.userId', 'fullName email avatar profile.firstName profile.lastName')
      .lean();

    return chatRooms;
  }
}

module.exports = new ChatService();
