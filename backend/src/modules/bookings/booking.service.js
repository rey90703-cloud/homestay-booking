const Booking = require('./booking.model');
const Homestay = require('../homestays/homestay.model');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../utils/apiError');
const { BOOKING_STATUS, PAYMENT_STATUS, PAGINATION } = require('../../config/constants');
const paymentService = require('../../services/payment.service');

class BookingService {
  async createBooking(guestId, data) {
    const { homestayId, checkInDate, checkOutDate, numberOfGuests, specialRequests } = data;

    // Verify homestay exists and is active
    const homestay = await Homestay.findById(homestayId);
    if (!homestay) {
      throw new NotFoundError('Homestay not found');
    }

    if (homestay.status !== 'active') {
      throw new BadRequestError('This homestay is not available for booking');
    }

    // Check if dates are available
    if (!homestay.isAvailableForDates(checkInDate, checkOutDate)) {
      throw new BadRequestError('Selected dates are not available');
    }

    // Calculate pricing
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    const baseAmount = homestay.pricing.basePrice * nights;
    const totalAmount = baseAmount + homestay.pricing.cleaningFee + homestay.pricing.serviceFee;
    
    // Calculate commission (10% for platform, 90% for host)
    const commissionRate = 0.1;
    const platformCommission = Math.round(totalAmount * commissionRate);
    const hostAmount = totalAmount - platformCommission;

    // Create booking
    const booking = await Booking.create({
      homestayId,
      hostId: homestay.hostId,
      guestId,
      checkInDate,
      checkOutDate,
      numberOfNights: nights,
      numberOfGuests,
      specialRequests,
      pricing: {
        basePrice: homestay.pricing.basePrice,
        numberOfNights: nights,
        cleaningFee: homestay.pricing.cleaningFee,
        serviceFee: homestay.pricing.serviceFee,
        totalAmount,
        currency: homestay.pricing.currency,
        hostAmount,
        platformCommission,
        commissionRate,
      },
    });

    return booking.populate(['homestayId', 'hostId', 'guestId']);
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

  async cancelBooking(bookingId, userId, reason) {
    // Authorization đã được xử lý bởi checkBookingModifyPermission middleware
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (!booking.canBeCancelled()) {
      throw new BadRequestError('This booking cannot be cancelled');
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancellation = {
      cancelledBy: userId,
      cancelledAt: new Date(),
      reason,
      refundAmount: booking.pricing.totalAmount,
    };

    await booking.save();
    return booking;
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
}

module.exports = new BookingService();
