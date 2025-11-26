/**
 * Payment Error Classes and Error Codes
 * Custom error classes cho payment system với error codes chuẩn
 */

/**
 * Base Payment Error Class
 */
class PaymentError extends Error {
  constructor(message, code, statusCode = 500, details = {}) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * QR Code Generation Error
 */
class QRGenerationError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.QR_GENERATION_FAILED, 500, details);
    this.name = 'QRGenerationError';
  }
}

/**
 * Invalid Signature Error
 */
class InvalidSignatureError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.INVALID_SIGNATURE, 401, details);
    this.name = 'InvalidSignatureError';
  }
}

/**
 * Amount Mismatch Error
 */
class AmountMismatchError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.AMOUNT_MISMATCH, 400, details);
    this.name = 'AmountMismatchError';
  }
}

/**
 * Transaction Not Found Error
 */
class TransactionNotFoundError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.TRANSACTION_NOT_FOUND, 404, details);
    this.name = 'TransactionNotFoundError';
  }
}

/**
 * Booking Not Found Error
 */
class BookingNotFoundError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.BOOKING_NOT_FOUND, 404, details);
    this.name = 'BookingNotFoundError';
  }
}

/**
 * QR Expired Error
 */
class QRExpiredError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.QR_EXPIRED, 410, details);
    this.name = 'QRExpiredError';
  }
}

/**
 * Duplicate Payment Error
 */
class DuplicatePaymentError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.DUPLICATE_PAYMENT, 409, details);
    this.name = 'DuplicatePaymentError';
  }
}

/**
 * SeePay API Error
 */
class SePayAPIError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.SEPAY_API_ERROR, 503, details);
    this.name = 'SePayAPIError';
  }
}

/**
 * Insufficient Amount Error
 */
class InsufficientAmountError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.INSUFFICIENT_AMOUNT, 400, details);
    this.name = 'InsufficientAmountError';
  }
}

/**
 * Invalid Payment Reference Error
 */
class InvalidPaymentReferenceError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.INVALID_PAYMENT_REFERENCE, 400, details);
    this.name = 'InvalidPaymentReferenceError';
  }
}

/**
 * Payment Processing Error
 */
class PaymentProcessingError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.PAYMENT_PROCESSING_ERROR, 500, details);
    this.name = 'PaymentProcessingError';
  }
}

/**
 * Webhook Validation Error
 */
class WebhookValidationError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.WEBHOOK_VALIDATION_ERROR, 400, details);
    this.name = 'WebhookValidationError';
  }
}

/**
 * Invalid Checksum Error
 */
class InvalidChecksumError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.INVALID_CHECKSUM, 400, details);
    this.name = 'InvalidChecksumError';
  }
}

/**
 * Payment Timeout Error
 */
class PaymentTimeoutError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.PAYMENT_TIMEOUT, 408, details);
    this.name = 'PaymentTimeoutError';
  }
}

/**
 * VietQR API Error
 */
class VietQRAPIError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PAYMENT_ERROR_CODES.VIETQR_API_ERROR, 503, details);
    this.name = 'VietQRAPIError';
  }
}

/**
 * Payment Error Codes
 */
