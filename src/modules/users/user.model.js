const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ROLES, ACCOUNT_STATUS } = require('../../config/constants');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.GUEST,
    },

    // Profile Information
    profile: {
      firstName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        trim: true,
      },
      avatar: {
        type: String,
      },
      phone: {
        type: String,
        trim: true,
      },
      dateOfBirth: {
        type: Date,
      },
      bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
      },
      languages: [String],
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },

    // Authentication & Security
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String,

    // Host-specific fields
    hostProfile: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verificationDocument: String,
      responseRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      responseTime: {
        type: Number, // in hours
        default: 24,
      },
      superhost: {
        type: Boolean,
        default: false,
      },
    },

    // Account status
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.phone': 1 });
userSchema.index({ accountStatus: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || 'User';
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastLogin on login
userSchema.pre('save', function (next) {
  if (this.isModified('lastLogin')) {
    this.lastLogin = new Date();
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return token;
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  return token;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
