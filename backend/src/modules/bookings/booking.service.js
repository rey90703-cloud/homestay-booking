const Booking = require('./booking.model');
const Homestay = require('../homestays/homestay.model');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../utils/apiError');
const { BOOKING_STATUS, PAYMENT_STATUS, PAGINATION } = require('../../config/constants');

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

    // Create booking
    const booking = await Booking.create({
      homestayId,
      hostId: homestay.hostId,
      guestId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests,
      pricing: {
        basePrice: homestay.pricing.basePrice,
        numberOfNights: nights,
        cleaningFee: homestay.pricing.cleaningFee,
        serviceFee: homestay.pricing.serviceFee,
        totalAmount,
        currency: homestay.pricing.currency,
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

  async getBookingById(bookingId, userId, userRole) {
    const booking = await Booking.findById(bookingId)
      .populate('homestayId')
      .populate('hostId', 'email profile')
      .populate('guestId', 'email profile');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization
    if (
      userRole !== 'admin' &&
      booking.hostId._id.toString() !== userId.toString() &&
      booking.guestId._id.toString() !== userId.toString()
    ) {
      throw new ForbiddenError('You do not have permission to view this booking');
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

  async cancelBooking(bookingId, userId, userRole, reason) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (!booking.canBeCancelled()) {
      throw new BadRequestError('This booking cannot be cancelled');
    }

    // Check authorization
    if (
      userRole !== 'admin' &&
      booking.hostId.toString() !== userId.toString() &&
      booking.guestId.toString() !== userId.toString()
    ) {
      throw new ForbiddenError('You do not have permission to cancel this booking');
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
}

module.exports = new BookingService();