const PAYMENT_ERROR_CODES = {
  // QR Code Errors
  QR_GENERATION_FAILED: 'QR_GENERATION_FAILED',
  QR_EXPIRED: 'QR_EXPIRED',
  
  // Signature & Validation Errors
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_CHECKSUM: 'INVALID_CHECKSUM',
  INVALID_PAYMENT_REFERENCE: 'INVALID_PAYMENT_REFERENCE',
  WEBHOOK_VALIDATION_ERROR: 'WEBHOOK_VALIDATION_ERROR',
  
  // Transaction Errors
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
  INSUFFICIENT_AMOUNT: 'INSUFFICIENT_AMOUNT',
  DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT',
  
  // API Errors
  SEPAY_API_ERROR: 'SEPAY_API_ERROR',
  VIETQR_API_ERROR: 'VIETQR_API_ERROR',
  
  // Processing Errors
  PAYMENT_PROCESSING_ERROR: 'PAYMENT_PROCESSING_ERROR',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',
  
  // Network Errors (for retry logic)
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
  if (!error) return false;

  // Check by error code
  const retryableCodes = [
    PAYMENT_ERROR_CODES.SEPAY_API_ERROR,
    PAYMENT_ERROR_CODES.VIETQR_API_ERROR,
    PAYMENT_ERROR_CODES.NETWORK_ERROR,
    PAYMENT_ERROR_CODES.CONNECTION_TIMEOUT,
    PAYMENT_ERROR_CODES.SERVICE_UNAVAILABLE,
    PAYMENT_ERROR_CODES.PAYMENT_TIMEOUT,
  ];

  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  // Check by HTTP status code
  if (error.statusCode) {
    // Retry on 5xx errors and 408 (timeout)
    return error.statusCode >= 500 || error.statusCode === 408;
  }

  // Check by error message patterns
  const retryablePatterns = [
    /timeout/i,
    /connection/i,
    /network/i,
    /ECONNRESET/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
    /ECONNREFUSED/i,
    /503/i,
    /502/i,
    /504/i,
  ];

  return retryablePatterns.some(pattern => pattern.test(error.message));
}

/**
 * Create error from HTTP response
 */
function createErrorFromResponse(response, operation = 'API call') {
  const statusCode = response.status;
  const data = response.data;

  let ErrorClass = PaymentError;
  let message = `${operation} failed`;

  // Determine error class based on status code
  if (statusCode === 401 || statusCode === 403) {
    ErrorClass = InvalidSignatureError;
    message = 'Authentication failed';
  } else if (statusCode === 404) {
    ErrorClass = TransactionNotFoundError;
    message = 'Resource not found';
  } else if (statusCode === 408) {
    ErrorClass = PaymentTimeoutError;
    message = 'Request timeout';
  } else if (statusCode === 409) {
    ErrorClass = DuplicatePaymentError;
    message = 'Duplicate payment detected';
  } else if (statusCode === 410) {
    ErrorClass = QRExpiredError;
    message = 'QR code expired';
  } else if (statusCode >= 500) {
    ErrorClass = SePayAPIError;
    message = 'Service unavailable';
  }

  // Extract message from response if available
  if (data && data.message) {
    message = data.message;
  } else if (data && typeof data === 'string') {
    message = data;
  }

  return new ErrorClass(message, {
    statusCode,
    response: data,
    operation,
  });
}

/**
 * Wrap error with payment error
 */
function wrapError(error, operation = 'Operation') {
  // If already a PaymentError, return as is
  if (error instanceof PaymentError) {
    return error;
  }

  // If has response (axios error), create from response
  if (error.response) {
    return createErrorFromResponse(error.response, operation);
  }

  // If network error
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return new SePayAPIError(`${operation} failed: Network error`, {
      originalError: error.message,
      code: error.code,
    });
  }

  // Default: wrap in generic PaymentError
  return new PaymentError(`${operation} failed: ${error.message}`, PAYMENT_ERROR_CODES.PAYMENT_PROCESSING_ERROR, 500, {
    originalError: error.message,
    stack: error.stack,
  });
}

module.exports = {
  // Error Classes
  PaymentError,
  QRGenerationError,
  InvalidSignatureError,
  AmountMismatchError,
  TransactionNotFoundError,
  BookingNotFoundError,
  QRExpiredError,
  DuplicatePaymentError,
  SePayAPIError,
  InsufficientAmountError,
  InvalidPaymentReferenceError,
  PaymentProcessingError,
  WebhookValidationError,
  InvalidChecksumError,
  PaymentTimeoutError,
  VietQRAPIError,
  
  // Error Codes
  PAYMENT_ERROR_CODES,
  
  // Utility Functions
  isRetryableError,
  createErrorFromResponse,
  wrapError,
};
