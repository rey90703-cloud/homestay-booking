const crypto = require('crypto');
const WebhookHandler = require('../webhook.handler');

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('../transaction-matcher.service');
jest.mock('../../modules/bookings/booking.model');
jest.mock('../../models/unmatchedTransaction.model');

const logger = require('../../utils/logger');
const transactionMatcher = require('../transaction-matcher.service');
const Booking = require('../../modules/bookings/booking.model');
const UnmatchedTransaction = require('../../models/unmatchedTransaction.model');

/**
 * Test Fixtures - Centralized test data
 */
const TEST_CONSTANTS = {
  SECRET: 'test-webhook-secret',
  TRANSACTION_ID: 'txn_123456',
  BOOKING_ID: 'booking_123',
  UNMATCHED_ID: 'unmatched_123',
  IP_ADDRESS: '127.0.0.1',
  AMOUNT: 1000000,
  PAYMENT_REFERENCE: 'BOOKING-507f1f77bcf86cd799439011-A1B2',
  TRANSACTION_DATE: '2024-01-15T10:30:00Z',
  BANK_NAME: 'Vietcombank',
  ACCOUNT_NUMBER: '****7918',
};

/**
 * Test Helpers - Factory methods for test data
 */
class TestHelpers {
  static createValidWebhookPayload(overrides = {}) {
    return {
      id: TEST_CONSTANTS.TRANSACTION_ID,
      amount_in: TEST_CONSTANTS.AMOUNT,
      transaction_content: TEST_CONSTANTS.PAYMENT_REFERENCE,
      transaction_date: TEST_CONSTANTS.TRANSACTION_DATE,
      bank_brand_name: TEST_CONSTANTS.BANK_NAME,
      account_number: TEST_CONSTANTS.ACCOUNT_NUMBER,
      ...overrides,
    };
  }

  static generateSignature(payload, secret = TEST_CONSTANTS.SECRET) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  static createMockRequest(payload, signature) {
    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return {
      ip: TEST_CONSTANTS.IP_ADDRESS,
      headers: {
        'content-type': 'application/json',
        'x-signature': signature || this.generateSignature(rawBody),
      },
      body: typeof payload === 'string' ? JSON.parse(payload) : payload,
      rawBody,
    };
  }

  static createMockResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  static createMockBooking(overrides = {}) {
    return {
      _id: { toString: () => TEST_CONSTANTS.BOOKING_ID },
      status: 'pending',
      payment: {
        status: 'pending',
        transaction: {},
        verification: {},
      },
      save: jest.fn().mockResolvedValue(true),
      ...overrides,
    };
  }

  static createMockUnmatchedTransaction(overrides = {}) {
    return {
      _id: { toString: () => TEST_CONSTANTS.UNMATCHED_ID },
      transactionId: TEST_CONSTANTS.TRANSACTION_ID,
      status: 'unmatched',
      save: jest.fn().mockResolvedValue(true),
      ...overrides,
    };
  }
}

