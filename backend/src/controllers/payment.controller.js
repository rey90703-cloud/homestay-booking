const webhookHandler = require('../services/webhook.handler');
const paymentMetrics = require('../utils/payment.metrics');
const ApiResponse = require('../utils/apiResponse');

/**
 * Payment Controller
 * Xử lý các API endpoints liên quan đến thanh toán
 * 
 * Design principles:
 * - Thin controller: Delegate business logic to services
 * - No error handling: Services handle responses completely
 * - Stateless: No instance state, pure delegation
 */
class PaymentController {
  /**
   * Handle SeePay webhook
   * Endpoint: POST /api/v1/payments/webhook/sepay
   * 
   * Delegates to WebhookHandler which handles:
   * - Signature verification
   * - Payload parsing and validation
   * - Transaction matching
   * - Response sending (success/error)
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async handleSePayWebhook(req, res) {
    await webhookHandler.handleWebhook(req, res);
  }

  /**
   * Get payment metrics
   * Endpoint: GET /api/v1/payments/metrics
   * Access: Admin only
   * 
   * Trả về tất cả metrics về hoạt động thanh toán:
   * - Counters: Số lượng events (QR generated, payments completed, etc.)
   * - Timers: Thống kê thời gian xử lý (avg, min, max, percentiles)
   * - Gauges: Giá trị hiện tại (pending payments, active QR codes)
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getMetrics(req, res) {
    const metrics = paymentMetrics.getAllMetrics();
    
    ApiResponse.success(res, metrics, 'Payment metrics retrieved successfully');
  }
}

module.exports = new PaymentController();
