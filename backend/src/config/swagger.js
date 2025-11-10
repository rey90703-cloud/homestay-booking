const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Booking Homestay API',
      version: '1.0.0',
      description: 'API documentation for Booking Homestay platform',
      contact: {
        name: 'Booking Homestay Team',
        email: 'support@bookinghomestay.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.bookinghomestay.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            statusCode: {
              type: 'integer',
              example: 400,
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            role: {
              type: 'string',
              enum: ['guest', 'host', 'admin'],
              example: 'guest',
            },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                avatar: { type: 'string', example: 'https://cloudinary.com/avatar.jpg' },
                phone: { type: 'string', example: '+1234567890' },
                dateOfBirth: { type: 'string', format: 'date', example: '1990-01-01' },
                bio: { type: 'string', example: 'Travel enthusiast' },
              },
            },
            emailVerified: {
              type: 'boolean',
              example: true,
            },
            accountStatus: {
              type: 'string',
              enum: ['active', 'suspended', 'deleted'],
              example: 'active',
            },
          },
        },
        Homestay: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            hostId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              example: 'Cozy Studio in Downtown',
            },
            description: {
              type: 'string',
              example: 'Beautiful studio apartment with great amenities',
            },
            propertyType: {
              type: 'string',
              enum: ['entire_place', 'private_room', 'shared_room'],
              example: 'entire_place',
            },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string', example: '123 Main St' },
                city: { type: 'string', example: 'San Francisco' },
                country: { type: 'string', example: 'United States' },
                zipCode: { type: 'string', example: '94102' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number', example: 37.7749 },
                    lng: { type: 'number', example: -122.4194 },
                  },
                },
              },
            },
            capacity: {
              type: 'object',
              properties: {
                guests: { type: 'integer', example: 2 },
                bedrooms: { type: 'integer', example: 1 },
                beds: { type: 'integer', example: 1 },
                bathrooms: { type: 'number', example: 1 },
              },
            },
            pricing: {
              type: 'object',
              properties: {
                basePrice: { type: 'number', example: 100 },
                currency: { type: 'string', example: 'USD' },
                cleaningFee: { type: 'number', example: 20 },
                serviceFee: { type: 'number', example: 15 },
              },
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  publicId: { type: 'string' },
                  order: { type: 'integer' },
                },
              },
            },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'active', 'inactive', 'deleted'],
              example: 'active',
            },
            stats: {
              type: 'object',
              properties: {
                averageRating: { type: 'number', example: 4.5 },
                totalReviews: { type: 'integer', example: 10 },
                viewCount: { type: 'integer', example: 100 },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            pages: {
              type: 'integer',
              example: 5,
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
            },
            hasPrevPage: {
              type: 'boolean',
              example: false,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/**/**.routes.js',
    './src/routes/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
