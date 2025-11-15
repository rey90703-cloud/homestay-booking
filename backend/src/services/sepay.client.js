const axios = require('axios');
const moment = require('moment-timezone');
const logger = require('../utils/logger');
const paymentLogger = require('../utils/payment.logger');
const { retryWithBackoff } = require('../utils/retry-helper');
const { SePayAPIError, wrapError, PAYMENT_ERROR_CODES } = require('../utils/payment.error');

// Constants
const DEFAULT_TIMEOUT_MS = 30000;
const RECENT_TRANSACTIONS_MINUTES = 15;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;
const SEPAY_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * SeePay Client Service
 * Xử lý tất cả các tương tác với SeePay API
 */
class SePayClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.SEPAY_BASE_URL || 'https://my.sepay.vn/userapi';
    this.apiToken = config.apiToken || process.env.SEPAY_API_TOKEN;
    this.accountNumber = config.accountNumber || process.env.BANK_ACCOUNT_NUMBER;
    
    if (!this.apiToken) {
      logger.warn('SEPAY_API_TOKEN is not configured');
    }

    // Retry configuration (sử dụng retry-helper)
    this.retryOptions = {
      maxAttempts: config.maxRetries || 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        PAYMENT_ERROR_CODES.SEPAY_API_ERROR,
        PAYMENT_ERROR_CODES.NETWORK_ERROR,
        PAYMENT_ERROR_CODES.CONNECTION_TIMEOUT,
        PAYMENT_ERROR_CODES.SERVICE_UNAVAILABLE,
      ],
    };

    // Axios instance với default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || DEFAULT_TIMEOUT_MS,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Xử lý lỗi và tạo error object chuẩn
   * @param {Error} error - Original error
   * @param {string} operation - Operation name
   * @returns {Error}
   */
  handleError(error, operation) {
    // Wrap error với payment error
    const paymentError = wrapError(error, `SeePay ${operation}`);

    // Log SeePay API error với payment logger
    paymentLogger.logSePayAPICall({
      endpoint: operation,
      method: 'UNKNOWN',
      statusCode: paymentError.statusCode || 500,
      duration: 0,
      success: false,
      error: paymentError.message
    });

    return paymentError;
  }

  /**
   * Validate date string format
   * @param {string} dateStr - Date string to validate
   * @returns {boolean}
   * @private
   */
  _isValidDateFormat(dateStr) {
    // Validate format và parse được thành valid date
    return moment(dateStr, SEPAY_DATE_FORMAT, true).isValid();
  }

  /**
   * Lấy danh sách giao dịch từ SeePay
   * @param {string} startDate - Start date (YYYY-MM-DD HH:mm:ss)
   * @param {string} endDate - End date (YYYY-MM-DD HH:mm:ss)
   * @param {string} accountNumber - Account number (optional, default from env)
   * @returns {Promise<Array<Object>>} - Danh sách giao dịch
   * @throws {Error} - Nếu thiếu account number hoặc date format không hợp lệ
   */
  async getTransactions(startDate, endDate, accountNumber = null) {
    const account = accountNumber || this.accountNumber;
    
    if (!account) {
      throw new Error('Account number is required');
    }

    if (!this._isValidDateFormat(startDate) || !this._isValidDateFormat(endDate)) {
      throw new Error('Invalid date format. Expected: YYYY-MM-DD HH:mm:ss');
    }

    logger.info('SePayClient: Getting transactions', {
      startDate,
      endDate,
      accountNumber: this.maskAccountNumber(account)
    });

    try {
      return await retryWithBackoff(async () => {
        const apiStartTime = Date.now();
        const response = await this.client.get('/transactions/list', {
          params: {
            account_number: account,
            start_date: startDate,
            end_date: endDate
          }
        });

        if (!response.data) {
          throw new SePayAPIError('Invalid response from SeePay API');
        }

        const apiDuration = Date.now() - apiStartTime;

        logger.info('SePayClient: Transactions retrieved successfully', {
          count: response.data.transactions?.length || 0
        });

        // Log SeePay API call với payment logger
        paymentLogger.logSePayAPICall({
          endpoint: '/transactions/list',
          method: 'GET',
          statusCode: response.status,
          duration: apiDuration,
          success: true
        });

        return response.data.transactions || [];
      }, this.retryOptions, {
        operation: 'getTransactions',
        accountNumber: this.maskAccountNumber(account),
      });
    } catch (error) {
      throw this.handleError(error, 'getTransactions');
    }
  }

  /**
   * Lấy chi tiết một giao dịch
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Chi tiết giao dịch
   * @throws {Error} - Nếu transaction ID không hợp lệ
   */
  async getTransactionDetail(transactionId) {
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
      throw new Error('Valid transaction ID is required');
    }

    logger.info('SePayClient: Getting transaction detail', {
      transactionId
    });

    try {
      return await retryWithBackoff(async () => {
        const apiStartTime = Date.now();
        const response = await this.client.get(`/transactions/${transactionId}`);

        if (!response.data) {
          throw new SePayAPIError('Invalid response from SeePay API');
        }

        const apiDuration = Date.now() - apiStartTime;

        logger.info('SePayClient: Transaction detail retrieved successfully', {
          transactionId
        });

        // Log SeePay API call với payment logger
        paymentLogger.logSePayAPICall({
          endpoint: `/transactions/${transactionId}`,
          method: 'GET',
          statusCode: response.status,
          duration: apiDuration,
          success: true
        });

        return response.data;
      }, this.retryOptions, {
        operation: 'getTransactionDetail',
        transactionId,
      });
    } catch (error) {
      throw this.handleError(error, 'getTransactionDetail');
    }
  }

  /**
   * Validate API key bằng cách gọi một endpoint đơn giản
   * @returns {Promise<boolean>} - true nếu API key hợp lệ, false nếu unauthorized
   * @throws {Error} - Nếu gặp lỗi network hoặc server error
   */
  async validateApiKey() {
    logger.info('SePayClient: Validating API key');

    try {
      // Thử lấy thông tin tài khoản hoặc giao dịch gần đây
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - ONE_HOUR_MS);
      
      const startDate = this.formatDate(oneHourAgo);
      const endDate = this.formatDate(now);

      await this.getTransactions(startDate, endDate);
      
      logger.info('SePayClient: API key is valid');
      return true;
    } catch (error) {
      logger.error('SePayClient: API key validation failed', {
        error: error.message
      });
      
      if (error.statusCode === 401 || error.statusCode === 403) {
        return false;
      }
      
      // Nếu là lỗi khác (network, timeout), throw error
      throw error;
    }
  }

  /**
   * Format date thành string cho SeePay API (Vietnam timezone)
   * @param {Date|string|number} date - Date object, ISO string, hoặc timestamp
   * @returns {string} - Formatted date string (YYYY-MM-DD HH:mm:ss) in Vietnam timezone
   */
  formatDate(date) {
    // SeePay API sử dụng timezone Việt Nam (UTC+7)
    return moment(date).tz(VIETNAM_TIMEZONE).format(SEPAY_DATE_FORMAT);
  }

  /**
   * Mask account number để log an toàn
   * @param {string} accountNumber - Account number
   * @returns {string} - Masked account number
   */
  maskAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.length < 4) {
      return '****';
    }
    return '****' + accountNumber.slice(-4);
  }

  /**
   * Lấy giao dịch trong khoảng thời gian gần đây
   * @param {number} minutes - Số phút tính từ hiện tại (default: 15)
   * @returns {Promise<Array<Object>>} - Danh sách giao dịch
   * @throws {Error} - Nếu minutes không hợp lệ
   */
  async getRecentTransactions(minutes = RECENT_TRANSACTIONS_MINUTES) {
    if (typeof minutes !== 'number' || minutes <= 0) {
      throw new Error('Minutes must be a positive number');
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - minutes * ONE_MINUTE_MS);
    
    const startDate = this.formatDate(startTime);
    const endDate = this.formatDate(now);
    
    return this.getTransactions(startDate, endDate);
  }
}

// Export class và singleton instance
module.exports = SePayClient;
module.exports.instance = new SePayClient();
