const logger = require('../utils/logger');
const paymentLogger = require('../utils/payment.logger');
const Booking = require('../modules/bookings/booking.model');
const paymentService = require('./payment.service');

/**
 * Transaction Matcher Service
 * Khớp giao dịch từ SeePay với booking trong hệ thống
 */
class TransactionMatcherService {
  constructor() {
    // Tolerance cho amount validation (±1000 VND)
    this.amountTolerance = parseInt(process.env.PAYMENT_AMOUNT_TOLERANCE || '1000', 10);
    
    // QR expiry time (15 phút)
    this.qrExpiryMinutes = parseInt(process.env.QR_EXPIRY_MINUTES || '15', 10);
  }

  /**
   * Parse payment reference từ transaction content
   * Format: BOOKING-{bookingId}-{checksum}
   * 
   * @param {string} content - Transaction content
   * @returns {Object|null} { bookingId, checksum, reference } hoặc null nếu không tìm thấy
   */
  parsePaymentReference(content) {
    try {
      if (!content || typeof content !== 'string') {
        return null;
      }

      // Pattern: BOOKING{bookingId}{checksum} (không dùng dấu -)
      // bookingId: 24 hex characters (MongoDB ObjectId)
      // checksum: 4 uppercase hex characters
      const pattern = /BOOKING([a-f0-9]{24})([A-F0-9]{4})/i;
      const match = content.match(pattern);

      if (!match) {
        logger.debug('No payment reference found in transaction content', {
          content: content.substring(0, 100) // Log first 100 chars only
        });
        return null;
      }

      const [fullMatch, bookingId, checksum] = match;
      const reference = `BOOKING${bookingId}${checksum.toUpperCase()}`;

      logger.debug('Parsed payment reference', {
        reference,
        bookingId,
        checksum,
        originalMatch: fullMatch
      });

      return {
        bookingId,
        checksum: checksum.toUpperCase(),
        reference
      };
    } catch (error) {
      logger.error('Failed to parse payment reference', {
        error: error.message,
        content
      });
      return null;
    }
  }

  /**
   * Validate checksum của payment reference
   * 
   * @param {string} reference - Payment reference
   * @param {string} bookingId - Booking ID
   * @param {number} amount - Amount
   * @param {number} timestamp - Timestamp khi tạo QR code
   * @returns {boolean} True nếu checksum hợp lệ
   */
  validateChecksum(reference, bookingId, amount, timestamp) {
    try {
      return paymentService.validateChecksumWithTimestamp(
        reference,
        bookingId,
        amount,
        timestamp
      );
    } catch (error) {
      logger.error('Failed to validate checksum', {
        error: error.message,
        reference,
        bookingId
      });
      return false;
    }
  }

