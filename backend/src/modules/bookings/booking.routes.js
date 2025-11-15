const express = require('express');
const bookingController = require('./booking.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { ROLES } = require('../../config/constants');
const {
  validateObjectId,
  validateCreateBooking,
  validateCancelBooking,
  validateUpdatePaymentStatus,
} = require('../../middlewares/validation.middleware');
const {
  qrCodeRateLimiter,
  bookingCreationRateLimiter,
} = require('../../middlewares/rateLimit.middleware');
const {
  checkBookingAccess,
  checkBookingModifyPermission,
} = require('../../middlewares/ownership.middleware');

const router = express.Router();

// Protected routes - require authentication
router.use(authenticate);

// Get current user's bookings - must be before /:id route
router.get(
  '/my-bookings',
  bookingController.getMyBookings,
);

// Admin only routes - place specific routes before dynamic routes
router.get(
  '/statistics/payments',
  authorize(ROLES.ADMIN),
  bookingController.getPaymentStatistics,
);

router.get(
  '/',
  authorize(ROLES.ADMIN),
  bookingController.getAllBookings,
);

// Create booking (any authenticated user) with rate limiting and validation
router.post(
  '/',
  bookingCreationRateLimiter,
  validateCreateBooking,
  bookingController.createBooking,
);

// Get booking by ID - requires access permission
router.get(
  '/:id',
  validateObjectId('id'),
  checkBookingAccess,
  bookingController.getBookingById,
);

// Cancel booking - requires modify permission
router.post(
  '/:id/cancel',
  validateObjectId('id'),
  validateCancelBooking,
  checkBookingModifyPermission,
  bookingController.cancelBooking,
);

// Generate payment QR code - requires access permission and rate limiting
router.post(
  '/:id/payment/qrcode',
  validateObjectId('id'),
  qrCodeRateLimiter,
  checkBookingAccess,
  bookingController.generatePaymentQRCode,
);

// Get payment status - requires access permission
router.get(
  '/:id/payment/status',
  validateObjectId('id'),
  checkBookingAccess,
  bookingController.getPaymentStatus,
);

// Download invoice PDF - requires access permission
router.get(
  '/:id/invoice',
  validateObjectId('id'),
  checkBookingAccess,
  bookingController.downloadInvoice,
);

// Verify payment manually (Admin only)
router.post(
  '/:id/payment/verify',
  validateObjectId('id'),
  authorize(ROLES.ADMIN),
  bookingController.verifyPaymentManually,
);

// Update payment status (Admin only)
router.patch(
  '/:id/payment',
  validateObjectId('id'),
  validateUpdatePaymentStatus,
  authorize(ROLES.ADMIN),
  bookingController.updatePaymentStatus,
);

// Process host payout (Admin only)
router.post(
  '/:id/payout',
  validateObjectId('id'),
  authorize(ROLES.ADMIN),
  bookingController.processHostPayout,
);

module.exports = router;
