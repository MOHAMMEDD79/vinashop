/**
 * Wholesaler Routes
 * Routes for wholesaler management
 */

const express = require('express');
const router = express.Router();
const wholesalerController = require('../controllers/wholesaler.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/wholesalers
 * @desc    Get all wholesalers
 * @access  Private
 */
router.get('/', wholesalerController.getAll);

/**
 * @route   GET /api/wholesalers/statistics
 * @desc    Get wholesaler statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('billing', 'read'),
  wholesalerController.getStatistics
);

/**
 * @route   GET /api/wholesalers/:id
 * @desc    Get wholesaler by ID
 * @access  Private
 */
router.get('/:id', wholesalerController.getById);

/**
 * @route   GET /api/wholesalers/:id/orders
 * @desc    Get wholesaler orders
 * @access  Private
 */
router.get('/:id/orders', wholesalerController.getOrders);

/**
 * @route   GET /api/wholesalers/:id/payments
 * @desc    Get wholesaler payments
 * @access  Private
 */
router.get('/:id/payments', wholesalerController.getPayments);

/**
 * @route   GET /api/wholesalers/:id/balance
 * @desc    Get wholesaler balance
 * @access  Private
 */
router.get('/:id/balance', wholesalerController.getBalance);

/**
 * @route   GET /api/wholesalers/orders/:orderId
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/orders/:orderId', wholesalerController.getOrderById);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/wholesalers
 * @desc    Create wholesaler
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('billing', 'create'),
  wholesalerController.create
);

/**
 * @route   POST /api/wholesalers/:id/orders
 * @desc    Create order for wholesaler
 * @access  Private (Admin)
 */
router.post(
  '/:id/orders',
  checkPermission('billing', 'create'),
  wholesalerController.createOrder
);

/**
 * @route   POST /api/wholesalers/orders/:orderId/items
 * @desc    Add item to order
 * @access  Private (Admin)
 */
router.post(
  '/orders/:orderId/items',
  checkPermission('billing', 'update'),
  wholesalerController.addOrderItem
);

/**
 * @route   POST /api/wholesalers/:id/payment
 * @desc    Record payment
 * @access  Private (Admin)
 */
router.post(
  '/:id/payment',
  checkPermission('billing', 'update'),
  wholesalerController.recordPayment
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/wholesalers/:id
 * @desc    Update wholesaler
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('billing', 'update'),
  wholesalerController.update
);

/**
 * @route   PUT /api/wholesalers/orders/:orderId
 * @desc    Update order
 * @access  Private (Admin)
 */
router.put(
  '/orders/:orderId',
  checkPermission('billing', 'update'),
  wholesalerController.updateOrder
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/wholesalers/:id
 * @desc    Delete wholesaler
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('billing', 'delete'),
  wholesalerController.remove
);

/**
 * @route   DELETE /api/wholesalers/orders/:orderId
 * @desc    Delete order
 * @access  Private (Admin)
 */
router.delete(
  '/orders/:orderId',
  checkPermission('billing', 'delete'),
  wholesalerController.deleteOrder
);

module.exports = router;
