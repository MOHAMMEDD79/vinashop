/**
 * Color Routes
 * Routes for color management
 *
 * @deprecated These routes are deprecated and will be removed in a future version.
 * Colors are now managed as option values through /api/product-options.
 * The new system stores colors in product_option_values table with type_id for "Color" type.
 *
 * Migration Guide:
 * - GET /api/colors -> GET /api/product-options/types/:colorTypeId/values
 * - POST /api/colors -> POST /api/product-options/types/:colorTypeId/values
 * - Colors now support hex_code, image_url fields in product_option_values
 */

const express = require('express');
const router = express.Router();
const colorController = require('../controllers/color.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// Deprecation warning middleware
router.use((req, res, next) => {
  res.set('X-Deprecated', 'true');
  res.set('X-Deprecated-Message', 'This API is deprecated. Use /api/product-options instead.');
  next();
});

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/colors
 * @desc    Get all colors with pagination
 * @access  Private
 */
router.get('/', colorController.getAll);

/**
 * @route   GET /api/colors/list
 * @desc    Get all colors as simple list
 * @access  Private
 */
router.get('/list', colorController.getAllList);

/**
 * @route   GET /api/colors/statistics
 * @desc    Get color statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('products', 'read'),
  colorController.getStatistics
);

/**
 * @route   GET /api/colors/popular
 * @desc    Get popular colors
 * @access  Private
 */
router.get('/popular', colorController.getPopularColors);

/**
 * @route   GET /api/colors/search
 * @desc    Search colors
 * @access  Private
 */
router.get('/search', colorController.search);

/**
 * @route   GET /api/colors/:id
 * @desc    Get color by ID
 * @access  Private
 */
router.get('/:id', colorController.getById);

/**
 * @route   GET /api/colors/:id/products
 * @desc    Get products by color
 * @access  Private
 */
router.get('/:id/products', colorController.getProductsByColor);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/colors
 * @desc    Create new color
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('products', 'create'),
  colorController.create
);

/**
 * @route   POST /api/colors/bulk/update
 * @desc    Bulk update colors
 * @access  Private (Admin)
 */
router.post(
  '/bulk/update',
  checkPermission('products', 'update'),
  colorController.bulkUpdate
);

/**
 * @route   POST /api/colors/bulk/delete
 * @desc    Bulk delete colors
 * @access  Private (Admin)
 */
router.post(
  '/bulk/delete',
  checkPermission('products', 'delete'),
  colorController.bulkDelete
);

/**
 * @route   POST /api/colors/export
 * @desc    Export colors to Excel
 * @access  Private (Admin)
 */
router.post(
  '/export',
  checkPermission('products', 'read'),
  colorController.exportToExcel
);

/**
 * @route   POST /api/colors/import
 * @desc    Import colors from Excel
 * @access  Private (Admin)
 */
router.post(
  '/import',
  checkPermission('products', 'create'),
  colorController.importFromExcel
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/colors/:id
 * @desc    Update color
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('products', 'update'),
  colorController.update
);

/**
 * @route   PUT /api/colors/display-order
 * @desc    Update display order
 * @access  Private (Admin)
 */
router.put(
  '/display-order',
  checkPermission('products', 'update'),
  colorController.updateDisplayOrder
);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/colors/:id/status
 * @desc    Toggle color status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/status',
  checkPermission('products', 'update'),
  colorController.toggleStatus
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/colors/:id
 * @desc    Delete color
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('products', 'delete'),
  colorController.remove
);

module.exports = router;