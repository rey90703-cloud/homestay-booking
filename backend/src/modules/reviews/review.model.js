const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    homestayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homestay',
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Overall rating
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Category ratings
    categories: {
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
      },
      accuracy: {
        type: Number,
        min: 1,
        max: 5,
      },
      checkIn: {
        type: Number,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      location: {
        type: Number,
        min: 1,
        max: 5,
      },
      value: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    // Review content
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },

    // Images
    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    // Host reply
    hostReply: {
      comment: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      repliedAt: Date,
    },

    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Status
    status: {
      type: String,
      enum: ['pending', 'published', 'hidden', 'reported'],
      default: 'published',
    },

    // Report
    reports: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: String,
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
reviewSchema.index({ homestayId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ guestId: 1, homestayId: 1 }, { unique: true }); // One review per guest per homestay
reviewSchema.index({ bookingId: 1 }); // Regular index for performance (not unique to allow multiple reviews without booking)
reviewSchema.index({ rating: 1 });

// Virtual for average category rating
reviewSchema.virtual('averageCategoryRating').get(function () {
  if (!this.categories) return this.rating;
  
  const ratings = Object.values(this.categories).filter(r => r);
  if (ratings.length === 0) return this.rating;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
