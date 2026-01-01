/**
 * Settings Routes
 * Routes for application settings management
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');
const { settingsUpload } = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Private
 */
router.get(
  '/',
  checkPermission('settings', 'read'),
  settingsController.getAll
);

/**
 * @route   GET /api/settings/general
 * @desc    Get general settings
 * @access  Private
 */
router.get(
  '/general',
  checkPermission('settings', 'read'),
  settingsController.getGeneralSettings
);

/**
 * @route   GET /api/settings/store
 * @desc    Get store settings
 * @access  Private
 */
router.get(
  '/store',
  checkPermission('settings', 'read'),
  settingsController.getStoreSettings
);

/**
 * @route   GET /api/settings/payment
 * @desc    Get payment settings
 * @access  Private
 */
router.get(
  '/payment',
  checkPermission('settings', 'read'),
  settingsController.getPaymentSettings
);

/**
 * @route   GET /api/settings/shipping
 * @desc    Get shipping settings
 * @access  Private
 */
router.get(
  '/shipping',
  checkPermission('settings', 'read'),
  settingsController.getShippingSettings
);

/**
 * @route   GET /api/settings/tax
 * @desc    Get tax settings
 * @access  Private
 */
router.get(
  '/tax',
  checkPermission('settings', 'read'),
  settingsController.getTaxSettings
);

/**
 * @route   GET /api/settings/email
 * @desc    Get email settings
 * @access  Private
 */
router.get(
  '/email',
  checkPermission('settings', 'read'),
  settingsController.getEmailSettings
);

/**
 * @route   GET /api/settings/notification
 * @desc    Get notification settings
 * @access  Private
 */
router.get(
  '/notification',
  checkPermission('settings', 'read'),
  settingsController.getNotificationSettings
);

/**
 * @route   GET /api/settings/security
 * @desc    Get security settings
 * @access  Private
 */
router.get(
  '/security',
  checkPermission('settings', 'read'),
  settingsController.getSecuritySettings
);

/**
 * @route   GET /api/settings/appearance
 * @desc    Get appearance settings
 * @access  Private
 */
router.get(
  '/appearance',
  checkPermission('settings', 'read'),
  settingsController.getAppearanceSettings
);

/**
 * @route   GET /api/settings/social
 * @desc    Get social settings
 * @access  Private
 */
router.get(
  '/social',
  checkPermission('settings', 'read'),
  settingsController.getSocialSettings
);

/**
 * @route   GET /api/settings/seo
 * @desc    Get SEO settings
 * @access  Private
 */
router.get(
  '/seo',
  checkPermission('settings', 'read'),
  settingsController.getSeoSettings
);

/**
 * @route   GET /api/settings/maintenance
 * @desc    Get maintenance settings
 * @access  Private
 */
router.get(
  '/maintenance',
  checkPermission('settings', 'read'),
  settingsController.getMaintenanceSettings
);

/**
 * @route   GET /api/settings/backup
 * @desc    Get backup settings
 * @access  Private
 */
router.get(
  '/backup',
  checkPermission('settings', 'read'),
  settingsController.getBackupSettings
);

/**
 * @route   GET /api/settings/backups
 * @desc    Get all backups
 * @access  Private
 */
router.get(
  '/backups',
  checkPermission('settings', 'read'),
  settingsController.getBackups
);

/**
 * @route   GET /api/settings/backups/:id/download
 * @desc    Download backup
 * @access  Private
 */
router.get(
  '/backups/:id/download',
  checkPermission('settings', 'read'),
  settingsController.downloadBackup
);

/**
 * @route   GET /api/settings/change-log
 * @desc    Get settings change log
 * @access  Private
 */
router.get(
  '/change-log',
  checkPermission('settings', 'read'),
  settingsController.getChangeLog
);

/**
 * @route   GET /api/settings/system-info
 * @desc    Get system info
 * @access  Private
 */
router.get(
  '/system-info',
  checkPermission('settings', 'read'),
  settingsController.getSystemInfo
);

/**
 * @route   GET /api/settings/group/:group
 * @desc    Get settings by group
 * @access  Private
 */
router.get(
  '/group/:group',
  checkPermission('settings', 'read'),
  settingsController.getByGroup
);

/**
 * @route   GET /api/settings/:key
 * @desc    Get setting by key
 * @access  Private
 */
router.get(
  '/:key',
  checkPermission('settings', 'read'),
  settingsController.getByKey
);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/settings/email/test
 * @desc    Test email settings
 * @access  Private
 */
router.post(
  '/email/test',
  checkPermission('settings', 'update'),
  settingsController.testEmailSettings
);

/**
 * @route   POST /api/settings/logo
 * @desc    Upload logo
 * @access  Private
 */
router.post(
  '/logo',
  checkPermission('settings', 'update'),
  settingsUpload.single('logo'),
  settingsController.uploadLogo
);

/**
 * @route   POST /api/settings/favicon
 * @desc    Upload favicon
 * @access  Private
 */
