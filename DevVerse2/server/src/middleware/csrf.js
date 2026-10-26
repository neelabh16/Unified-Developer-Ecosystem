// =============================================================================
// CSRF / Origin Validation Middleware
// =============================================================================
// For cookie-based auth, we validate the Origin or Referer header on
// state-changing (unsafe) HTTP methods to prevent cross-site request forgery.
// =============================================================================

const AppError = require('../utils/AppError');

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Validates Origin/Referer on unsafe requests to prevent CSRF.
 */
const csrfProtection = (req, res, next) => {
  // Skip safe (read-only) methods
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  const allowedOrigins = [process.env.CLIENT_ORIGIN].filter(Boolean);

  // In development, also allow common local origins
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push(
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173'
    );
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const source = origin || (referer ? new URL(referer).origin : null);

  // If no origin header and no referer — likely a server-to-server or tool request
  // Allow if no token cookie is present (not a browser session)
  if (!source) {
    if (!req.cookies?.token) {
      return next(); // No cookie-based session, no CSRF risk
    }
    return next(new AppError('Origin header required for authenticated requests.', 403));
  }

  if (allowedOrigins.includes(source)) {
    return next();
  }

  return next(new AppError('Cross-origin request blocked.', 403));
};

module.exports = csrfProtection;
