const reviewService = require('./review.service');
const ApiResponse = require('../../utils/apiResponse');
const catchAsync = require('../../utils/catchAsync');

class ReviewController {
  /**
   * Create review
   * POST /api/v1/homestays/:homestayId/reviews
   */
  createReview = catchAsync(async (req, res) => {
    const { homestayId } = req.params;
    const review = await reviewService.createReview(req.user._id, homestayId, req.body);
    ApiResponse.created(res, { review }, 'Review created successfully');
  });

  /**
   * Get homestay reviews
   * GET /api/v1/homestays/:homestayId/reviews
   */
  getHomestayReviews = catchAsync(async (req, res) => {
    const { homestayId } = req.params;
    const { sort, rating, page, limit } = req.query;

    const result = await reviewService.getHomestayReviews(
      homestayId,
      { sort, rating },
      { page, limit }
    );

    ApiResponse.success(
      res,
      result.reviews,
      'Reviews retrieved successfully',
      200,
      { pagination: result.pagination }
    );
  });

  /**
   * Get review statistics
   * GET /api/v1/homestays/:homestayId/reviews/stats
   */
  getReviewStats = catchAsync(async (req, res) => {
    const { homestayId } = req.params;
    const stats = await reviewService.getReviewStats(homestayId);
    ApiResponse.success(res, stats, 'Review statistics retrieved successfully');
  });

  /**
   * Update review
   * PUT /api/v1/reviews/:id
   */
  updateReview = catchAsync(async (req, res) => {
    const { id } = req.params;
    const review = await reviewService.updateReview(id, req.user._id, req.body);
    ApiResponse.success(res, { review }, 'Review updated successfully');
  });

  /**
   * Delete review
   * DELETE /api/v1/reviews/:id
   */
  deleteReview = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await reviewService.deleteReview(id, req.user._id, req.user.role);
    ApiResponse.success(res, result, 'Review deleted successfully');
  });

  /**
   * Add host reply
   * POST /api/v1/reviews/:id/reply
   */
  addHostReply = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const review = await reviewService.addHostReply(id, req.user._id, comment);
    ApiResponse.success(res, { review }, 'Reply added successfully');
  });

  /**
   * Mark review as helpful
   * POST /api/v1/reviews/:id/helpful
   */
  markReviewHelpful = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await reviewService.markReviewHelpful(id, req.user._id);
    ApiResponse.success(res, result, 'Review marked as helpful');
  });

  /**
   * Report review
   * POST /api/v1/reviews/:id/report
   */
  reportReview = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await reviewService.reportReview(id, req.user._id, reason);
    ApiResponse.success(res, result, 'Review reported successfully');
  });

  /**
   * Check if user can review
   * GET /api/v1/homestays/:homestayId/can-review
   */
  canUserReview = catchAsync(async (req, res) => {
    const { homestayId } = req.params;
    const result = await reviewService.canUserReview(req.user._id, homestayId);
    ApiResponse.success(res, result, 'Review eligibility checked');
  });
}

module.exports = new ReviewController();
