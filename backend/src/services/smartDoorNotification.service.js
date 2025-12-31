/**
 * Smart Door Notification Service
 * Gửi realtime notifications qua WebSocket cho smart door events
 */

const logger = require('../utils/logger');

class SmartDoorNotificationService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize service với Socket.IO instance
   * @param {Server} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io;
    logger.info('SmartDoorNotificationService initialized');
  }

  /**
   * Get Socket.IO instance
   * @private
   * @returns {Server} Socket.IO instance
   */
  _getIO() {
    if (!this.io) {
      // Fallback to global io if not initialized
      this.io = global.io;
    }

    if (!this.io) {
      throw new Error('Socket.IO not initialized. Call initialize() first.');
    }

    return this.io;
  }

  /**
   * Gửi notification đến specific user
   * @private
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _emitToUser(userId, event, data) {
    try {
      const io = this._getIO();
      
      // Emit to all sockets của user này
      io.sockets.sockets.forEach((socket) => {
        if (socket.userId === userId) {
          socket.emit(event, data);
        }
      });

      logger.debug('Notification sent to user', {
        userId,
        event,
        data,
      });
    } catch (error) {
      logger.error('Failed to emit notification to user', {
        userId,
        event,
        error: error.message,
      });
    }
  }

  /**
   * Gửi notification đến booking room
   * @private
   * @param {string} bookingId - Booking ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _emitToBookingRoom(bookingId, event, data) {
    try {
      const io = this._getIO();
      const roomName = `booking:${bookingId}`;
      
      io.to(roomName).emit(event, data);

      logger.debug('Notification sent to booking room', {
        bookingId,
        roomName,
        event,
        data,
      });
    } catch (error) {
      logger.error('Failed to emit notification to booking room', {
        bookingId,
        event,
        error: error.message,
      });
    }
  }

  /**
   * Gửi notification khi có người truy cập cửa
   * @param {string} hostId - Host user ID
   * @param {string} bookingId - Booking ID
   * @param {Object} log - Access log data
   * @param {string} log.user - User type (Admin/Guest/Chủ nhà)
   * @param {string} log.method - Access method (KEYPAD/WEB)
   * @param {Date} log.timestamp - Access timestamp
   * @returns {Promise<void>}
   */
  async notifyDoorAccess(hostId, bookingId, log) {
    try {
      const notificationData = {
        bookingId,
        user: log.user,
        method: log.method,
        timestamp: log.timestamp,
        message: `${log.user} đã mở cửa bằng ${log.method}`,
      };

      // Gửi đến host
      this._emitToUser(hostId, 'door:access:log', notificationData);

      // Gửi đến booking room (nếu có nhiều người theo dõi)
      this._emitToBookingRoom(bookingId, 'door:access:log', notificationData);

      logger.info('Door access notification sent', {
        hostId,
        bookingId,
        log,
      });
    } catch (error) {
      logger.error('Failed to send door access notification', {
        hostId,
        bookingId,
        log,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Gửi notification khi mật khẩu guest thay đổi
   * @param {string} hostId - Host user ID
   * @param {string} bookingId - Booking ID
   * @param {Object} passwordData - Password update data
   * @param {string} passwordData.newPassword - New guest password
   * @param {Date} passwordData.expiresAt - Expiry time
   * @param {number} passwordData.durationMinutes - Duration in minutes
   * @returns {Promise<void>}
   */
  async notifyPasswordUpdate(hostId, bookingId, passwordData) {
    try {
      const notificationData = {
        bookingId,
        expiresAt: passwordData.expiresAt,
        durationMinutes: passwordData.durationMinutes,
        message: 'Mật khẩu guest đã được cập nhật',
      };

      // Gửi đến host
      this._emitToUser(hostId, 'door:password:update', notificationData);

      // Gửi đến booking room
      this._emitToBookingRoom(bookingId, 'door:password:update', notificationData);

      logger.info('Password update notification sent', {
        hostId,
        bookingId,
        passwordData: {
          expiresAt: passwordData.expiresAt,
          durationMinutes: passwordData.durationMinutes,
        },
      });
    } catch (error) {
      logger.error('Failed to send password update notification', {
        hostId,
        bookingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Gửi notification khi trạng thái thiết bị thay đổi (online/offline)
   * @param {string} hostId - Host user ID
   * @param {string} bookingId - Booking ID
   * @param {Object} statusData - Device status data
   * @param {boolean} statusData.isOnline - Device online status
   * @param {Date} statusData.lastUpdate - Last status update time
   * @returns {Promise<void>}
   */
  async notifyDeviceStatus(hostId, bookingId, statusData) {
    try {
      const notificationData = {
        bookingId,
        isOnline: statusData.isOnline,
        lastUpdate: statusData.lastUpdate,
        message: statusData.isOnline
          ? 'Thiết bị smart door đã kết nối'
          : 'Thiết bị smart door đã mất kết nối',
        severity: statusData.isOnline ? 'info' : 'warning',
      };

      // Gửi đến host
      this._emitToUser(hostId, 'door:device:status', notificationData);

      // Gửi đến booking room
      this._emitToBookingRoom(bookingId, 'door:device:status', notificationData);

      logger.info('Device status notification sent', {
        hostId,
        bookingId,
        statusData,
      });
    } catch (error) {
      logger.error('Failed to send device status notification', {
        hostId,
        bookingId,
        statusData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Gửi notification khi trạng thái cửa thay đổi
   * @param {string} hostId - Host user ID
   * @param {string} bookingId - Booking ID
   * @param {Object} statusData - Door status data
   * @param {string} statusData.status - Door status (LOCKED/OPEN)
   * @param {Date} statusData.timestamp - Status update timestamp
   * @returns {Promise<void>}
   */
  async notifyDoorStatusUpdate(hostId, bookingId, statusData) {
    try {
      const notificationData = {
        bookingId,
        status: statusData.status,
        timestamp: statusData.timestamp,
        message: statusData.status === 'OPEN' ? 'Cửa đã mở' : 'Cửa đã khóa',
      };

      // Gửi đến host
      this._emitToUser(hostId, 'door:status:update', notificationData);

      // Gửi đến booking room
      this._emitToBookingRoom(bookingId, 'door:status:update', notificationData);

      logger.debug('Door status update notification sent', {
        hostId,
        bookingId,
        statusData,
      });
    } catch (error) {
      logger.error('Failed to send door status update notification', {
        hostId,
        bookingId,
        statusData,
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
const smartDoorNotificationService = new SmartDoorNotificationService();

module.exports = smartDoorNotificationService;
