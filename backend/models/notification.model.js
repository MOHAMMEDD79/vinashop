/**
 * Notification Model
 * @module models/notification
 */

const { query } = require('../config/database');

/**
 * Notification Model - Handles notifications for users and admins
 */
class Notification {
  // ==================== User Notifications ====================

  /**
   * Get all notifications for a user
   */
  static async getByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      is_read,
      type,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [userId];
    let whereClause = 'WHERE user_id = ?';

    if (is_read !== undefined) {
      whereClause += ' AND is_read = ?';
      params.push(is_read ? 1 : 0);
    }

    if (type) {
      whereClause += ' AND notification_type = ?';
      params.push(type);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM user_notifications ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['notification_id', 'notification_type', 'is_read', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        notification_id,
        user_id,
        notification_type,
        title,
        message,
        data,
        link_url,
        is_read,
        read_at,
        created_at
      FROM user_notifications
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const notifications = await query(sql, params);

    // Parse data JSON
    notifications.forEach(notification => {
      if (notification.data) {
        try {
          notification.data = JSON.parse(notification.data);
        } catch (e) {
          notification.data = null;
        }
      }
    });

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get notification by ID
   */
  static async getById(notificationId) {
    const sql = `
      SELECT 
        notification_id,
        user_id,
        notification_type,
        title,
        message,
        data,
        link_url,
        is_read,
        read_at,
        created_at
      FROM user_notifications
      WHERE notification_id = ?
    `;

    const results = await query(sql, [notificationId]);
    const notification = results[0] || null;

    if (notification && notification.data) {
      try {
        notification.data = JSON.parse(notification.data);
      } catch (e) {
        notification.data = null;
      }
    }

    return notification;
  }

  /**
   * Create user notification
   */
  static async create(data) {
    const {
      user_id,
      notification_type = 'general',
      title,
      message,
      data: notificationData,
      link_url,
    } = data;

    const sql = `
      INSERT INTO user_notifications (
        user_id,
        notification_type,
        title,
        message,
        data,
        link_url,
        is_read,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
    `;

    const result = await query(sql, [
      user_id,
      notification_type,
      title,
      message,
      notificationData ? JSON.stringify(notificationData) : null,
      link_url || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Create notification for multiple users
   */
  static async createForMultipleUsers(userIds, notificationData) {
    const created = [];

    for (const userId of userIds) {
      const notification = await this.create({
        ...notificationData,
        user_id: userId,
      });
      created.push(notification);
    }

    return created;
  }

  /**
   * Create notification for all users
   */
  static async createForAllUsers(notificationData) {
    const usersSql = 'SELECT user_id FROM users WHERE status = "active"';
    const users = await query(usersSql);
    const userIds = users.map(u => u.user_id);

    return await this.createForMultipleUsers(userIds, notificationData);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    const sql = `
      UPDATE user_notifications 
      SET is_read = 1, read_at = NOW()
      WHERE notification_id = ?
    `;

    await query(sql, [notificationId]);
    return await this.getById(notificationId);
  }

  /**
   * Mark notification as unread
   */
  static async markAsUnread(notificationId) {
    const sql = `
      UPDATE user_notifications 
      SET is_read = 0, read_at = NULL
      WHERE notification_id = ?
    `;

    await query(sql, [notificationId]);
    return await this.getById(notificationId);
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    const sql = `
      UPDATE user_notifications 
      SET is_read = 1, read_at = NOW()
      WHERE user_id = ? AND is_read = 0
    `;

    const result = await query(sql, [userId]);
    return { updated: result.affectedRows };
  }

  /**
   * Delete notification
   */
  static async delete(notificationId) {
    const sql = 'DELETE FROM user_notifications WHERE notification_id = ?';
    const result = await query(sql, [notificationId]);
    return result.affectedRows > 0;
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllForUser(userId) {
    const sql = 'DELETE FROM user_notifications WHERE user_id = ?';
    const result = await query(sql, [userId]);
    return { deleted: result.affectedRows };
  }

  /**
   * Delete read notifications older than specified days
   */
  static async deleteOldReadNotifications(userId, daysOld = 30) {
    const sql = `
      DELETE FROM user_notifications 
      WHERE user_id = ? AND is_read = 1 
        AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const result = await query(sql, [userId, daysOld]);
    return { deleted: result.affectedRows };
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0';
    const results = await query(sql, [userId]);
    return results[0].count;
  }

  /**
   * Bulk mark as read
   */
  static async bulkMarkAsRead(notificationIds) {
    if (!notificationIds || notificationIds.length === 0) {
      return { updated: 0 };
    }

    const placeholders = notificationIds.map(() => '?').join(',');
    const sql = `
      UPDATE user_notifications 
      SET is_read = 1, read_at = NOW()
      WHERE notification_id IN (${placeholders})
    `;

    const result = await query(sql, notificationIds);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete notifications
   */
  static async bulkDelete(notificationIds) {
    if (!notificationIds || notificationIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = notificationIds.map(() => '?').join(',');
    const sql = `DELETE FROM user_notifications WHERE notification_id IN (${placeholders})`;
    const result = await query(sql, notificationIds);
    return { deleted: result.affectedRows };
  }

  // ==================== Admin Notifications ====================

  /**
   * Get all notifications for an admin
   */
  static async getByAdminId(adminId, options = {}) {
    const {
      page = 1,
      limit = 20,
      is_read,
      type,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [adminId];
    let whereClause = 'WHERE admin_id = ?';

    if (is_read !== undefined) {
      whereClause += ' AND is_read = ?';
      params.push(is_read ? 1 : 0);
    }

    if (type) {
      whereClause += ' AND notification_type = ?';
      params.push(type);
    }

    const countSql = `SELECT COUNT(*) as total FROM admin_notifications ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        notification_id,
        admin_id,
        notification_type,
        title,
        message,
        data,
        link_url,
        is_read,
        read_at,
        created_at
      FROM admin_notifications
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const notifications = await query(sql, params);

    // Parse data JSON
    notifications.forEach(notification => {
      if (notification.data) {
        try {
          notification.data = JSON.parse(notification.data);
        } catch (e) {
          notification.data = null;
        }
      }
    });

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get admin notification by ID
   */
  static async getAdminNotificationById(notificationId) {
    const sql = `
      SELECT 
        notification_id,
        admin_id,
        notification_type,
        title,
        message,
        data,
        link_url,
        is_read,
        read_at,
        created_at
      FROM admin_notifications
      WHERE notification_id = ?
    `;

    const results = await query(sql, [notificationId]);
    const notification = results[0] || null;

    if (notification && notification.data) {
      try {
        notification.data = JSON.parse(notification.data);
      } catch (e) {
        notification.data = null;
      }
    }

    return notification;
  }

  /**
   * Create admin notification
   */
  static async createAdminNotification(data) {
    const {
      admin_id,
      notification_type = 'general',
      title,
      message,
      data: notificationData,
      link_url,
    } = data;

    const sql = `
      INSERT INTO admin_notifications (
        admin_id,
        notification_type,
        title,
        message,
        data,
        link_url,
        is_read,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
    `;

    const result = await query(sql, [
      admin_id,
      notification_type,
      title,
      message,
      notificationData ? JSON.stringify(notificationData) : null,
      link_url || null,
    ]);

    return await this.getAdminNotificationById(result.insertId);
  }

  /**
   * Create notification for multiple admins
   */
  static async createForMultipleAdmins(adminIds, notificationData) {
    const created = [];

    for (const adminId of adminIds) {
      const notification = await this.createAdminNotification({
        ...notificationData,
        admin_id: adminId,
      });
      created.push(notification);
    }

    return created;
  }

  /**
   * Create notification for all admins
   */
  static async createForAllAdmins(notificationData) {
    const adminsSql = 'SELECT admin_id FROM admin_users WHERE status = "active"';
    const admins = await query(adminsSql);
    const adminIds = admins.map(a => a.admin_id);

    return await this.createForMultipleAdmins(adminIds, notificationData);
  }

  /**
   * Create notification for admins by role
   */
  static async createForAdminsByRole(role, notificationData) {
    const adminsSql = 'SELECT admin_id FROM admin_users WHERE status = "active" AND role = ?';
    const admins = await query(adminsSql, [role]);
    const adminIds = admins.map(a => a.admin_id);

    return await this.createForMultipleAdmins(adminIds, notificationData);
  }

  /**
   * Mark admin notification as read
   */
  static async markAdminNotificationAsRead(notificationId) {
    const sql = `
      UPDATE admin_notifications 
      SET is_read = 1, read_at = NOW()
      WHERE notification_id = ?
    `;

    await query(sql, [notificationId]);
    return await this.getAdminNotificationById(notificationId);
  }

  /**
   * Mark all admin notifications as read
   */
  static async markAllAdminNotificationsAsRead(adminId) {
    const sql = `
      UPDATE admin_notifications 
      SET is_read = 1, read_at = NOW()
      WHERE admin_id = ? AND is_read = 0
    `;

    const result = await query(sql, [adminId]);
    return { updated: result.affectedRows };
  }

  /**
   * Delete admin notification
   */
  static async deleteAdminNotification(notificationId) {
    const sql = 'DELETE FROM admin_notifications WHERE notification_id = ?';
    const result = await query(sql, [notificationId]);
    return result.affectedRows > 0;
  }

  /**
   * Get unread count for admin
   */
  static async getAdminUnreadCount(adminId) {
    const sql = 'SELECT COUNT(*) as count FROM admin_notifications WHERE admin_id = ? AND is_read = 0';
    const results = await query(sql, [adminId]);
    return results[0].count;
  }

  // ==================== Push Notifications ====================

  /**
   * Store push notification token
   */
  static async storePushToken(data) {
    const {
      user_id,
      admin_id,
      device_token,
      device_type,
      device_name,
    } = data;

    // Check if token already exists
    const existingSql = 'SELECT id FROM push_tokens WHERE device_token = ?';
    const existing = await query(existingSql, [device_token]);

    if (existing.length > 0) {
      // Update existing
      const updateSql = `
        UPDATE push_tokens 
        SET user_id = ?, admin_id = ?, device_type = ?, device_name = ?, 
            is_active = 1, updated_at = NOW()
        WHERE device_token = ?
      `;
      await query(updateSql, [user_id || null, admin_id || null, device_type, device_name || null, device_token]);
      return existing[0].id;
    }

    // Insert new
    const sql = `
      INSERT INTO push_tokens (
        user_id,
        admin_id,
        device_token,
        device_type,
        device_name,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;

    const result = await query(sql, [
      user_id || null,
      admin_id || null,
      device_token,
      device_type,
      device_name || null,
    ]);

    return result.insertId;
  }

  /**
   * Get push tokens for user
   */
  static async getUserPushTokens(userId) {
    const sql = `
      SELECT device_token, device_type
      FROM push_tokens
      WHERE user_id = ? AND is_active = 1
    `;

    return await query(sql, [userId]);
  }

  /**
   * Get push tokens for admin
   */
  static async getAdminPushTokens(adminId) {
    const sql = `
      SELECT device_token, device_type
      FROM push_tokens
      WHERE admin_id = ? AND is_active = 1
    `;

    return await query(sql, [adminId]);
  }

  /**
   * Deactivate push token
   */
  static async deactivatePushToken(deviceToken) {
    const sql = `
      UPDATE push_tokens 
      SET is_active = 0, updated_at = NOW()
      WHERE device_token = ?
    `;

    const result = await query(sql, [deviceToken]);
    return result.affectedRows > 0;
  }

  /**
   * Delete push token
   */
  static async deletePushToken(deviceToken) {
    const sql = 'DELETE FROM push_tokens WHERE device_token = ?';
    const result = await query(sql, [deviceToken]);
    return result.affectedRows > 0;
  }

  // ==================== Notification Templates ====================

  /**
   * Get notification template
   */
  static async getTemplate(templateCode, lang = 'en') {
    const titleField = `title_${lang}`;
    const messageField = `message_${lang}`;

    const sql = `
      SELECT 
        template_id,
        template_code,
        notification_type,
        ${titleField} as title,
        ${messageField} as message,
        default_link_url
      FROM notification_templates
      WHERE template_code = ? AND is_active = 1
    `;

    const results = await query(sql, [templateCode]);
    return results[0] || null;
  }

  /**
   * Get all templates
   */
  static async getAllTemplates(options = {}) {
    const { is_active, lang = 'en' } = options;

    const titleField = `title_${lang}`;
    const messageField = `message_${lang}`;

    let sql = `
      SELECT 
        template_id,
        template_code,
        notification_type,
        title_en,
        title_ar,
        title_he,
        ${titleField} as title,
        message_en,
        message_ar,
        message_he,
        ${messageField} as message,
        default_link_url,
        is_active,
        created_at,
        updated_at
      FROM notification_templates
    `;

    const params = [];

    if (is_active !== undefined) {
      sql += ' WHERE is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    sql += ' ORDER BY template_code ASC';

    return await query(sql, params);
  }

  /**
   * Create notification from template
   */
  static async createFromTemplate(templateCode, userId, variables = {}, lang = 'en') {
    const template = await this.getTemplate(templateCode, lang);
    if (!template) return null;

    // Replace variables in title and message
    let title = template.title;
    let message = template.message;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }

    return await this.create({
      user_id: userId,
      notification_type: template.notification_type,
      title,
      message,
      link_url: template.default_link_url,
      data: variables,
    });
  }

  // ==================== Statistics ====================

  /**
   * Get notification statistics
   */
  static async getStatistics() {
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_notifications,
        COUNT(DISTINCT user_id) as users_with_notifications,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_notifications
      FROM user_notifications
    `);

    const adminStats = await query(`
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_notifications,
        COUNT(DISTINCT admin_id) as admins_with_notifications
      FROM admin_notifications
    `);

    const typeStats = await query(`
      SELECT 
        notification_type,
        COUNT(*) as count
      FROM user_notifications
      GROUP BY notification_type
      ORDER BY count DESC
    `);

    return {
      user_notifications: userStats[0],
      admin_notifications: adminStats[0],
      by_type: typeStats,
    };
  }

  /**
   * Cleanup old notifications
   */
  static async cleanupOldNotifications(daysOld = 90) {
    const userResult = await query(
      `DELETE FROM user_notifications 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND is_read = 1`,
      [daysOld]
    );

    const adminResult = await query(
      `DELETE FROM admin_notifications 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND is_read = 1`,
      [daysOld]
    );

    return {
      user_notifications_deleted: userResult.affectedRows,
      admin_notifications_deleted: adminResult.affectedRows,
    };
  }

  /**
   * Get recent notifications for dashboard
   */
  static async getRecentForDashboard(adminId, limit = 5) {
    const sql = `
      SELECT 
        notification_id,
        notification_type,
        title,
        message,
        is_read,
        created_at
      FROM admin_notifications
      WHERE admin_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    return await query(sql, [adminId, limit]);
  }
}

module.exports = Notification;