const logger = require('../utils/logger');

/**
 * Webhook Security Middleware
 * Cung cấp các middleware để bảo vệ webhook endpoint theo OOP + Strategy Pattern
 * 
 * Requirements: 8.4
 */

/**
 * Configuration Manager
 * Centralize configuration loading và validation
 */
class WebhookSecurityConfig {
  constructor() {
    this.ipWhitelist = this._parseIpWhitelist();
    this.timestampToleranceMs = this._parseTimestampTolerance();
    this.futureToleranceMs = this._parseFutureTolerance();
  }

  _parseIpWhitelist() {
    const whitelistEnv = process.env.WEBHOOK_IP_WHITELIST;
    
    if (!whitelistEnv || whitelistEnv.trim() === '') {
      return [];
    }

    return whitelistEnv
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0)
      .map(ip => this._normalizeIp(ip)); // Normalize whitelist IPs
  }

  _parseTimestampTolerance() {
    const minutes = parseInt(process.env.WEBHOOK_TIMESTAMP_TOLERANCE || '5', 10);
    return minutes * 60 * 1000;
  }

  _parseFutureTolerance() {
    const minutes = parseInt(process.env.WEBHOOK_FUTURE_TOLERANCE || '1', 10);
    return minutes * 60 * 1000;
  }

  _normalizeIp(ip) {
    return ip.replace(/^::ffff:/, '');
  }

  hasWhitelist() {
    return this.ipWhitelist.length > 0;
  }

  getWhitelist() {
    return this.ipWhitelist;
  }

  getTimestampTolerance() {
    return this.timestampToleranceMs;
  }

  getFutureTolerance() {
    return this.futureToleranceMs;
  }
}

/**
 * IP Extractor
 * Extract và normalize client IP từ request
 */
class IpExtractor {
  static extract(req) {
    const rawIp = req.ip 
      || req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || req.socket?.remoteAddress;

    if (!rawIp) {
      return null;
    }

    return this.normalize(rawIp);
  }

  static normalize(ip) {
    return ip.replace(/^::ffff:/, '');
  }
}

/**
 * IP Matcher Strategy
 * Strategy pattern cho IP matching logic
 */
class IpMatcher {
  /**
   * Check if client IP matches any whitelisted IP
   * Supports wildcard matching (e.g., "103.1.2.*")
   */
  static isWhitelisted(clientIp, whitelist) {
    return whitelist.some(whitelistedIp => {
      if (whitelistedIp.includes('*')) {
        return this._matchWildcard(clientIp, whitelistedIp);
      }
      return this._matchExact(clientIp, whitelistedIp);
    });
  }

  static _matchWildcard(clientIp, pattern) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(clientIp);
  }

  static _matchExact(clientIp, whitelistedIp) {
    return clientIp === whitelistedIp;
  }
}

/**
 * Timestamp Validator
 * Validate transaction timestamp để prevent replay attacks
 */
class TimestampValidator {
  constructor(toleranceMs, futureToleranceMs) {
    this.toleranceMs = toleranceMs;
    this.futureToleranceMs = futureToleranceMs;
  }

