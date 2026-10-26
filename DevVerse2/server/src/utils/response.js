// =============================================================================
// Utility — Consistent JSON API Responses
// =============================================================================

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [data]
 */
const sendSuccess = (res, statusCode, message, data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [errors]
 */
const sendError = (res, statusCode, message, errors = null) => {
  const response = { success: false, message };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
