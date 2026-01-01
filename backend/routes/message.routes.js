/**
 * Message Routes
 * Routes for message/contact form management
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/messages
 * @desc    Get all messages with pagination
 * @access  Private
 */
router.get('/', checkPermission('messages', 'read'), messageController.getAll);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread-count', messageController.getUnreadCount);

/**
 * @route   GET /api/messages/statistics
 * @desc    Get message statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('messages', 'read'),
  messageController.getStatistics
);

/**
 * @route   GET /api/messages/recent
 * @desc    Get recent messages
 * @access  Private
 */
router.get('/recent', messageController.getRecent);

/**
 * @route   GET /api/messages/search
 * @desc    Search messages
 * @access  Private
 */
router.get('/search', checkPermission('messages', 'read'), messageController.search);

/**
 * @route   GET /api/messages/archived
 * @desc    Get archived messages
 * @access  Private
 */
router.get('/archived', checkPermission('messages', 'read'), messageController.getArchived);

/**
 * @route   GET /api/messages/assigned-to-me
 * @desc    Get messages assigned to current admin
 * @access  Private
 */
router.get('/assigned-to-me', messageController.getAssignedToMe);

/**
 * @route   GET /api/messages/status/:status
 * @desc    Get messages by status
 * @access  Private
 */
router.get('/status/:status', checkPermission('messages', 'read'), messageController.getByStatus);

/**
 * @route   GET /api/messages/email/:email
 * @desc    Get messages by email
 * @access  Private
 */
router.get('/email/:email', checkPermission('messages', 'read'), messageController.getByEmail);

/**
 * @route   GET /api/messages/:id
 * @desc    Get message by ID
 * @access  Private
 */
router.get('/:id', checkPermission('messages', 'read'), messageController.getById);

/**
 * @route   GET /api/messages/:id/replies
 * @desc    Get message replies
 * @access  Private
 */
router.get('/:id/replies', checkPermission('messages', 'read'), messageController.getReplies);

/**
 * @route   GET /api/messages/:id/notes
 * @desc    Get message notes
 * @access  Private
 */
router.get('/:id/notes', checkPermission('messages', 'read'), messageController.getNotes);

/**
 * @route   GET /api/messages/:id/thread
 * @desc    Get message thread
 * @access  Private
 */
router.get('/:id/thread', checkPermission('messages', 'read'), messageController.getThread);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/messages/:id/reply
 * @desc    Reply to message
 * @access  Private (Admin)
 */
router.post(
  '/:id/reply',
  checkPermission('messages', 'update'),
  messageController.reply
);

/**
 * @route   POST /api/messages/:id/notes
 * @desc    Add note to message
 * @access  Private (Admin)
 */
router.post(
  '/:id/notes',
  checkPermission('messages', 'update'),
  messageController.addNote
);

/**
 * @route   POST /api/messages/bulk/delete
 * @desc    Bulk delete messages
 * @access  Private (Admin)
 */
router.post(
  '/bulk/delete',
  checkPermission('messages', 'delete'),
  messageController.bulkDelete
);

/**
 * @route   POST /api/messages/bulk/status
 * @desc    Bulk update message status
 * @access  Private (Admin)
 */
router.post(
  '/bulk/status',
  checkPermission('messages', 'update'),
  messageController.bulkUpdateStatus
);

/**
 * @route   POST /api/messages/bulk/read
 * @desc    Mark multiple messages as read
 * @access  Private (Admin)
 */
router.post(
  '/bulk/read',
  checkPermission('messages', 'update'),
  messageController.markMultipleAsRead
);

/**
 * @route   POST /api/messages/mark-all-read
 * @desc    Mark all messages as read
 * @access  Private (Admin)
 */
router.post(
  '/mark-all-read',
  checkPermission('messages', 'update'),
  messageController.markAllAsRead
);

/**
 * @route   POST /api/messages/export
 * @desc    Export messages to Excel
 * @access  Private (Admin)
 */
router.post(
  '/export',
  checkPermission('messages', 'read'),
  messageController.exportToExcel
);

// ==================== PUT/PATCH ROUTES ====================

/**
 * @route   PUT /api/messages/:id/status
 * @desc    Update message status
 * @access  Private (Admin)
 */
router.put(
  '/:id/status',
  checkPermission('messages', 'update'),
  messageController.updateStatus
);

/**
 * @route   PATCH /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private (Admin)
 */
router.patch(
  '/:id/read',
  checkPermission('messages', 'update'),
  messageController.markAsRead
);

/**
 * @route   PATCH /api/messages/:id/unread
 * @desc    Mark message as unread
 * @access  Private (Admin)
 */
router.patch(
  '/:id/unread',
  checkPermission('messages', 'update'),
  messageController.markAsUnread
);

/**
 * @route   PATCH /api/messages/:id/assign
 * @desc    Assign message to admin
 * @access  Private (Admin)
 */
router.patch(
  '/:id/assign',
  checkPermission('messages', 'update'),
  messageController.assignToAdmin
);

/**
 * @route   PATCH /api/messages/:id/archive
 * @desc    Archive message
 * @access  Private (Admin)
 */
router.patch(
  '/:id/archive',
  checkPermission('messages', 'update'),
  messageController.archive
);

/**
 * @route   PATCH /api/messages/:id/restore
 * @desc    Restore archived message
 * @access  Private (Admin)
 */
router.patch(
  '/:id/restore',
  checkPermission('messages', 'update'),
  messageController.restore
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete message
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('messages', 'delete'),
  messageController.remove
);

module.exports = router;