/**
 * Payment Metrics Utility
 * 
 * Theo dõi và thu thập metrics về hoạt động thanh toán
 * Bao gồm counters, timers và gauges để monitor hệ thống
 * 
 * Requirements: Monitoring (Yêu cầu 8)
 */

class PaymentMetrics {
  constructor(maxTimerSamples = 500) {
    // Counters - Đếm số lượng events
    this.counters = {
      qrCodesGenerated: 0,
      webhooksReceived: 0,
      webhooksProcessed: 0,
      paymentsCompleted: 0,
      paymentsFailed: 0,
      unmatchedTransactions: 0,
      pollingRuns: 0,
      manualVerifications: 0
    };

    // Timers - Lưu thời gian xử lý (milliseconds)
    this.timers = {
      qrGenerationTime: [],
      webhookProcessingTime: [],
      pollingTime: [],
      transactionMatchingTime: []
    };

    // Gauges - Giá trị hiện tại
    this.gauges = {
      pendingPayments: 0,
      activeQRCodes: 0
    };

    // Giới hạn số lượng timer samples để tránh memory leak
    this.maxTimerSamples = maxTimerSamples;
    
    // Cache cho timer stats để tránh tính toán lại
    this._statsCache = new Map();
    this._cacheTimeout = 5000; // 5 seconds
  }

  /**
   * Validate metric name exists in collection
   * @private
   * @param {Object} collection - Collection object (counters/timers/gauges)
   * @param {string} name - Metric name
   * @returns {boolean}
   */
  _hasMetric(collection, name) {
    return Object.prototype.hasOwnProperty.call(collection, name);
  }

