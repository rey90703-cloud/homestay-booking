const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false, // Optional - cho phép chat trực tiếp không qua booking
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['guest', 'host'],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastSeenAt: {
          type: Date,
        },
      },
    ],
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    metadata: {
      homestayId: mongoose.Schema.Types.ObjectId,
      homestayName: String,
      hostName: String,
    },
    lastMessage: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
chatRoomSchema.index({ bookingId: 1 }, { unique: true });
chatRoomSchema.index({ 'participants.userId': 1 });
chatRoomSchema.index({ 'lastMessage.createdAt': -1 });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
