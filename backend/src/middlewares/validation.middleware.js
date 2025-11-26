const { body, param, validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/apiError');
const mongoose = require('mongoose');
const Joi = require('joi');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    throw new BadRequestError(errorMessages.join(', '));
  }
  next();
};

/**
 * Validate request using Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    throw new BadRequestError(errorMessages.join(', '));
  }

  // Replace req.body with validated value
  req.body = value;
  next();
};

/**
 * Validate request params using Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    throw new BadRequestError(errorMessages.join(', '));
  }

  // Replace req.params with validated value
  req.params = value;
  next();
};

/**
 * Validate request query using Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    throw new BadRequestError(errorMessages.join(', '));
  }

  // Replace req.query with validated value
  req.query = value;
  next();
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors,
];

/**
 * Validate booking creation
 */
const validateCreateBooking = [
  body('homestayId')
    .notEmpty()
    .withMessage('Homestay ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid homestay ID format'),

  body('checkInDate')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Invalid check-in date format')
    .custom((value) => {
      const checkIn = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkIn >= today;
    })
    .withMessage('Check-in date must be today or in the future'),

  body('checkOutDate')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Invalid check-out date format')
    .custom((value, { req }) => {
      const checkIn = new Date(req.body.checkInDate);
      const checkOut = new Date(value);
      return checkOut > checkIn;
    })
    .withMessage('Check-out date must be after check-in date'),

  body('numberOfGuests')
    .notEmpty()
    .withMessage('Number of guests is required')
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of guests must be between 1 and 50'),

  body('guestDetails.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('guestDetails.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('guestDetails.email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),

  body('guestDetails.phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),

  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests must not exceed 500 characters'),

  handleValidationErrors,
];

/**
 * Validate cancel booking
 */
const validateCancelBooking = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must not exceed 500 characters'),

  handleValidationErrors,
];

/**
 * Validate update payment status
 */
const validateUpdatePaymentStatus = [
  body('status')
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(['pending', 'completed', 'failed', 'refunded', 'partially_refunded'])
    .withMessage('Invalid payment status'),

  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be between 1 and 100 characters'),

  handleValidationErrors,
];

module.exports = {
  validate,
  validateParams,
  validateQuery,
  handleValidationErrors,
  validateObjectId,
  validateCreateBooking,
  validateCancelBooking,
  validateUpdatePaymentStatus,
};
