// =============================================================================
// Global Error-Handling Middleware
// =============================================================================
const { sendError } = require('../utils/response');

/**
 * Mongoose validation error → 400
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return { statusCode: 400, message: 'Validation failed', errors };
};

/**
 * Mongoose duplicate key error → 409
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    statusCode: 409,
    message: `An account with that ${field} already exists.`,
  };
};

/**
 * Mongoose bad ObjectId → 400
 */
const handleCastError = (err) => ({
  statusCode: 400,
  message: `Invalid ${err.path}: ${err.value}`,
});

/**
 * JWT errors → 401
 */
const handleJWTError = () => ({
  statusCode: 401,
  message: 'Invalid or expired token. Please log in again.',
});

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const info = handleValidationError(err);
    statusCode = info.statusCode;
    message = info.message;
    errors = info.errors;
  }

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    const info = handleDuplicateKeyError(err);
    statusCode = info.statusCode;
    message = info.message;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const info = handleCastError(err);
    statusCode = info.statusCode;
    message = info.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const info = handleJWTError();
    statusCode = info.statusCode;
    message = info.message;
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds 2 MB limit.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected upload field "${err.field}".`;
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // Log unexpected errors in development
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('💥 Unhandled Error:', err);
  }

  // Never expose stack traces or internal details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  sendError(res, statusCode, message, errors);
};

module.exports = errorHandler;
