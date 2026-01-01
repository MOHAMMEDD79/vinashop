/**
 * Admin Routes
 * @module routes/admin
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { checkPermission, superAdminOnly } = require('../middleware/admin.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { adminAvatarUpload } = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/admins
 * @desc    Get all admins with pagination
 * @access  Private (Super Admin, Admin)
 */
router.get(
  '/',
  checkPermission('admins', 'read'),
  adminController.getAll
);

/**
 * @route   GET /api/v1/admins/roles
 * @desc    Get available roles
 * @access  Private
 */
router.get('/roles', adminController.getRoles);

/**
 * @route   GET /api/v1/admins/roles/:role/permissions
 * @desc    Get permissions for a role
 * @access  Private
 */
router.get('/roles/:role/permissions', adminController.getRolePermissions);

/**
 * @route   GET /api/v1/admins/online
 * @desc    Get online admins
 * @access  Private (Super Admin)
 */
router.get('/online', superAdminOnly, adminController.getOnlineAdmins);

/**
 * @route   GET /api/v1/admins/statistics
 * @desc    Get admin statistics
 * @access  Private (Super Admin)
 */
router.get('/statistics', superAdminOnly, adminController.getStatistics);

/**
 * @route   GET /api/v1/admins/activity-log
 * @desc    Get all admin activity logs
 * @access  Private (Super Admin)
 */
router.get('/activity-log', superAdminOnly, adminController.getActivityLog);

/**
 * @route   GET /api/v1/admins/:id
 * @desc    Get admin by ID
 * @access  Private (Super Admin, Admin)
 */
router.get(
  '/:id',
  checkPermission('admins', 'read'),
  adminController.getById
);

/**
 * @route   POST /api/v1/admins
 * @desc    Create new admin
 * @access  Private (Super Admin)
 */
router.post(
  '/',
  superAdminOnly,
  validate(schemas.admin.create),
  adminController.create
);

/**
 * @route   PUT /api/v1/admins/:id
 * @desc    Update admin
 * @access  Private (Super Admin)
 */
router.put(
  '/:id',
  superAdminOnly,
  validate(schemas.admin.update),
  adminController.update
);

/**
 * @route   DELETE /api/v1/admins/:id
 * @desc    Delete admin
 * @access  Private (Super Admin)
 */
router.delete('/:id', superAdminOnly, adminController.remove);

/**
 * @route   PATCH /api/v1/admins/:id/status
 * @desc    Toggle admin status
 * @access  Private (Super Admin)
 */
router.patch('/:id/status', superAdminOnly, adminController.toggleStatus);

/**
 * @route   PUT /api/v1/admins/:id/password
 * @desc    Reset admin password
 * @access  Private (Super Admin)
 */
router.put(
  '/:id/password',
  superAdminOnly,
  validate(schemas.admin.resetPassword),
  adminController.resetPassword
);

/**
 * @route   POST /api/v1/admins/:id/avatar
 * @desc    Upload admin avatar
 * @access  Private (Super Admin or self)
 */
router.post(
  '/:id/avatar',
  adminAvatarUpload.single('avatar'),
  adminController.uploadAvatar
);

/**
 * @route   DELETE /api/v1/admins/:id/avatar
 * @desc    Delete admin avatar
 * @access  Private (Super Admin or self)
 */
router.delete('/:id/avatar', adminController.removeAvatar);

/**
 * @route   POST /api/v1/admins/check-permission
 * @desc    Check if current admin has permission
 * @access  Private
 */
router.post('/check-permission', adminController.checkPermission);

module.exports = router;