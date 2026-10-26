// =============================================================================
// Parameter & ObjectId Validation Middleware
// =============================================================================
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Validates that specified request params are either valid MongoDB ObjectIds
 * or valid application slugs (e.g. user-123, codex-456, squad-789).
 * Prevents NoSQL operator injection via route parameters.
 * @param {string[]} paramNames
 */
const validateIdParams = (...paramNames) => {
  return (req, _res, next) => {
    for (const name of paramNames) {
      const val = req.params[name];
      if (!val) continue;

      // Check for forbidden characters/operators in params
      if (typeof val !== 'string' || /[${}]/.test(val)) {
        return next(new AppError(`Invalid format for parameter "${name}".`, 400));
      }

      // If it looks like a Mongo ID (24-hex), verify validity
      if (/^[0-9a-fA-F]{24}$/.test(val)) {
        if (!mongoose.Types.ObjectId.isValid(val)) {
          return next(new AppError(`Invalid ObjectId for parameter "${name}".`, 400));
        }
      } else if (!/^[a-zA-Z0-9_\-.:]+$/.test(val)) {
        // Must be safe slug format
        return next(new AppError(`Malformed identifier for parameter "${name}".`, 400));
      }
    }
    next();
  };
};

module.exports = { validateIdParams };
