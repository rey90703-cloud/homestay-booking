const { ForbiddenError, UnauthorizedError } = require('../utils/apiError');
const { ROLES } = require('../config/constants');

/**
 * Role-Based Access Control Middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(req.user.role)) {
    throw new ForbiddenError(
      'You do not have permission to perform this action',
    );
  }

  next();
};

/**
 * Check if user is the owner of the resource or an admin
 * @param {String} userIdField - Field name containing the user ID (e.g., 'userId', 'hostId')
 * @returns {Function} Express middleware
 */
const authorizeOwnerOrAdmin = (userIdField = 'userId') => (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const resourceUserId = req.resource ? req.resource[userIdField] : null;

  // Allow if user is admin or owner
  const isAdmin = req.user.role === ROLES.ADMIN;
  const isOwner = resourceUserId && resourceUserId.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }

  next();
};

module.exports = {
  authorize,
  authorizeOwnerOrAdmin,
  ROLES,
};
