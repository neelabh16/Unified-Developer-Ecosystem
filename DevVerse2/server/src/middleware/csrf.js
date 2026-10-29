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

  // Header-based Bearer token authentication is inherently CSRF-immune
  const authHeader = req.get('Authorization') || req.headers?.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // API development tools (Postman, Insomnia, Thunder Client) are not browser clients
  // and are immune to browser-based CSRF attacks. Check actual headers dictionary.
  const rawHeaders = req.headers || {};
  if (
    rawHeaders['postman-token'] ||
    /PostmanRuntime|insomnia|Thunder Client/i.test(rawHeaders['user-agent'] || '')
  ) {
    return next();
  }

  const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://web.postman.co',
  ].filter(Boolean);

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

  // Allow same-origin requests or standard hosting domains
  try {
    const host = req.get('Host');
    const sourceUrl = new URL(source);
    if (host && (sourceUrl.host === host || sourceUrl.hostname === req.hostname)) {
      return next();
    }
    if (/\.onrender\.com$/.test(sourceUrl.hostname) || /\.vercel\.app$/.test(sourceUrl.hostname)) {
      return next();
    }
  } catch (e) {}

  return next(new AppError('Cross-origin request blocked.', 403));
};

module.exports = csrfProtection;
