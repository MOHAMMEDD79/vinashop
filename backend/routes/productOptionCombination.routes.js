/**
 * Product Option Combination Routes
 * @module routes/productOptionCombination
 *
 * Routes for managing product option combinations
 */

const express = require('express');
const router = express.Router();
const combinationController = require('../controllers/productOptionCombination.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Test endpoint for direct database update
router.post('/test-update/:id', combinationController.testUpdateStock);

// Statistics
router.get('/statistics', combinationController.getStatistics);

// Stock alerts
router.get('/low-stock', combinationController.getLowStock);
router.get('/out-of-stock', combinationController.getOutOfStock);

// Get combination by ID
router.get('/:id', combinationController.getById);

// Update combination
router.put('/:id', combinationController.update);

// Delete combination
router.delete('/:id', combinationController.remove);

// Update stock for specific combination
router.patch('/:id/stock', combinationController.updateStock);

// Bulk update stock
router.post('/bulk-stock', combinationController.bulkUpdateStock);

// Product-specific routes
router.get('/product/:productId', combinationController.getByProduct);
router.post('/product/:productId/generate', combinationController.generateCombinations);
router.post('/product/:productId/find', combinationController.findByOptions);
router.post('/product/:productId/price', combinationController.calculatePrice);
router.delete('/product/:productId', combinationController.deleteByProduct);

// Create new combination
router.post('/', combinationController.create);

module.exports = router;
