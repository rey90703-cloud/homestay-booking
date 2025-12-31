const metrics = require('../utils/metrics');
const logger = require('../utils/logger');

/**
 * Alert Service
 * 
 * Monitor system health và trigger alerts khi có vấn đề
 * Requirements: 18.4
 */
class AlertService {
  constructor() {
    this.alertInterval = null;
    this.isRunning = false;
    this.checkIntervalMs = 60000; // Check every 1 minute
    this.alertHistory = [];
  }

  /**
   * Start alert monitoring
   */
  start() {
    if (this.isRunning) {
      logger.warn('Alert service already running');
      return;
    }

    logger.info('Starting alert service', {
      checkInterval: `${this.checkIntervalMs / 1000}s`,
    });

    this.isRunning = true;

    // Run initial check
    this._checkAlerts();

    // Schedule periodic checks
    this.alertInterval = setInterval(() => {
      this._checkAlerts();
    }, this.checkIntervalMs);
  }

  /**
   * Stop alert monitoring
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Alert service not running');
      return;
    }

    logger.info('Stopping alert service');

    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }

    this.isRunning = false;
  }

  /**
   * Check all alerts
   * @private
   */
  _checkAlerts() {
    try {
      // Check MQTT disconnected alert
      if (metrics.checkMQTTDisconnectedAlert()) {
        this._triggerAlert({
          type: 'mqtt_disconnected',
          severity: 'critical',
          message: 'MQTT broker has been disconnected for more than 5 minutes',
          threshold: '5 minutes',
        });
      }

      // Check API error rate alert
      if (metrics.checkAPIErrorRateAlert()) {
        const stats = metrics.getAPIStats();
        this._triggerAlert({
          type: 'high_error_rate',
          severity: 'warning',
          message: `API error rate is ${stats.errors.errorRate}% (threshold: 5%)`,
          threshold: '5%',
          currentValue: stats.errors.errorRate,
        });
      }

      // Check email queue size (if available)
      // Note: This would require integration with email service
      // For now, we'll just log that we checked
      logger.debug('Alert check completed', {
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Error checking alerts', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Trigger an alert
   * @private
   */
  _triggerAlert(alert) {
    const alertData = {
      ...alert,
      timestamp: new Date(),
      id: `${alert.type}_${Date.now()}`,
    };

    // Add to history
    this.alertHistory.push(alertData);

    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }

    // Log alert
    if (alert.severity === 'critical') {
      logger.error('CRITICAL ALERT', alertData);
    } else if (alert.severity === 'warning') {
      logger.warn('WARNING ALERT', alertData);
    } else {
      logger.info('INFO ALERT', alertData);
    }

    // TODO: Send notification via email, Slack, etc.
    // This would require integration with notification services
    // For now, we just log the alert
  }

  /**
   * Get alert history
   * @param {number} limit - Number of recent alerts to return
   * @returns {Array} Recent alerts
   */
  getAlertHistory(limit = 20) {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkIntervalMs,
      alertCount: this.alertHistory.length,
      lastCheck: this.alertHistory.length > 0 
        ? this.alertHistory[this.alertHistory.length - 1].timestamp 
        : null,
    };
  }

  /**
   * Clear alert history
   */
  clearHistory() {
    this.alertHistory = [];
    logger.info('Alert history cleared');
  }
}

// Export singleton instance
module.exports = new AlertService();
