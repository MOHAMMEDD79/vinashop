/**
 * Notification Routes
 * Routes for notification management
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
router.get('/', notificationController.getAll);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/recent
 * @desc    Get recent notifications
 * @access  Private
 */
router.get('/recent', notificationController.getRecent);

/**
 * @route   GET /api/notifications/statistics
 * @desc    Get notification statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('notifications', 'read'),
  notificationController.getStatistics
);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * @route   GET /api/notifications/templates
 * @desc    Get notification templates
 * @access  Private
 */
router.get(
  '/templates',
  checkPermission('notifications', 'read'),
  notificationController.getTemplates
);

/**
 * @route   GET /api/notifications/scheduled
 * @desc    Get scheduled notifications
 * @access  Private
 */
router.get(
  '/scheduled',
  checkPermission('notifications', 'read'),
  notificationController.getScheduled
);

/**
 * @route   GET /api/notifications/type/:type
 * @desc    Get notifications by type
 * @access  Private
 */
router.get('/type/:type', notificationController.getByType);

/**
 * @route   GET /api/notifications/user/:userId
 * @desc    Get user notifications (admin)
 * @access  Private
 */
router.get(
  '/user/:userId',
  checkPermission('notifications', 'read'),
  notificationController.getUserNotifications
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', notificationController.getById);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/notifications
 * @desc    Create notification
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('notifications', 'create'),
  notificationController.create
);

/**
 * @route   POST /api/notifications/send-to-all-users
 * @desc    Send notification to all users
 * @access  Private (Admin)
 */
router.post(
  '/send-to-all-users',
  checkPermission('notifications', 'create'),
  notificationController.sendToAllUsers
);

/**
 * @route   POST /api/notifications/send-to-users
 * @desc    Send notification to specific users
 * @access  Private (Admin)
 */
router.post(
  '/send-to-users',
  checkPermission('notifications', 'create'),
  notificationController.sendToUsers
);

/**
 * @route   POST /api/notifications/send-to-all-admins
 * @desc    Send notification to all admins
 * @access  Private (Admin)
 */
router.post(
  '/send-to-all-admins',
  checkPermission('notifications', 'create'),
  notificationController.sendToAllAdmins
);

/**
 * @route   POST /api/notifications/from-template
 * @desc    Create notification from template
 * @access  Private (Admin)
 */
router.post(
  '/from-template',
  checkPermission('notifications', 'create'),
  notificationController.createFromTemplate
);

/**
 * @route   POST /api/notifications/schedule
 * @desc    Schedule notification
 * @access  Private (Admin)
 */
router.post(
  '/schedule',
  checkPermission('notifications', 'create'),
  notificationController.schedule
);

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification
 * @access  Private (Admin)
 */
router.post(
  '/test',
  checkPermission('notifications', 'create'),
  notificationController.sendTest
);

/**
 * @route   POST /api/notifications/push/subscribe
 * @desc    Subscribe to push notifications
 * @access  Private
 */
router.post('/push/subscribe', notificationController.subscribeToPush);

/**
 * @route   POST /api/notifications/push/unsubscribe
 * @desc    Unsubscribe from push notifications
 * @access  Private
 */
router.post('/push/unsubscribe', notificationController.unsubscribeFromPush);

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/mark-all-read', notificationController.markAllAsRead);

/**
 * @route   POST /api/notifications/mark-multiple-read
 * @desc    Mark multiple notifications as read
 * @access  Private
 */
router.post('/mark-multiple-read', notificationController.markMultipleAsRead);

/**
 * @route   POST /api/notifications/bulk/delete
 * @desc    Bulk delete notifications
 * @access  Private
 */
router.post('/bulk/delete', notificationController.bulkDelete);

/**
 * @route   POST /api/notifications/cleanup
 * @desc    Cleanup old notifications
 * @access  Private (Admin)
 */
router.post(
  '/cleanup',
  checkPermission('notifications', 'delete'),
  notificationController.cleanup
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/preferences', notificationController.updatePreferences);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   PATCH /api/notifications/:id/unread
 * @desc    Mark notification as unread
 * @access  Private
 */
router.patch('/:id/unread', notificationController.markAsUnread);

/**
 * @route   PATCH /api/notifications/scheduled/:id/cancel
 * @desc    Cancel scheduled notification
 * @access  Private (Admin)
 */
router.patch(
  '/scheduled/:id/cancel',
  checkPermission('notifications', 'update'),
  notificationController.cancelScheduled
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', notificationController.remove);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete('/', notificationController.removeAll);

/**
 * @route   DELETE /api/notifications/read
 * @desc    Delete read notifications
 * @access  Private
 */
router.delete('/read', notificationController.removeRead);

module.exports = router;