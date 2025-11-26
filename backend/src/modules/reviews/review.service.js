const Review = require('./review.model');
const Booking = require('../bookings/booking.model');
const Homestay = require('../homestays/homestay.model');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../utils/apiError');
const { BOOKING_STATUS, PAGINATION } = require('../../config/constants');

class ReviewService {
  /**
   * Create a new review
   */
  async createReview(guestId, homestayId, reviewData) {
    const { bookingId, rating, categories, title, comment, images } = reviewData;

    // Verify booking exists and belongs to guest
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.guestId.toString() !== guestId.toString()) {
      throw new ForbiddenError('You can only review your own bookings');
    }

    if (booking.homestayId.toString() !== homestayId.toString()) {
      throw new BadRequestError('Booking does not match homestay');
    }

    // Check if booking is paid or completed
    const validStatuses = [BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.CHECKED_OUT, BOOKING_STATUS.COMPLETED];
    if (!validStatuses.includes(booking.status)) {
      throw new BadRequestError('Bạn chỉ có thể đánh giá booking đã thanh toán');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      throw new BadRequestError('You have already reviewed this booking');
    }

    // Get homestay to get hostId
    const homestay = await Homestay.findById(homestayId);
    if (!homestay) {
      throw new NotFoundError('Homestay not found');
    }

    // Create review
    const review = await Review.create({
      homestayId,
      bookingId,
      guestId,
      hostId: homestay.hostId,
      rating,
      categories,
      title,
      comment,
      images,
    });

    // Update homestay stats
    await this.updateHomestayStats(homestayId);

    return review.populate(['guestId', 'homestayId']);
  }

  /**
   * Get reviews for a homestay
   */
  async getHomestayReviews(homestayId, filters = {}, pagination = {}) {
    const { sort = 'newest', rating } = filters;
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = pagination;

    const query = {
      homestayId,
      status: 'published',
    };

    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    let sortOption = { createdAt: -1 }; // newest
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'lowest') {
      sortOption = { rating: 1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortOption = { helpfulCount: -1, createdAt: -1 };
    }

    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);
    const skip = (page - 1) * limit;

    const reviews = await Review.find(query)
      .populate('guestId', 'profile email')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    return {
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalReviews,
        limit: Number(limit),
      },
    };
  }

  /**
   * Get review statistics for a homestay
   */
  async getReviewStats(homestayId) {
    const reviews = await Review.find({
      homestayId,
      status: 'published',
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        categoryAverages: {},
      };
    }

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

    // Calculate category averages
    const categoryTotals = {};
    const categoryCounts = {};
    
    reviews.forEach(review => {
      if (review.categories) {
        Object.entries(review.categories).forEach(([category, rating]) => {
          if (rating) {
            categoryTotals[category] = (categoryTotals[category] || 0) + rating;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          }
        });
      }
    });

    const categoryAverages = {};
    Object.keys(categoryTotals).forEach(category => {
      categoryAverages[category] = Math.round((categoryTotals[category] / categoryCounts[category]) * 10) / 10;
    });

    return {
      totalReviews: reviews.length,
      averageRating,
      ratingDistribution,
      categoryAverages,
    };
  }

  /**
   * Update review
   */
  async updateReview(reviewId, guestId, updateData) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.guestId.toString() !== guestId.toString()) {
      throw new ForbiddenError('You can only update your own reviews');
    }

    // Only allow updating within 7 days
    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      throw new BadRequestError('Reviews can only be edited within 7 days of creation');
    }

    // Update allowed fields
    const allowedFields = ['rating', 'categories', 'title', 'comment', 'images'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        review[field] = updateData[field];
      }
    });

    await review.save();

    // Update homestay stats
    await this.updateHomestayStats(review.homestayId);

    return review.populate(['guestId', 'homestayId']);
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId, userId, userRole) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Only guest or admin can delete
    if (userRole !== 'admin' && review.guestId.toString() !== userId.toString()) {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    const homestayId = review.homestayId;
    await review.deleteOne();

    // Update homestay stats
    await this.updateHomestayStats(homestayId);

    return { message: 'Review deleted successfully' };
  }

  /**
   * Add host reply to review
   */
  async addHostReply(reviewId, hostId, replyComment) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.hostId.toString() !== hostId.toString()) {
      throw new ForbiddenError('You can only reply to reviews of your own homestays');
    }

    if (review.hostReply && review.hostReply.comment) {
      throw new BadRequestError('You have already replied to this review');
    }

    review.hostReply = {
      comment: replyComment,
      repliedAt: new Date(),
    };

    await review.save();

    return review.populate(['guestId', 'homestayId']);
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId, userId) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if user already marked as helpful
    const alreadyMarked = review.helpfulBy.some(id => id.toString() === userId.toString());

    if (alreadyMarked) {
      // Remove helpful mark
      review.helpfulBy = review.helpfulBy.filter(id => id.toString() !== userId.toString());
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add helpful mark
      review.helpfulBy.push(userId);
      review.helpfulCount += 1;
    }

    await review.save();

    return {
      helpfulCount: review.helpfulCount,
      isMarkedHelpful: !alreadyMarked,
    };
  }

  /**
   * Report review
   */
  async reportReview(reviewId, userId, reason) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if user already reported
    const alreadyReported = review.reports.some(
      report => report.userId.toString() === userId.toString()
    );

    if (alreadyReported) {
      throw new BadRequestError('You have already reported this review');
    }

    review.reports.push({
      userId,
      reason,
      reportedAt: new Date(),
    });

    // Auto-hide if reported by 3+ users
    if (review.reports.length >= 3) {
      review.status = 'reported';
    }

    await review.save();

    return { message: 'Review reported successfully' };
  }

  /**
   * Update homestay review statistics
   */
  async updateHomestayStats(homestayId) {
    const stats = await this.getReviewStats(homestayId);

    await Homestay.findByIdAndUpdate(homestayId, {
      'stats.totalReviews': stats.totalReviews,
      'stats.averageRating': stats.averageRating,
    });
  }

  /**
   * Check if user can review a homestay
   */
  async canUserReview(guestId, homestayId) {
    // Find bookings that are paid or completed for this guest and homestay
    const eligibleBookings = await Booking.find({
      guestId,
      homestayId,
      status: { $in: [BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.CHECKED_OUT, BOOKING_STATUS.COMPLETED] },
    });

    if (eligibleBookings.length === 0) {
      return {
        canReview: false,
        reason: 'Bạn cần có booking đã thanh toán để đánh giá',
      };
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ guestId, homestayId });
    if (existingReview) {
      return {
        canReview: false,
        reason: 'Bạn đã đánh giá homestay này rồi',
        reviewId: existingReview._id,
      };
    }

    return {
      canReview: true,
      bookingId: eligibleBookings[0]._id,
    };
  }
}

module.exports = new ReviewService();
