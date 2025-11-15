const cron = require('node-cron');
const Booking = require('../modules/bookings/booking.model');
const emailService = require('./email.service');
const logger = require('../utils/logger');
const { PAYMENT_STATUS, BOOKING_STATUS } = require('../config/constants');

/**
 * Payment Reminder Service
 * Gửi email nhắc nhở thanh toán cho bookings có QR code hết hạn
 * Requirements: 10.5
 */
class PaymentReminderService {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this.lastRunTime = null;
    this.stats = {
      totalRuns: 0,
      totalReminders: 0,
      totalErrors: 0,
    };
  }

  /**
   * Bắt đầu cron job gửi reminder
   * @param {number} intervalMinutes - Interval chạy cron job (mặc định: 30 phút)
   */
  start(intervalMinutes = 30) {
    if (this.isRunning) {
      logger.warn('Payment Reminder Service is already running');
      return;
    }

    // Validate interval
    if (intervalMinutes < 1 || intervalMinutes > 1440) {
      throw new Error('Interval must be between 1 and 1440 minutes (24 hours)');
    }

    // Tạo cron expression: chạy mỗi X phút
    // Format: */X * * * * (mỗi X phút)
    const cronExpression = `*/${intervalMinutes} * * * *`;

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.sendReminders();
    });

    this.isRunning = true;
    logger.info('Payment Reminder Service started', {
      intervalMinutes,
      cronExpression,
    });
  }

  /**
   * Dừng cron job
   */
  stop() {
    if (!this.isRunning || !this.cronJob) {
      logger.warn('Payment Reminder Service is not running');
      return;
    }

    this.cronJob.stop();
    this.cronJob = null;
    this.isRunning = false;

    logger.info('Payment Reminder Service stopped', {
      stats: this.stats,
    });
  }

  /**
   * Lấy danh sách bookings cần gửi reminder
   * Điều kiện:
   * - Payment status = pending
   * - Booking status không phải cancelled/completed/checked_out
   * - QR code đã hết hạn (expiresAt < now)
   * - Chưa gửi reminder trong 30 phút gần nhất (tránh spam)
   * 
   * @returns {Promise<Array>} Danh sách bookings
   */
  async getExpiredQRBookings() {
    try {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const bookings = await Booking.find({
        // Payment status = pending
        'payment.status': PAYMENT_STATUS.PENDING,
        
        // Booking status không phải cancelled/completed/checked_out
        status: {
          $nin: [
            BOOKING_STATUS.CANCELLED,
            BOOKING_STATUS.COMPLETED,
            BOOKING_STATUS.CHECKED_OUT,
          ],
        },
        
        // QR code đã được tạo
        'payment.qrCode.expiresAt': { $exists: true },
        
        // QR code đã hết hạn
        'payment.qrCode.expiresAt': { $lt: now },
        
        // Chưa gửi reminder trong 30 phút gần nhất (hoặc chưa từng gửi)
        $or: [
          { 'payment.lastReminderSentAt': { $exists: false } },
          { 'payment.lastReminderSentAt': { $lt: thirtyMinutesAgo } },
        ],
      })
        .populate('guestId')
        .populate('hostId')
        .populate('homestayId')
        .lean();

      logger.info('Found expired QR bookings for reminder', {
        count: bookings.length,
      });

      return bookings;
    } catch (error) {
      logger.error('Failed to get expired QR bookings', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Gửi reminder cho một booking
   * @param {Object} booking - Booking object
   * @returns {Promise<boolean>} True nếu gửi thành công
   */
  async sendReminderForBooking(booking) {
    try {
      // Gửi email reminder
      const emailSent = await emailService.sendPaymentReminderEmail(booking);

      if (emailSent) {
        // Cập nhật thời gian gửi reminder
        await Booking.findByIdAndUpdate(booking._id, {
          'payment.lastReminderSentAt': new Date(),
        });

        logger.info('Payment reminder sent successfully', {
          bookingId: booking._id,
          guestEmail: booking.guestId?.email,
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to send payment reminder', {
        bookingId: booking._id,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Xử lý gửi reminders cho tất cả bookings hết hạn
   */
  async sendReminders() {
    if (!this.isRunning) {
      logger.warn('Payment Reminder Service is not running, skipping reminder send');
      return;
    }

    const startTime = Date.now();
    this.lastRunTime = new Date();
    this.stats.totalRuns++;

    logger.info('Starting payment reminder batch', {
      runNumber: this.stats.totalRuns,
      timestamp: this.lastRunTime,
    });

    try {
      // Lấy danh sách bookings cần gửi reminder
      const bookings = await this.getExpiredQRBookings();

      if (bookings.length === 0) {
        logger.info('No expired QR bookings found for reminder');
        return;
      }

      // Gửi reminder cho từng booking
      let successCount = 0;
      let errorCount = 0;

      for (const booking of bookings) {
        try {
          const sent = await this.sendReminderForBooking(booking);
          if (sent) {
            successCount++;
            this.stats.totalReminders++;
          } else {
            errorCount++;
            this.stats.totalErrors++;
          }
        } catch (error) {
          errorCount++;
          this.stats.totalErrors++;
          logger.error('Error sending reminder for booking', {
            bookingId: booking._id,
            error: error.message,
          });
          // Continue với booking tiếp theo
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Payment reminder batch completed', {
        totalBookings: bookings.length,
        successCount,
        errorCount,
        duration: `${duration}ms`,
        stats: this.stats,
      });
    } catch (error) {
      this.stats.totalErrors++;
      logger.error('Payment reminder batch failed', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Lấy trạng thái của service
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      stats: this.stats,
    };
  }
}

module.exports = new PaymentReminderService();
