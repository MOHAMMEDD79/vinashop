/**
 * Auth Service
 * @module services/auth
 *
 * FIXED: Simplified to work with existing database schema
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin.model');
const { config: jwtConfig } = require('../config/jwt');

// Map JWT config structure for compatibility
const jwtSettings = {
  secret: jwtConfig.accessToken.secret,
  refreshSecret: jwtConfig.refreshToken.secret,
  expiresIn: jwtConfig.accessToken.expiresIn,
  refreshExpiresIn: jwtConfig.refreshToken.expiresIn,
};

class AuthService {
  /**
   * Login admin
   */
  static async login(email, password, options = {}) {
    try {
      // Get admin with password
      const admin = await Admin.getForAuth(email);

      if (!admin) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if account is active
      if (admin.status !== 'active') {
        return {
          success: false,
          message: 'Account is not active',
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password);

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Update login info
      try {
        await Admin.updateLoginInfo(admin.admin_id);
      } catch (e) {
        // Ignore if updateLoginInfo fails
        console.error('updateLoginInfo failed:', e.message);
      }

      // Generate tokens
      const tokens = this.generateTokens(admin);

      return {
        success: true,
        requires2FA: false,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: this.sanitizeAdmin(admin),
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  /**
   * Logout admin
   */
  static async logout(adminId, token) {
    // In a simple setup, we don't track sessions
    // Just return success
    return { success: true };
  }

  /**
   * Refresh token
   */
  static async refreshToken(refreshTokenValue) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshTokenValue, jwtSettings.refreshSecret || jwtSettings.secret);

      // Get admin
      const admin = await Admin.getById(decoded.adminId || decoded.id);

      if (!admin) {
        return {
          success: false,
          message: 'Admin not found',
        };
      }

      if (admin.status !== 'active') {
        return {
          success: false,
          message: 'Account is not active',
        };
      }

      // Generate new tokens
      const tokens = this.generateTokens(admin);

      return {
        success: true,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Invalid or expired refresh token',
      };
    }
  }

  /**
   * Get admin profile
   */
  static async getProfile(adminId) {
    const admin = await Admin.getById(adminId);
    return admin ? this.sanitizeAdmin(admin) : null;
  }

  /**
   * Change password
   */
  static async changePassword(adminId, currentPassword, newPassword) {
    try {
      const admin = await Admin.getByIdWithPassword(adminId);

      if (!admin) {
        return { success: false, message: 'Admin not found' };
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, admin.password);

      if (!isValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await Admin.updatePassword(adminId, hashedPassword);

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate access and refresh tokens
   */
  static generateTokens(admin) {
    const payload = {
      id: admin.admin_id,
      adminId: admin.admin_id,
      email: admin.email,
      role: admin.role,
      type: 'access',
    };

    const refreshPayload = {
      id: admin.admin_id,
      adminId: admin.admin_id,
      email: admin.email,
      role: admin.role,
      type: 'refresh',
    };

    const accessToken = jwt.sign(
      payload,
      jwtSettings.secret,
      {
        expiresIn: jwtSettings.expiresIn || '7d',
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      jwtSettings.refreshSecret || jwtSettings.secret,
      {
        expiresIn: jwtSettings.refreshExpiresIn || '30d',
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: jwtSettings.expiresIn || '7d',
    };
  }

  /**
   * Verify access token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, jwtSettings.secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove sensitive data from admin object
   */
  static sanitizeAdmin(admin) {
    const {
      password,
      password_hash,
      two_factor_secret,
      reset_token,
      reset_token_expires,
      verification_token,
      ...sanitized
    } = admin;

    return {
      admin_id: sanitized.admin_id,
      id: sanitized.admin_id,
      username: sanitized.username,
      email: sanitized.email,
      full_name: sanitized.full_name,
      fullName: sanitized.full_name,
      first_name: sanitized.first_name,
      firstName: sanitized.first_name,
      last_name: sanitized.last_name,
      lastName: sanitized.last_name,
      role: sanitized.role,
      status: sanitized.status,
      avatar: sanitized.profile_image || sanitized.avatar,
      permissions: sanitized.permissions || [],
      created_at: sanitized.created_at,
      updated_at: sanitized.updated_at,
    };
  }
}

module.exports = AuthService;
