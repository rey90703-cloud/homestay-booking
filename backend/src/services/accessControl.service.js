const AccessControl = require('../models/accessControl.model');
const Booking = require('../modules/bookings/booking.model');
const logger = require('../utils/logger');
const emailService = require('./email.service');
const EmailTemplateBuilder = require('./email-template.builder');
const { formatDate, formatDateTime, formatPhone } = require('../utils/formatters');

/**
 * Access Control Service
 * Quản lý guest passwords cho Smart Door Access Control
 * 
 * Requirements: 2.3, 2.4, 2.6, 5.2-5.6, 10.2, 10.3
 */
class AccessControlService {
  constructor() {
    this.emailService = emailService;
  }

  /**
   * Lưu guest password nhận từ ESP32 qua MQTT
   * Requirements: 2.3, 2.4, 2.6
   * 
   * @param {string} bookingId - ID của booking
   * @param {string} password - Guest password (4-6 digits, not "9999")
   * @param {number} durationMinutes - Thời gian hiệu lực (phút)
   * @returns {Promise<Object>} AccessControl document đã lưu
   */
  async saveGuestPassword(bookingId, password, durationMinutes) {
    try {
      logger.info('Saving guest password', { bookingId, durationMinutes });

      // Validate password format
      if (!/^\d{4,6}$/.test(password) || password === '9999') {
        throw new Error('Invalid guest password format');
      }

      // Validate duration
      if (durationMinutes < 0 || durationMinutes > 1440) {
        throw new Error('Duration must be between 0 and 1440 minutes');
      }

      // Tính thời gian hết hạn
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60000);

      // Tìm hoặc tạo mới AccessControl
      let accessControl = await AccessControl.findOne({ bookingId });

      if (accessControl) {
        // Update existing
        accessControl.guestPassword = password;
        accessControl.durationMinutes = durationMinutes;
        accessControl.expiresAt = expiresAt;
        accessControl.lastUpdated = now;
        accessControl.isActive = durationMinutes > 0; // duration = 0 means disabled
        
        await accessControl.save();
        logger.info('Guest password updated', { bookingId, expiresAt });
      } else {
        // Create new
        accessControl = await AccessControl.create({
          bookingId,
          guestPassword: password,
          durationMinutes,
          expiresAt,
          isActive: durationMinutes > 0,
        });
        logger.info('Guest password created', { bookingId, expiresAt });
      }

      return accessControl;
    } catch (error) {
      logger.error('Failed to save guest password', { 
        bookingId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Lấy thông tin password hiện tại của booking
   * Requirements: 7.1, 7.2, 7.3, 13.6
   * 
   * @param {string} bookingId - ID của booking
   * @returns {Promise<Object|null>} Thông tin password hoặc null nếu chưa có
   */
  async getCurrentPassword(bookingId) {
    try {
      const accessControl = await AccessControl.findOne({ bookingId });

      if (!accessControl) {
        return null;
      }

      // Kiểm tra xem password đã hết hạn chưa
      const isExpired = accessControl.isExpired();

      // Decrypt password khi trả về (Requirements: 13.6)
      const decryptedPassword = accessControl.getDecryptedPassword();

      return {
        password: decryptedPassword, // Return decrypted password
        durationMinutes: accessControl.durationMinutes,
        expiresAt: accessControl.expiresAt,
        isActive: accessControl.isActive && !isExpired,
        isExpired,
        lastUpdated: accessControl.lastUpdated,
        confirmedAt: accessControl.confirmedAt,
        confirmedBy: accessControl.confirmedBy,
      };
    } catch (error) {
      logger.error('Failed to get current password', { 
        bookingId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Tính toán duration tối ưu dựa trên thời gian booking
   * Requirements: 8.7
   * 
   * @param {Date} checkInDate - Ngày check-in
   * @param {Date} checkOutDate - Ngày check-out
   * @returns {number} Duration tối ưu (phút)
   */
  calculateOptimalDuration(checkInDate, checkOutDate) {
    try {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const now = new Date();

      // Nếu chưa đến check-in, tính từ check-in đến check-out
      if (now < checkIn) {
        const durationMs = checkOut.getTime() - checkIn.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        
        // Giới hạn tối đa 1440 phút (24 giờ)
        return Math.min(durationMinutes, 1440);
      }

      // Nếu đang trong khoảng booking, tính từ bây giờ đến check-out
      if (now >= checkIn && now < checkOut) {
        const durationMs = checkOut.getTime() - now.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        
        // Giới hạn tối đa 1440 phút (24 giờ)
        return Math.min(durationMinutes, 1440);
      }

      // Nếu đã qua check-out, trả về 0 (disable password)
      return 0;
    } catch (error) {
      logger.error('Failed to calculate optimal duration', { 
        checkInDate, 
        checkOutDate, 
        error: error.message 
      });
      // Default: 24 giờ
      return 1440;
    }
  }

  /**
   * Vô hiệu hóa password (set duration = 0)
   * Requirements: 10.2, 10.3
   * 
   * @param {string} bookingId - ID của booking
   * @returns {Promise<boolean>} true nếu thành công
   */
  async disablePassword(bookingId) {
    try {
      logger.info('Disabling guest password', { bookingId });

      const accessControl = await AccessControl.findOne({ bookingId });

      if (!accessControl) {
        logger.warn('No access control found to disable', { bookingId });
        return false;
      }

      // Set duration = 0 và isActive = false
      accessControl.durationMinutes = 0;
      accessControl.isActive = false;
      accessControl.expiresAt = new Date(); // Set expiry to now
      accessControl.lastUpdated = new Date();

      await accessControl.save();
      logger.info('Guest password disabled', { bookingId });

      return true;
    } catch (error) {
      logger.error('Failed to disable password', { 
        bookingId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Gửi email chứa guest password cho khách
   * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 12.2
   * 
   * @param {string} bookingId - ID của booking
   * @param {string} hostId - ID của host xác nhận
   * @returns {Promise<boolean>} true nếu gửi email thành công
   */
  async sendPasswordEmail(bookingId, hostId) {
    try {
      logger.info('Sending password email', { bookingId, hostId });

      // Lấy thông tin booking với populate
      const booking = await Booking.findById(bookingId)
        .populate('guestId', 'email profile')
        .populate('hostId', 'profile phone')
        .populate('homestayId', 'title address location');

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Lấy guest password hiện tại
      const passwordInfo = await this.getCurrentPassword(bookingId);

      if (!passwordInfo || !passwordInfo.isActive) {
        throw new Error('No active guest password found');
      }

      // Validate guest email
      const guest = booking.guestId;
      if (!guest || !guest.email) {
        throw new Error('Guest email not found');
      }

      const host = booking.hostId;
      const homestay = booking.homestayId;

      // Build email template
      const builder = new EmailTemplateBuilder();
      
      const { html, text } = builder
        .setHeader('🔑', 'Mật khẩu truy cập Homestay', 'Smart Door Access', 'primary')
        .setBadge('Mật khẩu đã sẵn sàng', 'success')
        .addSection('Thông tin mật khẩu', [
          { label: 'Mật khẩu cửa', value: `<strong style="font-size: 24px; color: #2563EB;">${passwordInfo.password}</strong>` },
          { label: 'Hiệu lực đến', value: formatDateTime(passwordInfo.expiresAt) },
        ])
        .addSection('Thông tin booking', [
          { label: 'Homestay', value: homestay.title },
          { label: 'Địa chỉ', value: homestay.address },
          { label: 'Check-in', value: formatDate(booking.checkInDate) },
          { label: 'Check-out', value: formatDate(booking.checkOutDate) },
        ])
        .addSection('Liên hệ chủ nhà', [
          { label: 'Tên', value: `${host.profile.firstName} ${host.profile.lastName}` },
          { label: 'Số điện thoại', value: formatPhone(host.phone) },
        ])
        .setHighlight('Hướng dẫn sử dụng', [
          'Nhập mật khẩu trên bàn phím cửa',
          'Nhấn phím # sau khi nhập xong',
          'Cửa sẽ tự động mở trong vài giây',
          'Mật khẩu có hiệu lực trong thời gian booking của bạn',
        ])
        .build(
          `Xin chào ${guest.profile.firstName},`,
          'Chủ nhà đã xác nhận booking của bạn và kích hoạt mật khẩu truy cập thông minh. Dưới đây là thông tin mật khẩu cửa của bạn:',
          'Vui lòng giữ mật khẩu này cẩn thận và không chia sẻ với người khác. Nếu có bất kỳ vấn đề gì, vui lòng liên hệ trực tiếp với chủ nhà.'
        );

      // Gửi email với retry logic (Requirements: 12.2)
      // EmailService.sendEmail() đã có retry logic với exponential backoff
      const emailSent = await this.emailService.sendEmail(
        guest.email,
        `🔑 Mật khẩu truy cập Homestay - ${homestay.title}`,
        html,
        text
      );

      if (!emailSent) {
        throw new Error('Failed to send email after retries');
      }

      // Cập nhật confirmedAt và confirmedBy
      const accessControl = await AccessControl.findOne({ bookingId });
      if (accessControl) {
        accessControl.confirmedAt = new Date();
        accessControl.confirmedBy = hostId;
        await accessControl.save();
      }

      logger.info('Password email sent successfully', { 
        bookingId, 
        guestEmail: guest.email 
      });

      return true;
    } catch (error) {
      logger.error('Failed to send password email', { 
        bookingId, 
        error: error.message 
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AccessControlService();
