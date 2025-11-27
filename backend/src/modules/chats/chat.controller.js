const chatService = require('./chat.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/apiResponse');

/**
 * Create a new chat room from a booking or direct message
 * POST /api/v1/chat/rooms
 */
exports.createChatRoom = catchAsync(async (req, res) => {
  const { bookingId, guestId, hostId, metadata, participantId, message } = req.body;
  const currentUserId = req.user._id;

  console.log('Create chatroom request:', { bookingId, guestId, hostId, participantId, message, currentUserId });

  let chatRoom;

  // Nếu có participantId, tạo chat trực tiếp
  if (participantId) {
    console.log('Creating direct chat between:', currentUserId, 'and', participantId);
    chatRoom = await chatService.createDirectChatRoom(
      currentUserId,
      participantId,
      message
    );
    
    // Emit tin nhắn qua socket nếu có
    if (message && chatRoom.lastMessage) {
      const io = req.app.get('io');
      if (io) {
        // Emit tin nhắn mới đến tất cả participants
        io.to(chatRoom._id.toString()).emit('new_message', {
          message: {
            _id: chatRoom.lastMessage._id,
            chatroomId: chatRoom._id,
            senderId: currentUserId,
            content: message,
            type: 'text',
            createdAt: chatRoom.lastMessage.createdAt
          },
          chatRoom: chatRoom
        });
        
        console.log('Emitted new_message to room:', chatRoom._id.toString());
      }
    }
  } else {
    // Tạo chat từ booking
    console.log('Creating chat from booking:', bookingId);
    chatRoom = await chatService.createChatRoom(
      bookingId,
      guestId,
      hostId,
      metadata
    );
  }

  return ApiResponse.created(res, { chatRoom }, 'Chat room created successfully');
});

/**
 * Get all chat rooms for the authenticated user
 * GET /api/v1/chat/rooms?bookingId=xxx (optional)
 */
exports.getChatRooms = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { bookingId } = req.query;

  const result = await chatService.getChatRoomsByUserId(userId, page, limit, bookingId);

  return ApiResponse.success(res, result, 'Chat rooms retrieved successfully');
});

/**
 * Get a specific chat room by ID
 * GET /api/v1/chat/rooms/:id
 */
exports.getChatRoomById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const chatRoom = await chatService.getChatRoomById(id, userId);

  return ApiResponse.success(res, chatRoom, 'Chat room retrieved successfully');
});

/**
 * Get messages for a specific chat room
 * GET /api/v1/chat/rooms/:id/messages
 */
exports.getMessages = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const result = await chatService.getMessagesByChatRoom(id, userId, page, limit);

  return ApiResponse.success(res, result, 'Messages retrieved successfully');
});

/**
 * Search chat rooms
 * GET /api/v1/chat/search
 */
exports.searchChatRooms = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { q } = req.query;

  if (!q) {
    return ApiResponse.success(res, [], 'No search query provided');
  }

  const chatRooms = await chatService.searchChatRooms(userId, q);

  return ApiResponse.success(res, chatRooms, 'Search results retrieved successfully');
});
