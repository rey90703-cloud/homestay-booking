const express = require('express');
const userController = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize, ROLES } = require('../../middlewares/rbac.middleware');
const { validate, validateParams } = require('../../middlewares/validation.middleware');
const { uploadSingle, handleMulterError } = require('../../middlewares/upload.middleware');
const {
  updateProfileSchema,
  becomeHostSchema,
  userIdParamSchema,
} = require('./user.validation');

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * Current User Routes
 */

// Get current user profile
router.get('/me', userController.getProfile);

// Update current user profile
router.put('/me', validate(updateProfileSchema), userController.updateProfile);

// Upload/Update avatar
router.patch(
  '/me/avatar',
  uploadSingle,
  handleMulterError,
  userController.updateAvatar,
);

// Delete account
router.delete('/me', userController.deleteAccount);

/**
 * Host Routes
 */

// Become a host
router.post('/become-host', validate(becomeHostSchema), userController.becomeHost);

// Get host profile
router.get(
  '/host-profile',
  authorize(ROLES.HOST, ROLES.ADMIN),
  userController.getHostProfile,
);

// Update host profile
router.put(
  '/host-profile',
  authorize(ROLES.HOST, ROLES.ADMIN),
  validate(updateProfileSchema),
  userController.updateHostProfile,
);

/**
 * Admin Routes
 */

// Get all users (Admin only)
router.get('/', authorize(ROLES.ADMIN), userController.getAllUsers);

// Create new user (Admin only)
router.post('/', authorize(ROLES.ADMIN), userController.createUser);

// Get user by ID
router.get(
  '/:id',
  validateParams(userIdParamSchema),
  userController.getUserById,
);

// Update user (Admin only)
router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  validateParams(userIdParamSchema),
  userController.updateUser,
);

// Update user status (Admin only)
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN),
  validateParams(userIdParamSchema),
  userController.updateUserStatus,
);

// Delete user (Admin only)
router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  validateParams(userIdParamSchema),
  userController.deleteUser,
);

module.exports = router;