  /**
   * Validate numeric value
   * @private
   * @param {*} value - Value to validate
   * @param {string} paramName - Parameter name for error message
   * @returns {number}
   * @throws {TypeError} If value is not a valid number
   */
  _validateNumber(value, paramName = 'value') {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new TypeError(`${paramName} must be a finite number, got: ${value}`);
    }
    return num;
  }

  /**
   * Reset collection values
   * @private
   * @param {Object} collection - Collection to reset
   * @param {*} defaultValue - Default value for reset
   */
  _resetCollection(collection, defaultValue) {
    Object.keys(collection).forEach(key => {
      collection[key] = defaultValue;
    });
  }

  /**
   * Invalidate stats cache
   * @private
   */
  _invalidateCache() {
    this._statsCache.clear();
  }

  /**
   * Increment counter
   * @param {string} counterName - Tên counter
   * @param {number} value - Giá trị tăng (default: 1)
   * @throws {TypeError} If value is not a valid number
   */
  incrementCounter(counterName, value = 1) {
    try {
      if (!this._hasMetric(this.counters, counterName)) {
        return;
      }
      
      const numValue = this._validateNumber(value, 'value');
      this.counters[counterName] += numValue;
    } catch (error) {
      // Log error nhưng không throw để không làm gián đoạn business logic
      console.error(`[PaymentMetrics] Error incrementing counter ${counterName}:`, error.message);
    }
  }

  /**
   * Record timer value
   * @param {string} timerName - Tên timer
   * @param {number} duration - Thời gian (milliseconds)
   * @throws {TypeError} If duration is not a valid number
   */
  recordTimer(timerName, duration) {
    try {
      if (!this._hasMetric(this.timers, timerName)) {
        return;
      }
      
      const numDuration = this._validateNumber(duration, 'duration');
      if (numDuration < 0) {
        console.warn(`[PaymentMetrics] Negative duration ${numDuration}ms for ${timerName}`);
        return;
      }
      
      this.timers[timerName].push(numDuration);
      
      // Giới hạn số lượng samples
      if (this.timers[timerName].length > this.maxTimerSamples) {
        this.timers[timerName].shift();
      }
      
      // Invalidate cache khi có data mới
      this._invalidateCache();
    } catch (error) {
      console.error(`[PaymentMetrics] Error recording timer ${timerName}:`, error.message);
    }
  }

  /**
   * Set gauge value
   * @param {string} gaugeName - Tên gauge
   * @param {number} value - Giá trị mới
   * @throws {TypeError} If value is not a valid number
   */
  setGauge(gaugeName, value) {
    try {
      if (!this._hasMetric(this.gauges, gaugeName)) {
        return;
      }
      
      const numValue = this._validateNumber(value, 'value');
      this.gauges[gaugeName] = Math.max(0, numValue);
    } catch (error) {
      console.error(`[PaymentMetrics] Error setting gauge ${gaugeName}:`, error.message);
    }
  }

  /**
   * Increment gauge
   * @param {string} gaugeName - Tên gauge
   * @param {number} value - Giá trị tăng (default: 1)
   * @throws {TypeError} If value is not a valid number
   */
  incrementGauge(gaugeName, value = 1) {
    try {
      if (!this._hasMetric(this.gauges, gaugeName)) {
        return;
      }
      
      const numValue = this._validateNumber(value, 'value');
      this.gauges[gaugeName] += numValue;
    } catch (error) {
      console.error(`[PaymentMetrics] Error incrementing gauge ${gaugeName}:`, error.message);
    }
  }

  /**
   * Decrement gauge
   * @param {string} gaugeName - Tên gauge
   * @param {number} value - Giá trị giảm (default: 1)
   * @throws {TypeError} If value is not a valid number
   */
  decrementGauge(gaugeName, value = 1) {
    try {
      if (!this._hasMetric(this.gauges, gaugeName)) {
        return;
      }
      
      const numValue = this._validateNumber(value, 'value');
      this.gauges[gaugeName] = Math.max(0, this.gauges[gaugeName] - numValue);
    } catch (error) {
      console.error(`[PaymentMetrics] Error decrementing gauge ${gaugeName}:`, error.message);
    }
  }

  /**
   * Tính toán statistics cho timer với caching
   * @param {string} timerName - Tên timer
   * @returns {Object} Statistics (avg, min, max, count, p50, p95, p99)
   */
  getTimerStats(timerName) {
    try {
      if (!this._hasMetric(this.timers, timerName)) {
        return this._getEmptyStats();
      }

      const samples = this.timers[timerName];
      
      if (!samples || samples.length === 0) {
        return this._getEmptyStats();
      }

      // Check cache
      const cacheKey = `${timerName}_${samples.length}`;
      const cached = this._statsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this._cacheTimeout) {
        return cached.stats;
      }

      // Calculate stats
      const sorted = [...samples].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, val) => acc + val, 0);
      
      const stats = {
        count: sorted.length,
        avg: Math.round(sum / sorted.length),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: this._percentile(sorted, 50),
        p95: this._percentile(sorted, 95),
        p99: this._percentile(sorted, 99)
      };

      // Cache result
      this._statsCache.set(cacheKey, {
        stats,
        timestamp: Date.now()
      });

      return stats;
    } catch (error) {
      console.error(`[PaymentMetrics] Error getting timer stats for ${timerName}:`, error.message);
      return this._getEmptyStats();
    }
  }

  /**
   * Get empty stats object
   * @private
   * @returns {Object}
   */
  _getEmptyStats() {
    return {
      count: 0,
      avg: 0,
      min: 0,
      max: 0,
      p50: 0,
      p95: 0,
      p99: 0
    };
  }

  /**
   * Tính percentile
   * @private
   */
  _percentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics data
   */
  getAllMetrics() {
    const timerStats = {};
    
    for (const timerName in this.timers) {
      timerStats[timerName] = this.getTimerStats(timerName);
    }

    return {
      counters: { ...this.counters },
      timers: timerStats,
      gauges: { ...this.gauges },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    try {
      this._resetCollection(this.counters, 0);
      this._resetCollection(this.timers, []);
      this._resetCollection(this.gauges, 0);
      this._invalidateCache();
    } catch (error) {
      console.error('[PaymentMetrics] Error resetting metrics:', error.message);
    }
  }

  /**
   * Helper: Start timer và return function để stop
   * @param {string} timerName - Tên timer
   * @returns {Function} Stop function
   */
  startTimer(timerName) {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordTimer(timerName, duration);
      return duration;
    };
  }
}

// Singleton instance
const paymentMetrics = new PaymentMetrics();

module.exports = paymentMetrics;
