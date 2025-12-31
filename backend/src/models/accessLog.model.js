const mongoose = require('mongoose');

/**
 * AccessLog Model
 * Lưu trữ lịch sử truy cập cửa từ ESP32
 * Nhận data từ MQTT topic: smartdoor/log
 */
const accessLogSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true, // Index để query logs theo booking
    },

    user: {
      type: String,
      required: [true, 'User is required'],
      enum: {
        values: ['Admin', 'Guest', 'Chủ nhà'],
        message: '{VALUE} is not a valid user type',
      },
    },

    method: {
      type: String,
      required: [true, 'Method is required'],
      enum: {
        values: ['KEYPAD', 'WEB'],
        message: '{VALUE} is not a valid access method',
      },
    },

    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      index: true, // Index để query logs theo thời gian
    },

    rawTimestamp: {
      type: Number, // Millis từ ESP32
      required: [true, 'Raw timestamp is required'],
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Compound indexes
accessLogSchema.index({ bookingId: 1, timestamp: -1 }); // Query logs của booking, sắp xếp theo thời gian mới nhất
accessLogSchema.index({ timestamp: -1 }); // Query tất cả logs theo thời gian

/**
 * Static method: Chuyển đổi milliseconds sang Date
 * @param {Number} millis - Timestamp dạng milliseconds từ ESP32
 * @returns {Date} Date object
 */
accessLogSchema.statics.convertMillisToDate = function (millis) {
  return new Date(millis);
};

/**
 * Instance method: Chuyển đổi rawTimestamp sang Date
 * @returns {Date} Date object
 */
accessLogSchema.methods.convertMillisToDate = function () {
  return new Date(this.rawTimestamp);
};

/**
 * Pre-save hook: Tự động chuyển đổi rawTimestamp sang timestamp nếu chưa có
 */
accessLogSchema.pre('save', function (next) {
  if (this.rawTimestamp && !this.timestamp) {
    this.timestamp = new Date(this.rawTimestamp);
  }
  next();
});

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = AccessLog;
