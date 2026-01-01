/**
 * User Model
 * @module models/user
 *
 * FIXED: Updated to match actual database columns
 * Actual users table columns:
 * - user_id, email, google_id, facebook_id, password_hash, full_name, phone_number,
 * - profile_image, preferred_language, theme_mode, email_verified, verification_code,
 * - reset_code, reset_code_expires, is_active, created_at, updated_at, avatar_url, phone_verified
 */

const { query } = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * User Model - Handles user database operations
 */
class User {
  /**
   * Get all users with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      is_verified,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status === 'active') {
      whereClause += ' AND is_active = 1';
    } else if (status === 'inactive') {
      whereClause += ' AND is_active = 0';
    }

    if (is_verified !== undefined) {
      whereClause += ' AND email_verified = ?';
      params.push(is_verified ? 1 : 0);
    }

    if (date_from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(date_to);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['user_id', 'full_name', 'email', 'is_active', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        user_id,
        full_name,
        email,
        phone_number,
        profile_image,
        is_active,
        email_verified,
        preferred_language,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.user_id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = users.user_id AND payment_status = 'paid') as total_spent
      FROM users
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const users = await query(sql, params);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all users without pagination (for exports/dropdowns)
   */
  static async getAllList(options = {}) {
    const { status } = options;

    let sql = `
      SELECT
        user_id,
        full_name,
        email,
        phone_number,
        is_active
      FROM users
    `;

    const params = [];

    if (status === 'active') {
      sql += ' WHERE is_active = 1';
    } else if (status === 'inactive') {
      sql += ' WHERE is_active = 0';
    }

    sql += ' ORDER BY full_name ASC';

    return await query(sql, params);
  }

  /**
   * Get user by ID
   */
  static async getById(userId) {
    const sql = `
      SELECT
        user_id,
        full_name,
        email,
        phone_number,
        profile_image,
        avatar_url,
        is_active,
        email_verified,
        phone_verified,
        preferred_language,
        theme_mode,
        google_id,
        facebook_id,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.user_id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = users.user_id AND payment_status = 'paid') as total_spent,
        (SELECT COUNT(*) FROM product_reviews WHERE user_id = users.user_id) as review_count,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = users.user_id) as wishlist_count
      FROM users
      WHERE user_id = ?
    `;

    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  /**
   * Get user by email
   */
  static async getByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    return results[0] || null;
  }

  /**
   * Get user with password (for authentication)
   */
  static async getForAuth(email) {
    const sql = `
      SELECT
        user_id,
        email,
        password_hash,
        full_name,
        profile_image,
        is_active,
        email_verified,
        preferred_language
      FROM users
      WHERE email = ?
    `;

    const results = await query(sql, [email]);
    return results[0] || null;
  }

