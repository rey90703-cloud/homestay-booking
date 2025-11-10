const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'closed'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['general', 'booking', 'payment', 'technical', 'feedback', 'complaint', 'other'],
      default: 'general',
    },
    adminNotes: {
      type: String,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
    reply: {
      message: String,
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      repliedAt: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: Date,
    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ category: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ userId: 1 });

// Method to mark as read
contactSchema.methods.markAsRead = function (adminId) {
  this.status = 'read';
  this.readAt = new Date();
  this.readBy = adminId;
  return this.save();
};

// Method to add reply
contactSchema.methods.addReply = function (replyMessage, adminId) {
  this.reply = {
    message: replyMessage,
    repliedBy: adminId,
    repliedAt: new Date(),
  };
  this.status = 'replied';
  return this.save();
};

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
