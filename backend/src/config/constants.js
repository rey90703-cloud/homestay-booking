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

  // Common amenities
  COMMON_AMENITIES: [
    // Tiện nghi cơ bản
    { id: 'wifi', name: 'WiFi', icon: '📶', category: 'basic' },
    { id: 'tv', name: 'TV', icon: '📺', category: 'basic' },
    { id: 'kitchen', name: 'Bếp', icon: '🍳', category: 'basic' },
    { id: 'washing_machine', name: 'Máy giặt', icon: '🧺', category: 'basic' },
    { id: 'air_conditioning', name: 'Điều hòa', icon: '❄️', category: 'basic' },
    { id: 'heating', name: 'Sưởi ấm', icon: '🔥', category: 'basic' },
    { id: 'workspace', name: 'Không gian làm việc', icon: '💼', category: 'basic' },

    // An toàn
    { id: 'smoke_alarm', name: 'Báo khói', icon: '🚨', category: 'safety' },
    { id: 'fire_extinguisher', name: 'Bình cứu hỏa', icon: '🧯', category: 'safety' },
    { id: 'first_aid', name: 'Hộp sơ cứu', icon: '⚕️', category: 'safety' },
    { id: 'security_cameras', name: 'Camera an ninh', icon: '📹', category: 'safety' },

    // Tiện nghi phòng tắm
    { id: 'shampoo', name: 'Dầu gội', icon: '🧴', category: 'bathroom' },
    { id: 'hair_dryer', name: 'Máy sấy tóc', icon: '💨', category: 'bathroom' },
    { id: 'hot_water', name: 'Nước nóng', icon: '🚿', category: 'bathroom' },

    // Ngoài trời
    { id: 'pool', name: 'Hồ bơi', icon: '🏊', category: 'outdoor' },
    { id: 'garden', name: 'Vườn', icon: '🌳', category: 'outdoor' },
    { id: 'balcony', name: 'Ban công', icon: '🪴', category: 'outdoor' },
    { id: 'bbq', name: 'BBQ', icon: '🍖', category: 'outdoor' },

    // Đỗ xe
    { id: 'free_parking', name: 'Đỗ xe miễn phí', icon: '🅿️', category: 'parking' },
    { id: 'paid_parking', name: 'Đỗ xe có phí', icon: '🚗', category: 'parking' },

    // Gia đình
    { id: 'crib', name: 'Nôi em bé', icon: '👶', category: 'family' },
    { id: 'high_chair', name: 'Ghế cao cho bé', icon: '🪑', category: 'family' },

    // Giải trí
    { id: 'gym', name: 'Phòng gym', icon: '🏋️', category: 'entertainment' },
    { id: 'piano', name: 'Piano', icon: '🎹', category: 'entertainment' },
    { id: 'pool_table', name: 'Bàn bi-a', icon: '🎱', category: 'entertainment' },
  ],
};
