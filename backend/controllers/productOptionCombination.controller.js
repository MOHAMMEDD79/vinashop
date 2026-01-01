/**
 * Product Option Combination Controller
 * @module controllers/productOptionCombination
 *
 * Handles HTTP requests for product option combinations
 */

const productOptionCombinationService = require('../services/productOptionCombination.service');

/**
 * Get all combinations for a product
 */
const getByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { is_active, include_out_of_stock } = req.query;

    console.log('=== CONTROLLER getByProduct ===');
    console.log('Product ID:', productId);

    const combinations = await productOptionCombinationService.getByProduct(productId, {
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      include_out_of_stock: include_out_of_stock !== 'false',
    });

    console.log('Returning combinations with stock:', combinations.map(c => ({
      id: c.combination_id,
      stock: c.stock_quantity
    })));

    res.json({
      success: true,
      data: combinations,
    });
  } catch (error) {
    console.error('Error getting combinations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get combinations',
    });
  }
};

/**
 * Get combination by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const combination = await productOptionCombinationService.getById(id);

    if (!combination) {
      return res.status(404).json({
        success: false,
        message: 'Combination not found',
      });
    }

    res.json({
      success: true,
      data: combination,
    });
  } catch (error) {
    console.error('Error getting combination:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get combination',
    });
  }
};

/**
 * Create a new combination
 */
const create = async (req, res) => {
  try {
    const { product_id, option_values, sku, additional_price, stock_quantity, is_active } = req.body;

    console.log('Creating combination - req.body:', req.body);
    console.log('Creating combination - stock_quantity:', stock_quantity, 'type:', typeof stock_quantity);

    if (!product_id || !option_values || !Array.isArray(option_values)) {
      return res.status(400).json({
        success: false,
        message: 'product_id and option_values array are required',
      });
    }

    // Use Number() to properly handle the stock_quantity
    const stockQty = Number(stock_quantity) || 0;
    const addPrice = Number(additional_price) || 0;

    console.log('Creating combination - parsed stockQty:', stockQty, 'addPrice:', addPrice);

    const combination = await productOptionCombinationService.create({
      product_id,
      option_values,
      sku,
      additional_price: addPrice,
      stock_quantity: stockQty,
      is_active: is_active !== false,
    });

    console.log('Created combination:', combination);

    res.status(201).json({
      success: true,
      data: combination,
      message: 'Combination created successfully',
    });
  } catch (error) {
    console.error('Error creating combination:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create combination',
    });
  }
};

/**
 * Update a combination - SIMPLE
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('UPDATE combination', id, 'with:', req.body);

    const combination = await productOptionCombinationService.update(id, req.body);

    console.log('Updated stock_quantity:', combination?.stock_quantity);

    res.json({
      success: true,
      data: combination,
      message: 'Combination updated successfully',
    });
  } catch (error) {
    console.error('Error updating combination:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update combination',
    });
  }
};

/**
 * Delete a combination
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await productOptionCombinationService.delete(id);

    res.json({
      success: true,
      message: 'Combination deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting combination:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete combination',
    });
  }
};

/**
 * Update stock for a combination
 */
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity === undefined || stock_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid stock_quantity is required',
      });
    }

    const combination = await productOptionCombinationService.updateStock(id, stock_quantity);

    res.json({
      success: true,
      data: combination,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update stock',
    });
  }
};

/**
 * Bulk update stock
 */
const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'updates array is required',
      });
    }

    await productOptionCombinationService.bulkUpdateStock(updates);

    res.json({
      success: true,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update stock',
    });
  }
};

/**
 * Generate combinations for a product
 */