describe('WebhookHandler', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = TestHelpers.createMockRequest({}, '');
    mockRes = TestHelpers.createMockResponse();
    process.env.SEPAY_WEBHOOK_SECRET = TEST_CONSTANTS.SECRET;
    jest.clearAllMocks();
  });

  describe('verifySignature', () => {
    const testPayload = JSON.stringify({ test: 'data' });

    it('should return true for valid signature', () => {
      const signature = TestHelpers.generateSignature(testPayload);
      const result = WebhookHandler.verifySignature(testPayload, signature, TEST_CONSTANTS.SECRET);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const invalidSignature = 'a'.repeat(64);
      const result = WebhookHandler.verifySignature(testPayload, invalidSignature, TEST_CONSTANTS.SECRET);

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'Signature verification failed',
        expect.any(Object)
      );
    });

    describe('parameter validation', () => {
      it.each([
        ['null payload', null, 'valid-sig', TEST_CONSTANTS.SECRET],
        ['null signature', testPayload, null, TEST_CONSTANTS.SECRET],
        ['null secret', testPayload, 'valid-sig', null],
      ])('should return false for %s', (_, payload, signature, secret) => {
        expect(WebhookHandler.verifySignature(payload, signature, secret)).toBe(false);
      });
    });

    it('should return false for invalid signature format', () => {
      const invalidSignature = 'not-hex-string';
      const result = WebhookHandler.verifySignature(testPayload, invalidSignature, TEST_CONSTANTS.SECRET);

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid signature format',
        expect.any(Object)
      );
    });

    it('should handle signature case-insensitively', () => {
      const signature = TestHelpers.generateSignature(testPayload);
      const upperSignature = signature.toUpperCase();
      
      const result = WebhookHandler.verifySignature(testPayload, upperSignature, TEST_CONSTANTS.SECRET);

      expect(result).toBe(true);
    });
  });

  describe('parsePayload', () => {
    it('should return object if payload is already an object', () => {
      const payload = { test: 'data' };
      const result = WebhookHandler.parsePayload(payload);

      expect(result).toEqual(payload);
    });

    it('should parse JSON string', () => {
      const payload = '{"test":"data"}';
      const result = WebhookHandler.parsePayload(payload);

      expect(result).toEqual({ test: 'data' });
    });

    it('should return null for invalid JSON', () => {
      const payload = 'invalid-json';
      const result = WebhookHandler.parsePayload(payload);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse payload',
        expect.any(Object)
      );
    });

    it('should return null for invalid payload type', () => {
      const result = WebhookHandler.parsePayload(123);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid payload type',
        expect.any(Object)
      );
    });
  });

  describe('validateWebhookData', () => {
    let validData;

    beforeEach(() => {
      validData = TestHelpers.createValidWebhookPayload();
    });

    it('should validate correct webhook data', () => {
      const result = WebhookHandler.validateWebhookData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null data', () => {
      const result = WebhookHandler.validateWebhookData(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Webhook data is null or undefined');
    });

    describe('transaction ID validation', () => {
      it('should reject missing transaction ID', () => {
        const data = { ...validData, id: null };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Missing or invalid transaction ID');
      });
    });

    describe('amount validation', () => {
      it.each([
        ['null amount', null, 'Missing amount_in'],
        ['undefined amount', undefined, 'Missing amount_in'],
        ['invalid string', 'invalid', 'Invalid amount_in value'],
        ['negative amount', -1000, 'Invalid amount_in value'],
        ['zero amount', 0, 'Invalid amount_in value'],
      ])('should reject %s', (_, amountValue, expectedError) => {
        const data = { ...validData, amount_in: amountValue };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expectedError);
      });

      it('should accept valid string amount', () => {
        const data = { ...validData, amount_in: '1000000' };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(true);
      });

      it('should accept valid numeric amount', () => {
        const data = { ...validData, amount_in: 1000000 };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(true);
      });
    });

    describe('transaction content validation', () => {
      it('should reject missing transaction content', () => {
        const data = { ...validData, transaction_content: null };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Missing or invalid transaction_content');
      });
    });

    describe('transaction date validation', () => {
      it('should reject invalid date format', () => {
        const data = { ...validData, transaction_date: 'invalid-date' };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid transaction_date format');
      });

      it('should reject missing date', () => {
        const data = { ...validData, transaction_date: null };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Missing transaction_date');
      });
    });

    describe('optional bank info validation', () => {
      it('should accept missing bank info', () => {
        const data = {
          id: TEST_CONSTANTS.TRANSACTION_ID,
          amount_in: TEST_CONSTANTS.AMOUNT,
          transaction_content: TEST_CONSTANTS.PAYMENT_REFERENCE,
          transaction_date: TEST_CONSTANTS.TRANSACTION_DATE,
        };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(true);
      });

      it('should reject invalid bank_brand_name type', () => {
        const data = { ...validData, bank_brand_name: 123 };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid bank_brand_name type');
      });

      it('should reject invalid account_number type', () => {
        const data = { ...validData, account_number: 123 };
        const result = WebhookHandler.validateWebhookData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid account_number type');
      });
    });
  });

  describe('handleWebhook - Integration Tests', () => {
    let validPayload;

    beforeEach(() => {
      validPayload = TestHelpers.createValidWebhookPayload();
      mockReq = TestHelpers.createMockRequest(validPayload);
      mockRes = TestHelpers.createMockResponse();
    });

    it('should reject webhook without secret configured', async () => {
      delete process.env.SEPAY_WEBHOOK_SECRET;

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Webhook secret not configured',
      });
    });

    it('should reject webhook with invalid signature', async () => {
      mockReq.headers['x-signature'] = 'a'.repeat(64);

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid signature',
      });
    });

    it('should reject webhook with invalid payload format', async () => {
      mockReq.body = 'invalid';

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid payload format',
      });
    });

    it('should reject webhook with invalid data', async () => {
      const invalidPayload = TestHelpers.createValidWebhookPayload({ amount_in: -1000 });
      mockReq = TestHelpers.createMockRequest(invalidPayload);

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid webhook data',
        })
      );
    });

    it('should handle duplicate transaction in UnmatchedTransaction', async () => {
      const mockUnmatched = TestHelpers.createMockUnmatchedTransaction();
      UnmatchedTransaction.findOne = jest.fn()
        .mockResolvedValueOnce(mockUnmatched)
        .mockResolvedValueOnce(null);
      Booking.findOne = jest.fn().mockResolvedValue(null);

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction already processed',
        transactionId: TEST_CONSTANTS.TRANSACTION_ID,
        status: 'unmatched',
      });
    });

    it('should handle duplicate transaction in Booking', async () => {
      const mockBooking = TestHelpers.createMockBooking({
        payment: { status: 'completed' },
      });
      UnmatchedTransaction.findOne = jest.fn().mockResolvedValue(null);
      Booking.findOne = jest.fn().mockResolvedValue(mockBooking);

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction already processed',
        transactionId: TEST_CONSTANTS.TRANSACTION_ID,
        bookingId: TEST_CONSTANTS.BOOKING_ID,
        paymentStatus: 'completed',
      });
    });

    it('should process matched transaction successfully', async () => {
      const mockBooking = TestHelpers.createMockBooking();
      
      UnmatchedTransaction.findOne = jest.fn().mockResolvedValue(null);
      Booking.findOne = jest.fn().mockResolvedValue(null);
      transactionMatcher.matchTransaction = jest.fn().mockResolvedValue({
        matched: true,
        booking: mockBooking,
        transaction: validPayload,
        reason: 'Transaction matched successfully',
      });

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockBooking.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment processed successfully',
        transactionId: TEST_CONSTANTS.TRANSACTION_ID,
        bookingId: TEST_CONSTANTS.BOOKING_ID,
      });
    });

    it('should create unmatched transaction when no match found', async () => {
      const mockUnmatched = TestHelpers.createMockUnmatchedTransaction();
      
      UnmatchedTransaction.findOne = jest.fn().mockResolvedValue(null);
      Booking.findOne = jest.fn().mockResolvedValue(null);
      transactionMatcher.matchTransaction = jest.fn().mockResolvedValue({
        matched: false,
        booking: null,
        transaction: validPayload,
        reason: 'No valid payment reference found',
        validations: {},
      });
      UnmatchedTransaction.mockImplementation(() => mockUnmatched);

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockUnmatched.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction recorded as unmatched',
        transactionId: TEST_CONSTANTS.TRANSACTION_ID,
        reason: 'No valid payment reference found',
      });
    });

    it('should handle errors gracefully', async () => {
      const dbError = new Error('Database error');
      // Mock chỉ 1 promise reject (Promise.all sẽ reject ngay)
      UnmatchedTransaction.findOne = jest.fn().mockRejectedValue(dbError);
      // Promise thứ 2 không cần mock vì Promise.all đã reject

      await WebhookHandler.handleWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error processing webhook',
        transactionId: TEST_CONSTANTS.TRANSACTION_ID,
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Performance Tests', () => {
    it('should process webhook within acceptable time', async () => {
      const perfPayload = TestHelpers.createValidWebhookPayload({ id: 'txn_perf_test' });
      const mockUnmatched = TestHelpers.createMockUnmatchedTransaction({ 
        _id: { toString: () => 'test' } 
      });
      
      mockReq = TestHelpers.createMockRequest(perfPayload);
      UnmatchedTransaction.findOne = jest.fn().mockResolvedValue(null);
      Booking.findOne = jest.fn().mockResolvedValue(null);
      transactionMatcher.matchTransaction = jest.fn().mockResolvedValue({
        matched: false,
        reason: 'Test',
        validations: {},
      });
      UnmatchedTransaction.mockImplementation(() => mockUnmatched);

      const startTime = Date.now();
      await WebhookHandler.handleWebhook(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });
});
