const bookingService = require('./booking.service');
const ApiResponse = require('../../utils/apiResponse');
const catchAsync = require('../../utils/catchAsync');
const pdfInvoiceService = require('../../services/pdf-invoice.service');

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
   * Get current user's bookings
   * GET /api/v1/bookings/my-bookings
   */
  getMyBookings = catchAsync(async (req, res) => {
    const {
      page,
      limit,
      status,
      paymentStatus,
    } = req.query;

    const result = await bookingService.getAllBookings(
      { guestId: req.user._id, status, paymentStatus },
      { page, limit },
    );

    ApiResponse.success(
      res,
      { bookings: result.bookings },
      'My bookings retrieved successfully',
      200,
      { pagination: result.pagination },
    );
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
    const booking = await bookingService.getBookingById(req.params.id);
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
    const result = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
      reason,
    );
    
    ApiResponse.success(
      res,
      {
        booking: result.booking,
        refundInfo: result.refundInfo,
      },
      'Booking đã được hủy thành công',
    );
  });

  /**
   * Get payment statistics (Admin only)
   * GET /api/v1/bookings/statistics/payments
   */
  getPaymentStatistics = catchAsync(async (req, res) => {
    const stats = await bookingService.getPaymentStatistics();
    ApiResponse.success(res, stats, 'Payment statistics retrieved successfully');
  });

  /**
   * Generate payment QR code
   * POST /api/v1/bookings/:id/payment/qrcode
   */
  generatePaymentQRCode = catchAsync(async (req, res) => {
    const qrData = await bookingService.generatePaymentQRCode(req.params.id);
    ApiResponse.success(res, qrData, 'QR code generated successfully');
  });

  /**
   * Get payment status
   * GET /api/v1/bookings/:id/payment/status
   */
  getPaymentStatus = catchAsync(async (req, res) => {
    const paymentStatus = await bookingService.getPaymentStatus(req.params.id);
    ApiResponse.success(res, paymentStatus, 'Payment status retrieved successfully');
  });

  /**
   * Verify payment manually (Admin only)
   * POST /api/v1/bookings/:id/payment/verify
   */
  verifyPaymentManually = catchAsync(async (req, res) => {
    const { transactionId, notes } = req.body;
    const adminId = req.user._id;

    const result = await bookingService.verifyPaymentManually(
      req.params.id,
      transactionId,
      adminId,
      notes
    );

    ApiResponse.success(res, result, 'Payment verified manually');
  });

  /**
   * Download invoice PDF for a booking
   * GET /api/v1/bookings/:id/invoice
   */
  downloadInvoice = catchAsync(async (req, res) => {
    // Get booking with populated fields
    const booking = await bookingService.getBookingById(req.params.id);

    // Check if payment is completed
    if (booking.payment?.status !== 'completed') {
      return ApiResponse.error(
        res,
        'Chỉ có thể tải hóa đơn cho booking đã thanh toán',
        400
      );
    }

    // Generate PDF
    const pdfDoc = pdfInvoiceService.generateInvoice(booking);

    // Set response headers
    const filename = `invoice-${booking.bookingReference || booking._id.toString().substring(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    pdfDoc.pipe(res);
  });
}

module.exports = new BookingController();