  /**
   * Create a new user
   */
  static async create(data) {
    const {
      email,
      password,
      full_name,
      phone_number,
      profile_image,
      is_active = true,
      email_verified = false,
      preferred_language = 'en',
      theme_mode = 'light',
      google_id,
      facebook_id,
    } = data;

    // Hash password
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const sql = `
      INSERT INTO users (
        email,
        password_hash,
        full_name,
        phone_number,
        profile_image,
        is_active,
        email_verified,
        preferred_language,
        theme_mode,
        google_id,
        facebook_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      email,
      hashedPassword,
      full_name || null,
      phone_number || null,
      profile_image || null,
      is_active ? 1 : 0,
      email_verified ? 1 : 0,
      preferred_language,
      theme_mode,
      google_id || null,
      facebook_id || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update user
   */
  static async update(userId, data) {
    const allowedFields = [
      'email',
      'full_name',
      'phone_number',
      'profile_image',
      'avatar_url',
      'is_active',
      'email_verified',
      'phone_verified',
      'preferred_language',
      'theme_mode',
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getById(userId);
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
    await query(sql, values);

    return await this.getById(userId);
  }

  /**
   * Update password
   */
  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = `
      UPDATE users
      SET password_hash = ?, updated_at = NOW()
      WHERE user_id = ?
    `;

    await query(sql, [hashedPassword, userId]);
    return true;
  }

  /**
   * Verify password
   */
  static async verifyPassword(userId, password) {
    const sql = 'SELECT password_hash FROM users WHERE user_id = ?';
    const results = await query(sql, [userId]);

    if (results.length === 0 || !results[0].password_hash) {
      return false;
    }

    return await bcrypt.compare(password, results[0].password_hash);
  }

  /**
   * Delete user
   */
  static async delete(userId) {
    // Delete related data
    await query('DELETE FROM user_addresses WHERE user_id = ?', [userId]);
    await query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    await query('DELETE FROM wishlist WHERE user_id = ?', [userId]);

    const sql = 'DELETE FROM users WHERE user_id = ?';
    const result = await query(sql, [userId]);
    return result.affectedRows > 0;
  }

  /**
   * Toggle status (active/inactive)
   */
  static async toggleStatus(userId) {
    const user = await this.getById(userId);
    if (!user) return null;

    const newStatus = user.is_active ? 0 : 1;
    const sql = `UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?`;
    await query(sql, [newStatus, userId]);

    return await this.getById(userId);
  }

  /**
   * Update profile image
   */
  static async updateProfileImage(userId, imageUrl) {
    const sql = `
      UPDATE users
      SET profile_image = ?, updated_at = NOW()
      WHERE user_id = ?
    `;

    await query(sql, [imageUrl, userId]);
    return await this.getById(userId);
  }

  /**
   * Verify email
   */
  static async verifyEmail(userId) {
    const sql = `
      UPDATE users
      SET email_verified = 1, verification_code = NULL, updated_at = NOW()
      WHERE user_id = ?
    `;

    await query(sql, [userId]);
    return await this.getById(userId);
  }

  /**
   * Check if email exists
   */
  static async emailExists(email, excludeId = null) {
    let sql = 'SELECT user_id FROM users WHERE email = ?';
    const params = [email];

    if (excludeId) {
      sql += ' AND user_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  // ==================== Social Login ====================

  /**
   * Get user by Google ID
   */
  static async getByGoogleId(googleId) {
    const sql = 'SELECT * FROM users WHERE google_id = ?';
    const results = await query(sql, [googleId]);
    return results[0] || null;
  }

  /**
   * Get user by Facebook ID
   */
  static async getByFacebookId(facebookId) {
    const sql = 'SELECT * FROM users WHERE facebook_id = ?';
    const results = await query(sql, [facebookId]);
    return results[0] || null;
  }

  /**
   * Link Google account
   */
  static async linkGoogle(userId, googleId) {
    const sql = `
      UPDATE users
      SET google_id = ?, updated_at = NOW()
      WHERE user_id = ?
    `;

    await query(sql, [googleId, userId]);
    return await this.getById(userId);
  }

  /**
   * Link Facebook account
   */
  static async linkFacebook(userId, facebookId) {
    const sql = `
      UPDATE users
      SET facebook_id = ?, updated_at = NOW()
      WHERE user_id = ?
    `;

    await query(sql, [facebookId, userId]);
    return await this.getById(userId);
  }

  // ==================== Password Reset ====================

  /**
   * Save password reset code
   */
  static async saveResetCode(userId, code, expiresAt) {
    const sql = `
      UPDATE users
      SET reset_code = ?, reset_code_expires = ?
      WHERE user_id = ?
    `;

    await query(sql, [code, expiresAt, userId]);
  }

  /**
   * Get user by reset code
   */
  static async getByResetCode(code) {
    const sql = `
      SELECT * FROM users
      WHERE reset_code = ? AND reset_code_expires > NOW()
    `;

    const results = await query(sql, [code]);
    return results[0] || null;
  }

  /**
   * Clear reset code
   */
  static async clearResetCode(userId) {
    const sql = `
      UPDATE users
      SET reset_code = NULL, reset_code_expires = NULL
      WHERE user_id = ?
    `;

    await query(sql, [userId]);
  }

  // ==================== Email Verification ====================

  /**
   * Save verification code
   */
  static async saveVerificationCode(userId, code) {
    const sql = `
      UPDATE users
      SET verification_code = ?
      WHERE user_id = ?
    `;

    await query(sql, [code, userId]);
  }

  /**
   * Get user by verification code
   */
  static async getByVerificationCode(code) {
    const sql = 'SELECT * FROM users WHERE verification_code = ?';
    const results = await query(sql, [code]);
    return results[0] || null;
  }

  /**
   * Clear verification code
   */
  static async clearVerificationCode(userId) {
    const sql = `
      UPDATE users
      SET verification_code = NULL
      WHERE user_id = ?
    `;

    await query(sql, [userId]);
  }

  // ==================== Statistics ====================

  /**
   * Get user statistics
   */
  static async getStatistics(options = {}) {
    const { period = 'all' } = options;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = 'AND DATE(created_at) = CURDATE()';
    } else if (period === 'week') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    const sql = `
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified_users,
        SUM(CASE WHEN email_verified = 0 THEN 1 ELSE 0 END) as unverified_users,
        SUM(CASE WHEN google_id IS NOT NULL THEN 1 ELSE 0 END) as google_users,
        SUM(CASE WHEN facebook_id IS NOT NULL THEN 1 ELSE 0 END) as facebook_users,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_registrations,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_registrations
      FROM users
      WHERE 1=1 ${dateFilter}
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get recent users
   */
  static async getRecent(limit = 10) {
    const sql = `
      SELECT
        user_id,
        full_name,
        email,
        profile_image,
        is_active,
        email_verified,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get top customers
   */
  static async getTopCustomers(options = {}) {
    const { limit = 10, date_from, date_to } = options;

    let whereClause = '';
    const params = [];

    if (date_from || date_to) {
      whereClause = 'WHERE ';
      if (date_from) {
        whereClause += 'DATE(o.created_at) >= ?';
        params.push(date_from);
      }
      if (date_to) {
        if (date_from) whereClause += ' AND ';
        whereClause += 'DATE(o.created_at) <= ?';
        params.push(date_to);
      }
    }

    const sql = `
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.profile_image,
        COUNT(o.order_id) as order_count,
        SUM(o.total_amount) as total_spent
      FROM users u
      JOIN orders o ON u.user_id = o.user_id AND o.payment_status = 'paid'
      ${whereClause}
      GROUP BY u.user_id
      ORDER BY total_spent DESC
      LIMIT ?
    `;

    params.push(limit);
    return await query(sql, params);
  }

  /**
   * Get users by status count
   */
  static async getCountByStatus() {
    const sql = `
      SELECT
        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        COUNT(*) as count
      FROM users
      GROUP BY is_active
    `;

    return await query(sql);
  }

  /**
   * Get registration trend
   */
  static async getRegistrationTrend(options = {}) {
    const { date_from, date_to, group_by = 'day' } = options;

    let dateFormat = '%Y-%m-%d';
    if (group_by === 'week') {
      dateFormat = '%Y-%u';
    } else if (group_by === 'month') {
      dateFormat = '%Y-%m';
    }

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date_from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT
        DATE_FORMAT(created_at, '${dateFormat}') as period,
        COUNT(*) as registrations
      FROM users
      ${whereClause}
      GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
      ORDER BY period ASC
    `;

    return await query(sql, params);
  }

  /**
   * Search users
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10 } = options;

    const sql = `
      SELECT
        user_id,
        full_name,
        email,
        phone_number,
        profile_image,
        is_active
      FROM users
      WHERE
        full_name LIKE ? OR
        email LIKE ? OR
        phone_number LIKE ?
      ORDER BY
        CASE
          WHEN full_name LIKE ? THEN 1
          WHEN email LIKE ? THEN 2
          ELSE 3
        END,
        full_name ASC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    const exactTerm = `${searchTerm}%`;
    return await query(sql, [term, term, term, exactTerm, exactTerm, limit]);
  }

  /**
   * Bulk update users
   */
  static async bulkUpdate(userIds, data) {
    if (!userIds || userIds.length === 0) {
      return { updated: 0 };
    }

    const allowedFields = ['is_active', 'email_verified'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    }

    if (updates.length === 0) {
      return { updated: 0 };
    }

    updates.push('updated_at = NOW()');

    const placeholders = userIds.map(() => '?').join(',');
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id IN (${placeholders})`;

    const result = await query(sql, [...values, ...userIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete users
   */
  static async bulkDelete(userIds) {
    if (!userIds || userIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = userIds.map(() => '?').join(',');

    // Delete related data
    await query(`DELETE FROM user_addresses WHERE user_id IN (${placeholders})`, userIds);
    await query(`DELETE FROM cart_items WHERE user_id IN (${placeholders})`, userIds);
    await query(`DELETE FROM wishlist WHERE user_id IN (${placeholders})`, userIds);

    const sql = `DELETE FROM users WHERE user_id IN (${placeholders})`;
    const result = await query(sql, userIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Get all users for export
   */
  static async getAllForExport(options = {}) {
    const { status, date_from, date_to } = options;

    let sql = `
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        u.profile_image,
        u.is_active,
        u.email_verified,
        u.preferred_language,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.user_id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.user_id AND payment_status = 'paid') as total_spent
      FROM users u
      WHERE 1=1
    `;

    const params = [];

    if (status === 'active') {
      sql += ' AND u.is_active = 1';
    } else if (status === 'inactive') {
      sql += ' AND u.is_active = 0';
    }

    if (date_from) {
      sql += ' AND DATE(u.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      sql += ' AND DATE(u.created_at) <= ?';
      params.push(date_to);
    }

    sql += ' ORDER BY u.created_at DESC';

    return await query(sql, params);
  }

  /**
   * Get user with orders summary
   */
  static async getWithOrdersSummary(userId) {
    const user = await this.getById(userId);
    if (!user) return null;

    const ordersSql = `
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        MAX(created_at) as last_order_date
      FROM orders
      WHERE user_id = ?
    `;

    const ordersSummary = await query(ordersSql, [userId]);
    user.orders_summary = ordersSummary[0];

    return user;
  }

  /**
   * Get count
   */
  static async getCount(options = {}) {
    const { status } = options;

    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];

    if (status === 'active') {
      sql += ' AND is_active = 1';
    } else if (status === 'inactive') {
      sql += ' AND is_active = 0';
    }

    const results = await query(sql, params);
    return results[0].count;
  }

  /**
   * Get today's user registration count
   */
  static async getTodayCount() {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()';
    const results = await query(sql);
    return results[0].count;
  }

  /**
   * Get active users count
   */
  static async getActiveCount() {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE is_active = 1';
    const results = await query(sql);
    return results[0].count;
  }
}

module.exports = User;
