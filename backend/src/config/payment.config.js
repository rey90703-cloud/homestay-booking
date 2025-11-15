/**
 * Payment Configuration
 * Centralized configuration for payment system including SeePay, VietQR, and payment processing
 */

const crypto = require('crypto');

/**
 * Load and validate environment variables
 */
const loadConfig = () => {
  const config = {
    // SeePay API Configuration
    sepay: {
      baseUrl: process.env.SEPAY_BASE_URL || 'https://my.sepay.vn/userapi',
      apiKey: process.env.SEPAY_API_KEY,
      apiToken: process.env.SEPAY_API_TOKEN,
      webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || process.env.SEPAY_API_KEY,
    },

    // Bank Account Information
    bank: {
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || '0327207918',
      accountName: process.env.BANK_ACCOUNT_NAME || 'QUACH THI NGOC LINH',
      bankName: process.env.BANK_NAME || 'MB Bank',
      bankBin: process.env.BANK_BIN || '970422',
      expectedAccount: process.env.BANK_ACCOUNT_EXPECTED || process.env.BANK_ACCOUNT_NUMBER || '0327207918',
    },

    // VietQR API Configuration
    vietqr: {
      clientId: process.env.VIETQR_CLIENT_ID,
      apiKey: process.env.VIETQR_API_KEY,
      baseUrl: 'https://api.vietqr.io/v2',
      imageUrl: 'https://img.vietqr.io/image',
    },

    // Payment Processing Configuration
    payment: {
      // QR code expiry time in minutes
      qrExpiryMinutes: parseInt(process.env.QR_EXPIRY_MINUTES) || 15,
      
      // Polling interval in seconds
      pollingInterval: parseInt(process.env.PAYMENT_POLLING_INTERVAL) || 60,
      
      // Payment reminder interval in minutes
      reminderInterval: parseInt(process.env.PAYMENT_REMINDER_INTERVAL) || 30,
      
      // Amount tolerance in VND (±1000 VND)
      amountTolerance: parseInt(process.env.PAYMENT_AMOUNT_TOLERANCE) || 1000,
      
      // Retry configuration
      retry: {
        maxRetries: 3,
        backoffMultiplier: 2, // Exponential backoff: 1s, 2s, 4s
        initialDelay: 1000, // 1 second
      },
    },

    // Webhook Configuration
    webhook: {
      // IP whitelist for webhook requests
      ipWhitelist: process.env.WEBHOOK_IP_WHITELIST 
        ? process.env.WEBHOOK_IP_WHITELIST.split(',').map(ip => ip.trim())
        : ['127.0.0.1', '::1', '::ffff:127.0.0.1'],
      
      // Timestamp tolerance in minutes
      timestampTolerance: parseInt(process.env.WEBHOOK_TIMESTAMP_TOLERANCE) || 5,
      
      // Future timestamp tolerance in minutes
      futureTolerance: parseInt(process.env.WEBHOOK_FUTURE_TOLERANCE) || 1,
    },

    // Notification Configuration
    notification: {
      enabled: process.env.ENABLE_PAYMENT_NOTIFICATIONS === 'true',
      adminEmail: process.env.PAYMENT_NOTIFICATION_EMAIL || 'admin@example.com',
    },

    // Logging Configuration
    logging: {
      enabled: process.env.ENABLE_PAYMENT_LOGGING === 'true',
      level: process.env.LOG_LEVEL || 'info',
      enableTelemetry: process.env.ENABLE_TELEMETRY === 'true',
      verificationLogging: process.env.PAYMENT_VERIFICATION_LOGGING === 'true',
    },
  };

  return config;
};

/**
 * Validate required configuration
 * @throws {Error} If required configuration is missing
 */
const validateConfig = (config) => {
  const errors = [];

  // Validate SeePay configuration
  if (!config.sepay.apiKey) {
    errors.push('SEPAY_API_KEY is required');
  }
  if (!config.sepay.apiToken) {
    errors.push('SEPAY_API_TOKEN is required');
  }

  // Validate Bank configuration
  if (!config.bank.accountNumber) {
    errors.push('BANK_ACCOUNT_NUMBER is required');
  }
  if (!config.bank.accountName) {
    errors.push('BANK_ACCOUNT_NAME is required');
  }

  // Validate VietQR configuration
  if (!config.vietqr.clientId) {
    errors.push('VIETQR_CLIENT_ID is required');
  }
  if (!config.vietqr.apiKey) {
    errors.push('VIETQR_API_KEY is required');
  }

  // Validate numeric configurations
  if (config.payment.qrExpiryMinutes <= 0) {
    errors.push('QR_EXPIRY_MINUTES must be greater than 0');
  }
  if (config.payment.pollingInterval <= 0) {
    errors.push('PAYMENT_POLLING_INTERVAL must be greater than 0');
  }
  if (config.payment.amountTolerance < 0) {
    errors.push('PAYMENT_AMOUNT_TOLERANCE must be non-negative');
  }

  if (errors.length > 0) {
    throw new Error(`Payment configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
};

/**
 * Get payment configuration
 * Loads and validates configuration on first call, then returns cached config
 */
let cachedConfig = null;

const getPaymentConfig = () => {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
    validateConfig(cachedConfig);
  }
  return cachedConfig;
};

/**
 * Helper function to mask sensitive data for logging
 */
const maskSensitiveData = (data) => {
  if (typeof data !== 'string') return data;
  
  // Mask account numbers (show only last 4 digits)
  if (data.length > 4) {
    return '*'.repeat(data.length - 4) + data.slice(-4);
  }
  
  return '****';
};

/**
 * Get safe config for logging (with sensitive data masked)
 */
const getSafeConfigForLogging = () => {
  const config = getPaymentConfig();
  
  return {
    sepay: {
      baseUrl: config.sepay.baseUrl,
      apiKey: maskSensitiveData(config.sepay.apiKey),
      apiToken: maskSensitiveData(config.sepay.apiToken),
    },
    bank: {
      accountNumber: maskSensitiveData(config.bank.accountNumber),
      accountName: config.bank.accountName,
      bankName: config.bank.bankName,
      bankBin: config.bank.bankBin,
    },
    vietqr: {
      clientId: config.vietqr.clientId,
      apiKey: maskSensitiveData(config.vietqr.apiKey),
      baseUrl: config.vietqr.baseUrl,
    },
    payment: config.payment,
    webhook: {
      ...config.webhook,
      ipWhitelist: config.webhook.ipWhitelist,
    },
    notification: config.notification,
    logging: config.logging,
  };
};

/**
 * Calculate checksum for payment reference
 */
const calculateChecksum = (data) => {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .slice(-4)
    .toUpperCase();
};

/**
 * Generate payment reference
 */
const generatePaymentReference = (bookingId, amount, timestamp = Date.now()) => {
  const checksum = calculateChecksum(`${bookingId}${amount}${timestamp}`);
  return `BOOKING${bookingId}${checksum}`;
};

module.exports = {
  getPaymentConfig,
  validateConfig,
  getSafeConfigForLogging,
  maskSensitiveData,
  calculateChecksum,
  generatePaymentReference,
};
