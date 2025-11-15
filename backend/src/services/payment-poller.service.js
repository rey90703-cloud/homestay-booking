const cron = require('node-cron');
const logger = require('../utils/logger');
const paymentLogger = require('../utils/payment.logger');
const Booking = require('../modules/bookings/booking.model');
const { instance: sePayClient } = require('./sepay.client');
const transactionMatcher = require('./transaction-matcher.service');
const paymentService = require('./payment.service');
const { PAYMENT_STATUS } = require('../config/constants');

/**
 * Constants
 */
const POLLER_CONSTANTS = {
  MIN_INTERVAL_SECONDS: 10,
  SECONDS_PER_MINUTE: 60,
  DEFAULT_LOOKBACK_MINUTES: 15,
  DEFAULT_QR_EXPIRY_MINUTES: 15,
  RESULT_STATUS: {
    MATCHED: 'matched',
    FAILED: 'failed',
    ERROR: 'error'
  }
};

/**
 * Payment Poller Service
 * Kiểm tra định kỳ các booking pending payment và khớp với giao dịch từ SeePay
 * Đây là cơ chế backup để đảm bảo không bỏ sót giao dịch nếu webhook thất bại
 */
class PaymentPollerService {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this._isPollingInProgress = false;
    this.lastPollTime = null;
    this.pollCount = 0;
    this.stats = this._initializeStats();
    this.config = this._loadConfiguration();
  }

  /**
   * Initialize statistics object
   * @private
   */
  _initializeStats() {
    return {
      totalPolls: 0,
      totalBookingsChecked: 0,
      totalTransactionsMatched: 0,
      totalErrors: 0,
      lastError: null
    };
  }

  /**
   * Load configuration from environment
   * @private
   */
  _loadConfiguration() {
    return {
      transactionLookbackMinutes: parseInt(
        process.env.PAYMENT_POLLING_LOOKBACK_MINUTES || POLLER_CONSTANTS.DEFAULT_LOOKBACK_MINUTES,
        10
      ),
      qrExpiryMinutes: parseInt(
        process.env.QR_EXPIRY_MINUTES || POLLER_CONSTANTS.DEFAULT_QR_EXPIRY_MINUTES,
        10
      )
    };
  }

  /**
   * Validate interval parameter
   * @private
   */
  _validateInterval(intervalSeconds) {
    if (typeof intervalSeconds !== 'number' || intervalSeconds < POLLER_CONSTANTS.MIN_INTERVAL_SECONDS) {
      throw new Error(`Interval must be at least ${POLLER_CONSTANTS.MIN_INTERVAL_SECONDS} seconds`);
    }
  }

  /**
   * Convert interval seconds to cron expression
   * @private
   */
  _buildCronExpression(intervalSeconds) {
    if (intervalSeconds < POLLER_CONSTANTS.SECONDS_PER_MINUTE) {
      return `*/${intervalSeconds} * * * * *`;
    }
    
    const intervalMinutes = Math.floor(intervalSeconds / POLLER_CONSTANTS.SECONDS_PER_MINUTE);
    return `*/${intervalMinutes} * * * *`;
  }

  /**
   * Log poller lifecycle event
   * @private
   */
  _logLifecycleEvent(event, data = {}) {
    const events = {
      starting: () => logger.info('Starting payment poller', data),
      started: () => logger.info('Payment poller started successfully'),
      stopping: () => logger.info('Stopping payment poller', data),
      stopped: () => logger.info('Payment poller stopped successfully'),
      alreadyRunning: () => logger.warn('Payment poller is already running'),
      notRunning: () => logger.warn('Payment poller is not running')
    };

    const logFn = events[event];
    if (logFn) {
      logFn();
    }
  }

  /**
   * Bắt đầu polling với interval được chỉ định
   * Sử dụng node-cron để schedule
   * 
   * @param {number} intervalSeconds - Interval giữa các lần poll (giây)
   * @returns {boolean} true nếu start thành công
   */
  start(intervalSeconds = 60) {
    if (this.cronJob) {
      this._logLifecycleEvent('alreadyRunning');
      return false;
    }

    try {
      this._validateInterval(intervalSeconds);
      const cronExpression = this._buildCronExpression(intervalSeconds);

      this._logLifecycleEvent('starting', {
        intervalSeconds,
        cronExpression,
        transactionLookbackMinutes: this.config.transactionLookbackMinutes
      });

      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.poll();
      });

      this.isRunning = true;
      this._logLifecycleEvent('started');

      return true;
    } catch (error) {
      logger.error('Failed to start payment poller', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Dừng polling
   * @returns {boolean} true nếu stop thành công
   */
  stop() {
    if (!this.cronJob) {
      this._logLifecycleEvent('notRunning');
      return false;
    }

    try {
      this._logLifecycleEvent('stopping', {
        totalPolls: this.stats.totalPolls,
        totalBookingsChecked: this.stats.totalBookingsChecked,
        totalTransactionsMatched: this.stats.totalTransactionsMatched
      });

      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;

      this._logLifecycleEvent('stopped');
      return true;
    } catch (error) {
      logger.error('Failed to stop payment poller', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Build poll result object
   * @private
   */
  _buildPollResult(data) {
    return {
      success: true,
      bookingsChecked: 0,
      transactionsMatched: 0,
      message: 'No pending bookings',
      ...data
    };
  }

  /**
   * Build error result object
   * @private
   */
  _buildErrorResult(error) {
    return {
      success: false,
      error: error.message
    };
  }

  /**
   * Xử lý một lần polling
   * Logic: Query pending bookings → Query transactions từ SeePay → Match → Update
   * 
   * @returns {Promise<Object>} Kết quả polling
   */
  async poll() {
    if (this._isPollingInProgress) {
      logger.warn('Polling already in progress, skipping this cycle');
      return {
        skipped: true,
        reason: 'Polling already in progress'
      };
    }

    this._isPollingInProgress = true;
    const pollStartTime = Date.now();

    try {
      logger.info('Starting payment polling cycle', {
        pollCount: this.pollCount + 1,
        lastPollTime: this.lastPollTime
      });

      this.pollCount++;
      this.stats.totalPolls++;

      // 1. Lấy danh sách bookings pending payment với QR chưa hết hạn
      const pendingBookings = await this.getPendingBookings();

      if (pendingBookings.length === 0) {
        logger.info('No pending bookings to check');
        this.lastPollTime = new Date();
        return this._buildPollResult();
      }

      logger.info('Found pending bookings', {
        count: pendingBookings.length
      });

      // 2. Query transactions từ SeePay (last 15 minutes)
      const transactions = await this.queryRecentTransactions();

      if (transactions.length === 0) {
        logger.info('No recent transactions from SeePay');
        this.lastPollTime = new Date();
        return this._buildPollResult({
          bookingsChecked: pendingBookings.length,
          message: 'No recent transactions'
        });
      }

      logger.info('Retrieved recent transactions', {
        count: transactions.length
      });

      // 3. Process batch: match và update
      const result = await this.processBatch(pendingBookings, transactions);

      // 4. Update stats
      this.stats.totalBookingsChecked += pendingBookings.length;
      this.stats.totalTransactionsMatched += result.matched;
      this.lastPollTime = new Date();

      const pollDuration = Date.now() - pollStartTime;

      logger.info('Polling cycle completed', {
        duration: `${pollDuration}ms`,
        bookingsChecked: pendingBookings.length,
        transactionsChecked: transactions.length,
        matched: result.matched,
        failed: result.failed,
        stats: this.stats
      });

      // Log polling result với payment logger
      paymentLogger.logPollingResult({
        bookingsChecked: pendingBookings.length,
        transactionsChecked: transactions.length,
        matched: result.matched,
        failed: result.failed,
        duration: pollDuration,
        pollCount: this.pollCount
      });

      return this._buildPollResult({
        bookingsChecked: pendingBookings.length,
        transactionsChecked: transactions.length,
        matched: result.matched,
        failed: result.failed,
        duration: pollDuration
      });

    } catch (error) {
      this._recordError(error);

      logger.error('Polling cycle failed', {
        error: error.message,
        stack: error.stack,
        pollCount: this.pollCount
      });

      return this._buildErrorResult(error);
    } finally {
      this._isPollingInProgress = false;
    }
  }

  /**
   * Record error in stats
   * @private
   */
  _recordError(error) {
    this.stats.totalErrors++;
    this.stats.lastError = {
      message: error.message,
      timestamp: new Date()
    };
  }

  /**
   * Lấy danh sách bookings có status pending_payment và QR chưa hết hạn
   * 
   * @returns {Promise<Array>} Danh sách bookings
   */
  async getPendingBookings() {
    try {
      // Tính thời gian cutoff (QR expiry time)
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - this.config.qrExpiryMinutes * 60 * 1000);

      logger.debug('Querying pending bookings', {
        cutoffTime: cutoffTime.toISOString(),
        qrExpiryMinutes: this.config.qrExpiryMinutes
      });

      // Query bookings:
      // - payment.status = 'pending'
      // - payment.qrCode.createdAt > cutoffTime (QR chưa hết hạn)
      // - payment.reference exists (đã có QR code)
      const bookings = await Booking.find({
        'payment.status': PAYMENT_STATUS.PENDING,
        'payment.reference': { $exists: true, $ne: null },
        'payment.qrCode.createdAt': { $gte: cutoffTime }
      })
        .select('_id payment pricing')
        .lean();

      logger.debug('Found pending bookings', {
        count: bookings.length
      });

      return bookings;
    } catch (error) {
      logger.error('Failed to get pending bookings', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Query transactions từ SeePay trong khoảng thời gian gần đây
   * 
   * @returns {Promise<Array>} Danh sách transactions
   */
  async queryRecentTransactions() {
    try {
      logger.debug('Querying recent transactions from SeePay', {
        lookbackMinutes: this.config.transactionLookbackMinutes
      });

      // Sử dụng SePayClient để lấy transactions
      const transactions = await sePayClient.getRecentTransactions(
        this.config.transactionLookbackMinutes
      );

      logger.debug('Retrieved transactions from SeePay', {
        count: transactions.length
      });

      return transactions;
    } catch (error) {
      logger.error('Failed to query recent transactions', {
        error: error.message,
        stack: error.stack
      });
      
      // Không throw error để không block polling cycle
      // Return empty array để tiếp tục xử lý
      return [];
    }
  }

  /**
   * Build matched transactions map for O(1) lookup
   * @private
   */
  async _buildMatchedTransactionsMap(transactions) {
    const matchedTransactionsMap = new Map();

    logger.debug('Matching all transactions first for optimization');

    for (const transaction of transactions) {
      try {
        const matchResult = await transactionMatcher.matchTransaction(transaction);

        if (matchResult.matched && matchResult.booking) {
          const bookingId = matchResult.booking._id.toString();
          
          if (!matchedTransactionsMap.has(bookingId)) {
            matchedTransactionsMap.set(bookingId, transaction);
            
            logger.debug('Transaction matched with booking', {
              transactionId: transaction.id,
              bookingId
            });
          }
        }
      } catch (error) {
        logger.warn('Error matching transaction, skipping', {
          transactionId: transaction.id,
          error: error.message
        });
      }
    }

    logger.info('Transaction matching completed', {
      matchedCount: matchedTransactionsMap.size
    });

    return matchedTransactionsMap;
  }

  /**
   * Add result detail to results object
   * @private
   */
  _addResultDetail(results, bookingId, transactionId, status, extras = {}) {
    results.details.push({
      bookingId,
      transactionId,
      status,
      ...extras
    });
  }

  /**
   * Process single booking with matched transaction
   * @private
   */
  async _processBookingWithTransaction(booking, matchedTransaction, results) {
    const bookingId = booking._id.toString();

    logger.debug('Processing booking', {
      bookingId,
      reference: booking.payment.reference
    });

    if (!matchedTransaction) {
      logger.debug('No matching transaction found for booking', { bookingId });
      return;
    }

    logger.info('Found matching transaction for booking', {
      bookingId,
      transactionId: matchedTransaction.id,
      amount: matchedTransaction.amount_in
    });

    const paymentResult = await paymentService.processPayment(
      bookingId,
      matchedTransaction,
      'polling'
    );

    if (paymentResult.success) {
      results.matched++;
      this._addResultDetail(
        results,
        bookingId,
        matchedTransaction.id,
        POLLER_CONSTANTS.RESULT_STATUS.MATCHED,
        { alreadyProcessed: paymentResult.alreadyProcessed }
      );

      logger.info('Payment processed successfully via polling', {
        bookingId,
        transactionId: matchedTransaction.id,
        alreadyProcessed: paymentResult.alreadyProcessed
      });
    } else {
      results.failed++;
      this._addResultDetail(
        results,
        bookingId,
        matchedTransaction.id,
        POLLER_CONSTANTS.RESULT_STATUS.FAILED,
        { error: 'Payment processing failed' }
      );
    }
  }

  /**
   * Xử lý batch bookings với transactions
   * Match từng booking với transactions và update payment status
   * 
   * @param {Array} bookings - Danh sách bookings
   * @param {Array} transactions - Danh sách transactions
   * @returns {Promise<Object>} Kết quả xử lý { matched, failed, results }
   */
  async processBatch(bookings, transactions) {
    const results = {
      matched: 0,
      failed: 0,
      details: []
    };

    logger.info('Processing batch', {
      bookingsCount: bookings.length,
      transactionsCount: transactions.length
    });

    const matchedTransactionsMap = await this._buildMatchedTransactionsMap(transactions);

    for (const booking of bookings) {
      try {
        const bookingId = booking._id.toString();
        const matchedTransaction = matchedTransactionsMap.get(bookingId);

        await this._processBookingWithTransaction(booking, matchedTransaction, results);

      } catch (error) {
        results.failed++;
        this._addResultDetail(
          results,
          booking._id.toString(),
          null,
          POLLER_CONSTANTS.RESULT_STATUS.ERROR,
          { error: error.message }
        );

        logger.error('Failed to process booking in batch', {
          bookingId: booking._id.toString(),
          error: error.message,
          stack: error.stack
        });
      }
    }

    logger.info('Batch processing completed', {
      matched: results.matched,
      failed: results.failed
    });

    return results;
  }

  /**
   * Lấy trạng thái hiện tại của poller
   * @returns {Object} Poller status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPolling: this._isPollingInProgress,
      lastPollTime: this.lastPollTime,
      pollCount: this.pollCount,
      stats: this.stats,
      config: this.config
    };
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.stats = this._initializeStats();
    this.pollCount = 0;
    logger.info('Payment poller stats reset');
  }
}

// Export singleton instance
module.exports = new PaymentPollerService();

