const jwt = require('jsonwebtoken');

/**
 * Generate access token
 * @param {Object} payload - Token payload
 * @returns {String} JWT access token
 */
const generateAccessToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
});

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
  expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
});

/**
 * Verify access token
 * @param {String} token - JWT token
 * @returns {Object} Decoded payload
 */
const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

/**
 * Verify refresh token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded payload
 */
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/**
 * Generate token pair (access + refresh)
 * @param {Object} payload - Token payload
 * @returns {Object} Object with accessToken and refreshToken
 */
const generateTokenPair = (payload) => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};
