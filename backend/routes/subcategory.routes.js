/**
 * Subcategory Routes
 * Routes for subcategory management
 */

const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');
const { subcategoryImageUpload } = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/subcategories
 * @desc    Get all subcategories with pagination
 * @access  Private
 */
router.get('/', subcategoryController.getAll);

/**
 * @route   GET /api/subcategories/list
 * @desc    Get all subcategories as simple list
 * @access  Private
 */
router.get('/list', subcategoryController.getAllList);

/**
 * @route   GET /api/subcategories/statistics
 * @desc    Get subcategory statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('subcategories', 'read'),
  subcategoryController.getStatistics
);

/**
 * @route   GET /api/subcategories/featured
 * @desc    Get featured subcategories
 * @access  Private
 */
router.get('/featured', subcategoryController.getFeatured);

/**
 * @route   GET /api/subcategories/search
 * @desc    Search subcategories
 * @access  Private
 */
router.get('/search', subcategoryController.search);

/**
 * @route   GET /api/subcategories/category/:categoryId
 * @desc    Get subcategories by category
 * @access  Private
 */
router.get('/category/:categoryId', subcategoryController.getByCategory);

/**
 * @route   GET /api/subcategories/category/:categoryId/tree
 * @desc    Get subcategory tree for a category (nested structure)
 * @access  Private
 */
router.get('/category/:categoryId/tree', subcategoryController.getTree);

/**
 * @route   GET /api/subcategories/category/:categoryId/roots
 * @desc    Get root subcategories (no parent) for a category
 * @access  Private
 */
router.get('/category/:categoryId/roots', subcategoryController.getRoots);

/**
 * @route   GET /api/subcategories/:id
 * @desc    Get subcategory by ID
 * @access  Private
 */
router.get('/:id', subcategoryController.getById);

/**
 * @route   GET /api/subcategories/:id/children
 * @desc    Get children of a subcategory
 * @access  Private
 */
router.get('/:id/children', subcategoryController.getChildren);

/**
 * @route   GET /api/subcategories/:id/parent-chain
 * @desc    Get parent chain (breadcrumbs) for a subcategory
 * @access  Private
 */
router.get('/:id/parent-chain', subcategoryController.getParentChain);

/**
 * @route   GET /api/subcategories/:id/products
 * @desc    Get subcategory with its products
 * @access  Private
 */
router.get('/:id/products', subcategoryController.getSubcategoryWithProducts);

/**
 * @route   GET /api/subcategories/:id/product-count
 * @desc    Get product count for subcategory
 * @access  Private
 */
router.get('/:id/product-count', subcategoryController.getProductCount);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/subcategories
 * @desc    Create new subcategory
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('subcategories', 'create'),
  subcategoryController.create
);

/**
 * @route   POST /api/subcategories/:id/duplicate
 * @desc    Duplicate subcategory
 * @access  Private (Admin)
 */
router.post(
  '/:id/duplicate',
  checkPermission('subcategories', 'create'),
  subcategoryController.duplicate
);

/**
 * @route   POST /api/subcategories/bulk/update
 * @desc    Bulk update subcategories
 * @access  Private (Admin)
 */
router.post(
  '/bulk/update',
  checkPermission('subcategories', 'update'),
  subcategoryController.bulkUpdate
);

/**
 * @route   POST /api/subcategories/bulk/delete
 * @desc    Bulk delete subcategories
 * @access  Private (Admin)
 */
router.post(
  '/bulk/delete',
  checkPermission('subcategories', 'delete'),
  subcategoryController.bulkDelete
);

/**
 * @route   POST /api/subcategories/export
 * @desc    Export subcategories to Excel
 * @access  Private (Admin)
 */
router.post(
  '/export',
  checkPermission('subcategories', 'read'),
  subcategoryController.exportToExcel
);

/**
 * @route   POST /api/subcategories/import
 * @desc    Import subcategories from Excel
 * @access  Private (Admin)
 */
router.post(
  '/import',
  checkPermission('subcategories', 'create'),
  subcategoryController.importFromExcel
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/subcategories/:id
 * @desc    Update subcategory
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('subcategories', 'update'),
  subcategoryController.update
);

/**
 * @route   PUT /api/subcategories/:id/image
 * @desc    Update subcategory image
 * @access  Private (Admin)
 */
router.put(
  '/:id/image',
  checkPermission('subcategories', 'update'),
  subcategoryImageUpload.single('image'),
  subcategoryController.updateImage
);

/**
 * @route   PUT /api/subcategories/:id/move
 * @desc    Move subcategory to different category
 * @access  Private (Admin)
 */
router.put(
  '/:id/move',
  checkPermission('subcategories', 'update'),
  subcategoryController.moveToCategory
);

/**
 * @route   PUT /api/subcategories/display-order
 * @desc    Update display order of subcategories
 * @access  Private (Admin)
 */
router.put(
  '/display-order',
  checkPermission('subcategories', 'update'),
  subcategoryController.updateDisplayOrder
);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/subcategories/:id/status
 * @desc    Toggle subcategory status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/status',
  checkPermission('subcategories', 'update'),
  subcategoryController.toggleStatus
);

/**
 * @route   PATCH /api/subcategories/:id/featured
 * @desc    Toggle subcategory featured status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/featured',
  checkPermission('subcategories', 'update'),
  subcategoryController.toggleFeatured
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/subcategories/:id
 * @desc    Delete subcategory
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('subcategories', 'delete'),
  subcategoryController.remove
);

/**
 * @route   DELETE /api/subcategories/:id/image
 * @desc    Remove subcategory image
 * @access  Private (Admin)
 */
router.delete(
  '/:id/image',
  checkPermission('subcategories', 'update'),
  subcategoryController.removeImage
);

module.exports = router;