/**
 * Variant Routes
 * Routes for product variant management
 *
 * @deprecated These routes are deprecated and will be removed in a future version.
 * Use /api/option-combinations instead for the new flexible options system.
 * The new system supports unlimited option types (not just color/size) and provides
 * better inventory management through product_option_combinations table.
 *
 * Migration Guide:
 * - GET /api/variants/product/:productId -> GET /api/option-combinations/product/:productId
 * - POST /api/variants -> POST /api/option-combinations
 * - PUT /api/variants/:id -> PUT /api/option-combinations/:id
 * - DELETE /api/variants/:id -> DELETE /api/option-combinations/:id
 */

const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');
const { variantImageUpload } = require('../middleware/upload.middleware');

// Deprecation warning middleware
router.use((req, res, next) => {
  res.set('X-Deprecated', 'true');
  res.set('X-Deprecated-Message', 'This API is deprecated. Use /api/option-combinations instead.');
  next();
});

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/variants
 * @desc    Get all variants with pagination
 * @access  Private
 */
router.get('/', checkPermission('products', 'read'), variantController.getAll);

/**
 * @route   GET /api/variants/statistics
 * @desc    Get variant statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('products', 'read'),
  variantController.getStatistics
);

/**
 * @route   GET /api/variants/low-stock
 * @desc    Get low stock variants
 * @access  Private
 */
router.get('/low-stock', checkPermission('products', 'read'), variantController.getLowStock);

/**
 * @route   GET /api/variants/out-of-stock
 * @desc    Get out of stock variants
 * @access  Private
 */
router.get('/out-of-stock', checkPermission('products', 'read'), variantController.getOutOfStock);

/**
 * @route   GET /api/variants/search
 * @desc    Search variants
 * @access  Private
 */
router.get('/search', checkPermission('products', 'read'), variantController.search);

/**
 * @route   GET /api/variants/sku/:sku
 * @desc    Get variant by SKU
 * @access  Private
 */
router.get('/sku/:sku', variantController.getBySku);

/**
 * @route   GET /api/variants/product/:productId
 * @desc    Get variants by product
 * @access  Private
 */
router.get('/product/:productId', variantController.getByProduct);

/**
 * @route   GET /api/variants/:id
 * @desc    Get variant by ID
 * @access  Private
 */
router.get('/:id', variantController.getById);

/**
 * @route   GET /api/variants/:id/price-history
 * @desc    Get variant price history
 * @access  Private
 */
router.get('/:id/price-history', checkPermission('products', 'read'), variantController.getPriceHistory);

/**
 * @route   GET /api/variants/:id/stock-history
 * @desc    Get variant stock history
 * @access  Private
 */
router.get('/:id/stock-history', checkPermission('products', 'read'), variantController.getStockHistory);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/variants
 * @desc    Create new variant
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('products', 'create'),
  variantController.create
);

/**
 * @route   POST /api/variants/:id/image
 * @desc    Upload variant image
 * @access  Private (Admin)
 */
router.post(
  '/:id/image',
  checkPermission('products', 'update'),
  variantImageUpload.single('image'),
  variantController.uploadImage
);

/**
 * @route   POST /api/variants/:id/duplicate
 * @desc    Duplicate variant
 * @access  Private (Admin)
 */
router.post(
  '/:id/duplicate',
  checkPermission('products', 'create'),
  variantController.duplicate
);

/**
 * @route   POST /api/variants/generate
 * @desc    Generate variants for product
 * @access  Private (Admin)
 */
router.post(
  '/generate',
  checkPermission('products', 'create'),
  variantController.generateVariants
);

/**
 * @route   POST /api/variants/bulk/update
 * @desc    Bulk update variants
 * @access  Private (Admin)
 */
router.post(
  '/bulk/update',
  checkPermission('products', 'update'),
  variantController.bulkUpdate
);

/**
 * @route   POST /api/variants/bulk/delete
 * @desc    Bulk delete variants
 * @access  Private (Admin)
 */
router.post(
  '/bulk/delete',
  checkPermission('products', 'delete'),
  variantController.bulkDelete
);

/**
 * @route   POST /api/variants/bulk/stock
 * @desc    Bulk update stock
 * @access  Private (Admin)
 */
router.post(
  '/bulk/stock',
  checkPermission('products', 'update'),
  variantController.bulkUpdateStock
);

/**
 * @route   POST /api/variants/bulk/prices
 * @desc    Bulk update prices
 * @access  Private (Admin)
 */
router.post(
  '/bulk/prices',
  checkPermission('products', 'update'),
  variantController.bulkUpdatePrices
);

/**
 * @route   POST /api/variants/export
 * @desc    Export variants to Excel
 * @access  Private (Admin)
 */
router.post(
  '/export',
  checkPermission('products', 'read'),
  variantController.exportToExcel
);

/**
 * @route   POST /api/variants/import
 * @desc    Import variants from Excel
 * @access  Private (Admin)
 */
router.post(
  '/import',
  checkPermission('products', 'create'),
  variantController.importFromExcel
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/variants/:id
 * @desc    Update variant
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('products', 'update'),
  variantController.update
);

/**
 * @route   PUT /api/variants/:id/price
 * @desc    Update variant price
 * @access  Private (Admin)
 */
router.put(
  '/:id/price',
  checkPermission('products', 'update'),
  variantController.updatePrice
);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/variants/:id/status
 * @desc    Toggle variant status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/status',
  checkPermission('products', 'update'),
  variantController.toggleStatus
);

/**
 * @route   PATCH /api/variants/:id/default
 * @desc    Set variant as default
 * @access  Private (Admin)
 */
router.patch(
  '/:id/default',
  checkPermission('products', 'update'),
  variantController.setDefault
);

/**
 * @route   PATCH /api/variants/:id/stock
 * @desc    Update variant stock
 * @access  Private (Admin)
 */
router.patch(
  '/:id/stock',
  checkPermission('products', 'update'),
  variantController.updateStock
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/variants/:id
 * @desc    Delete variant
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('products', 'delete'),
  variantController.remove
);

/**
 * @route   DELETE /api/variants/:id/image
 * @desc    Remove variant image
 * @access  Private (Admin)
 */
router.delete(
  '/:id/image',
  checkPermission('products', 'update'),
  variantController.removeImage
);

/**
 * @route   DELETE /api/variants/product/:productId
 * @desc    Delete all variants for product
 * @access  Private (Admin)
 */
router.delete(
  '/product/:productId',
  checkPermission('products', 'delete'),
  variantController.deleteProductVariants
);

module.exports = router;