/**
 * Message Service
 * @module services/message
 */

const Message = require('../models/message.model');
const Admin = require('../models/admin.model');
const EmailService = require('./email.service');
const NotificationService = require('./notification.service');

class MessageService {
  /**
   * Get all messages with pagination
   */
  static async getAll(options = {}) {
    return await Message.getAll(options);
  }

  /**
   * Get message by ID
   */
  static async getById(messageId) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  }

  /**
   * Get message with replies
   */
  static async getWithReplies(messageId) {
    const message = await Message.getWithReplies(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  }

  /**
   * Create new message (from admin or contact form)
   */
  static async create(data) {
    const message = await Message.create(data);

    // Notify admins about new message
    await NotificationService.notifyAdminsNewMessage(message);

    return message;
  }

  /**
   * Update message
   */
  static async update(messageId, data) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.update(messageId, data);
  }

  /**
   * Delete message
   */
  static async delete(messageId) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.delete(messageId);
  }

  /**
   * Update message status
   */
  static async updateStatus(messageId, status, resolvedBy = null) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.updateStatus(messageId, status, resolvedBy);
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId, readBy) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.markAsRead(messageId, readBy);
  }

  /**
   * Mark message as unread
   */
  static async markAsUnread(messageId) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.markAsUnread(messageId);
  }

  /**
   * Update message priority
   */
  static async updatePriority(messageId, priority) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.updatePriority(messageId, priority);
  }

  /**
   * Assign message to admin
   */
  static async assign(messageId, adminId) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const assignedMessage = await Message.assignTo(messageId, adminId);

    // Notify assigned admin
    await NotificationService.sendToAdmin(adminId, {
      notification_type: 'message',
      title: 'New Message Assigned',
      message: `You have been assigned to message #${messageId}`,
      data: { message_id: messageId },
    });

    return assignedMessage;
  }

  /**
   * Unassign message
   */
  static async unassign(messageId) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.unassign(messageId);
  }

  /**
   * Add internal note
   */
  static async addInternalNote(messageId, note, adminId) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.addInternalNote(messageId, note, adminId);
  }

  /**
   * Reply to message
   */
  static async reply(messageId, replyData, adminId) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Add reply
    const reply = await Message.addReply(messageId, {
      ...replyData,
      admin_id: adminId,
    });

    // Send email to customer if requested
    if (replyData.send_email !== false) {
      await EmailService.sendMessageReplyEmail(
        message.email,
        message.name,
        replyData.message,
        message.subject
      );
    }

    // Update message status if pending
    if (message.status === 'pending') {
      await Message.updateStatus(messageId, 'in_progress');
    }

    return reply;
  }

  /**
   * Update reply
   */
  static async updateReply(messageId, replyId, replyData) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.updateReply(replyId, replyData);
  }

  /**
   * Delete reply
   */
  static async deleteReply(messageId, replyId) {
    const message = await Message.getById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return await Message.deleteReply(replyId);
  }

  /**
   * Get messages assigned to admin
   */
  static async getAssigned(adminId, options = {}) {
    return await Message.getAssignedTo(adminId, options);
  }

  /**
   * Get unread messages count
   */
  static async getUnreadCount() {
    return await Message.getUnreadCount();
  }

  /**
   * Get pending messages count
   */
  static async getPendingCount() {
    return await Message.getPendingCount();
  }

  /**
   * Get messages count by type
   */
  static async getCountByType() {
    return await Message.getCountByType();
  }

  /**
   * Get messages count by status
   */
  static async getCountByStatus() {
    return await Message.getCountByStatus();
  }

  /**
   * Get recent messages
   */
  static async getRecent(limit = 10) {
    return await Message.getRecent(limit);
  }

  /**
   * Get message statistics
   */
  static async getStatistics(options = {}) {
    return await Message.getStatistics(options);
  }

  /**
   * Get average response time
   */
  static async getAverageResponseTime() {
    return await Message.getAverageResponseTime();
  }

  /**
   * Search messages
   */
  static async search(searchTerm, options = {}) {
    return await Message.search(searchTerm, options);
  }

  /**
   * Mark multiple messages as read
   */
  static async markMultipleAsRead(messageIds, readBy) {
    return await Message.markMultipleAsRead(messageIds, readBy);
  }

  /**
   * Bulk update status
   */
  static async bulkUpdateStatus(messageIds, status, updatedBy = null) {
    return await Message.bulkUpdateStatus(messageIds, status, updatedBy);
  }

  /**
   * Bulk delete messages
   */
  static async bulkDelete(messageIds) {
    return await Message.bulkDelete(messageIds);
  }

  /**
   * Export messages
   */
  static async export(options = {}) {
    return await Message.getAllForExport(options);
  }

  /**
   * Get messages by user
   */
  static async getByUser(userId, options = {}) {
    return await Message.getByUserId(userId, options);
  }
}

module.exports = MessageService;