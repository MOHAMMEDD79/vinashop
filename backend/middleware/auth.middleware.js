/**
 * Auth Middleware
 * @module middleware/auth
 * 
 * FIXED ISSUES:
 * 1. Token extraction now works correctly with request object
 * 2. verifyAccessToken returns decoded payload directly
 * 3. Consistent error response format
 */

const { verifyAccessToken, extractTokenFromHeader, isTokenBlacklisted } = require('../config/jwt');
const { query } = require('../config/database');

/**
 * Authenticate admin user
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header (extractTokenFromHeader now accepts req object)
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error_code: 'TOKEN_REQUIRED',
      });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        error_code: 'TOKEN_REVOKED',
      });
    }

    // Verify token (now returns decoded payload directly or throws error)
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
        error_code: 'INVALID_TOKEN',
      });
    }

    // Check if admin exists and is active
    const [admin] = await query(
      `SELECT admin_id, username, email, full_name, role, is_active
       FROM admin_users
       WHERE admin_id = ?`,
      [decoded.adminId]
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found',
        error_code: 'ADMIN_NOT_FOUND',
      });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
        error_code: 'ACCOUNT_INACTIVE',
      });
    }

    // Attach admin to request
    req.admin = {
      adminId: admin.admin_id,
      username: admin.username,
      email: admin.email,
      fullName: admin.full_name,
      role: admin.role,
      permissions: [],
    };

    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
        error_code: 'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        error_code: 'INVALID_TOKEN',
      });
    }

    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return next();
    }

    if (isTokenBlacklisted(token)) {
      return next();
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return next();
    }

    const [admin] = await query(
      `SELECT admin_id, username, email, full_name, role, is_active
       FROM admin_users
       WHERE admin_id = ? AND is_active = 1`,
      [decoded.adminId]
    );

    if (admin) {
      req.admin = {
        adminId: admin.admin_id,
        username: admin.username,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role,
        permissions: [],
      };
      req.token = token;
    }

    next();
  } catch (error) {
    // Don't fail, just continue without auth
    next();
  }
};

/**
 * Authenticate user (customer) for mobile app
 */
const authenticateUser = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error_code: 'TOKEN_REQUIRED',
      });
    }

    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        error_code: 'TOKEN_REVOKED',
      });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
        error_code: 'INVALID_TOKEN',
      });
    }

    // Check if user exists and is active
    const [user] = await query(
      `SELECT user_id, username, email, status, is_verified 
       FROM users 
       WHERE user_id = ?`,
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error_code: 'USER_NOT_FOUND',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
        error_code: 'ACCOUNT_INACTIVE',
      });
    }

    req.user = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      status: user.status,
      isVerified: user.is_verified,
    };

    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
        error_code: 'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        error_code: 'INVALID_TOKEN',
      });
    }

    next(error);
  }
};

/**
 * Require email verification
 */
