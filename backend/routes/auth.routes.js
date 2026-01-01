/**
 * Auth Routes
 * @module routes/auth
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { loginRateLimiter, passwordResetLimiter } = require('../middleware/rateLimiter.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

/**
 * @route   POST /api/v1/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post(
  '/login',
  loginRateLimiter,
  validate(schemas.auth.login),
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Admin logout
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.revokeAllSessions);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public (with refresh token)
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current admin profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * @route   PUT /api/v1/auth/me
 * @desc    Update current admin profile
 * @access  Private
 */
router.put('/me', authenticate, authController.updateProfile);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change admin password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  validate(schemas.auth.changePassword),
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(schemas.auth.forgotPassword),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(schemas.auth.resetPassword),
  authController.resetPassword
);

/**
 * @route   GET /api/v1/auth/verify-token
 * @desc    Verify JWT token
 * @access  Private
 */
router.get('/verify-token', authenticate, authController.verifyToken);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getActiveSessions);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

/**
 * @route   GET /api/v1/auth/login-history
 * @desc    Get login history
 * @access  Private
 */
router.get('/login-history', authenticate, authController.getLoginHistory);

// ==================== Two-Factor Authentication ====================

/**
 * @route   POST /api/v1/auth/2fa/enable
 * @desc    Enable two-factor authentication
 * @access  Private
 */
router.post('/2fa/enable', authenticate, authController.enableTwoFactor);

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify and complete 2FA setup
 * @access  Private
 */
router.post(
  '/2fa/verify',
  authenticate,
  validate(schemas.auth.verifyTwoFactor),
  authController.verifyTwoFactor
);

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable two-factor authentication
 * @access  Private
 */
router.post('/2fa/disable', authenticate, authController.disableTwoFactor);

/**
 * @route   POST /api/v1/auth/2fa/validate
 * @desc    Validate 2FA code during login
 * @access  Public (with temp token)
 */
router.post(
  '/2fa/validate',
  validate(schemas.auth.verifyTwoFactor),
  authController.verifyTwoFactorLogin
);

/**
 * @route   POST /api/v1/auth/permissions
 * @desc    Check admin permissions
 * @access  Private
 */
router.post('/permissions', authenticate, authController.checkPermissions);

module.exports = router;