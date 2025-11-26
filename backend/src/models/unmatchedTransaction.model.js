const mongoose = require('mongoose');

/**
 * Unmatched Transaction Model
 * Lưu trữ các giao dịch từ SeePay không khớp với booking nào
 * Dùng để admin review và khớp thủ công
 */
const unmatchedTransactionSchema = new mongoose.Schema(
  {
    // Transaction ID từ SeePay (unique)
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // Số tiền giao dịch
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount không được âm'],
    },

    // Nội dung chuyển khoản
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // Thông tin ngân hàng
    bankInfo: {
      bankName: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            // Account number phải là masked format (ví dụ: ****7918) hoặc full number
            return !v || /^[\*\d]{4,}$/.test(v);
          },
          message: 'Account number phải ở dạng masked (ví dụ: ****7918) hoặc số đầy đủ',
        },
      },
      accountName: {
        type: String,
        trim: true,
      },
    },

    // Thời gian giao dịch
    transactionDate: {
      type: Date,
      required: true,
    },

    // Trạng thái
    status: {
      type: String,
      enum: ['unmatched', 'matched', 'refunded', 'ignored'],
      default: 'unmatched',
      index: true,
    },

    // Booking ID đã khớp (nếu có)
    matchedBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      sparse: true,
    },

    // User đã khớp thủ công (admin)
    matchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Thời gian khớp
    matchedAt: {
      type: Date,
    },

    // Ghi chú khi khớp thủ công
    matchNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Match notes không được vượt quá 500 ký tự'],
    },

    // Raw payload từ SeePay (để debug)
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Lý do không khớp
    unmatchReason: {
      type: String,
      trim: true,
    },

    // Validation details
    validationDetails: {
      reference: {
        valid: Boolean,
        message: String,
      },
      checksum: {
        valid: Boolean,
        message: String,
      },
      amount: {
        valid: Boolean,
        message: String,
        difference: Number,
      },
      timestamp: {
        valid: Boolean,
        message: String,
        minutesDifference: Number,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
unmatchedTransactionSchema.index({ transactionId: 1 }, { unique: true });
unmatchedTransactionSchema.index({ status: 1 });
unmatchedTransactionSchema.index({ transactionDate: -1 });
unmatchedTransactionSchema.index({ createdAt: -1 });
unmatchedTransactionSchema.index({ matchedBookingId: 1 }, { sparse: true });

// Compound indexes cho filtering
unmatchedTransactionSchema.index({ status: 1, transactionDate: -1 });
unmatchedTransactionSchema.index({ status: 1, createdAt: -1 });
unmatchedTransactionSchema.index({ amount: 1, status: 1 });

/**
 * Đánh dấu transaction đã được khớp với booking (atomic operation)
 * @param {string} bookingId - ID của booking đã khớp
 * @param {string} userId - ID của user thực hiện khớp (admin)
 * @param {string} notes - Ghi chú
 * @returns {Promise<UnmatchedTransaction>}
 * @throws {Error} Nếu transaction không ở trạng thái unmatched
 */
unmatchedTransactionSchema.methods.markAsMatched = async function (bookingId, userId, notes = '') {
  // Validate: chỉ có thể match transaction ở trạng thái unmatched
  if (this.status !== 'unmatched') {
    throw new Error(`Cannot match transaction with status: ${this.status}`);
  }

  // Validate: bookingId phải là valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error('Invalid booking ID');
  }

  // Atomic update để tránh race condition
  const updated = await this.constructor.findOneAndUpdate(
    {
      _id: this._id,
      status: 'unmatched', // Chỉ update nếu vẫn là unmatched
    },
    {
      $set: {
        status: 'matched',
        matchedBookingId: bookingId,
        matchedBy: userId,
        matchedAt: new Date(),
        ...(notes && { matchNotes: notes }),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updated) {
    throw new Error('Transaction already matched or not found');
  }

  // Sync với current instance
  Object.assign(this, updated.toObject());
  return this;
};

/**
 * Đánh dấu transaction bị bỏ qua (atomic operation)
 * @param {string} userId - ID của user thực hiện (admin)
 * @param {string} notes - Lý do bỏ qua
 * @returns {Promise<UnmatchedTransaction>}
 * @throws {Error} Nếu transaction không ở trạng thái unmatched
 */
unmatchedTransactionSchema.methods.markAsIgnored = async function (userId, notes = '') {
  // Validate: chỉ có thể ignore transaction ở trạng thái unmatched
  if (this.status !== 'unmatched') {
    throw new Error(`Cannot ignore transaction with status: ${this.status}`);
  }

  // Atomic update để tránh race condition
  const updated = await this.constructor.findOneAndUpdate(
    {
      _id: this._id,
      status: 'unmatched', // Chỉ update nếu vẫn là unmatched
    },
    {
      $set: {
        status: 'ignored',
        matchedBy: userId,
        matchedAt: new Date(),
        ...(notes && { matchNotes: notes }),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updated) {
    throw new Error('Transaction already processed or not found');
  }

  // Sync với current instance
  Object.assign(this, updated.toObject());
  return this;
};

/**
 * Kiểm tra xem transaction có thể khớp thủ công không
 * @returns {boolean}
 */
unmatchedTransactionSchema.methods.canBeMatched = function () {
  return this.status === 'unmatched';
};

// ==================== STATIC METHODS ====================

/**
 * Lấy danh sách transactions chưa khớp
 * @param {Object} options - Query options
 * @param {number} options.page - Trang hiện tại (default: 1)
 * @param {number} options.limit - Số items per page (default: 20)
 * @param {string} options.sortBy - Trường sort (default: 'createdAt')
 * @param {string} options.sortOrder - Thứ tự sort: 'asc' | 'desc' (default: 'desc')
 * @returns {Promise<{transactions: Array, pagination: Object}>}
 */
unmatchedTransactionSchema.statics.findPending = async function (options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [transactions, total] = await Promise.all([
    this.find({ status: 'unmatched' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({ status: 'unmatched' }),
  ]);

  return {
    transactions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
  };
};

/**
 * Tìm transactions theo khoảng thời gian
 * @param {Date} startDate - Ngày bắt đầu
 * @param {Date} endDate - Ngày kết thúc
 * @param {string} status - Filter theo status (optional)
 * @returns {Promise<Array>}
 */
unmatchedTransactionSchema.statics.findByDateRange = async function (
  startDate,
  endDate,
  status = null,
) {
  const query = {
    transactionDate: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (status) {
    query.status = status;
  }

  return await this.find(query).sort({ transactionDate: -1 }).lean();
};

/**
 * Tìm transactions theo khoảng số tiền
 * @param {number} minAmount - Số tiền tối thiểu
 * @param {number} maxAmount - Số tiền tối đa
 * @param {string} status - Filter theo status (optional)
 * @returns {Promise<Array>}
 */
unmatchedTransactionSchema.statics.findByAmountRange = async function (
  minAmount,
  maxAmount,
  status = 'unmatched',
) {
  const query = {
    amount: {
      $gte: minAmount,
      $lte: maxAmount,
    },
    status,
  };

  return await this.find(query).sort({ amount: -1 }).lean();
};

/**
 * Tìm transaction theo nội dung (search)
 * @param {string} searchText - Text cần tìm
 * @param {string} status - Filter theo status (optional)
 * @returns {Promise<Array>}
 */
unmatchedTransactionSchema.statics.searchByContent = async function (
  searchText,
  status = 'unmatched',
) {
  const query = {
    content: { $regex: searchText, $options: 'i' },
    status,
  };

  return await this.find(query).sort({ createdAt: -1 }).lean();
};

/**
 * Lấy thống kê transactions
 * @returns {Promise<Object>}
 */
unmatchedTransactionSchema.statics.getStatistics = async function () {
  const [statusCounts, totalAmount, recentCount] = await Promise.all([
    this.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
    this.aggregate([
      { $match: { status: 'unmatched' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    this.countDocuments({
      status: 'unmatched',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ]);

  const stats = {
    byStatus: {},
    unmatchedAmount: totalAmount[0]?.total || 0,
    recentUnmatched: recentCount,
  };

  statusCounts.forEach((item) => {
    stats.byStatus[item._id] = {
      count: item.count,
      totalAmount: item.totalAmount,
    };
  });

  return stats;
};

// Virtual để lấy thông tin booking đã khớp
unmatchedTransactionSchema.virtual('matchedBooking', {
  ref: 'Booking',
  localField: 'matchedBookingId',
  foreignField: '_id',
  justOne: true,
});

// Virtual để lấy thông tin user đã khớp
unmatchedTransactionSchema.virtual('matcher', {
  ref: 'User',
  localField: 'matchedBy',
  foreignField: '_id',
  justOne: true,
});

const UnmatchedTransaction = mongoose.model('UnmatchedTransaction', unmatchedTransactionSchema);

module.exports = UnmatchedTransaction;
