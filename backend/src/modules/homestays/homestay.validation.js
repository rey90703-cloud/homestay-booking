const Joi = require('joi');

const createHomestaySchema = Joi.object({
  title: Joi.string().trim().min(10).max(100)
    .required()
    .messages({
      'string.min': 'Title must be at least 10 characters',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required',
    }),
  description: Joi.string().min(50).max(2000).required()
    .messages({
      'string.min': 'Description must be at least 50 characters',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Description is required',
    }),
  propertyType: Joi.string()
    .valid('entire_place', 'private_room', 'shared_room')
    .required()
    .messages({
      'any.only': 'Property type must be: entire_place, private_room, or shared_room',
      'any.required': 'Property type is required',
    }),

  // Location
  location: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().allow(''),
    country: Joi.string().required(),
    zipCode: Joi.string().allow(''),
    coordinates: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2), // [longitude, latitude]
    }),
  }).required(),

  // Capacity
  capacity: Joi.object({
    guests: Joi.number().min(1).max(16).required(),
    bedrooms: Joi.number().min(0).required(),
    beds: Joi.number().min(1).required(),
    bathrooms: Joi.number().min(0.5).required(),
  }).required(),

  // Pricing
  pricing: Joi.object({
    basePrice: Joi.number().min(0).required(),
    weeklyDiscount: Joi.number().min(0).max(100).default(0),
    monthlyDiscount: Joi.number().min(0).max(100).default(0),
    cleaningFee: Joi.number().min(0).default(0),
    serviceFee: Joi.number().min(0).default(0),
    currency: Joi.string().default('VND'),
  }).required(),

  // Amenities
  amenities: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),

  // House Rules
  houseRules: Joi.object({
    checkInTime: Joi.string().default('14:00'),
    checkOutTime: Joi.string().default('11:00'),
    smokingAllowed: Joi.boolean().default(false),
    petsAllowed: Joi.boolean().default(false),
    partiesAllowed: Joi.boolean().default(false),
    childrenAllowed: Joi.boolean().default(true),
    minNights: Joi.number().min(1).default(1),
    maxNights: Joi.number().default(365),
    additionalRules: Joi.array().items(Joi.string()),
  }),

  // Availability
  availability: Joi.object({
    instantBook: Joi.boolean().default(false),
    advanceNotice: Joi.number().default(24),
    preparationTime: Joi.number().default(1),
  }),
});

const updateHomestaySchema = Joi.object({
  title: Joi.string().trim().min(10).max(100),
  description: Joi.string().min(50).max(2000),
  propertyType: Joi.string().valid('entire_place', 'private_room', 'shared_room'),
  location: Joi.object({
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string().allow(''),
    country: Joi.string(),
    zipCode: Joi.string().allow(''),
    coordinates: Joi.object({
      type: Joi.string().valid('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }),
  }),
  capacity: Joi.object({
    guests: Joi.number().min(1).max(16),
    bedrooms: Joi.number().min(0),
    beds: Joi.number().min(1),
    bathrooms: Joi.number().min(0.5),
  }),
  pricing: Joi.object({
    basePrice: Joi.number().min(0),
    weeklyDiscount: Joi.number().min(0).max(100),
    monthlyDiscount: Joi.number().min(0).max(100),
    cleaningFee: Joi.number().min(0),
    serviceFee: Joi.number().min(0),
    currency: Joi.string(),
  }),
  amenities: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  houseRules: Joi.object({
    checkInTime: Joi.string(),
    checkOutTime: Joi.string(),
    smokingAllowed: Joi.boolean(),
    petsAllowed: Joi.boolean(),
    partiesAllowed: Joi.boolean(),
    childrenAllowed: Joi.boolean(),
    minNights: Joi.number().min(1),
    maxNights: Joi.number(),
    additionalRules: Joi.array().items(Joi.string()),
  }),
  availability: Joi.object({
    instantBook: Joi.boolean(),
    advanceNotice: Joi.number(),
    preparationTime: Joi.number(),
  }),
});

const searchHomestaySchema = Joi.object({
  location: Joi.string().trim(),
  city: Joi.string().trim(),
  country: Joi.string().trim(),
  checkIn: Joi.date().iso(),
  checkOut: Joi.date().iso().greater(Joi.ref('checkIn')),
  guests: Joi.number().min(1).max(16),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  propertyType: Joi.string().valid('entire_place', 'private_room', 'shared_room'),
  amenities: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string()),
  ),
  minRating: Joi.number().min(0).max(5),
  instantBook: Joi.boolean(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sort: Joi.string().valid('price', '-price', 'rating', '-rating', 'createdAt', '-createdAt'),
});

const homestayIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid homestay ID format',
    }),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'pending', 'active', 'suspended')
    .required()
    .messages({
      'any.only': 'Status must be: draft, pending, active, or suspended',
    }),
});

const updateVerificationSchema = Joi.object({
  verificationStatus: Joi.string()
    .valid('approved', 'rejected')
    .required(),
  rejectionReason: Joi.when('verificationStatus', {
    is: 'rejected',
    then: Joi.string().required(),
    otherwise: Joi.string().allow(''),
  }),
});

module.exports = {
  createHomestaySchema,
  updateHomestaySchema,
  searchHomestaySchema,
  homestayIdSchema,
  updateStatusSchema,
  updateVerificationSchema,
};
