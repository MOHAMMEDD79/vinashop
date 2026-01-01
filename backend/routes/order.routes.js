/**
 * Order Routes
 * Routes for order management
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/orders
 * @desc    Get all orders with pagination
 * @access  Private
 */
router.get('/', orderController.getAll);

/**
 * @route   GET /api/orders/statistics
 * @desc    Get order statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('orders', 'read'),
  orderController.getStatistics
);

/**
 * @route   GET /api/orders/recent
 * @desc    Get recent orders
 * @access  Private
 */
router.get('/recent', orderController.getRecent);

/**
 * @route   GET /api/orders/search
 * @desc    Search orders
 * @access  Private
 */
router.get('/search', orderController.search);

/**
 * @route   GET /api/orders/status/:status
 * @desc    Get orders by status
 * @access  Private
 */
router.get('/status/:status', orderController.getByStatus);

/**
 * @route   GET /api/orders/status-count
 * @desc    Get order count by status
 * @access  Private
 */
router.get('/status-count', orderController.getCountByStatus);

/**
 * @route   GET /api/orders/user/:userId
 * @desc    Get orders by user
 * @access  Private
 */
router.get('/user/:userId', orderController.getByUser);

/**
 * @route   GET /api/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Private
 */
router.get('/number/:orderNumber', orderController.getByOrderNumber);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', orderController.getById);

/**
 * @route   GET /api/orders/:id/items
 * @desc    Get order items
 * @access  Private
 */
router.get('/:id/items', orderController.getOrderItems);

/**
 * @route   GET /api/orders/:id/history
 * @desc    Get order history
 * @access  Private
 */
router.get('/:id/history', orderController.getHistory);

/**
 * @route   GET /api/orders/:id/notes
 * @desc    Get order notes
 * @access  Private
 */
router.get('/:id/notes', orderController.getNotes);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private (Admin)
 */
router.post(
  '/',
  checkPermission('orders', 'create'),
  orderController.create
);

/**
 * @route   POST /api/orders/:id/items
 * @desc    Add item to order
 * @access  Private (Admin)
 */
router.post(
  '/:id/items',
  checkPermission('orders', 'update'),
  orderController.addItem
);

/**
 * @route   POST /api/orders/:id/tracking
 * @desc    Add tracking info to order
 * @access  Private (Admin)
 */
router.post(
  '/:id/tracking',
  checkPermission('orders', 'update'),
  orderController.addTracking
);

/**
 * @route   POST /api/orders/:id/notes
 * @desc    Add note to order
 * @access  Private (Admin)
 */
router.post(
  '/:id/notes',
  checkPermission('orders', 'update'),
  orderController.addNote
);

/**
 * @route   POST /api/orders/:id/duplicate
 * @desc    Duplicate order
 * @access  Private (Admin)
 */
router.post(
  '/:id/duplicate',
  checkPermission('orders', 'create'),
  orderController.duplicate
);

/**
 * @route   POST /api/orders/:id/invoice
 * @desc    Generate invoice
 * @access  Private (Admin)
 */
router.post(
  '/:id/invoice',
  checkPermission('orders', 'read'),
  orderController.generateInvoice
);

/**
 * @route   POST /api/orders/:id/packing-slip
 * @desc    Generate packing slip
 * @access  Private (Admin)
 */
router.post(
  '/:id/packing-slip',
  checkPermission('orders', 'read'),
  orderController.generatePackingSlip
);

/**
 * @route   POST /api/orders/:id/print
 * @desc    Print order
 * @access  Private (Admin)
 */
router.post(
  '/:id/print',
  checkPermission('orders', 'read'),
  orderController.print
);

/**
 * @route   POST /api/orders/:id/send-confirmation
 * @desc    Send confirmation email
 * @access  Private (Admin)
 */
router.post(
  '/:id/send-confirmation',
  checkPermission('orders', 'update'),
  orderController.sendConfirmationEmail
);

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Refund order
 * @access  Private (Admin)
 */
router.post(
  '/:id/refund',
  checkPermission('orders', 'update'),
  orderController.refund
);

/**
 * @route   POST /api/orders/bulk/status
 * @desc    Bulk update order status
 * @access  Private (Admin)
 */
router.post(
  '/bulk/status',
  checkPermission('orders', 'update'),
  orderController.bulkUpdateStatus
);

/**
 * @route   POST /api/orders/export
 * @desc    Export orders to Excel
 * @access  Private (Admin)
 */
router.post(
  '/export',
  checkPermission('orders', 'read'),
  orderController.exportToExcel
);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  checkPermission('orders', 'update'),
  orderController.update
);

/**
 * @route   PUT /api/orders/:id/items/:itemId
 * @desc    Update order item
 * @access  Private (Admin)
 */
router.put(
  '/:id/items/:itemId',
  checkPermission('orders', 'update'),
  orderController.updateItem
);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/status',
  checkPermission('orders', 'update'),
  orderController.updateStatus
);

/**
 * @route   PATCH /api/orders/:id/payment-status
 * @desc    Update payment status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/payment-status',
  checkPermission('orders', 'update'),
  orderController.updatePaymentStatus
);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private (Admin)
 */
router.patch(
  '/:id/cancel',
  checkPermission('orders', 'update'),
  orderController.cancel
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('orders', 'delete'),
  orderController.remove
);

/**
 * @route   DELETE /api/orders/:id/items/:itemId
 * @desc    Remove item from order
 * @access  Private (Admin)
 */
router.delete(
  '/:id/items/:itemId',
  checkPermission('orders', 'update'),
  orderController.removeItem
);

module.exports = router;