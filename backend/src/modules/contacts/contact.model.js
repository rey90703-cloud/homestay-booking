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

// Method to calculate priority based on time and status
contactSchema.methods.calculatePriority = function () {
  const now = new Date();
  const createdAt = this.createdAt;
  const daysDiff = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

  // Urgent: Not replied yet (new or read status)
  if (this.status === 'new' || this.status === 'read') {
    this.priority = 'urgent';
  }
  // High: Within 2 days
  else if (daysDiff <= 2) {
    this.priority = 'high';
  }
  // Medium: Within 1 month (30 days)
  else if (daysDiff <= 30) {
    this.priority = 'medium';
  }
  // Low: Over 1 month
  else {
    this.priority = 'low';
  }

  return this.priority;
};

// Pre-save hook to auto-calculate priority
contactSchema.pre('save', function (next) {
  this.calculatePriority();
  next();
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