const generateCombinations = async (req, res) => {
  try {
    const { productId } = req.params;
    const { option_type_ids, selected_values, default_stock = 0 } = req.body;

    if (!option_type_ids || !Array.isArray(option_type_ids)) {
      return res.status(400).json({
        success: false,
        message: 'option_type_ids array is required',
      });
    }

    const combinations = await productOptionCombinationService.generateCombinations(
      productId,
      option_type_ids,
      default_stock,
      selected_values // Pass selected values to only generate those combinations
    );

    res.status(201).json({
      success: true,
      combinations: combinations,
      data: combinations,
      message: `Created ${combinations.length} combinations`,
    });
  } catch (error) {
    console.error('Error generating combinations:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate combinations',
    });
  }
};

/**
 * Find combination by options
 */
const findByOptions = async (req, res) => {
  try {
    const { productId } = req.params;
    const { option_values } = req.body;

    if (!option_values || !Array.isArray(option_values)) {
      return res.status(400).json({
        success: false,
        message: 'option_values array is required',
      });
    }

    const combination = await productOptionCombinationService.findByOptions(productId, option_values);

    if (!combination) {
      return res.status(404).json({
        success: false,
        message: 'Combination not found',
      });
    }

    res.json({
      success: true,
      data: combination,
    });
  } catch (error) {
    console.error('Error finding combination:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to find combination',
    });
  }
};

/**
 * Calculate price for options
 */
const calculatePrice = async (req, res) => {
  try {
    const { productId } = req.params;
    const { option_values } = req.body;

    const price = await productOptionCombinationService.calculatePrice(productId, option_values || []);

    res.json({
      success: true,
      data: { price },
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to calculate price',
    });
  }
};

/**
 * Get low stock combinations
 */
const getLowStock = async (req, res) => {
  try {
    const { threshold = 5, limit = 50 } = req.query;

    const combinations = await productOptionCombinationService.getLowStock(
      parseInt(threshold),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: combinations,
    });
  } catch (error) {
    console.error('Error getting low stock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get low stock combinations',
    });
  }
};

/**
 * Get out of stock combinations
 */
const getOutOfStock = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const combinations = await productOptionCombinationService.getOutOfStock(parseInt(limit));

    res.json({
      success: true,
      data: combinations,
    });
  } catch (error) {
    console.error('Error getting out of stock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get out of stock combinations',
    });
  }
};

/**
 * Get statistics
 */
const getStatistics = async (req, res) => {
  try {
    const stats = await productOptionCombinationService.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get statistics',
    });
  }
};

/**
 * Delete all combinations for a product
 */
const deleteByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    await productOptionCombinationService.deleteByProduct(productId);

    res.json({
      success: true,
      message: 'All combinations deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting combinations:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete combinations',
    });
  }
};

/**
 * Direct database test - update stock for a combination
 */
const testUpdateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    console.log('=== TEST UPDATE STOCK ===');
    console.log('ID:', id);
    console.log('Stock quantity received:', stock_quantity, 'Type:', typeof stock_quantity);

    // Direct database query
    const { query } = require('../config/database');

    // Get current value
    const before = await query('SELECT stock_quantity FROM product_option_combinations WHERE combination_id = ?', [id]);
    console.log('BEFORE:', before[0]?.stock_quantity);

    // Direct update
    const stockQty = parseInt(stock_quantity, 10);
    console.log('Parsed stock_quantity:', stockQty);

    const updateResult = await query(
      'UPDATE product_option_combinations SET stock_quantity = ? WHERE combination_id = ?',
      [stockQty, id]
    );
    console.log('Update result:', updateResult);

    // Get after value
    const after = await query('SELECT stock_quantity FROM product_option_combinations WHERE combination_id = ?', [id]);
    console.log('AFTER:', after[0]?.stock_quantity);

    res.json({
      success: true,
      before: before[0]?.stock_quantity,
      after: after[0]?.stock_quantity,
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows,
    });
  } catch (error) {
    console.error('Test update error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getByProduct,
  getById,
  create,
  update,
  remove,
  updateStock,
  bulkUpdateStock,
  generateCombinations,
  findByOptions,
  calculatePrice,
  getLowStock,
  getOutOfStock,
  getStatistics,
  deleteByProduct,
  testUpdateStock,
};