const requireVerifiedEmail = (req, res, next) => {
  if (req.user && !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address first',
      error_code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

/**
 * Check if password needs to be changed
 */
const checkPasswordExpiry = async (req, res, next) => {
  try {
    if (!req.admin) {
      return next();
    }

    const [admin] = await query(
      'SELECT password_changed_at FROM admin_users WHERE admin_id = ?',
      [req.admin.adminId]
    );

    if (!admin || !admin.password_changed_at) {
      return next();
    }

    // Get password expiry days from settings (default 90 days)
    const [settings] = await query(
      "SELECT value FROM settings WHERE `key` = 'password_expiry_days'"
    );

    const expiryDays = settings ? parseInt(settings.value) : 90;
    
    if (expiryDays <= 0) {
      return next();
    }

    const passwordChangedAt = new Date(admin.password_changed_at);
    const expiryDate = new Date(passwordChangedAt);
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    if (new Date() > expiryDate) {
      return res.status(403).json({
        success: false,
        message: 'Your password has expired. Please change it.',
        error_code: 'PASSWORD_EXPIRED',
        password_expired: true,
      });
    }

    // Warn if password expires within 7 days
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7);

    if (expiryDate <= warningDate) {
      req.passwordExpiryWarning = {
        expires_at: expiryDate,
        days_remaining: Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
      };
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Validate API key for external services
 */
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required',
        error_code: 'API_KEY_REQUIRED',
      });
    }

    // Check API key in database
    const [keyData] = await query(
      `SELECT * FROM api_keys 
       WHERE api_key = ? AND is_active = 1 
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [apiKey]
    );

    if (!keyData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired API key',
        error_code: 'INVALID_API_KEY',
      });
    }

    // Update last used
    query(
      'UPDATE api_keys SET last_used_at = NOW(), usage_count = usage_count + 1 WHERE id = ?',
      [keyData.id]
    ).catch(err => console.error('Failed to update API key usage:', err));

    let permissions = [];
    try {
      permissions = keyData.permissions ? JSON.parse(keyData.permissions) : [];
    } catch (e) {
      permissions = [];
    }

    req.apiKey = {
      id: keyData.id,
      name: keyData.name,
      permissions: permissions,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check session validity
 */
const checkSession = async (req, res, next) => {
  try {
    if (!req.admin || !req.token) {
      return next();
    }

    // Check if session exists and is active
    const [session] = await query(
      `SELECT * FROM admin_sessions 
       WHERE admin_id = ? AND token_hash = ? AND is_active = 1 
       AND expires_at > NOW()`,
      [req.admin.adminId, require('crypto').createHash('sha256').update(req.token).digest('hex')]
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session has expired or been revoked',
        error_code: 'SESSION_INVALID',
      });
    }

    // Update session last activity
    query(
      'UPDATE admin_sessions SET last_activity = NOW() WHERE id = ?',
      [session.id]
    ).catch(err => console.error('Failed to update session activity:', err));

    req.sessionId = session.id;

    next();
  } catch (error) {
    next();
  }
};

/**
 * Require two-factor authentication
 */
const require2FA = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error_code: 'UNAUTHORIZED',
      });
    }

    // Check if 2FA is enabled for this admin
    const [admin] = await query(
      'SELECT two_factor_enabled, two_factor_verified FROM admin_users WHERE admin_id = ?',
      [req.admin.adminId]
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found',
        error_code: 'ADMIN_NOT_FOUND',
      });
    }

    if (admin.two_factor_enabled && !admin.two_factor_verified) {
      return res.status(403).json({
        success: false,
        message: 'Two-factor authentication required',
        error_code: 'TWO_FACTOR_REQUIRED',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check concurrent session limit
 */
const checkConcurrentSessions = async (req, res, next) => {
  try {
    if (!req.admin) {
      return next();
    }

    // Get max concurrent sessions from settings
    const [settings] = await query(
      "SELECT value FROM settings WHERE `key` = 'max_concurrent_sessions'"
    );

    const maxSessions = settings ? parseInt(settings.value) : 5;

    // Count active sessions
    const [result] = await query(
      `SELECT COUNT(*) as count FROM admin_sessions 
       WHERE admin_id = ? AND is_active = 1 AND expires_at > NOW()`,
      [req.admin.adminId]
    );

    if (result.count > maxSessions) {
      // Revoke oldest sessions
      await query(
        `UPDATE admin_sessions 
         SET is_active = 0 
         WHERE admin_id = ? AND is_active = 1 
         ORDER BY created_at ASC 
         LIMIT ?`,
        [req.admin.adminId, result.count - maxSessions]
      );
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Track login attempts
 */
const trackLoginAttempt = async (req, success, adminId = null) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const email = req.body.email;

    await query(
      `INSERT INTO login_attempts (email, ip_address, user_agent, success, admin_id, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [email, ip, userAgent, success ? 1 : 0, adminId]
    );
  } catch (error) {
    console.error('Failed to track login attempt:', error);
  }
};

/**
 * Check for too many failed login attempts
 */
const checkLoginAttempts = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const email = req.body.email;

    if (!email) {
      return next();
    }

    // Get settings
    const [maxAttemptsSettings] = await query(
      "SELECT value FROM settings WHERE `key` = 'max_login_attempts'"
    );
    const [lockoutSettings] = await query(
      "SELECT value FROM settings WHERE `key` = 'lockout_duration'"
    );

    const maxAttempts = maxAttemptsSettings ? parseInt(maxAttemptsSettings.value) : 5;
    const lockoutMinutes = lockoutSettings ? parseInt(lockoutSettings.value) : 30;

    // Count recent failed attempts
    const [result] = await query(
      `SELECT COUNT(*) as count FROM login_attempts 
       WHERE (email = ? OR ip_address = ?) 
       AND success = 0 
       AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [email, ip, lockoutMinutes]
    );

    if (result.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again after ${lockoutMinutes} minutes.`,
        error_code: 'TOO_MANY_ATTEMPTS',
        lockout_minutes: lockoutMinutes,
      });
    }

    req.loginAttemptsRemaining = maxAttempts - result.count;

    next();
  } catch (error) {
    next();
  }
};

/**
 * CORS credentials check
 */
const checkCredentials = (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://vinashop.ps', 'http://admin.vinashop.ps'];

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authenticateUser,
  requireVerifiedEmail,
  checkPasswordExpiry,
  validateApiKey,
  checkSession,
  require2FA,
  checkConcurrentSessions,
  trackLoginAttempt,
  checkLoginAttempts,
  checkCredentials,
};