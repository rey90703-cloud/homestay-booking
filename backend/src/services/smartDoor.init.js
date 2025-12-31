const MQTTService = require('./mqtt.service');
const accessControlService = require('./accessControl.service');
const accessLogService = require('./accessLog.service');
const smartDoorNotificationService = require('./smartDoorNotification.service');
const logger = require('../utils/logger');

/**
 * Smart Door Initialization
 * Wire MQTT Service với Access Control, Log Services và Notification Service
 * 
 * File này setup các message handlers để xử lý messages từ ESP32:
 * - smartdoor/guest/update → lưu guest password + gửi notification
 * - smartdoor/log → lưu access log + gửi notification
 * - smartdoor/status → update cache/database + gửi notification
 * 
 * Requirements: 2.2, 9.2, 12.4, 15.1, 15.3, 15.7
 */

// Singleton instance của MQTT Service
const mqttService = MQTTService.instance;

// Cache cho door status và device online detection
const doorStatusCache = new Map();
const deviceStatusTimers = new Map();

// Configuration
const DEVICE_OFFLINE_TIMEOUT = 10000; // 10 seconds - ESP32 reconnects every ~6s, publish every 3s

/**
 * Setup MQTT message handlers
 * Requirements: 2.2, 9.2
 */
function setupMessageHandlers() {
  logger.info('Setting up MQTT message handlers for Smart Door');

  // Handler 1: Guest Password Update
  // Khi nhận smartdoor/guest/update → gọi AccessControlService.saveGuestPassword()
  mqttService.onGuestPasswordUpdate(async (data) => {
    try {
      logger.info('Processing guest password update from MQTT', {
        password: '****',
        duration: data.duration_minutes,
      });

      // Tìm booking active gần nhất với payment completed
      // Trong production, nên có device mapping table
      const Booking = require('../modules/bookings/booking.model');
      const { PAYMENT_STATUS, BOOKING_STATUS } = require('../config/constants');
      
      const booking = await Booking.findOne({
        'payment.status': PAYMENT_STATUS.COMPLETED,
        status: { $in: [BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN] },
        checkOutDate: { $gte: new Date() }, // Chưa checkout
      })
        .sort({ 'payment.paidAt': -1 }) // Booking thanh toán gần nhất
        .populate('homestayId', 'hostId');

      if (!booking) {
        logger.warn('No active booking found for guest password update', {
          duration: data.duration_minutes,
        });
        return;
      }

      const bookingId = booking._id.toString();
      logger.info('Found active booking for password update', { bookingId });

      // Lưu guest password vào database
      await accessControlService.saveGuestPassword(
        bookingId,
        data.current_pass,
        data.duration_minutes
      );
      logger.info('Guest password saved successfully', { bookingId });

      // Requirement 15.3: Gửi notification khi password update
      const hostId = booking.homestayId.hostId;
      
      await smartDoorNotificationService.notifyPasswordUpdate(hostId, bookingId, {
        newPassword: data.current_pass,
        expiresAt: new Date(Date.now() + data.duration_minutes * 60000),
        durationMinutes: data.duration_minutes,
      });

    } catch (error) {
      logger.error('Failed to process guest password update', {
        error: error.message,
        stack: error.stack,
      });
    }
  });

  // Handler 2: Access Log
  // Khi nhận smartdoor/log → gọi AccessLogService.saveLog()
  mqttService.onLogReceived(async (logData) => {
    try {
      logger.info('Processing access log from MQTT', {
        user: logData.user,
        method: logData.method,
        time: logData.time,
      });

      // Tìm booking active gần nhất với payment completed
      const Booking = require('../modules/bookings/booking.model');
      const { PAYMENT_STATUS, BOOKING_STATUS } = require('../config/constants');
      
      const booking = await Booking.findOne({
        'payment.status': PAYMENT_STATUS.COMPLETED,
        status: { $in: [BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN] },
        checkOutDate: { $gte: new Date() },
      })
        .sort({ 'payment.paidAt': -1 })
        .populate('homestayId', 'hostId');

      if (!booking) {
        logger.warn('No active booking found for access log', {
          user: logData.user,
          method: logData.method,
        });
        return;
      }

      const bookingId = booking._id.toString();
      
      // Lưu access log
      await accessLogService.saveLog(
        bookingId,
        logData.user,
        logData.method,
        logData.time
      );
      logger.info('Access log saved successfully', { bookingId });

      // Requirement 15.1: Gửi notification khi có log mới
      const hostId = booking.homestayId.hostId;
      
      await smartDoorNotificationService.notifyDoorAccess(hostId, bookingId, {
        user: logData.user,
        method: logData.method,
        timestamp: new Date(logData.time),
      });

    } catch (error) {
      logger.error('Failed to process access log', {
        error: error.message,
        stack: error.stack,
      });
    }
  });

  // Handler 3: Door Status Update
  // Khi nhận smartdoor/status → update cache và reset offline timer
  mqttService.onStatusUpdate(async (status) => {
    try {
      logger.info('Processing door status update from MQTT', { status });

      // Tìm booking active gần nhất
      const Booking = require('../modules/bookings/booking.model');
      const { PAYMENT_STATUS, BOOKING_STATUS } = require('../config/constants');
      
      const booking = await Booking.findOne({
        'payment.status': PAYMENT_STATUS.COMPLETED,
        status: { $in: [BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN] },
        checkOutDate: { $gte: new Date() },
      })
        .sort({ 'payment.paidAt': -1 })
        .populate('homestayId', 'hostId');

      const deviceId = 'default'; // Tạm thời dùng default

      // Check if device was offline before
      const previousStatus = doorStatusCache.get(deviceId);
      const wasOffline = previousStatus && !previousStatus.isOnline;

      // Update cache
      doorStatusCache.set(deviceId, {
        status,
        lastUpdate: new Date(),
        isOnline: true,
      });

      // Reset offline detection timer (30 seconds)
      // Requirements: 12.4 - Track last status update và detect offline
      resetOfflineTimer(deviceId);

      // Emit WebSocket event cho frontend
      if (booking && global.io) {
        const bookingId = booking._id.toString();
        const hostId = booking.homestayId.hostId.toString();
        
        // Requirement 15.7: Gửi notification khi device online lại
        if (wasOffline) {
          try {
            await smartDoorNotificationService.notifyDeviceStatus(hostId, bookingId, {
              isOnline: true,
              lastUpdate: new Date(),
            });
            logger.info('Device online notification sent', { bookingId, deviceId });
          } catch (error) {
            logger.error('Failed to send device online notification', {
              deviceId,
              error: error.message,
            });
          }
        }

        // Requirement 15.4: Gửi notification khi trạng thái cửa thay đổi
        try {
          await smartDoorNotificationService.notifyDoorStatusUpdate(hostId, bookingId, {
            status,
            timestamp: new Date(),
          });
          logger.info('Door status update notification sent', { bookingId, status });
        } catch (error) {
          logger.error('Failed to send door status notification', {
            bookingId,
            error: error.message,
          });
        }
      } else {
        logger.warn('No active booking found or Socket.IO not available for status update', { deviceId });
      }

      logger.debug('Door status cache updated', {
        deviceId,
        status,
        cacheSize: doorStatusCache.size,
      });

    } catch (error) {
      logger.error('Failed to process door status update', {
        error: error.message,
        stack: error.stack,
      });
    }
  });

  // Setup connection handlers để track device online/offline
  mqttService.onConnect(() => {
    logger.info('MQTT connected - Smart Door device may come online');
    // Khi MQTT reconnect, device có thể online lại
    // Timer sẽ được reset khi nhận status update đầu tiên
  });

  mqttService.onDisconnect(() => {
    logger.warn('MQTT disconnected - marking all devices as potentially offline');
    // Khi MQTT disconnect, không thể biết device status
    // Giữ nguyên cache nhưng log warning
  });

  logger.info('MQTT message handlers setup completed');
}

