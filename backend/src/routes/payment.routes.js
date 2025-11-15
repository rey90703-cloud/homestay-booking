const express = require('express');
const paymentController = require('../controllers/payment.controller');
const unmatchedTransactionController = require('../controllers/unmatchedTransaction.controller');
const { ipWhitelist, replayAttackPrevention } = require('../middlewares/webhook.middleware');
const { webhookRateLimiter } = require('../middlewares/rateLimit.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, ROLES } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * Middleware để capture raw body cho webhook signature verification
 * Express json parser sẽ parse body thành object, nhưng ta cần raw string để verify signature
 */
const captureRawBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.rawBody = JSON.stringify(req.body);
  }
  next();
};

/**
 * @route   POST /api/v1/payments/webhook/sepay
 * @desc    Webhook endpoint để nhận thông báo từ SeePay khi có giao dịch mới
 * @access  Public (nhưng có IP whitelist và signature verification)
 * 
 * Middlewares:
 * 1. webhookRateLimiter - Giới hạn 100 requests/minute
 * 2. ipWhitelist - Chỉ chấp nhận từ IP của SeePay
 * 3. replayAttackPrevention - Kiểm tra timestamp để tránh replay attack
 * 4. captureRawBody - Lưu raw body để verify signature
 * 5. paymentController.handleSePayWebhook - Xử lý webhook
 * 
 * Request Headers:
 * - X-Signature: HMAC-SHA256 signature của payload
 * 
 * Request Body: SeePay webhook payload
 * {
 *   "id": "transaction_id",
 *   "gateway": "MB",
 *   "transaction_date": "2025-11-14 10:30:00",
 *   "account_number": "0327207918",
 *   "amount_in": 1998900,
 *   "transaction_content": "BOOKING-673ab12c-A3F2",
 *   ...
 * }
 * 
 * Response:
 * - 200: Payment processed successfully
 * - 401: Invalid signature
 * - 400: Invalid payload
 * - 403: IP not whitelisted
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
router.post(
  '/webhook/sepay',
  webhookRateLimiter,
  ipWhitelist,
  replayAttackPrevention,
  captureRawBody,
  paymentController.handleSePayWebhook
);

/**
 * @route   GET /api/v1/payments/unmatched
 * @desc    Lấy danh sách giao dịch không khớp (Admin only)
 * @access  Private (Admin)
 * 
 * Query params:
 * - page: Trang hiện tại (default: 1)
 * - limit: Số items per page (default: 20, max: 100)
 * - status: Filter theo status (unmatched, matched, refunded, ignored)
 * - sort: Trường sort (default: -createdAt)
 * 
 * Response:
 * - 200: Danh sách transactions với pagination
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 */
router.get(
  '/unmatched',
  authenticate,
  authorize(ROLES.ADMIN),
  unmatchedTransactionController.getUnmatchedTransactions
);

/**
 * @route   POST /api/v1/payments/unmatched/:id/match
 * @desc    Khớp thủ công unmatched transaction với booking (Admin only)
 * @access  Private (Admin)
 * 
 * Params:
 * - id: ID của unmatched transaction
 * 
 * Request Body:
 * {
 *   "bookingId": "673ab12c45d6e7f8a9b0c1d2",
 *   "notes": "Manual matching reason (optional)"
 * }
 * 
 * Logic:
 * 1. Admin chọn unmatched transaction (từ danh sách GET /unmatched)
 * 2. Admin chọn booking để khớp (bookingId trong body)
 * 3. Validate transaction và booking
 * 4. Process payment cho booking với verification method = 'manual'
 * 5. Mark transaction as matched
 * 
 * Response:
 * - 200: Transaction matched successfully
 * - 400: Invalid input, booking already paid, or transaction already matched
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Transaction or booking not found
 * - 500: Internal server error
 */
router.post(
  '/unmatched/:id/match',
  authenticate,
  authorize(ROLES.ADMIN),
  unmatchedTransactionController.matchUnmatchedTransaction
);

/**
 * @route   GET /api/v1/payments/metrics
 * @desc    Lấy payment metrics (Admin only)
 * @access  Private (Admin)
 * 
 * Trả về metrics về hoạt động thanh toán:
 * - Counters: qrCodesGenerated, paymentsCompleted, paymentsFailed, unmatchedTransactions, etc.
 * - Timers: qrGenerationTime, webhookProcessingTime, pollingTime (với avg, min, max, percentiles)
 * - Gauges: pendingPayments, activeQRCodes
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "counters": { "qrCodesGenerated": 150, "paymentsCompleted": 120, ... },
 *     "timers": { "qrGenerationTime": { "avg": 250, "min": 100, "max": 500, ... }, ... },
 *     "gauges": { "pendingPayments": 5, "activeQRCodes": 8 },
 *     "timestamp": "2025-11-14T10:30:00.000Z"
 *   }
 * }
 * 
 * Use cases:
 * - Monitor system performance
 * - Track payment success rate
 * - Identify bottlenecks
 * - Alert on anomalies
 */
router.get(
  '/metrics',
  authenticate,
  authorize(ROLES.ADMIN),
  paymentController.getMetrics
);

/**
 * Health check endpoint cho payment service
 * Có thể dùng để monitor webhook endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment service is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/api/v1/payments/webhook/sepay',
      unmatched: '/api/v1/payments/unmatched',
      metrics: '/api/v1/payments/metrics'
    }
  });
});

module.exports = router;