router.post(
  '/favicon',
  checkPermission('settings', 'update'),
  settingsUpload.single('favicon'),
  settingsController.uploadFavicon
);

/**
 * @route   POST /api/settings/backups
 * @desc    Create backup
 * @access  Private
 */
router.post(
  '/backups',
  checkPermission('settings', 'update'),
  settingsController.createBackup
);

/**
 * @route   POST /api/settings/backups/:id/restore
 * @desc    Restore backup
 * @access  Private
 */
router.post(
  '/backups/:id/restore',
  checkPermission('settings', 'update'),
  settingsController.restoreBackup
);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to defaults
 * @access  Private
 */
router.post(
  '/reset',
  checkPermission('settings', 'update'),
  settingsController.resetToDefaults
);

/**
 * @route   POST /api/settings/export
 * @desc    Export settings
 * @access  Private
 */
router.post(
  '/export',
  checkPermission('settings', 'read'),
  settingsController.exportSettings
);

/**
 * @route   POST /api/settings/import
 * @desc    Import settings
 * @access  Private
 */
router.post(
  '/import',
  checkPermission('settings', 'update'),
  settingsController.importSettings
);

/**
 * @route   POST /api/settings/clear-cache
 * @desc    Clear cache
 * @access  Private
 */
router.post(
  '/clear-cache',
  checkPermission('settings', 'update'),
  settingsController.clearCache
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/settings
 * @desc    Update multiple settings
 * @access  Private
 */
router.put(
  '/',
  checkPermission('settings', 'update'),
  settingsController.updateMultiple
);

/**
 * @route   PUT /api/settings/general
 * @desc    Update general settings
 * @access  Private
 */
router.put(
  '/general',
  checkPermission('settings', 'update'),
  settingsController.updateGeneralSettings
);

/**
 * @route   PUT /api/settings/store
 * @desc    Update store settings
 * @access  Private
 */
router.put(
  '/store',
  checkPermission('settings', 'update'),
  settingsController.updateStoreSettings
);

/**
 * @route   PUT /api/settings/payment
 * @desc    Update payment settings
 * @access  Private
 */
router.put(
  '/payment',
  checkPermission('settings', 'update'),
  settingsController.updatePaymentSettings
);

/**
 * @route   PUT /api/settings/shipping
 * @desc    Update shipping settings
 * @access  Private
 */
router.put(
  '/shipping',
  checkPermission('settings', 'update'),
  settingsController.updateShippingSettings
);

/**
 * @route   PUT /api/settings/tax
 * @desc    Update tax settings
 * @access  Private
 */
router.put(
  '/tax',
  checkPermission('settings', 'update'),
  settingsController.updateTaxSettings
);

/**
 * @route   PUT /api/settings/email
 * @desc    Update email settings
 * @access  Private
 */
router.put(
  '/email',
  checkPermission('settings', 'update'),
  settingsController.updateEmailSettings
);

/**
 * @route   PUT /api/settings/notification
 * @desc    Update notification settings
 * @access  Private
 */
router.put(
  '/notification',
  checkPermission('settings', 'update'),
  settingsController.updateNotificationSettings
);

/**
 * @route   PUT /api/settings/security
 * @desc    Update security settings
 * @access  Private
 */
router.put(
  '/security',
  checkPermission('settings', 'update'),
  settingsController.updateSecuritySettings
);

/**
 * @route   PUT /api/settings/appearance
 * @desc    Update appearance settings
 * @access  Private
 */
router.put(
  '/appearance',
  checkPermission('settings', 'update'),
  settingsController.updateAppearanceSettings
);

/**
 * @route   PUT /api/settings/social
 * @desc    Update social settings
 * @access  Private
 */
router.put(
  '/social',
  checkPermission('settings', 'update'),
  settingsController.updateSocialSettings
);

/**
 * @route   PUT /api/settings/seo
 * @desc    Update SEO settings
 * @access  Private
 */
router.put(
  '/seo',
  checkPermission('settings', 'update'),
  settingsController.updateSeoSettings
);

/**
 * @route   PUT /api/settings/maintenance
 * @desc    Update maintenance settings
 * @access  Private
 */
router.put(
  '/maintenance',
  checkPermission('settings', 'update'),
  settingsController.updateMaintenanceSettings
);

/**
 * @route   PUT /api/settings/backup
 * @desc    Update backup settings
 * @access  Private
 */
router.put(
  '/backup',
  checkPermission('settings', 'update'),
  settingsController.updateBackupSettings
);

/**
 * @route   PUT /api/settings/:key
 * @desc    Update single setting
 * @access  Private
 */
router.put(
  '/:key',
  checkPermission('settings', 'update'),
  settingsController.update
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/settings/backups/:id
 * @desc    Delete backup
 * @access  Private
 */
router.delete(
  '/backups/:id',
  checkPermission('settings', 'delete'),
  settingsController.deleteBackup
);

module.exports = router;