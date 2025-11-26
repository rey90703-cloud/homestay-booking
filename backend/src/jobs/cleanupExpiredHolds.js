const Booking = require('../modules/bookings/booking.model');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * Cleanup expired booking holds
 * Chạy mỗi 5 phút để cancel các booking pending đã hết hạn hold
 */
async function cleanupExpiredHolds() {
  try {
    const now = new Date();
    
    // Find all pending bookings with expired holds
    const expiredBookings = await Booking.find({
      status: BOOKING_STATUS.PENDING,
      'payment.status': PAYMENT_STATUS.PENDING,
      holdExpiresAt: { $lte: now }
    });

    if (expiredBookings.length === 0) {
      console.log('[Cleanup] No expired holds found');
      return { cancelled: 0 };
    }

    console.log(`[Cleanup] Found ${expiredBookings.length} expired holds`);

    // Cancel each expired booking
    const cancelPromises = expiredBookings.map(async (booking) => {
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.payment.status = PAYMENT_STATUS.EXPIRED;
      booking.cancellation = {
        cancelledAt: now,
        reason: 'Hold expired - Payment not completed within 15 minutes',
        cancelledBy: null, // System cancelled
      };
      
      await booking.save();
      
      console.log(`[Cleanup] Cancelled booking ${booking._id} - Hold expired`);
      return booking._id;
    });

    const cancelledIds = await Promise.all(cancelPromises);

    console.log(`[Cleanup] Successfully cancelled ${cancelledIds.length} expired bookings`);
    
    return {
      cancelled: cancelledIds.length,
      bookingIds: cancelledIds
    };
    
  } catch (error) {
    console.error('[Cleanup] Error cleaning up expired holds:', error);
    throw error;
  }
}

module.exports = cleanupExpiredHolds;
