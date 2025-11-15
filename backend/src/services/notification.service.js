/**
 * Notification Service
 * Centralized service để gửi notifications (email, SMS, push, etc.)
 * Sử dụng Strategy pattern để dễ dàng thêm notification channels mới
 */

const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.channels = new Map();
    this._registerDefaultChannels();
  }

  /**
   * Register default notification channels
   * @private
   */
  _registerDefaultChannels() {
    // Lazy load email service để tránh circular dependency
    this.registerChannel('email', () => require('./email.service'));
  }

  /**
   * Register một notification channel mới
   * @param {string} channelName - Tên channel (email, sms, push, etc.)
   * @param {Function} channelFactory - Factory function trả về channel instance
   */
  registerChannel(channelName, channelFactory) {
    this.channels.set(channelName, channelFactory);
    logger.debug(`Notification channel registered: ${channelName}`);
  }

  /**
   * Get channel instance
   * @private
   */
  _getChannel(channelName) {
    const factory = this.channels.get(channelName);
    if (!factory) {
      throw new Error(`Notification channel not found: ${channelName}`);
    }
    return factory();
  }

  /**
   * Gửi payment confirmation notification
   * @param {Object} booking - Booking object
   * @param {Object} transaction - Transaction data
   * @param {Array<string>} channels - Channels để gửi (default: ['email'])
   * @returns {Promise<Object>} Kết quả gửi notification
   */
  async sendPaymentConfirmation(booking, transaction, channels = ['email']) {
    const results = {};

    for (const channelName of channels) {
      try {
        const channel = this._getChannel(channelName);

        if (channelName === 'email') {
          // Gửi email cho guest
          const guestResult = await channel.sendPaymentConfirmationEmail(booking, transaction);
          results.guestEmail = guestResult;

          // Gửi email cho host
          const hostResult = await channel.sendBookingConfirmedNotificationToHost(booking, transaction);
          results.hostEmail = hostResult;

          logger.info('Payment confirmation notifications sent', {
            bookingId: booking._id,
            guestEmail: guestResult,
            hostEmail: hostResult,
          });
        }
      } catch (error) {
        logger.error(`Failed to send notification via ${channelName}`, {
          error: error.message,
          bookingId: booking._id,
          channel: channelName,
        });
        results[channelName] = false;
      }
    }

    return results;
  }

  /**
   * Gửi booking confirmation notification (legacy method)
   * @deprecated Use sendPaymentConfirmation instead
   */
  async sendBookingConfirmation(booking, guest, host, homestay) {
    try {
      const emailService = this._getChannel('email');
      return await emailService.sendBookingConfirmationEmail(booking, guest, host, homestay);
    } catch (error) {
      logger.error('Failed to send booking confirmation', {
        error: error.message,
        bookingId: booking._id,
      });
      return false;
    }
  }

  /**
   * Gửi new booking notification to host (legacy method)
   * @deprecated Use sendPaymentConfirmation instead
   */
  async sendNewBookingToHost(booking, guest, host, homestay) {
    try {
      const emailService = this._getChannel('email');
      return await emailService.sendNewBookingNotificationToHost(booking, guest, host, homestay);
    } catch (error) {
      logger.error('Failed to send new booking notification to host', {
        error: error.message,
        bookingId: booking._id,
      });
      return false;
    }
  }

  /**
   * Gửi verification email
   */
  async sendVerificationEmail(user, verificationToken) {
    try {
      const emailService = this._getChannel('email');
      return await emailService.sendVerificationEmail(user, verificationToken);
    } catch (error) {
      logger.error('Failed to send verification email', {
        error: error.message,
        userId: user._id,
      });
      return false;
    }
  }

  /**
   * Gửi password reset OTP email
   */
  async sendPasswordResetOTP(user, otp) {
    try {
      const emailService = this._getChannel('email');
      return await emailService.sendPasswordResetOTPEmail(user, otp);
    } catch (error) {
      logger.error('Failed to send password reset OTP', {
        error: error.message,
        userId: user._id,
      });
      return false;
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();
