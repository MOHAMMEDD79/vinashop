/**
 * Auth Model
 * @module models/auth
 */

const { query } = require('../config/database');
const crypto = require('crypto');

/**
 * Auth Model - Handles sessions, tokens, and login attempts
 */
class Auth {
  // ==================== Sessions ====================

  /**
   * Create a new session
   */
  static async createSession(data) {
    const {
      admin_id,
      token,
      refresh_token,
      ip_address,
      user_agent,
      device_info,
      expires_at,
    } = data;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const refreshTokenHash = refresh_token 
      ? crypto.createHash('sha256').update(refresh_token).digest('hex')
      : null;

    const sql = `
      INSERT INTO admin_sessions (
        admin_id,
        token_hash,
        refresh_token_hash,
        ip_address,
        user_agent,
        device_info,
        is_active,
        expires_at,
        last_activity,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      admin_id,
      tokenHash,
      refreshTokenHash,
      ip_address || null,
      user_agent || null,
      device_info ? JSON.stringify(device_info) : null,
      expires_at,
    ]);

    return {
      session_id: result.insertId,
      token_hash: tokenHash,
    };
  }

  /**
   * Get session by token hash
   */
  static async getSessionByToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const sql = `
      SELECT 
        s.*,
        a.username,
        a.email,
        a.role,
        a.status as admin_status
      FROM admin_sessions s
      JOIN admin_users a ON s.admin_id = a.admin_id
      WHERE s.token_hash = ? AND s.is_active = 1 AND s.expires_at > NOW()
    `;

    const results = await query(sql, [tokenHash]);
    return results[0] || null;
  }

  /**
   * Get session by refresh token
   */
  static async getSessionByRefreshToken(refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const sql = `
      SELECT 
        s.*,
        a.username,
        a.email,
        a.role,
        a.status as admin_status
      FROM admin_sessions s
      JOIN admin_users a ON s.admin_id = a.admin_id
      WHERE s.refresh_token_hash = ? AND s.is_active = 1
    `;

    const results = await query(sql, [tokenHash]);
    return results[0] || null;
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity(sessionId) {
    const sql = `
      UPDATE admin_sessions 
      SET last_activity = NOW()
      WHERE id = ?
    `;

    await query(sql, [sessionId]);
  }

  /**
   * Update session token
   */
  static async updateSessionToken(sessionId, newToken, expiresAt) {
    const tokenHash = crypto.createHash('sha256').update(newToken).digest('hex');

    const sql = `
      UPDATE admin_sessions 
      SET token_hash = ?, expires_at = ?, last_activity = NOW()
      WHERE id = ?
    `;

    await query(sql, [tokenHash, expiresAt, sessionId]);
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(sessionId) {
    const sql = `
      UPDATE admin_sessions 
      SET is_active = 0
      WHERE id = ?
    `;

    await query(sql, [sessionId]);
  }

  /**
   * Invalidate session by token
   */
  static async invalidateSessionByToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const sql = `
      UPDATE admin_sessions 
      SET is_active = 0
      WHERE token_hash = ?
    `;

    const result = await query(sql, [tokenHash]);
    return result.affectedRows > 0;
  }

  /**
   * Invalidate all sessions for admin
   */
  static async invalidateAllSessions(adminId, exceptSessionId = null) {
    let sql = 'UPDATE admin_sessions SET is_active = 0 WHERE admin_id = ?';
    const params = [adminId];

    if (exceptSessionId) {
      sql += ' AND id != ?';
      params.push(exceptSessionId);
    }

    const result = await query(sql, params);
    return result.affectedRows;
  }

  /**
   * Get active sessions for admin
   */
  static async getActiveSessions(adminId) {
    const sql = `
      SELECT 
        id,
        ip_address,
        user_agent,
        device_info,
        last_activity,
        created_at,
        expires_at
      FROM admin_sessions
      WHERE admin_id = ? AND is_active = 1 AND expires_at > NOW()
      ORDER BY last_activity DESC
    `;

    const sessions = await query(sql, [adminId]);

    // Parse device_info JSON
    sessions.forEach(session => {
      if (session.device_info) {
        try {
          session.device_info = JSON.parse(session.device_info);
        } catch (e) {
          session.device_info = null;
        }
      }
    });

    return sessions;
  }

  /**
   * Count active sessions for admin
   */
  static async countActiveSessions(adminId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM admin_sessions 
      WHERE admin_id = ? AND is_active = 1 AND expires_at > NOW()
    `;

    const results = await query(sql, [adminId]);
    return results[0].count;
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions() {
    const sql = `
      DELETE FROM admin_sessions 
      WHERE expires_at < NOW() OR (is_active = 0 AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY))
    `;

    const result = await query(sql);
    return result.affectedRows;
  }

  // ==================== Login Attempts ====================

  /**
   * Record login attempt
   */
  static async recordLoginAttempt(data) {
    const {
      email,
      ip_address,
      user_agent,
      success,
      admin_id,
      failure_reason,
    } = data;

    const sql = `
      INSERT INTO login_attempts (
        email,
        ip_address,
        user_agent,
        success,
        admin_id,
        failure_reason,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      email,
      ip_address || null,
      user_agent || null,
      success ? 1 : 0,
      admin_id || null,
      failure_reason || null,
    ]);

    return result.insertId;
  }

  /**
   * Get failed login attempts count
   */
  static async getFailedAttempts(email, ipAddress, windowMinutes = 30) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM login_attempts 
      WHERE (email = ? OR ip_address = ?) 
        AND success = 0 
        AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `;

    const results = await query(sql, [email, ipAddress, windowMinutes]);
    return results[0].count;
  }

  /**
   * Get recent login attempts for admin
   */
  static async getLoginHistory(adminId, limit = 20) {
    const sql = `
      SELECT 
        id,
        email,
        ip_address,
        user_agent,
        success,
        failure_reason,
        created_at
      FROM login_attempts
      WHERE admin_id = ? OR email = (SELECT email FROM admin_users WHERE admin_id = ?)
      ORDER BY created_at DESC
      LIMIT ?
    `;

    return await query(sql, [adminId, adminId, limit]);
  }

  /**
   * Get login attempts by IP
   */
  static async getAttemptsByIp(ipAddress, limit = 50) {
    const sql = `
      SELECT 
        id,
        email,
        ip_address,
        user_agent,
        success,
        failure_reason,
        created_at
      FROM login_attempts
      WHERE ip_address = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    return await query(sql, [ipAddress, limit]);
  }

  /**
   * Check if IP is blocked
   */
  static async isIpBlocked(ipAddress) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM blocked_ips 
      WHERE ip_address = ? AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const results = await query(sql, [ipAddress]);
    return results[0].count > 0;
  }

  /**
   * Block IP address
   */
  static async blockIp(ipAddress, reason, expiresAt = null, blockedBy = null) {
    const sql = `
      INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        reason = VALUES(reason),
        blocked_by = VALUES(blocked_by),
        expires_at = VALUES(expires_at)
    `;

    await query(sql, [ipAddress, reason, blockedBy, expiresAt]);
  }

  /**
   * Unblock IP address
   */
  static async unblockIp(ipAddress) {
    const sql = 'DELETE FROM blocked_ips WHERE ip_address = ?';
    const result = await query(sql, [ipAddress]);
    return result.affectedRows > 0;
  }

  /**
   * Get blocked IPs
   */
  static async getBlockedIps() {
    const sql = `
      SELECT 
        id,
        ip_address,
        reason,
        blocked_by,
        expires_at,
        created_at
      FROM blocked_ips
      WHERE expires_at IS NULL OR expires_at > NOW()
      ORDER BY created_at DESC
    `;

    return await query(sql);
  }

  /**
   * Clean up old login attempts
   */
  static async cleanupLoginAttempts(daysToKeep = 30) {
    const sql = `
      DELETE FROM login_attempts 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const result = await query(sql, [daysToKeep]);
    return result.affectedRows;
  }

  // ==================== Password Reset ====================

  /**
   * Create password reset token
   */
  static async createPasswordResetToken(adminId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const sql = `
      INSERT INTO password_resets (admin_id, email, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    await query(sql, [adminId, email, tokenHash, expiresAt]);

    return token; // Return unhashed token for email
  }

  /**
   * Verify password reset token
   */
  static async verifyPasswordResetToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const sql = `
      SELECT 
        pr.*,
        a.username,
        a.email as admin_email,
        a.status
      FROM password_resets pr
      JOIN admin_users a ON pr.admin_id = a.admin_id
      WHERE pr.token_hash = ? AND pr.expires_at > NOW() AND pr.used_at IS NULL
    `;

    const results = await query(sql, [tokenHash]);
    return results[0] || null;
  }

  /**
   * Mark password reset token as used
   */
  static async markPasswordResetUsed(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const sql = `
      UPDATE password_resets 
      SET used_at = NOW()
      WHERE token_hash = ?
    `;

    await query(sql, [tokenHash]);
  }

  /**
   * Clean up expired password reset tokens
   */
  static async cleanupPasswordResets() {
    const sql = `
      DELETE FROM password_resets 
      WHERE expires_at < NOW() OR used_at IS NOT NULL
    `;

    const result = await query(sql);
    return result.affectedRows;
  }

  // ==================== Two-Factor Authentication ====================

  /**
   * Store 2FA backup codes
   */
  static async storeBackupCodes(adminId, codes) {
    // Delete existing codes
    await query('DELETE FROM two_factor_backup_codes WHERE admin_id = ?', [adminId]);

    // Insert new codes
    const sql = `
      INSERT INTO two_factor_backup_codes (admin_id, code_hash, created_at)
      VALUES (?, ?, NOW())
    `;

    for (const code of codes) {
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      await query(sql, [adminId, codeHash]);
    }
  }

  /**
   * Verify and use backup code
   */
  static async verifyBackupCode(adminId, code) {
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    const sql = `
      SELECT id FROM two_factor_backup_codes 
      WHERE admin_id = ? AND code_hash = ? AND used_at IS NULL
    `;

    const results = await query(sql, [adminId, codeHash]);

    if (results.length === 0) {
      return false;
    }

    // Mark code as used
    await query(
      'UPDATE two_factor_backup_codes SET used_at = NOW() WHERE id = ?',
      [results[0].id]
    );

    return true;
  }

  /**
   * Get remaining backup codes count
   */
  static async getRemainingBackupCodesCount(adminId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM two_factor_backup_codes 
      WHERE admin_id = ? AND used_at IS NULL
    `;

    const results = await query(sql, [adminId]);
    return results[0].count;
  }

  /**
   * Store temporary 2FA token (for login flow)
   */
  static async storeTempTwoFactorToken(adminId, token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const sql = `
      INSERT INTO temp_two_factor_tokens (admin_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        token_hash = VALUES(token_hash),
        expires_at = VALUES(expires_at)
    `;

    await query(sql, [adminId, tokenHash, expiresAt]);
    return token;
  }

  /**
   * Verify temporary 2FA token
   */
  static async verifyTempTwoFactorToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const sql = `
      SELECT 
        t.*,
        a.username,
        a.email,
        a.role,
        a.two_factor_secret
      FROM temp_two_factor_tokens t
      JOIN admin_users a ON t.admin_id = a.admin_id
      WHERE t.token_hash = ? AND t.expires_at > NOW()
    `;

    const results = await query(sql, [tokenHash]);
    return results[0] || null;
  }

