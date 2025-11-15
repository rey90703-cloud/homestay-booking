/**
 * Email Configuration
 * Centralized email settings, subjects, and content
 */

const EMAIL_CONFIG = {
  // Retry configuration
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    retryableErrors: [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ESOCKET',
    ],
  },

  // Email subjects
  subjects: {
    verification: 'Verify Your Email Address',
    passwordReset: '[Homestay Booking] Mã xác thực đặt lại mật khẩu',
    bookingConfirmation: 'Booking Confirmation',
    newBookingHost: 'New Booking Received',
    paymentConfirmation: '✅ Thanh toán thành công - Booking đã được xác nhận',
    bookingConfirmedHost: '🎉 Booking mới đã được thanh toán - Homestay của bạn',
    paymentReminder: '⏰ Nhắc nhở thanh toán - Mã QR đã hết hạn',
  },

  // Default sender info
  sender: {
    name: process.env.EMAIL_FROM_NAME || 'Booking Homestay',
    email: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },

  // URLs
  urls: {
    client: process.env.CLIENT_URL || 'http://localhost:3000',
  },

  // Timeouts
  timeouts: {
    verificationLink: '24 hours',
    otpCode: '5 phút',
    qrCode: '15 phút',
  },
};

module.exports = EMAIL_CONFIG;
