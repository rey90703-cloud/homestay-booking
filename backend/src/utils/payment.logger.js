const winston = require('winston');
const logger = require('./logger');

/**
 * Payment Logger
 * Custom logger cho Payment System với các tính năng:
 * - Specialized log methods cho payment events
 * - Automatic masking của sensitive data
 * - Structured logging với metadata
 */
class PaymentLogger {
  constructor() {
    this.baseLogger = logger;
    this.serviceName = 'payment-system';
  }

  /**
   * Mask sensitive data trong string
   * - Account numbers: Chỉ hiển thị 4 số cuối
   * - API keys: Chỉ hiển thị 8 ký tự đầu
   * 
   * @param {string} value - Giá trị cần mask
   * @param {string} type - Loại data: 'account' hoặc 'apikey'
   * @returns {string} Masked value
   * @private
   */
  _maskSensitiveData(value, type = 'account') {
    if (!value || typeof value !== 'string') {
      return value;
    }

    if (type === 'account') {
      // Mask account number: hiển thị 4 số cuối
      if (value.length <= 4) {
        return value;
      }
      const lastFour = value.slice(-4);
      const masked = '*'.repeat(value.length - 4);
      return masked + lastFour;
    }

    if (type === 'apikey') {
      // Mask API key: hiển thị 8 ký tự đầu
      if (value.length <= 8) {
        return value;
      }
      const firstEight = value.slice(0, 8);
      const masked = '*'.repeat(value.length - 8);
      return firstEight + masked;
    }

    return value;
  }

  /**
   * Mask sensitive fields trong object
   * Tự động detect và mask các trường nhạy cảm
   * 
   * @param {Object} data - Object chứa data
   * @returns {Object} Object với sensitive data đã được mask
   * @private
   */
  _maskObjectData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const maskedData = { ...data };

    // Danh sách các field cần mask
    const sensitiveFields = {
      accountNumber: 'account',
      account_number: 'account',
      bankAccountNumber: 'account',
      apiKey: 'apikey',
      api_key: 'apikey',
      token: 'apikey',
      secret: 'apikey',
      webhookSecret: 'apikey',
      sepayApiKey: 'apikey',
      sepayApiToken: 'apikey'
    };

    // Mask các field nhạy cảm
    Object.keys(sensitiveFields).forEach(field => {
      if (maskedData[field]) {
        const maskType = sensitiveFields[field];
        maskedData[field] = this._maskSensitiveData(maskedData[field], maskType);
      }
    });

    // Recursive mask cho nested objects
    Object.keys(maskedData).forEach(key => {
      if (maskedData[key] && typeof maskedData[key] === 'object' && !Array.isArray(maskedData[key])) {
        maskedData[key] = this._maskObjectData(maskedData[key]);
      }
    });

