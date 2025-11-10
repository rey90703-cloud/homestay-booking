const userService = require('./user.service');
const ApiResponse = require('../../utils/apiResponse');
const catchAsync = require('../../utils/catchAsync');
const { BadRequestError } = require('../../utils/apiError');

class UserController {
  /**
   * Get current user profile
   * GET /api/v1/users/me
   */
  getProfile = catchAsync(async (req, res) => {
    const user = await userService.getProfile(req.user._id);
    ApiResponse.success(res, { user }, 'Profile retrieved successfully');
  });

  /**
   * Update current user profile
   * PUT /api/v1/users/me
   */
  updateProfile = catchAsync(async (req, res) => {
    const user = await userService.updateProfile(req.user._id, req.body);
    ApiResponse.success(res, { user }, 'Profile updated successfully');
  });

  /**
   * Upload/Update avatar
   * PATCH /api/v1/users/me/avatar
   */
  updateAvatar = catchAsync(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError('Please upload an image file');
    }

    const user = await userService.updateAvatar(req.user._id, req.file.buffer);
    ApiResponse.success(res, { user }, 'Avatar updated successfully');
  });

  /**
   * Delete account
   * DELETE /api/v1/users/me
   */
  deleteAccount = catchAsync(async (req, res) => {
    await userService.deleteAccount(req.user._id);
    ApiResponse.success(res, null, 'Account deleted successfully');
  });

  /**
   * Become a host
   * POST /api/v1/users/become-host
   */
  becomeHost = catchAsync(async (req, res) => {
    const user = await userService.becomeHost(req.user._id, req.body);
    ApiResponse.success(res, { user }, 'Successfully became a host');
  });

  /**
   * Get host profile
   * GET /api/v1/users/host-profile
   */
  getHostProfile = catchAsync(async (req, res) => {
    const user = await userService.getHostProfile(req.user._id);
    ApiResponse.success(res, { user }, 'Host profile retrieved successfully');
  });

  /**
   * Update host profile
   * PUT /api/v1/users/host-profile
   */
  updateHostProfile = catchAsync(async (req, res) => {
    const user = await userService.updateHostProfile(req.user._id, req.body);
    ApiResponse.success(res, { user }, 'Host profile updated successfully');
  });

  /**
   * Get user by ID (Admin or public info)
   * GET /api/v1/users/:id
   */
  getUserById = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    ApiResponse.success(res, { user }, 'User retrieved successfully');
  });

  /**
   * Get all users (Admin only)
   * GET /api/v1/users
   */
  getAllUsers = catchAsync(async (req, res) => {
    const {
      page, limit, role, accountStatus, search,
    } = req.query;

    const result = await userService.getAllUsers(
      { role, accountStatus, search },
      { page, limit },
    );

    ApiResponse.success(
      res,
      result.users,
      'Users retrieved successfully',
      200,
      { pagination: result.pagination },
    );
  });

  /**
   * Update user status (Admin only)
   * PATCH /api/v1/users/:id/status
   */
  updateUserStatus = catchAsync(async (req, res) => {
    const { status } = req.body;
    const user = await userService.updateUserStatus(req.params.id, status);
    ApiResponse.success(res, { user }, 'User status updated successfully');
  });

  /**
   * Create new user (Admin only)
   * POST /api/v1/users
   */
  createUser = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    ApiResponse.created(res, { user }, 'User created successfully');
  });

  /**
   * Update user (Admin only)
   * PUT /api/v1/users/:id
   */
  updateUser = catchAsync(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    ApiResponse.success(res, { user }, 'User updated successfully');
  });

  /**
   * Delete user (Admin only)
   * DELETE /api/v1/users/:id
   */
  deleteUser = catchAsync(async (req, res) => {
    await userService.deleteUser(req.params.id);
    ApiResponse.success(res, null, 'User deleted successfully');
  });
}

module.exports = new UserController();
