const express = require('express');
const bookingController = require('./booking.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');

const router = express.Router();

// Protected routes - require authentication
router.use(authenticate);

// Create booking (any authenticated user)
router.post('/', bookingController.createBooking);

// Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Cancel booking
router.post('/:id/cancel', bookingController.cancelBooking);

// Admin only routes
router.get('/', authorize(ROLES.ADMIN), bookingController.getAllBookings);

router.patch(
  '/:id/payment',
  authorize(ROLES.ADMIN),
  bookingController.updatePaymentStatus,
);

router.post(
  '/:id/payout',
  authorize(ROLES.ADMIN),
  bookingController.processHostPayout,
);

router.get(
  '/statistics/payments',
  authorize(ROLES.ADMIN),
  bookingController.getPaymentStatistics,
);

module.exports = router;
