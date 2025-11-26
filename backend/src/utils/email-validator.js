/**
 * Email Validation and Sanitization Utilities
 */

const logger = require('./logger');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
const sanitizeEmail = (email) => {
  if (!email) {
    return '';
  }

  return email.toString().trim().toLowerCase();
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate and sanitize
 * @returns {string} Sanitized email
 * @throws {Error} If email is invalid
 */
const validateAndSanitizeEmail = (email) => {
  const sanitized = sanitizeEmail(email);

  if (!isValidEmail(sanitized)) {
    throw new Error(`Invalid email address: ${email}`);
  }

  return sanitized;
};

/**
 * Validate user object has required email field
 * @param {Object} user - User object
 * @returns {boolean} True if valid
 */
const validateUserForEmail = (user) => {
  if (!user) {
    return false;
  }

  return !!(user.email && isValidEmail(user.email));
};

/**
 * Log validation error
 * @param {string} context - Context of the error
 * @param {string} email - Email that failed validation
 * @param {Error} error - Error object
 */
const logValidationError = (context, email, error) => {
  logger.error(`Email validation failed in ${context}`, {
    email: email ? sanitizeEmail(email) : 'undefined',
    error: error.message,
    context
  });
};

module.exports = {
  isValidEmail,
  sanitizeEmail,
  validateAndSanitizeEmail,
  validateUserForEmail,
  logValidationError
};
