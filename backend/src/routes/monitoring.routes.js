const express = require('express');
const metrics = require('../utils/metrics');
const MQTTService = require('../services/mqtt.service');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * Monitoring Routes
 * 
 * Health checks và metrics endpoints
 * Requirements: 18.3
 */

/**
 * GET /health
 * Basic health check endpoint
 * Public endpoint - không cần authentication
 */
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const mqttService = MQTTService.instance;
  const mqttState = mqttService.getConnectionState();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: dbStateMap[dbState] || 'unknown',
        connected: dbState === 1
      },
      mqtt: {
        connected: mqttState.connected,
        reconnectAttempts: mqttState.reconnectAttempts,
        queuedMessages: mqttState.queuedMessages,
      }
    }
  };

  // Determine overall health status
  if (dbState !== 1) {
    health.status = 'unhealthy';
    health.reason = 'Database not connected';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /health/smart-door
 * Smart Door specific health check
 * Kiểm tra MQTT connection và các services liên quan
 */
router.get('/health/smart-door', (req, res) => {
  const mqttService = MQTTService.instance;
  const mqttState = mqttService.getConnectionState();
  const mqttUptime = metrics.getMQTTUptime();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mqtt: {
      connected: mqttState.connected,
      uptime: {
        percentage: mqttUptime.uptimePercentage,
        totalUptime: mqttUptime.totalUptime,
        isCurrentlyConnected: mqttUptime.isCurrentlyConnected,
      },
      reconnects: {
        total: mqttState.totalReconnects,
        currentAttempts: mqttState.reconnectAttempts,
      },
      queuedMessages: mqttState.queuedMessages,
      lastConnectTime: mqttState.lastConnectTime,
      lastDisconnectTime: mqttState.lastDisconnectTime,
    }
  };

  // Check if MQTT is healthy
  if (!mqttState.connected) {
    health.status = 'degraded';
    health.reason = 'MQTT broker not connected';
  }

  // Check if disconnected for too long
  if (metrics.checkMQTTDisconnectedAlert()) {
    health.status = 'unhealthy';
    health.reason = 'MQTT disconnected for more than 5 minutes';
  }

  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
});

/**
 * GET /metrics
 * Get all system metrics
 * Requires admin authentication
 */
router.get('/metrics', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  try {
    const allMetrics = metrics.getAllMetrics();

    // Add system metrics
    allMetrics.system = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    res.json({
      success: true,
      data: allMetrics,
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve metrics',
      },
    });
  }
});

/**
 * GET /metrics/mqtt
 * Get MQTT specific metrics
 * Requires admin authentication
 */
router.get('/metrics/mqtt', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  try {
    const mqttMetrics = {
      uptime: metrics.getMQTTUptime(),
      connectionEvents: metrics.getMQTTConnectionEvents(50),
      messages: {
        published: metrics.getMessagePublishStats(),
        received: metrics.getMessageReceiveStats(),
      },
      timestamp: new Date(),
    };

    res.json({
      success: true,
      data: mqttMetrics,
    });
  } catch (error) {
    logger.error('Failed to get MQTT metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve MQTT metrics',
      },
    });
  }
});

/**
 * GET /metrics/api
 * Get API specific metrics
 * Requires admin authentication
 */
router.get('/metrics/api', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  try {
    const apiMetrics = metrics.getAPIStats();

    res.json({
      success: true,
      data: apiMetrics,
    });
  } catch (error) {
    logger.error('Failed to get API metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve API metrics',
      },
    });
  }
});

/**
 * GET /alerts
 * Check for active alerts
 * Requires admin authentication
 */
router.get('/alerts', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  try {
    const alerts = [];

    // Check MQTT disconnected alert
    if (metrics.checkMQTTDisconnectedAlert()) {
      alerts.push({
        type: 'mqtt_disconnected',
        severity: 'critical',
        message: 'MQTT broker has been disconnected for more than 5 minutes',
        timestamp: new Date(),
      });
    }

    // Check API error rate alert
    if (metrics.checkAPIErrorRateAlert()) {
      const stats = metrics.getAPIStats();
      alerts.push({
        type: 'high_error_rate',
        severity: 'warning',
        message: `API error rate is ${stats.errors.errorRate}% (threshold: 5%)`,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
    });
  } catch (error) {
    logger.error('Failed to check alerts', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check alerts',
      },
    });
  }
});

module.exports = router;
