const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const morganMiddleware = require('./middlewares/logger.middleware');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
const swaggerSpec = require('./config/swagger');

// Create Express app
const app = express();

/**
 * Security Middleware
 */
app.use(helmet()); // Set security headers

/**
 * CORS Configuration
 */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * Security Middleware
 */
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

/**
 * Compression Middleware
 */
app.use(compression());

/**
 * Logging Middleware
 */
app.use(morganMiddleware);

/**
 * Rate Limiting
 */
app.use('/api/', apiLimiter);

/**
 * API Documentation
 */
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Booking Homestay API Documentation',
}));

/**
 * API Routes
 */
app.use('/api/v1', routes);

/**
 * Welcome Route
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Booking Homestay API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

/**
 * 404 Handler
 */
app.use(notFound);

/**
 * Global Error Handler
 */
app.use(errorHandler);

module.exports = app;
