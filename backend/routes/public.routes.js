/**
 * Public Routes
 * @module routes/public
 * @description Routes for public (storefront) endpoints - NO authentication required
 */

const express = require('express');
const router = express.Router();
const PublicController = require('../controllers/public.controller');

/**
 * @route GET /api/public/homepage
 * @desc Get homepage data (banners, featured, new arrivals, categories)
 * @access Public
 */
router.get('/homepage', PublicController.getHomepageData);

/**
 * @route GET /api/public/products
 * @desc Get products with filters and pagination
 * @access Public
 */
router.get('/products', PublicController.getProducts);

/**
 * @route GET /api/public/products/featured
 * @desc Get featured products
 * @access Public
 */
router.get('/products/featured', PublicController.getFeaturedProducts);

/**
 * @route GET /api/public/products/new-arrivals
 * @desc Get new arrivals
 * @access Public
 */
router.get('/products/new-arrivals', PublicController.getNewArrivals);

/**
 * @route GET /api/public/products/:id
 * @desc Get single product by ID
 * @access Public
 */
router.get('/products/:id', PublicController.getProductById);

/**
 * @route GET /api/public/products/:id/related
 * @desc Get related products
 * @access Public
 */
router.get('/products/:id/related', PublicController.getRelatedProducts);

/**
 * @route POST /api/public/products/:id/reviews
 * @desc Submit a product review
 * @access Public
 */
router.post('/products/:id/reviews', PublicController.submitReview);

/**
 * @route GET /api/public/categories
 * @desc Get all categories with subcategories
 * @access Public
 */
router.get('/categories', PublicController.getCategories);

/**
 * @route GET /api/public/categories/:id
 * @desc Get category by ID
 * @access Public
 */
router.get('/categories/:id', PublicController.getCategoryById);

/**
 * @route GET /api/public/categories/:id/products
 * @desc Get products by category
 * @access Public
 */
router.get('/categories/:id/products', PublicController.getProductsByCategory);

/**
 * @route GET /api/public/subcategories/:id
 * @desc Get subcategory by ID with nested subcategories
 * @access Public
 */
router.get('/subcategories/:id', PublicController.getSubcategoryById);

/**
 * @route GET /api/public/subcategories/:id/products
 * @desc Get products by subcategory
 * @access Public
 */
router.get('/subcategories/:id/products', PublicController.getProductsBySubcategory);

/**
 * @route GET /api/public/banners
 * @desc Get active banners
 * @access Public
 */
router.get('/banners', PublicController.getBanners);

/**
 * @route GET /api/public/banners/:id/media
 * @desc Get banner media (image/video) directly
 * @access Public
 */
router.get('/banners/:id/media', PublicController.getBannerMedia);

/**
 * @route GET /api/public/settings
 * @desc Get public store settings
 * @access Public
 */
router.get('/settings', PublicController.getStoreSettings);

/**
 * @route GET /api/public/filters
 * @desc Get available filter options (colors, sizes)
 * @access Public
 */
router.get('/filters', PublicController.getFilterOptions);

/**
 * @route GET /api/public/filters/colors
 * @desc Get available colors
 * @access Public
 */
router.get('/filters/colors', PublicController.getColors);

/**
 * @route GET /api/public/filters/sizes
 * @desc Get available sizes
 * @access Public
 */
router.get('/filters/sizes', PublicController.getSizes);

/**
 * @route GET /api/public/filters/options
 * @desc Get all option types with values for dynamic filtering
 * @access Public
 */
router.get('/filters/options', PublicController.getOptionFilters);

/**
 * @route GET /api/public/filters/options/:categoryId
 * @desc Get filterable options for a specific category
 * @access Public
 */
router.get('/filters/options/:categoryId', PublicController.getOptionFiltersByCategory);

/**
 * @route POST /api/public/orders
 * @desc Create guest order
 * @access Public
 */
router.post('/orders', PublicController.createOrder);

/**
 * @route POST /api/public/contact
 * @desc Submit contact message
 * @access Public
 */
router.post('/contact', PublicController.submitContact);

module.exports = router;
