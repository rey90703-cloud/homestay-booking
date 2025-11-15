const rateLimit = require('express-rate-limit');
const { TooManyRequestsError } = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Rate limiter for QR code generation
 * Limit: 200 requests per 15 minutes per user
 * Cho phép user regenerate QR nhiều lần khi cần (expired, failed, etc.)
 */
const qrCodeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests
  message: 'Too many QR code generation requests. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'Too many QR code generation requests. Please try again after 15 minutes.',
    );
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  },
});

/**
 * Rate limiter for booking creation
 * Limit: 10 bookings per hour per user
 */
const bookingCreationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per window
  message: 'Too many booking requests. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'Too many booking requests. Please try again after 1 hour.',
    );
  },
  skip: (req) => {
    return req.user && req.user.role === 'admin';
  },
});

/**
 * General API rate limiter
 * Limit: 100 requests per 15 minutes per IP
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'Too many requests from this IP. Please try again later.',
    );
  },
});

// Alias for backward compatibility
const apiLimiter = generalRateLimiter;

/**
 * Rate limiter for authentication endpoints
 * Limit: 5 login attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'Too many login attempts. Please try again after 15 minutes.',
    );
  },
});

/**
 * Rate limiter for password reset endpoints
 * Limit: 3 password reset requests per hour per IP
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: 'Too many password reset requests. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'Too many password reset requests. Please try again after 1 hour.',
    );
  },
});

/**
 * Rate limiter for webhook endpoint
 * Limit: 100 requests per minute per IP
 * Dùng cho SeePay webhook endpoint
 */
const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many webhook requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,

  // Handler khi vượt quá limit
  handler: (req, res) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
      || req.headers['x-real-ip']
      || req.ip;

    logger.warn('Rate limit exceeded for webhook', {
      ip: clientIP,
      path: req.path,
      method: req.method
    });

    res.status(429).json({
      success: false,
      message: 'Too many webhook requests, please try again later',
      retryAfter: 60 // seconds
    });
  }
});

module.exports = {
  qrCodeRateLimiter,
  bookingCreationRateLimiter,
  generalRateLimiter,
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  webhookRateLimiter,
};
