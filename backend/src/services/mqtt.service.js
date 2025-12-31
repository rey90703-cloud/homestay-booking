const mqtt = require('mqtt');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const {
  getMQTTConfig,
  getMQTTTopics,
  getSafeMQTTConfigForLogging,
  MQTT_RETRY_CONFIG,
} = require('../config/mqtt.config');
const {
  validateDoorStatus,
  validateAccessLog,
  validateGuestPasswordUpdate,
  safeParseJSON,
} = require('../utils/mqtt-validator');

/**
 * MQTT Service for Smart Door Access Control
 * 
 * Quản lý kết nối MQTT với HiveMQ Cloud broker
 * Xử lý publish/subscribe messages giữa backend và ESP32
 * 
 * Requirements: 1.2, 1.3, 1.5, 1.6, 2.1, 4.1-4.4, 9.1
 */
class MQTTService {
  constructor() {
    this.client = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.topics = getMQTTTopics();
    this.reconnectTimer = null;
    this.retryConfig = MQTT_RETRY_CONFIG;
    
    // Callback handlers
    this.callbacks = {
      onStatusUpdate: null,
      onLogReceived: null,
      onGuestPasswordUpdate: null,
      onConnect: null,
      onDisconnect: null,
      onError: null,
    };

    // Connection state
    this.connectionState = {
      connected: false,
      lastConnectTime: null,
      lastDisconnectTime: null,
      totalReconnects: 0,
    };

    // Message queue for failed publishes (Requirements: 4.5)
    this.messageQueue = [];
  }

