/**
 * Routes Index
 * @module routes
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const subcategoryRoutes = require('./subcategory.routes');
const orderRoutes = require('./order.routes');
const userRoutes = require('./user.routes');
const messageRoutes = require('./message.routes');
const reviewRoutes = require('./review.routes');
// DEPRECATED: variant, color, size routes removed in Phase 6 (Dec 28, 2025)
// Use /api/product-options and /api/option-combinations instead
const imageRoutes = require('./image.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const billingRoutes = require('./billing.routes');
const settingsRoutes = require('./settings.routes');
const productOptionRoutes = require('./productOption.routes');
// REMOVED: productOptionCombinationRoutes - combinations system deprecated (Dec 28, 2025)
const dataMigrationRoutes = require('./dataMigration.routes');
const billImageRoutes = require('./billImage.routes');
const testRoutes = require('./test.routes');
const publicRoutes = require('./public.routes');

// Phase 2 - New modules
const customerBillRoutes = require('./customerBill.routes');
const customerDebtRoutes = require('./customerDebt.routes');
const workerRoutes = require('./worker.routes');
const traderRoutes = require('./trader.routes');
const wholesalerRoutes = require('./wholesaler.routes');

// API Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'VinaShop Admin API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to VinaShop Admin API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      admins: '/api/admins',
      products: '/api/products',
      categories: '/api/categories',
      subcategories: '/api/subcategories',
      orders: '/api/orders',
      users: '/api/users',
      messages: '/api/messages',
      reviews: '/api/reviews',
      images: '/api/images',
      notifications: '/api/notifications',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      billing: '/api/billing',
      settings: '/api/settings',
      productOptions: '/api/product-options',
      // REMOVED: optionCombinations - deprecated (Dec 28, 2025)
      billImages: '/api/bill-images',
      public: '/api/public',
      migration: '/api/migration',
      // Phase 2 - New endpoints
      customerBills: '/api/customer-bills',
      customerDebts: '/api/customer-debts',
      workers: '/api/workers',
      traders: '/api/traders',
      wholesalers: '/api/wholesalers',
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/admins', adminRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);
router.use('/reviews', reviewRoutes);
// DEPRECATED: /variants, /colors, /sizes routes removed (Phase 6)
router.use('/images', imageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/billing', billingRoutes);
router.use('/settings', settingsRoutes);
router.use('/product-options', productOptionRoutes);
// REMOVED: /option-combinations route - deprecated (Dec 28, 2025)
router.use('/migration', dataMigrationRoutes);
router.use('/bill-images', billImageRoutes);
router.use('/test', testRoutes);
router.use('/public', publicRoutes);

// Phase 2 - New routes
router.use('/customer-bills', customerBillRoutes);
router.use('/customer-debts', customerDebtRoutes);
router.use('/workers', workerRoutes);
router.use('/traders', traderRoutes);
router.use('/wholesalers', wholesalerRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

module.exports = router;