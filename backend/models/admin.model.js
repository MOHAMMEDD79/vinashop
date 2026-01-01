/**
 * Admin Model
 * @module models/admin
 */

const { query } = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * Admin Model
 */
class Admin {
  /**
   * Get all admins with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      whereClause += ' AND is_active = ?';
      params.push(status === 'active' ? 1 : 0);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM admin_users ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['admin_id', 'username', 'email', 'role', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        admin_id,
        username,
        email,
        full_name,
        role,
        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        created_at,
        updated_at
      FROM admin_users
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const admins = await query(sql, params);

    // Add empty permissions array
    admins.forEach(admin => {
      admin.permissions = [];
    });

    return {
      data: admins,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get admin by ID
   */
  static async getById(adminId) {
    const sql = `
      SELECT
        admin_id,
        username,
        email,
        full_name,
        role,
        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        created_at,
        updated_at
      FROM admin_users
      WHERE admin_id = ?
    `;

    const results = await query(sql, [adminId]);
    const admin = results[0] || null;

    if (admin) {
      admin.permissions = [];
    }

    return admin;
  }

  /**
   * Get admin by email
   */
  static async getByEmail(email) {
    const sql = `
      SELECT
        admin_id,
        username,
        email,
        password_hash as password,
        full_name,
        role,
        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        created_at,
        updated_at
      FROM admin_users
      WHERE email = ?
    `;

    const results = await query(sql, [email]);
    const admin = results[0] || null;

    if (admin) {
      admin.permissions = [];
    }

    return admin;
  }

  /**
   * Get admin for authentication (includes password)
   * ADDED: Required by auth.service.js
   */
  static async getForAuth(email) {
    return await this.getByEmail(email);
  }

  /**
   * Get admin by username
   */
  static async getByUsername(username) {
    const sql = `
      SELECT
        admin_id,
        username,
        email,
        password_hash as password,
        full_name,
        role,
        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        created_at,
        updated_at
      FROM admin_users
      WHERE username = ?
    `;

    const results = await query(sql, [username]);
    const admin = results[0] || null;
    if (admin) {
      admin.permissions = [];
    }
    return admin;
  }

  /**
   * Create a new admin
   */
  static async create(data) {
    const {
      username,
      email,
      password,
      full_name,
      first_name,
      last_name,
      role = 'admin',
      status = 'active',
    } = data;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Build full_name from first_name + last_name if not provided
    const finalFullName = full_name || [first_name, last_name].filter(Boolean).join(' ') || username;

    const sql = `
      INSERT INTO admin_users (
        username,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      username,
      email,
      hashedPassword,
      finalFullName,
      role,
      status === 'active' ? 1 : 0,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update an admin
   */
  static async update(adminId, data) {
    const updates = [];
    const values = [];

    // Map allowed fields to their database column names
    const fieldMapping = {
      'username': 'username',
      'email': 'email',
      'full_name': 'full_name',
      'role': 'role',
      'status': 'is_active',
    };

    for (const [key, value] of Object.entries(data)) {
      if (fieldMapping[key] && value !== undefined) {
        const dbColumn = fieldMapping[key];
        if (dbColumn === 'is_active') {
          updates.push(`${dbColumn} = ?`);
          values.push(value === 'active' ? 1 : 0);
        } else {
          updates.push(`${dbColumn} = ?`);
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getById(adminId);
    }

    updates.push('updated_at = NOW()');
    values.push(adminId);

    const sql = `
      UPDATE admin_users
      SET ${updates.join(', ')}
      WHERE admin_id = ?
    `;

    await query(sql, values);
    return await this.getById(adminId);
  }

  /**
   * Update password
   */
  static async updatePassword(adminId, newPassword) {
    const hashedPassword = typeof newPassword === 'string' && newPassword.startsWith('$2')
      ? newPassword
      : await bcrypt.hash(newPassword, 12);

    const sql = `
      UPDATE admin_users
      SET password_hash = ?, password_changed_at = NOW(), updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [hashedPassword, adminId]);
    return true;
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Delete an admin
   */
  static async delete(adminId) {
    const sql = 'DELETE FROM admin_users WHERE admin_id = ?';
    const result = await query(sql, [adminId]);
    return result.affectedRows > 0;
  }

