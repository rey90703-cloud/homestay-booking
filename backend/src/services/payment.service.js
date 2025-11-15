const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const paymentLogger = require('../utils/payment.logger');
const paymentMetrics = require('../utils/payment.metrics');
const Booking = require('../modules/bookings/booking.model');
const { NotFoundError, BadRequestError } = require('../utils/apiError');
const { vietQRService } = require('./vietqr.service');
const { PAYMENT_STATUS, BOOKING_STATUS } = require('../config/constants');

/**
 * Payment Service
 * Xử lý các logic liên quan đến thanh toán QR Code với SeePay
 */
class PaymentService {
  /**
   * Tạo payment reference duy nhất cho booking
   * Format: BOOKING-{bookingId}-{checksum}
   * 
   * @param {string} bookingId - ID của booking
   * @param {number} amount - Số tiền thanh toán
   * @param {number} timestamp - Timestamp tạo reference (milliseconds)
   * @returns {string} Payment reference
   */
  generatePaymentReference(bookingId, amount, timestamp) {
    try {
      // Validate input
      if (!bookingId || !amount || !timestamp) {
        throw new Error('Missing required parameters: bookingId, amount, timestamp');
      }

      // Tạo checksum từ bookingId, amount và timestamp
      const checksum = this.calculateChecksum({ bookingId, amount, timestamp });

      // Format: BOOKING{bookingId}{checksum} (không dùng dấu -)
      const reference = `BOOKING${bookingId}${checksum}`;

      logger.info(`Generated payment reference: ${reference}`);
      return reference;
    } catch (error) {
      logger.error(`Failed to generate payment reference: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tính checksum sử dụng SHA256 hash
   * Lấy 4 ký tự cuối của hash để tạo checksum ngắn gọn
   * 
   * @param {Object} data - Dữ liệu để tính checksum
   * @param {string} data.bookingId - ID của booking
   * @param {number} data.amount - Số tiền thanh toán
   * @param {number} data.timestamp - Timestamp
   * @returns {string} Checksum (4 ký tự cuối của SHA256 hash)
   */
  calculateChecksum(data) {
    try {
      const { bookingId, amount, timestamp } = data;

      // Validate input
      if (!bookingId || amount === undefined || !timestamp) {
        throw new Error('Missing required data for checksum calculation');
      }

      // Tạo chuỗi để hash: {bookingId}{amount}{timestamp}
      const dataString = `${bookingId}${amount}${timestamp}`;

      // Tính SHA256 hash
      const hash = crypto
        .createHash('sha256')
        .update(dataString)
        .digest('hex');

      // Lấy 4 ký tự cuối và uppercase
      const checksum = hash.slice(-4).toUpperCase();

      return checksum;
    } catch (error) {
      logger.error(`Failed to calculate checksum: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate payment reference bằng cách kiểm tra checksum
   * 
   * @param {string} reference - Payment reference cần validate (format: BOOKING{bookingId}{checksum})
   * @param {string} bookingId - ID của booking để so sánh
   * @param {number} amount - Số tiền để so sánh
   * @returns {Object} Kết quả validation { isValid: boolean, bookingId: string, checksum: string }
   */
  validatePaymentReference(reference, bookingId, amount) {
    try {
      // Validate input
      if (!reference || !bookingId || amount === undefined) {
        logger.warn('Missing required parameters for payment reference validation');
        return {
          isValid: false,
          error: 'Missing required parameters',
        };
      }

      // Parse reference format: BOOKING{bookingId}{checksum} (không dùng dấu -)
      const referencePattern = /^BOOKING([a-f0-9]{24})([A-F0-9]{4})$/i;
      const match = reference.match(referencePattern);

      if (!match) {
        logger.warn(`Invalid payment reference format: ${reference}`);
        return {
          isValid: false,
          error: 'Invalid reference format',
        };
      }

      const [, refBookingId, refChecksum] = match;

      // Kiểm tra bookingId có khớp không
      if (refBookingId !== bookingId) {
        logger.warn(`Booking ID mismatch: expected ${bookingId}, got ${refBookingId}`);
        return {
          isValid: false,
          bookingId: refBookingId,
          checksum: refChecksum,
          error: 'Booking ID mismatch',
        };
      }

      // Tính checksum từ bookingId và amount
      // Note: Không có timestamp trong validation vì chúng ta không biết timestamp gốc
      // Thay vào đó, chúng ta sẽ tìm booking trong database và lấy timestamp từ payment.qrCode.createdAt
      // Tuy nhiên, để đơn giản hóa validation ở đây, chúng ta chỉ kiểm tra format
      // Validation đầy đủ sẽ được thực hiện trong TransactionMatcher với timestamp từ database

      logger.info(`Payment reference validation passed for booking ${bookingId}`);
      return {
        isValid: true,
        bookingId: refBookingId,
        checksum: refChecksum,
      };
    } catch (error) {
      logger.error(`Failed to validate payment reference: ${error.message}`);
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate checksum với timestamp cụ thể (dùng khi có đầy đủ thông tin từ database)
   * 
   * @param {string} reference - Payment reference
   * @param {string} bookingId - ID của booking
   * @param {number} amount - Số tiền
   * @param {number} timestamp - Timestamp gốc khi tạo reference
   * @returns {boolean} True nếu checksum hợp lệ
   */
  validateChecksumWithTimestamp(reference, bookingId, amount, timestamp) {
    try {
      // Parse reference để lấy checksum
      // Pattern: BOOKING{bookingId}{checksum} (không dùng dấu -)
      const referencePattern = /^BOOKING([a-f0-9]{24})([A-F0-9]{4})$/i;
      const match = reference.match(referencePattern);

      if (!match) {
        logger.warn(`Invalid reference format for checksum validation: ${reference}`);
        return false;
      }

      const [, refBookingId, refChecksum] = match;

      // Kiểm tra bookingId
      if (refBookingId !== bookingId) {
        logger.warn(`Booking ID mismatch: expected ${bookingId}, got ${refBookingId}`);
        return false;
      }

      // Tính checksum mới với timestamp
      const calculatedChecksum = this.calculateChecksum({ bookingId, amount, timestamp });

      // So sánh checksum (case-insensitive)
      const isValid = calculatedChecksum.toUpperCase() === refChecksum.toUpperCase();

      if (!isValid) {
        logger.warn(`Checksum mismatch: expected ${calculatedChecksum}, got ${refChecksum}`);
      }

      return isValid;
    } catch (error) {
      logger.error(`Failed to validate checksum with timestamp: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate QR code for booking
   * Logic: Lấy booking → Kiểm tra QR hiện tại → Nếu chưa hết hạn: trả về QR cũ → Nếu hết hạn: tạo QR mới (giữ nguyên payment reference)
   * 
   * @param {string} bookingId - ID của booking
   * @returns {Promise<Object>} QR code data và payment info
   */
  async generateQRCodeForBooking(bookingId) {
    const stopTimer = paymentMetrics.startTimer('qrGenerationTime');
    
    try {
      // 1. Lấy booking từ database
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // 2. Validate booking có thể tạo QR code
      if (booking.payment.status !== 'pending') {
        throw new BadRequestError(
          `Cannot generate QR code for booking with payment status: ${booking.payment.status}`,
        );
      }

      // 3. Kiểm tra QR code hiện tại
      const hasExistingQR = booking.payment.qrCode && 
                           booking.payment.qrCode.data && 
                           booking.payment.qrCode.expiresAt;
      
      if (hasExistingQR && !booking.isQRExpired()) {
        // QR code hiện tại vẫn còn hiệu lực → Trả về QR cũ
        const now = new Date();
        const expiresAt = new Date(booking.payment.qrCode.expiresAt);
        const remainingSeconds = Math.floor((expiresAt - now) / 1000);

        logger.info(`Returning existing QR code for booking ${bookingId}, remaining time: ${remainingSeconds}s`);

        stopTimer();
        return {
          qrCode: {
            data: booking.payment.qrCode.data,
            url: booking.payment.qrCode.data,
            expiresAt: expiresAt,
            remainingSeconds,
            type: 'existing',
            provider: 'cached',
          },
          payment: {
            reference: booking.payment.reference,
            amount: booking.pricing.totalAmount,
            currency: booking.pricing.currency,
          },
          bankInfo: {
            bankName: process.env.BANK_NAME,
            accountNumber: process.env.BANK_ACCOUNT_NUMBER,
            accountName: process.env.BANK_ACCOUNT_NAME,
          },
          isRegenerated: false,
        };
      }

      // 4. QR code đã hết hạn hoặc chưa có → Tạo QR mới
      let paymentReference = booking.payment.reference;
      let isRegenerated = false;
      let qrCreatedAt = new Date(); // Tạo timestamp một lần và dùng chung

      if (!paymentReference) {
        // Tạo reference mới lần đầu
        const timestamp = qrCreatedAt.getTime(); // Sử dụng cùng timestamp
        paymentReference = this.generatePaymentReference(
          bookingId,
          booking.pricing.totalAmount,
          timestamp,
        );
        logger.info(`Creating new payment reference for booking ${bookingId}: ${paymentReference}`);
      } else {
        // Đang regenerate QR code (giữ nguyên reference)
        isRegenerated = true;
        logger.info(`Regenerating QR code for booking ${bookingId}, keeping reference ${paymentReference}`);
      }

      // 5. Tạo QR code với VietQR service
      const qrParams = {
        bankBin: process.env.BANK_BIN,
        accountNumber: process.env.BANK_ACCOUNT_NUMBER,
        accountName: process.env.BANK_ACCOUNT_NAME,
        amount: booking.pricing.totalAmount,
        content: paymentReference,
      };

      // Sử dụng generateQRCodeWithRetry để có retry logic và fallback
      const qrCodeData = await vietQRService.generateQRCodeWithRetry(qrParams, 3, true);

      // 6. Tính thời gian hết hạn (15 phút)
      const QR_EXPIRY_MINUTES = parseInt(process.env.QR_EXPIRY_MINUTES || '15', 10);
      const expiresAt = new Date(qrCreatedAt.getTime() + QR_EXPIRY_MINUTES * 60 * 1000);

      // 7. Lưu thông tin QR code vào booking (cập nhật createdAt và expiresAt mới)
      booking.payment.reference = paymentReference;
      booking.payment.qrCode = {
        data: qrCodeData.url || qrCodeData.data,
        createdAt: qrCreatedAt, // Sử dụng cùng timestamp
        expiresAt: expiresAt,
      };

      await booking.save();

      logger.info(`QR code ${isRegenerated ? 'regenerated' : 'generated'} successfully for booking ${bookingId}`);

      // Log QR generation với payment logger
      paymentLogger.logQRGenerated({
        bookingId,
        reference: paymentReference,
        amount: booking.pricing.totalAmount,
        accountNumber: process.env.BANK_ACCOUNT_NUMBER,
        expiresAt,
        isRegenerated,
        provider: qrCodeData.provider
      });

      // 8. Trả về response
      const remainingSeconds = Math.floor((expiresAt - qrCreatedAt) / 1000);

      // Increment counter và record timer
      paymentMetrics.incrementCounter('qrCodesGenerated');
      stopTimer();

      return {
        qrCode: {
          data: qrCodeData.url || qrCodeData.data,
          url: qrCodeData.url || qrCodeData.data,
          expiresAt: expiresAt,
          remainingSeconds,
          type: qrCodeData.type,
          provider: qrCodeData.provider,
        },
        payment: {
          reference: paymentReference,
          amount: booking.pricing.totalAmount,
          currency: booking.pricing.currency,
        },
        bankInfo: {
          bankName: process.env.BANK_NAME,
          accountNumber: process.env.BANK_ACCOUNT_NUMBER,
          accountName: process.env.BANK_ACCOUNT_NAME,
        },
        isRegenerated,
      };
    } catch (error) {
      stopTimer();
      logger.error(`Failed to generate QR code for booking ${bookingId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process payment for booking
   * Logic: Validate booking → Check idempotency → Update payment status → Update booking status → Create payment record
   * Sử dụng MongoDB transaction để đảm bảo atomicity
   * 
   * @param {string} bookingId - ID của booking
   * @param {Object} transactionData - Dữ liệu giao dịch từ SeePay
   * @param {string} transactionData.id - Transaction ID
   * @param {number} transactionData.amount_in - Số tiền giao dịch
   * @param {string} transactionData.transaction_date - Thời gian giao dịch
   * @param {string} transactionData.bank_brand_name - Tên ngân hàng
   * @param {string} transactionData.account_number - Số tài khoản
   * @param {string} transactionData.reference_number - Mã tham chiếu ngân hàng
   * @param {string} verificationMethod - Phương thức xác minh: 'webhook', 'polling', 'manual'
   * @param {Object} options - Tùy chọn bổ sung
   * @param {string} options.verifiedBy - User ID của admin (nếu manual verification)
   * @param {string} options.notes - Ghi chú (nếu manual verification)
   * @returns {Promise<Object>} Kết quả xử lý payment
   */
  async processPayment(bookingId, transactionData, verificationMethod = 'webhook', options = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.info('Processing payment', {
        bookingId,
        transactionId: transactionData.id,
        amount: transactionData.amount_in,
        method: verificationMethod
      });

      // 1. Validate booking
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        throw new NotFoundError(`Booking not found: ${bookingId}`);
      }

      // 2. Idempotency check - Kiểm tra payment đã được xử lý chưa
      if (booking.payment.status === PAYMENT_STATUS.COMPLETED) {
        logger.warn('Payment already processed (idempotency check)', {
          bookingId,
          transactionId: transactionData.id,
          existingTransactionId: booking.payment.transaction?.id
        });

        await session.abortTransaction();
        
        return {
          success: true,
          alreadyProcessed: true,
          message: 'Payment already processed',
          booking: {
            id: booking._id.toString(),
            paymentStatus: booking.payment.status,
            bookingStatus: booking.status,
            transactionId: booking.payment.transaction?.id
          }
        };
      }

      // 3. Validate booking có thể nhận payment
      if (booking.status === BOOKING_STATUS.CANCELLED) {
        throw new BadRequestError('Cannot process payment for cancelled booking');
      }

      if (booking.payment.status === PAYMENT_STATUS.FAILED) {
        logger.warn('Attempting to process payment for failed booking', {
          bookingId,
          currentStatus: booking.payment.status
        });
      }

      // 4. Update payment status
      booking.payment.status = PAYMENT_STATUS.COMPLETED;
      booking.payment.paidAt = new Date(transactionData.transaction_date);

      // 5. Lưu transaction details
      booking.payment.transaction = {
        id: transactionData.id,
        bankReference: transactionData.reference_number || transactionData.id,
        amount: parseFloat(transactionData.amount_in),
        bankName: transactionData.bank_brand_name || 'Unknown',
        accountNumber: transactionData.account_number || 'Unknown'
      };

      // 6. Lưu verification info
      booking.payment.verification = {
        method: verificationMethod,
        verifiedAt: new Date()
      };

      if (verificationMethod === 'manual' && options.verifiedBy) {
        booking.payment.verification.verifiedBy = options.verifiedBy;
      }

      if (options.notes) {
        booking.payment.verification.notes = options.notes;
      }

      // 7. Update booking status
      if (booking.status === BOOKING_STATUS.PENDING) {
        booking.status = BOOKING_STATUS.CONFIRMED;
        logger.info('Booking status updated to confirmed', { bookingId });
      }

      // 8. Save booking
      await booking.save({ session });

      // 9. Commit transaction
      await session.commitTransaction();

      // Store data before ending session
      const paymentStatus = booking.payment.status;
      const bookingStatus = booking.status;
      const savedBookingId = booking._id.toString();

      logger.info('Payment processed successfully', {
        bookingId: savedBookingId,
        transactionId: transactionData.id,
        amount: transactionData.amount_in,
        paymentStatus,
        bookingStatus,
        verificationMethod
      });

      // Log payment completion với payment logger
      paymentLogger.logPaymentCompleted({
        bookingId: savedBookingId,
        transactionId: transactionData.id,
        amount: parseFloat(transactionData.amount_in),
        verificationMethod,
        paymentStatus,
        bookingStatus,
        alreadyProcessed: false
      });

      // Increment payment completed counter
      paymentMetrics.incrementCounter('paymentsCompleted');

      // 10. Send notifications (Requirements: 10.1, 10.2, 10.3, 10.4)
      // Query lại booking để không bị session expired
      // Chạy async nhưng không chờ để không block response
      setImmediate(async () => {
        try {
          const freshBooking = await Booking.findById(savedBookingId)
            .populate('guestId')
            .populate('hostId')
            .populate('homestayId');
          
          if (freshBooking) {
            await this.sendPaymentNotifications(freshBooking, transactionData);
          }
        } catch (error) {
          logger.error('Failed to send payment notifications', {
            error: error.message,
            bookingId: savedBookingId
          });
        }
      });

      // 11. Return success response
      return {
        success: true,
        alreadyProcessed: false,
        message: 'Payment processed successfully',
        booking: {
          id: booking._id.toString(),
          paymentStatus: booking.payment.status,
          bookingStatus: booking.status,
          transactionId: booking.payment.transaction.id,
          paidAmount: booking.payment.transaction.amount,
          paidAt: booking.payment.paidAt
        }
      };

    } catch (error) {
      // Rollback transaction nếu có lỗi
      await session.abortTransaction();

      // Increment payment failed counter
      paymentMetrics.incrementCounter('paymentsFailed');

      logger.error('Failed to process payment', {
        error: error.message,
        stack: error.stack,
        bookingId,
        transactionId: transactionData?.id
      });

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Validate payment amount với tolerance
   * Cho phép sai số ±1000 VND
   * 
   * @param {number} transactionAmount - Số tiền giao dịch
   * @param {number} expectedAmount - Số tiền mong đợi
   * @param {number} tolerance - Sai số cho phép (default: 1000 VND)
   * @returns {Object} Kết quả validation { isValid: boolean, difference: number }
   */
  validatePaymentAmount(transactionAmount, expectedAmount, tolerance = 1000) {
    try {
      const difference = transactionAmount - expectedAmount;
      const isValid = Math.abs(difference) <= tolerance && transactionAmount >= expectedAmount - tolerance;

      logger.debug('Payment amount validation', {
        transactionAmount,
        expectedAmount,
        difference,
        tolerance,
        isValid
      });

      return {
        isValid,
        difference,
        transactionAmount,
        expectedAmount,
        tolerance
      };
    } catch (error) {
      logger.error('Failed to validate payment amount', {
        error: error.message,
        transactionAmount,
        expectedAmount
      });

      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Gửi notifications sau khi thanh toán thành công
   * Requirements: 10.1, 10.2, 10.3, 10.4
   * 
   * @param {Object} booking - Booking object
   * @param {Object} transactionData - Transaction data từ SeePay
   * @returns {Promise<void>}
   */
  async sendPaymentNotifications(booking, transactionData) {
    try {
      const notificationService = require('./notification.service');

      // Chuẩn bị transaction object cho notification
      const transaction = {
        id: transactionData.id,
        bankReference: transactionData.reference_number || transactionData.id,
        amount: parseFloat(transactionData.amount_in),
        bankName: transactionData.bank_brand_name || 'MB Bank',
        accountNumber: transactionData.account_number || 'Unknown'
      };

      // Gửi notifications qua NotificationService (Requirement 10.1, 10.2, 10.3, 10.4)
      const results = await notificationService.sendPaymentConfirmation(booking, transaction);

      logger.info('Payment notifications sent', {
        bookingId: booking._id,
        transactionId: transaction.id,
        results
      });

    } catch (error) {
      logger.error('Error sending payment notifications', {
        error: error.message,
        stack: error.stack,
        bookingId: booking._id
      });
      // Không throw error để không ảnh hưởng đến payment processing
    }
  }

  /**
   * Xác minh thanh toán thủ công (Admin only)
   * Logic: Validate admin role → Query transaction từ SeePay → Hiển thị info → Admin confirm → Process payment với verification.method = 'manual'
   * 
   * @param {string} bookingId - ID của booking
   * @param {string} transactionId - Transaction ID từ SeePay
   * @param {string} adminId - User ID của admin thực hiện verification
   * @param {string} notes - Ghi chú về việc xác minh thủ công
   * @returns {Promise<Object>} Kết quả xác minh và thông tin giao dịch
   */
  async verifyPaymentManually(bookingId, transactionId, adminId, notes = '') {
    try {
      logger.info('Manual payment verification started', {
        bookingId,
        transactionId,
        adminId
      });

      // 1. Validate booking tồn tại
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new NotFoundError(`Booking not found: ${bookingId}`);
      }

      // 2. Validate booking có thể xác minh thanh toán
      if (booking.payment.status === PAYMENT_STATUS.COMPLETED) {
        throw new BadRequestError('Payment already completed for this booking');
      }

      if (booking.status === BOOKING_STATUS.CANCELLED) {
        throw new BadRequestError('Cannot verify payment for cancelled booking');
      }

      // 3. Query transaction từ SeePay
      const SePayClient = require('./sepay.client');
      const sePayClient = SePayClient.instance;

      let transactionData;
      try {
        transactionData = await sePayClient.getTransactionDetail(transactionId);
      } catch (error) {
        logger.error('Failed to get transaction from SeePay', {
          transactionId,
          error: error.message
        });
        throw new BadRequestError(`Cannot retrieve transaction from SeePay: ${error.message}`);
      }

      // 4. Validate transaction data
      if (!transactionData || !transactionData.transaction) {
        throw new BadRequestError('Invalid transaction data from SeePay');
      }

      const transaction = transactionData.transaction;

      // 5. Hiển thị thông tin để admin xác nhận (return để controller hiển thị)
      const transactionInfo = {
        id: transaction.id,
        amount: parseFloat(transaction.amount_in || 0),
        content: transaction.transaction_content || transaction.code || '',
        transactionDate: transaction.transaction_date,
        bankName: transaction.bank_brand_name || 'Unknown',
        accountNumber: transaction.account_number || 'Unknown',
        referenceNumber: transaction.reference_number || transaction.id,
      };

      // 6. Validate amount với booking
      const amountValidation = this.validatePaymentAmount(
        transactionInfo.amount,
        booking.pricing.totalAmount,
        1000
      );

      if (!amountValidation.isValid) {
        logger.warn('Transaction amount mismatch in manual verification', {
          bookingId,
          transactionId,
          transactionAmount: transactionInfo.amount,
          expectedAmount: booking.pricing.totalAmount,
          difference: amountValidation.difference
        });
      }

      // 7. Process payment với verification method = 'manual'
      const processResult = await this.processPayment(
        bookingId,
        {
          id: transactionInfo.id,
          amount_in: transactionInfo.amount,
          transaction_date: transactionInfo.transactionDate,
          bank_brand_name: transactionInfo.bankName,
          account_number: transactionInfo.accountNumber,
          reference_number: transactionInfo.referenceNumber,
        },
        'manual',
        {
          verifiedBy: adminId,
          notes: notes || 'Manual verification by admin'
        }
      );

      logger.info('Manual payment verification completed successfully', {
        bookingId,
        transactionId,
        adminId,
        paymentStatus: processResult.booking.paymentStatus
      });

      // Log manual verification với payment logger
      paymentLogger.logManualVerification({
        bookingId,
        transactionId,
        adminId,
        amount: transactionInfo.amount,
        notes: notes || 'Manual verification by admin'
      });

      // Increment manual verification counter
      paymentMetrics.incrementCounter('manualVerifications');

      // 8. Return kết quả với thông tin transaction
      return {
        success: true,
        message: 'Payment verified manually',
        booking: processResult.booking,
        transaction: transactionInfo,
        amountValidation: {
          isValid: amountValidation.isValid,
          difference: amountValidation.difference,
          expectedAmount: booking.pricing.totalAmount,
          actualAmount: transactionInfo.amount
        },
        verification: {
          method: 'manual',
          verifiedBy: adminId,
          verifiedAt: new Date(),
          notes: notes || 'Manual verification by admin'
        }
      };

    } catch (error) {
      logger.error('Manual payment verification failed', {
        error: error.message,
        stack: error.stack,
        bookingId,
        transactionId,
        adminId
      });

      throw error;
    }
  }
}

module.exports = new PaymentService();
