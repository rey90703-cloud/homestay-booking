const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: false, // Optional - sử dụng chatroomId thay thế
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false, // Optional - cho phép chat trực tiếp không qua booking
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['guest', 'host'],
      required: false, // Optional
    },
    content: {
      type: String,
      required: true,
      maxLength: 2000,
    },
    type: {
      type: String,
      enum: ['text'],
      default: 'text',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    metadata: {
      clientId: String,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ bookingId: 1 });
messageSchema.index({ senderId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
