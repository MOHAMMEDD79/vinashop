/**
 * Data Migration Controller
 * @module controllers/dataMigration
 *
 * Handles data migration from variant system to options system
 */

const dataMigrationService = require('../services/dataMigration.service');

/**
 * Run full migration
 */
const runMigration = async (req, res) => {
  try {
    console.log('Starting data migration...');

    const results = await dataMigrationService.runFullMigration();

    res.json({
      success: true,
      message: 'Migration completed',
      data: results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Migration failed',
    });
  }
};

/**
 * Get migration status
 */
const getStatus = async (req, res) => {
  try {
    const status = await dataMigrationService.getMigrationStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get migration status',
    });
  }
};

/**
 * Rollback migration
 */
const rollback = async (req, res) => {
  try {
    const result = await dataMigrationService.rollback();

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Rollback failed',
    });
  }
};

/**
 * Migrate colors only
 */
const migrateColors = async (req, res) => {
  try {
    const count = await dataMigrationService.migrateColors();

    res.json({
      success: true,
      message: `Migrated ${count} colors`,
      data: { colorsMigrated: count },
    });
  } catch (error) {
    console.error('Color migration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Color migration failed',
    });
  }
};

/**
 * Migrate sizes only
 */
const migrateSizes = async (req, res) => {
  try {
    const count = await dataMigrationService.migrateSizes();

    res.json({
      success: true,
      message: `Migrated ${count} sizes`,
      data: { sizesMigrated: count },
    });
  } catch (error) {
    console.error('Size migration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Size migration failed',
    });
  }
};

/**
 * Migrate variants only
 */
const migrateVariants = async (req, res) => {
  try {
    const count = await dataMigrationService.migrateVariants();

    res.json({
      success: true,
      message: `Migrated ${count} variants`,
      data: { variantsMigrated: count },
    });
  } catch (error) {
    console.error('Variant migration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Variant migration failed',
    });
  }
};

module.exports = {
  runMigration,
  getStatus,
  rollback,
  migrateColors,
  migrateSizes,
  migrateVariants,
};