    return maskedData;
  }

  /**
   * Build log metadata với service name và masked data
   * 
   * @param {Object} metadata - Metadata object
   * @returns {Object} Formatted metadata
   * @private
   */
  _buildMetadata(metadata = {}) {
    const maskedMetadata = this._maskObjectData(metadata);
    
    return {
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      ...maskedMetadata
    };
  }

  /**
   * Log QR Code generated event
   * Requirements: 8.1
   * 
   * @param {Object} data - QR generation data
   * @param {string} data.bookingId - Booking ID
   * @param {string} data.reference - Payment reference
   * @param {number} data.amount - Payment amount
   * @param {string} data.accountNumber - Bank account number (will be masked)
   * @param {Date} data.expiresAt - QR expiry time
   * @param {boolean} data.isRegenerated - Whether QR was regenerated
   */
  logQRGenerated(data) {
    const metadata = this._buildMetadata({
      event: 'qr_generated',
      bookingId: data.bookingId,
      reference: data.reference,
      amount: data.amount,
      accountNumber: data.accountNumber,
      expiresAt: data.expiresAt,
      isRegenerated: data.isRegenerated || false,
      provider: data.provider || 'vietqr'
    });

    this.baseLogger.info('QR Code generated', metadata);
  }

  /**
   * Log payment completed event
   * Requirements: 8.1
   * 
   * @param {Object} data - Payment completion data
   * @param {string} data.bookingId - Booking ID
   * @param {string} data.transactionId - Transaction ID
   * @param {number} data.amount - Payment amount
   * @param {string} data.verificationMethod - Verification method (webhook/polling/manual)
   * @param {string} data.paymentStatus - Payment status
   * @param {string} data.bookingStatus - Booking status
   * @param {boolean} data.alreadyProcessed - Whether payment was already processed (idempotency)
   */
  logPaymentCompleted(data) {
    const metadata = this._buildMetadata({
      event: 'payment_completed',
      bookingId: data.bookingId,
      transactionId: data.transactionId,
      amount: data.amount,
      verificationMethod: data.verificationMethod,
      paymentStatus: data.paymentStatus,
      bookingStatus: data.bookingStatus,
      alreadyProcessed: data.alreadyProcessed || false
    });

    this.baseLogger.info('Payment completed', metadata);
  }

  /**
   * Log webhook received event
   * Requirements: 8.1, 8.2
   * 
   * @param {Object} data - Webhook data
   * @param {string} data.transactionId - Transaction ID
   * @param {number} data.amount - Transaction amount
   * @param {string} data.content - Transaction content
   * @param {boolean} data.signatureValid - Whether signature was valid
   * @param {string} data.ip - Request IP address
   * @param {boolean} data.matched - Whether transaction matched a booking
   * @param {string} data.bookingId - Booking ID (if matched)
   */
  logWebhookReceived(data) {
    const metadata = this._buildMetadata({
      event: 'webhook_received',
      transactionId: data.transactionId,
      amount: data.amount,
      content: data.content?.substring(0, 50), // Truncate long content
      signatureValid: data.signatureValid,
      ip: data.ip,
      matched: data.matched,
      bookingId: data.bookingId
    });

    const level = data.signatureValid ? 'info' : 'warn';
    this.baseLogger[level]('Webhook received', metadata);
  }

  /**
   * Log polling result event
   * Requirements: 8.1
   * 
   * @param {Object} data - Polling result data
   * @param {number} data.bookingsChecked - Number of bookings checked
   * @param {number} data.transactionsChecked - Number of transactions checked
   * @param {number} data.matched - Number of matches found
   * @param {number} data.failed - Number of failures
   * @param {number} data.duration - Polling duration in ms
   * @param {number} data.pollCount - Total poll count
   */
  logPollingResult(data) {
    const metadata = this._buildMetadata({
      event: 'polling_completed',
      bookingsChecked: data.bookingsChecked,
      transactionsChecked: data.transactionsChecked,
      matched: data.matched,
      failed: data.failed,
      duration: `${data.duration}ms`,
      pollCount: data.pollCount
    });

    this.baseLogger.info('Polling cycle completed', metadata);
  }

  /**
   * Log payment verification (manual) event
   * Requirements: 8.1
   * 
   * @param {Object} data - Manual verification data
   * @param {string} data.bookingId - Booking ID
   * @param {string} data.transactionId - Transaction ID
   * @param {string} data.adminId - Admin user ID
   * @param {number} data.amount - Payment amount
   * @param {string} data.notes - Verification notes
   */
  logManualVerification(data) {
    const metadata = this._buildMetadata({
      event: 'manual_verification',
      bookingId: data.bookingId,
      transactionId: data.transactionId,
      adminId: data.adminId,
      amount: data.amount,
      notes: data.notes
    });

    this.baseLogger.info('Manual payment verification', metadata);
  }

  /**
   * Log unmatched transaction event
   * Requirements: 8.1, 8.2
   * 
   * @param {Object} data - Unmatched transaction data
   * @param {string} data.transactionId - Transaction ID
   * @param {number} data.amount - Transaction amount
   * @param {string} data.content - Transaction content
   * @param {string} data.reason - Reason for not matching
   */
  logUnmatchedTransaction(data) {
    const metadata = this._buildMetadata({
      event: 'unmatched_transaction',
      transactionId: data.transactionId,
      amount: data.amount,
      content: data.content?.substring(0, 50),
      reason: data.reason
    });

    this.baseLogger.warn('Unmatched transaction created', metadata);
  }

  /**
   * Log payment error event
   * Requirements: 8.2
   * 
   * @param {Object} data - Error data
   * @param {string} data.operation - Operation that failed
   * @param {string} data.error - Error message
   * @param {string} data.bookingId - Booking ID (if applicable)
   * @param {string} data.transactionId - Transaction ID (if applicable)
   * @param {Object} data.context - Additional context
   */
  logPaymentError(data) {
    const metadata = this._buildMetadata({
      event: 'payment_error',
      operation: data.operation,
      error: data.error,
      bookingId: data.bookingId,
      transactionId: data.transactionId,
      context: data.context
    });

    this.baseLogger.error('Payment operation failed', metadata);
  }

  /**
   * Log SeePay API call
   * Requirements: 8.1, 8.3
   * 
   * @param {Object} data - API call data
   * @param {string} data.endpoint - API endpoint
   * @param {string} data.method - HTTP method
   * @param {number} data.statusCode - Response status code
   * @param {number} data.duration - Request duration in ms
   * @param {boolean} data.success - Whether request was successful
   * @param {string} data.error - Error message (if failed)
   */
  logSePayAPICall(data) {
    const metadata = this._buildMetadata({
      event: 'sepay_api_call',
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      duration: `${data.duration}ms`,
      success: data.success
    });

    if (data.error) {
      metadata.error = data.error;
    }

    const level = data.success ? 'info' : 'error';
    this.baseLogger[level]('SeePay API call', metadata);
  }

  /**
   * Log VietQR generation
   * Requirements: 8.1, 8.3
   * 
   * @param {Object} data - VietQR generation data
   * @param {string} data.bookingId - Booking ID
   * @param {number} data.amount - Amount
   * @param {string} data.accountNumber - Account number (will be masked)
   * @param {string} data.provider - QR provider (vietqr/fallback)
   * @param {boolean} data.success - Whether generation was successful
   * @param {string} data.error - Error message (if failed)
   */
  logVietQRGeneration(data) {
    const metadata = this._buildMetadata({
      event: 'vietqr_generation',
      bookingId: data.bookingId,
      amount: data.amount,
      accountNumber: data.accountNumber,
      provider: data.provider,
      success: data.success
    });

    if (data.error) {
      metadata.error = data.error;
    }

    const level = data.success ? 'info' : 'error';
    this.baseLogger[level]('VietQR generation', metadata);
  }

  /**
   * Log transaction matching attempt
   * Requirements: 8.1
   * 
   * @param {Object} data - Matching data
   * @param {string} data.transactionId - Transaction ID
   * @param {string} data.content - Transaction content
   * @param {number} data.amount - Transaction amount
   * @param {boolean} data.matched - Whether match was found
   * @param {string} data.bookingId - Booking ID (if matched)
   * @param {string} data.reason - Reason for not matching (if not matched)
   */
  logTransactionMatching(data) {
    const metadata = this._buildMetadata({
      event: 'transaction_matching',
      transactionId: data.transactionId,
      content: data.content?.substring(0, 50),
      amount: data.amount,
      matched: data.matched,
      bookingId: data.bookingId,
      reason: data.reason
    });

    const level = data.matched ? 'info' : 'warn';
    this.baseLogger[level]('Transaction matching', metadata);
  }

  /**
   * Generic info log với automatic masking
   * 
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  info(message, metadata = {}) {
    const maskedMetadata = this._buildMetadata(metadata);
    this.baseLogger.info(message, maskedMetadata);
  }

  /**
   * Generic warn log với automatic masking
   * 
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  warn(message, metadata = {}) {
    const maskedMetadata = this._buildMetadata(metadata);
    this.baseLogger.warn(message, maskedMetadata);
  }

  /**
   * Generic error log với automatic masking
   * 
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  error(message, metadata = {}) {
    const maskedMetadata = this._buildMetadata(metadata);
    this.baseLogger.error(message, metadata);
  }

  /**
   * Generic debug log với automatic masking
   * 
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  debug(message, metadata = {}) {
    const maskedMetadata = this._buildMetadata(metadata);
    this.baseLogger.debug(message, maskedMetadata);
  }
}

// Export singleton instance
module.exports = new PaymentLogger();

