/**
 * Image Routes
 * Routes for image management
 */

const express = require('express');
const router = express.Router();
const imageController = require('../controllers/image.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');
const { 
  productImageUpload, 
  categoryImageUpload, 
  subcategoryImageUpload,
  userAvatarUpload,
  bannerImageUpload,
  tempUpload 
} = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/images/statistics
 * @desc    Get image statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('products', 'read'),
  imageController.getStatistics
);

/**
 * @route   GET /api/images/banners
 * @desc    Get all banners
 * @access  Private
 */
router.get('/banners', imageController.getBanners);

/**
 * @route   GET /api/images/product/:productId
 * @desc    Get product images
 * @access  Private
 */
router.get('/product/:productId', imageController.getProductImages);

/**
 * @route   GET /api/images/:id
 * @desc    Get image by ID
 * @access  Private
 */
router.get('/:id', imageController.getById);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/images/product/:productId
 * @desc    Upload product image
 * @access  Private (Admin)
 */
router.post(
  '/product/:productId',
  checkPermission('products', 'update'),
  productImageUpload.single('image'),
  imageController.uploadProductImage
);

/**
 * @route   POST /api/images/product/:productId/multiple
 * @desc    Upload multiple product images
 * @access  Private (Admin)
 */
router.post(
  '/product/:productId/multiple',
  checkPermission('products', 'update'),
  productImageUpload.array('images', 10),
  imageController.uploadMultipleProductImages
);

/**
 * @route   POST /api/images/category/:categoryId
 * @desc    Upload category image
 * @access  Private (Admin)
 */
router.post(
  '/category/:categoryId',
  checkPermission('categories', 'update'),
  categoryImageUpload.single('image'),
  imageController.uploadCategoryImage
);

/**
 * @route   POST /api/images/subcategory/:subcategoryId
 * @desc    Upload subcategory image
 * @access  Private (Admin)
 */
router.post(
  '/subcategory/:subcategoryId',
  checkPermission('subcategories', 'update'),
  subcategoryImageUpload.single('image'),
  imageController.uploadSubcategoryImage
);

/**
 * @route   POST /api/images/user/:userId/avatar
 * @desc    Upload user avatar
 * @access  Private (Admin)
 */
router.post(
  '/user/:userId/avatar',
  checkPermission('users', 'update'),
  userAvatarUpload.single('avatar'),
  imageController.uploadUserAvatar
);

/**
 * @route   POST /api/images/banner
 * @desc    Upload banner image
 * @access  Private (Admin)
 */
router.post(
  '/banner',
  checkPermission('settings', 'update'),
  bannerImageUpload.single('image'),
  imageController.uploadBannerImage
);

/**
 * @route   POST /api/images/temp
 * @desc    Upload temporary image
 * @access  Private (Admin)
 */
router.post(
  '/temp',
  tempUpload.single('image'),
  imageController.uploadTempImage
);

/**
 * @route   POST /api/images/temp/move
 * @desc    Move temp image to permanent location
 * @access  Private (Admin)
 */
router.post(
  '/temp/move',
  imageController.moveTempImage
);

/**
 * @route   POST /api/images/:id/optimize
 * @desc    Optimize image
 * @access  Private (Admin)
 */
router.post(
  '/:id/optimize',
  checkPermission('products', 'update'),
  imageController.optimizeImage
);

/**
 * @route   POST /api/images/:id/thumbnail
 * @desc    Generate thumbnail
 * @access  Private (Admin)
 */
router.post(
  '/:id/thumbnail',
  checkPermission('products', 'update'),
  imageController.generateThumbnail
);

/**
 * @route   POST /api/images/cleanup
 * @desc    Cleanup unused images
 * @access  Private (Admin)
 */
router.post(
  '/cleanup',
  checkPermission('settings', 'update'),
  imageController.cleanupUnusedImages
);

/**
 * @route   POST /api/images/bulk/delete
 * @desc    Bulk delete images
 * @access  Private (Admin)
 */
router.post(
  '/bulk/delete',
  checkPermission('products', 'delete'),
  imageController.bulkDelete
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/images/:id
 * @desc    Update image
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('products', 'update'),
  imageController.update
);

/**
 * @route   PUT /api/images/:id/replace
 * @desc    Replace image
 * @access  Private (Admin)
 */
router.put(
  '/:id/replace',
  checkPermission('products', 'update'),
  productImageUpload.single('image'),
  imageController.replaceImage
);

/**
 * @route   PUT /api/images/banners/:id
 * @desc    Update banner
 * @access  Private (Admin)
 */
router.put(
  '/banners/:id',
  checkPermission('settings', 'update'),
  imageController.updateBanner
);

/**
 * @route   PUT /api/images/display-order
 * @desc    Update display order
 * @access  Private (Admin)
 */
router.put(
  '/display-order',
  checkPermission('products', 'update'),
  imageController.updateDisplayOrder
);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/images/:id/primary
 * @desc    Set image as primary
 * @access  Private (Admin)
 */
router.patch(
  '/:id/primary',
  checkPermission('products', 'update'),
  imageController.setPrimary
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/images/:id
 * @desc    Delete image
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('products', 'delete'),
  imageController.remove
);

/**
 * @route   DELETE /api/images/product/:productId
 * @desc    Delete all product images
 * @access  Private (Admin)
 */
router.delete(
  '/product/:productId',
  checkPermission('products', 'delete'),
  imageController.deleteProductImages
);

/**
 * @route   DELETE /api/images/banners/:id
 * @desc    Delete banner
 * @access  Private (Admin)
 */
router.delete(
  '/banners/:id',
  checkPermission('settings', 'update'),
  imageController.deleteBanner
);

module.exports = router;