  /**
   * Validate amount với tolerance
   * Cho phép sai số ±1000 VND
   * 
   * @param {number} transactionAmount - Số tiền trong giao dịch
   * @param {number} expectedAmount - Số tiền mong đợi
   * @param {number} tolerance - Sai số cho phép (default: 1000 VND)
   * @returns {Object} { isValid, difference, message }
   */
  validateAmount(transactionAmount, expectedAmount, tolerance = null) {
    try {
      const actualTolerance = tolerance !== null ? tolerance : this.amountTolerance;
      
      // Convert to number nếu là string
      const txAmount = typeof transactionAmount === 'string' 
        ? parseFloat(transactionAmount) 
        : transactionAmount;
      
      const expAmount = typeof expectedAmount === 'string'
        ? parseFloat(expectedAmount)
        : expectedAmount;

      if (isNaN(txAmount) || isNaN(expAmount)) {
        return {
          isValid: false,
          difference: 0,
          message: 'Invalid amount format'
        };
      }

      const difference = txAmount - expAmount;
      const absDifference = Math.abs(difference);

      // Số tiền phải bằng hoặc nhiều hơn expected amount (trong tolerance)
      // Cho phép: expected ± tolerance
      const isValid = difference >= -actualTolerance && difference <= actualTolerance;

      let message = '';
      if (!isValid) {
        if (difference < 0) {
          message = `Insufficient amount: ${txAmount} < ${expAmount} (difference: ${Math.abs(difference)})`;
        } else {
          message = `Excess amount: ${txAmount} > ${expAmount} (difference: ${difference})`;
        }
      } else {
        message = 'Amount is valid';
      }

      logger.debug('Amount validation', {
        transactionAmount: txAmount,
        expectedAmount: expAmount,
        difference,
        tolerance: actualTolerance,
        isValid,
        message
      });

      return {
        isValid,
        difference,
        message
      };
    } catch (error) {
      logger.error('Failed to validate amount', {
        error: error.message,
        transactionAmount,
        expectedAmount
      });
      return {
        isValid: false,
        difference: 0,
        message: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Validate timestamp - giao dịch phải trong khoảng thời gian QR code còn hiệu lực
   * 
   * @param {string|Date} transactionTime - Thời gian giao dịch
   * @param {Date} qrCreatedTime - Thời gian tạo QR code
   * @param {number} expiryMinutes - Số phút hết hạn (default: 15)
   * @returns {Object} { isValid, message, minutesDifference }
   */
  validateTimestamp(transactionTime, qrCreatedTime, expiryMinutes = null) {
    try {
      const actualExpiryMinutes = expiryMinutes !== null ? expiryMinutes : this.qrExpiryMinutes;
      
      // Convert to Date object
      const txTime = transactionTime instanceof Date 
        ? transactionTime 
        : new Date(transactionTime);
      
      const qrTime = qrCreatedTime instanceof Date
        ? qrCreatedTime
        : new Date(qrCreatedTime);

      if (isNaN(txTime.getTime()) || isNaN(qrTime.getTime())) {
        return {
          isValid: false,
          message: 'Invalid timestamp format',
          minutesDifference: 0
        };
      }

      // Tính khoảng cách thời gian (phút)
      const timeDifferenceMs = txTime.getTime() - qrTime.getTime();
      const minutesDifference = timeDifferenceMs / (1000 * 60);

      // Giao dịch phải sau khi tạo QR và trong khoảng expiry time
      // Cho phép giao dịch trước QR tạo tối đa 2 phút (do sai lệch đồng hồ)
      const isValid = minutesDifference >= -2 && minutesDifference <= actualExpiryMinutes;

      let message = '';
      if (!isValid) {
        if (minutesDifference < -2) {
          message = `Transaction time is too early: ${Math.abs(minutesDifference).toFixed(2)} minutes before QR created`;
        } else {
          message = `Transaction time is too late: ${minutesDifference.toFixed(2)} minutes after QR created (expired)`;
        }
      } else {
        message = 'Timestamp is valid';
      }

      logger.debug('Timestamp validation', {
        transactionTime: txTime.toISOString(),
        qrCreatedTime: qrTime.toISOString(),
        minutesDifference: minutesDifference.toFixed(2),
        expiryMinutes: actualExpiryMinutes,
        isValid,
        message
      });

      return {
        isValid,
        message,
        minutesDifference: minutesDifference.toFixed(2)
      };
    } catch (error) {
      logger.error('Failed to validate timestamp', {
        error: error.message,
        transactionTime,
        qrCreatedTime
      });
      return {
        isValid: false,
        message: `Validation error: ${error.message}`,
        minutesDifference: 0
      };
    }
  }

  /**
   * Match transaction với booking
   * Thực hiện tất cả các validation: reference, checksum, amount, timestamp
   * 
   * @param {Object} transactionData - Dữ liệu giao dịch từ SeePay
   * @returns {Promise<Object>} Match result
   */
  async matchTransaction(transactionData) {
    try {
      logger.info('Matching transaction', {
        transactionId: transactionData.id,
        amount: transactionData.amount_in,
        content: transactionData.transaction_content?.substring(0, 100)
      });

      const result = {
        matched: false,
        booking: null,
        transaction: transactionData,
        validations: {
          reference: { valid: false, message: '' },
          checksum: { valid: false, message: '' },
          amount: { valid: false, message: '' },
          timestamp: { valid: false, message: '' }
        },
        reason: ''
      };

      // 1. Parse payment reference từ transaction content
      const parsedRef = this.parsePaymentReference(transactionData.transaction_content);
      
      if (!parsedRef) {
        result.reason = 'No valid payment reference found in transaction content';
        result.validations.reference.message = result.reason;
        logger.info('Transaction match failed: no payment reference', {
          transactionId: transactionData.id
        });

        // Log unmatched với payment logger
        paymentLogger.logTransactionMatching({
          transactionId: transactionData.id,
          content: transactionData.transaction_content,
          amount: transactionData.amount_in,
          matched: false,
          reason: result.reason
        });

        return result;
      }

      result.validations.reference.valid = true;
      result.validations.reference.message = 'Payment reference found';

      // 2. Query booking từ database
      const booking = await Booking.findById(parsedRef.bookingId);
      
      if (!booking) {
        result.reason = `Booking not found: ${parsedRef.bookingId}`;
        logger.warn('Transaction match failed: booking not found', {
          transactionId: transactionData.id,
          bookingId: parsedRef.bookingId
        });
        return result;
      }

      result.booking = booking;

      // 3. Kiểm tra booking status - chỉ match với pending_payment
      if (booking.payment.status !== 'pending') {
        result.reason = `Booking payment status is not pending: ${booking.payment.status}`;
        logger.info('Transaction match skipped: booking already processed', {
          transactionId: transactionData.id,
          bookingId: booking._id.toString(),
          paymentStatus: booking.payment.status
        });
        return result;
      }

      // 4. Validate checksum
      if (!booking.payment.qrCode || !booking.payment.qrCode.createdAt) {
        result.reason = 'Booking has no QR code information';
        result.validations.checksum.message = result.reason;
        logger.warn('Transaction match failed: no QR code info', {
          transactionId: transactionData.id,
          bookingId: booking._id.toString()
        });
        return result;
      }

      const qrCreatedTimestamp = new Date(booking.payment.qrCode.createdAt).getTime();
      const isChecksumValid = this.validateChecksum(
        parsedRef.reference,
        parsedRef.bookingId,
        booking.pricing.totalAmount,
        qrCreatedTimestamp
      );

      result.validations.checksum.valid = isChecksumValid;
      result.validations.checksum.message = isChecksumValid 
        ? 'Checksum is valid' 
        : 'Checksum validation failed';

      if (!isChecksumValid) {
        result.reason = 'Invalid checksum';
        logger.warn('Transaction match failed: invalid checksum', {
          transactionId: transactionData.id,
          bookingId: booking._id.toString(),
          reference: parsedRef.reference
        });
        return result;
      }

      // 5. Validate amount
      const amountValidation = this.validateAmount(
        transactionData.amount_in,
        booking.pricing.totalAmount
      );

      result.validations.amount = amountValidation;

      if (!amountValidation.isValid) {
        result.reason = amountValidation.message;
        logger.warn('Transaction match failed: amount mismatch', {
          transactionId: transactionData.id,
          bookingId: booking._id.toString(),
          transactionAmount: transactionData.amount_in,
          expectedAmount: booking.pricing.totalAmount,
          difference: amountValidation.difference
        });
        return result;
      }

      // 6. Validate timestamp
      const timestampValidation = this.validateTimestamp(
        transactionData.transaction_date,
        booking.payment.qrCode.createdAt
      );

      result.validations.timestamp = timestampValidation;

      if (!timestampValidation.isValid) {
        result.reason = timestampValidation.message;
        logger.warn('Transaction match failed: timestamp out of range', {
          transactionId: transactionData.id,
          bookingId: booking._id.toString(),
          transactionTime: transactionData.transaction_date,
          qrCreatedTime: booking.payment.qrCode.createdAt,
          minutesDifference: timestampValidation.minutesDifference
        });
        return result;
      }

      // 7. All validations passed - match successful
      result.matched = true;
      result.reason = 'Transaction matched successfully';

      logger.info('Transaction matched successfully', {
        transactionId: transactionData.id,
        bookingId: booking._id.toString(),
        amount: transactionData.amount_in,
        reference: parsedRef.reference
      });

      // Log transaction matching với payment logger
      paymentLogger.logTransactionMatching({
        transactionId: transactionData.id,
        content: transactionData.transaction_content,
        amount: transactionData.amount_in,
        matched: true,
        bookingId: booking._id.toString()
      });

      return result;
    } catch (error) {
      logger.error('Failed to match transaction', {
        error: error.message,
        stack: error.stack,
        transactionId: transactionData.id
      });
      
      return {
        matched: false,
        booking: null,
        transaction: transactionData,
        validations: {
          reference: { valid: false, message: '' },
          checksum: { valid: false, message: '' },
          amount: { valid: false, message: '' },
          timestamp: { valid: false, message: '' }
        },
        reason: `Matching error: ${error.message}`
      };
    }
  }

  /**
   * Match multiple transactions với bookings
   * Batch processing để tối ưu performance
   * 
   * @param {Array} transactions - Danh sách giao dịch
   * @returns {Promise<Object>} { matched: [], unmatched: [] }
   */
  async matchTransactions(transactions) {
    try {
      logger.info('Matching multiple transactions', {
        count: transactions.length
      });

      const matched = [];
      const unmatched = [];

      for (const transaction of transactions) {
        try {
          const result = await this.matchTransaction(transaction);
          
          if (result.matched) {
            matched.push(result);
          } else {
            unmatched.push(result);
          }
        } catch (error) {
          logger.error('Error matching transaction in batch', {
            error: error.message,
            transactionId: transaction.id
          });
          unmatched.push({
            matched: false,
            transaction,
            reason: `Error: ${error.message}`
          });
        }
      }

      logger.info('Batch matching completed', {
        total: transactions.length,
        matched: matched.length,
        unmatched: unmatched.length
      });

      return {
        matched,
        unmatched
      };
    } catch (error) {
      logger.error('Failed to match transactions batch', {
        error: error.message,
        count: transactions.length
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new TransactionMatcherService();
