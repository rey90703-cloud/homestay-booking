/**
 * Retry Helper Utilities
 * Implements retry logic with exponential backoff
 */

const logger = require('./logger');

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error, retryableErrors = []) {
  if (!error) return false;

  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }

  const transientPatterns = [
    /timeout/i,
    /connection/i,
    /network/i,
    /ECONNRESET/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
  ];

  return transientPatterns.some(pattern => pattern.test(error.message));
}

/**
 * Calculate delay for next retry using exponential backoff
 */
function calculateBackoffDelay(attempt, initialDelay = 1000, maxDelay = 10000, multiplier = 2) {
  const delay = initialDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, options = {}, context = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = [],
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 0) {
        logger.info('Retry succeeded', {
          attempt: attempt + 1,
          maxAttempts,
          ...context,
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      const shouldRetry = attempt < maxAttempts - 1 && isRetryableError(error, retryableErrors);

      if (!shouldRetry) {
        logger.error('Operation failed after retries', {
          attempt: attempt + 1,
          maxAttempts,
          error: error.message,
          errorCode: error.code,
          ...context,
        });
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, initialDelay, maxDelay, backoffMultiplier);

      logger.warn('Retrying operation', {
        attempt: attempt + 1,
        maxAttempts,
        nextRetryIn: `${delay}ms`,
        error: error.message,
        errorCode: error.code,
        ...context,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

module.exports = {
  sleep,
  isRetryableError,
  calculateBackoffDelay,
  retryWithBackoff,
};
