/**
 * Auth Controller
 * @module controllers/auth
 * 
 * FIXED ISSUES:
 * 1. Login response format matches frontend AuthContext expectations
 * 2. User object includes all necessary fields (id, role, permissions, avatar)
 * 3. Token fields use consistent naming (accessToken for clarity)
 * 4. Added 2FA response handling for frontend
 */

const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Admin Login
 * Response format matches frontend AuthContext login handler
 */
const login = async (req, res, next) => {
  try {
    const { email, password, remember_me = false } = req.body;

    // Validate required fields
    if (!email || !password) {
      return errorResponse(
        res,
        'Email and password are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Attempt login
    const result = await authService.login(email, password, {
      remember_me,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );
    }

    // Check if 2FA is required
    if (result.requires2FA) {
      return successResponse(res, {
        requires2FA: true,
        tempToken: result.tempToken,
        message: 'Two-factor authentication required',
      }, 'Two-factor authentication required');
    }

    // Format user object for frontend
    const user = {
      id: result.user.admin_id || result.user.id,
      adminId: result.user.admin_id || result.user.id,
      username: result.user.username,
      email: result.user.email,
      fullName: result.user.full_name || result.user.fullName,
      role: result.user.role,
      permissions: result.user.permissions || [],
      avatar: result.user.avatar || null,
      status: result.user.status || 'active',
    };

    // Return standardized response
    return successResponse(res, {
      user: user,
      token: result.token,           // Access token
      accessToken: result.token,     // Alias for frontend compatibility
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Logout
 */
const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const adminId = req.admin?.adminId;

    if (token && adminId) {
      await authService.logout(adminId, token);
    }

    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: refreshTokenValue } = req.body;

    if (!refreshTokenValue) {
      return errorResponse(
        res,
        'Refresh token is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await authService.refreshToken(refreshTokenValue);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTH_TOKEN_INVALID
      );
    }

    return successResponse(res, {
      token: result.token,
      accessToken: result.token,     // Alias for frontend compatibility
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current Admin Profile
 */
const getProfile = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const admin = await authService.getProfile(adminId);

    if (!admin) {
      return errorResponse(
        res,
        'Admin not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Format profile for frontend
    const profile = {
      id: admin.admin_id,
      adminId: admin.admin_id,
      username: admin.username,
      email: admin.email,
      fullName: admin.full_name,
      role: admin.role,
      permissions: admin.permissions || [],
      avatar: admin.avatar,
      phoneNumber: admin.phone_number,
      status: admin.status,
      createdAt: admin.created_at,
      lastLogin: admin.last_login,
    };

    return successResponse(res, profile);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Current Admin Profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const { full_name, fullName, email, phone_number, phoneNumber } = req.body;

    const result = await authService.updateProfile(adminId, {
      full_name: full_name || fullName,
      email,
      phone_number: phone_number || phoneNumber,
    });

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Format response for frontend
    const profile = {
      id: result.admin.admin_id,
      adminId: result.admin.admin_id,
      username: result.admin.username,
      email: result.admin.email,
      fullName: result.admin.full_name,
      role: result.admin.role,
      permissions: result.admin.permissions || [],
      avatar: result.admin.avatar,
      phoneNumber: result.admin.phone_number,
      status: result.admin.status,
    };

    return successResponse(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change Password
 */
const changePassword = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const { 
      current_password, currentPassword,
      new_password, newPassword,
      confirm_password, confirmPassword 
    } = req.body;

    const currentPwd = current_password || currentPassword;
    const newPwd = new_password || newPassword;
    const confirmPwd = confirm_password || confirmPassword;

    // Validate required fields
    if (!currentPwd || !newPwd || !confirmPwd) {
      return errorResponse(
        res,
        'All password fields are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if new passwords match
    if (newPwd !== confirmPwd) {
      return errorResponse(
        res,
        'New passwords do not match',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Validate password strength
    if (newPwd.length < 8) {
      return errorResponse(
        res,
        'Password must be at least 8 characters long',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await authService.changePassword(adminId, currentPwd, newPwd);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password - Send Reset Code
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(
        res,
        'Email is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await authService.forgotPassword(email);

    // Always return success to prevent email enumeration
    return successResponse(
      res,
      { email },
      'If an account exists with this email, a reset code has been sent'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Reset Code
 */
const verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return errorResponse(
        res,
        'Email and code are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await authService.verifyResetCode(email, code);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return successResponse(res, {
      resetToken: result.resetToken,
      reset_token: result.resetToken, // Alias for compatibility
    }, 'Code verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password with Code
 */
const resetPassword = async (req, res, next) => {
  try {
    const { 
      email, code, 
      new_password, newPassword,
      confirm_password, confirmPassword 
    } = req.body;

    const newPwd = new_password || newPassword;
    const confirmPwd = confirm_password || confirmPassword;

    // Validate required fields
    if (!email || !code || !newPwd || !confirmPwd) {
      return errorResponse(
        res,
        'All fields are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if passwords match
    if (newPwd !== confirmPwd) {
      return errorResponse(
        res,
        'Passwords do not match',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Validate password strength
    if (newPwd.length < 8) {
      return errorResponse(
        res,
        'Password must be at least 8 characters long',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await authService.resetPassword(email, code, newPwd);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password with Token
 */
const resetPasswordWithToken = async (req, res, next) => {
  try {
    const { 
      reset_token, resetToken,
      new_password, newPassword,
      confirm_password, confirmPassword 
    } = req.body;

    const token = reset_token || resetToken;
    const newPwd = new_password || newPassword;
    const confirmPwd = confirm_password || confirmPassword;

    // Validate required fields
    if (!token || !newPwd || !confirmPwd) {
      return errorResponse(
        res,
        'All fields are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if passwords match
    if (newPwd !== confirmPwd) {
      return errorResponse(
        res,
        'Passwords do not match',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Validate password strength
    if (newPwd.length < 8) {
      return errorResponse(
        res,
        'Password must be at least 8 characters long',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await authService.resetPasswordWithToken(token, newPwd);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Token (Check if token is valid)
 */
const verifyToken = async (req, res, next) => {
  try {
    // If we reach here, token is valid (passed through auth middleware)
    const admin = {
      id: req.admin.adminId,
      adminId: req.admin.adminId,
      username: req.admin.username,
      email: req.admin.email,
      fullName: req.admin.fullName,
      role: req.admin.role,
      permissions: req.admin.permissions,
      avatar: req.admin.avatar,
    };

    return successResponse(res, {
      valid: true,
      admin: admin,
      user: admin, // Alias for frontend compatibility
    }, 'Token is valid');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Login History
 */
const getLoginHistory = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const { page = 1, limit = 10 } = req.query;

    const result = await authService.getLoginHistory(adminId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, result, 'Login history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Active Sessions
 */
const getActiveSessions = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const sessions = await authService.getActiveSessions(adminId);

    return successResponse(res, sessions, 'Active sessions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke Session
 */
const revokeSession = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const { session_id, sessionId } = req.params;

    const result = await authService.revokeSession(adminId, session_id || sessionId);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return successResponse(res, null, 'Session revoked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke All Sessions (except current)
 */
const revokeAllSessions = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const currentToken = req.headers.authorization?.replace('Bearer ', '');

    const result = await authService.revokeAllSessions(adminId, currentToken);

    return successResponse(res, {
      revokedCount: result.revokedCount,
      revoked_count: result.revokedCount, // Alias
    }, 'All other sessions revoked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Enable Two-Factor Authentication
 */
const enableTwoFactor = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const result = await authService.enableTwoFactor(adminId);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return successResponse(res, {
      secret: result.secret,
      qrCode: result.qrCode,
      qr_code: result.qrCode, // Alias
    }, 'Two-factor authentication setup initiated');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Two-Factor Setup
 */
const verifyTwoFactor = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const { code } = req.body;

    if (!code) {
      return errorResponse(
        res,
        'Verification code is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await authService.verifyTwoFactor(adminId, code);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return successResponse(res, {
      backupCodes: result.backupCodes,
      backup_codes: result.backupCodes, // Alias
    }, 'Two-factor authentication enabled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Disable Two-Factor Authentication
 */
const disableTwoFactor = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const { password, code } = req.body;

    if (!password) {
      return errorResponse(
        res,
        'Password is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await authService.disableTwoFactor(adminId, password, code);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return successResponse(res, null, 'Two-factor authentication disabled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Two-Factor Code (during login)
 */
const verifyTwoFactorLogin = async (req, res, next) => {
  try {
    const { temp_token, tempToken, code } = req.body;

    const token = temp_token || tempToken;

    if (!token || !code) {
      return errorResponse(
        res,
        'Temporary token and verification code are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await authService.verifyTwoFactorLogin(token, code);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );
    }

    // Format user object for frontend
    const user = {
      id: result.user.admin_id || result.user.id,
      adminId: result.user.admin_id || result.user.id,
      username: result.user.username,
      email: result.user.email,
      fullName: result.user.full_name || result.user.fullName,
      role: result.user.role,
      permissions: result.user.permissions || [],
      avatar: result.user.avatar || null,
      status: result.user.status || 'active',
    };

    return successResponse(res, {
      user: user,
      token: result.token,
      accessToken: result.token,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Check Admin Permissions
 */
const checkPermissions = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return errorResponse(
        res,
        'Permissions array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await authService.checkPermissions(adminId, permissions);

    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Last Activity
 */
const updateLastActivity = async (req, res, next) => {
  try {
    const adminId = req.admin.adminId;
    await authService.updateLastActivity(adminId);

    return successResponse(res, null, 'Activity updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  resetPasswordWithToken,
  verifyToken,
  getLoginHistory,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLogin,
  checkPermissions,
  updateLastActivity,
};