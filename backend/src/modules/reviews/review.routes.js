const express = require('express');
const reviewController = require('./review.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { ROLES } = require('../../config/constants');
const { validateObjectId } = require('../../middlewares/validation.middleware');

const router = express.Router();

// Public routes
// Get homestay reviews
router.get(
  '/homestays/:homestayId/reviews',
  validateObjectId('homestayId'),
  reviewController.getHomestayReviews
);

// Get review statistics
router.get(
  '/homestays/:homestayId/reviews/stats',
  validateObjectId('homestayId'),
  reviewController.getReviewStats
);

// Protected routes - require authentication
router.use(authenticate);

// Create review
router.post(
  '/homestays/:homestayId/reviews',
  validateObjectId('homestayId'),
  reviewController.createReview
);

// Check if user can review
router.get(
  '/homestays/:homestayId/can-review',
  validateObjectId('homestayId'),
  reviewController.canUserReview
);

// Update review
router.put(
  '/reviews/:id',
  validateObjectId('id'),
  reviewController.updateReview
);

// Delete review
router.delete(
  '/reviews/:id',
  validateObjectId('id'),
  reviewController.deleteReview
);

// Add host reply
router.post(
  '/reviews/:id/reply',
  validateObjectId('id'),
  authorize(ROLES.HOST, ROLES.ADMIN),
  reviewController.addHostReply
);

// Mark review as helpful
router.post(
  '/reviews/:id/helpful',
  validateObjectId('id'),
  reviewController.markReviewHelpful
);

// Report review
router.post(
  '/reviews/:id/report',
  validateObjectId('id'),
  reviewController.reportReview
);

module.exports = router;
