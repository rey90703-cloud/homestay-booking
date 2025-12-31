const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto.util');

/**
 * AccessControl Model
 * Quản lý mật khẩu guest cho Smart Door Access Control
 * Mật khẩu do ESP32 tự sinh và gửi lên backend qua MQTT
 * 
 * Requirements: 13.6 - Password encryption at rest
 */
const accessControlSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true, // Mỗi booking chỉ có 1 access control
    },

    guestPassword: {
      type: String,
      required: [true, 'Guest password is required'],
      // Encrypted password sẽ dài hơn, không validate length ở đây
      // Validation sẽ được thực hiện trước khi encrypt
    },

    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0, 'Duration cannot be negative'],
      max: [1440, 'Duration cannot exceed 1440 minutes (24 hours)'],
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required'],
      index: true, // Index để query passwords sắp hết hạn
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index để query active passwords
    },

    confirmedAt: {
      type: Date,
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Indexes
accessControlSchema.index({ bookingId: 1 }, { unique: true });
accessControlSchema.index({ expiresAt: 1 });
accessControlSchema.index({ isActive: 1 });

/**
 * Method: Kiểm tra xem password đã hết hạn chưa
 * @returns {Boolean} true nếu đã hết hạn
 */
accessControlSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

/**
 * Method: Tính toán thời gian hết hạn dựa trên duration
 * @param {Number} durationMinutes - Số phút hiệu lực
 * @returns {Date} Thời gian hết hạn
 */
accessControlSchema.methods.calculateExpiry = function (durationMinutes) {
  const now = new Date();
  return new Date(now.getTime() + durationMinutes * 60000);
};

/**
 * Pre-save hook: Encrypt password before saving
 * Requirements: 13.6
 */
accessControlSchema.pre('save', function (next) {
  // Encrypt password if it's modified and not already encrypted
  if (this.isModified('guestPassword')) {
    try {
      // Check if password is already encrypted (contains ':' separator)
      if (!this.guestPassword.includes(':')) {
        // Validate plain password format before encrypting
        if (!/^\d{4,6}$/.test(this.guestPassword) || this.guestPassword === '9999') {
          return next(new Error('Guest password must be 4-6 digits and not "9999"'));
        }
        
        // Encrypt the password
        this.guestPassword = encrypt(this.guestPassword);
      }
    } catch (error) {
      return next(error);
    }
  }
  
  // Auto-calculate expiresAt if duration changed
  if (this.isModified('durationMinutes') && !this.isModified('expiresAt')) {
    this.expiresAt = this.calculateExpiry(this.durationMinutes);
  }
  
  next();
});

/**
 * Virtual property: Get decrypted password
 * Requirements: 13.6
 */
accessControlSchema.virtual('decryptedPassword').get(function () {
  try {
    return decrypt(this.guestPassword);
  } catch (error) {
    // If decryption fails, return null
    return null;
  }
});

/**
 * Method: Get decrypted password (alternative to virtual)
 * Requirements: 13.6
 * @returns {string} Decrypted password
 */
accessControlSchema.methods.getDecryptedPassword = function () {
  try {
    return decrypt(this.guestPassword);
  } catch (error) {
    throw new Error('Failed to decrypt password');
  }
};

const AccessControl = mongoose.model('AccessControl', accessControlSchema);

module.exports = AccessControl;
