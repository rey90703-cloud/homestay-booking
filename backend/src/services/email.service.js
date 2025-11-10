const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

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

  async sendEmail(to, subject, html, text) {
    if (!this.transporter) {
      logger.warn('Email service not available. Skipping email send.');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Booking Homestay'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const html = `
      <h2>Welcome to Booking Homestay!</h2>
      <p>Hi ${user.profile.firstName || 'there'},</p>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <br>
      <p>Best regards,<br>Booking Homestay Team</p>
    `;

    const text = `
      Welcome to Booking Homestay!
      
      Hi ${user.profile.firstName || 'there'},
      
      Thank you for registering. Please verify your email address by visiting:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
      
      Best regards,
      Booking Homestay Team
    `;

    return this.sendEmail(user.email, 'Verify Your Email Address', html, text);
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

  async sendBookingConfirmationEmail(booking, guest, host, homestay) {
    const bookingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${booking._id}`;

    const html = `
      <h2>Booking Confirmation</h2>
      <p>Hi ${guest.profile.firstName},</p>
      <p>Your booking has been confirmed!</p>
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Homestay:</strong> ${homestay.title}</li>
        <li><strong>Host:</strong> ${host.profile.firstName} ${host.profile.lastName}</li>
        <li><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</li>
        <li><strong>Guests:</strong> ${booking.numberOfGuests}</li>
        <li><strong>Total:</strong> $${booking.payment.totalAmount}</li>
        <li><strong>Booking ID:</strong> ${booking._id}</li>
      </ul>
      <p><a href="${bookingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Booking</a></p>
      <p>We hope you have a wonderful stay!</p>
      <br>
      <p>Best regards,<br>Booking Homestay Team</p>
    `;

    const text = `
      Booking Confirmation
      
      Hi ${guest.profile.firstName},
      
      Your booking has been confirmed!
      
      Booking Details:
      - Homestay: ${homestay.title}
      - Host: ${host.profile.firstName} ${host.profile.lastName}
      - Check-in: ${new Date(booking.checkIn).toLocaleDateString()}
      - Check-out: ${new Date(booking.checkOut).toLocaleDateString()}
      - Guests: ${booking.numberOfGuests}
      - Total: $${booking.payment.totalAmount}
      - Booking ID: ${booking._id}
      
      View your booking: ${bookingUrl}
      
      We hope you have a wonderful stay!
      
      Best regards,
      Booking Homestay Team
    `;

    return this.sendEmail(guest.email, 'Booking Confirmation', html, text);
  }

  async sendNewBookingNotificationToHost(booking, guest, host, homestay) {
    const bookingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/host/bookings/${booking._id}`;

    const html = `
      <h2>New Booking Received</h2>
      <p>Hi ${host.profile.firstName},</p>
      <p>You have a new booking for your property!</p>
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Homestay:</strong> ${homestay.title}</li>
        <li><strong>Guest:</strong> ${guest.profile.firstName} ${guest.profile.lastName}</li>
        <li><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</li>
        <li><strong>Guests:</strong> ${booking.numberOfGuests}</li>
        <li><strong>Total:</strong> $${booking.payment.totalAmount}</li>
        <li><strong>Booking ID:</strong> ${booking._id}</li>
      </ul>
      <p><a href="${bookingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Booking</a></p>
      <br>
      <p>Best regards,<br>Booking Homestay Team</p>
    `;

    const text = `
      New Booking Received
      
      Hi ${host.profile.firstName},
      
      You have a new booking for your property!
      
      Booking Details:
      - Homestay: ${homestay.title}
      - Guest: ${guest.profile.firstName} ${guest.profile.lastName}
      - Check-in: ${new Date(booking.checkIn).toLocaleDateString()}
      - Check-out: ${new Date(booking.checkOut).toLocaleDateString()}
      - Guests: ${booking.numberOfGuests}
      - Total: $${booking.payment.totalAmount}
      - Booking ID: ${booking._id}
      
      View booking: ${bookingUrl}
      
      Best regards,
      Booking Homestay Team
    `;

    return this.sendEmail(host.email, 'New Booking Received', html, text);
  }
}

module.exports = new EmailService();
