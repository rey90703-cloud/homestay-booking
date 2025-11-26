const { ForbiddenError, NotFoundError } = require('../utils/apiError');
const { ROLES } = require('../config/constants');
const Booking = require('../modules/bookings/booking.model');

/**
 * Middleware to check if user has access to booking
 * User can access if they are:
 * - Admin
 * - Guest of the booking
 * - Host of the homestay
 */
const checkBookingAccess = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Admin has access to all bookings
    if (userRole === ROLES.ADMIN) {
      return next();
    }

    // Find booking and populate to check ownership
    const booking = await Booking.findById(bookingId)
      .select('guestId hostId')
      .lean();

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check if user is guest or host
    const isGuest = booking.guestId.toString() === userId.toString();
    const isHost = booking.hostId.toString() === userId.toString();

    if (!isGuest && !isHost) {
      throw new ForbiddenError('You do not have permission to access this booking');
    }

    // Attach booking info to request for later use
    req.bookingAccess = {
      isGuest,
      isHost,
      isAdmin: false,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can modify booking
 * Only guest and admin can modify booking
 */
const checkBookingModifyPermission = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Admin can modify all bookings
    if (userRole === ROLES.ADMIN) {
      return next();
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .select('guestId')
      .lean();

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Only guest can modify their booking
    const isGuest = booking.guestId.toString() === userId.toString();

    if (!isGuest) {
      throw new ForbiddenError('Only the guest can modify this booking');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkBookingAccess,
  checkBookingModifyPermission,
};
