const User = require('./user.model');
const { ForbiddenError, BadRequestError } = require('../../utils/apiError');
const { uploadImage, deleteImage } = require('../../utils/cloudinary.util');
const logger = require('../../utils/logger');
const { ROLES } = require('../../config/constants');
const { createSafeRegex } = require('../../utils/regex.util');
const { createPaginationMeta } = require('../../utils/pagination.util');
const { findByIdOrFail } = require('../../utils/resource.util');

class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId) {
    return findByIdOrFail(User, userId, 'User');
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    return findByIdOrFail(User, userId, 'User', {
      select: '-password -refreshToken',
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const user = await findByIdOrFail(User, userId, 'User');

    // Update profile fields
    if (updateData.firstName) user.profile.firstName = updateData.firstName;
    if (updateData.lastName) user.profile.lastName = updateData.lastName;
    if (updateData.phone) user.profile.phone = updateData.phone;
    if (updateData.dateOfBirth) user.profile.dateOfBirth = updateData.dateOfBirth;
    if (updateData.bio) user.profile.bio = updateData.bio;
    if (updateData.languages) user.profile.languages = updateData.languages;
    if (updateData.address) {
      user.profile.address = {
        ...user.profile.address,
        ...updateData.address,
      };
    }

    await user.save();

    logger.info(`Profile updated for user: ${user.email}`);

    return user;
  }

  /**
   * Upload and update user avatar
   */
  async updateAvatar(userId, fileBuffer) {
    const user = await findByIdOrFail(User, userId, 'User');

    try {
      // Delete old avatar if exists
      if (user.profile.avatar) {
        // Extract public_id from Cloudinary URL
        const urlParts = user.profile.avatar.split('/');
        const publicIdWithExt = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExt.split('.')[0];

        try {
          await deleteImage(publicId);
        } catch (error) {
          logger.warn(`Failed to delete old avatar: ${error.message}`);
        }
      }

      // Upload new avatar
      const uploadResult = await uploadImage(fileBuffer, 'avatars', `avatar_${userId}`);

      user.profile.avatar = uploadResult.url;
      await user.save();

      logger.info(`Avatar updated for user: ${user.email}`);

      return user;
    } catch (error) {
      logger.error(`Avatar upload failed: ${error.message}`);
      throw new BadRequestError('Failed to upload avatar');
    }
  }

  /**
   * Become a host
   */
  async becomeHost(userId, hostData) {
    const user = await findByIdOrFail(User, userId, 'User');

    if (user.role === ROLES.HOST) {
      throw new BadRequestError('User is already a host');
    }

    // Update role to host
    user.role = ROLES.HOST;

    // Update profile with required host information
    user.profile.bio = hostData.bio;
    user.profile.phone = hostData.phone;
    user.profile.address = hostData.address;

    // Initialize host profile
    user.hostProfile = {
      isVerified: false,
      responseRate: 0,
      responseTime: 24,
      superhost: false,
    };

    await user.save();

    logger.info(`User became host: ${user.email}`);

    return user;
  }

  /**
   * Get host profile
   */
  async getHostProfile(userId) {
    const user = await findByIdOrFail(User, userId, 'User', {
      select: '-password -refreshToken',
    });

    if (user.role !== ROLES.HOST && user.role !== ROLES.ADMIN) {
      throw new ForbiddenError('User is not a host');
    }

    return user;
  }

  /**
   * Update host profile
   */
  async updateHostProfile(userId, updateData) {
    const user = await findByIdOrFail(User, userId, 'User');

    if (user.role !== ROLES.HOST && user.role !== ROLES.ADMIN) {
      throw new ForbiddenError('User is not a host');
    }

    // Update host-specific fields
    if (updateData.bio) user.profile.bio = updateData.bio;
    if (updateData.phone) user.profile.phone = updateData.phone;
    if (updateData.address) {
      user.profile.address = {
        ...user.profile.address,
        ...updateData.address,
      };
    }

    await user.save();

    logger.info(`Host profile updated: ${user.email}`);

    return user;
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId) {
    const user = await findByIdOrFail(User, userId, 'User');

    // Soft delete by updating status
    user.accountStatus = 'deleted';
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    logger.info(`User account deleted: ${user._id}`);

    return true;
  }

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(filters = {}, pagination = {}) {
    const {
      page = 1, limit = 20, role, accountStatus, search,
    } = { ...filters, ...pagination };

    const query = {};

    // Apply filters
    if (role) query.role = role;
    if (accountStatus) query.accountStatus = accountStatus;
    if (search) {
      const safeRegex = createSafeRegex(search);
      query.$or = [
        { email: safeRegex },
        { 'profile.firstName': safeRegex },
        { 'profile.lastName': safeRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).select('-password -refreshToken').limit(limit).skip(skip)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(userId, status) {
    const user = await findByIdOrFail(User, userId, 'User');

    user.accountStatus = status;
    await user.save();

    logger.info(`User status updated: ${user.email} -> ${status}`);

    return user;
  }

  /**
   * Create new user (Admin only)
   */
  async createUser(userData) {
    const { email, password, role, profile } = userData;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new BadRequestError('Email already registered');
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      role: role || ROLES.GUEST,
      profile: {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        phone: profile?.phone || '',
      },
      emailVerified: true,
      accountStatus: 'active',
    });

    await user.save();

    logger.info(`New user created by admin: ${user.email}`);

    // Return user without password
    return User.findById(user._id).select('-password -refreshToken');
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(userId, updateData) {
    const user = await findByIdOrFail(User, userId, 'User');

    // Update basic fields
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        throw new BadRequestError('Email already exists');
      }
      user.email = updateData.email.toLowerCase();
    }

    if (updateData.role) user.role = updateData.role;
    if (updateData.accountStatus) user.accountStatus = updateData.accountStatus;

    // Update profile fields
    if (updateData.profile) {
      if (updateData.profile.firstName) user.profile.firstName = updateData.profile.firstName;
      if (updateData.profile.lastName) user.profile.lastName = updateData.profile.lastName;
      if (updateData.profile.phone) user.profile.phone = updateData.profile.phone;
    }

    // Update password if provided
    if (updateData.password) {
      user.password = updateData.password;
    }

    await user.save();

    logger.info(`User updated by admin: ${user.email}`);

    return User.findById(user._id).select('-password -refreshToken');
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId) {
    const user = await findByIdOrFail(User, userId, 'User');

    // Soft delete
    user.accountStatus = 'deleted';
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    logger.info(`User deleted by admin: ${userId}`);

    return true;
  }
}

module.exports = new UserService();
