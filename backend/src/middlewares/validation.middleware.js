const { ValidationError } = require('../utils/apiError');

/**
 * Joi validation middleware
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const validationOptions = {
    abortEarly: false, // Return all errors, not just the first one
    allowUnknown: true, // Allow unknown keys in the request
    stripUnknown: true, // Remove unknown keys from the validated data
  };

  const { error, value } = schema.validate(req.body, validationOptions);

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    throw new ValidationError(errors);
  }

  // Replace request body with validated value
  req.body = value;
  next();
};

/**
 * Validate query parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    throw new ValidationError(errors);
  }

  req.query = value;
  next();
};

/**
 * Validate URL parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    throw new ValidationError(errors);
  }

  req.params = value;
  next();
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
};
