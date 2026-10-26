// =============================================================================
// JWT and Cookie Utilities
// =============================================================================
const jwt = require('jsonwebtoken');

/**
 * Sign a JWT token for a given user ID and role.
 * @param {string} userId
 * @param {string} role
 * @returns {string}
 */
const signToken = (userId, role = 'user') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'devverse_default_jwt_secret_dev_only',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Configure cookie options securely based on environment.
 * @returns {import('express').CookieOptions}
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = process.env.COOKIE_SECURE === 'true' || isProduction;

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
};

/**
 * Send HTTP-only cookie with JWT token and return the token string.
 * @param {import('express').Response} res
 * @param {string} token
 */
const setAuthCookie = (res, token) => {
  res.cookie('token', token, getCookieOptions());
};

/**
 * Clear the authentication cookie.
 * @param {import('express').Response} res
 */
const clearAuthCookie = (res) => {
  res.clearCookie('token', {
    ...getCookieOptions(),
    maxAge: 0,
  });
};

module.exports = {
  signToken,
  getCookieOptions,
  setAuthCookie,
  clearAuthCookie,
};
