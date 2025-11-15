const express = require('express');
const paymentReminder = require('../../services/payment-reminder.service');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { ROLES } = require('../../config/constants');

const router = express.Router();

/**
 * @route   GET /api/v1/admin/payment-reminder/status
 * @desc    Get payment reminder service status
 * @access  Admin only
 */
router.get('/status', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  try {
    const status = paymentReminder.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get payment reminder status',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/v1/admin/payment-reminder/trigger
 * @desc    Manually trigger payment reminder send (for testing)
 * @access  Admin only
 */
router.post('/trigger', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    // Trigger reminder send manually
    await paymentReminder.sendReminders();
    
    const status = paymentReminder.getStatus();
    
    res.json({
      success: true,
      message: 'Payment reminders triggered successfully',
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger payment reminders',
      error: error.message,
    });
  }
});

module.exports = router;
