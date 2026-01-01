/**
 * User Routes
 * Routes for user management
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');
const { userAvatarUpload } = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination
 * @access  Private
 */
router.get('/', checkPermission('users', 'read'), userController.getAll);

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('users', 'read'),
  userController.getStatistics
);

/**
 * @route   GET /api/users/recent
 * @desc    Get recent users
 * @access  Private
 */
router.get('/recent', checkPermission('users', 'read'), userController.getRecent);

/**
 * @route   GET /api/users/top-customers
 * @desc    Get top customers
 * @access  Private
 */
router.get('/top-customers', checkPermission('users', 'read'), userController.getTopCustomers);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search', checkPermission('users', 'read'), userController.search);

/**
 * @route   GET /api/users/email/:email
 * @desc    Get user by email
 * @access  Private
 */
router.get('/email/:email', checkPermission('users', 'read'), userController.getByEmail);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', checkPermission('users', 'read'), userController.getById);

/**
 * @route   GET /api/users/:id/orders
 * @desc    Get user orders
 * @access  Private
 */
router.get('/:id/orders', checkPermission('users', 'read'), userController.getUserOrders);

/**
 * @route   GET /api/users/:id/reviews
 * @desc    Get user reviews
 * @access  Private
 */
router.get('/:id/reviews', checkPermission('users', 'read'), userController.getUserReviews);

/**
 * @route   GET /api/users/:id/wishlist
 * @desc    Get user wishlist
 * @access  Private
 */
router.get('/:id/wishlist', checkPermission('users', 'read'), userController.getUserWishlist);

/**
 * @route   GET /api/users/:id/cart
 * @desc    Get user cart
 * @access  Private
 */
router.get('/:id/cart', checkPermission('users', 'read'), userController.getUserCart);

/**
 * @route   GET /api/users/:id/addresses
 * @desc    Get user addresses
 * @access  Private
 */
router.get('/:id/addresses', checkPermission('users', 'read'), userController.getUserAddresses);

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity
 * @access  Private
 */
router.get('/:id/activity', checkPermission('users', 'read'), userController.getUserActivity);

/**
 * @route   GET /api/users/:id/statistics
 * @desc    Get individual user statistics
 * @access  Private
 */
router.get('/:id/statistics', checkPermission('users', 'read'), userController.getUserStatistics);

/**
 * @route   GET /api/users/:id/login-history
 * @desc    Get user login history
 * @access  Private
 */
router.get('/:id/login-history', checkPermission('users', 'read'), userController.getLoginHistory);

/**
 * @route   GET /api/users/:id/notes
 * @desc    Get user notes
 * @access  Private
 */
router.get('/:id/notes', checkPermission('users', 'read'), userController.getNotes);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('users', 'create'),
  userController.create
);

/**
 * @route   POST /api/users/:id/avatar
 * @desc    Upload user avatar
 * @access  Private (Admin)
 */
router.post(
  '/:id/avatar',
  checkPermission('users', 'update'),
  userAvatarUpload.single('avatar'),
  userController.uploadAvatar
);

/**
 * @route   POST /api/users/:id/verify-email
 * @desc    Verify user email
 * @access  Private (Admin)
 */
router.post(
  '/:id/verify-email',
  checkPermission('users', 'update'),
  userController.verifyEmail
);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin)
 */
router.post(
  '/:id/reset-password',
  checkPermission('users', 'update'),
  userController.resetPassword
);

/**
 * @route   POST /api/users/:id/notification
 * @desc    Send notification to user
 * @access  Private (Admin)
 */
router.post(
  '/:id/notification',
  checkPermission('users', 'update'),
  userController.sendNotification
);

/**
 * @route   POST /api/users/:id/email
 * @desc    Send email to user
 * @access  Private (Admin)
 */
router.post(
  '/:id/email',
  checkPermission('users', 'update'),
  userController.sendEmail
);

/**
 * @route   POST /api/users/:id/impersonate
 * @desc    Impersonate user
 * @access  Private (Admin)
 */
router.post(
  '/:id/impersonate',
  checkPermission('users', 'update'),
  userController.impersonate
);

/**
 * @route   POST /api/users/:id/notes
 * @desc    Add note to user
 * @access  Private (Admin)
 */
router.post(
  '/:id/notes',
  checkPermission('users', 'update'),
  userController.addNote
);

/**
 * @route   POST /api/users/bulk/update
 * @desc    Bulk update users
 * @access  Private (Admin)
 */
router.post(
  '/bulk/update',
  checkPermission('users', 'update'),
  userController.bulkUpdate
);

/**
 * @route   POST /api/users/bulk/delete
 * @desc    Bulk delete users
 * @access  Private (Admin)
 */
router.post(
  '/bulk/delete',
  checkPermission('users', 'delete'),
  userController.bulkDelete
);

/**
 * @route   POST /api/users/export
 * @desc    Export users to Excel
 * @access  Private (Admin)
 */
router.post(
  '/export',
  checkPermission('users', 'read'),
  userController.exportToExcel
);

/**
 * @route   POST /api/users/import
 * @desc    Import users from Excel
 * @access  Private (Admin)
 */
router.post(
  '/import',
  checkPermission('users', 'create'),
  userController.importFromExcel
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('users', 'update'),
  userController.update
);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status
 * @access  Private (Admin)
 */
router.put(
  '/:id/status',
  checkPermission('users', 'update'),
  userController.updateStatus
);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    Toggle user status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/toggle-status',
  checkPermission('users', 'update'),
  userController.toggleStatus
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('users', 'delete'),
  userController.remove
);

/**
 * @route   DELETE /api/users/:id/avatar
 * @desc    Remove user avatar
 * @access  Private (Admin)
 */
router.delete(
  '/:id/avatar',
  checkPermission('users', 'update'),
  userController.removeAvatar
);

/**
 * @route   DELETE /api/users/:id/notes/:noteId
 * @desc    Delete user note
 * @access  Private (Admin)
 */
router.delete(
  '/:id/notes/:noteId',
  checkPermission('users', 'update'),
  userController.deleteNote
);

module.exports = router;