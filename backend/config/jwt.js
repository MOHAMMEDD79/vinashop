/**
 * JWT Configuration
 * @module config/jwt
 * 
 * FIXED ISSUES:
 * 1. extractTokenFromHeader now accepts req object (not just authHeader string)
 * 2. verifyAccessToken returns decoded payload directly for auth middleware compatibility
 */

const jwt = require('jsonwebtoken');

/**
 * JWT Configuration Options
 */
const config = {
  // Access token settings
  accessToken: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  },
  
  // Refresh token settings
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    algorithm: 'HS256',
  },
  
  // Token issuer
  issuer: process.env.JWT_ISSUER || 'vinashop-admin',

  // Token audience
  audience: process.env.JWT_AUDIENCE || 'vinashop-admin-panel',
};

/**
 * Generate access token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
    },
    config.accessToken.secret,
    {
      expiresIn: config.accessToken.expiresIn,
      algorithm: config.accessToken.algorithm,
      issuer: config.issuer,
      audience: config.audience,
    }
  );
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
    },
    config.refreshToken.secret,
    {
      expiresIn: config.refreshToken.expiresIn,
      algorithm: config.refreshToken.algorithm,
      issuer: config.issuer,
      audience: config.audience,
    }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} payload - Token payload
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (payload) => {
  const tokenPayload = {
    adminId: payload.adminId,
    email: payload.email,
    role: payload.role,
    username: payload.username,
  };

  return {
    accessToken: generateAccessToken(tokenPayload),
    refreshToken: generateRefreshToken({ adminId: payload.adminId }),
    expiresIn: config.accessToken.expiresIn,
    refreshExpiresIn: config.refreshToken.expiresIn,
  };
};

/**
 * Verify access token
 * FIXED: Returns decoded payload directly (not wrapped in object) for auth middleware compatibility
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.accessToken.secret, {
      algorithms: [config.accessToken.algorithm],
      issuer: config.issuer,
      audience: config.audience,
    });

    if (decoded.type !== 'access') {
      return null;
    }

    return decoded;
  } catch (error) {
    // Re-throw specific JWT errors so middleware can handle them
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      throw error;
    }
    return null;
  }
};

/**
 * Verify access token (returns full result object)
 * Use this when you need detailed information about the verification
 * @param {string} token - JWT token
 * @returns {Object} { valid, expired, decoded, error }
 */
const verifyAccessTokenFull = (token) => {
  try {
    const decoded = jwt.verify(token, config.accessToken.secret, {
      algorithms: [config.accessToken.algorithm],
      issuer: config.issuer,
      audience: config.audience,
    });

    if (decoded.type !== 'access') {
      return {
        valid: false,
        expired: false,
        error: 'Invalid token type',
      };
    }

    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      error: error.message,
    };
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.refreshToken.secret, {
      algorithms: [config.refreshToken.algorithm],
      issuer: config.issuer,
      audience: config.audience,
    });

    if (decoded.type !== 'refresh') {
      return {
        valid: false,
        expired: false,
        error: 'Invalid token type',
      };
    }

    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      error: error.message,
    };
  }
};

/**
 * Decode token without verification
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * FIXED: Now accepts request object (req) instead of just authHeader string
 * @param {Object|string} reqOrHeader - Express request object or Authorization header string
 * @returns {string|null} Token or null
 */
const extractTokenFromHeader = (reqOrHeader) => {
  let authHeader;
  
  // Handle both request object and direct header string
  if (typeof reqOrHeader === 'object' && reqOrHeader !== null) {
    // It's a request object - get Authorization header
    authHeader = reqOrHeader.headers?.authorization || reqOrHeader.headers?.Authorization;
  } else {
    // It's a direct header string
    authHeader = reqOrHeader;
  }

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and "<token>" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return authHeader;
};

/**
 * Get token expiration date
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  
  if (decoded && decoded.payload && decoded.payload.exp) {
    return new Date(decoded.payload.exp * 1000);
  }
  
  return null;
};

/**
 * Check if token is about to expire
 * @param {string} token - JWT token
 * @param {number} thresholdMinutes - Minutes before expiration
 * @returns {boolean} True if token expires soon
 */
