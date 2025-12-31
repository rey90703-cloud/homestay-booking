const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const EmailTemplateBuilder = require('./email-template.builder');
const { formatCurrency, formatDate, formatDateTime, formatPhone } = require('../utils/formatters');
const { 
  validateAndSanitizeEmail, 
  validateUserForEmail,
  logValidationError,
} = require('../utils/email-validator');
const { retryWithBackoff } = require('../utils/retry-helper');
const EMAIL_CONFIG = require('../config/email.config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (process.env.NODE_ENV === 'test') {
      // Use mock transporter in test environment
      this.transporter = {
        sendMail: async () => ({ messageId: 'test-message-id' }),
      };
      return;
    }

    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    const isPlaceholder = emailConfig.auth.user?.includes('your-email') || 
                          emailConfig.auth.pass?.includes('your-') ||
                          !emailConfig.auth.user || 
                          !emailConfig.auth.pass;
    
    if (isPlaceholder) {
      logger.info('Email service not configured (using placeholder values). Email functionality will be disabled.');
      this.transporter = null;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          logger.error(`Email service connection failed: ${error.message}`);
          this.transporter = null;
        } else {
          logger.info('Email service is ready');
        }
      });
    } catch (error) {
      logger.error(`Email service initialization failed: ${error.message}`);
      this.transporter = null;
    }
  }

  /**
   * Send email with validation and retry logic
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @param {string} text - Plain text content
   * @returns {Promise<boolean>} True if sent successfully
   */
  async sendEmail(to, subject, html, text) {
    if (!this.transporter) {
      logger.warn('Email service not available. Skipping email send.');
      return false;
    }

    try {
      // Validate and sanitize email
      const sanitizedEmail = validateAndSanitizeEmail(to);

      // Prepare mail options
      const mailOptions = {
        from: `"${EMAIL_CONFIG.sender.name}" <${EMAIL_CONFIG.sender.email}>`,
        to: sanitizedEmail,
        subject,
        html,
        text,
      };

      // Send with retry logic
      const info = await retryWithBackoff(
        () => this.transporter.sendMail(mailOptions),
        EMAIL_CONFIG.retry,
        { to: sanitizedEmail, subject }
      );

      logger.info('Email sent successfully', {
        to: sanitizedEmail,
        subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        to,
        subject,
        error: error.message,
        errorCode: error.code,
      });
      return false;
    }
  }

  /**
   * Send verification email to new user
   * @param {Object} user - User object
   * @param {string} verificationToken - Verification token
   * @returns {Promise<boolean>}
   */
  async sendVerificationEmail(user, verificationToken) {
    try {
      validateUserForEmail(user, 'user');

      const verificationUrl = `${EMAIL_CONFIG.urls.client}/verify-email?token=${verificationToken}`;

      const builder = new EmailTemplateBuilder();
      
      builder
        .setHeader('📧', 'Welcome to Booking Homestay!', 'Verify your email to get started', 'info')
        .addSection('🔐 Email Verification', [
          { label: 'Action Required', value: 'Click the button below to verify your email' },
          { label: 'Link Expires', value: EMAIL_CONFIG.timeouts.verificationLink },
        ])
        .setHighlight('📌 Important:', [
          'This link will expire in 24 hours',
          'If you didn\'t create an account, please ignore this email',
          'Keep this email for your records',
        ])
        .setButton('Verify Email Address', verificationUrl, 'info');

      const { html, text } = builder.build(
        `Hi <strong>${user.profile.firstName || 'there'}</strong>,`,
        'Thank you for registering with Booking Homestay. Please verify your email address to activate your account and start booking amazing homestays!',
        'Best regards,<br>Booking Homestay Team'
      );

      return this.sendEmail(user.email, EMAIL_CONFIG.subjects.verification, html, text);
    } catch (error) {
      logValidationError(error, { userId: user?._id, email: user?.email });
      return false;
    }
  }

  async sendPasswordResetOTPEmail(user, otp) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo-icon { font-size: 48px; margin: 0 0 10px 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #E11D48; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #E11D48; letter-spacing: 8px; font-family: monospace; }
          .info { background: #FFF1F7; border-left: 4px solid #E11D48; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-icon">🏠</div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 700;">HomestayBooking</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Mã xác thực đặt lại mật khẩu</p>
          </div>
          <div class="content">
            <p>Xin chào <strong>${user.profile.firstName || 'bạn'}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã OTP bên dưới để tiếp tục:</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666;">Mã xác thực của bạn:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">Mã có hiệu lực trong 5 phút</p>
            </div>

            <div class="info">
              <p style="margin: 0;"><strong>⚠️ Lưu ý bảo mật:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Không chia sẻ mã này với bất kỳ ai</li>
                <li>Mã chỉ được sử dụng một lần</li>
                <li>Nếu không phải bạn yêu cầu, hãy bỏ qua email này</li>
              </ul>
            </div>

            <p style="margin-top: 20px;">Trân trọng,<br><strong>Đội ngũ Homestay Booking</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>© 2025 Homestay Booking. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Mã xác thực đặt lại mật khẩu - Homestay Booking
      
      Xin chào ${user.profile.firstName || 'bạn'},
      
      Mã OTP của bạn: ${otp}
      
      Mã này có hiệu lực trong 5 phút.
      
      Lưu ý bảo mật:
      - Không chia sẻ mã này với bất kỳ ai
      - Mã chỉ được sử dụng một lần
      - Nếu không phải bạn yêu cầu, hãy bỏ qua email này
      
      Trân trọng,
      Đội ngũ Homestay Booking
    `;

    return this.sendEmail(user.email, '[Homestay Booking] Mã xác thực đặt lại mật khẩu', html, text);
  }

  /**
   * Send booking confirmation email to guest
   * @param {Object} booking - Booking object
   * @param {Object} guest - Guest user object
   * @param {Object} host - Host user object
   * @param {Object} homestay - Homestay object
   * @returns {Promise<boolean>}
   */
  async sendBookingConfirmationEmail(booking, guest, host, homestay) {
    try {
      validateUserForEmail(guest, 'guest');
      validateUserForEmail(host, 'host');

      const bookingUrl = `${EMAIL_CONFIG.urls.client}/bookings/${booking._id}`;

      const builder = new EmailTemplateBuilder();
      
      builder
        .setHeader('', 'Booking Confirmed!', 'Your reservation is confirmed', 'success')
        .setBadge('🎉 Your booking has been confirmed', 'success')
        .addSection('🏠 Booking Details', [
          { label: 'Homestay', value: homestay.title },
          { label: 'Host', value: `${host.profile.firstName} ${host.profile.lastName}` },
          { label: 'Check-in', value: formatDate(booking.checkInDate || booking.checkIn) },
          { label: 'Check-out', value: formatDate(booking.checkOutDate || booking.checkOut) },
          { label: 'Guests', value: `${booking.numberOfGuests} guests` },
          { label: 'Total Amount', value: formatCurrency(booking.pricing?.totalAmount || booking.payment?.totalAmount) },
          { label: 'Booking ID', value: booking._id.toString() },
        ])
        .setHighlight('📌 Important Reminders:', [
          'Please arrive on time for check-in',
          'Bring your identification documents',
          'Contact the host if you need to make changes',
        ])
        .setButton('View Booking Details', bookingUrl, 'success');

      const { html, text } = builder.build(
        `Hi <strong>${guest.profile.firstName}</strong>,`,
        'Great news! Your booking has been confirmed. We hope you have a wonderful stay!',
        'Best regards,<br>Booking Homestay Team'
      );

      return this.sendEmail(guest.email, EMAIL_CONFIG.subjects.bookingConfirmation, html, text);
    } catch (error) {
      logValidationError(error, { bookingId: booking?._id, guestEmail: guest?.email });
      return false;
    }
  }

  /**
   * Send new booking notification to host
   * @param {Object} booking - Booking object
   * @param {Object} guest - Guest user object
   * @param {Object} host - Host user object
   * @param {Object} homestay - Homestay object
   * @returns {Promise<boolean>}
   */
  async sendNewBookingNotificationToHost(booking, guest, host, homestay) {
    try {
      validateUserForEmail(guest, 'guest');
      validateUserForEmail(host, 'host');

      const bookingUrl = `${EMAIL_CONFIG.urls.client}/host/bookings/${booking._id}`;

      const builder = new EmailTemplateBuilder();
      
      builder
        .setHeader('🎉', 'New Booking Received!', 'You have a new reservation', 'info')
        .setBadge(' New booking for your property', 'info')
        .addSection('👤 Guest Information', [
          { label: 'Guest Name', value: `${guest.profile.firstName} ${guest.profile.lastName}` },
          { label: 'Email', value: guest.email },
          { label: 'Phone', value: formatPhone(guest.profile.phone) || 'Not provided' },
          { label: 'Number of Guests', value: `${booking.numberOfGuests} guests` },
        ])
        .addSection('🏠 Booking Details', [
          { label: 'Homestay', value: homestay.title },
          { label: 'Check-in', value: formatDate(booking.checkInDate || booking.checkIn) },
          { label: 'Check-out', value: formatDate(booking.checkOutDate || booking.checkOut) },
          { label: 'Total Amount', value: formatCurrency(booking.pricing?.totalAmount || booking.payment?.totalAmount) },
          { label: 'Booking ID', value: booking._id.toString() },
        ])
        .setHighlight('📌 Next Steps:', [
          'Review the booking details',
          'Prepare your property for the guest',
          'Contact the guest if needed',
        ])
        .setButton('View Booking Details', bookingUrl, 'info');

      const { html, text } = builder.build(
        `Hi <strong>${host.profile.firstName}</strong>,`,
        'Congratulations! You have received a new booking for your property. Please review the details and prepare for your guest.',
        'Best regards,<br>Booking Homestay Team'
      );

      return this.sendEmail(host.email, EMAIL_CONFIG.subjects.newBookingHost, html, text);
    } catch (error) {
      logValidationError(error, { bookingId: booking?._id, hostEmail: host?.email });
      return false;
    }
  }

  /**
   * Validate và populate booking data
   * @private
   */
  async _validateAndPopulateBooking(booking) {
    if (!booking) {
      throw new Error('Booking is required');
    }

    // Populate guest, host và homestay nếu chưa có
    if (!booking.populated('guestId')) {
      await booking.populate('guestId');
    }
    if (!booking.populated('hostId')) {
      await booking.populate('hostId');
    }
    if (!booking.populated('homestayId')) {
      await booking.populate('homestayId');
    }

    const guest = booking.guestId;
    const host = booking.hostId;
    const homestay = booking.homestayId;

    if (!guest || !host || !homestay) {
      throw new Error('Missing required booking relations (guest, host, or homestay)');
    }

    return { guest, host, homestay };
  }

  /**
   * Gửi email xác nhận thanh toán cho khách hàng
   * Requirements: 10.1, 10.2
   * 
   * @param {Object} booking - Booking object với đầy đủ thông tin
   * @param {Object} transaction - Transaction data từ SeePay
   * @returns {Promise<boolean>} True nếu gửi email thành công
   */
  async sendPaymentConfirmationEmail(booking, transaction) {
    try {
      const { guest, host, homestay } = await this._validateAndPopulateBooking(booking);
      const bookingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-success/${booking._id}`;

      // Build email using template builder
      const builder = new EmailTemplateBuilder();
      
      builder
        .setHeader('', 'Thanh toán thành công!', 'Booking của bạn đã được xác nhận', 'success')
        .setBadge('🎉 Thanh toán đã được xác nhận thành công', 'success')
        .addSection('💳 Thông tin thanh toán', [
          { label: 'Mã giao dịch', value: transaction.id || transaction.bankReference },
          { label: 'Số tiền', value: formatCurrency(transaction.amount || booking.pricing.totalAmount) },
          { label: 'Thời gian', value: formatDateTime(booking.payment.paidAt || new Date()) },
          { label: 'Ngân hàng', value: transaction.bankName || 'MB Bank' },
        ])
        .addSection('🏠 Thông tin booking', [
          { label: 'Homestay', value: homestay.title },
          { label: 'Chủ nhà', value: `${host.profile.firstName} ${host.profile.lastName}` },
          { label: 'Check-in', value: formatDate(booking.checkInDate) },
          { label: 'Check-out', value: formatDate(booking.checkOutDate) },
          { label: 'Số khách', value: `${booking.numberOfGuests} người` },
          { label: 'Số đêm', value: `${booking.numberOfNights} đêm` },
          { label: 'Mã booking', value: booking._id.toString() },
        ])
        .setHighlight('📌 Lưu ý quan trọng:', [
          'Vui lòng đến đúng giờ check-in',
          'Mang theo giấy tờ tùy thân',
          'Liên hệ chủ nhà nếu có thay đổi',
        ])
        .setButton('Xem chi tiết booking', bookingUrl, 'success');

      const { html, text } = builder.build(
        `Xin chào <strong>${guest.profile.firstName || 'bạn'}</strong>,`,
        'Chúng tôi đã nhận được thanh toán của bạn. Booking của bạn đã được xác nhận và sẵn sàng cho chuyến đi!',
        'Chúc bạn có một chuyến đi tuyệt vời! 🌟'
      );

      logger.info('Sending payment confirmation email', {
        bookingId: booking._id,
        guestEmail: guest.email,
        transactionId: transaction.id,
      });

      return this.sendEmail(
        guest.email,
        ' Thanh toán thành công - Booking đã được xác nhận',
        html,
        text,
      );
    } catch (error) {
      logger.error('Failed to send payment confirmation email', {
        error: error.message,
        bookingId: booking._id,
      });
      return false;
    }
  }

  /**
   * Gửi email thông báo booking đã được xác nhận cho host
   * Requirements: 10.3, 10.4
   * 
   * @param {Object} booking - Booking object với đầy đủ thông tin
   * @param {Object} transaction - Transaction data từ SeePay
   * @returns {Promise<boolean>} True nếu gửi email thành công
   */
  async sendBookingConfirmedNotificationToHost(booking, transaction) {
    try {
      const { guest, host, homestay } = await this._validateAndPopulateBooking(booking);
      const bookingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-success/${booking._id}`;

      // Build email using template builder
      const builder = new EmailTemplateBuilder();
      
      builder
        .setHeader('🎉', 'Booking mới đã được thanh toán!', 'Khách hàng đã xác nhận thanh toán', 'info')
        .setBadge(' Booking đã được xác nhận và thanh toán', 'info')
        .addSection('💰 Thu nhập của bạn', [
          { label: '', value: formatCurrency(booking.pricing.hostAmount) },
          { label: '', value: `Sau khi trừ phí nền tảng ${booking.pricing.commissionRate * 100}%` },
        ], 'earnings')
        .addSection('👤 Thông tin khách hàng', [
          { label: 'Tên khách', value: `${guest.profile.firstName} ${guest.profile.lastName}` },
          { label: 'Email', value: guest.email },
          { label: 'Số điện thoại', value: formatPhone(guest.profile.phone) },
          { label: 'Số khách', value: `${booking.numberOfGuests} người` },
        ])
        .addSection('🏠 Thông tin booking', [
          { label: 'Homestay', value: homestay.title },
          { label: 'Check-in', value: formatDate(booking.checkInDate) },
          { label: 'Check-out', value: formatDate(booking.checkOutDate) },
          { label: 'Số đêm', value: `${booking.numberOfNights} đêm` },
          { label: 'Tổng tiền', value: formatCurrency(booking.pricing.totalAmount) },
          { label: 'Mã booking', value: booking._id.toString() },
        ])
        .addSection('� Thông tinẩ thanh toán', [
          { label: 'Mã giao dịch', value: transaction.id || transaction.bankReference },
          { label: 'Thời gian', value: formatDateTime(booking.payment.paidAt || new Date()) },
          { label: 'Trạng thái', value: 'Đã thanh toán' },
        ])
        .setHighlight('📌 Cần chuẩn bị:', [
          'Dọn dẹp và chuẩn bị homestay trước ngày check-in',
          'Liên hệ với khách để xác nhận thông tin',
          'Chuẩn bị hướng dẫn check-in và tiện nghi',
        ])
        .setButton('Xem chi tiết booking', bookingUrl, 'info');

      const { html, text } = builder.build(
        `Xin chào <strong>${host.profile.firstName || 'bạn'}</strong>,`,
        'Chúc mừng! Bạn có một booking mới đã được thanh toán cho homestay của bạn.',
        'Chúc bạn có một trải nghiệm hosting tuyệt vời! 🌟'
      );

      logger.info('Sending booking confirmed notification to host', {
        bookingId: booking._id,
        hostEmail: host.email,
        transactionId: transaction.id,
      });

      return this.sendEmail(
        host.email,
        '🎉 Booking mới đã được thanh toán - Homestay của bạn',
        html,
        text,
      );
    } catch (error) {
      logger.error('Failed to send booking confirmed notification to host', {
        error: error.message,
        bookingId: booking._id,
      });
      return false;
    }
  }

  /**
   * Gửi email nhắc nhở thanh toán cho khách hàng khi QR code hết hạn
   * Requirements: 10.5
   * 
   * @param {Object} booking - Booking object với đầy đủ thông tin
   * @returns {Promise<boolean>} True nếu gửi email thành công
   */
  async sendPaymentReminderEmail(booking) {
    try {
      const { guest, homestay } = await this._validateAndPopulateBooking(booking);
      const bookingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${booking._id}`;
      const generateQRUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${booking._id}/payment`;

      // Build email using template builder
      const builder = new EmailTemplateBuilder();
      
      builder
        .setHeader('⏰', 'Nhắc nhở thanh toán', 'Mã QR thanh toán đã hết hạn', 'warning')
        .setBadge('⚠️ Vui lòng hoàn tất thanh toán để giữ booking', 'warning')
        .addSection('🏠 Thông tin booking', [
          { label: 'Homestay', value: homestay.title },
          { label: 'Check-in', value: formatDate(booking.checkInDate) },
          { label: 'Check-out', value: formatDate(booking.checkOutDate) },
          { label: 'Số khách', value: `${booking.numberOfGuests} người` },
          { label: 'Số đêm', value: `${booking.numberOfNights} đêm` },
          { label: 'Tổng tiền', value: formatCurrency(booking.pricing.totalAmount) },
          { label: 'Mã booking', value: booking._id.toString() },
        ])
        .addSection('� Thôưng tin thanh toán', [
          { label: 'Trạng thái', value: 'Chưa thanh toán' },
          { label: 'Mã QR', value: 'Đã hết hạn (15 phút)' },
          { label: 'Hành động', value: 'Cần tạo mã QR mới' },
        ])
        .setHighlight('📌 Lưu ý quan trọng:', [
          'Booking của bạn chưa được xác nhận do chưa thanh toán',
          'Vui lòng tạo mã QR mới và hoàn tất thanh toán',
          'Booking có thể bị hủy nếu không thanh toán trong thời gian quy định',
        ])
        .setButton('Tạo mã QR mới và thanh toán', generateQRUrl, 'warning');

      const { html, text } = builder.build(
        `Xin chào <strong>${guest.profile.firstName || 'bạn'}</strong>,`,
        'Chúng tôi nhận thấy mã QR thanh toán cho booking của bạn đã hết hạn. Vui lòng tạo mã QR mới để hoàn tất thanh toán và xác nhận booking.',
        'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi! 🙏'
      );

      logger.info('Sending payment reminder email', {
        bookingId: booking._id,
        guestEmail: guest.email,
        qrExpiredAt: booking.payment.qrCode?.expiresAt,
      });

      return this.sendEmail(
        guest.email,
        '⏰ Nhắc nhở thanh toán - Mã QR đã hết hạn',
        html,
        text,
      );
    } catch (error) {
      logger.error('Failed to send payment reminder email', {
        error: error.message,
        bookingId: booking._id,
      });
      return false;
    }
  }
}

module.exports = new EmailService();
