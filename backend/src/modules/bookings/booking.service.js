const Booking = require('./booking.model');
const Homestay = require('../homestays/homestay.model');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../utils/apiError');
const { BOOKING_STATUS, PAYMENT_STATUS, PAGINATION } = require('../../config/constants');
const paymentService = require('../../services/payment.service');

class BookingService {
  /**
   * Check if homestay has overlapping bookings for given dates
   * @param {string} homestayId - ID của homestay
   * @param {Date} checkInDate - Ngày check-in
   * @param {Date} checkOutDate - Ngày check-out
   * @param {string} excludeBookingId - ID booking cần loại trừ (dùng cho update)
   * @param {Object} session - MongoDB session for transaction (optional)
   * @returns {Promise<Object>} { available: boolean, overlapPeriods: Array }
   */
  async checkBookingAvailability(homestayId, checkInDate, checkOutDate, excludeBookingId = null, session = null) {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const now = new Date();

    const query = {
      homestayId,
      $and: [
        // Only check bookings that are confirmed OR pending with valid hold
        {
          $or: [
            // Confirmed bookings (paid, confirmed, checked-in)
            { status: { $in: [BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN] } },
            // Pending bookings with hold not expired yet
            { 
              status: BOOKING_STATUS.PENDING,
              holdExpiresAt: { $gt: now }
            }
          ]
        },
        // Date overlap conditions
        {
          $or: [
            // Case 1: Existing booking starts before or at new check-in, ends after new check-in
            { checkInDate: { $lte: checkIn }, checkOutDate: { $gt: checkIn } },
            // Case 2: Existing booking starts before new check-out, ends at or after new check-out
            { checkInDate: { $lt: checkOut }, checkOutDate: { $gte: checkOut } },
            // Case 3: New booking completely contains existing booking
            { checkInDate: { $gte: checkIn }, checkOutDate: { $lte: checkOut } },
            // Case 4: Existing booking completely contains new booking
            { checkInDate: { $lte: checkIn }, checkOutDate: { $gte: checkOut } }
          ]
        }
      ]
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    // Use session if provided (for transaction)
    const findOptions = session ? { session } : {};
    
    const overlappingBookings = await Booking.find(query, null, findOptions)
      .select('checkInDate checkOutDate status holdExpiresAt')
      .limit(5);

    // Calculate overlap periods
    const overlapPeriods = overlappingBookings.map(booking => {
      const existingCheckIn = new Date(booking.checkInDate);
      const existingCheckOut = new Date(booking.checkOutDate);

      // Calculate the intersection (overlap period)
      const overlapStart = checkIn > existingCheckIn ? checkIn : existingCheckIn;
      const overlapEnd = checkOut < existingCheckOut ? checkOut : existingCheckOut;

      return {
        overlapStart,
        overlapEnd,
        bookingStatus: booking.status,
        isHold: booking.status === BOOKING_STATUS.PENDING
      };
    });

    return {
      available: overlappingBookings.length === 0,
      overlapPeriods
    };
  }

  async createBooking(guestId, data) {
    const { homestayId, checkInDate, checkOutDate, numberOfGuests, specialRequests, promoCode } = data;

    // Verify homestay exists and is active
    const homestay = await Homestay.findById(homestayId);
    if (!homestay) {
      throw new NotFoundError('Homestay not found');
    }

    if (homestay.status !== 'active') {
      throw new BadRequestError('This homestay is not available for booking');
    }

    // Check if dates are available (host's unavailable dates)
    if (!homestay.isAvailableForDates(checkInDate, checkOutDate)) {
      throw new BadRequestError('Selected dates are not available');
    }

    // Calculate pricing first (before transaction)
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    const baseAmount = homestay.pricing.basePrice * nights;
    let totalAmount = baseAmount + homestay.pricing.cleaningFee + homestay.pricing.serviceFee;
    let discount = 0;
    let appliedPromoCode = null;

    // Apply promo code if provided
    if (promoCode) {
      const PromoCode = require('../../models/promoCode.model');
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
      
      if (promo && promo.isValid()) {
        if (totalAmount >= promo.minOrderAmount) {
          discount = promo.calculateDiscount(totalAmount);
          totalAmount -= discount;
          appliedPromoCode = promo.code;
          
          // Increment usage count
          promo.usedCount += 1;
          await promo.save();
        }
      }
    }
    
    // Calculate commission (10% for platform, 90% for host)
    const commissionRate = 0.1;
    const platformCommission = Math.round(totalAmount * commissionRate);
    const hostAmount = totalAmount - platformCommission;

    // Set hold expiration time (15 minutes from now)
    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Use MongoDB session for transaction to prevent race condition
    const session = await Booking.startSession();
    
    try {
      await session.withTransaction(async () => {
        // CRITICAL: Re-check availability inside transaction with lock
        // This ensures atomic check-and-create operation
        const availabilityResult = await this.checkBookingAvailability(
          homestayId, 
          checkInDate, 
          checkOutDate,
          null,
          session // Pass session to lock the query
        );
        
        if (!availabilityResult.available) {
          throw new BadRequestError(
            'Homestay is not available for the selected dates. Another booking was just created for this period.'
          );
        }

        // Create booking with hold
        const bookingData = {
          homestayId,
          hostId: homestay.hostId,
          guestId,
          checkInDate,
          checkOutDate,
          numberOfNights: nights,
          numberOfGuests,
          specialRequests,
          holdExpiresAt,
          promoCode: appliedPromoCode,
          pricing: {
            basePrice: homestay.pricing.basePrice,
            numberOfNights: nights,
            cleaningFee: homestay.pricing.cleaningFee,
            serviceFee: homestay.pricing.serviceFee,
            discount,
            totalAmount,
            currency: homestay.pricing.currency,
            hostAmount,
            platformCommission,
            commissionRate,
          },
        };

        const [booking] = await Booking.create([bookingData], { session });
        
        // Store booking in transaction context to return later
        session.booking = booking;
      });

      // Transaction successful, return the created booking
      const booking = session.booking;
      await session.endSession();
      
      return booking.populate(['homestayId', 'hostId', 'guestId']);
      
    } catch (error) {
      await session.endSession();
      throw error;
    }
  }

  async getAllBookings(filters = {}, pagination = {}) {
    const { status, paymentStatus, hostId, guestId, search, startDate, endDate } = filters;
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = pagination;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query['payment.status'] = paymentStatus;
    if (hostId) query.hostId = hostId;
    if (guestId) query.guestId = guestId;

    if (startDate || endDate) {
      query.checkInDate = {};
      if (startDate) query.checkInDate.$gte = new Date(startDate);
      if (endDate) query.checkInDate.$lte = new Date(endDate);
    }

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / limit);
    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('homestayId', 'title coverImage location')
      .populate('hostId', 'email profile')
      .populate('guestId', 'email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return {
      bookings,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalBookings,
        limit: Number(limit),
      },
    };
  }

  async getBookingById(bookingId) {
    // Authorization đã được xử lý bởi checkBookingAccess middleware
    const booking = await Booking.findById(bookingId)
      .populate('homestayId')
      .populate('hostId', 'email profile')
      .populate('guestId', 'email profile');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return booking;
  }

  async updatePaymentStatus(bookingId, status, transactionId = null) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    booking.payment.status = status;
    if (transactionId) {
      booking.payment.transactionId = transactionId;
    }

    if (status === PAYMENT_STATUS.COMPLETED) {
      booking.payment.paidAt = new Date();
      booking.status = BOOKING_STATUS.PAID;
      booking.hostPayout.amount = booking.pricing.hostAmount;
    }

    await booking.save();
    return booking;
  }

  async processHostPayout(bookingId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.payment.status !== PAYMENT_STATUS.COMPLETED) {
      throw new BadRequestError('Payment must be completed before processing host payout');
    }

    booking.hostPayout.status = 'completed';
    booking.hostPayout.paidAt = new Date();
    booking.hostPayout.transactionId = `PAYOUT-${Date.now()}`;

    await booking.save();
    return booking;
  }

  /**
   * Cancel booking với refund calculation
   * @param {string} bookingId - ID của booking cần hủy
   * @param {string} userId - ID của user thực hiện hủy
   * @param {string} reason - Lý do hủy
   * @returns {Promise<Object>} { booking, refundInfo }
   */
  async cancelBooking(bookingId, userId, reason) {
    // Authorization đã được xử lý bởi checkBookingModifyPermission middleware
    const booking = await Booking.findById(bookingId)
      .populate('homestayId', 'title location')
      .populate('hostId', 'email profile')
      .populate('guestId', 'email profile');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Kiểm tra có thể hủy không
    const cancelCheck = booking.canBeCancelled();
    if (!cancelCheck.canCancel) {
      throw new BadRequestError(cancelCheck.reason);
    }

    // Tính toán refund
    const refundInfo = booking.calculateRefund();

    // Update booking status
    booking.status = BOOKING_STATUS.CANCELLED;
    
    // Update payment status nếu đã thanh toán
    if (booking.payment.status === PAYMENT_STATUS.COMPLETED) {
      booking.payment.status = PAYMENT_STATUS.REFUNDED;
      booking.payment.refundAmount = refundInfo.refundAmount;
      booking.payment.refundedAt = new Date();
    }

    // Lưu cancellation info
    booking.cancellation = {
      cancelledBy: userId,
      cancelledAt: new Date(),
      reason: reason || 'Không có lý do',
      refundAmount: refundInfo.refundAmount,
      refundPercentage: refundInfo.refundPercentage,
      refundPolicy: refundInfo.refundPolicy,
      hoursUntilCheckIn: refundInfo.hoursUntilCheckIn,
    };

    await booking.save();

    // TODO: Gửi email notification cho guest và host
    // await this.sendCancellationEmails(booking, refundInfo);

    return {
      booking,
      refundInfo: {
        ...refundInfo,
        message: this.getRefundMessage(refundInfo),
        processTime: '7-14 ngày làm việc',
      },
    };
  }

  /**
   * Tạo message mô tả refund policy
   * @param {Object} refundInfo - Thông tin refund
   * @returns {string} Message
   */
  getRefundMessage(refundInfo) {
    const { refundPolicy, refundPercentage, serviceFeeDeducted, daysUntilCheckIn } = refundInfo;

    if (refundPolicy === 'full') {
      return `Bạn sẽ được hoàn ${refundPercentage}% (trừ phí dịch vụ ${serviceFeeDeducted.toLocaleString('vi-VN')} VND) vì hủy trước ${Math.floor(daysUntilCheckIn)} ngày.`;
    } else if (refundPolicy === 'partial') {
      return `Bạn sẽ được hoàn ${refundPercentage}% do hủy trong khoảng 3-7 ngày trước check-in.`;
    } else {
      return `Không được hoàn tiền do hủy trong vòng 3 ngày trước check-in.`;
    }
  }

  async getPaymentStatistics() {
    const stats = await Booking.aggregate([
      {
        $match: {
          'payment.status': PAYMENT_STATUS.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.totalAmount' },
          totalHostPayouts: { $sum: '$pricing.hostAmount' },
          totalPlatformCommission: { $sum: '$pricing.platformCommission' },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    return stats[0] || {
      totalRevenue: 0,
      totalHostPayouts: 0,
      totalPlatformCommission: 0,
      totalBookings: 0,
    };
  }

  /**
   * Kiểm tra QR code có hết hạn và tính thời gian còn lại
   * @private
   * @param {Object} qrCode - QR code object từ booking
   * @returns {Object} { isExpired, remainingSeconds }
   */
  _checkQRExpiry(qrCode) {
    if (!qrCode?.expiresAt) {
      return { isExpired: true, remainingSeconds: null };
    }

    const now = new Date();
    const expiresAt = new Date(qrCode.expiresAt);
    const isExpired = expiresAt <= now;
    
    const remainingSeconds = isExpired 
      ? null 
      : Math.floor((expiresAt - now) / 1000);

    return { isExpired, remainingSeconds };
  }

  /**
   * Build payment info object
   * @private
   * @param {Object} booking - Booking document
   * @returns {Object} Payment info
   */
  _buildPaymentInfo(booking) {
    return {
      reference: booking.payment.reference,
      amount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      method: booking.payment.method,
    };
  }

  /**
   * Build bank info object
   * @private
   * @returns {Object} Bank info
   */
  _buildBankInfo() {
    return {
      bankName: process.env.BANK_NAME,
      accountNumber: process.env.BANK_ACCOUNT_NUMBER,
      accountName: process.env.BANK_ACCOUNT_NAME,
    };
  }

  /**
   * Generate payment QR code for booking
   * POST /api/v1/bookings/:id/payment/qrcode
   * 
   * @param {string} bookingId - ID của booking
   * @returns {Promise<Object>} QR code data và payment info
   */
  async generatePaymentQRCode(bookingId) {
    // Authorization đã được xử lý bởi checkBookingAccess middleware
    
    // 1. Lấy booking và validate
    const booking = await Booking.findById(bookingId).populate('homestayId', 'title');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // 2. Validate booking status: phải là pending_payment
    if (booking.payment.status !== PAYMENT_STATUS.PENDING) {
      throw new BadRequestError(
        `Cannot generate QR code for booking with payment status: ${booking.payment.status}`,
      );
    }

    // 3. Kiểm tra QR code hiện tại (sử dụng model method)
    if (!booking.isQRExpired()) {
      const { remainingSeconds } = this._checkQRExpiry(booking.payment.qrCode);

      return {
        qrCode: {
          data: booking.payment.qrCode.data,
          url: booking.payment.qrCode.data,
          expiresAt: booking.payment.qrCode.expiresAt,
          remainingSeconds,
        },
        payment: this._buildPaymentInfo(booking),
        bankInfo: this._buildBankInfo(),
        isRegenerated: false,
      };
    }

    // 4. Tạo QR code mới (hoặc regenerate nếu đã hết hạn)
    const qrData = await paymentService.generateQRCodeForBooking(bookingId);

    return qrData;
  }

  /**
   * Get payment status for booking
   * GET /api/v1/bookings/:id/payment/status
   * 
   * @param {string} bookingId - ID của booking
   * @returns {Promise<Object>} Payment status và thông tin liên quan
   */
  async getPaymentStatus(bookingId) {
    // Authorization đã được xử lý bởi checkBookingAccess middleware
    
    // 1. Lấy booking từ database (không dùng lean để có thể gọi model methods)
    const booking = await Booking.findById(bookingId).populate('homestayId', 'title');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // 2. Kiểm tra QR code có hết hạn không (sử dụng helper method)
    const { isExpired: isQRExpired, remainingSeconds } = this._checkQRExpiry(
      booking.payment.qrCode,
    );

    // 3. Xác định trạng thái thanh toán
    let paymentStatus = booking.payment.status;

    // Nếu status là pending và QR đã hết hạn, trả về status "expired"
    if (paymentStatus === PAYMENT_STATUS.PENDING && isQRExpired && booking.payment.qrCode?.expiresAt) {
      paymentStatus = PAYMENT_STATUS.EXPIRED;
    }

    // 4. Build response data
    const responseData = {
      status: paymentStatus,
      payment: this._buildPaymentInfo(booking),
    };

    // 5. Thêm thông tin giao dịch nếu đã completed
    if (booking.payment.status === PAYMENT_STATUS.COMPLETED && booking.payment.transaction) {
      responseData.transaction = {
        id: booking.payment.transaction.id,
        bankReference: booking.payment.transaction.bankReference,
        amount: booking.payment.transaction.amount,
        paidAt: booking.payment.transaction.paidAt,
        bankName: booking.payment.transaction.bankName,
      };
    }

    // 6. Thêm thông tin QR code nếu có
    if (booking.payment.qrCode?.data) {
      responseData.qrCode = {
        isExpired: isQRExpired,
        expiresAt: booking.payment.qrCode.expiresAt,
        remainingSeconds,
      };

      // Nếu QR chưa hết hạn, thêm data để hiển thị
      if (!isQRExpired) {
        responseData.qrCode.data = booking.payment.qrCode.data;
        responseData.qrCode.url = booking.payment.qrCode.data;
      }
    }

    // 7. Thêm thông báo nếu QR đã hết hạn
    if (paymentStatus === PAYMENT_STATUS.EXPIRED) {
      responseData.message = 'QR code has expired. Please generate a new QR code to continue payment.';
    }

    return responseData;
  }

  /**
   * Verify payment manually (Admin only)
   * POST /api/v1/bookings/:id/payment/verify
   * 
   * @param {string} bookingId - ID của booking
   * @param {string} transactionId - Transaction ID từ SeePay
   * @param {string} adminId - User ID của admin
   * @param {string} notes - Ghi chú
   * @returns {Promise<Object>} Kết quả xác minh
   */
  async verifyPaymentManually(bookingId, transactionId, adminId, notes = '') {
    // Authorization đã được xử lý bởi authorize(ROLES.ADMIN) middleware
    
    // Validate input
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
      throw new BadRequestError('Transaction ID is required');
    }

    // Gọi payment service để xử lý verification
    const result = await paymentService.verifyPaymentManually(
      bookingId,
      transactionId,
      adminId,
      notes
    );

    return result;
  }

  /**
   * Get booked dates for a homestay
   * GET /api/v1/homestays/:id/booked-dates
   * 
   * @param {string} homestayId - ID của homestay
   * @returns {Promise<Array>} Danh sách các khoảng thời gian đã được đặt
   */
  async getBookedDates(homestayId) {
    const bookings = await Booking.find({
      homestayId,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN] }
    })
    .select('checkInDate checkOutDate')
    .sort({ checkInDate: 1 })
    .lean();

    return bookings.map(booking => ({
      checkIn: booking.checkInDate,
      checkOut: booking.checkOutDate
    }));
  }
}

module.exports = new BookingService();
