const axios = require('axios');
const logger = require('../utils/logger');
const paymentLogger = require('../utils/payment.logger');
const { retryWithBackoff } = require('../utils/retry-helper');
const { VietQRAPIError, QRGenerationError, wrapError, PAYMENT_ERROR_CODES } = require('../utils/payment.error');

/**
 * VietQR Generator Service
 * Tạo mã QR thanh toán theo chuẩn VietQR của Ngân hàng Nhà nước
 */
class VietQRService {
  constructor() {
    this.baseUrl = 'https://img.vietqr.io/image';
    // VietQR API không yêu cầu authentication, chỉ cần URL public
    
    // Retry configuration
    this.retryOptions = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        PAYMENT_ERROR_CODES.VIETQR_API_ERROR,
        PAYMENT_ERROR_CODES.NETWORK_ERROR,
        PAYMENT_ERROR_CODES.CONNECTION_TIMEOUT,
        PAYMENT_ERROR_CODES.SERVICE_UNAVAILABLE,
      ],
    };
  }

  /**
   * Tạo URL VietQR API
   * 
   * @param {string} bankBin - Mã BIN ngân hàng (VD: 970422 cho MB Bank)
   * @param {string} accountNumber - Số tài khoản
   * @param {number} amount - Số tiền (VND)
   * @param {string} content - Nội dung chuyển khoản (payment reference)
   * @param {string} accountName - Tên chủ tài khoản
   * @returns {string} URL VietQR
   */
  buildVietQRUrl(bankBin, accountNumber, amount, content, accountName) {
    try {
      // Validate parameters
      this.validateParams({ bankBin, accountNumber, amount, content, accountName });

      // Encode content để đảm bảo URL safe
      const encodedContent = encodeURIComponent(content);
      const encodedAccountName = encodeURIComponent(accountName);

      // Build URL theo format VietQR API
      // Format: https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NUMBER}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={CONTENT}&accountName={ACCOUNT_NAME}
      const template = 'compact2'; // compact2: QR code với thông tin ngắn gọn
      const url = `${this.baseUrl}/${bankBin}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedAccountName}`;

      logger.info(`Built VietQR URL for account ${accountNumber}, amount ${amount}`);
      return url;
    } catch (error) {
      logger.error(`Failed to build VietQR URL: ${error.message}`);
      throw new QRGenerationError(`Failed to build VietQR URL: ${error.message}`, {
        bankBin,
        accountNumber,
        amount,
      });
    }
  }

  /**
   * Validate input parameters
   * 
   * @param {Object} params - Parameters to validate
   * @param {string} params.bankBin - Mã BIN ngân hàng
   * @param {string} params.accountNumber - Số tài khoản
   * @param {number} params.amount - Số tiền
   * @param {string} params.content - Nội dung chuyển khoản
   * @param {string} params.accountName - Tên chủ tài khoản
   * @throws {Error} Nếu parameters không hợp lệ
   */
  validateParams(params) {
    const { bankBin, accountNumber, amount, content, accountName } = params;

    // Validate bankBin
    if (!bankBin || typeof bankBin !== 'string') {
      throw new Error('Bank BIN is required and must be a string');
    }
    if (!/^\d{6}$/.test(bankBin)) {
      throw new Error('Bank BIN must be 6 digits');
    }

    // Validate accountNumber
    if (!accountNumber || typeof accountNumber !== 'string') {
      throw new Error('Account number is required and must be a string');
    }
    if (!/^\d+$/.test(accountNumber)) {
      throw new Error('Account number must contain only digits');
    }

    // Validate amount
    if (!amount || typeof amount !== 'number') {
      throw new Error('Amount is required and must be a number');
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (amount > 999999999) {
      throw new Error('Amount exceeds maximum limit (999,999,999 VND)');
    }

    // Validate content
    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }
    if (content.length > 100) {
      throw new Error('Content must not exceed 100 characters');
    }

    // Validate accountName
    if (!accountName || typeof accountName !== 'string') {
      throw new Error('Account name is required and must be a string');
    }
    if (accountName.length > 50) {
      throw new Error('Account name must not exceed 50 characters');
    }

    logger.debug('VietQR parameters validated successfully');
  }

  /**
   * Tạo QR code
   * Trả về URL của QR code image từ VietQR API
   * 
   * @param {Object} params - Parameters để tạo QR code
   * @param {string} params.bankBin - Mã BIN ngân hàng
   * @param {string} params.accountNumber - Số tài khoản
   * @param {number} params.amount - Số tiền
   * @param {string} params.content - Nội dung chuyển khoản
   * @param {string} params.accountName - Tên chủ tài khoản
   * @returns {Promise<Object>} QR code data { url, data }
   */
  async generateQRCode(params) {
    const { bankBin, accountNumber, amount, content, accountName } = params;

    try {
      // Validate parameters - throw error nếu invalid
      this.validateParams(params);

      // Build VietQR URL - throw error nếu fail
      const qrUrl = this.buildVietQRUrl(bankBin, accountNumber, amount, content, accountName);

      // Trả về QR code data
      const qrData = {
        url: qrUrl,
        data: qrUrl, // Có thể dùng URL trực tiếp hoặc convert sang base64 nếu cần
        type: 'url',
        provider: 'vietqr',
      };

      logger.info(`Generated QR code successfully for amount ${amount}`);

      // Log VietQR generation với payment logger
      paymentLogger.logVietQRGeneration({
        bookingId: params.bookingId || 'unknown',
        amount,
        accountNumber,
        provider: 'vietqr',
        success: true
      });

      return qrData;
    } catch (error) {
      // Log VietQR generation failure
      paymentLogger.logVietQRGeneration({
        bookingId: params.bookingId || 'unknown',
        amount: params.amount,
        accountNumber: params.accountNumber,
        provider: 'vietqr',
        success: false,
        error: error.message
      });

      // Wrap error nếu chưa phải QRGenerationError
      if (error instanceof QRGenerationError) {
        throw error;
      }
      throw new QRGenerationError(`Failed to generate QR code: ${error.message}`, {
        params,
        originalError: error.message,
      });
    }
  }

  /**
   * Tạo QR code fallback khi VietQR API fail
   * Trả về thông tin text để frontend có thể hiển thị manual
   * 
   * @param {Object} params - Parameters
   * @returns {Object} Fallback QR data
   */
  generateFallbackQRCode(params) {
    const { bankBin, accountNumber, amount, content, accountName } = params;

    logger.warn('Using fallback QR code generation (text-based)');

    // Trả về thông tin để frontend hiển thị manual
    const fallbackData = {
      url: null,
      data: null,
      type: 'fallback',
      provider: 'manual',
      bankInfo: {
        bankBin,
        accountNumber,
        accountName,
        amount,
        content,
      },
      instructions: 'Vui lòng chuyển khoản thủ công với thông tin sau',
    };

    return fallbackData;
  }

  /**
   * Tạo QR code với retry logic
   * Retry tối đa 3 lần với exponential backoff nếu fail
   * 
   * @param {Object} params - Parameters
   * @param {boolean} useFallback - Có dùng fallback khi fail không (default: true)
   * @returns {Promise<Object>} QR code data hoặc fallback data
   * @throws {Error} Nếu useFallback=false và tất cả retry đều fail
   */
  async generateQRCodeWithRetry(params, useFallback = true) {
    try {
      logger.info('Generating QR code with retry logic');
      
      return await retryWithBackoff(
        () => this.generateQRCode(params),
        this.retryOptions,
        {
          operation: 'generateQRCode',
          bookingId: params.bookingId || 'unknown',
          amount: params.amount,
        }
      );
    } catch (error) {
      logger.error(`All retry attempts failed: ${error.message}`);

      // Log VietQR generation failure với payment logger
      paymentLogger.logVietQRGeneration({
        bookingId: params.bookingId || 'unknown',
        amount: params.amount,
        accountNumber: params.accountNumber,
        provider: 'vietqr',
        success: false,
        error: error.message
      });
      
      if (useFallback) {
        logger.info('Using fallback QR code generation');
        return this.generateFallbackQRCode(params);
      }
      
      // Throw error nếu không dùng fallback
      throw error;
    }
  }
}

// Export class để có thể test và inject dependencies
module.exports = VietQRService;

// Export singleton instance để dùng trực tiếp
module.exports.vietQRService = new VietQRService();
