/**
 * Message Model
 * @module models/message
 */

const { query } = require('../config/database');

/**
 * Message Model - Handles contact messages and inquiries database operations
 */
class Message {
  /**
   * Get all messages with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type,
      is_read,
      priority,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      whereClause += ' AND message_type = ?';
      params.push(type);
    }

    if (is_read !== undefined) {
      whereClause += ' AND is_read = ?';
      params.push(is_read ? 1 : 0);
    }

    if (priority) {
      whereClause += ' AND priority = ?';
      params.push(priority);
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
    const countSql = `SELECT COUNT(*) as total FROM messages ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['message_id', 'name', 'email', 'subject', 'status', 'priority', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        m.*,
        u.username,
        u.email as user_email,
        (SELECT COUNT(*) FROM message_replies WHERE message_id = m.message_id) as reply_count
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.user_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const messages = await query(sql, params);

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get message by ID
   */
  static async getById(messageId) {
    const sql = `
      SELECT 
        m.*,
        u.username,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.user_id
      WHERE m.message_id = ?
    `;

    const results = await query(sql, [messageId]);
    return results[0] || null;
  }

  /**
   * Get message with replies
   */
  static async getWithReplies(messageId) {
    const message = await this.getById(messageId);
    if (!message) return null;

    const repliesSql = `
      SELECT 
        r.*,
        a.username as admin_username,
        a.first_name as admin_first_name,
        a.last_name as admin_last_name
      FROM message_replies r
      LEFT JOIN admin_users a ON r.admin_id = a.admin_id
      WHERE r.message_id = ?
      ORDER BY r.created_at ASC
    `;

    message.replies = await query(repliesSql, [messageId]);

    return message;
  }

