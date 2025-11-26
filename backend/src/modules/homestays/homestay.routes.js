const express = require('express');
const homestayController = require('./homestay.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { authorize, ROLES } = require('../../middlewares/rbac.middleware');
const { validate, validateQuery, validateParams } = require('../../middlewares/validation.middleware');
const { uploadMultiple, uploadHomestayImages, handleMulterError } = require('../../middlewares/upload.middleware');
const {
  createHomestaySchema,
  updateHomestaySchema,
  searchHomestaySchema,
  homestayIdSchema,
  deleteImageSchema,
  updateVerificationSchema,
} = require('./homestay.validation');

const router = express.Router();

/**
 * Host Routes (require authentication + host role)
 * Note: These must come before /:id routes to avoid conflicts
 */

// Get host's own homestays
router.get(
  '/my-listings',
  authenticate,
  authorize(ROLES.HOST, ROLES.ADMIN),
  homestayController.getMyListings,
);

/**
 * Public Routes
 */

// Search and list homestays
router.get(
  '/',
  validateQuery(searchHomestaySchema),
  homestayController.searchHomestays,
);

// Get homestay by ID (public, but shows more info if authenticated)
router.get(
  '/:id',
  optionalAuthenticate,
  validateParams(homestayIdSchema),
  homestayController.getHomestayById,
);

// Create homestay
router.post(
  '/',
  authenticate,
  authorize(ROLES.HOST, ROLES.ADMIN),
  uploadHomestayImages,
  handleMulterError,
  homestayController.createHomestay,
);

// Update homestay
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.HOST, ROLES.ADMIN),
  validateParams(homestayIdSchema),
  uploadHomestayImages,
  handleMulterError,
  homestayController.updateHomestay,
);

// Delete homestay
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.HOST, ROLES.ADMIN),
  validateParams(homestayIdSchema),
  homestayController.deleteHomestay,
);

// Upload images
router.post(
  '/:id/images',
  authenticate,
  authorize(ROLES.HOST, ROLES.ADMIN),
  validateParams(homestayIdSchema),
  uploadMultiple,
  handleMulterError,
  homestayController.uploadImages,
);

// Delete image
router.delete(
  '/:id/images/:imageIndex',
  authenticate,
  authorize(ROLES.HOST, ROLES.ADMIN),
  validateParams(deleteImageSchema),
  homestayController.deleteImage,
);

// Submit for verification
router.post(
  '/:id/submit',
  authenticate,
  authorize(ROLES.HOST, ROLES.ADMIN),
  validateParams(homestayIdSchema),
  homestayController.submitForVerification,
);

/**
 * Admin Routes
 */

// Get pending homestays
router.get(
  '/admin/pending',
  authenticate,
  authorize(ROLES.ADMIN),
  homestayController.getPendingHomestays,
);

// Approve homestay
router.patch(
  '/admin/:id/approve',
  authenticate,
  authorize(ROLES.ADMIN),
  validateParams(homestayIdSchema),
  homestayController.approveHomestay,
);

// Reject homestay
router.patch(
  '/admin/:id/reject',
  authenticate,
  authorize(ROLES.ADMIN),
  validateParams(homestayIdSchema),
  validate(updateVerificationSchema),
  homestayController.rejectHomestay,
);

module.exports = router;
