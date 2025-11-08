const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../config/constants');

const bookingSchema = new mongoose.Schema(
  {
    homestayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homestay',
      required: true,
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Booking dates
    checkInDate: {
      type: Date,
      required: true,
      index: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
      index: true,
    },
    numberOfNights: {
      type: Number,
      required: true,
    },

    // Guest details
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    guestDetails: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
    },

    // Pricing breakdown
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      numberOfNights: Number,
      cleaningFee: {
        type: Number,
        default: 0,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'VND',
      },
      // Platform commission: 10% for admin, 90% for host
      hostAmount: {
        type: Number,
        required: true,
      },
      platformCommission: {
        type: Number,
        required: true,
      },
      commissionRate: {
        type: Number,
        default: 0.1, // 10%
      },
    },

    // Booking status
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },

    // Payment information
    payment: {
      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
        index: true,
      },
      method: {
        type: String,
        enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'],
      },
      transactionId: String,
      paidAt: Date,
      refundAmount: Number,
      refundedAt: Date,
    },

    // Host payout
    hostPayout: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
      },
      amount: Number,
      paidAt: Date,
      transactionId: String,
    },

    // Cancellation
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      cancelledAt: Date,
      reason: String,
      refundAmount: Number,
    },

    // Special requests
    specialRequests: String,

    // Communication
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        message: String,
        timestamp: {
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
  },
);

// Indexes
bookingSchema.index({ homestayId: 1, status: 1 });
bookingSchema.index({ hostId: 1, status: 1 });
bookingSchema.index({ guestId: 1, status: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ createdAt: -1 });

// Calculate number of nights before saving
bookingSchema.pre('save', function (next) {
  if (this.checkInDate && this.checkOutDate) {
    const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
    this.numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate platform commission (10%) and host amount (90%)
  if (this.pricing.totalAmount) {
    this.pricing.platformCommission = this.pricing.totalAmount * this.pricing.commissionRate;
    this.pricing.hostAmount = this.pricing.totalAmount - this.pricing.platformCommission;
  }

  next();
});

// Virtual for booking duration
bookingSchema.virtual('duration').get(function () {
  if (this.checkInDate && this.checkOutDate) {
    const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const checkIn = new Date(this.checkInDate);
  const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);

  // Can cancel if more than 24 hours before check-in and not already cancelled/completed
  return (
    hoursUntilCheckIn > 24 &&
    ![BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CHECKED_OUT].includes(
      this.status,
    )
  );
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
