const metrics = require('../utils/metrics');
const logger = require('../utils/logger');

/**
 * Metrics Middleware
 * 
 * Track API request metrics: response times, status codes, error rates
 * Requirements: 18.3
 */

/**
 * Middleware để track API metrics
 */
const trackAPIMetrics = (req, res, next) => {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to track metrics
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const endpoint = req.route ? req.route.path : req.path;

    // Track metrics
    metrics.trackAPIRequest(method, endpoint, statusCode, responseTime);

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn('Slow API request detected', {
        method,
        endpoint,
        statusCode,
        responseTime,
        url: req.originalUrl,
      });
    }

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Middleware để track Smart Door API metrics specifically
 * Thêm context về smart door operations
 */
const trackSmartDoorMetrics = (req, res, next) => {
  const startTime = Date.now();
  const originalJson = res.json;

  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const endpoint = req.route ? req.route.path : req.path;

    // Track metrics with smart door context
    metrics.trackAPIRequest(method, `smart-door${endpoint}`, statusCode, responseTime);

    // Log smart door operations
    logger.info('Smart Door API request', {
      method,
      endpoint,
      statusCode,
      responseTime,
      bookingId: req.params.id,
      userId: req.user?.id,
    });

    // Call original json function
    originalJson.call(res, data);
  };

  next();
};

module.exports = {
  trackAPIMetrics,
  trackSmartDoorMetrics,
};
