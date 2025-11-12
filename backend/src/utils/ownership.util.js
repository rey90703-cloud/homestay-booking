const { ForbiddenError } = require('./apiError');
const { ROLES } = require('../config/constants');

/**
 * Check if user owns the resource or is admin
 */
const checkOwnership = (resourceOwnerId, userId, userRole, errorMessage = 'You do not have permission to access this resource') => {
  // Admin can access all resources
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  if (resourceOwnerId.toString() !== userId.toString()) {
    throw new ForbiddenError(errorMessage);
  }
  return true;
};

/**
 * Verify user owns homestay or is admin
 */
const verifyHomestayOwnership = (homestay, userId, userRole) => checkOwnership(
  homestay.hostId,
  userId,
  userRole,
  'You can only modify your own homestay',
);

/**
 * Verify user owns booking or is admin
 */
const verifyBookingOwnership = (booking, userId, userRole) => checkOwnership(
  booking.guestId,
  userId,
  userRole,
  'You can only access your own bookings',
);

module.exports = {
  checkOwnership,
  verifyHomestayOwnership,
  verifyBookingOwnership,
};
