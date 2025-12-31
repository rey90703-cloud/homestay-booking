/**
 * Audit Logger Utility
 * Requirements: 13.5
 * 
 * Log tất cả các hành động quan trọng liên quan đến security và access control
 * Audit logs được lưu riêng để dễ dàng review và compliance
 */

const logger = require('./logger');

/**
 * Audit event types
 */
const AUDIT_EVENT_TYPES = {
  // Door control events
  DOOR_OPEN: 'door_open',
  DOOR_CLOSE: 'door_close',
  DOOR_OPEN_FAILED: 'door_open_failed',
  DOOR_CLOSE_FAILED: 'door_close_failed',
  
  // Password events
  PASSWORD_ACCESSED: 'password_accessed',
  PASSWORD_UPDATED: 'password_updated',
  PASSWORD_DISABLED: 'password_disabled',
  PASSWORD_EMAIL_SENT: 'password_email_sent',
  PASSWORD_EMAIL_FAILED: 'password_email_failed',
  
  // Duration events
  DURATION_CHANGED: 'duration_changed',
  DURATION_CHANGE_FAILED: 'duration_change_failed',
  
  // Access confirmation events
  ACCESS_CONFIRMED: 'access_confirmed',
  ACCESS_CONFIRMATION_FAILED: 'access_confirmation_failed',
  
  // Authentication events
  UNAUTHORIZED_ACCESS_ATTEMPT: 'unauthorized_access_attempt',
  FORBIDDEN_ACCESS_ATTEMPT: 'forbidden_access_attempt',
  
  // MQTT events
  MQTT_COMMAND_SENT: 'mqtt_command_sent',
  MQTT_COMMAND_FAILED: 'mqtt_command_failed',
};

/**
 * Log an audit event
 * Requirements: 13.5
 * 
 * @param {string} eventType - Type of event (from AUDIT_EVENT_TYPES)
 * @param {Object} details - Event details
 * @param {string} details.userId - ID of user performing action
 * @param {string} details.bookingId - ID of booking (if applicable)
 * @param {string} details.action - Action performed
 * @param {string} details.resource - Resource affected
 * @param {Object} details.metadata - Additional metadata
 * @param {boolean} details.success - Whether action was successful
 * @param {string} details.error - Error message (if failed)
 */
function logAuditEvent(eventType, details) {
  const {
    userId,
    bookingId,
    action,
    resource,
    metadata = {},
    success = true,
    error = null,
  } = details;

  const auditLog = {
    eventType,
    timestamp: new Date().toISOString(),
    userId: userId?.toString(),
    bookingId: bookingId?.toString(),
    action,
    resource,
    success,
    error,
    metadata,
    // Add IP address if available (from request context)
    ip: metadata.ip || null,
    userAgent: metadata.userAgent || null,
  };

  // Log to audit logger with special prefix
  logger.info(`[AUDIT] ${eventType}`, auditLog);

  // In production, you might want to:
  // 1. Send to separate audit log file
  // 2. Send to external audit service (e.g., AWS CloudTrail, Datadog)
  // 3. Store in separate audit database table
  
  return auditLog;
}

/**
 * Log door control action
 * Requirements: 13.5
 */
function logDoorControl(userId, bookingId, command, success, error = null, metadata = {}) {
  const eventType = command === 'OPEN' 
    ? (success ? AUDIT_EVENT_TYPES.DOOR_OPEN : AUDIT_EVENT_TYPES.DOOR_OPEN_FAILED)
    : (success ? AUDIT_EVENT_TYPES.DOOR_CLOSE : AUDIT_EVENT_TYPES.DOOR_CLOSE_FAILED);

  return logAuditEvent(eventType, {
    userId,
    bookingId,
    action: `door_${command.toLowerCase()}`,
    resource: 'smart_door',
    success,
    error,
    metadata: {
      ...metadata,
      command,
    },
  });
}

/**
 * Log password access
 * Requirements: 13.5
 */
function logPasswordAccess(userId, bookingId, accessType, success, error = null, metadata = {}) {
  return logAuditEvent(AUDIT_EVENT_TYPES.PASSWORD_ACCESSED, {
    userId,
    bookingId,
    action: 'password_access',
    resource: 'guest_password',
    success,
    error,
    metadata: {
      ...metadata,
      accessType, // 'view', 'email', 'api'
    },
  });
}

