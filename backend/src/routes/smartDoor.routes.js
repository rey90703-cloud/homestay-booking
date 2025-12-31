const express = require('express');
const smartDoorController = require('../controllers/smartDoor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateObjectId } = require('../middlewares/validation.middleware');
const { doorControlRateLimiter } = require('../middlewares/rateLimit.middleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Smart Door Routes
 * Tất cả routes yêu cầu authentication
 * Authorization được check trong controller (phải là host của booking)
 * 
 * Requirements: 11.1-11.7, API Security
 */

// Middleware: Tất cả routes yêu cầu authentication
router.use(authenticate);

/**
 * POST /api/bookings/:id/confirm-access
 * Host xác nhận booking và gửi mật khẩu qua email
 * Requirements: 3.1-3.5
 */
router.post(
  '/:id/confirm-access',
  validateObjectId('id'),
  smartDoorController.confirmAccess,
);

/**
 * POST /api/bookings/:id/door/open
 * Host mở cửa từ xa
 * Requirements: 6.2, 6.5, 6.6
 * Rate limited: 10 requests per minute per user
 */
router.post(
  '/:id/door/open',
  doorControlRateLimiter,
  validateObjectId('id'),
  smartDoorController.openDoor,
);

/**
 * POST /api/bookings/:id/door/close
 * Host khóa cửa từ xa
 * Requirements: 6.2
 * Rate limited: 10 requests per minute per user
 */
router.post(
  '/:id/door/close',
  doorControlRateLimiter,
  validateObjectId('id'),
  smartDoorController.closeDoor,
);

/**
 * GET /api/bookings/:id/access-info
 * Lấy thông tin mật khẩu, trạng thái cửa, duration
 * Requirements: 7.1-7.3, 11.8
 */
router.get(
  '/:id/access-info',
  validateObjectId('id'),
  smartDoorController.getAccessInfo,
);

/**
 * GET /api/bookings/:id/access-logs
 * Lấy lịch sử truy cập
 * Requirements: 9.4-9.7
 */
router.get(
  '/:id/access-logs',
  validateObjectId('id'),
  smartDoorController.getAccessLogs,
);

/**
 * POST /api/bookings/:id/set-duration
 * Thay đổi thời gian hiệu lực mật khẩu
 * Requirements: 8.2-8.5
 * Rate limited: 10 requests per minute per user
 */
router.post(
  '/:id/set-duration',
  doorControlRateLimiter,
  validateObjectId('id'),
  smartDoorController.setDuration,
);

// Log routes được đăng ký
logger.info('Smart Door routes registered', {
  routes: [
    'POST /:id/confirm-access',
    'POST /:id/door/open',
    'POST /:id/door/close',
    'GET /:id/access-info',
    'GET /:id/access-logs',
    'POST /:id/set-duration',
  ],
});

module.exports = router;
