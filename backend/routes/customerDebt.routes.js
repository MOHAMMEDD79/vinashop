/**
 * Customer Debt Routes
 * Routes for customer debt management
 */

const express = require('express');
const router = express.Router();
const customerDebtController = require('../controllers/customerDebt.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/customer-debts
 * @desc    Get all customer debts with pagination
 * @access  Private
 */
router.get('/', customerDebtController.getAll);

/**
 * @route   GET /api/customer-debts/statistics
 * @desc    Get debt statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('billing', 'read'),
  customerDebtController.getStatistics
);

/**
 * @route   GET /api/customer-debts/overdue
 * @desc    Get overdue debts
 * @access  Private
 */
router.get('/overdue', customerDebtController.getOverdue);

/**
 * @route   GET /api/customer-debts/customers
 * @desc    Get customers with debt
 * @access  Private
 */
router.get('/customers', customerDebtController.getCustomersWithDebt);

/**
 * @route   GET /api/customer-debts/user/:userId
 * @desc    Get debts by user
 * @access  Private
 */
router.get('/user/:userId', customerDebtController.getByUser);

/**
 * @route   GET /api/customer-debts/user/:userId/summary
 * @desc    Get user debt summary
 * @access  Private
 */
router.get('/user/:userId/summary', customerDebtController.getUserSummary);

/**
 * @route   GET /api/customer-debts/:id
 * @desc    Get customer debt by ID
 * @access  Private
 */
router.get('/:id', customerDebtController.getById);

/**
 * @route   GET /api/customer-debts/:id/payments
 * @desc    Get payment history for a debt
 * @access  Private
 */
router.get('/:id/payments', customerDebtController.getPayments);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/customer-debts
 * @desc    Create new customer debt
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('billing', 'create'),
  customerDebtController.create
);

/**
 * @route   POST /api/customer-debts/:id/payment
 * @desc    Record payment on debt
 * @access  Private (Admin)
 */
router.post(
  '/:id/payment',
  checkPermission('billing', 'update'),
  customerDebtController.recordPayment
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/customer-debts/:id
 * @desc    Update customer debt
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('billing', 'update'),
  customerDebtController.update
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/customer-debts/:id
 * @desc    Delete customer debt
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('billing', 'delete'),
  customerDebtController.remove
);

module.exports = router;