  /**
   * Update login info
   */
  static async updateLoginInfo(adminId) {
    const sql = `
      UPDATE admin_users 
      SET 
        last_login = NOW(),
        login_count = COALESCE(login_count, 0) + 1,
        updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [adminId]);
  }

  /**
   * Update last activity
   */
  static async updateLastActivity(adminId) {
    const sql = `
      UPDATE admin_users 
      SET last_activity = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [adminId]);
  }

  /**
   * Toggle status
   */
  static async toggleStatus(adminId) {
    const admin = await this.getById(adminId);
    if (!admin) {
      return null;
    }

    const newIsActive = admin.status === 'active' ? 0 : 1;

    const sql = `
      UPDATE admin_users
      SET is_active = ?, updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [newIsActive, adminId]);
    return await this.getById(adminId);
  }

  /**
   * Update profile image
   */
  static async updateProfileImage(adminId, imagePath) {
    const sql = `
      UPDATE admin_users 
      SET profile_image = ?, updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [imagePath, adminId]);
    return await this.getById(adminId);
  }

  /**
   * Set two-factor authentication
   */
  static async setTwoFactor(adminId, secret, enabled = false) {
    const sql = `
      UPDATE admin_users 
      SET 
        two_factor_secret = ?,
        two_factor_enabled = ?,
        updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [secret, enabled ? 1 : 0, adminId]);
    return await this.getById(adminId);
  }

  /**
   * Enable two-factor authentication
   */
  static async enableTwoFactor(adminId) {
    const sql = `
      UPDATE admin_users 
      SET two_factor_enabled = 1, updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [adminId]);
    return await this.getById(adminId);
  }

  /**
   * Disable two-factor authentication
   */
  static async disableTwoFactor(adminId) {
    const sql = `
      UPDATE admin_users 
      SET 
        two_factor_enabled = 0,
        two_factor_secret = NULL,
        updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [adminId]);
    return await this.getById(adminId);
  }

  /**
   * Get admin permissions
   */
  static async getPermissions(adminId) {
    const admin = await this.getById(adminId);
    if (!admin) {
      return [];
    }

    return admin.permissions || [];
  }

  /**
   * Update permissions
   */
  static async updatePermissions(adminId, permissions) {
    const sql = `
      UPDATE admin_users 
      SET permissions = ?, updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [JSON.stringify(permissions), adminId]);
    return await this.getById(adminId);
  }

  /**
   * Check if admin has permission
   */
  static async hasPermission(adminId, permission) {
    const admin = await this.getById(adminId);
    if (!admin) {
      return false;
    }

    // Super admin has all permissions
    if (admin.role === 'super_admin') {
      return true;
    }

    return admin.permissions && admin.permissions.includes(permission);
  }

  /**
   * Get admins by role
   */
  static async getByRole(role) {
    const sql = `
      SELECT 
        admin_id,
        username,
        email,
        first_name,
        last_name,
        profile_image,
        role,
        status,
        created_at
      FROM admin_users
      WHERE role = ? AND status = 'active'
      ORDER BY username ASC
    `;

    return await query(sql, [role]);
  }

  /**
   * Get all super admins
   */
  static async getSuperAdmins() {
    return await this.getByRole('super_admin');
  }

  /**
   * Count admins by role
   */
  static async countByRole(role) {
    const sql = 'SELECT COUNT(*) as count FROM admin_users WHERE role = ?';
    const results = await query(sql, [role]);
    return results[0].count;
  }

  /**
   * Count active admins
   */
  static async countActive() {
    const sql = "SELECT COUNT(*) as count FROM admin_users WHERE status = 'active'";
    const results = await query(sql);
    return results[0].count;
  }

  /**
   * Get admin statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_admins,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_admins,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_admins,
        SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'moderator' THEN 1 ELSE 0 END) as moderators,
        SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees,
        SUM(CASE WHEN two_factor_enabled = 1 THEN 1 ELSE 0 END) as two_factor_enabled,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as created_today,
        SUM(CASE WHEN DATE(last_login) = CURDATE() THEN 1 ELSE 0 END) as logged_in_today
      FROM admin_users
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get recently active admins
   */
  static async getRecentlyActive(limit = 10) {
    const sql = `
      SELECT 
        admin_id,
        username,
        email,
        first_name,
        last_name,
        profile_image,
        role,
        last_activity,
        last_login
      FROM admin_users
      WHERE status = 'active' AND last_activity IS NOT NULL
      ORDER BY last_activity DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Search admins
   */
  static async search(searchTerm, limit = 10) {
    const sql = `
      SELECT 
        admin_id,
        username,
        email,
        first_name,
        last_name,
        profile_image,
        role,
        status
      FROM admin_users
      WHERE 
        username LIKE ? OR
        email LIKE ? OR
        first_name LIKE ? OR
        last_name LIKE ?
      ORDER BY username ASC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, term, limit]);
  }

  /**
   * Check if email exists
   */
  static async emailExists(email, excludeId = null) {
    let sql = 'SELECT admin_id FROM admin_users WHERE email = ?';
    const params = [email];

    if (excludeId) {
      sql += ' AND admin_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username, excludeId = null) {
    let sql = 'SELECT admin_id FROM admin_users WHERE username = ?';
    const params = [username];

    if (excludeId) {
      sql += ' AND admin_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Save password reset token
   */
  static async saveResetToken(adminId, token, expiresAt) {
    const sql = `
      UPDATE admin_users 
      SET 
        reset_token = ?,
        reset_token_expires = ?,
        updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [token, expiresAt, adminId]);
  }

  /**
   * Get admin by reset token
   */
  static async getByResetToken(token) {
    const sql = `
      SELECT 
        admin_id,
        username,
        email,
        reset_token_expires
      FROM admin_users
      WHERE reset_token = ? AND reset_token_expires > NOW()
    `;

    const results = await query(sql, [token]);
    return results[0] || null;
  }

  /**
   * Clear reset token
   */
  static async clearResetToken(adminId) {
    const sql = `
      UPDATE admin_users 
      SET 
        reset_token = NULL,
        reset_token_expires = NULL,
        updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [adminId]);
  }

  /**
   * Bulk update admins
   */
  static async bulkUpdate(adminIds, data) {
    if (!adminIds || adminIds.length === 0) {
      return { updated: 0 };
    }

    const allowedFields = ['status', 'role'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return { updated: 0 };
    }

    updates.push('updated_at = NOW()');

    const placeholders = adminIds.map(() => '?').join(',');
    const sql = `
      UPDATE admin_users 
      SET ${updates.join(', ')}
      WHERE admin_id IN (${placeholders})
    `;

    const result = await query(sql, [...values, ...adminIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete admins
   */
  static async bulkDelete(adminIds) {
    if (!adminIds || adminIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = adminIds.map(() => '?').join(',');
    const sql = `DELETE FROM admin_users WHERE admin_id IN (${placeholders})`;
    const result = await query(sql, adminIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Get admin activity log
   */
  static async getActivityLog(adminId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM admin_activity_logs WHERE admin_id = ?';
    const countResult = await query(countSql, [adminId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        id,
        action,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        request_data,
        created_at
      FROM admin_activity_logs
      WHERE admin_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const logs = await query(sql, [adminId, limit, offset]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Log admin action
   */
  static async logAction(data) {
    const {
      admin_id,
      action,
      resource_type,
      resource_id,
      ip_address,
      user_agent,
      request_data,
    } = data;

    const sql = `
      INSERT INTO admin_activity_logs (
        admin_id,
        action,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        request_data,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await query(sql, [
      admin_id,
      action,
      resource_type || null,
      resource_id || null,
      ip_address || null,
      user_agent || null,
      request_data ? JSON.stringify(request_data) : null,
    ]);
  }
}

module.exports = Admin;