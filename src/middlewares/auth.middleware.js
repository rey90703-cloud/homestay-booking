const { verifyAccessToken } = require('../utils/jwt.util');
const { UnauthorizedError } = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const User = require('../modules/users/user.model');

/**
 * Middleware to authenticate user using JWT
 */
const authenticate = catchAsync(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided. Please log in.');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new UnauthorizedError('User not found. Please log in again.');
    }

    // Check if user account is active
    if (user.accountStatus !== 'active') {
      throw new UnauthorizedError('Your account has been suspended.');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid or expired token. Please log in again.');
    }
    throw error;
  }
});

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuthenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.accountStatus === 'active') {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional authentication
    }
  }

  next();
});

module.exports = {
  authenticate,
  optionalAuthenticate,
};
