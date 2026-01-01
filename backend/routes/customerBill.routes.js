/**
 * Customer Bill Routes
 * Routes for customer bill management
 */

const express = require('express');
const router = express.Router();
const customerBillController = require('../controllers/customerBill.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/customer-bills
 * @desc    Get all customer bills with pagination
 * @access  Private
 */
router.get('/', customerBillController.getAll);

/**
 * @route   GET /api/customer-bills/statistics
 * @desc    Get customer bill statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('billing', 'read'),
  customerBillController.getStatistics
);

/**
 * @route   GET /api/customer-bills/user/:userId
 * @desc    Get bills by user
 * @access  Private
 */
router.get('/user/:userId', customerBillController.getByUser);

/**
 * @route   GET /api/customer-bills/:id
 * @desc    Get customer bill by ID
 * @access  Private
 */
router.get('/:id', customerBillController.getById);

/**
 * @route   GET /api/customer-bills/:id/print
 * @desc    Get print data for bill
 * @access  Private
 */
router.get(
  '/:id/print',
  checkPermission('billing', 'read'),
  customerBillController.getPrintData
);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/customer-bills
 * @desc    Create new customer bill
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('billing', 'create'),
  customerBillController.create
);

/**
 * @route   POST /api/customer-bills/from-order/:orderId
 * @desc    Create bill from existing order
 * @access  Private (Admin)
 */
router.post(
  '/from-order/:orderId',
  checkPermission('billing', 'create'),
  customerBillController.createFromOrder
);

/**
 * @route   POST /api/customer-bills/:id/items
 * @desc    Add item to bill
 * @access  Private (Admin)
 */
router.post(
  '/:id/items',
  checkPermission('billing', 'update'),
  customerBillController.addItem
);

/**
 * @route   POST /api/customer-bills/:id/payment
 * @desc    Record payment on bill
 * @access  Private (Admin)
 */
router.post(
  '/:id/payment',
  checkPermission('billing', 'update'),
  customerBillController.recordPayment
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/customer-bills/:id
 * @desc    Update customer bill
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('billing', 'update'),
  customerBillController.update
);

/**
 * @route   PUT /api/customer-bills/:id/items/:itemId
 * @desc    Update bill item
 * @access  Private (Admin)
 */
router.put(
  '/:id/items/:itemId',
  checkPermission('billing', 'update'),
  customerBillController.updateItem
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/customer-bills/:id
 * @desc    Delete customer bill
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('billing', 'delete'),
  customerBillController.remove
);

/**
 * @route   DELETE /api/customer-bills/:id/items/:itemId
 * @desc    Remove item from bill
 * @access  Private (Admin)
 */
router.delete(
  '/:id/items/:itemId',
  checkPermission('billing', 'update'),
  customerBillController.removeItem
);

module.exports = router;
