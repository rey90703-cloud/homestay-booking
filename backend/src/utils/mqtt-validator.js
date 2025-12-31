/**
 * MQTT Message Validation Utilities
 * 
 * Validate incoming MQTT messages để đảm bảo data integrity
 * Requirements: 12.5, 12.6
 */

const logger = require('./logger');

/**
 * Validate guest password format
 * Requirements: 2.5, 12.5
 * 
 * @param {string} password - Guest password to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validateGuestPassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      error: 'Password must be a non-empty string',
    };
  }

  // Must be 4-6 digits
  if (!/^\d{4,6}$/.test(password)) {
    return {
      valid: false,
      error: 'Password must be 4-6 digits',
    };
  }

  // Cannot be "9999" (admin password)
  if (password === '9999') {
    return {
      valid: false,
      error: 'Password cannot be "9999" (reserved for admin)',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate duration value
 * Requirements: 8.2, 12.6
 * 
 * @param {number} duration - Duration in minutes
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validateDuration(duration) {
  if (typeof duration !== 'number') {
    return {
      valid: false,
      error: 'Duration must be a number',
    };
  }

  if (!Number.isInteger(duration)) {
    return {
      valid: false,
      error: 'Duration must be an integer',
    };
  }

  if (duration < 0 || duration > 1440) {
    return {
      valid: false,
      error: 'Duration must be between 0 and 1440 minutes (0-24 hours)',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate door status message
 * Requirements: 12.5
 * 
 * @param {string} status - Door status
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validateDoorStatus(status) {
  if (!status || typeof status !== 'string') {
    return {
      valid: false,
      error: 'Status must be a non-empty string',
    };
  }

  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus !== 'LOCKED' && normalizedStatus !== 'OPEN') {
    return {
      valid: false,
      error: 'Status must be either "LOCKED" or "OPEN"',
    };
  }

  return { valid: true, error: null, normalizedStatus };
}

/**
 * Validate access log message structure
 * Requirements: 9.2, 12.5
 * 
 * @param {Object} logData - Log data object
 * @returns {Object} { valid: boolean, error: string|null, data: Object|null }
 */
function validateAccessLog(logData) {
  if (!logData || typeof logData !== 'object') {
    return {
      valid: false,
      error: 'Log data must be an object',
      data: null,
    };
  }

  // Validate required fields
  if (!logData.user || typeof logData.user !== 'string') {
    return {
      valid: false,
      error: 'Log must have a valid "user" field (string)',
      data: null,
    };
  }

  if (!logData.method || typeof logData.method !== 'string') {
    return {
      valid: false,
      error: 'Log must have a valid "method" field (string)',
      data: null,
    };
  }

  if (typeof logData.time !== 'number') {
    return {
      valid: false,
      error: 'Log must have a valid "time" field (number/timestamp)',
      data: null,
    };
  }

  // Validate enum values
  const validUsers = ['Admin', 'Guest', 'Chủ nhà'];
  if (!validUsers.includes(logData.user)) {
    return {
      valid: false,
      error: `User must be one of: ${validUsers.join(', ')}`,
      data: null,
    };
  }

  const validMethods = ['KEYPAD', 'WEB'];
  if (!validMethods.includes(logData.method)) {
    return {
      valid: false,
      error: `Method must be one of: ${validMethods.join(', ')}`,
      data: null,
    };
  }

  // Validate timestamp is reasonable (not in far future or past)
  const now = Date.now();
  const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
  const oneHourFuture = now + (60 * 60 * 1000);

  if (logData.time < oneYearAgo || logData.time > oneHourFuture) {
    return {
      valid: false,
      error: 'Timestamp is out of reasonable range',
      data: null,
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      user: logData.user,
      method: logData.method,
      time: logData.time,
    },
  };
}

/**
 * Validate guest password update message structure
 * Requirements: 2.2, 12.5
 * 
 * @param {Object} updateData - Password update data
 * @returns {Object} { valid: boolean, error: string|null, data: Object|null }
 */
function validateGuestPasswordUpdate(updateData) {
  if (!updateData || typeof updateData !== 'object') {
    return {
      valid: false,
      error: 'Update data must be an object',
      data: null,
    };
  }

  // Validate password
  const passwordValidation = validateGuestPassword(updateData.current_pass);
  if (!passwordValidation.valid) {
    return {
      valid: false,
      error: `Invalid password: ${passwordValidation.error}`,
      data: null,
    };
  }

  // Validate duration
  const durationValidation = validateDuration(updateData.duration_minutes);
  if (!durationValidation.valid) {
    return {
      valid: false,
      error: `Invalid duration: ${durationValidation.error}`,
      data: null,
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      current_pass: updateData.current_pass,
      duration_minutes: updateData.duration_minutes,
    },
  };
}

/**
 * Safely parse JSON payload
 * Requirements: 12.5
 * 
 * @param {string} payload - JSON string to parse
 * @param {string} context - Context for logging (e.g., topic name)
 * @returns {Object|null} Parsed object or null if invalid
 */
function safeParseJSON(payload, context = 'unknown') {
  try {
    if (!payload || typeof payload !== 'string') {
      logger.warn('Invalid JSON payload type', { context, type: typeof payload });
      return null;
    }

    const parsed = JSON.parse(payload);

    if (!parsed || typeof parsed !== 'object') {
      logger.warn('Parsed JSON is not an object', { context });
      return null;
    }

    return parsed;
  } catch (error) {
    logger.error('Failed to parse JSON payload', {
      context,
      error: error.message,
      payload: payload?.substring(0, 100),
    });
    return null;
  }
}

module.exports = {
  validateGuestPassword,
  validateDuration,
  validateDoorStatus,
  validateAccessLog,
  validateGuestPasswordUpdate,
  safeParseJSON,
};
