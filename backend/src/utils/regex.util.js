/**
 * Regex utility to prevent ReDoS attacks
 */

/**
 * Sanitize user input for safe regex usage
 * Escapes special regex characters
 */
const sanitizeRegexInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Create safe case-insensitive regex from user input
 */
const createSafeRegex = (input, flags = 'i') => {
  const sanitized = sanitizeRegexInput(input);
  return new RegExp(sanitized, flags);
};

module.exports = {
  sanitizeRegexInput,
  createSafeRegex,
};
