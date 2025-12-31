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
const { trackAPIMetrics } = require('./middlewares/metrics.middleware');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
const swaggerSpec = require('./config/swagger');

// Create Express app
const app = express();

/**
 * Security Middleware
 */
app.use(
  helmet({
    crossOriginOpenerPolicy: false, // Disable COOP to allow popups
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

// Add custom COOP header for better popup support
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

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
 * Metrics Middleware
 * Track API request metrics (Requirements: 18.3)
 */
app.use(trackAPIMetrics);

/**
 * Rate Limiting
 */
// Skip global rate limit for chat endpoints to avoid throttling chat UI
app.use('/api/', (req, res, next) => {
  if (req.path.startsWith('/v1/chat')) {
    return next();
  }
  return apiLimiter(req, res, next);
});

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
 * Health Check Route
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Payment Poller Health Check Route
 */
app.get('/health/payment-poller', (req, res) => {
  const paymentPoller = require('./services/payment-poller.service');
  const status = paymentPoller.getStatus();
  
  res.json({
    success: true,
    poller: {
      isRunning: status.isRunning,
      isPolling: status.isPolling,
      lastPollTime: status.lastPollTime,
      pollCount: status.pollCount,
      stats: status.stats,
      config: status.config,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Payment Reminder Health Check Route
 */
app.get('/health/payment-reminder', (req, res) => {
  const paymentReminder = require('./services/payment-reminder.service');
  const status = paymentReminder.getStatus();
  
  res.json({
    success: true,
    reminder: {
      isRunning: status.isRunning,
      lastRunTime: status.lastRunTime,
      stats: status.stats,
    },
    timestamp: new Date().toISOString(),
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