/**
 * Log password update
 * Requirements: 13.5
 */
function logPasswordUpdate(bookingId, source, success, error = null, metadata = {}) {
  return logAuditEvent(AUDIT_EVENT_TYPES.PASSWORD_UPDATED, {
    userId: null, // System action
    bookingId,
    action: 'password_update',
    resource: 'guest_password',
    success,
    error,
    metadata: {
      ...metadata,
      source, // 'esp32', 'manual', 'system'
    },
  });
}

/**
 * Log password disabled
 * Requirements: 13.5
 */
function logPasswordDisabled(userId, bookingId, reason, success, error = null, metadata = {}) {
  return logAuditEvent(AUDIT_EVENT_TYPES.PASSWORD_DISABLED, {
    userId,
    bookingId,
    action: 'password_disable',
    resource: 'guest_password',
    success,
    error,
    metadata: {
      ...metadata,
      reason, // 'booking_cancelled', 'booking_ended', 'manual'
    },
  });
}

/**
 * Log duration change
 * Requirements: 13.5
 */
function logDurationChange(userId, bookingId, oldDuration, newDuration, success, error = null, metadata = {}) {
  return logAuditEvent(AUDIT_EVENT_TYPES.DURATION_CHANGED, {
    userId,
    bookingId,
    action: 'duration_change',
    resource: 'password_duration',
    success,
    error,
    metadata: {
      ...metadata,
      oldDuration,
      newDuration,
    },
  });
}

/**
 * Log access confirmation
 * Requirements: 13.5
 */
function logAccessConfirmation(userId, bookingId, success, error = null, metadata = {}) {
  const eventType = success 
    ? AUDIT_EVENT_TYPES.ACCESS_CONFIRMED 
    : AUDIT_EVENT_TYPES.ACCESS_CONFIRMATION_FAILED;

  return logAuditEvent(eventType, {
    userId,
    bookingId,
    action: 'access_confirmation',
    resource: 'booking_access',
    success,
    error,
    metadata,
  });
}

/**
 * Log unauthorized access attempt
 * Requirements: 13.5
 */
function logUnauthorizedAccess(userId, bookingId, attemptedAction, metadata = {}) {
  return logAuditEvent(AUDIT_EVENT_TYPES.UNAUTHORIZED_ACCESS_ATTEMPT, {
    userId,
    bookingId,
    action: attemptedAction,
    resource: 'smart_door',
    success: false,
    error: 'Unauthorized access attempt',
    metadata,
  });
}

/**
 * Log forbidden access attempt
 * Requirements: 13.5
 */
function logForbiddenAccess(userId, bookingId, attemptedAction, reason, metadata = {}) {
  return logAuditEvent(AUDIT_EVENT_TYPES.FORBIDDEN_ACCESS_ATTEMPT, {
    userId,
    bookingId,
    action: attemptedAction,
    resource: 'smart_door',
    success: false,
    error: `Forbidden: ${reason}`,
    metadata,
  });
}

/**
 * Log MQTT command
 * Requirements: 13.5
 */
function logMQTTCommand(userId, bookingId, command, topic, success, error = null, metadata = {}) {
  const eventType = success 
    ? AUDIT_EVENT_TYPES.MQTT_COMMAND_SENT 
    : AUDIT_EVENT_TYPES.MQTT_COMMAND_FAILED;

  return logAuditEvent(eventType, {
    userId,
    bookingId,
    action: 'mqtt_command',
    resource: 'mqtt_broker',
    success,
    error,
    metadata: {
      ...metadata,
      command,
      topic,
    },
  });
}

/**
 * Get request metadata for audit logging
 * Extract IP, user agent from request
 */
function getRequestMetadata(req) {
  return {
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
      || req.headers['x-real-ip']
      || req.ip,
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.path,
  };
}

module.exports = {
  AUDIT_EVENT_TYPES,
  logAuditEvent,
  logDoorControl,
  logPasswordAccess,
  logPasswordUpdate,
  logPasswordDisabled,
  logDurationChange,
  logAccessConfirmation,
  logUnauthorizedAccess,
  logForbiddenAccess,
  logMQTTCommand,
  getRequestMetadata,
};
