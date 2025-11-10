module.exports = {
  // User roles
  ROLES: {
    GUEST: 'guest',
    HOST: 'host',
    ADMIN: 'admin',
  },

  // Booking status
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PAID: 'paid',
    CHECKED_IN: 'checked_in',
    CHECKED_OUT: 'checked_out',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected',
  },

  // Payment status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded',
  },

  // Homestay status
  HOMESTAY_STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DELETED: 'deleted',
  },

  // Account status
  ACCOUNT_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DELETED: 'deleted',
  },

  // Default pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // File upload limits
  FILE_UPLOAD: {
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_IMAGES_PER_HOMESTAY: 10,
  },
};
