/**
 * Product Option Combination Service
 * @module services/productOptionCombination
 *
 * Business logic for product option combinations
 */

const ProductOptionCombination = require('../models/productOptionCombination.model');
const ProductOption = require('../models/productOption.model');

class ProductOptionCombinationService {
  /**
   * Get all combinations for a product
   */
  async getByProduct(productId, options = {}) {
    const combinations = await ProductOptionCombination.getByProduct(productId, options);

    // Enrich with option details
    for (const combo of combinations) {
      combo.options_detail = await this.getOptionsDetail(combo.option_values);
    }

    return combinations;
  }

  /**
   * Get option details for option values
   */
  async getOptionsDetail(optionValues) {
    if (!optionValues || optionValues.length === 0) return [];

    const details = [];
    for (const ov of optionValues) {
      const value = await ProductOption.getValueById(ov.option_value_id);
      if (value) {
        details.push({
          type_id: value.option_type_id,
          type_name: value.type_name_en,
          value_id: value.option_value_id,
          value_name: value.value_name_en,
          hex_code: value.hex_code,
          additional_price: value.additional_price,
        });
      }
    }
    return details;
  }

  /**
   * Create a new combination
   */
  async create(data) {
    // Validate option values exist
    for (const ov of data.option_values) {
      const value = await ProductOption.getValueById(ov.option_value_id);
      if (!value) {
        throw new Error(`Option value ${ov.option_value_id} not found`);
      }
    }

    return await ProductOptionCombination.create(data);
  }

  /**
   * Update a combination - SIMPLE
   */
  async update(combinationId, data) {
    return await ProductOptionCombination.update(combinationId, data);
  }

  /**
   * Delete a combination
   */
  async delete(combinationId) {
    const existing = await ProductOptionCombination.getById(combinationId);
    if (!existing) {
      throw new Error('Combination not found');
    }

    return await ProductOptionCombination.delete(combinationId);
  }

  /**
   * Get combination by ID with full details
   */
  async getById(combinationId) {
    const combo = await ProductOptionCombination.getById(combinationId);
    if (!combo) return null;

    // Parse option values
    if (typeof combo.option_values_json === 'string') {
      combo.option_values = JSON.parse(combo.option_values_json);
    } else {
      combo.option_values = combo.option_values_json || [];
    }

    combo.options_detail = await this.getOptionsDetail(combo.option_values);
    return combo;
  }

  /**
   * Find combination by option values
   */
  async findByOptions(productId, optionValues) {
    return await ProductOptionCombination.findByOptionValues(productId, optionValues);
  }

  /**
   * Generate combinations for a product (only for selected values)
   */
  async generateCombinations(productId, optionTypeIds, defaultStock = 0, selectedValues = null) {
    return await ProductOptionCombination.generateAllCombinations(productId, optionTypeIds, defaultStock, selectedValues);
  }

  /**
   * Update stock for a combination
   */
  async updateStock(combinationId, quantity) {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    return await ProductOptionCombination.updateStock(combinationId, quantity);
  }

  /**
   * Bulk update stock
   */
  async bulkUpdateStock(updates) {
    for (const update of updates) {
      if (update.stock_quantity < 0) {
        throw new Error(`Invalid stock quantity for combination ${update.combination_id}`);
      }
    }

    return await ProductOptionCombination.bulkUpdateStock(updates);
  }

  /**
   * Reserve stock for order
   */
  async reserveStock(combinationId, quantity) {
    return await ProductOptionCombination.reserveStock(combinationId, quantity);
  }

  /**
   * Release stock (cancel order)
   */
  async releaseStock(combinationId, quantity) {
    return await ProductOptionCombination.releaseStock(combinationId, quantity);
  }

  /**
   * Check stock availability
   */
  async checkStock(combinationId, requiredQuantity = 1) {
    return await ProductOptionCombination.isInStock(combinationId, requiredQuantity);
  }

  /**
   * Get low stock combinations
   */
  async getLowStock(threshold = 5, limit = 50) {
    return await ProductOptionCombination.getLowStock({ threshold, limit });
  }

  /**
   * Get out of stock combinations
   */
  async getOutOfStock(limit = 50) {
    return await ProductOptionCombination.getOutOfStock({ limit });
  }

  /**
   * Calculate price for options
   */
  async calculatePrice(productId, optionValues) {
    return await ProductOptionCombination.calculatePrice(productId, optionValues);
  }

  /**
   * Get price breakdown
   */
  async getPriceBreakdown(combinationId) {
    return await ProductOptionCombination.getPriceBreakdown(combinationId);
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    return await ProductOptionCombination.getStatistics();
  }

  /**
   * Get total stock for product
   */
  async getTotalStock(productId) {
    return await ProductOptionCombination.getTotalStock(productId);
  }

  /**
   * Delete all combinations for a product
   */
  async deleteByProduct(productId) {
    return await ProductOptionCombination.deleteByProduct(productId);
  }

  /**
   * Get or create combination
   */
  async getOrCreate(productId, optionValues, defaultData = {}) {
    let combo = await this.findByOptions(productId, optionValues);

    if (!combo) {
      combo = await this.create({
        product_id: productId,
        option_values: optionValues,
        stock_quantity: defaultData.stock_quantity || 0,
        additional_price: defaultData.additional_price || 0,
        ...defaultData,
      });
    }

    return combo;
  }
}

module.exports = new ProductOptionCombinationService();
