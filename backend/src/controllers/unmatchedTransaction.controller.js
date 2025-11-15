const UnmatchedTransaction = require('../models/unmatchedTransaction.model');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { parsePaginationParams, createPaginationMeta } = require('../utils/pagination.util');

/**
 * Unmatched Transaction Controller
 * Xử lý các API endpoints liên quan đến giao dịch không khớp
 */
class UnmatchedTransactionController {
  /**
   * Get all unmatched transactions (Admin only)
   * GET /api/v1/payments/unmatched
   * 
   * Query params:
   * - page: Trang hiện tại (default: 1)
   * - limit: Số items per page (default: 20, max: 100)
   * - status: Filter theo status (unmatched, matched, refunded, ignored)
   * - sort: Trường sort (default: -createdAt)
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUnmatchedTransactions = catchAsync(async (req, res) => {
    const { status, sort = '-createdAt' } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100,
    });

    // Build query
    const query = {};
    if (status) {
      // Validate status
      const validStatuses = ['unmatched', 'matched', 'refunded', 'ignored'];
      if (!validStatuses.includes(status)) {
        return ApiResponse.error(res, 'Invalid status value', 400);
      }
      query.status = status;
    }

    // Parse sort parameter
    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    // Execute query with pagination
    const [transactions, total] = await Promise.all([
      UnmatchedTransaction.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('matchedBookingId', 'bookingCode totalAmount')
        .populate('matchedBy', 'email profile.fullName')
        .lean(),
      UnmatchedTransaction.countDocuments(query),
    ]);

    const pagination = createPaginationMeta(page, limit, total);

    ApiResponse.success(
      res,
      { transactions },
      'Unmatched transactions retrieved successfully',
      200,
      { pagination }
    );
  });

  /**
   * Match unmatched transaction với booking (Admin only)
   * POST /api/v1/payments/unmatched/:id/match
   * 
   * Logic:
   * 1. Admin chọn unmatched transaction (từ danh sách)
   * 2. Admin chọn booking để khớp
   * 3. Validate transaction và booking
   * 4. Process payment cho booking
   * 5. Mark transaction as matched
   * 
   * @param {Object} req - Express request object
   * @param {Object} req.params.id - ID của unmatched transaction
   * @param {Object} req.body.bookingId - ID của booking để khớp
   * @param {Object} req.body.notes - Ghi chú (optional)
   * @param {Object} res - Express response object
   */
  matchUnmatchedTransaction = catchAsync(async (req, res) => {
    const { id: unmatchedTransactionId } = req.params;
    const { bookingId, notes = '' } = req.body;
    const adminId = req.user._id;

    // 1. Validate input
    if (!bookingId) {
      return ApiResponse.error(res, 'Booking ID is required', 400);
    }

    // 2. Lấy unmatched transaction
    const unmatchedTransaction = await UnmatchedTransaction.findById(unmatchedTransactionId);

    if (!unmatchedTransaction) {
      return ApiResponse.error(res, 'Unmatched transaction not found', 404);
    }

    // 3. Validate transaction có thể khớp không
    if (!unmatchedTransaction.canBeMatched()) {
      return ApiResponse.error(
        res,
        `Cannot match transaction with status: ${unmatchedTransaction.status}`,
        400
      );
    }

    // 4. Lấy booking
    const Booking = require('../modules/bookings/booking.model');
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return ApiResponse.error(res, 'Booking not found', 404);
    }

    // 5. Validate booking có thể nhận payment không
    if (booking.payment.status === 'completed') {
      return ApiResponse.error(res, 'Booking payment already completed', 400);
    }

    if (booking.status === 'cancelled') {
      return ApiResponse.error(res, 'Cannot process payment for cancelled booking', 400);
    }

    // 6. Validate amount (warning nếu không khớp, nhưng vẫn cho phép admin proceed)
    const paymentService = require('../services/payment.service');
    const amountValidation = paymentService.validatePaymentAmount(
      unmatchedTransaction.amount,
      booking.pricing.totalAmount,
      1000
    );

    if (!amountValidation.isValid) {
      // Log warning nhưng vẫn tiếp tục (admin có quyền quyết định)
      const logger = require('../utils/logger');
      logger.warn('Amount mismatch in manual matching', {
        unmatchedTransactionId,
        bookingId,
        transactionAmount: unmatchedTransaction.amount,
        bookingAmount: booking.pricing.totalAmount,
        difference: amountValidation.difference,
        adminId: adminId.toString()
      });
    }

    // 7. Process payment cho booking
    try {
      // Chuẩn bị transaction data từ unmatched transaction
      const transactionData = {
        id: unmatchedTransaction.transactionId,
        amount_in: unmatchedTransaction.amount,
        transaction_date: unmatchedTransaction.transactionDate,
        bank_brand_name: unmatchedTransaction.bankInfo?.bankName || 'Unknown',
        account_number: unmatchedTransaction.bankInfo?.accountNumber || 'Unknown',
        reference_number: unmatchedTransaction.transactionId,
        transaction_content: unmatchedTransaction.content
      };

      // Process payment với verification method = 'manual'
      const paymentResult = await paymentService.processPayment(
        bookingId,
        transactionData,
        'manual',
        {
          verifiedBy: adminId,
          notes: notes || `Manually matched from unmatched transaction ${unmatchedTransactionId}`
        }
      );

      // 8. Mark unmatched transaction as matched
      await unmatchedTransaction.markAsMatched(bookingId, adminId, notes);

      // 9. Return success response
      ApiResponse.success(
        res,
        {
          unmatchedTransaction: {
            id: unmatchedTransaction._id,
            transactionId: unmatchedTransaction.transactionId,
            amount: unmatchedTransaction.amount,
            status: unmatchedTransaction.status,
            matchedAt: unmatchedTransaction.matchedAt
          },
          booking: paymentResult.booking,
          amountValidation: {
            isValid: amountValidation.isValid,
            difference: amountValidation.difference,
            transactionAmount: unmatchedTransaction.amount,
            bookingAmount: booking.pricing.totalAmount
          }
        },
        'Transaction matched successfully',
        200
      );

    } catch (error) {
      // Nếu process payment fail, không mark transaction as matched
      const logger = require('../utils/logger');
      logger.error('Failed to match unmatched transaction', {
        error: error.message,
        stack: error.stack,
        unmatchedTransactionId,
        bookingId,
        adminId: adminId.toString()
      });

      // Re-throw để catchAsync xử lý
      throw error;
    }
  });
}

module.exports = new UnmatchedTransactionController();