  /**
   * Validate timestamp
   * @returns {Object} { valid: boolean, error: string|null, timeDiff: number }
   */
  validate(transactionDate) {
    // Parse timestamp
    let timestamp;
    try {
      timestamp = new Date(transactionDate);
      
      if (isNaN(timestamp.getTime())) {
        return {
          valid: false,
          error: 'Invalid date format',
          timeDiff: null
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Parse error: ${error.message}`,
        timeDiff: null
      };
    }

    const now = Date.now();
    const timestampMs = timestamp.getTime();
    const timeDiff = now - timestampMs;

    // Check if too old (replay attack)
    if (timeDiff > this.toleranceMs) {
      return {
        valid: false,
        error: 'Timestamp too old - possible replay attack',
        timeDiff,
        toleranceMs: this.toleranceMs
      };
    }

    // Check if in future (clock skew attack)
    if (timeDiff < -this.futureToleranceMs) {
      return {
        valid: false,
        error: 'Timestamp in future - invalid',
        timeDiff,
        futureToleranceMs: this.futureToleranceMs
      };
    }

    return {
      valid: true,
      error: null,
      timeDiff
    };
  }
}

/**
 * Webhook Security Logger
 * Centralize logging với consistent format
 */
class WebhookSecurityLogger {
  static logIpCheckPassed(clientIp, path) {
    logger.info('IP whitelist check passed', {
      clientIp,
      path
    });
  }

  static logIpCheckFailed(clientIp, whitelist, path, headers) {
    logger.warn('IP not whitelisted - rejecting request', {
      clientIp,
      whitelist: whitelist.join(', '),
      path,
      headers: {
        'x-forwarded-for': headers['x-forwarded-for'],
        'x-real-ip': headers['x-real-ip']
      }
    });
  }

  static logIpExtractionFailed(headers, path) {
    logger.error('Cannot determine client IP address', {
      headers,
      path
    });
  }

  static logWhitelistNotConfigured(ip, path) {
    logger.warn('WEBHOOK_IP_WHITELIST not configured - allowing all IPs (development mode)', {
      ip,
      path
    });
  }

  static logTimestampCheckPassed(transactionId, transactionDate, timeDiff, path, ip) {
    logger.info('Replay attack prevention check passed', {
      path,
      ip,
      transactionId,
      transactionDate,
      timeDiffSeconds: Math.round(timeDiff / 1000)
    });
  }

  static logTimestampCheckFailed(reason, transactionId, transactionDate, timeDiff, path, ip, extra = {}) {
    logger.warn(`Replay attack prevention: ${reason}`, {
      path,
      ip,
      transactionId,
      transactionDate,
      timeDiffMinutes: timeDiff ? Math.round(timeDiff / 60000) : null,
      ...extra
    });
  }

  static logInvalidPayload(path, ip) {
    logger.warn('Replay attack prevention: Invalid payload format', {
      path,
      ip
    });
  }

  static logError(context, error, req) {
    logger.error(`Error in ${context}`, {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.path
    });
  }
}

/**
 * Response Builder
 * Centralize response building để consistent error responses
 */
class ResponseBuilder {
  static forbidden(res, message) {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static badRequest(res, message) {
    return res.status(400).json({
      success: false,
      message
    });
  }

  static internalError(res, message) {
    return res.status(500).json({
      success: false,
      message
    });
  }
}

// Singleton config instance
const config = new WebhookSecurityConfig();

/**
 * IP Whitelist Middleware
 * Chỉ chấp nhận request từ các IP được whitelist
 */
const ipWhitelist = (req, res, next) => {
  try {
    // Check if whitelist is configured
    if (!config.hasWhitelist()) {
      WebhookSecurityLogger.logWhitelistNotConfigured(req.ip, req.path);
      return next();
    }

    // Extract client IP
    const clientIp = IpExtractor.extract(req);
    if (!clientIp) {
      WebhookSecurityLogger.logIpExtractionFailed(req.headers, req.path);
      return ResponseBuilder.forbidden(res, 'Cannot determine client IP address');
    }

    // Check whitelist
    const whitelist = config.getWhitelist();
    const isWhitelisted = IpMatcher.isWhitelisted(clientIp, whitelist);

    if (!isWhitelisted) {
      WebhookSecurityLogger.logIpCheckFailed(clientIp, whitelist, req.path, req.headers);
      return ResponseBuilder.forbidden(res, 'IP address not whitelisted');
    }

    // Success
    WebhookSecurityLogger.logIpCheckPassed(clientIp, req.path);
    next();
  } catch (error) {
    WebhookSecurityLogger.logError('IP whitelist middleware', error, req);
    return ResponseBuilder.internalError(res, 'Internal server error in IP validation');
  }
};

/**
 * Replay Attack Prevention Middleware
 * Kiểm tra timestamp trong payload để tránh replay attack
 */
const replayAttackPrevention = (req, res, next) => {
  try {
    const payload = req.body;
    
    // Validate payload format
    if (!payload || typeof payload !== 'object') {
      WebhookSecurityLogger.logInvalidPayload(req.path, req.ip);
      return ResponseBuilder.badRequest(res, 'Invalid payload format');
    }

    // Check transaction_date exists
    const transactionDate = payload.transaction_date;
    if (!transactionDate) {
      WebhookSecurityLogger.logTimestampCheckFailed(
        'Missing transaction_date',
        payload.id,
        null,
        null,
        req.path,
        req.ip
      );
      return ResponseBuilder.badRequest(res, 'Missing transaction_date in payload');
    }

    // Validate timestamp
    const validator = new TimestampValidator(
      config.getTimestampTolerance(),
      config.getFutureTolerance()
    );
    const result = validator.validate(transactionDate);

    if (!result.valid) {
      WebhookSecurityLogger.logTimestampCheckFailed(
        result.error,
        payload.id,
        transactionDate,
        result.timeDiff,
        req.path,
        req.ip,
        {
          toleranceMinutes: result.toleranceMs ? Math.round(result.toleranceMs / 60000) : null,
          futureToleranceMinutes: result.futureToleranceMs ? Math.round(result.futureToleranceMs / 60000) : null
        }
      );
      return ResponseBuilder.badRequest(res, `Transaction ${result.error}`);
    }

    // Success
    WebhookSecurityLogger.logTimestampCheckPassed(
      payload.id,
      transactionDate,
      result.timeDiff,
      req.path,
      req.ip
    );
    next();
  } catch (error) {
    WebhookSecurityLogger.logError('replay attack prevention middleware', error, req);
    return ResponseBuilder.internalError(res, 'Internal server error in timestamp validation');
  }
};

module.exports = {
  ipWhitelist,
  replayAttackPrevention,
  // Export classes for testing
  WebhookSecurityConfig,
  IpExtractor,
  IpMatcher,
  TimestampValidator
};
