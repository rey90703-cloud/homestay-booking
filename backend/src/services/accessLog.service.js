const AccessLog = require('../models/accessLog.model');
const logger = require('../utils/logger');

/**
 * Access Log Service
 * Xử lý lưu trữ và truy vấn lịch sử truy cập cửa từ ESP32
 * Requirements: 9.2, 9.3, 9.5, 9.6, 9.7, 9.8
 */
class AccessLogService {
  /**
   * Lưu log truy cập từ MQTT message
   * Requirements: 9.2, 9.3, 9.8
   * 
   * @param {string} bookingId - ID của booking
   * @param {string} user - Loại người dùng: 'Admin', 'Guest', 'Chủ nhà'
   * @param {string} method - Phương thức truy cập: 'KEYPAD', 'WEB'
   * @param {number} timestamp - Timestamp dạng milliseconds từ ESP32
   * @returns {Promise<Object>} Access log đã lưu
   */
  async saveLog(bookingId, user, method, timestamp) {
    try {
      // Validate input
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      if (!user || !['Admin', 'Guest', 'Chủ nhà'].includes(user)) {
        throw new Error('Invalid user type. Must be: Admin, Guest, or Chủ nhà');
      }

      if (!method || !['KEYPAD', 'WEB'].includes(method)) {
        throw new Error('Invalid method. Must be: KEYPAD or WEB');
      }

      if (!timestamp || typeof timestamp !== 'number') {
        throw new Error('Invalid timestamp. Must be a number (milliseconds)');
      }

      // Chuyển đổi timestamp từ millis sang Date
      const dateTimestamp = this.convertMillisToDate(timestamp);

      // Tạo access log
      const accessLog = await AccessLog.create({
        bookingId,
        user,
        method,
        timestamp: dateTimestamp,
        rawTimestamp: timestamp,
      });

      logger.info('Access log saved successfully', {
        bookingId,
        user,
        method,
        timestamp: dateTimestamp,
        logId: accessLog._id,
      });

      return accessLog;
    } catch (error) {
      logger.error('Failed to save access log', {
        bookingId,
        user,
        method,
        timestamp,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Lấy danh sách logs với filtering và pagination
   * Requirements: 9.4, 9.5, 9.6, 9.7
   * 
   * @param {string} bookingId - ID của booking
   * @param {Object} filters - Bộ lọc
   * @param {string} filters.user - Lọc theo loại người dùng
   * @param {string} filters.method - Lọc theo phương thức
   * @param {Date} filters.startDate - Lọc từ ngày
   * @param {Date} filters.endDate - Lọc đến ngày
   * @param {Object} pagination - Phân trang
   * @param {number} pagination.page - Trang hiện tại (default: 1)
   * @param {number} pagination.limit - Số log mỗi trang (default: 20)
   * @returns {Promise<Object>} { logs, total, page, totalPages }
   */
  async getLogs(bookingId, filters = {}, pagination = {}) {
    try {
      // Validate bookingId
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      // Build query
      const query = { bookingId };

      // Apply filters
      if (filters.user) {
        query.user = filters.user;
      }

      if (filters.method) {
        query.method = filters.method;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        
        if (filters.startDate) {
          query.timestamp.$gte = new Date(filters.startDate);
        }
        
        if (filters.endDate) {
          query.timestamp.$lte = new Date(filters.endDate);
        }
      }

      // Pagination
      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 20;
      const skip = (page - 1) * limit;

      // Execute query với pagination
      const [logs, total] = await Promise.all([
        AccessLog.find(query)
          .sort({ timestamp: -1 }) // Sắp xếp theo thời gian mới nhất
          .skip(skip)
          .limit(limit)
          .lean(), // Trả về plain JavaScript object thay vì Mongoose document
        AccessLog.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Access logs retrieved successfully', {
        bookingId,
        filters,
        page,
        limit,
        total,
        totalPages,
      });

      return {
        logs,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to get access logs', {
        bookingId,
        filters,
        pagination,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Chuyển đổi timestamp từ milliseconds sang Date
   * Requirements: 9.8
   * 
   * @param {number} millis - Timestamp dạng milliseconds từ ESP32
   * @returns {Date} Date object
   */
  convertMillisToDate(millis) {
    if (typeof millis !== 'number') {
      throw new Error('Timestamp must be a number');
    }

    if (millis < 0) {
      throw new Error('Timestamp must be a positive number');
    }

    return new Date(millis);
  }

  /**
   * Lấy log mới nhất của một booking
   * Helper method để kiểm tra truy cập gần đây
   * 
   * @param {string} bookingId - ID của booking
   * @returns {Promise<Object|null>} Access log mới nhất hoặc null
   */
  async getLatestLog(bookingId) {
    try {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      const latestLog = await AccessLog.findOne({ bookingId })
        .sort({ timestamp: -1 })
        .lean();

      return latestLog;
    } catch (error) {
      logger.error('Failed to get latest access log', {
        bookingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Đếm số lần truy cập theo loại người dùng
   * Helper method để thống kê
   * 
   * @param {string} bookingId - ID của booking
   * @returns {Promise<Object>} { Admin: number, Guest: number, 'Chủ nhà': number }
   */
  async getAccessCountByUser(bookingId) {
    try {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      const counts = await AccessLog.aggregate([
        { $match: { bookingId: bookingId } },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
          },
        },
      ]);

      // Convert array to object
      const result = {
        Admin: 0,
        Guest: 0,
        'Chủ nhà': 0,
      };

      counts.forEach((item) => {
        result[item._id] = item.count;
      });

      return result;
    } catch (error) {
      logger.error('Failed to get access count by user', {
        bookingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Xóa logs cũ (cleanup)
   * Helper method để dọn dẹp logs cũ hơn một khoảng thời gian
   * 
   * @param {number} daysOld - Xóa logs cũ hơn số ngày này
   * @returns {Promise<number>} Số logs đã xóa
   */
  async deleteOldLogs(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await AccessLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      logger.info('Old access logs deleted', {
        daysOld,
        cutoffDate,
        deletedCount: result.deletedCount,
      });

      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to delete old access logs', {
        daysOld,
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AccessLogService();