  /**
   * Create a new message
   */
  static async create(data) {
    const {
      user_id,
      name,
      email,
      phone,
      subject,
      message,
      message_type = 'general',
      priority = 'normal',
      status = 'pending',
      source = 'contact_form',
      ip_address,
      user_agent,
      order_id,
      product_id,
    } = data;

    const sql = `
      INSERT INTO messages (
        user_id,
        name,
        email,
        phone,
        subject,
        message,
        message_type,
        priority,
        status,
        source,
        ip_address,
        user_agent,
        order_id,
        product_id,
        is_read,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `;

    const result = await query(sql, [
      user_id || null,
      name,
      email,
      phone || null,
      subject || null,
      message,
      message_type,
      priority,
      status,
      source,
      ip_address || null,
      user_agent || null,
      order_id || null,
      product_id || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update message
   */
  static async update(messageId, data) {
    const allowedFields = [
      'name',
      'email',
      'phone',
      'subject',
      'message',
      'message_type',
      'priority',
      'status',
      'is_read',
      'assigned_to',
      'internal_notes',
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
      return await this.getById(messageId);
    }

    updates.push('updated_at = NOW()');
    values.push(messageId);

    const sql = `UPDATE messages SET ${updates.join(', ')} WHERE message_id = ?`;
    await query(sql, values);

    return await this.getById(messageId);
  }

  /**
   * Delete message
   */
  static async delete(messageId) {
    // Delete replies first
    await query('DELETE FROM message_replies WHERE message_id = ?', [messageId]);

    const sql = 'DELETE FROM messages WHERE message_id = ?';
    const result = await query(sql, [messageId]);
    return result.affectedRows > 0;
  }

  /**
   * Update status
   */
  static async updateStatus(messageId, status, updatedBy = null) {
    let sql = 'UPDATE messages SET status = ?, updated_at = NOW()';
    const params = [status];

    if (status === 'resolved') {
      sql += ', resolved_at = NOW(), resolved_by = ?';
      params.push(updatedBy);
    }

    sql += ' WHERE message_id = ?';
    params.push(messageId);

    await query(sql, params);
    return await this.getById(messageId);
  }

  /**
   * Mark as read
   */
  static async markAsRead(messageId) {
    const sql = `
      UPDATE messages 
      SET is_read = 1, read_at = NOW(), updated_at = NOW()
      WHERE message_id = ?
    `;

    await query(sql, [messageId]);
    return await this.getById(messageId);
  }

  /**
   * Mark as unread
   */
  static async markAsUnread(messageId) {
    const sql = `
      UPDATE messages 
      SET is_read = 0, read_at = NULL, updated_at = NOW()
      WHERE message_id = ?
    `;

    await query(sql, [messageId]);
    return await this.getById(messageId);
  }

  /**
   * Mark multiple as read
   */
  static async markMultipleAsRead(messageIds) {
    if (!messageIds || messageIds.length === 0) {
      return { updated: 0 };
    }

    const placeholders = messageIds.map(() => '?').join(',');
    const sql = `
      UPDATE messages 
      SET is_read = 1, read_at = NOW(), updated_at = NOW()
      WHERE message_id IN (${placeholders})
    `;

    const result = await query(sql, messageIds);
    return { updated: result.affectedRows };
  }

  /**
   * Update priority
   */
  static async updatePriority(messageId, priority) {
    const sql = `
      UPDATE messages 
      SET priority = ?, updated_at = NOW()
      WHERE message_id = ?
    `;

    await query(sql, [priority, messageId]);
    return await this.getById(messageId);
  }

  /**
   * Assign message to admin
   */
  static async assignTo(messageId, adminId) {
    const sql = `
      UPDATE messages 
      SET assigned_to = ?, assigned_at = NOW(), updated_at = NOW()
      WHERE message_id = ?
    `;

    await query(sql, [adminId, messageId]);
    return await this.getById(messageId);
  }

  /**
   * Unassign message
   */
  static async unassign(messageId) {
    const sql = `
      UPDATE messages 
      SET assigned_to = NULL, assigned_at = NULL, updated_at = NOW()
      WHERE message_id = ?
    `;

    await query(sql, [messageId]);
    return await this.getById(messageId);
  }

  // ==================== Replies ====================

  /**
   * Get replies for a message
   */
  static async getReplies(messageId) {
    const sql = `
      SELECT 
        r.*,
        a.username as admin_username,
        a.first_name as admin_first_name,
        a.last_name as admin_last_name,
        a.profile_image as admin_avatar
      FROM message_replies r
      LEFT JOIN admin_users a ON r.admin_id = a.admin_id
      WHERE r.message_id = ?
      ORDER BY r.created_at ASC
    `;

    return await query(sql, [messageId]);
  }

  /**
   * Add reply to message
   */
  static async addReply(data) {
    const {
      message_id,
      admin_id,
      reply_message,
      is_internal = false,
      send_email = true,
    } = data;

    const sql = `
      INSERT INTO message_replies (
        message_id,
        admin_id,
        reply_message,
        is_internal,
        send_email,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      message_id,
      admin_id,
      reply_message,
      is_internal ? 1 : 0,
      send_email ? 1 : 0,
    ]);

    // Update message status to in_progress if pending
    await query(
      `UPDATE messages 
       SET status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END,
           updated_at = NOW()
       WHERE message_id = ?`,
      [message_id]
    );

    // Get the created reply
    const replySql = `
      SELECT 
        r.*,
        a.username as admin_username
      FROM message_replies r
      LEFT JOIN admin_users a ON r.admin_id = a.admin_id
      WHERE r.reply_id = ?
    `;

    const replies = await query(replySql, [result.insertId]);
    return replies[0];
  }

  /**
   * Delete reply
   */
  static async deleteReply(replyId) {
    const sql = 'DELETE FROM message_replies WHERE reply_id = ?';
    const result = await query(sql, [replyId]);
    return result.affectedRows > 0;
  }

  /**
   * Update reply
   */
  static async updateReply(replyId, replyMessage) {
    const sql = `
      UPDATE message_replies 
      SET reply_message = ?, updated_at = NOW()
      WHERE reply_id = ?
    `;

    await query(sql, [replyMessage, replyId]);

    const results = await query('SELECT * FROM message_replies WHERE reply_id = ?', [replyId]);
    return results[0] || null;
  }

  // ==================== Statistics ====================

  /**
   * Get message statistics
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
        COUNT(*) as total_messages,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_messages,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_messages,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_messages,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_messages,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_messages,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_priority,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_messages
      FROM messages
      WHERE 1=1 ${dateFilter}
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get unread count
   */
  static async getUnreadCount() {
    const sql = 'SELECT COUNT(*) as count FROM messages WHERE is_read = 0';
    const results = await query(sql);
    return results[0].count;
  }

  /**
   * Get pending count
   */
  static async getPendingCount() {
    const sql = "SELECT COUNT(*) as count FROM messages WHERE status = 'pending'";
    const results = await query(sql);
    return results[0].count;
  }

  /**
   * Get messages by type count
   */
  static async getCountByType() {
    const sql = `
      SELECT 
        message_type,
        COUNT(*) as count
      FROM messages
      GROUP BY message_type
      ORDER BY count DESC
    `;

    return await query(sql);
  }

  /**
   * Get messages by status count
   */
  static async getCountByStatus() {
    const sql = `
      SELECT 
        status,
        COUNT(*) as count
      FROM messages
      GROUP BY status
    `;

    return await query(sql);
  }

  /**
   * Get recent messages
   */
  static async getRecent(limit = 10) {
    const sql = `
      SELECT 
        message_id,
        name,
        email,
        subject,
        status,
        priority,
        is_read,
        created_at
      FROM messages
      ORDER BY created_at DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get messages by user
   */
  static async getByUserId(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM messages WHERE user_id = ?';
    const countResult = await query(countSql, [userId]);
    const total = countResult[0].total;

    const sql = `
      SELECT * FROM messages
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const messages = await query(sql, [userId, limit, offset]);

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get messages assigned to admin
   */
  static async getAssignedTo(adminId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    const params = [adminId];

    let whereClause = 'WHERE assigned_to = ?';

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM messages ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT * FROM messages
      ${whereClause}
      ORDER BY priority DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const messages = await query(sql, params);

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search messages
   */
  static async search(searchTerm, limit = 10) {
    const sql = `
      SELECT 
        message_id,
        name,
        email,
        subject,
        status,
        priority,
        is_read,
        created_at
      FROM messages
      WHERE 
        name LIKE ? OR
        email LIKE ? OR
        subject LIKE ? OR
        message LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, term, limit]);
  }

  /**
   * Bulk update status
   */
  static async bulkUpdateStatus(messageIds, status) {
    if (!messageIds || messageIds.length === 0) {
      return { updated: 0 };
    }

    const placeholders = messageIds.map(() => '?').join(',');
    const sql = `
      UPDATE messages 
      SET status = ?, updated_at = NOW()
      WHERE message_id IN (${placeholders})
    `;

    const result = await query(sql, [status, ...messageIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete messages
   */
  static async bulkDelete(messageIds) {
    if (!messageIds || messageIds.length === 0) {
      return { deleted: 0 };
    }

    // Delete replies first
    const replyPlaceholders = messageIds.map(() => '?').join(',');
    await query(
      `DELETE FROM message_replies WHERE message_id IN (${replyPlaceholders})`,
      messageIds
    );

    const placeholders = messageIds.map(() => '?').join(',');
    const sql = `DELETE FROM messages WHERE message_id IN (${placeholders})`;
    const result = await query(sql, messageIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Get messages for export
   */
  static async getAllForExport(options = {}) {
    const { status, date_from, date_to } = options;

    let sql = `
      SELECT 
        m.*,
        u.username,
        u.email as user_email,
        (SELECT COUNT(*) FROM message_replies WHERE message_id = m.message_id) as reply_count
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND m.status = ?';
      params.push(status);
    }

    if (date_from) {
      sql += ' AND DATE(m.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      sql += ' AND DATE(m.created_at) <= ?';
      params.push(date_to);
    }

    sql += ' ORDER BY m.created_at DESC';

    return await query(sql, params);
  }

  /**
   * Get average response time
   */
  static async getAverageResponseTime() {
    const sql = `
      SELECT 
        AVG(TIMESTAMPDIFF(HOUR, m.created_at, mr.created_at)) as avg_hours
      FROM messages m
      JOIN message_replies mr ON m.message_id = mr.message_id
      WHERE mr.is_internal = 0
      AND mr.created_at = (
        SELECT MIN(created_at) 
        FROM message_replies 
        WHERE message_id = m.message_id AND is_internal = 0
      )
    `;

    const results = await query(sql);
    return results[0].avg_hours || 0;
  }

  /**
   * Add internal note
   */
  static async addInternalNote(messageId, note, adminId) {
    const message = await this.getById(messageId);
    if (!message) return null;

    const existingNotes = message.internal_notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] Admin #${adminId}: ${note}\n${existingNotes}`;

    await query(
      'UPDATE messages SET internal_notes = ?, updated_at = NOW() WHERE message_id = ?',
      [newNote, messageId]
    );

    return await this.getById(messageId);
  }
}

module.exports = Message;