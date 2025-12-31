const MQTTService = require('../services/mqtt.service');
const accessControlService = require('../services/accessControl.service');
const accessLogService = require('../services/accessLog.service');
const Booking = require('../modules/bookings/booking.model');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/apiError');
const { PAYMENT_STATUS, BOOKING_STATUS } = require('../config/constants');
const { sanitizeBookingId, sanitizeDuration, sanitizeQueryParams } = require('../utils/sanitization.util');
const {
  logDoorControl,
  logPasswordAccess,
  logDurationChange,
  logAccessConfirmation,
  logForbiddenAccess,
  logMQTTCommand,
  getRequestMetadata,
} = require('../utils/audit.logger');
const logger = require('../utils/logger');

/**
 * Smart Door Controller
 * Xử lý các API endpoints cho Smart Door Access Control
 * 
 * Requirements: 11.1-11.8, 3.1-3.5, 6.2, 6.5, 6.6, 7.1-7.3, 8.2-8.5, 9.4-9.7, 13.5, 13.8
 */
class SmartDoorController {
  constructor() {
    this.mqttService = MQTTService.instance;
  }

  /**
   * POST /api/bookings/:id/confirm-access
   * Host xác nhận booking và gửi mật khẩu qua email cho guest
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 13.8
   */
  confirmAccess = catchAsync(async (req, res) => {
    const rawBookingId = req.params.id;
    const hostId = req.user._id;

    // Sanitize booking ID (Requirements: 13.8)
    const { valid, sanitized: bookingId, error } = sanitizeBookingId(rawBookingId);
    if (!valid) {
      throw new BadRequestError(error);
    }

    logger.info('Confirming access for booking', { bookingId, hostId });

    // Lấy thông tin booking
    const booking = await Booking.findById(bookingId)
      .populate('guestId', 'email profile')
      .populate('hostId', 'profile phone')
      .populate('homestayId', 'title address');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Kiểm tra user có phải là host của booking không
    if (booking.hostId._id.toString() !== hostId.toString()) {
      // Audit log: Forbidden access attempt (Requirements: 13.5)
      logForbiddenAccess(
        hostId,
        bookingId,
        'confirm_access',
        'Not the host of this booking',
        getRequestMetadata(req)
      );
      throw new ForbiddenError('Only the host can confirm access for this booking');
    }

    // Kiểm tra payment status phải là completed
    if (booking.payment.status !== PAYMENT_STATUS.COMPLETED) {
      throw new BadRequestError('Booking payment must be completed before confirming access');
    }

    // Kiểm tra booking status
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new BadRequestError('Cannot confirm access for cancelled booking');
    }

    // Lấy guest password hiện tại từ database
    const passwordInfo = await accessControlService.getCurrentPassword(bookingId);

    if (!passwordInfo || !passwordInfo.isActive) {
      throw new BadRequestError('No active guest password found. Please wait for ESP32 to generate password.');
    }

    // Gửi email chứa password cho guest
    await accessControlService.sendPasswordEmail(bookingId, hostId);

    // Audit log: Password accessed via email (Requirements: 13.5)
    logPasswordAccess(
      hostId,
      bookingId,
      'email',
      true,
      null,
      {
        ...getRequestMetadata(req),
        guestEmail: booking.guestId.email,
      }
    );

    // Cập nhật booking status thành confirmed (nếu chưa)
    if (booking.status === BOOKING_STATUS.PAID) {
      booking.status = BOOKING_STATUS.CONFIRMED;
    }

    // Cập nhật smartDoorAccess
    booking.smartDoorAccess = {
      enabled: true,
      confirmedAt: new Date(),
      confirmedBy: hostId,
    };

    await booking.save();

    // Audit log: Access confirmation successful (Requirements: 13.5)
    logAccessConfirmation(
      hostId,
      bookingId,
      true,
      null,
      getRequestMetadata(req)
    );

    logger.info('Access confirmed successfully', { bookingId, hostId });

    ApiResponse.success(
      res,
      {
        booking: {
          id: booking._id,
          status: booking.status,
          smartDoorAccess: booking.smartDoorAccess,
        },
        password: passwordInfo,
      },
      'Access confirmed and password email sent to guest',
    );
  });

  /**
   * POST /api/bookings/:id/door/open
   * Host mở cửa từ xa qua MQTT
   * Requirements: 6.2, 6.5, 6.6, 13.5, 13.8
   */
  openDoor = catchAsync(async (req, res) => {
    const rawBookingId = req.params.id;
    const hostId = req.user._id;

    // Sanitize booking ID (Requirements: 13.8)
    const { valid, sanitized: bookingId, error } = sanitizeBookingId(rawBookingId);
    if (!valid) {
      throw new BadRequestError(error);
    }

    logger.info('Opening door remotely', { bookingId, hostId });

    // Kiểm tra booking tồn tại và user là host
    const booking = await Booking.findById(bookingId).select('hostId status');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.hostId.toString() !== hostId.toString()) {
      // Audit log: Forbidden access attempt (Requirements: 13.5)
      logForbiddenAccess(
        hostId,
        bookingId,
        'open_door',
        'Not the host of this booking',
        getRequestMetadata(req)
      );
      throw new ForbiddenError('Only the host can control the door');
    }

    // Kiểm tra MQTT connection
    if (!this.mqttService.isConnected()) {
      throw new BadRequestError('MQTT broker not connected. Cannot send command.');
    }

    // Publish OPEN command
    const success = await this.mqttService.publishOpenDoor();

    // Audit log: MQTT command sent (Requirements: 13.5)
    logMQTTCommand(
      hostId,
      bookingId,
      'OPEN',
      success,
      success ? null : 'Failed to publish MQTT command',
      getRequestMetadata(req)
    );

    if (!success) {
      throw new BadRequestError('Failed to send open door command');
    }

    // Log action
    await accessLogService.saveLog(
      bookingId,
      'Chủ nhà',
      'WEB',
      Date.now(),
    );

    // Audit log: Door control action (Requirements: 13.5)
    logDoorControl(
      hostId,
      bookingId,
      'open',
      true,
      null,
      getRequestMetadata(req)
    );

    logger.info('Door opened successfully', { bookingId, hostId });

    ApiResponse.success(
      res,
      {
        command: 'OPEN',
        timestamp: new Date(),
        mqttConnected: this.mqttService.isConnected(),
      },
      'Open door command sent successfully',
    );
  });

  /**
   * POST /api/bookings/:id/door/close
   * Host khóa cửa từ xa qua MQTT
   * Requirements: 6.2, 13.5, 13.8
   */
  closeDoor = catchAsync(async (req, res) => {
    const rawBookingId = req.params.id;
    const hostId = req.user._id;

    // Sanitize booking ID (Requirements: 13.8)
    const { valid, sanitized: bookingId, error } = sanitizeBookingId(rawBookingId);
    if (!valid) {
      throw new BadRequestError(error);
    }

    logger.info('Closing door remotely', { bookingId, hostId });

    // Kiểm tra booking tồn tại và user là host
    const booking = await Booking.findById(bookingId).select('hostId status');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.hostId.toString() !== hostId.toString()) {
      // Audit log: Forbidden access attempt (Requirements: 13.5)
      logForbiddenAccess(
        hostId,
        bookingId,
        'close_door',
        'Not the host of this booking',
        getRequestMetadata(req)
      );
      throw new ForbiddenError('Only the host can control the door');
    }

    // Kiểm tra MQTT connection
    if (!this.mqttService.isConnected()) {
      throw new BadRequestError('MQTT broker not connected. Cannot send command.');
    }

    // Publish CLOSE command
    const success = await this.mqttService.publishCloseDoor();

    // Audit log: MQTT command sent (Requirements: 13.5)
    logMQTTCommand(
      hostId,
      bookingId,
      'CLOSE',
      success,
      success ? null : 'Failed to publish MQTT command',
      getRequestMetadata(req)
    );

    if (!success) {
      throw new BadRequestError('Failed to send close door command');
    }

    // Log action
    await accessLogService.saveLog(
      bookingId,
      'Chủ nhà',
      'WEB',
      Date.now(),
    );

    // Audit log: Door control action (Requirements: 13.5)
    logDoorControl(
      hostId,
      bookingId,
      'close',
      true,
      null,
      getRequestMetadata(req)
    );

    logger.info('Door closed successfully', { bookingId, hostId });

    ApiResponse.success(
      res,
      {
        command: 'CLOSE',
        timestamp: new Date(),
        mqttConnected: this.mqttService.isConnected(),
      },
      'Close door command sent successfully',
    );
  });

  /**
   * GET /api/bookings/:id/access-info
   * Lấy thông tin mật khẩu, trạng thái cửa, duration
   * Requirements: 7.1, 7.2, 7.3, 11.8, 13.5, 13.8
   */
  getAccessInfo = catchAsync(async (req, res) => {
    const rawBookingId = req.params.id;
    const userId = req.user._id;

    // Sanitize booking ID (Requirements: 13.8)
    const { valid, sanitized: bookingId, error } = sanitizeBookingId(rawBookingId);
    if (!valid) {
      throw new BadRequestError(error);
    }

    logger.info('Getting access info', { bookingId, userId });

    // Lấy thông tin booking
    const booking = await Booking.findById(bookingId)
      .select('hostId guestId status smartDoorAccess checkInDate checkOutDate');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Kiểm tra quyền truy cập (host hoặc guest)
    const isHost = booking.hostId.toString() === userId.toString();
    const isGuest = booking.guestId.toString() === userId.toString();

    if (!isHost && !isGuest) {
      // Audit log: Forbidden access attempt (Requirements: 13.5)
      logForbiddenAccess(
        userId,
        bookingId,
        'get_access_info',
        'Not the host or guest of this booking',
        getRequestMetadata(req)
      );
      throw new ForbiddenError('You do not have permission to access this information');
    }

    // Lấy thông tin password
    const passwordInfo = await accessControlService.getCurrentPassword(bookingId);

    // Audit log: Password accessed via API (Requirements: 13.5)
    if (passwordInfo && passwordInfo.isActive) {
      logPasswordAccess(
        userId,
        bookingId,
        'api',
        true,
        null,
        {
          ...getRequestMetadata(req),
          userRole: isHost ? 'host' : 'guest',
        }
      );
    }

    // Lấy MQTT connection status
    const mqttConnected = this.mqttService.isConnected();
    const connectionState = this.mqttService.getConnectionState();

    // Lấy device online status từ smartDoor.init
    const { getDoorStatus, isDeviceOnline } = require('../services/smartDoor.init');
    const deviceId = 'default'; // Tạm thời dùng default device ID
    const doorStatus = getDoorStatus(deviceId);
    const deviceOnline = isDeviceOnline(deviceId);

    logger.info('Access info retrieved', { 
      bookingId, 
      hasPassword: !!passwordInfo,
      deviceOnline,
      doorStatus: doorStatus?.status,
    });

    ApiResponse.success(
      res,
      {
        booking: {
          id: booking._id,
          status: booking.status,
          smartDoorAccess: booking.smartDoorAccess,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
        },
        password: passwordInfo,
        mqtt: {
          connected: mqttConnected,
          lastConnectTime: connectionState.lastConnectTime,
          lastDisconnectTime: connectionState.lastDisconnectTime,
          status: doorStatus?.status || 'UNKNOWN',
          lastUpdate: doorStatus?.lastUpdate || null,
        },
        isOnline: deviceOnline,
      },
      'Access information retrieved successfully',
    );
  });

  /**
   * GET /api/bookings/:id/access-logs
   * Lấy lịch sử truy cập với filtering và pagination
   * Requirements: 9.4, 9.5, 9.6, 9.7, 13.5, 13.8
   */
  getAccessLogs = catchAsync(async (req, res) => {
    const rawBookingId = req.params.id;
    const userId = req.user._id;

    // Sanitize booking ID (Requirements: 13.8)
    const { valid, sanitized: bookingId, error } = sanitizeBookingId(rawBookingId);
    if (!valid) {
      throw new BadRequestError(error);
    }

    logger.info('Getting access logs', { bookingId, userId });

    // Lấy thông tin booking
    const booking = await Booking.findById(bookingId).select('hostId guestId');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Kiểm tra quyền truy cập (host hoặc guest)
    const isHost = booking.hostId.toString() === userId.toString();
    const isGuest = booking.guestId.toString() === userId.toString();

    if (!isHost && !isGuest) {
      // Audit log: Forbidden access attempt (Requirements: 13.5)
      logForbiddenAccess(
        userId,
        bookingId,
        'get_access_logs',
        'Not the host or guest of this booking',
        getRequestMetadata(req)
      );
      throw new ForbiddenError('You do not have permission to access these logs');
    }

    // Sanitize query params (Requirements: 13.8)
    const sanitizedQuery = sanitizeQueryParams(req.query);

    // Parse filters từ query params
    const filters = {
      user: sanitizedQuery.user,
      method: sanitizedQuery.method,
      startDate: sanitizedQuery.startDate,
      endDate: req.query.endDate,
    };

    // Parse pagination
    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    };

    // Lấy logs
    const result = await accessLogService.getLogs(bookingId, filters, pagination);

    logger.info('Access logs retrieved', {
      bookingId,
      total: result.total,
      page: result.page,
    });

    ApiResponse.success(
      res,
      result.logs,
      'Access logs retrieved successfully',
      200,
      {
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    );
  });

  /**
   * POST /api/bookings/:id/set-duration
   * Thay đổi thời gian hiệu lực mật khẩu
   * Requirements: 8.2, 8.3, 8.4, 8.5, 13.5, 13.8
   */
  setDuration = catchAsync(async (req, res) => {
    const rawBookingId = req.params.id;
    const hostId = req.user._id;
    const { durationMinutes: rawDuration } = req.body;

    // Sanitize booking ID (Requirements: 13.8)
    const bookingIdValidation = sanitizeBookingId(rawBookingId);
    if (!bookingIdValidation.valid) {
      throw new BadRequestError(bookingIdValidation.error);
    }
    const bookingId = bookingIdValidation.sanitized;

    // Sanitize and validate duration (Requirements: 8.2, 13.8)
    const durationValidation = sanitizeDuration(rawDuration);
    if (!durationValidation.valid) {
      throw new BadRequestError(durationValidation.error);
    }
    const durationMinutes = durationValidation.sanitized;

    logger.info('Setting password duration', { bookingId, hostId, durationMinutes });

    // Lấy thông tin booking
    const booking = await Booking.findById(bookingId).select('hostId status');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Kiểm tra user có phải là host không
    if (booking.hostId.toString() !== hostId.toString()) {
      // Audit log: Forbidden access attempt (Requirements: 13.5)
      logForbiddenAccess(
        hostId,
        bookingId,
        'set_duration',
        'Not the host of this booking',
        getRequestMetadata(req)
      );
      throw new ForbiddenError('Only the host can change password duration');
    }

    // Lấy duration hiện tại để log thay đổi
    const currentPasswordInfo = await accessControlService.getCurrentPassword(bookingId);
    const oldDuration = currentPasswordInfo?.durationMinutes || null;

    // Kiểm tra MQTT connection
    if (!this.mqttService.isConnected()) {
      throw new BadRequestError('MQTT broker not connected. Cannot send command.');
    }

    // Publish set duration command
    const success = await this.mqttService.publishSetDuration(durationMinutes);

    // Audit log: MQTT command sent (Requirements: 13.5)
    logMQTTCommand(
      hostId,
      bookingId,
      `SET_DURATION:${durationMinutes}`,
      success,
      success ? null : 'Failed to publish MQTT command',
      getRequestMetadata(req)
    );

    if (!success) {
      throw new BadRequestError('Failed to send set duration command');
    }

    // Audit log: Duration change (Requirements: 13.5)
    logDurationChange(
      hostId,
      bookingId,
      oldDuration,
      durationMinutes,
      true,
      null,
      getRequestMetadata(req)
    );

    logger.info('Duration set successfully', { bookingId, hostId, durationMinutes });

    ApiResponse.success(
      res,
      {
        durationMinutes,
        timestamp: new Date(),
        mqttConnected: this.mqttService.isConnected(),
      },
      'Password duration updated successfully',
    );
  });
}

// Export singleton instance
module.exports = new SmartDoorController();
