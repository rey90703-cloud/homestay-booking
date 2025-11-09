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

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.profile.firstName || 'there'},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <br>
      <p>Best regards,<br>Booking Homestay Team</p>
    `;

    const text = `
      Password Reset Request
      
      Hi ${user.profile.firstName || 'there'},
      
      We received a request to reset your password. Visit the following link to create a new password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
      
      Best regards,
      Booking Homestay Team
    `;

    return this.sendEmail(user.email, 'Reset Your Password', html, text);
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
