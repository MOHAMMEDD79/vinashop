/**
 * Report Routes
 * Routes for report generation and management
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/reports/types
 * @desc    Get available report types
 * @access  Private
 */
router.get('/types', reportController.getReportTypes);

/**
 * @route   GET /api/reports/dashboard-summary
 * @desc    Get dashboard summary
 * @access  Private
 */
router.get('/dashboard-summary', reportController.getDashboardSummary);

/**
 * @route   GET /api/reports/sales
 * @desc    Get sales report
 * @access  Private
 */
router.get(
  '/sales',
  checkPermission('reports', 'read'),
  reportController.getSalesReport
);

/**
 * @route   GET /api/reports/orders
 * @desc    Get orders report
 * @access  Private
 */
router.get(
  '/orders',
  checkPermission('reports', 'read'),
  reportController.getOrdersReport
);

/**
 * @route   GET /api/reports/products
 * @desc    Get products report
 * @access  Private
 */
router.get(
  '/products',
  checkPermission('reports', 'read'),
  reportController.getProductsReport
);

/**
 * @route   GET /api/reports/users
 * @desc    Get users report
 * @access  Private
 */
router.get(
  '/users',
  checkPermission('reports', 'read'),
  reportController.getUsersReport
);

/**
 * @route   GET /api/reports/revenue
 * @desc    Get revenue report
 * @access  Private
 */
router.get(
  '/revenue',
  checkPermission('reports', 'read'),
  reportController.getRevenueReport
);

/**
 * @route   GET /api/reports/inventory
 * @desc    Get inventory report
 * @access  Private
 */
router.get(
  '/inventory',
  checkPermission('reports', 'read'),
  reportController.getInventoryReport
);

/**
 * @route   GET /api/reports/categories
 * @desc    Get categories report
 * @access  Private
 */
router.get(
  '/categories',
  checkPermission('reports', 'read'),
  reportController.getCategoriesReport
);

/**
 * @route   GET /api/reports/customers
 * @desc    Get customers report
 * @access  Private
 */
router.get(
  '/customers',
  checkPermission('reports', 'read'),
  reportController.getCustomersReport
);

/**
 * @route   GET /api/reports/geographic
 * @desc    Get geographic report
 * @access  Private
 */
router.get(
  '/geographic',
  checkPermission('reports', 'read'),
  reportController.getGeographicReport
);

/**
 * @route   GET /api/reports/payment-methods
 * @desc    Get payment methods report
 * @access  Private
 */
router.get(
  '/payment-methods',
  checkPermission('reports', 'read'),
  reportController.getPaymentMethodsReport
);

/**
 * @route   GET /api/reports/conversion
 * @desc    Get conversion report
 * @access  Private
 */
router.get(
  '/conversion',
  checkPermission('reports', 'read'),
  reportController.getConversionReport
);

/**
 * @route   GET /api/reports/refunds
 * @desc    Get refunds report
 * @access  Private
 */
router.get(
  '/refunds',
  checkPermission('reports', 'read'),
  reportController.getRefundsReport
);

/**
 * @route   GET /api/reports/discounts
 * @desc    Get discounts report
 * @access  Private
 */
router.get(
  '/discounts',
  checkPermission('reports', 'read'),
  reportController.getDiscountsReport
);

/**
 * @route   GET /api/reports/shipping
 * @desc    Get shipping report
 * @access  Private
 */
router.get(
  '/shipping',
  checkPermission('reports', 'read'),
  reportController.getShippingReport
);

/**
 * @route   GET /api/reports/reviews
 * @desc    Get reviews report
 * @access  Private
 */
router.get(
  '/reviews',
  checkPermission('reports', 'read'),
  reportController.getReviewsReport
);

/**
 * @route   GET /api/reports/abandoned-carts
 * @desc    Get abandoned carts report
 * @access  Private
 */
router.get(
  '/abandoned-carts',
  checkPermission('reports', 'read'),
  reportController.getAbandonedCartsReport
);

/**
 * @route   GET /api/reports/profit-loss
 * @desc    Get profit/loss report
 * @access  Private
 */
router.get(
  '/profit-loss',
  checkPermission('reports', 'read'),
  reportController.getProfitLossReport
);

/**
 * @route   GET /api/reports/tax
 * @desc    Get tax report
 * @access  Private
 */
router.get(
  '/tax',
  checkPermission('reports', 'read'),
  reportController.getTaxReport
);

/**
 * @route   GET /api/reports/comparison
 * @desc    Get comparison report
 * @access  Private
 */
router.get(
  '/comparison',
  checkPermission('reports', 'read'),
  reportController.getComparisonReport
);

/**
 * @route   GET /api/reports/custom
 * @desc    Get custom report
 * @access  Private
 */
router.get(
  '/custom',
  checkPermission('reports', 'read'),
  reportController.getCustomReport
);

/**
 * @route   GET /api/reports/scheduled
 * @desc    Get scheduled reports
 * @access  Private
 */
router.get(
  '/scheduled',
  checkPermission('reports', 'read'),
  reportController.getScheduledReports
);

/**
 * @route   GET /api/reports/saved
 * @desc    Get saved reports
 * @access  Private
 */
router.get(
  '/saved',
  checkPermission('reports', 'read'),
  reportController.getSavedReports
);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/reports/export/pdf
 * @desc    Export report to PDF
 * @access  Private
 */
router.post(
  '/export/pdf',
  checkPermission('reports', 'read'),
  reportController.exportToPdf
);

/**
 * @route   POST /api/reports/export/excel
 * @desc    Export report to Excel
 * @access  Private
 */
router.post(
  '/export/excel',
  checkPermission('reports', 'read'),
  reportController.exportToExcel
);

/**
 * @route   POST /api/reports/export/csv
 * @desc    Export report to CSV
 * @access  Private
 */
router.post(
  '/export/csv',
  checkPermission('reports', 'read'),
  reportController.exportToCsv
);

/**
 * @route   POST /api/reports/schedule
 * @desc    Schedule a report
 * @access  Private
 */
router.post(
  '/schedule',
  checkPermission('reports', 'create'),
  reportController.scheduleReport
);

/**
 * @route   POST /api/reports/save
 * @desc    Save a report
 * @access  Private
 */
router.post(
  '/save',
  checkPermission('reports', 'create'),
  reportController.saveReport
);

/**
 * @route   POST /api/reports/saved/:id/run
 * @desc    Run a saved report
 * @access  Private
 */
router.post(
  '/saved/:id/run',
  checkPermission('reports', 'read'),
  reportController.runSavedReport
);

/**
 * @route   POST /api/reports/email
 * @desc    Email a report
 * @access  Private
 */
router.post(
  '/email',
  checkPermission('reports', 'read'),
  reportController.emailReport
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/reports/scheduled/:id
 * @desc    Update scheduled report
 * @access  Private
 */
router.put(
  '/scheduled/:id',
  checkPermission('reports', 'update'),
  reportController.updateScheduledReport
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/reports/scheduled/:id
 * @desc    Delete scheduled report
 * @access  Private
 */
router.delete(
  '/scheduled/:id',
  checkPermission('reports', 'delete'),
  reportController.deleteScheduledReport
);

/**
 * @route   DELETE /api/reports/saved/:id
 * @desc    Delete saved report
 * @access  Private
 */
router.delete(
  '/saved/:id',
  checkPermission('reports', 'delete'),
  reportController.deleteSavedReport
);

module.exports = router;