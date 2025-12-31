const logger = require('./logger');

/**
 * Metrics Service
 * 
 * Centralized metrics tracking cho monitoring và observability
 * Track MQTT connection, message metrics, và API performance
 * 
 * Requirements: 1.4, 18.1, 18.2, 18.3
 */
class MetricsService {
  constructor() {
    // MQTT Metrics
    this.mqtt = {
      connectionEvents: [],
      uptime: {
        startTime: null,
        totalUptime: 0,
        lastConnectTime: null,
        lastDisconnectTime: null,
      },
      reconnectAttempts: 0,
      totalReconnects: 0,
    };

    // Message Metrics
    this.messages = {
      published: {
        total: 0,
        success: 0,
        failed: 0,
        byTopic: {},
      },
      received: {
        total: 0,
        byTopic: {},
        latency: [], // Array of latency measurements
      },
    };

    // API Metrics
    this.api = {
      requests: {
        total: 0,
        byEndpoint: {},
        byMethod: {},
      },
      responses: {
        byStatusCode: {},
      },
      errors: {
        total: 0,
        byType: {},
      },
      responseTimes: [], // Array of response time measurements
    };

    // Alerts
    this.alerts = {
      mqttDisconnected: {
        threshold: 5 * 60 * 1000, // 5 minutes
        lastAlert: null,
      },
      emailQueue: {
        threshold: 100,
        lastAlert: null,
      },
      apiErrorRate: {
        threshold: 0.05, // 5%
        lastAlert: null,
      },
    };
  }

  /**
   * MQTT Connection Monitoring
   */

  /**
   * Log MQTT connection event
   * @param {string} event - 'connected' | 'disconnected' | 'reconnecting' | 'error'
   * @param {Object} metadata - Additional event metadata
   */
  logMQTTConnectionEvent(event, metadata = {}) {
    const timestamp = new Date();
    
    const eventData = {
      event,
      timestamp,
      ...metadata,
    };

    this.mqtt.connectionEvents.push(eventData);

    // Keep only last 100 events
    if (this.mqtt.connectionEvents.length > 100) {
      this.mqtt.connectionEvents.shift();
    }

    // Update uptime tracking
    if (event === 'connected') {
      this.mqtt.uptime.lastConnectTime = timestamp;
      if (!this.mqtt.uptime.startTime) {
        this.mqtt.uptime.startTime = timestamp;
      }
    } else if (event === 'disconnected') {
      this.mqtt.uptime.lastDisconnectTime = timestamp;
      
      // Calculate uptime for this session
      if (this.mqtt.uptime.lastConnectTime) {
        const sessionUptime = timestamp - this.mqtt.uptime.lastConnectTime;
        this.mqtt.uptime.totalUptime += sessionUptime;
      }
    } else if (event === 'reconnecting') {
      this.mqtt.reconnectAttempts++;
    } else if (event === 'reconnected') {
      this.mqtt.totalReconnects++;
      this.mqtt.reconnectAttempts = 0;
    }

    logger.info('MQTT connection event', eventData);
  }

  /**
   * Get MQTT uptime statistics
   * @returns {Object} Uptime stats
   */
  getMQTTUptime() {
    const now = new Date();
    let currentUptime = this.mqtt.uptime.totalUptime;

    // Add current session uptime if connected
    if (this.mqtt.uptime.lastConnectTime && 
        (!this.mqtt.uptime.lastDisconnectTime || 
         this.mqtt.uptime.lastConnectTime > this.mqtt.uptime.lastDisconnectTime)) {
      currentUptime += (now - this.mqtt.uptime.lastConnectTime);
    }

    const totalTime = this.mqtt.uptime.startTime 
      ? (now - this.mqtt.uptime.startTime) 
      : 0;

    const uptimePercentage = totalTime > 0 
      ? (currentUptime / totalTime) * 100 
      : 0;

    return {
      totalUptime: currentUptime,
      totalTime,
      uptimePercentage: uptimePercentage.toFixed(2),
      startTime: this.mqtt.uptime.startTime,
      lastConnectTime: this.mqtt.uptime.lastConnectTime,
      lastDisconnectTime: this.mqtt.uptime.lastDisconnectTime,
      isCurrentlyConnected: this.mqtt.uptime.lastConnectTime > this.mqtt.uptime.lastDisconnectTime,
    };
  }

