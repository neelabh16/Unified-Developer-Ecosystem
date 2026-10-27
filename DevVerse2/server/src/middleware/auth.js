// =============================================================================
// Authentication Middleware — JWT verification via HttpOnly cookie
// =============================================================================
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Protect routes — requires a valid JWT in the `token` HttpOnly cookie.
 * Attaches `req.user` (the full user document minus password).
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from HttpOnly cookie or Authorization Bearer header
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    // 3. Check that the user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth — if a token is present and valid, attach the user.
 * Does NOT reject unauthenticated requests.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }
  } catch {
    // Token invalid or expired — continue as unauthenticated
  }
  next();
};

/**
 * Authorization — restrict to specific roles.
 * Must be used AFTER `protect`.
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'moderator')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };
