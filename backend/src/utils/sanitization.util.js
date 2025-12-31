/**
 * Input Sanitization Utility
 * Requirements: 13.8
 * 
 * Sanitize user inputs để ngăn chặn injection attacks
 */

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Sanitize string input
 * Remove potentially dangerous characters
 * 
 * @param {string} input - Input string
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
function sanitizeString(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const {
    allowWhitespace = true,
    allowNumbers = true,
    allowSpecialChars = false,
    maxLength = 1000,
  } = options;

  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newline and tab if whitespace allowed)
  if (allowWhitespace) {
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  }

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // If special chars not allowed, keep only alphanumeric and whitespace
  if (!allowSpecialChars) {
    if (allowNumbers) {
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');
    } else {
      sanitized = sanitized.replace(/[^a-zA-Z\s]/g, '');
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize MongoDB ObjectId
 * Requirements: 13.8
 * 
 * @param {string} id - ID to validate
 * @returns {Object} { valid: boolean, sanitized: string|null, error: string|null }
 */
function sanitizeObjectId(id) {
  if (!id) {
    return {
      valid: false,
      sanitized: null,
      error: 'ID is required',
    };
  }

  // Convert to string and trim
  const idString = String(id).trim();

  // Check if valid ObjectId format
  if (!mongoose.Types.ObjectId.isValid(idString)) {
    return {
      valid: false,
      sanitized: null,
      error: 'Invalid ID format',
    };
  }

  return {
    valid: true,
    sanitized: idString,
    error: null,
  };
}

/**
 * Validate and sanitize integer input
 * Requirements: 13.8
 * 
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, sanitized: number|null, error: string|null }
 */
function sanitizeInteger(value, options = {}) {
  const {
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    allowNegative = true,
  } = options;

  // Convert to number
  const num = Number(value);

  // Check if valid number
  if (isNaN(num) || !Number.isInteger(num)) {
    return {
      valid: false,
      sanitized: null,
      error: 'Value must be an integer',
    };
  }

  // Check negative
  if (!allowNegative && num < 0) {
    return {
      valid: false,
      sanitized: null,
      error: 'Value cannot be negative',
    };
  }

  // Check range
  if (num < min || num > max) {
    return {
      valid: false,
      sanitized: null,
      error: `Value must be between ${min} and ${max}`,
    };
  }

  return {
    valid: true,
    sanitized: num,
    error: null,
  };
}

/**
 * Validate and sanitize duration value (for smart door)
 * Requirements: 8.2, 13.8
 * 
 * @param {any} duration - Duration in minutes
 * @returns {Object} { valid: boolean, sanitized: number|null, error: string|null }
 */
function sanitizeDuration(duration) {
  return sanitizeInteger(duration, {
    min: 0,
    max: 1440, // 24 hours
    allowNegative: false,
  });
}

/**
 * Validate and sanitize booking ID
 * Requirements: 13.8
 * 
 * @param {string} bookingId - Booking ID
 * @returns {Object} { valid: boolean, sanitized: string|null, error: string|null }
 */
function sanitizeBookingId(bookingId) {
  return sanitizeObjectId(bookingId);
}

/**
 * Sanitize query parameters
 * Remove potentially dangerous query params
 * 
 * @param {Object} query - Query object
 * @returns {Object} Sanitized query object
 */
function sanitizeQueryParams(query) {
  if (!query || typeof query !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(query)) {
    // Skip dangerous keys
    if (key.startsWith('$') || key.startsWith('_')) {
      logger.warn('Dangerous query parameter detected', { key });
      continue;
    }

    // Sanitize value based on type
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, { maxLength: 500 });
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      // Sanitize array elements
      sanitized[key] = value
        .filter(v => typeof v === 'string' || typeof v === 'number')
        .map(v => typeof v === 'string' ? sanitizeString(v, { maxLength: 500 }) : v);
    }
    // Skip objects and other types
  }

  return sanitized;
}

/**
 * Sanitize request body
 * Remove potentially dangerous fields
 * 
 * @param {Object} body - Request body
 * @param {Array<string>} allowedFields - Allowed field names
 * @returns {Object} Sanitized body
 */
function sanitizeRequestBody(body, allowedFields = []) {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(body)) {
    // Skip if not in allowed fields (if specified)
    if (allowedFields.length > 0 && !allowedFields.includes(key)) {
      logger.warn('Unexpected field in request body', { key });
      continue;
    }

    // Skip dangerous keys
    if (key.startsWith('$') || key.startsWith('_')) {
      logger.warn('Dangerous field detected in request body', { key });
      continue;
    }

    // Sanitize value based on type
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, { 
        maxLength: 10000,
        allowSpecialChars: true, // Allow for text content
      });
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value;
    } else if (value && typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeRequestBody(value, []);
    }
  }

  return sanitized;
}

/**
 * Log sanitization attempt
 * 
 * @param {string} type - Type of sanitization
 * @param {Object} details - Details about the attempt
 */
function logSanitization(type, details) {
  logger.info('Input sanitization performed', {
    type,
    ...details,
  });
}

module.exports = {
  sanitizeString,
  sanitizeObjectId,
  sanitizeInteger,
  sanitizeDuration,
  sanitizeBookingId,
  sanitizeQueryParams,
  sanitizeRequestBody,
  logSanitization,
};
