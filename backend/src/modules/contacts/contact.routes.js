const express = require('express');
const contactController = require('./contact.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');

const router = express.Router();

// Public route - anyone can submit contact
router.post('/', contactController.createContact);

// Admin only routes
router.get('/', authenticate, authorize(ROLES.ADMIN), contactController.getAllContacts);

router.get('/:id', authenticate, authorize(ROLES.ADMIN), contactController.getContactById);

router.patch('/:id/read', authenticate, authorize(ROLES.ADMIN), contactController.markAsRead);

router.post('/:id/reply', authenticate, authorize(ROLES.ADMIN), contactController.replyToContact);

router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.ADMIN),
  contactController.updateContactStatus,
);

router.delete('/:id', authenticate, authorize(ROLES.ADMIN), contactController.deleteContact);

module.exports = router;
