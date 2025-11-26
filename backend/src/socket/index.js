const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { registerChatHandlers } = require('./handlers/chatHandlers');

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from handshake auth
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to socket
    socket.userId = decoded.userId || decoded.id;
    socket.userEmail = decoded.email;

    logger.info('Socket authenticated', {
      socketId: socket.id,
      userId: socket.userId,
    });

    next();
  } catch (error) {
    logger.error('Socket authentication failed', {
      socketId: socket.id,
      error: error.message,
    });
    next(new Error('Invalid authentication token'));
  }
};

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initializeSocketIO(httpServer) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL,
    process.env.CORS_ORIGIN,
  ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('Client connected', {
      socketId: socket.id,
      userId: socket.userId,
    });

    // Register chat event handlers
    registerChatHandlers(socket, io);

    // Emit user online status
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason,
      });

      // Emit user offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        lastSeenAt: new Date(),
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    });
  });

  logger.info('Socket.IO server initialized');

  return io;
}

module.exports = { initializeSocketIO };
