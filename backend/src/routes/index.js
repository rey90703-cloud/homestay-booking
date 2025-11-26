const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const homestayRoutes = require('../modules/homestays/homestay.routes');
const amenityRoutes = require('../modules/homestays/amenity.routes');
const bookingRoutes = require('../modules/bookings/booking.routes');
const contactRoutes = require('../modules/contacts/contact.routes');
const paymentRoutes = require('./payment.routes');
const configRoutes = require('../modules/config/config.routes');
const reviewRoutes = require('../modules/reviews/review.routes');
const chatRoutes = require('../modules/chats/chat.routes');
const paymentPoller = require('../services/payment-poller.service');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * API Version 1 Routes
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/homestays', homestayRoutes);
router.use('/amenities', amenityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/contacts', contactRoutes);
router.use('/payments', paymentRoutes);
router.use('/config', configRoutes);
router.use('/chat', chatRoutes);
router.use('/', reviewRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const pollerStatus = paymentPoller.getStatus();

  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStateMap[dbState] || 'unknown',
        connected: dbState === 1
      },
      paymentPoller: {
        isRunning: pollerStatus.isRunning,
        isPolling: pollerStatus.isPolling,
        lastPollTime: pollerStatus.lastPollTime,
        pollCount: pollerStatus.pollCount,
        stats: pollerStatus.stats
      }
    }
  });
});

module.exports = router;
