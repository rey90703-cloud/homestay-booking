const crypto = require('crypto');
const logger = require('../utils/logger');
const paymentLogger = require('../utils/payment.logger');
const paymentMetrics = require('../utils/payment.metrics');
const transactionMatcher = require('./transaction-matcher.service');
const paymentService = require('./payment.service');
const Booking = require('../modules/bookings/booking.model');
const UnmatchedTransaction = require('../models/unmatchedTransaction.model');
const { PAYMENT_STATUS, BOOKING_STATUS } = require('../config/constants');

/**
 * Webhook constants
 */
const WEBHOOK_CONSTANTS = {
  HEADER_SIGNATURE: 'x-signature',
  ENV_SECRET: 'SEPAY_WEBHOOK_SECRET',
  SIGNATURE_ALGORITHM: 'sha256',
  SIGNATURE_LENGTH: 64,
  QUERY_PATHS: {
    TRANSACTION_ID: 'payment.transaction.id',
  },
};

/**
 * HTTP Status codes
 */
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
};

/**
 * Webhook Handler Service
 * Xử lý webhook từ SeePay khi có giao dịch mới
 */
class WebhookHandler {
  /**
   * Verify HMAC-SHA256 signature từ SeePay
   * 
   * @param {string|Object} payload - Raw payload hoặc JSON object
   * @param {string} signature - Signature từ header X-Signature
   * @param {string} secret - Webhook secret key
   * @returns {boolean} True nếu signature hợp lệ
   */
  verifySignature(payload, signature, secret) {
    try {
      if (!payload || !signature || !secret) {
        logger.warn('Missing required parameters for signature verification', {
          hasPayload: !!payload,
          hasSignature: !!signature,
          hasSecret: !!secret
        });
        return false;
      }

      // Validate signature format (hex string 64 chars)
      const signatureRegex = new RegExp(`^[a-f0-9]{${WEBHOOK_CONSTANTS.SIGNATURE_LENGTH}}$`, 'i');
      if (!signatureRegex.test(signature)) {
        logger.warn('Invalid signature format', {
          signature: signature.substring(0, 10) + '...',
          expectedLength: WEBHOOK_CONSTANTS.SIGNATURE_LENGTH
        });
        return false;
      }

      // Convert payload to string nếu là object
      const payloadString = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload);

      // Tính HMAC-SHA256
      const expectedSignature = crypto
        .createHmac(WEBHOOK_CONSTANTS.SIGNATURE_ALGORITHM, secret)
        .update(payloadString)
        .digest('hex');

      // So sánh signature (case-insensitive)
      const isValid = expectedSignature.toLowerCase() === signature.toLowerCase();

      if (!isValid) {
        logger.warn('Signature verification failed', {
          expected: expectedSignature.substring(0, 10) + '...',
          received: signature.substring(0, 10) + '...'
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying signature', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Parse JSON payload từ webhook
   * 
   * @param {string|Object} payload - Raw payload string hoặc parsed object
   * @returns {Object|null} Parsed payload hoặc null nếu invalid
   */
  parsePayload(payload) {
    try {
      // Nếu đã là object thì return luôn
      if (typeof payload === 'object' && payload !== null) {
        return payload;
      }

      // Parse JSON string
      if (typeof payload === 'string') {
        return JSON.parse(payload);
      }

      logger.warn('Invalid payload type', {
        type: typeof payload
      });
      return null;
    } catch (error) {
      logger.error('Failed to parse payload', {
        error: error.message,
        payload: typeof payload === 'string' ? payload.substring(0, 100) : payload
      });
      return null;
    }
  }

  /**
   * Validate transaction ID
   * @private
   */
  _validateTransactionId(data, errors) {
    if (!data.id || typeof data.id !== 'string') {
      errors.push('Missing or invalid transaction ID');
    }
  }

  /**
   * Validate and parse amount
   * @private
   */
  _validateAmount(data, errors) {
    if (data.amount_in === undefined || data.amount_in === null) {
      errors.push('Missing amount_in');
      return;
    }

    if (typeof data.amount_in !== 'number' && typeof data.amount_in !== 'string') {
      errors.push('Invalid amount_in type');
      return;
    }

    const amount = typeof data.amount_in === 'string' 
      ? parseFloat(data.amount_in) 
      : data.amount_in;
    
    if (isNaN(amount) || amount <= 0) {
      errors.push('Invalid amount_in value');
    }
  }

  /**
   * Validate transaction content
   * @private
   */
  _validateTransactionContent(data, errors) {
    if (!data.transaction_content || typeof data.transaction_content !== 'string') {
      errors.push('Missing or invalid transaction_content');
    }
  }

  /**
   * Validate transaction date
   * @private
   */
  _validateTransactionDate(data, errors) {
    if (!data.transaction_date) {
      errors.push('Missing transaction_date');
      return;
    }

    const date = new Date(data.transaction_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid transaction_date format');
    }
  }

  /**
   * Validate optional bank info
   * @private
   */
  _validateBankInfo(data, errors) {
    if (data.bank_brand_name !== undefined && typeof data.bank_brand_name !== 'string') {
      errors.push('Invalid bank_brand_name type');
    }

    if (data.account_number !== undefined && typeof data.account_number !== 'string') {
      errors.push('Invalid account_number type');
    }
  }

  /**
   * Validate dữ liệu webhook từ SeePay
   * 
   * @param {Object} data - Parsed webhook data
   * @returns {Object} { isValid: boolean, errors: Array<string> }
   */
  validateWebhookData(data) {
    const errors = [];

    try {
      if (!data) {
        errors.push('Webhook data is null or undefined');
        return { isValid: false, errors };
      }

      this._validateTransactionId(data, errors);
      this._validateAmount(data, errors);
      this._validateTransactionContent(data, errors);
      this._validateTransactionDate(data, errors);
      this._validateBankInfo(data, errors);

      const isValid = errors.length === 0;

      if (!isValid) {
        logger.warn('Webhook data validation failed', {
          errors,
          transactionId: data.id
        });
      }

      return { isValid, errors };
    } catch (error) {
      logger.error('Error validating webhook data', {
        error: error.message,
        stack: error.stack
      });
      errors.push(`Validation error: ${error.message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Helper: Send error response
   * @private
   */
  _sendErrorResponse(res, statusCode, message, extras = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...extras
    });
  }

  /**
   * Helper: Send success response
   * @private
   */
  _sendSuccessResponse(res, message, data = {}) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      ...data
    });
  }

  /**
   * Helper: Extract và validate signature từ request
   * @private
   */
  _extractSignature(req) {
    const signature = req.headers[WEBHOOK_CONSTANTS.HEADER_SIGNATURE];
    const webhookSecret = process.env[WEBHOOK_CONSTANTS.ENV_SECRET];

    if (!webhookSecret) {
      return {
        error: {
          statusCode: HTTP_STATUS.INTERNAL_ERROR,
          message: 'Webhook secret not configured'
        }
      };
    }

    if (!signature) {
      return {
        error: {
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          message: 'Missing signature header'
        }
      };
    }

    return { signature, webhookSecret };
  }

  /**
   * Helper: Check duplicate transaction
   * Sử dụng Promise.all để query parallel, tránh race condition
   * @private
   */
  async _checkDuplicateTransaction(transactionId) {
    try {
      // Query parallel để tối ưu performance
      const [existingUnmatched, existingBooking] = await Promise.all([
        UnmatchedTransaction.findOne({ transactionId }).lean(),
        Booking.findOne({ [WEBHOOK_CONSTANTS.QUERY_PATHS.TRANSACTION_ID]: transactionId })
          .select('_id payment.status')
          .lean()
      ]);

      if (existingUnmatched) {
        return {
          isDuplicate: true,
          source: 'unmatched',
          data: {
            transactionId,
            status: existingUnmatched.status
          }
        };
      }

      if (existingBooking) {
        return {
          isDuplicate: true,
          source: 'booking',
          data: {
            transactionId,
            bookingId: existingBooking._id.toString(),
            paymentStatus: existingBooking.payment.status
          }
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      // Log error nhưng không throw - để webhook handler xử lý
      logger.error('Error checking duplicate transaction', {
        error: error.message,
        transactionId
      });
      throw error; // Re-throw để handleWebhook catch
    }
  }

  /**
   * Log webhook received event
   * @private
   */
  _logWebhookReceived(req, payload = null) {
    logger.info('Webhook received', {
      ip: req.ip,
      headers: {
        'content-type': req.headers['content-type'],
        [WEBHOOK_CONSTANTS.HEADER_SIGNATURE]: req.headers[WEBHOOK_CONSTANTS.HEADER_SIGNATURE] ? 'present' : 'missing'
      }
    });

    // Log với payment logger nếu có payload
    if (payload) {
      paymentLogger.logWebhookReceived({
        transactionId: payload.id || 'unknown',
        amount: payload.amount_in,
        content: payload.transaction_content,
        signatureValid: true,
        ip: req.ip,
        matched: false // Sẽ update sau khi match
      });
    }
  }

  /**
   * Verify signature step
   * @private
   */
  async _verifySignatureStep(req, res) {
    const signatureResult = this._extractSignature(req);
    if (signatureResult.error) {
      logger.error('Signature extraction failed', signatureResult.error);
      return {
        shouldReturn: true,
        response: this._sendErrorResponse(
          res,
          signatureResult.error.statusCode,
          signatureResult.error.message
        )
      };
    }

    const { signature, webhookSecret } = signatureResult;
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    if (!this.verifySignature(rawBody, signature, webhookSecret)) {
      logger.warn('Invalid webhook signature', { ip: req.ip });
      return {
        shouldReturn: true,
        response: this._sendErrorResponse(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          'Invalid signature'
        )
      };
    }

    logger.info('Webhook signature verified successfully');
    return { shouldReturn: false };
  }

  /**
   * Parse and validate payload step
   * @private
   */
  _parseAndValidatePayload(req, res) {
    const payload = this.parsePayload(req.body);
    if (!payload) {
      logger.error('Failed to parse webhook payload');
      return {
        shouldReturn: true,
        response: this._sendErrorResponse(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Invalid payload format'
        )
      };
    }

    const transactionId = payload.id || 'unknown';
    const validation = this.validateWebhookData(payload);
    
    if (!validation.isValid) {
      logger.warn('Webhook data validation failed', {
        transactionId,
        errors: validation.errors
      });
      return {
        shouldReturn: true,
        response: this._sendErrorResponse(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Invalid webhook data',
          { errors: validation.errors }
        )
      };
    }

    logger.info('Webhook data validated successfully', {
      transactionId,
      amount: payload.amount_in,
      content: payload.transaction_content?.substring(0, 50)
    });

    return { shouldReturn: false, payload, transactionId };
  }

  /**
   * Check duplicate and process transaction
   * @private
   */
  async _processTransaction(payload, res, startTime) {
    const duplicateCheck = await this._checkDuplicateTransaction(payload.id);
    if (duplicateCheck.isDuplicate) {
      logger.info(`Transaction already processed (found in ${duplicateCheck.source})`, duplicateCheck.data);
      return this._sendSuccessResponse(
        res,
        'Transaction already processed',
        duplicateCheck.data
      );
    }

    const matchResult = await transactionMatcher.matchTransaction(payload);
    logger.info('Transaction matching completed', {
      transactionId: payload.id,
      matched: matchResult.matched,
      bookingId: matchResult.booking?._id?.toString(),
      reason: matchResult.reason
    });

    const processingTime = Date.now() - startTime;
    
    if (matchResult.matched) {
      return await this._handleMatchedTransaction(matchResult, payload, res, processingTime);
    } else {
      return await this._handleUnmatchedTransaction(matchResult, payload, res, processingTime);
    }
  }

  /**
   * Handle matched transaction
   * @private
   */
  async _handleMatchedTransaction(matchResult, payload, res, processingTime) {
    await this.processMatchedTransaction(matchResult, payload);
    
    logger.info('Webhook processed successfully - matched', {
      transactionId: payload.id,
      bookingId: matchResult.booking._id.toString(),
      processingTime: `${processingTime}ms`
    });

    // Log matched webhook với payment logger
    paymentLogger.logWebhookReceived({
      transactionId: payload.id,
      amount: payload.amount_in,
      content: payload.transaction_content,
      signatureValid: true,
      ip: 'webhook',
      matched: true,
      bookingId: matchResult.booking._id.toString()
    });

    return this._sendSuccessResponse(
      res,
      'Payment processed successfully',
      {
        transactionId: payload.id,
        bookingId: matchResult.booking._id.toString()
      }
    );
  }

  /**
   * Handle unmatched transaction
   * @private
   */
  async _handleUnmatchedTransaction(matchResult, payload, res, processingTime) {
    await this.createUnmatchedTransaction(matchResult, payload);
    
    logger.info('Webhook processed - unmatched transaction created', {
      transactionId: payload.id,
      reason: matchResult.reason,
      processingTime: `${processingTime}ms`
    });

    // Log unmatched transaction với payment logger
    paymentLogger.logUnmatchedTransaction({
      transactionId: payload.id,
      amount: payload.amount_in,
      content: payload.transaction_content,
      reason: matchResult.reason
    });

    return this._sendSuccessResponse(
      res,
      'Transaction recorded as unmatched',
      {
        transactionId: payload.id,
        reason: matchResult.reason
      }
    );
  }

  /**
   * Xử lý webhook request từ SeePay
   * Logic: Verify signature → Parse payload → Validate data → Match transaction → Update booking → Create payment record
   * Nếu không khớp: Tạo UnmatchedTransaction record
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async handleWebhook(req, res) {
    const startTime = Date.now();
    const stopTimer = paymentMetrics.startTimer('webhookProcessingTime');
    let transactionId = 'unknown';

    try {
      // Increment webhook received counter
      paymentMetrics.incrementCounter('webhooksReceived');
      
      this._logWebhookReceived(req, req.body);

      // 1. Verify signature
      const signatureCheck = await this._verifySignatureStep(req, res);
      if (signatureCheck.shouldReturn) {
        stopTimer();
        return signatureCheck.response;
      }

      // 2. Parse and validate payload
      const parseResult = this._parseAndValidatePayload(req, res);
      if (parseResult.shouldReturn) {
        stopTimer();
        return parseResult.response;
      }

      const { payload } = parseResult;
      transactionId = parseResult.transactionId;

      // 3. Process transaction
      const result = await this._processTransaction(payload, res, startTime);
      
      // Increment webhook processed counter và stop timer
      paymentMetrics.incrementCounter('webhooksProcessed');
      stopTimer();
      
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      stopTimer();
      
      logger.error('Error processing webhook', {
        error: error.message,
        stack: error.stack,
        transactionId,
        processingTime: `${processingTime}ms`
      });

      return this._sendErrorResponse(
        res,
        HTTP_STATUS.INTERNAL_ERROR,
        'Internal server error processing webhook',
        { transactionId }
      );
    }
  }

  /**
   * Xử lý transaction đã khớp với booking
   * Sử dụng paymentService.processPayment để xử lý với transaction và idempotency
   * 
   * @param {Object} matchResult - Kết quả từ transactionMatcher
   * @param {Object} transactionData - Raw transaction data từ SeePay
   * @returns {Promise<Object>} Kết quả xử lý payment
   */
  async processMatchedTransaction(matchResult, transactionData) {
    const { booking } = matchResult;

    try {
      logger.info('Processing matched transaction', {
        transactionId: transactionData.id,
        bookingId: booking._id.toString(),
        amount: transactionData.amount_in
      });

      // Sử dụng paymentService.processPayment để xử lý
      // Method này đã có transaction, idempotency check, và error handling
      const result = await paymentService.processPayment(
        booking._id.toString(),
        transactionData,
        'webhook',
        {
          notes: `Verified via SeePay webhook. Transaction ID: ${transactionData.id}`
        }
      );

      logger.info('Matched transaction processed successfully', {
        bookingId: booking._id.toString(),
        transactionId: transactionData.id,
        alreadyProcessed: result.alreadyProcessed
      });

      // Notifications are automatically sent by paymentService.processPayment()
      // - Payment confirmation email to guest (Requirement 10.1, 10.2)
      // - Booking confirmed notification to host (Requirement 10.3, 10.4)

      return result;

    } catch (error) {
      logger.error('Failed to process matched transaction', {
        error: error.message,
        stack: error.stack,
        transactionId: transactionData.id,
        bookingId: booking._id.toString()
      });
      throw error;
    }
  }

  /**
   * Tạo UnmatchedTransaction record cho transaction không khớp
   * 
   * @param {Object} matchResult - Kết quả từ transactionMatcher
   * @param {Object} transactionData - Raw transaction data từ SeePay
   * @returns {Promise<UnmatchedTransaction>}
   */
  async createUnmatchedTransaction(matchResult, transactionData) {
    try {
      logger.info('Creating unmatched transaction record', {
        transactionId: transactionData.id,
        reason: matchResult.reason
      });

      const unmatchedTransaction = new UnmatchedTransaction({
        transactionId: transactionData.id,
        amount: parseFloat(transactionData.amount_in),
        content: transactionData.transaction_content,
        bankInfo: {
          bankName: transactionData.bank_brand_name || 'Unknown',
          accountNumber: transactionData.account_number || 'Unknown',
          accountName: transactionData.account_name || 'Unknown'
        },
        transactionDate: new Date(transactionData.transaction_date),
        status: 'unmatched',
        rawPayload: transactionData,
        unmatchReason: matchResult.reason,
        validationDetails: matchResult.validations
      });

      await unmatchedTransaction.save();

      // Increment unmatched transactions counter
      paymentMetrics.incrementCounter('unmatchedTransactions');

      logger.info('Unmatched transaction created successfully', {
        transactionId: transactionData.id,
        unmatchedId: unmatchedTransaction._id.toString()
      });

      // TODO: Send notification to admin (task 18)
      // - Email alert về unmatched transaction
      // - Dashboard notification

      return unmatchedTransaction;
    } catch (error) {
      // Nếu lỗi duplicate key (transaction đã tồn tại), log warning thay vì error
      if (error.code === 11000) {
        logger.warn('Unmatched transaction already exists', {
          transactionId: transactionData.id
        });
        return null;
      }

      logger.error('Failed to create unmatched transaction', {
        error: error.message,
        stack: error.stack,
        transactionId: transactionData.id
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new WebhookHandler();
