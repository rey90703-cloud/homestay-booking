const authService = require('./auth.service');
const firebaseService = require('../../services/firebase.service');
const ApiResponse = require('../../utils/apiResponse');
const catchAsync = require('../../utils/catchAsync');

class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  register = catchAsync(async (req, res) => {
    const result = await authService.register(req.body);

    ApiResponse.created(res, result, 'Registration successful. Please verify your email.');
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.success(res, result, 'Login successful');
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  refreshToken = catchAsync(async (req, res) => {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    const tokens = await authService.refreshToken(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.success(res, { tokens }, 'Token refreshed successfully');
  });

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = catchAsync(async (req, res) => {
    await authService.logout(req.user._id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    ApiResponse.success(res, null, 'Logout successful');
  });

  /**
   * Verify email
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = catchAsync(async (req, res) => {
    const { token } = req.body;
    await authService.verifyEmail(token);

    ApiResponse.success(res, null, 'Email verified successfully');
  });

  /**
   * Resend verification email
   * POST /api/v1/auth/resend-verification
   */
  resendVerification = catchAsync(async (req, res) => {
    const { email } = req.body;
    const token = await authService.resendVerificationEmail(email);

    ApiResponse.success(
      res,
      { token }, // Only for development
      'Verification email sent successfully',
    );
  });

  /**
   * Forgot password
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    const token = await authService.forgotPassword(email);

    ApiResponse.success(
      res,
      { token }, // Only for development
      'If your email is registered, you will receive a password reset link',
    );
  });

  /**
   * Verify OTP
   * POST /api/v1/auth/verify-otp
   */
  verifyOTP = catchAsync(async (req, res) => {
    const { email, otp } = req.body;
    await authService.verifyOTP(email, otp);

    ApiResponse.success(res, null, 'OTP verified successfully');
  });

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  resetPassword = catchAsync(async (req, res) => {
    const { email, otp, password } = req.body;
    await authService.resetPassword(email, otp, password);

    ApiResponse.success(res, null, 'Password reset successful. Please login with your new password.');
  });

  /**
   * Change password (authenticated user)
   * PATCH /api/v1/auth/change-password
   */
  changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword);

    // Clear refresh token cookie to logout from all devices
    res.clearCookie('refreshToken');

    ApiResponse.success(
      res,
      null,
      'Password changed successfully. Please login again with your new password.',
    );
  });

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  getCurrentUser = catchAsync(async (req, res) => {
    ApiResponse.success(res, { user: req.user }, 'User retrieved successfully');
  });

  /**
   * Google Login with Firebase
   * POST /api/v1/auth/google
   */
  googleLogin = catchAsync(async (req, res) => {
    const { idToken, role } = req.body;

    if (!idToken) {
      return ApiResponse.error(res, 'Firebase ID token is required', 400);
    }

    const result = await firebaseService.googleLogin(idToken, role);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.success(res, {
      user: result.user,
      accessToken: result.accessToken
    }, 'Google login successful');
  });
}

module.exports = new AuthController();
