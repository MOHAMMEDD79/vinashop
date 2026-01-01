/**
 * Trader Routes
 * Routes for trader/supplier management (Super Admin Only)
 */

const express = require('express');
const router = express.Router();
const traderController = require('../controllers/trader.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { superAdminOnly } = require('../middleware/admin.middleware');

// All routes require authentication and super admin role
router.use(authenticate);
router.use(superAdminOnly);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/traders
 * @desc    Get all traders
 * @access  Super Admin Only
 */
router.get('/', traderController.getAll);

/**
 * @route   GET /api/traders/statistics
 * @desc    Get trader statistics
 * @access  Super Admin Only
 */
router.get('/statistics', traderController.getStatistics);

/**
 * @route   GET /api/traders/:id
 * @desc    Get trader by ID
 * @access  Super Admin Only
 */
router.get('/:id', traderController.getById);

/**
 * @route   GET /api/traders/:id/bills
 * @desc    Get trader bills
 * @access  Super Admin Only
 */
router.get('/:id/bills', traderController.getBills);

/**
 * @route   GET /api/traders/:id/payments
 * @desc    Get trader payments
 * @access  Super Admin Only
 */
router.get('/:id/payments', traderController.getPayments);

/**
 * @route   GET /api/traders/:id/balance
 * @desc    Get trader balance
 * @access  Super Admin Only
 */
router.get('/:id/balance', traderController.getBalance);

/**
 * @route   GET /api/traders/bills/:billId
 * @desc    Get bill by ID
 * @access  Super Admin Only
 */
router.get('/bills/:billId', traderController.getBillById);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/traders
 * @desc    Create trader
 * @access  Super Admin Only
 */
router.post('/', traderController.create);

/**
 * @route   POST /api/traders/:id/bills
 * @desc    Create trader bill
 * @access  Super Admin Only
 */
router.post('/:id/bills', traderController.createBill);

/**
 * @route   POST /api/traders/bills/:billId/items
 * @desc    Add item to bill
 * @access  Super Admin Only
 */
router.post('/bills/:billId/items', traderController.addBillItem);

/**
 * @route   POST /api/traders/:id/payment
 * @desc    Record payment
 * @access  Super Admin Only
 */
router.post('/:id/payment', traderController.recordPayment);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/traders/:id
 * @desc    Update trader
 * @access  Super Admin Only
 */
router.put('/:id', traderController.update);

/**
 * @route   PUT /api/traders/bills/:billId
 * @desc    Update bill
 * @access  Super Admin Only
 */
router.put('/bills/:billId', traderController.updateBill);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/traders/:id
 * @desc    Delete trader
 * @access  Super Admin Only
 */
router.delete('/:id', traderController.remove);

/**
 * @route   DELETE /api/traders/bills/:billId
 * @desc    Delete bill
 * @access  Super Admin Only
 */
router.delete('/bills/:billId', traderController.deleteBill);

module.exports = router;