  /**
   * Get MQTT connection events
   * @param {number} limit - Number of recent events to return
   * @returns {Array} Recent connection events
   */
  getMQTTConnectionEvents(limit = 20) {
    return this.mqtt.connectionEvents.slice(-limit);
  }

  /**
   * Message Metrics
   */

  /**
   * Track message publish
   * @param {string} topic - MQTT topic
   * @param {boolean} success - Whether publish succeeded
   */
  trackMessagePublish(topic, success) {
    this.messages.published.total++;
    
    if (success) {
      this.messages.published.success++;
    } else {
      this.messages.published.failed++;
    }

    // Track by topic
    if (!this.messages.published.byTopic[topic]) {
      this.messages.published.byTopic[topic] = {
        total: 0,
        success: 0,
        failed: 0,
      };
    }

    this.messages.published.byTopic[topic].total++;
    if (success) {
      this.messages.published.byTopic[topic].success++;
    } else {
      this.messages.published.byTopic[topic].failed++;
    }
  }

  /**
   * Track message receive
   * @param {string} topic - MQTT topic
   * @param {number} latency - Message latency in ms (optional)
   */
  trackMessageReceive(topic, latency = null) {
    this.messages.received.total++;

    // Track by topic
    if (!this.messages.received.byTopic[topic]) {
      this.messages.received.byTopic[topic] = 0;
    }
    this.messages.received.byTopic[topic]++;

    // Track latency if provided
    if (latency !== null) {
      this.messages.received.latency.push({
        timestamp: new Date(),
        latency,
        topic,
      });

      // Keep only last 1000 latency measurements
      if (this.messages.received.latency.length > 1000) {
        this.messages.received.latency.shift();
      }
    }
  }

  /**
   * Get message publish success rate
   * @returns {Object} Success rate statistics
   */
  getMessagePublishStats() {
    const total = this.messages.published.total;
    const success = this.messages.published.success;
    const failed = this.messages.published.failed;

    const successRate = total > 0 ? (success / total) * 100 : 0;
    const failureRate = total > 0 ? (failed / total) * 100 : 0;

    return {
      total,
      success,
      failed,
      successRate: successRate.toFixed(2),
      failureRate: failureRate.toFixed(2),
      byTopic: this.messages.published.byTopic,
    };
  }

  /**
   * Get message receive statistics
   * @returns {Object} Receive statistics
   */
  getMessageReceiveStats() {
    const latencies = this.messages.received.latency.map(l => l.latency);
    
    let avgLatency = 0;
    let minLatency = 0;
    let maxLatency = 0;
    let p95Latency = 0;

    if (latencies.length > 0) {
      avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      minLatency = Math.min(...latencies);
      maxLatency = Math.max(...latencies);
      
      // Calculate P95
      const sorted = [...latencies].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      p95Latency = sorted[p95Index] || 0;
    }

    return {
      total: this.messages.received.total,
      byTopic: this.messages.received.byTopic,
      latency: {
        avg: avgLatency.toFixed(2),
        min: minLatency,
        max: maxLatency,
        p95: p95Latency.toFixed(2),
        samples: latencies.length,
      },
    };
  }

  /**
   * API Metrics
   */

  /**
   * Track API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {number} statusCode - Response status code
   * @param {number} responseTime - Response time in ms
   */
  trackAPIRequest(method, endpoint, statusCode, responseTime) {
    this.api.requests.total++;

    // Track by endpoint
    if (!this.api.requests.byEndpoint[endpoint]) {
      this.api.requests.byEndpoint[endpoint] = 0;
    }
    this.api.requests.byEndpoint[endpoint]++;

    // Track by method
    if (!this.api.requests.byMethod[method]) {
      this.api.requests.byMethod[method] = 0;
    }
    this.api.requests.byMethod[method]++;

    // Track by status code
    if (!this.api.responses.byStatusCode[statusCode]) {
      this.api.responses.byStatusCode[statusCode] = 0;
    }
    this.api.responses.byStatusCode[statusCode]++;

    // Track errors (4xx and 5xx)
    if (statusCode >= 400) {
      this.api.errors.total++;
      
      const errorType = statusCode >= 500 ? '5xx' : '4xx';
      if (!this.api.errors.byType[errorType]) {
        this.api.errors.byType[errorType] = 0;
      }
      this.api.errors.byType[errorType]++;
    }

    // Track response time
    this.api.responseTimes.push({
      timestamp: new Date(),
      responseTime,
      endpoint,
      method,
      statusCode,
    });

    // Keep only last 1000 response times
    if (this.api.responseTimes.length > 1000) {
      this.api.responseTimes.shift();
    }
  }

