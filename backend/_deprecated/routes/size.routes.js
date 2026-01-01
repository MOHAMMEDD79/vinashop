/**
 * Size Routes
 * Routes for size management
 *
 * @deprecated These routes are deprecated and will be removed in a future version.
 * Sizes are now managed as option values through /api/product-options.
 * The new system stores sizes in product_option_values table with type_id for "Size" type.
 *
 * Migration Guide:
 * - GET /api/sizes -> GET /api/product-options/types/:sizeTypeId/values
 * - POST /api/sizes -> POST /api/product-options/types/:sizeTypeId/values
 * - Sizes support multilingual names (value_en, value_ar, value_he)
 */

const express = require('express');
const router = express.Router();
const sizeController = require('../controllers/size.controller');
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
 * @route   GET /api/sizes
 * @desc    Get all sizes with pagination
 * @access  Private
 */
router.get('/', sizeController.getAll);

/**
 * @route   GET /api/sizes/list
 * @desc    Get all sizes as simple list
 * @access  Private
 */
router.get('/list', sizeController.getAllList);

/**
 * @route   GET /api/sizes/statistics
 * @desc    Get size statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('products', 'read'),
  sizeController.getStatistics
);

/**
 * @route   GET /api/sizes/popular
 * @desc    Get popular sizes
 * @access  Private
 */
router.get('/popular', sizeController.getPopularSizes);

/**
 * @route   GET /api/sizes/search
 * @desc    Search sizes
 * @access  Private
 */
router.get('/search', sizeController.search);

/**
 * @route   GET /api/sizes/:id
 * @desc    Get size by ID
 * @access  Private
 */
router.get('/:id', sizeController.getById);

/**
 * @route   GET /api/sizes/:id/products
 * @desc    Get products by size
 * @access  Private
 */
router.get('/:id/products', sizeController.getProductsBySize);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/sizes
 * @desc    Create new size
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('products', 'create'),
  sizeController.create
);

/**
 * @route   POST /api/sizes/bulk/update
 * @desc    Bulk update sizes
 * @access  Private (Admin)
 */
router.post(
  '/bulk/update',
  checkPermission('products', 'update'),
  sizeController.bulkUpdate
);

/**
 * @route   POST /api/sizes/bulk/delete
 * @desc    Bulk delete sizes
 * @access  Private (Admin)
 */
router.post(
  '/bulk/delete',
  checkPermission('products', 'delete'),
  sizeController.bulkDelete
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/sizes/:id
 * @desc    Update size
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('products', 'update'),
  sizeController.update
);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/sizes/:id/status
 * @desc    Toggle size status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/status',
  checkPermission('products', 'update'),
  sizeController.toggleStatus
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/sizes/:id
 * @desc    Delete size
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('products', 'delete'),
  sizeController.remove
);

module.exports = router;
