const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const paymentPoller = require('./services/payment-poller.service');
const paymentReminder = require('./services/payment-reminder.service');
const { getPaymentConfig, getSafeConfigForLogging } = require('./config/payment.config');
const mongoose = require('mongoose');

/**
 * Server Configuration
 */
const PORT = process.env.PORT || 5000;
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

/**
 * Validate required environment variables
 * @throws {Error} if required variables are missing
 */
function validateEnvironment() {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SEPAY_API_KEY',
    'BANK_ACCOUNT_NUMBER'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  logger.info('Environment validation passed');
}

/**
 * Validate payment configuration
 * @throws {Error} if payment configuration is invalid
 */
function validatePaymentConfig() {
  try {
    // This will load and validate payment config
    const config = getPaymentConfig();
    const safeConfig = getSafeConfigForLogging();
    
    logger.info('Payment configuration validated successfully', {
      qrExpiryMinutes: config.payment.qrExpiryMinutes,
      pollingInterval: config.payment.pollingInterval,
      amountTolerance: config.payment.amountTolerance,
      webhookIpWhitelist: config.webhook.ipWhitelist.length
    });
    
    console.log('✅ Payment configuration validated');
    console.log(`   - QR Expiry: ${config.payment.qrExpiryMinutes} minutes`);
    console.log(`   - Polling Interval: ${config.payment.pollingInterval} seconds`);
    console.log(`   - Amount Tolerance: ±${config.payment.amountTolerance} VND`);
    
    return true;
  } catch (error) {
    logger.error('Payment configuration validation failed', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Start Payment Poller service
 */
function startPaymentPoller() {
  try {
    const pollingInterval = parseInt(process.env.PAYMENT_POLLING_INTERVAL || '60', 10);
    paymentPoller.start(pollingInterval);
    
    logger.info(`Payment Poller started with ${pollingInterval}s interval`);
    console.log(`Payment Poller is running (interval: ${pollingInterval}s)`);
  } catch (error) {
    logger.error('Failed to start Payment Poller', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Failed to start Payment Poller:', error.message);
    // Don't throw - allow server to continue without poller
  }
}

/**
 * Start Payment Reminder service
 */
function startPaymentReminder() {
  try {
    const reminderInterval = parseInt(process.env.PAYMENT_REMINDER_INTERVAL || '30', 10);
    paymentReminder.start(reminderInterval);
    
    logger.info(`Payment Reminder Service started with ${reminderInterval}min interval`);
    console.log(`Payment Reminder Service is running (interval: ${reminderInterval}min)`);
  } catch (error) {
    logger.error('Failed to start Payment Reminder Service', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Failed to start Payment Reminder Service:', error.message);
    // Don't throw - allow server to continue without reminder
  }
}

/**
 * Stop Payment Poller gracefully
 */
function stopPaymentPoller() {
  try {
    if (paymentPoller.isRunning) {
      paymentPoller.stop();
      logger.info('Payment Poller stopped successfully');
    }
  } catch (error) {
    logger.error('Error stopping Payment Poller', {
      error: error.message
    });
  }
}

/**
 * Stop Payment Reminder gracefully
 */
function stopPaymentReminder() {
  try {
    if (paymentReminder.isRunning) {
      paymentReminder.stop();
      logger.info('Payment Reminder Service stopped successfully');
    }
  } catch (error) {
    logger.error('Error stopping Payment Reminder Service', {
      error: error.message
    });
  }
}

/**
 * Close database connection gracefully
 */
async function closeDatabase() {
  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', {
      error: error.message
    });
  }
}

/**
 * Graceful shutdown handler
 * @param {string} signal - Signal name (SIGTERM, SIGINT)
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

  // Set timeout for forced shutdown
  const forceShutdownTimer = setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    console.error('❌ Forced shutdown - some resources may not be cleaned up');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // 1. Stop accepting new connections
    await new Promise((resolve) => {
      server.close(resolve);
    });
    logger.info('HTTP server closed');

    // 2. Stop Payment Poller
    stopPaymentPoller();

    // 3. Stop Payment Reminder
    stopPaymentReminder();

    // 4. Close database connection
    await closeDatabase();

    clearTimeout(forceShutdownTimer);
    logger.info('Graceful shutdown completed');
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceShutdownTimer);
    logger.error('Error during graceful shutdown', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
}

/**
 * Bootstrap and start the server
 */
async function bootstrap() {
  try {
    // 1. Validate environment
    validateEnvironment();

    // 2. Validate payment configuration
    validatePaymentConfig();

    // 3. Connect to database
    await connectDB();
    logger.info('Database connected successfully');

    // 4. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api/v1/docs`);
    });

    // Make server accessible for shutdown handlers
    global.server = server;

    // 5. Start Payment Poller (after DB is ready)
    startPaymentPoller();

    // 6. Start Payment Reminder (after DB is ready)
    startPaymentReminder();

    return server;
  } catch (error) {
    logger.error('Failed to bootstrap server', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  console.error('❌ UNHANDLED REJECTION:', err);
  
  if (global.server) {
    global.server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Bootstrap the server
let server;
bootstrap().then(s => {
  server = s;
}).catch(error => {
  logger.error('Bootstrap failed', { error: error.message });
  process.exit(1);
});
