const crypto = require('crypto');
const User = require('../users/user.model');
const { generateTokenPair, verifyRefreshToken } = require('../../utils/jwt.util');
const {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require('../../utils/apiError');
const logger = require('../../utils/logger');
const emailService = require('../../services/email.service');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const {
      email, password, firstName, lastName, role, profile,
    } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Extract profile data (support both nested profile object and direct fields)
    const profileData = profile || {};
    const userProfile = {
      firstName: profileData.firstName || firstName || '',
      lastName: profileData.lastName || lastName || '',
      phone: profileData.phone || '',
    };

    // Validate that we have at least firstName
    if (!userProfile.firstName.trim()) {
      throw new BadRequestError('First name is required');
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role: role || 'guest',
      profile: userProfile,
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user, verificationToken);
    logger.info(`User registered: ${user.email} - Name: ${userProfile.firstName} ${userProfile.lastName}`);

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      tokens,
      verificationToken, // For development/testing only
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user with password
    const user = await User.findByEmail(email).select('+password');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      throw new UnauthorizedError('Your account has been suspended');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token and last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check account status
      if (user.accountStatus !== 'active') {
        throw new UnauthorizedError('Your account has been suspended');
      }

      // Generate new token pair
      const tokens = generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      // Update refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save();

      return tokens;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Clear refresh token
    user.refreshToken = null;
    await user.save();

    logger.info(`User logged out: ${user.email}`);

    return true;
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    // Update user
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info(`Email verified: ${user.email}`);

    return user;
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(email) {
    const user = await User.findByEmail(email);

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Generate new token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user, verificationToken);
    logger.info(`Verification email resent to: ${user.email}`);

    return true;
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    const user = await User.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return true;
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    await emailService.sendPasswordResetEmail(user, resetToken);
    logger.info(`Password reset token generated for: ${user.email}`);

    return true;
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = null; // Logout from all devices
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);

    return user;
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.refreshToken = null; // Logout from all devices
    await user.save();

    logger.info(`Password changed for: ${user.email}`);

    return user;
  }
}

module.exports = new AuthService();