  /**
   * Kết nối đến MQTT Broker với TLS/SSL
   * Requirements: 1.2, 1.3, 1.5, 12.1
   */
  async connect() {
    if (this.client && this.client.connected) {
      logger.warn('MQTT client already connected');
      return;
    }

    if (this.isConnecting) {
      logger.warn('MQTT connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      const config = getMQTTConfig();
      // Disable auto-reconnect, we'll handle it manually with exponential backoff
      config.reconnectPeriod = 0;
      
      const safeConfig = getSafeMQTTConfigForLogging();
      
      logger.info('Connecting to MQTT broker', safeConfig);

      this.client = mqtt.connect(config);
      this._setupEventHandlers();
      await this._waitForConnection();

      logger.info('MQTT client connected successfully');

      this.reconnectAttempts = 0;
      this.connectionState.connected = true;
      this.connectionState.lastConnectTime = new Date();

      // Track connection event (Requirements: 1.4, 18.1)
      metrics.logMQTTConnectionEvent('connected', {
        reconnectAttempts: this.reconnectAttempts,
        totalReconnects: this.connectionState.totalReconnects,
      });

      await this._subscribeTopics();
      
      // Process queued messages after reconnection
      await this._processMessageQueue();

      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }

    } catch (error) {
      logger.error('Failed to connect to MQTT broker', { error: error.message });
      this.connectionState.connected = false;
      
      // Track connection error (Requirements: 1.4, 18.1)
      metrics.logMQTTConnectionEvent('error', {
        error: error.message,
        reconnectAttempts: this.reconnectAttempts,
      });
      
      // Schedule reconnection with exponential backoff
      this._scheduleReconnect();
      
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Setup MQTT event handlers
   * @private
   */
  _setupEventHandlers() {
    this.client.on('connect', () => {
      logger.info('MQTT client connected');
      this.connectionState.connected = true;
      this.connectionState.lastConnectTime = new Date();
      this.reconnectAttempts = 0;
      
      // Clear any pending reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.client.on('close', () => {
      logger.warn('MQTT connection closed');
      this.connectionState.connected = false;
      this.connectionState.lastDisconnectTime = new Date();
      
      // Track disconnection event (Requirements: 1.4, 18.1)
      metrics.logMQTTConnectionEvent('disconnected', {
        lastConnectTime: this.connectionState.lastConnectTime,
        totalReconnects: this.connectionState.totalReconnects,
      });
      
      // Schedule reconnection with exponential backoff
      this._scheduleReconnect();
      
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      this.connectionState.totalReconnects++;
      
      // Track reconnecting event (Requirements: 1.4, 18.1)
      metrics.logMQTTConnectionEvent('reconnecting', {
        attempt: this.reconnectAttempts,
        totalReconnects: this.connectionState.totalReconnects,
      });
      
      logger.info('MQTT reconnecting', {
        attempt: this.reconnectAttempts,
        totalReconnects: this.connectionState.totalReconnects,
      });
    });

    this.client.on('error', (error) => {
      logger.error('MQTT connection error', {
        error: error.message,
        reconnectAttempts: this.reconnectAttempts,
      });

      // Check for authentication errors - stop retrying
      if (error.message && error.message.includes('Not authorized')) {
        logger.error('MQTT authentication failed - stopping reconnection attempts');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      }

      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    this.client.on('offline', () => {
      logger.warn('MQTT client offline');
      this.connectionState.connected = false;
    });

    this.client.on('message', (topic, message) => {
      this._handleMessage(topic, message);
    });
  }

  /**
   * Đợi kết nối MQTT thành công
   * @private
   */
  _waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MQTT connection timeout'));
      }, 30000);

      this.client.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Subscribe các topics cần thiết
   * Requirements: 1.6
   * @private
   */
  async _subscribeTopics() {
    const topicsToSubscribe = [
      this.topics.status,
      this.topics.log,
      this.topics.guestUpdate,
    ];

    logger.info('Subscribing to MQTT topics', { topics: topicsToSubscribe });

    for (const topic of topicsToSubscribe) {
      await this._subscribeTopic(topic);
    }

    logger.info('Successfully subscribed to all topics');
  }

  /**
   * Subscribe một topic
   * @private
   */
  _subscribeTopic(topic) {
    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          logger.error('Failed to subscribe to topic', { topic, error: error.message });
          reject(error);
        } else {
          logger.info('Subscribed to topic', { topic });
          resolve();
        }
      });
    });
  }

  /**
   * Schedule reconnection với exponential backoff
   * Requirements: 12.1
   * @private
   */
  _scheduleReconnect() {
    // Don't schedule if already scheduled or if we're manually disconnecting
    if (this.reconnectTimer || !this.client) {
      return;
    }

    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, this.reconnectAttempts - 1),
      this.retryConfig.maxDelay
    );

    logger.info('Scheduling MQTT reconnection', {
      attempt: this.reconnectAttempts,
      delayMs: delay,
      nextRetryAt: new Date(Date.now() + delay).toISOString(),
    });

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      
      try {
        logger.info('Attempting MQTT reconnection', { attempt: this.reconnectAttempts });
        await this.connect();
      } catch (error) {
        logger.error('Reconnection attempt failed', {
          attempt: this.reconnectAttempts,
          error: error.message,
        });
        // connect() will schedule next retry
      }
    }, delay);
  }

  /**
   * Process queued messages after reconnection
   * Requirements: 4.5
   * @private
   */
  async _processMessageQueue() {
    if (this.messageQueue.length === 0) {
      return;
    }

    logger.info('Processing queued messages', { count: this.messageQueue.length });

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const item of queue) {
      try {
        await this._publish(item.topic, item.message, item.options);
        logger.info('Queued message published successfully', {
          topic: item.topic,
          retryCount: item.retryCount,
        });
      } catch (error) {
        logger.error('Failed to publish queued message', {
          topic: item.topic,
          error: error.message,
          retryCount: item.retryCount,
        });

        // Re-queue if retry count is below max
        if (item.retryCount < 3) {
          this.messageQueue.push({
            ...item,
            retryCount: item.retryCount + 1,
          });
        } else {
          logger.error('Message dropped after max retries', { topic: item.topic });
        }
      }
    }
  }

  /**
   * Xử lý message nhận được từ MQTT
   * @private
   */
  _handleMessage(topic, message) {
    const receiveTime = Date.now();
    
    try {
      const payload = message.toString();
      
      // ⭐ THAY ĐỔI: Dùng logger.info thay vì logger.debug để dễ debug
      logger.info('🔔 MQTT message received', {
        topic,
        payload: payload.substring(0, 200),
        timestamp: new Date().toISOString(),
      });

      // Track message receive (Requirements: 18.2)
      metrics.trackMessageReceive(topic);

      if (topic === this.topics.status) {
        this._handleStatusMessage(payload);
      } else if (topic === this.topics.log) {
        this._handleLogMessage(payload, receiveTime);
      } else if (topic === this.topics.guestUpdate) {
        this._handleGuestPasswordUpdate(payload);
      } else {
        logger.warn('⚠️ Unknown topic received', { topic, payload });
      }
    } catch (error) {
      logger.error('Error handling MQTT message', { topic, error: error.message });
    }
  }

  /**
   * Xử lý status message từ ESP32
   * Requirements: 12.5
   * @private
   */
  _handleStatusMessage(payload) {
    try {
      const validation = validateDoorStatus(payload);
      
      if (!validation.valid) {
        logger.warn('Invalid status message', { 
          payload, 
          error: validation.error 
        });
        return;
      }

      const status = validation.normalizedStatus;
      logger.info('Door status updated', { status });

      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(status);
      }
    } catch (error) {
      logger.error('Error handling status message', { 
        error: error.message, 
        payload 
      });
    }
  }

  /**
   * Xử lý log message từ ESP32
   * Requirements: 2.1, 9.1, 12.5
   * @private
   */
  _handleLogMessage(payload, receiveTime) {
    try {
      const logData = safeParseJSON(payload, 'smartdoor/log');
      
      if (!logData) {
        logger.warn('Failed to parse log message', { payload });
        return;
      }

      const validation = validateAccessLog(logData);
      
      if (!validation.valid) {
        logger.warn('Invalid log message structure', { 
          logData, 
          error: validation.error 
        });
        return;
      }

      // Calculate latency if timestamp is available (Requirements: 18.2)
      if (validation.data.time && receiveTime) {
        const latency = receiveTime - validation.data.time;
        if (latency >= 0 && latency < 60000) { // Only track if reasonable (< 1 minute)
          metrics.trackMessageReceive(this.topics.log, latency);
        }
      }

      logger.info('Access log received', {
        user: validation.data.user,
        method: validation.data.method,
        time: validation.data.time,
      });

      if (this.callbacks.onLogReceived) {
        this.callbacks.onLogReceived(validation.data);
      }
    } catch (error) {
      logger.error('Error handling log message', { 
        error: error.message, 
        payload 
      });
    }
  }

  /**
   * Xử lý guest password update từ ESP32
   * Requirements: 2.1, 12.5
   * @private
   */
  _handleGuestPasswordUpdate(payload) {
    try {
      const data = safeParseJSON(payload, 'smartdoor/guest/update');
      
      if (!data) {
        logger.warn('Failed to parse guest password update', { payload });
        return;
      }

      const validation = validateGuestPasswordUpdate(data);
      
      if (!validation.valid) {
        logger.warn('Invalid guest password update structure', { 
          data, 
          error: validation.error 
        });
        return;
      }

      logger.info('Guest password update received', {
        password: '****',
        duration: validation.data.duration_minutes,
      });

      if (this.callbacks.onGuestPasswordUpdate) {
        this.callbacks.onGuestPasswordUpdate(validation.data);
      }
    } catch (error) {
      logger.error('Error handling guest password update', { 
        error: error.message, 
        payload 
      });
    }
  }

  /**
   * Publish message "OPEN" để mở cửa
   * Requirements: 4.1, 4.5
   */
  async publishOpenDoor() {
    try {
      if (!this.isConnected()) {
        logger.warn('MQTT not connected, queueing open door command');
        this._queueMessage(this.topics.command.open, 'OPEN', { qos: 1 });
        metrics.trackMessagePublish(this.topics.command.open, false);
        return false;
      }

      await this._publish(this.topics.command.open, 'OPEN', { qos: 1 });
      logger.info('Open door command published successfully');
      metrics.trackMessagePublish(this.topics.command.open, true);
      return true;
    } catch (error) {
      logger.error('Failed to publish open door command', { error: error.message });
      metrics.trackMessagePublish(this.topics.command.open, false);
      // Queue message for retry
      this._queueMessage(this.topics.command.open, 'OPEN', { qos: 1 });
      return false;
    }
  }

  /**
   * Publish message "CLOSE" để khóa cửa
   * Requirements: 4.2, 4.5
   */
  async publishCloseDoor() {
    try {
      if (!this.isConnected()) {
        logger.warn('MQTT not connected, queueing close door command');
        this._queueMessage(this.topics.command.close, 'CLOSE', { qos: 1 });
        metrics.trackMessagePublish(this.topics.command.close, false);
        return false;
      }

      await this._publish(this.topics.command.close, 'CLOSE', { qos: 1 });
      logger.info('Close door command published successfully');
      metrics.trackMessagePublish(this.topics.command.close, true);
      return true;
    } catch (error) {
      logger.error('Failed to publish close door command', { error: error.message });
      metrics.trackMessagePublish(this.topics.command.close, false);
      // Queue message for retry
      this._queueMessage(this.topics.command.close, 'CLOSE', { qos: 1 });
      return false;
    }
  }

  /**
   * Publish duration để thay đổi thời gian hiệu lực mật khẩu
   * Requirements: 4.3, 4.5, 8.2, 8.3
   */
  async publishSetDuration(minutes) {
    try {
      if (typeof minutes !== 'number' || minutes < 0 || minutes > 1440) {
        throw new Error('Duration must be a number between 0 and 1440');
      }

      if (!this.isConnected()) {
        logger.warn('MQTT not connected, queueing set duration command');
        this._queueMessage(this.topics.command.setDuration, minutes.toString(), { qos: 1 });
        metrics.trackMessagePublish(this.topics.command.setDuration, false);
        return false;
      }

      await this._publish(this.topics.command.setDuration, minutes.toString(), { qos: 1 });
      logger.info('Set duration command published successfully', { minutes });
      metrics.trackMessagePublish(this.topics.command.setDuration, true);
      return true;
    } catch (error) {
      logger.error('Failed to publish set duration command', { error: error.message, minutes });
      
      // Only queue if it's a connection error, not validation error
      if (error.message !== 'Duration must be a number between 0 and 1440') {
        this._queueMessage(this.topics.command.setDuration, minutes.toString(), { qos: 1 });
        metrics.trackMessagePublish(this.topics.command.setDuration, false);
      }
      
      return false;
    }
  }

  /**
   * Helper method để publish message với QoS
   * Requirements: 4.4
   * @private
   */
  _publish(topic, message, options = {}) {
    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, options, (error) => {
        if (error) {
          logger.error('Failed to publish message', { topic, error: error.message });
          reject(error);
        } else {
          logger.debug('Message published', { topic, message });
          resolve();
        }
      });
    });
  }

  /**
   * Queue message for retry when MQTT is disconnected
   * Requirements: 4.5
   * @private
   */
  _queueMessage(topic, message, options = {}) {
    const queueItem = {
      topic,
      message,
      options,
      retryCount: 0,
      queuedAt: new Date(),
    };

    this.messageQueue.push(queueItem);
    
    logger.info('Message queued for retry', {
      topic,
      queueSize: this.messageQueue.length,
    });

    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      const removed = this.messageQueue.shift();
      logger.warn('Message queue full, dropping oldest message', {
        droppedTopic: removed.topic,
      });
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected() {
    return this.client && this.client.connected;
  }

  /**
   * Ngắt kết nối MQTT
   */
  async disconnect() {
    if (!this.client) {
      logger.warn('MQTT client not initialized');
      return;
    }

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    return new Promise((resolve) => {
      logger.info('Disconnecting MQTT client');
      
      this.client.end(false, {}, () => {
        logger.info('MQTT client disconnected');
        this.connectionState.connected = false;
        this.connectionState.lastDisconnectTime = new Date();
        resolve();
      });
    });
  }

  /**
   * Lấy thông tin connection state
   */
  getConnectionState() {
    return {
      ...this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
    };
  }

  // Callback registration methods
  onStatusUpdate(callback) {
    if (typeof callback !== 'function') throw new Error('Callback must be a function');
    this.callbacks.onStatusUpdate = callback;
  }

  onLogReceived(callback) {
    if (typeof callback !== 'function') throw new Error('Callback must be a function');
    this.callbacks.onLogReceived = callback;
  }

  onGuestPasswordUpdate(callback) {
    if (typeof callback !== 'function') throw new Error('Callback must be a function');
    this.callbacks.onGuestPasswordUpdate = callback;
  }

  onConnect(callback) {
    if (typeof callback !== 'function') throw new Error('Callback must be a function');
    this.callbacks.onConnect = callback;
  }

  onDisconnect(callback) {
    if (typeof callback !== 'function') throw new Error('Callback must be a function');
    this.callbacks.onDisconnect = callback;
  }

  onError(callback) {
    if (typeof callback !== 'function') throw new Error('Callback must be a function');
    this.callbacks.onError = callback;
  }
}

// Export class và singleton instance
module.exports = MQTTService;
module.exports.instance = new MQTTService();
