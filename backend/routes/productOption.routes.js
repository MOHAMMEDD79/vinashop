/**
 * Product Option Routes
 * @module routes/productOption
 */

const express = require('express');
const router = express.Router();
const productOptionController = require('../controllers/productOption.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { hasRole } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== Statistics ====================
router.get('/statistics', productOptionController.getStatistics);

// ==================== Option Types ====================
router.get('/types', productOptionController.getAllTypes);
router.get('/types/:id', productOptionController.getTypeById);
router.post('/types', hasRole('super_admin', 'admin'), productOptionController.createType);
router.put('/types/:id', hasRole('super_admin', 'admin'), productOptionController.updateType);
router.delete('/types/:id', hasRole('super_admin', 'admin'), productOptionController.deleteType);

// ==================== Option Values ====================
router.get('/types/:typeId/values', productOptionController.getValuesByType);
router.post('/types/:typeId/values', hasRole('super_admin', 'admin'), productOptionController.createValue);
router.post('/types/:typeId/values/bulk', hasRole('super_admin', 'admin'), productOptionController.bulkCreateValues);
router.put('/types/:typeId/values/order', hasRole('super_admin', 'admin'), productOptionController.updateValuesOrder);

router.get('/values/:id', productOptionController.getValueById);
router.put('/values/:id', hasRole('super_admin', 'admin'), productOptionController.updateValue);
router.delete('/values/:id', hasRole('super_admin', 'admin'), productOptionController.deleteValue);

// ==================== Product Options ====================
router.get('/products/:productId', productOptionController.getProductOptions);
router.put('/products/:productId', hasRole('super_admin', 'admin'), productOptionController.setProductOptions);
router.post('/products/:productId', hasRole('super_admin', 'admin'), productOptionController.addProductOption);
router.delete('/products/:productId/types/:typeId', hasRole('super_admin', 'admin'), productOptionController.removeProductOption);

module.exports = router;
