/**
 * Dashboard Routes
 * @module routes/dashboard
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard overview
 * @access  Private
 */
router.get('/', dashboardController.getOverview);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview
 * @access  Private
 */
router.get('/overview', dashboardController.getOverview);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard stats (alias for overview)
 * @access  Private
 */
router.get('/stats', dashboardController.getOverview);

/**
 * @route   GET /api/dashboard/today
 * @desc    Get today's statistics
 * @access  Private
 */
router.get('/today', dashboardController.getTodayStats);

/**
 * @route   GET /api/dashboard/realtime
 * @desc    Get real-time statistics
 * @access  Private
 */
router.get('/realtime', dashboardController.getRealTimeStats);

/**
 * @route   GET /api/dashboard/comparison
 * @desc    Get period comparison
 * @access  Private
 */
router.get('/comparison', dashboardController.getPeriodComparison);

// ==================== Sales ====================

/**
 * @route   GET /api/dashboard/sales
 * @desc    Get sales statistics
 * @access  Private
 */
router.get('/sales', dashboardController.getSalesStats);

/**
 * @route   GET /api/dashboard/sales/by-hour
 * @desc    Get sales by hour
 * @access  Private
 */
router.get('/sales/by-hour', dashboardController.getSalesByHour);

/**
 * @route   GET /api/dashboard/sales/by-day
 * @desc    Get sales by day of week
 * @access  Private
 */
router.get('/sales/by-day', dashboardController.getSalesByDayOfWeek);

// ==================== Revenue ====================

/**
 * @route   GET /api/dashboard/revenue
 * @desc    Get revenue chart data
 * @access  Private
 */
router.get('/revenue', dashboardController.getRevenueChart);

/**
 * @route   GET /api/dashboard/revenue/chart
 * @desc    Get revenue chart data
 * @access  Private
 */
router.get('/revenue/chart', dashboardController.getRevenueChart);

// ==================== Orders ====================

/**
 * @route   GET /api/dashboard/orders
 * @desc    Get order statistics
 * @access  Private
 */
router.get('/orders', dashboardController.getOrdersStats);

/**
 * @route   GET /api/dashboard/orders/recent
 * @desc    Get recent orders
 * @access  Private
 */
router.get('/orders/recent', dashboardController.getRecentOrders);

/**
 * @route   GET /api/dashboard/orders/pending
 * @desc    Get pending orders count
 * @access  Private
 */
router.get('/orders/pending', dashboardController.getPendingOrdersCount);

/**
 * @route   GET /api/dashboard/orders/by-status
 * @desc    Get orders by status
 * @access  Private
 */
router.get('/orders/by-status', dashboardController.getOrdersByStatus);

/**
 * @route   GET /api/dashboard/orders/by-payment
 * @desc    Get orders by payment method
 * @access  Private
 */
router.get('/orders/by-payment', dashboardController.getOrdersByPaymentMethod);

/**
 * @route   GET /api/dashboard/orders/chart
 * @desc    Get orders chart data
 * @access  Private
 */
router.get('/orders/chart', dashboardController.getOrdersChart);

/**
 * @route   GET /api/dashboard/orders/aov
 * @desc    Get average order value
 * @access  Private
 */
router.get('/orders/aov', dashboardController.getAverageOrderValue);

// ==================== Products ====================

/**
 * @route   GET /api/dashboard/products
 * @desc    Get product performance
 * @access  Private
 */
router.get('/products', dashboardController.getProductPerformance);

/**
 * @route   GET /api/dashboard/products/top
 * @desc    Get top selling products
 * @access  Private
 */
router.get('/products/top', dashboardController.getTopProducts);

/**
 * @route   GET /api/dashboard/products/low-stock
 * @desc    Get low stock products
 * @access  Private
 */
router.get('/products/low-stock', dashboardController.getLowStockProducts);

/**
 * @route   GET /api/dashboard/products/out-of-stock
 * @desc    Get out of stock products
 * @access  Private
 */
router.get('/products/out-of-stock', dashboardController.getOutOfStockProducts);

// ==================== Users ====================

/**
 * @route   GET /api/dashboard/users
 * @desc    Get customer analytics
 * @access  Private
 */
router.get('/users', dashboardController.getCustomerAnalytics);

/**
 * @route   GET /api/dashboard/users/recent
 * @desc    Get recent users
 * @access  Private
 */
router.get('/users/recent', dashboardController.getRecentUsers);

/**
 * @route   GET /api/dashboard/users/top
 * @desc    Get top customers
 * @access  Private
 */
router.get('/users/top', dashboardController.getTopCustomers);

/**
 * @route   GET /api/dashboard/users/growth
 * @desc    Get user growth chart
 * @access  Private
 */
router.get('/users/growth', dashboardController.getUsersGrowthChart);

/**
 * @route   GET /api/dashboard/users/conversion
 * @desc    Get conversion rate
 * @access  Private
 */
router.get('/users/conversion', dashboardController.getConversionRate);

// ==================== Categories ====================

/**
 * @route   GET /api/dashboard/categories
 * @desc    Get top categories
 * @access  Private
 */
router.get('/categories', dashboardController.getTopCategories);

/**
 * @route   GET /api/dashboard/categories/top
 * @desc    Get top categories by sales
 * @access  Private
 */
router.get('/categories/top', dashboardController.getTopCategories);

// ==================== Reviews ====================

/**
 * @route   GET /api/dashboard/reviews/pending
 * @desc    Get pending reviews count
 * @access  Private
 */
router.get('/reviews/pending', dashboardController.getPendingReviewsCount);

// ==================== Messages ====================

/**
 * @route   GET /api/dashboard/messages/unread
 * @desc    Get unread messages count
 * @access  Private
 */
router.get('/messages/unread', dashboardController.getUnreadMessagesCount);

// ==================== Inventory ====================

/**
 * @route   GET /api/dashboard/inventory
 * @desc    Get inventory summary
 * @access  Private
 */
router.get('/inventory', dashboardController.getInventorySummary);

// ==================== Activity ====================

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get activity feed
 * @access  Private
 */
router.get('/activity', dashboardController.getActivityFeed);

// ==================== Notifications ====================

/**
 * @route   GET /api/dashboard/notifications
 * @desc    Get notifications summary
 * @access  Private
 */
router.get('/notifications', dashboardController.getNotificationsSummary);

// ==================== Geography ====================

/**
 * @route   GET /api/dashboard/cities
 * @desc    Get top cities by orders
 * @access  Private
 */
router.get('/cities', dashboardController.getTopCities);

// ==================== System ====================

/**
 * @route   GET /api/dashboard/health
 * @desc    Get system health
 * @access  Private
 */
router.get('/health', dashboardController.getSystemHealth);

/**
 * @route   POST /api/dashboard/refresh
 * @desc    Refresh dashboard cache
 * @access  Private
 */
router.post('/refresh', dashboardController.refreshCache);

// ==================== Export ====================

/**
 * @route   GET /api/dashboard/export
 * @desc    Export dashboard report
 * @access  Private
 */
router.get('/export', dashboardController.exportDashboardReport);

// ==================== Widgets ====================

/**
 * @route   GET /api/dashboard/widget/:type
 * @desc    Get specific widget data
 * @access  Private
 */
router.get('/widget/:type', dashboardController.getWidgetData);

module.exports = router;