const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ROLES, ACCOUNT_STATUS } = require('../../config/constants');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: function() {
        // Password is not required for Google/Firebase users
        return !this.firebaseUid;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.GUEST,
    },
    
    // Firebase Authentication
    firebaseUid: {
      type: String,
      sparse: true, // Allow multiple null values but unique non-null values
    },
    
    // Full name (convenience field for Firebase users)
    fullName: {
      type: String,
      trim: true,
    },
    
    // Avatar (top-level for Firebase users)
    avatar: {
      type: String,
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
    passwordResetOTP: String, // 6-digit OTP
    passwordResetOTPExpires: Date,
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
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.phone': 1 });
userSchema.index({ accountStatus: 1 });

// Virtual for full name (only if fullName field is not set)
userSchema.virtual('displayName').get(function () {
  // Use fullName field if available (Firebase users)
  if (this.fullName) {
    return this.fullName;
  }
  // Otherwise construct from profile fields (regular users)
  if (this.profile && (this.profile.firstName || this.profile.lastName)) {
    return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
  }
  return 'User';
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Skip password hashing for Firebase users
  if (this.firebaseUid) {
    return next();
  }
  
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

// Instance method to generate 6-digit OTP for password reset
userSchema.methods.generatePasswordResetOTP = function () {
  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store hashed OTP
  this.passwordResetOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // OTP expires in 5 minutes
  this.passwordResetOTPExpires = Date.now() + 5 * 60 * 1000;

  return otp;
};

// Instance method to verify OTP
userSchema.methods.verifyPasswordResetOTP = function (otp) {
  if (!this.passwordResetOTP || !this.passwordResetOTPExpires) {
    return false;
  }

  // Check if OTP expired
  if (Date.now() > this.passwordResetOTPExpires) {
    return false;
  }

  // Hash input OTP and compare
  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  return hashedOTP === this.passwordResetOTP;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
