const { ForbiddenError } = require('./apiError');

/**
 * Check if user owns the resource
 */
const checkOwnership = (resourceOwnerId, userId, errorMessage = 'You do not have permission to access this resource') => {
  if (resourceOwnerId.toString() !== userId.toString()) {
    throw new ForbiddenError(errorMessage);
  }
  return true;
};

/**
 * Verify user owns homestay
 */
const verifyHomestayOwnership = (homestay, userId) => checkOwnership(
  homestay.hostId,
  userId,
  'You can only modify your own homestay',
);

/**
 * Verify user owns booking
 */
const verifyBookingOwnership = (booking, userId) => checkOwnership(
  booking.guestId,
  userId,
  'You can only access your own bookings',
);

module.exports = {
  checkOwnership,
  verifyHomestayOwnership,
  verifyBookingOwnership,
};