  /**
   * Get API statistics
   * @returns {Object} API statistics
   */
  getAPIStats() {
    const responseTimes = this.api.responseTimes.map(r => r.responseTime);
    
    let avgResponseTime = 0;
    let minResponseTime = 0;
    let maxResponseTime = 0;
    let p95ResponseTime = 0;

    if (responseTimes.length > 0) {
      avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      minResponseTime = Math.min(...responseTimes);
      maxResponseTime = Math.max(...responseTimes);
      
      // Calculate P95
      const sorted = [...responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      p95ResponseTime = sorted[p95Index] || 0;
    }

    const errorRate = this.api.requests.total > 0 
      ? (this.api.errors.total / this.api.requests.total) * 100 
      : 0;

    return {
      requests: {
        total: this.api.requests.total,
        byEndpoint: this.api.requests.byEndpoint,
        byMethod: this.api.requests.byMethod,
      },
      responses: {
        byStatusCode: this.api.responses.byStatusCode,
      },
      errors: {
        total: this.api.errors.total,
        byType: this.api.errors.byType,
        errorRate: errorRate.toFixed(2),
      },
      responseTimes: {
        avg: avgResponseTime.toFixed(2),
        min: minResponseTime,
        max: maxResponseTime,
        p95: p95ResponseTime.toFixed(2),
        samples: responseTimes.length,
      },
    };
  }

  /**
   * Alerts
   */

  /**
   * Check if MQTT has been disconnected too long
   * @returns {boolean} Whether alert should be triggered
   */
  checkMQTTDisconnectedAlert() {
    const uptime = this.getMQTTUptime();
    
    if (!uptime.isCurrentlyConnected && uptime.lastDisconnectTime) {
      const disconnectedDuration = Date.now() - uptime.lastDisconnectTime.getTime();
      
      if (disconnectedDuration > this.alerts.mqttDisconnected.threshold) {
        // Check if we already alerted recently (don't spam)
        const lastAlert = this.alerts.mqttDisconnected.lastAlert;
        if (!lastAlert || (Date.now() - lastAlert) > 60000) { // 1 minute cooldown
          this.alerts.mqttDisconnected.lastAlert = Date.now();
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if API error rate is too high
   * @returns {boolean} Whether alert should be triggered
   */
  checkAPIErrorRateAlert() {
    const stats = this.getAPIStats();
    const errorRate = parseFloat(stats.errors.errorRate) / 100;

    if (errorRate > this.alerts.apiErrorRate.threshold && this.api.requests.total > 100) {
      // Check if we already alerted recently
      const lastAlert = this.alerts.apiErrorRate.lastAlert;
      if (!lastAlert || (Date.now() - lastAlert) > 300000) { // 5 minutes cooldown
        this.alerts.apiErrorRate.lastAlert = Date.now();
        return true;
      }
    }

    return false;
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics
   */
  getAllMetrics() {
    return {
      mqtt: {
        uptime: this.getMQTTUptime(),
        connectionEvents: this.getMQTTConnectionEvents(10),
        reconnects: {
          total: this.mqtt.totalReconnects,
          currentAttempts: this.mqtt.reconnectAttempts,
        },
      },
      messages: {
        published: this.getMessagePublishStats(),
        received: this.getMessageReceiveStats(),
      },
      api: this.getAPIStats(),
      timestamp: new Date(),
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.mqtt = {
      connectionEvents: [],
      uptime: {
        startTime: null,
        totalUptime: 0,
        lastConnectTime: null,
        lastDisconnectTime: null,
      },
      reconnectAttempts: 0,
      totalReconnects: 0,
    };

    this.messages = {
      published: {
        total: 0,
        success: 0,
        failed: 0,
        byTopic: {},
      },
      received: {
        total: 0,
        byTopic: {},
        latency: [],
      },
    };

    this.api = {
      requests: {
        total: 0,
        byEndpoint: {},
        byMethod: {},
      },
      responses: {
        byStatusCode: {},
      },
      errors: {
        total: 0,
        byType: {},
      },
      responseTimes: [],
    };
  }
}

// Export singleton instance
module.exports = new MetricsService();