/**
 * Reset offline detection timer cho device
 * Requirements: 12.4
 * 
 * @param {string} deviceId - ID của device
 */
function resetOfflineTimer(deviceId) {
  // Clear existing timer nếu có
  if (deviceStatusTimers.has(deviceId)) {
    clearTimeout(deviceStatusTimers.get(deviceId));
  }

  // Set new timer
  const timer = setTimeout(() => {
    handleDeviceOffline(deviceId);
  }, DEVICE_OFFLINE_TIMEOUT);

  deviceStatusTimers.set(deviceId, timer);
}

/**
 * Xử lý khi device offline (không nhận status update trong 30 giây)
 * Requirements: 12.4, 15.7
 * 
 * @param {string} deviceId - ID của device
 */
async function handleDeviceOffline(deviceId) {
  logger.warn('Device detected as offline', {
    deviceId,
    timeout: DEVICE_OFFLINE_TIMEOUT,
  });

  // Update cache
  const cachedStatus = doorStatusCache.get(deviceId);
  if (cachedStatus) {
    cachedStatus.isOnline = false;
    doorStatusCache.set(deviceId, cachedStatus);
  }

  // Requirement 15.7: Gửi notification khi ESP32 offline
  try {
    // Tìm booking active gần nhất
    const Booking = require('../modules/bookings/booking.model');
    const { PAYMENT_STATUS, BOOKING_STATUS } = require('../config/constants');
    
    const booking = await Booking.findOne({
      'payment.status': PAYMENT_STATUS.COMPLETED,
      status: { $in: [BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN] },
      checkOutDate: { $gte: new Date() },
    })
      .sort({ 'payment.paidAt': -1 })
      .populate('homestayId', 'hostId');

    if (booking && global.io) {
      const bookingId = booking._id.toString();
      const hostId = booking.homestayId.hostId.toString();
      
      await smartDoorNotificationService.notifyDeviceStatus(hostId, bookingId, {
        isOnline: false,
        lastUpdate: cachedStatus?.lastUpdate || new Date(),
      });
      
      logger.info('Device offline notification sent', { bookingId, deviceId });
    } else {
      logger.warn('No active booking found or Socket.IO not available for offline notification', { deviceId });
    }
  } catch (error) {
    logger.error('Failed to send device offline notification', {
      deviceId,
      error: error.message,
    });
  }

  // Clear timer
  deviceStatusTimers.delete(deviceId);
}

