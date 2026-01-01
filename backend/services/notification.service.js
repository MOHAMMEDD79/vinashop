/**
 * Notification Service
 * @module services/notification
 */

const Notification = require('../models/notification.model');
const Admin = require('../models/admin.model');
const User = require('../models/user.model');

class NotificationService {
  // ==================== User Notifications ====================

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, options = {}) {
    return await Notification.getByUserId(userId, options);
  }

  /**
   * Get user notification by ID
   */
  static async getUserNotificationById(notificationId) {
    return await Notification.getById(notificationId);
  }

  /**
   * Send notification to user
   */
  static async sendToUser(userId, data) {
    return await Notification.create({
      user_id: userId,
      ...data,
    });
  }

  /**
   * Send notification to multiple users
   */
  static async sendToMultipleUsers(userIds, data) {
    return await Notification.createForMultipleUsers(userIds, data);
  }

  /**
   * Send notification to all users
   */
  static async sendToAllUsers(data) {
    return await Notification.createForAllUsers(data);
  }

  /**
   * Mark user notification as read
   */
  static async markUserNotificationAsRead(notificationId) {
    return await Notification.markAsRead(notificationId);
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllUserNotificationsAsRead(userId) {
    return await Notification.markAllAsRead(userId);
  }

  /**
   * Delete user notification
   */
  static async deleteUserNotification(notificationId) {
    return await Notification.delete(notificationId);
  }

  /**
   * Get user unread count
   */
  static async getUserUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  // ==================== Admin Notifications ====================

  /**
   * Get admin notifications
   */
  static async getAdminNotifications(adminId, options = {}) {
    return await Notification.getByAdminId(adminId, options);
  }

  /**
   * Get admin notification by ID
   */
  static async getAdminNotificationById(notificationId) {
    return await Notification.getAdminNotificationById(notificationId);
  }

  /**
   * Send notification to admin
   */
  static async sendToAdmin(adminId, data) {
    return await Notification.createAdminNotification({
      admin_id: adminId,
      ...data,
    });
  }

  /**
   * Send notification to multiple admins
   */
  static async sendToMultipleAdmins(adminIds, data) {
    return await Notification.createForMultipleAdmins(adminIds, data);
  }

  /**
   * Send notification to all admins
   */
  static async sendToAllAdmins(data) {
    return await Notification.createForAllAdmins(data);
  }

  /**
   * Send notification to admins by role
   */
  static async sendToAdminsByRole(role, data) {
    return await Notification.createForAdminsByRole(role, data);
  }

  /**
   * Mark admin notification as read
   */
  static async markAdminNotificationAsRead(notificationId) {
    return await Notification.markAdminNotificationAsRead(notificationId);
  }

  /**
   * Mark all admin notifications as read
   */
  static async markAllAdminNotificationsAsRead(adminId) {
    return await Notification.markAllAdminNotificationsAsRead(adminId);
  }

  /**
   * Delete admin notification
   */
  static async deleteAdminNotification(notificationId) {
    return await Notification.deleteAdminNotification(notificationId);
  }

  /**
   * Get admin unread count
   */
  static async getAdminUnreadCount(adminId) {
    return await Notification.getAdminUnreadCount(adminId);
  }

  // ==================== Order Notifications ====================

  /**
   * Send order notification
   */
  static async sendOrderNotification(userId, orderId, type) {
    const messages = {
      created: 'Your order has been placed successfully',
      confirmed: 'Your order has been confirmed',
      processing: 'Your order is being processed',
      shipped: 'Your order has been shipped',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled',
    };

    return await this.sendToUser(userId, {
      notification_type: 'order',
      title: 'Order Update',
      message: messages[type] || 'Your order status has been updated',
      data: { order_id: orderId, type },
      link_url: `/orders/${orderId}`,
    });
  }

  /**
   * Send order status notification
   */
  static async sendOrderStatusNotification(userId, orderId, status) {
    return await this.sendOrderNotification(userId, orderId, status);
  }

  /**
   * Send order cancellation notification
   */
  static async sendOrderCancellationNotification(userId, orderId) {
    return await this.sendOrderNotification(userId, orderId, 'cancelled');
  }

  // ==================== Payment Notifications ====================

  /**
   * Send payment notification
   */
  static async sendPaymentNotification(userId, orderId, status) {
    const messages = {
      success: 'Payment received successfully',
      failed: 'Payment failed. Please try again.',
      refunded: 'Your payment has been refunded',
    };

    return await this.sendToUser(userId, {
      notification_type: 'payment',
      title: 'Payment Update',
      message: messages[status] || 'Your payment status has been updated',
      data: { order_id: orderId, status },
      link_url: `/orders/${orderId}`,
    });
  }

  // ==================== Shipping Notifications ====================

  /**
   * Send shipping notification
   */
  static async sendShippingNotification(userId, orderId, trackingNumber) {
    return await this.sendToUser(userId, {
      notification_type: 'shipping',
      title: 'Shipment Update',
      message: `Your order has been shipped. Tracking: ${trackingNumber}`,
      data: { order_id: orderId, tracking_number: trackingNumber },
      link_url: `/orders/${orderId}`,
    });
  }

  // ==================== Review Notifications ====================

  /**
   * Send review status notification
   */
  static async sendReviewStatusNotification(userId, reviewId, status) {
    const messages = {
      approved: 'Your review has been approved',
      rejected: 'Your review did not meet our guidelines',
    };

    return await this.sendToUser(userId, {
      notification_type: 'review',
      title: 'Review Update',
      message: messages[status] || 'Your review status has been updated',
      data: { review_id: reviewId, status },
    });
  }

  // ==================== Admin Alert Notifications ====================

  /**
   * Notify admins about new order
   */
  static async notifyAdminsNewOrder(order) {
    return await this.sendToAllAdmins({
      notification_type: 'order',
      title: 'New Order',
      message: `New order #${order.order_number} received`,
      data: { order_id: order.order_id },
    });
  }

  /**
   * Notify admins about new message
   */
  static async notifyAdminsNewMessage(message) {
    return await this.sendToAllAdmins({
      notification_type: 'message',
      title: 'New Message',
      message: `New ${message.message_type} message from ${message.name}`,
      data: { message_id: message.message_id },
    });
  }

  /**
   * Notify admins about new review
   */
  static async notifyAdminsNewReview(review) {
    return await this.sendToAllAdmins({
      notification_type: 'review',
      title: 'New Review',
      message: `New ${review.rating}-star review pending approval`,
      data: { review_id: review.review_id },
    });
  }

  /**
   * Notify admins about low stock
   */
  static async notifyAdminsLowStock(product) {
    return await this.sendToAllAdmins({
      notification_type: 'system',
      title: 'Low Stock Alert',
      message: `Product "${product.product_name_en}" is running low on stock`,
      data: { product_id: product.product_id },
    });
  }

  // ==================== Templates ====================

  /**
   * Get notification templates
   */
  static async getTemplates() {
    return await Notification.getAllTemplates();
  }

  /**
   * Get template by code
   */
  static async getTemplateByCode(code, lang = 'en') {
    return await Notification.getTemplate(code, lang);
  }

  /**
   * Send notification from template
   */
  static async sendFromTemplate(userId, templateCode, variables = {}, lang = 'en') {
    return await Notification.createFromTemplate(userId, templateCode, variables, lang);
  }

  // ==================== Push Tokens ====================

  /**
   * Register push token
   */
  static async registerPushToken(userId, tokenData, isAdmin = false) {
    return await Notification.storePushToken(userId, tokenData, isAdmin);
  }

  /**
   * Unregister push token
   */
  static async unregisterPushToken(token) {
    return await Notification.deletePushToken(token);
  }

  // ==================== Bulk Operations ====================

  /**
   * Bulk mark as read
   */
  static async bulkMarkAsRead(notificationIds) {
    return await Notification.bulkMarkAsRead(notificationIds);
  }

  /**
   * Bulk delete
   */
  static async bulkDelete(notificationIds) {
    return await Notification.bulkDelete(notificationIds);
  }

  // ==================== Statistics & Cleanup ====================

  /**
   * Get notification statistics
   */
  static async getStatistics() {
    return await Notification.getStatistics();
  }

  /**
   * Get recent notifications for dashboard
   */
  static async getRecentForDashboard(adminId) {
    return await Notification.getRecentForDashboard(adminId);
  }

  /**
   * Cleanup old notifications
   */
  static async cleanup(daysOld = 90) {
    return await Notification.cleanupOldNotifications(daysOld);
  }
}

module.exports = NotificationService;