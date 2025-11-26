const Joi = require('joi');

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50)
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters',
    }),
  lastName: Joi.string().trim().min(2).max(50)
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
    }),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
    }),
  dateOfBirth: Joi.date().max('now').messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  bio: Joi.string().max(500).messages({
    'string.max': 'Bio cannot exceed 500 characters',
  }),
  languages: Joi.array().items(Joi.string()),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    country: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
  }),
});

const becomeHostSchema = Joi.object({
  bio: Joi.string().min(50).max(500).required()
    .messages({
      'string.min': 'Bio must be at least 50 characters for host profile',
      'string.max': 'Bio cannot exceed 500 characters',
      'any.required': 'Bio is required to become a host',
    }),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
      'any.required': 'Phone number is required to become a host',
    }),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    zipCode: Joi.string().required(),
  }).required(),
});

const userIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
    }),
});

module.exports = {
  updateProfileSchema,
  becomeHostSchema,
  userIdParamSchema,
};
