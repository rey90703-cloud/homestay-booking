const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../config/constants');

const bookingSchema = new mongoose.Schema(
  {
    homestayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homestay',
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Booking dates
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
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
    },

    // Payment information
    payment: {
      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
      },
      method: {
        type: String,
        enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'],
        default: 'bank_transfer',
      },
      transactionId: String,
      paidAt: Date,
      refundAmount: Number,
      refundedAt: Date,

      // Payment reference (mã tham chiếu thanh toán)
      reference: {
        type: String,
        unique: true,
        sparse: true, // Allow null values, only enforce uniqueness when value exists
      },

      // QR Code information
      qrCode: {
        data: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          validate: {
            validator: function (v) {
              // createdAt không được là thời gian tương lai
              return !v || v <= new Date();
            },
            message: 'QR createdAt không được là thời gian tương lai',
          },
        },
        expiresAt: {
          type: Date,
          validate: {
            validator: function (v) {
              // expiresAt phải sau createdAt
              const createdAt = this.payment?.qrCode?.createdAt;
              return !v || !createdAt || v > createdAt;
            },
            message: 'QR expiresAt phải sau createdAt',
          },
        },
      },

      // Transaction information from SeePay
      transaction: {
        id: {
          type: String,
          trim: true,
        },
        bankReference: {
          type: String,
          trim: true,
        },
        amount: {
          type: Number,
          min: [0, 'Transaction amount không được âm'],
          validate: {
            validator: function (v) {
              // Số tiền giao dịch không được lớn hơn 10 tỷ VND (chống data corruption)
              return !v || v <= 10000000000;
            },
            message: 'Transaction amount vượt quá giới hạn cho phép',
          },
        },
        bankName: {
          type: String,
          trim: true,
        },
        accountNumber: {
          type: String,
          trim: true,
          validate: {
            validator: function (v) {
              // Account number phải là masked format (ví dụ: ****7918)
              return !v || /^[\*\d]{4,}$/.test(v);
            },
            message: 'Account number phải ở dạng masked (ví dụ: ****7918)',
          },
        },
      },

      // Verification information
      verification: {
        method: {
          type: String,
          enum: ['webhook', 'polling', 'manual'],
          validate: {
            validator: function (v) {
              // Nếu có method thì phải có verifiedAt
              const verifiedAt = this.payment?.verification?.verifiedAt;
              return !v || verifiedAt;
            },
            message: 'Verification method yêu cầu phải có verifiedAt',
          },
        },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          validate: {
            validator: function (v) {
              // Nếu method là manual thì phải có verifiedBy
              const method = this.payment?.verification?.method;
              return method !== 'manual' || v;
            },
            message: 'Manual verification yêu cầu phải có verifiedBy',
          },
        },
        verifiedAt: {
          type: Date,
          validate: {
            validator: function (v) {
              // verifiedAt không được là thời gian tương lai
              return !v || v <= new Date();
            },
            message: 'Verification verifiedAt không được là thời gian tương lai',
          },
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [500, 'Verification notes không được vượt quá 500 ký tự'],
        },
      },

      // Thời gian gửi reminder cuối cùng (để tránh spam email)
      lastReminderSentAt: {
        type: Date,
        validate: {
          validator: function (v) {
            // lastReminderSentAt không được là thời gian tương lai
            return !v || v <= new Date();
          },
          message: 'lastReminderSentAt không được là thời gian tương lai',
        },
      },
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
bookingSchema.index({ 'payment.reference': 1 }, { sparse: true }); // Index cho payment reference (sparse vì không phải booking nào cũng có)
bookingSchema.index({ 'payment.status': 1, 'payment.qrCode.createdAt': 1 }); // Compound index cho polling (bao gồm cả payment.status đơn)
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

/**
 * Kiểm tra xem QR code đã hết hạn chưa
 * @returns {boolean} true nếu QR code đã hết hạn hoặc chưa được tạo
 */
bookingSchema.methods.isQRExpired = function () {
  // Nếu chưa có QR code hoặc chưa có thời gian hết hạn
  if (!this.payment.qrCode || !this.payment.qrCode.expiresAt) {
    return true;
  }

  const now = new Date();
  const expiresAt = new Date(this.payment.qrCode.expiresAt);

  // QR code hết hạn nếu thời gian hiện tại > thời gian hết hạn
  return now > expiresAt;
};

/**
 * Kiểm tra xem có thể tạo lại QR code không
 * @returns {boolean} true nếu có thể tạo lại QR code
 */
bookingSchema.methods.canRegenerateQR = function () {
  // Chỉ có thể tạo lại QR nếu:
  // 1. Payment status vẫn là pending
  // 2. QR code đã hết hạn
  // 3. Booking chưa bị hủy hoặc hoàn thành
  return (
    this.payment.status === PAYMENT_STATUS.PENDING &&
    this.isQRExpired() &&
    ![BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CHECKED_OUT].includes(
      this.status,
    )
  );
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
