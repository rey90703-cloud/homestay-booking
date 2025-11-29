const express = require('express');
const chatController = require('./chat.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Chat room routes
router.post('/rooms', chatController.createChatRoom);
router.get('/rooms', chatController.getChatRooms);
router.get('/rooms/:id', chatController.getChatRoomById);
router.get('/rooms/:id/messages', chatController.getMessages);
router.post('/rooms/:id/hide', chatController.hideChatRoom);

// Search route
router.get('/search', chatController.searchChatRooms);

module.exports = router;
