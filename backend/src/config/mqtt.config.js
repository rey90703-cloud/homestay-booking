/**
 * MQTT Configuration for Smart Door Access Control
 * 
 * Cấu hình kết nối MQTT với HiveMQ Cloud broker
 * Sử dụng TLS/SSL (port 8883) để bảo mật kết nối
 */

const logger = require('../utils/logger');

/**
 * MQTT Connection Options
 * @returns {Object} MQTT connection configuration
 */
const getMQTTConfig = () => {
  const config = {
    // Broker connection
    host: process.env.MQTT_HOST,
    port: parseInt(process.env.MQTT_PORT) || 8883,
    protocol: 'mqtts', // TLS/SSL
    
    // Authentication
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    
    // Client ID (unique per connection)
    clientId: `${process.env.MQTT_CLIENT_ID_PREFIX || 'backend'}_${Math.random().toString(16).substr(2, 8)}`,
    
    // Connection options
    clean: true, // Clean session
    reconnectPeriod: 1000, // Reconnect after 1 second
    connectTimeout: 30 * 1000, // 30 seconds timeout
    keepalive: 60, // Keep alive 60 seconds
    
    // QoS options
    queueQoSZero: false, // Don't queue QoS 0 messages
    
    // TLS/SSL options
    rejectUnauthorized: true, // Verify server certificate
  };

  return config;
};

/**
 * MQTT Topics Configuration
 * @returns {Object} MQTT topics mapping
 */
const getMQTTTopics = () => {
  return {
    // Backend → ESP32 (Publish)
    command: {
      open: process.env.MQTT_TOPIC_COMMAND_OPEN || 'smartdoor/command/open',
      close: process.env.MQTT_TOPIC_COMMAND || 'smartdoor/command',
      setDuration: process.env.MQTT_TOPIC_GUEST_SETDURATION || 'smartdoor/guest/setduration',
    },
    
    // ESP32 → Backend (Subscribe)
    status: process.env.MQTT_TOPIC_STATUS || 'smartdoor/status',
    log: process.env.MQTT_TOPIC_LOG || 'smartdoor/log',
    guestUpdate: process.env.MQTT_TOPIC_GUEST_UPDATE || 'smartdoor/guest/update',
  };
};

/**
 * Validate MQTT configuration
 * @throws {Error} if required configuration is missing
 */
const validateMQTTConfig = () => {
  const requiredVars = [
    'MQTT_HOST',
    'MQTT_PORT',
    'MQTT_USERNAME',
    'MQTT_PASSWORD',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    const errorMsg = `Missing required MQTT environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info('MQTT configuration validation passed');
};

/**
 * Get safe config for logging (without sensitive data)
 * @returns {Object} Safe config object
 */
const getSafeMQTTConfigForLogging = () => {
  const config = getMQTTConfig();
  return {
    host: config.host,
    port: config.port,
    protocol: config.protocol,
    username: config.username ? '***' : undefined,
    password: config.password ? '***' : undefined,
    clientId: config.clientId,
    clean: config.clean,
    reconnectPeriod: config.reconnectPeriod,
    connectTimeout: config.connectTimeout,
    keepalive: config.keepalive,
  };
};

/**
 * MQTT Retry Configuration
 */
const MQTT_RETRY_CONFIG = {
  initialDelay: 1000,      // 1 second
  maxDelay: 60000,         // 1 minute
  backoffMultiplier: 2,
  maxAttempts: Infinity,   // Keep trying
};

module.exports = {
  getMQTTConfig,
  getMQTTTopics,
  validateMQTTConfig,
  getSafeMQTTConfigForLogging,
  MQTT_RETRY_CONFIG,
};
