/**
 * Product Routes
 * @module routes/product
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { productImageUpload } = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with pagination and filters
 * @access  Private
 */
router.get('/', checkPermission('products', 'read'), productController.getAll);

/**
 * @route   GET /api/v1/products/statistics
 * @desc    Get product statistics
 * @access  Private
 */
router.get('/statistics', checkPermission('products', 'read'), productController.getStatistics);

/**
 * @route   GET /api/v1/products/featured
 * @desc    Get featured products
 * @access  Private
 */
router.get('/featured', productController.getFeatured);

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    Get low stock products
 * @access  Private
 */
router.get('/low-stock', productController.getLowStock);

/**
 * @route   GET /api/v1/products/out-of-stock
 * @desc    Get out of stock products
 * @access  Private
 */
router.get('/out-of-stock', productController.getOutOfStock);

/**
 * @route   GET /api/v1/products/search
 * @desc    Search products
 * @access  Private
 */
router.get('/search', productController.search);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get('/:id', checkPermission('products', 'read'), productController.getById);

/**
 * @route   GET /api/v1/products/:id/related
 * @desc    Get related products
 * @access  Private
 */
router.get('/:id/related', productController.getRelated);

/**
 * @route   GET /api/v1/products/:id/images
 * @desc    Get product images
 * @access  Private
 */
router.get('/:id/images', productController.getImages);

/**
 * @route   GET /api/v1/products/:id/colors
 * @desc    Get product colors
 * @access  Private
 */
router.get('/:id/colors', productController.getColors);

/**
 * @route   GET /api/v1/products/:id/sizes
 * @desc    Get product sizes
 * @access  Private
 */
router.get('/:id/sizes', productController.getSizes);

/**
 * @route   GET /api/v1/products/:id/variants
 * @desc    Get product variants
 * @access  Private
 */
router.get('/:id/variants', productController.getVariants);

/**
 * @route   GET /api/v1/products/:id/reviews
 * @desc    Get product reviews
 * @access  Private
 */
router.get('/:id/reviews', productController.getReviews);

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Private
 */
router.post(
  '/',
  checkPermission('products', 'create'),
  validate(schemas.product.create),
  productController.create
);

/**
 * @route   POST /api/v1/products/:id/images
 * @desc    Upload product images
 * @access  Private
 */
router.post(
  '/:id/images',
  checkPermission('products', 'update'),
  productImageUpload.array('images', 10),
  productController.uploadImages
);

/**
 * @route   POST /api/v1/products/:id/variants
 * @desc    Create product variant
 * @access  Private
 */
router.post('/:id/variants', checkPermission('products', 'update'), productController.createVariant);

/**
 * @route   POST /api/v1/products/:id/duplicate
 * @desc    Duplicate product
 * @access  Private
 */
router.post('/:id/duplicate', checkPermission('products', 'create'), productController.duplicate);

/**
 * @route   POST /api/v1/products/bulk/update
 * @desc    Bulk update products
 * @access  Private
 */
router.post('/bulk/update', checkPermission('products', 'update'), productController.bulkUpdate);

/**
 * @route   POST /api/v1/products/bulk/delete
 * @desc    Bulk delete products
 * @access  Private
 */
router.post('/bulk/delete', checkPermission('products', 'delete'), productController.bulkDelete);

/**
 * @route   POST /api/v1/products/bulk/stock
 * @desc    Bulk update stock
 * @access  Private
 */
router.post('/bulk/stock', checkPermission('products', 'update'), productController.bulkUpdateStock);

/**
 * @route   POST /api/v1/products/export
 * @desc    Export products to Excel
 * @access  Private
 */
router.post('/export', checkPermission('products', 'read'), productController.exportToExcel);

/**
 * @route   POST /api/v1/products/import
 * @desc    Import products from Excel
 * @access  Private
 */
router.post('/import', checkPermission('products', 'create'), productController.importFromExcel);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private
 */
router.put(
  '/:id',
  checkPermission('products', 'update'),
  validate(schemas.product.update),
  productController.update
);

/**
 * @route   PUT /api/v1/products/:id/colors
 * @desc    Update product colors
 * @access  Private
 */
router.put('/:id/colors', checkPermission('products', 'update'), productController.updateColors);

/**
 * @route   PUT /api/v1/products/:id/sizes
 * @desc    Update product sizes
 * @access  Private
 */
router.put('/:id/sizes', checkPermission('products', 'update'), productController.updateSizes);

/**
 * @route   PUT /api/v1/products/:id/variants/:variantId
 * @desc    Update product variant
 * @access  Private
 */
router.put('/:id/variants/:variantId', checkPermission('products', 'update'), productController.updateVariant);

/**
 * @route   PUT /api/v1/products/:id/images/order
 * @desc    Update images order
 * @access  Private
 */
router.put('/:id/images/order', checkPermission('products', 'update'), productController.updateImagesOrder);

/**
 * @route   PATCH /api/v1/products/:id/status
 * @desc    Toggle product status
 * @access  Private
 */
router.patch('/:id/status', checkPermission('products', 'update'), productController.toggleStatus);

/**
 * @route   PATCH /api/v1/products/:id/featured
 * @desc    Toggle product featured
 * @access  Private
 */
router.patch('/:id/featured', checkPermission('products', 'update'), productController.toggleFeatured);

/**
 * @route   PATCH /api/v1/products/:id/stock
 * @desc    Update product stock
 * @access  Private
 */
router.patch('/:id/stock', checkPermission('products', 'update'), productController.updateStock);

/**
 * @route   PATCH /api/v1/products/:id/images/:imageId/primary
 * @desc    Set primary image
 * @access  Private
 */
router.patch('/:id/images/:imageId/primary', checkPermission('products', 'update'), productController.setPrimaryImage);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Private
 */
router.delete('/:id', checkPermission('products', 'delete'), productController.remove);

/**
 * @route   DELETE /api/v1/products/:id/images/:imageId
 * @desc    Delete product image
 * @access  Private
 */
router.delete('/:id/images/:imageId', checkPermission('products', 'update'), productController.deleteImage);

/**
 * @route   DELETE /api/v1/products/:id/variants/:variantId
 * @desc    Delete product variant
 * @access  Private
 */
router.delete('/:id/variants/:variantId', checkPermission('products', 'update'), productController.deleteVariant);

module.exports = router;