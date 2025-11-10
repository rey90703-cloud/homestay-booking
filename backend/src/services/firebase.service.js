const admin = require('../config/firebase');
const User = require('../modules/users/user.model');
const { generateTokenPair } = require('../utils/jwt.util');

/**
 * Verify Firebase ID token and get user info
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token with user info
 */
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
};

/**
 * Login or create user from Firebase Google auth
 * @param {string} idToken - Firebase ID token
 * @param {string} role - User role (guest or host), defaults to guest
 * @returns {Promise<Object>} User object and tokens
 */
const googleLogin = async (idToken, role = 'guest') => {
  // Verify token
  const decodedToken = await verifyIdToken(idToken);

  const { email, name, picture, uid } = decodedToken;

  if (!email) {
    throw new Error('Email not provided by Google');
  }

  // Validate role
  const validRoles = ['guest', 'host'];
  const userRole = validRoles.includes(role) ? role : 'guest';

  // Find or create user
  let user = await User.findOne({ email });

  if (!user) {
    // Create new user from Google account with selected role
    user = await User.create({
      email,
      fullName: name || email.split('@')[0],
      firebaseUid: uid,
      avatar: picture,
      role: userRole, // Use role from request or default to guest
      emailVerified: true // Google accounts are already verified
    });
  } else {
    // Update Firebase UID if not set
    if (!user.firebaseUid) {
      user.firebaseUid = uid;
      await user.save();
    }
  }

  // Generate JWT tokens
  const tokens = generateTokenPair({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  // Save refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
};

module.exports = {
  verifyIdToken,
  googleLogin
};