  /**
   * Delete temporary 2FA token
   */
  static async deleteTempTwoFactorToken(adminId) {
    const sql = 'DELETE FROM temp_two_factor_tokens WHERE admin_id = ?';
    await query(sql, [adminId]);
  }

  // ==================== API Keys ====================

  /**
   * Create API key
   */
  static async createApiKey(data) {
    const {
      name,
      permissions,
      created_by,
      expires_at,
    } = data;

    const apiKey = `tsa_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const sql = `
      INSERT INTO api_keys (
        name,
        api_key_hash,
        api_key_prefix,
        permissions,
        created_by,
        expires_at,
        is_active,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
    `;

    const result = await query(sql, [
      name,
      keyHash,
      apiKey.substring(0, 12), // Store prefix for identification
      permissions ? JSON.stringify(permissions) : null,
      created_by,
      expires_at || null,
    ]);

    return {
      id: result.insertId,
      api_key: apiKey, // Return full key only on creation
      prefix: apiKey.substring(0, 12),
    };
  }

  /**
   * Verify API key
   */
  static async verifyApiKey(apiKey) {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const sql = `
      SELECT 
        id,
        name,
        permissions,
        created_by,
        expires_at,
        last_used_at,
        usage_count
      FROM api_keys
      WHERE api_key_hash = ? AND is_active = 1 
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const results = await query(sql, [keyHash]);
    const key = results[0] || null;

    if (key && key.permissions) {
      try {
        key.permissions = JSON.parse(key.permissions);
      } catch (e) {
        key.permissions = [];
      }
    }

    return key;
  }

  /**
   * Update API key usage
   */
  static async updateApiKeyUsage(keyId) {
    const sql = `
      UPDATE api_keys 
      SET last_used_at = NOW(), usage_count = usage_count + 1
      WHERE id = ?
    `;

    await query(sql, [keyId]);
  }

  /**
   * Revoke API key
   */
  static async revokeApiKey(keyId) {
    const sql = 'UPDATE api_keys SET is_active = 0 WHERE id = ?';
    const result = await query(sql, [keyId]);
    return result.affectedRows > 0;
  }

  /**
   * Get all API keys
   */
  static async getApiKeys() {
    const sql = `
      SELECT 
        id,
        name,
        api_key_prefix,
        permissions,
        created_by,
        expires_at,
        is_active,
        last_used_at,
        usage_count,
        created_at
      FROM api_keys
      ORDER BY created_at DESC
    `;

    const keys = await query(sql);

    keys.forEach(key => {
      if (key.permissions) {
        try {
          key.permissions = JSON.parse(key.permissions);
        } catch (e) {
          key.permissions = [];
        }
      }
    });

    return keys;
  }

  // ==================== Statistics ====================

  /**
   * Get authentication statistics
   */
  static async getStatistics() {
    const sessionStats = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN is_active = 1 AND expires_at > NOW() THEN 1 ELSE 0 END) as active_sessions,
        COUNT(DISTINCT admin_id) as unique_admins
      FROM admin_sessions
    `);

    const attemptStats = await query(`
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_logins,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_logins,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_attempts
      FROM login_attempts
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const blockedStats = await query(`
      SELECT COUNT(*) as blocked_ips
      FROM blocked_ips
      WHERE expires_at IS NULL OR expires_at > NOW()
    `);

    return {
      sessions: sessionStats[0],
      login_attempts: attemptStats[0],
      blocked_ips: blockedStats[0].blocked_ips,
    };
  }
}

module.exports = Auth;