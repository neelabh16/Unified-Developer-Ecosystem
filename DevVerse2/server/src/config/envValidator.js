// =============================================================================
// Environment Variable Validator
// =============================================================================

function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  // JWT Secret validation
  if (!process.env.JWT_SECRET) {
    if (isProd) {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
    } else {
      console.warn('⚠️ WARNING: JWT_SECRET is not set. Using development default fallback.');
    }
  } else if (process.env.JWT_SECRET.length < 16 && isProd) {
    throw new Error('FATAL: JWT_SECRET must be at least 16 characters in production for cryptographic safety.');
  }

  // MongoDB URI validation
  const uri = process.env.MONGODB_URI;
  if (!uri && isProd) {
    throw new Error('FATAL: MONGODB_URI environment variable is required in production.');
  }

  // Port validation
  if (process.env.PORT && isNaN(Number(process.env.PORT))) {
    throw new Error(`FATAL: PORT "${process.env.PORT}" is not a valid number.`);
  }

  return true;
}

module.exports = { validateEnv };
