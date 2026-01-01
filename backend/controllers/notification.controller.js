/**
 * Notification Controller
 * @module controllers/notification
 * 
 * FIXED: Accepts both camelCase and snake_case, responses include both formats
 */

const notificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const VALID_TYPES = ['order', 'promotion', 'account', 'system', 'message', 'review', 'stock'];

/**
 * Helper: Format notification for response
 */
const formatNotification = (notification) => {
  if (!notification) return null;

  return {
    id: notification.notification_id || notification.id,
    notificationId: notification.notification_id || notification.id,
    notification_id: notification.notification_id || notification.id,
    
    title: notification.title,
    message: notification.message,
    type: notification.type || 'system',
    
    userId: notification.user_id,
    user_id: notification.user_id,
    adminId: notification.admin_id,
    admin_id: notification.admin_id,
    
    isRead: notification.is_read === 1 || notification.is_read === true,
    is_read: notification.is_read === 1 || notification.is_read === true,
    
    actionUrl: notification.action_url,
    action_url: notification.action_url,
    data: notification.data,
    
    createdBy: notification.created_by,
    created_by: notification.created_by,
    
    readAt: notification.read_at,
    read_at: notification.read_at,
    createdAt: notification.created_at,
    created_at: notification.created_at,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result) => {
  const items = (result.items || result.data || result.notifications || []).map(formatNotification);
  return {
    items,
    data: items,
    notifications: items,
    pagination: {
      page: result.page || 1,
      limit: result.limit || 20,
      total: result.total || items.length,
      totalPages: result.totalPages || 1,
    },
    page: result.page || 1,
    limit: result.limit || 20,
    total: result.total || items.length,
    totalPages: result.totalPages || 1,
  };
};

/**
 * Get all notifications for current admin
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, type,
      is_read, isRead,
      sort = 'created_at', order = 'DESC',
      sortBy, sort_by, sortOrder, sort_order,
    } = req.query;

    const result = await notificationService.getAll(req.admin?.adminId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      is_read: (is_read ?? isRead) !== undefined ? (is_read || isRead) === 'true' : undefined,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
    });

    return successResponse(res, formatPaginationResponse(result), 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await notificationService.getById(id, req.admin?.adminId);

    if (!notification) {
      return errorResponse(res, 'Notification not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatNotification(notification));
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notifications count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.admin?.adminId);
    return successResponse(res, { count, unreadCount: count, unread_count: count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent notifications
 */
const getRecent = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const notifications = await notificationService.getRecent(req.admin?.adminId, {
      limit: parseInt(limit),
    });

    const formattedNotifications = (notifications || []).map(formatNotification);
    return successResponse(res, formattedNotifications, 'Recent notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await notificationService.getById(id, req.admin?.adminId);
    if (!notification) {
      return errorResponse(res, 'Notification not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const updated = await notificationService.markAsRead(id, req.admin?.adminId);

    return successResponse(res, formatNotification(updated), 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as unread
 */
const markAsUnread = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await notificationService.getById(id, req.admin?.adminId);
    if (!notification) {
      return errorResponse(res, 'Notification not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const updated = await notificationService.markAsUnread(id, req.admin?.adminId);

    return successResponse(res, formatNotification(updated), 'Notification marked as unread');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.admin?.adminId);

    return successResponse(res, result, `${result.updated} notifications marked as read`);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark multiple notifications as read
 */
const markMultipleAsRead = async (req, res, next) => {
  try {
    const { notification_ids, notificationIds, ids } = req.body;
    const idList = notification_ids || notificationIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Notification IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await notificationService.markMultipleAsRead(idList, req.admin?.adminId);

    return successResponse(res, result, `${result.updated} notifications marked as read`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await notificationService.getById(id, req.admin?.adminId);
    if (!notification) {
      return errorResponse(res, 'Notification not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await notificationService.remove(id, req.admin?.adminId);

    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all notifications
 */
const removeAll = async (req, res, next) => {
  try {
    const result = await notificationService.removeAll(req.admin?.adminId);

    return successResponse(res, result, `${result.deleted} notifications deleted`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete read notifications
 */
const removeRead = async (req, res, next) => {
  try {
    const result = await notificationService.removeRead(req.admin?.adminId);

    return successResponse(res, result, `${result.deleted} read notifications deleted`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete notifications
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { notification_ids, notificationIds, ids } = req.body;
    const idList = notification_ids || notificationIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Notification IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await notificationService.bulkDelete(idList, req.admin?.adminId);

    return successResponse(res, result, `${result.deleted} notifications deleted`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get notifications by type
 */
const getByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!VALID_TYPES.includes(type)) {
      return errorResponse(res, `Invalid notification type. Valid types are: ${VALID_TYPES.join(', ')}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await notificationService.getByType(req.admin?.adminId, type, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create notification (Admin only - for sending to users)
 */
const create = async (req, res, next) => {
  try {
    const {
      user_id, userId,
      title, message,
      type = 'system',
      action_url, actionUrl,
      data,
    } = req.body;

    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const notification = await notificationService.create({
      user_id: user_id || userId,
      title,
      message,
      type,
      action_url: action_url || actionUrl,
      data,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatNotification(notification), 'Notification created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Send notification to all users
 */
const sendToAllUsers = async (req, res, next) => {
  try {
    const {
      title, message,
      type = 'promotion',
      action_url, actionUrl,
      data,
    } = req.body;

    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await notificationService.sendToAllUsers({
      title,
      message,
      type,
      action_url: action_url || actionUrl,
      data,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, result, `Notification sent to ${result.sent} users`);
  } catch (error) {
    next(error);
  }
};

/**
 * Send notification to selected users
 */
const sendToUsers = async (req, res, next) => {
  try {
    const {
      user_ids, userIds, ids,
      title, message,
      type = 'system',
      action_url, actionUrl,
      data,
    } = req.body;

    const idList = user_ids || userIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'User IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await notificationService.sendToUsers({
      user_ids: idList,
      title,
      message,
      type,
      action_url: action_url || actionUrl,
      data,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, result, `Notification sent to ${result.sent} users`);
  } catch (error) {
    next(error);
  }
};

/**
 * Send notification to all admins
 */
const sendToAllAdmins = async (req, res, next) => {
  try {
    const {
      title, message,
      type = 'system',
      action_url, actionUrl,
      data,
      exclude_self, excludeSelf,
    } = req.body;

    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const shouldExclude = (exclude_self ?? excludeSelf) === 'true' || (exclude_self ?? excludeSelf) === true;

    const result = await notificationService.sendToAllAdmins({
      title,
      message,
      type,
      action_url: action_url || actionUrl,
      data,
      created_by: req.admin?.adminId,
      exclude_admin_id: shouldExclude ? req.admin?.adminId : null,
    });

    return successResponse(res, result, `Notification sent to ${result.sent} admins`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user notifications (for admin to view user's notifications)
 */
const getUserNotifications = async (req, res, next) => {
  try {
    const { user_id, userId } = req.params;
    const uId = user_id || userId;
    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getUserNotifications(uId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'User notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await notificationService.getStatistics(req.admin?.adminId);

    const formattedStats = {
      total: stats.total || 0,
      totalNotifications: stats.total || 0,
      total_notifications: stats.total || 0,
      unread: stats.unread || 0,
      unreadCount: stats.unread || 0,
      unread_count: stats.unread || 0,
      read: stats.read || 0,
      readCount: stats.read || 0,
      read_count: stats.read || 0,
      byType: stats.by_type || stats.byType || {},
      by_type: stats.by_type || stats.byType || {},
    };

    return successResponse(res, formattedStats, 'Notification statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    const preferences = await notificationService.getPreferences(req.admin?.adminId);

    const formattedPreferences = {
      emailNotifications: preferences.email_notifications,
      email_notifications: preferences.email_notifications,
      pushNotifications: preferences.push_notifications,
      push_notifications: preferences.push_notifications,
      orderNotifications: preferences.order_notifications,
      order_notifications: preferences.order_notifications,
      messageNotifications: preferences.message_notifications,
      message_notifications: preferences.message_notifications,
      reviewNotifications: preferences.review_notifications,
      review_notifications: preferences.review_notifications,
      stockNotifications: preferences.stock_notifications,
      stock_notifications: preferences.stock_notifications,
      systemNotifications: preferences.system_notifications,
      system_notifications: preferences.system_notifications,
    };

    return successResponse(res, formattedPreferences, 'Notification preferences retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const {
      email_notifications, emailNotifications,
      push_notifications, pushNotifications,
      order_notifications, orderNotifications,
      message_notifications, messageNotifications,
      review_notifications, reviewNotifications,
      stock_notifications, stockNotifications,
      system_notifications, systemNotifications,
    } = req.body;

    const preferences = await notificationService.updatePreferences(req.admin?.adminId, {
      email_notifications: email_notifications ?? emailNotifications,
      push_notifications: push_notifications ?? pushNotifications,
      order_notifications: order_notifications ?? orderNotifications,
      message_notifications: message_notifications ?? messageNotifications,
      review_notifications: review_notifications ?? reviewNotifications,
      stock_notifications: stock_notifications ?? stockNotifications,
      system_notifications: system_notifications ?? systemNotifications,
    });

    return successResponse(res, preferences, 'Notification preferences updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Subscribe to push notifications
 */
const subscribeToPush = async (req, res, next) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return errorResponse(res, 'Push subscription data is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await notificationService.subscribeToPush(req.admin?.adminId, subscription);

    return successResponse(res, result, 'Subscribed to push notifications successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Unsubscribe from push notifications
 */
const unsubscribeFromPush = async (req, res, next) => {
  try {
    const result = await notificationService.unsubscribeFromPush(req.admin?.adminId);

    return successResponse(res, result, 'Unsubscribed from push notifications successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Test notification (send test notification to self)
 */
const sendTest = async (req, res, next) => {
  try {
    const notification = await notificationService.create({
      admin_id: req.admin?.adminId,
      title: 'Test Notification',
      message: 'This is a test notification to verify that notifications are working correctly.',
      type: 'system',
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatNotification(notification), 'Test notification sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification templates
 */
const getTemplates = async (req, res, next) => {
  try {
    const templates = await notificationService.getTemplates();
    return successResponse(res, templates, 'Notification templates retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create notification from template
 */
const createFromTemplate = async (req, res, next) => {
  try {
    const { template_id, templateId, user_ids, userIds, ids, variables } = req.body;
    const tId = template_id || templateId;
    const idList = user_ids || userIds || ids;

    if (!tId) {
      return errorResponse(res, 'Template ID is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await notificationService.createFromTemplate({
      template_id: tId,
      user_ids: idList,
      variables,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, result, 'Notifications created from template successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule notification
 */
const schedule = async (req, res, next) => {
  try {
    const {
      title, message, type,
      user_ids, userIds, ids,
      send_to_all, sendToAll,
      scheduled_at, scheduledAt,
      action_url, actionUrl,
      data,
    } = req.body;

    const scheduleTime = scheduled_at || scheduledAt;

    if (!title || !message || !scheduleTime) {
      return errorResponse(res, 'Title, message, and scheduled_at are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const scheduledDate = new Date(scheduleTime);
    if (scheduledDate <= new Date()) {
      return errorResponse(res, 'Scheduled date must be in the future', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await notificationService.schedule({
      title,
      message,
      type,
      user_ids: user_ids || userIds || ids,
      send_to_all: (send_to_all ?? sendToAll) === 'true' || (send_to_all ?? sendToAll) === true,
      scheduled_at: scheduledDate,
      action_url: action_url || actionUrl,
      data,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, result, 'Notification scheduled successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get scheduled notifications
 */
const getScheduled = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getScheduled({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, result, 'Scheduled notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel scheduled notification
 */
const cancelScheduled = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await notificationService.cancelScheduled(id);

    if (!result) {
      return errorResponse(res, 'Scheduled notification not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, result, 'Scheduled notification cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cleanup old notifications
 */
const cleanup = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const result = await notificationService.cleanup({
      days: parseInt(days),
    });

    return successResponse(res, result, `${result.deleted} old notifications deleted`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getUnreadCount,
  getRecent,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  markMultipleAsRead,
  remove,
  removeAll,
  removeRead,
  bulkDelete,
  getByType,
  create,
  sendToAllUsers,
  sendToUsers,
  sendToAllAdmins,
  getUserNotifications,
  getStatistics,
  getPreferences,
  updatePreferences,
  subscribeToPush,
  unsubscribeFromPush,
  sendTest,
  getTemplates,
  createFromTemplate,
  schedule,
  getScheduled,
  cancelScheduled,
  cleanup,
  VALID_TYPES,
};