/**
 * Lấy door status từ cache
 * 
 * @param {string} deviceId - ID của device (default: 'default')
 * @returns {Object|null} Door status hoặc null nếu chưa có
 */
function getDoorStatus(deviceId = 'default') {
  return doorStatusCache.get(deviceId) || null;
}

/**
 * Kiểm tra device có online không
 * 
 * @param {string} deviceId - ID của device (default: 'default')
 * @returns {boolean} true nếu online
 */
function isDeviceOnline(deviceId = 'default') {
  const status = doorStatusCache.get(deviceId);
  return status ? status.isOnline : false;
}

/**
 * Lấy thời gian kể từ lần status update cuối cùng
 * 
 * @param {string} deviceId - ID của device (default: 'default')
 * @returns {number|null} Số milliseconds kể từ update cuối, hoặc null nếu chưa có update
 */
function getTimeSinceLastUpdate(deviceId = 'default') {
  const status = doorStatusCache.get(deviceId);
  if (!status || !status.lastUpdate) {
    return null;
  }
  
  return Date.now() - status.lastUpdate.getTime();
}

/**
 * Lấy tất cả device status
 * 
 * @returns {Array} Danh sách device status
 */
function getAllDeviceStatus() {
  const devices = [];
  
  for (const [deviceId, status] of doorStatusCache.entries()) {
    devices.push({
      deviceId,
      ...status,
      timeSinceLastUpdate: getTimeSinceLastUpdate(deviceId),
    });
  }
  
  return devices;
}

/**
 * Initialize Smart Door system
 * Kết nối MQTT và setup handlers
 */
async function initialize() {
  try {
    logger.info('Initializing Smart Door system');

    // Initialize notification service với Socket.IO instance
    // Socket.IO instance được set trong global.io bởi server.js
    if (global.io) {
      smartDoorNotificationService.initialize(global.io);
      logger.info('Smart Door notification service initialized with Socket.IO');
    } else {
      logger.warn('Socket.IO not available yet, notification service will use lazy initialization');
    }

    // Setup message handlers trước khi connect
    setupMessageHandlers();

    // Connect to MQTT broker
    await mqttService.connect();

    logger.info('Smart Door system initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Smart Door system', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Cleanup khi shutdown
 */
async function cleanup() {
  try {
    logger.info('Cleaning up Smart Door system');

    // Clear all timers
    for (const timer of deviceStatusTimers.values()) {
      clearTimeout(timer);
    }
    deviceStatusTimers.clear();

    // Clear cache
    doorStatusCache.clear();

    // Disconnect MQTT
    await mqttService.disconnect();

    logger.info('Smart Door system cleaned up successfully');
  } catch (error) {
    logger.error('Failed to cleanup Smart Door system', {
      error: error.message,
    });
  }
}

// Export functions
module.exports = {
  initialize,
  cleanup,
  setupMessageHandlers,
  getDoorStatus,
  isDeviceOnline,
  getTimeSinceLastUpdate,
  getAllDeviceStatus,
  mqttService, // Export để có thể dùng trong controllers
  smartDoorNotificationService, // Export notification service
};
