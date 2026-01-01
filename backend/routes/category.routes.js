/**
 * Category Routes
 * @module routes/category
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination
 * @access  Private
 */
router.get(
  '/',
  checkPermission('categories', 'read'),
  categoryController.getAll
);

/**
 * @route   GET /api/categories/list
 * @desc    Get all categories for dropdown
 * @access  Private
 */
router.get('/list', categoryController.getAllList);

/**
 * @route   GET /api/categories/tree
 * @desc    Get category tree with subcategories
 * @access  Private
 */
router.get('/tree', categoryController.getTree);

/**
 * @route   GET /api/categories/statistics
 * @desc    Get category statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('categories', 'read'),
  categoryController.getStatistics
);

/**
 * @route   GET /api/categories/featured
 * @desc    Get featured categories
 * @access  Private
 */
router.get('/featured', categoryController.getFeatured);

/**
 * @route   GET /api/categories/export
 * @desc    Export categories
 * @access  Private
 */
router.get(
  '/export',
  checkPermission('categories', 'read'),
  categoryController.exportToExcel
);

/**
 * @route   GET /api/categories/search
 * @desc    Search categories
 * @access  Private
 */
router.get('/search', categoryController.search);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get(
  '/:id',
  checkPermission('categories', 'read'),
  categoryController.getById
);

/**
 * @route   GET /api/categories/:id/subcategories
 * @desc    Get category with subcategories
 * @access  Private
 */
router.get('/:id/subcategories', categoryController.getCategoryWithSubcategories);

/**
 * @route   GET /api/categories/:id/products
 * @desc    Get category with products
 * @access  Private
 */
router.get('/:id/products', categoryController.getCategoryWithProducts);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private
 */
router.post(
  '/',
  checkPermission('categories', 'create'),
  validate(schemas.category.create),
  categoryController.create
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private
 */
router.put(
  '/:id',
  checkPermission('categories', 'update'),
  validate(schemas.category.update),
  categoryController.update
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private
 */
router.delete(
  '/:id',
  checkPermission('categories', 'delete'),
  categoryController.remove
);

/**
 * @route   PATCH /api/categories/:id/status
 * @desc    Toggle category active status
 * @access  Private
 */
router.patch(
  '/:id/status',
  checkPermission('categories', 'update'),
  categoryController.toggleStatus
);

/**
 * @route   PATCH /api/categories/:id/featured
 * @desc    Toggle category featured status
 * @access  Private
 */
router.patch(
  '/:id/featured',
  checkPermission('categories', 'update'),
  categoryController.toggleFeatured
);

/**
 * @route   POST /api/categories/:id/image
 * @desc    Upload category image
 * @access  Private
 */
router.post(
  '/:id/image',
  checkPermission('categories', 'update'),
  uploadSingle('image'),
  categoryController.updateImage
);

/**
 * @route   DELETE /api/categories/:id/image
 * @desc    Delete category image
 * @access  Private
 */
router.delete(
  '/:id/image',
  checkPermission('categories', 'update'),
  categoryController.removeImage
);

/**
 * @route   PUT /api/categories/:id/display-order
 * @desc    Update category display order
 * @access  Private
 */
router.put(
  '/:id/display-order',
  checkPermission('categories', 'update'),
  categoryController.updateDisplayOrder
);

/**
 * @route   POST /api/categories/:id/duplicate
 * @desc    Duplicate category
 * @access  Private
 */
router.post(
  '/:id/duplicate',
  checkPermission('categories', 'create'),
  categoryController.duplicate
);

/**
 * @route   PUT /api/categories/reorder
 * @desc    Reorder categories
 * @access  Private
 */
router.put(
  '/reorder',
  checkPermission('categories', 'update'),
  categoryController.reorder
);

// ==================== Bulk Operations ====================

/**
 * @route   POST /api/categories/bulk/update
 * @desc    Bulk update categories
 * @access  Private
 */
router.post(
  '/bulk/update',
  checkPermission('categories', 'update'),
  validate(schemas.category.bulkUpdate),
  categoryController.bulkUpdate
);

/**
 * @route   POST /api/categories/bulk/delete
 * @desc    Bulk delete categories
 * @access  Private
 */
router.post(
  '/bulk/delete',
  checkPermission('categories', 'delete'),
  validate(schemas.common.bulkIds),
  categoryController.bulkDelete
);

module.exports = router;