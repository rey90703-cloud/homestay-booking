const bookingService = require('./booking.service');
const ApiResponse = require('../../utils/apiResponse');
const catchAsync = require('../../utils/catchAsync');

class BookingController {
  /**
   * Create booking
   * POST /api/v1/bookings
   */
  createBooking = catchAsync(async (req, res) => {
    const booking = await bookingService.createBooking(req.user._id, req.body);
    ApiResponse.created(res, { booking }, 'Booking created successfully');
  });

  /**
   * Get all bookings (Admin only)
   * GET /api/v1/bookings
   */
  getAllBookings = catchAsync(async (req, res) => {
    const {
      page,
      limit,
      status,
      paymentStatus,
      hostId,
      guestId,
      search,
      startDate,
      endDate,
    } = req.query;

    const result = await bookingService.getAllBookings(
      { status, paymentStatus, hostId, guestId, search, startDate, endDate },
      { page, limit },
    );

    ApiResponse.success(
      res,
      result.bookings,
      'Bookings retrieved successfully',
      200,
      { pagination: result.pagination },
    );
  });

  /**
   * Get booking by ID
   * GET /api/v1/bookings/:id
   */
  getBookingById = catchAsync(async (req, res) => {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user._id,
      req.user.role,
    );
    ApiResponse.success(res, { booking }, 'Booking retrieved successfully');
  });

  /**
   * Update payment status (Admin only)
   * PATCH /api/v1/bookings/:id/payment
   */
  updatePaymentStatus = catchAsync(async (req, res) => {
    const { status, transactionId } = req.body;
    const booking = await bookingService.updatePaymentStatus(req.params.id, status, transactionId);
    ApiResponse.success(res, { booking }, 'Payment status updated successfully');
  });

  /**
   * Process host payout (Admin only)
   * POST /api/v1/bookings/:id/payout
   */
  processHostPayout = catchAsync(async (req, res) => {
    const booking = await bookingService.processHostPayout(req.params.id);
    ApiResponse.success(res, { booking }, 'Host payout processed successfully');
  });

  /**
   * Cancel booking
   * POST /api/v1/bookings/:id/cancel
   */
  cancelBooking = catchAsync(async (req, res) => {
    const { reason } = req.body;
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
      req.user.role,
      reason,
    );
    ApiResponse.success(res, { booking }, 'Booking cancelled successfully');
  });

  /**
   * Get payment statistics (Admin only)
   * GET /api/v1/bookings/statistics/payments
   */
  getPaymentStatistics = catchAsync(async (req, res) => {
    const stats = await bookingService.getPaymentStatistics();
    ApiResponse.success(res, stats, 'Payment statistics retrieved successfully');
  });
}

module.exports = new BookingController();
