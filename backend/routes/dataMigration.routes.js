/**
 * Data Migration Routes
 * @module routes/dataMigration
 *
 * Routes for data migration operations
 * WARNING: These routes should only be accessible by super_admin
 */

const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/dataMigration.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { hasRole } = require('../middleware/admin.middleware');

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(hasRole('super_admin'));

// Get migration status
router.get('/status', migrationController.getStatus);

// Run full migration
router.post('/run', migrationController.runMigration);

// Rollback migration
router.post('/rollback', migrationController.rollback);

// Individual migration steps
router.post('/colors', migrationController.migrateColors);
router.post('/sizes', migrationController.migrateSizes);
router.post('/variants', migrationController.migrateVariants);

module.exports = router;