const isTokenExpiringSoon = (token, thresholdMinutes = 30) => {
  const expiration = getTokenExpiration(token);
  
  if (!expiration) {
    return true;
  }
  
  const thresholdMs = thresholdMinutes * 60 * 1000;
  const now = new Date();
  
  return expiration.getTime() - now.getTime() < thresholdMs;
};

/**
 * Generate password reset token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateResetToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      type: 'reset',
    },
    config.accessToken.secret,
    {
      expiresIn: '1h', // Reset tokens expire in 1 hour
      algorithm: config.accessToken.algorithm,
      issuer: config.issuer,
    }
  );
};

/**
 * Verify password reset token
 * @param {string} token - JWT token
 * @returns {Object} Verification result
 */
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.accessToken.secret, {
      algorithms: [config.accessToken.algorithm],
      issuer: config.issuer,
    });

    if (decoded.type !== 'reset') {
      return {
        valid: false,
        expired: false,
        error: 'Invalid token type',
      };
    }

    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      error: error.message,
    };
  }
};

/**
 * Generate email verification token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateVerificationToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      type: 'verification',
    },
    config.accessToken.secret,
    {
      expiresIn: '24h', // Verification tokens expire in 24 hours
      algorithm: config.accessToken.algorithm,
      issuer: config.issuer,
    }
  );
};

/**
 * Verify email verification token
 * @param {string} token - JWT token
 * @returns {Object} Verification result
 */
const verifyVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.accessToken.secret, {
      algorithms: [config.accessToken.algorithm],
      issuer: config.issuer,
    });

    if (decoded.type !== 'verification') {
      return {
        valid: false,
        expired: false,
        error: 'Invalid token type',
      };
    }

    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      error: error.message,
    };
  }
};

/**
 * Blacklist for revoked tokens (in production, use Redis)
 */
const tokenBlacklist = new Set();

/**
 * Add token to blacklist
 * @param {string} token - JWT token
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up expired tokens from blacklist periodically
  const decoded = decodeToken(token);
  if (decoded && decoded.payload && decoded.payload.exp) {
    const expiresAt = decoded.payload.exp * 1000;
    const now = Date.now();
    const ttl = expiresAt - now;
    
    if (ttl > 0) {
      setTimeout(() => {
        tokenBlacklist.delete(token);
      }, ttl);
    }
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token
 * @returns {boolean} True if blacklisted
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Clear all blacklisted tokens
 */
const clearBlacklist = () => {
  tokenBlacklist.clear();
};

/**
 * Get token remaining time in seconds
 * @param {string} token - JWT token
 * @returns {number} Remaining time in seconds
 */
const getTokenRemainingTime = (token) => {
  const expiration = getTokenExpiration(token);
  
  if (!expiration) {
    return 0;
  }
  
  const now = new Date();
  const remaining = Math.floor((expiration.getTime() - now.getTime()) / 1000);
  
  return remaining > 0 ? remaining : 0;
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @param {Function} getUserById - Function to get user by ID
 * @returns {Object} New token pair or error
 */
const refreshAccessTokenUtil = async (refreshToken, getUserById) => {
  const verification = verifyRefreshToken(refreshToken);
  
  if (!verification.valid) {
    return {
      success: false,
      error: verification.expired ? 'Refresh token expired' : 'Invalid refresh token',
    };
  }
  
  if (isTokenBlacklisted(refreshToken)) {
    return {
      success: false,
      error: 'Token has been revoked',
    };
  }
  
  try {
    const user = await getUserById(verification.decoded.adminId);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }
    
    if (!user.is_active && user.status !== 'active') {
      return {
        success: false,
        error: 'User account is disabled',
      };
    }
    
    // Generate new token pair
    const tokens = generateTokenPair({
      adminId: user.admin_id,
      email: user.email,
      role: user.role,
      username: user.username,
    });
    
    return {
      success: true,
      ...tokens,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  config,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyAccessTokenFull,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
  getTokenExpiration,
  isTokenExpiringSoon,
  generateResetToken,
  verifyResetToken,
  generateVerificationToken,
  verifyVerificationToken,
  blacklistToken,
  isTokenBlacklisted,
  clearBlacklist,
  getTokenRemainingTime,
  refreshAccessToken: refreshAccessTokenUtil,
};