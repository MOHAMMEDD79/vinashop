/**
 * Product Option Combination Model
 * @module models/productOptionCombination
 *
 * Handles product option combinations (replaces product_variants)
 * Each combination represents a unique set of option values for a product
 * with its own stock, SKU, and price adjustment.
 */

const { query } = require('../config/database');
const crypto = require('crypto');

class ProductOptionCombination {
  // ==================== HELPER METHODS ====================

  /**
   * Generate hash from option values array
   * Ensures unique identification of option combinations
   */
  static generateHash(optionValues) {
    // Sort by option_value_id to ensure consistent hash
    const sorted = [...optionValues].sort((a, b) => a.option_value_id - b.option_value_id);
    const valueIds = sorted.map(v => v.option_value_id).join(',');
    return crypto.createHash('md5').update(valueIds).digest('hex');
  }

  /**
   * Generate option summary string from option values
   */
  static async generateSummary(optionValues, lang = 'en') {
    if (!optionValues || optionValues.length === 0) return '';

    const valueNameField = `value_name_${lang}`;
    const valueIds = optionValues.map(v => v.option_value_id);
    const placeholders = valueIds.map(() => '?').join(',');

    const sql = `
      SELECT ${valueNameField} as name
      FROM product_option_values
      WHERE option_value_id IN (${placeholders})
      ORDER BY FIELD(option_value_id, ${placeholders})
    `;

    const results = await query(sql, [...valueIds, ...valueIds]);
    return results.map(r => r.name).join(' / ');
  }

  /**
   * Generate SKU for combination
   */
  static async generateSKU(productId, optionValues) {
    // Get product SKU
    const productResult = await query('SELECT sku FROM products WHERE product_id = ?', [productId]);
    const productSku = productResult[0]?.sku || `P${productId}`;

    // Get option value codes
    const valueIds = optionValues.map(v => v.option_value_id);
    if (valueIds.length === 0) {
      return `${productSku}-DEFAULT`;
    }

    const placeholders = valueIds.map(() => '?').join(',');
    const sql = `
      SELECT
        UPPER(SUBSTRING(value_name_en, 1, 3)) as code
      FROM product_option_values
      WHERE option_value_id IN (${placeholders})
      ORDER BY option_type_id ASC
    `;

    const results = await query(sql, valueIds);
    const optionCodes = results.map(r => r.code.replace(/[^A-Z0-9]/g, '')).join('-');

    return `${productSku}-${optionCodes}`;
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get combination by ID
   */
  static async getById(combinationId) {
    const sql = `
      SELECT
        c.*,
        p.product_name_en,
        p.sku as product_sku,
        p.base_price
      FROM product_option_combinations c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.combination_id = ?
    `;

    const results = await query(sql, [combinationId]);
    return results[0] || null;
  }

  /**
   * Get combination by product and option values hash
   */
  static async getByHash(productId, optionValuesHash) {
    const sql = `
      SELECT * FROM product_option_combinations
      WHERE product_id = ? AND option_values_hash = ?
    `;

    const results = await query(sql, [productId, optionValuesHash]);
    return results[0] || null;
  }

  /**
   * Get combination by SKU
   */
  static async getBySKU(sku) {
    const sql = `
      SELECT
        c.*,
        p.product_name_en,
        p.base_price
      FROM product_option_combinations c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.sku = ?
    `;

    const results = await query(sql, [sku]);
    return results[0] || null;
  }

  /**
   * Get all combinations for a product
   */
  static async getByProduct(productId, options = {}) {
    const { is_active, include_out_of_stock = true, lang = 'en' } = options;

    let sql = `
      SELECT
        c.combination_id,
        c.product_id,
        c.option_values_hash,
        c.option_values_json,
        c.option_summary,
        c.sku,
        c.additional_price,
        c.stock_quantity,
        c.is_active,
        c.created_at,
        c.updated_at,
        p.base_price,
        (p.base_price + c.additional_price) as final_price
      FROM product_option_combinations c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.product_id = ?
    `;

    const params = [productId];

    if (is_active !== undefined) {
      sql += ' AND c.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (!include_out_of_stock) {
      sql += ' AND c.stock_quantity > 0';
    }

    sql += ' ORDER BY c.created_at ASC';

    console.log('=== GET BY PRODUCT ===');
    console.log('Product ID:', productId);
    console.log('SQL:', sql);

    const combinations = await query(sql, params);

    console.log('Raw DB results:', combinations.map(c => ({
      id: c.combination_id,
      stock_quantity: c.stock_quantity,
      option_summary: c.option_summary
    })));

    // Parse option_values_json for each combination
    for (const combo of combinations) {
      if (typeof combo.option_values_json === 'string') {
        combo.option_values = JSON.parse(combo.option_values_json);
      } else {
        combo.option_values = combo.option_values_json || [];
      }
    }

    return combinations;
  }

  /**
   * Create a new combination
   */
  static async create(data) {
    const {
      product_id,
      option_values, // Array of { option_type_id, option_value_id }
      sku = null,
      additional_price = 0,
      stock_quantity = 0,
      is_active = true,
    } = data;

    // Ensure numeric values
    const finalAdditionalPrice = Number(additional_price) || 0;
    const finalStockQuantity = Number(stock_quantity) || 0;

    console.log('Model create - data received:', data);
    console.log('Model create - finalStockQuantity:', finalStockQuantity, 'finalAdditionalPrice:', finalAdditionalPrice);

    // Generate hash
    const optionValuesHash = this.generateHash(option_values);

    // Check if combination already exists
    const existing = await this.getByHash(product_id, optionValuesHash);
    if (existing) {
      throw new Error('This option combination already exists for this product');
    }

    // Generate summary and SKU if not provided
    const optionSummary = await this.generateSummary(option_values);
    const finalSku = sku || await this.generateSKU(product_id, option_values);

    const sql = `
      INSERT INTO product_option_combinations (
        product_id,
        option_values_hash,
        option_values_json,
        option_summary,
        sku,
        additional_price,
        stock_quantity,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const insertValues = [
      product_id,
      optionValuesHash,
      JSON.stringify(option_values),
      optionSummary,
      finalSku,
      finalAdditionalPrice,
      finalStockQuantity,
      is_active ? 1 : 0,
    ];

    console.log('Model create - SQL values:', insertValues);

    const result = await query(sql, insertValues);
    console.log('Model create - Insert result:', result);

    return await this.getById(result.insertId);
  }

  /**
   * Update a combination - SIMPLE DIRECT UPDATE
   */
  static async update(combinationId, data) {
    // Just update what was sent - no complex logic
    const updates = [];
    const values = [];

    if (data.sku !== undefined) {
      updates.push('sku = ?');
      values.push(data.sku);
    }
    if (data.additional_price !== undefined) {
      updates.push('additional_price = ?');
      values.push(Number(data.additional_price) || 0);
    }
    if (data.stock_quantity !== undefined) {
      updates.push('stock_quantity = ?');
      values.push(parseInt(data.stock_quantity, 10) || 0);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return await this.getById(combinationId);
    }

    updates.push('updated_at = NOW()');
    values.push(combinationId);

    const sql = `UPDATE product_option_combinations SET ${updates.join(', ')} WHERE combination_id = ?`;

    console.log('UPDATE SQL:', sql);
    console.log('VALUES:', values);

    await query(sql, values);

    return await this.getById(combinationId);
  }

  /**
   * Delete a combination
   */
  static async delete(combinationId) {
    // Check if used in orders
    const usageCheck = await query(
      'SELECT COUNT(*) as count FROM order_items WHERE combination_id = ?',
      [combinationId]
    );

    if (usageCheck[0].count > 0) {
      // Soft delete - just deactivate
      return await this.update(combinationId, { is_active: false });
    }

    // Hard delete
    const sql = 'DELETE FROM product_option_combinations WHERE combination_id = ?';
    const result = await query(sql, [combinationId]);
    return result.affectedRows > 0;
  }

  // ==================== STOCK MANAGEMENT ====================

  /**
   * Update stock quantity
   */
  static async updateStock(combinationId, quantity) {
    const sql = `
      UPDATE product_option_combinations
      SET stock_quantity = ?, updated_at = NOW()
      WHERE combination_id = ?
    `;

    await query(sql, [quantity, combinationId]);
    return await this.getById(combinationId);
  }

  /**
   * Increment/decrement stock
   */
  static async adjustStock(combinationId, adjustment) {
    const sql = `
      UPDATE product_option_combinations
      SET stock_quantity = GREATEST(0, stock_quantity + ?), updated_at = NOW()
      WHERE combination_id = ?
    `;

    await query(sql, [adjustment, combinationId]);
    return await this.getById(combinationId);
  }

  /**
   * Reserve stock (for orders)
   */
  static async reserveStock(combinationId, quantity) {
    const combo = await this.getById(combinationId);
    if (!combo) {
      throw new Error('Combination not found');
    }

    if (combo.stock_quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    return await this.adjustStock(combinationId, -quantity);
  }

  /**
   * Release stock (for cancelled orders)
   */
  static async releaseStock(combinationId, quantity) {
    return await this.adjustStock(combinationId, quantity);
  }

  /**
   * Get stock for specific option values
   */
  static async getStockByOptions(productId, optionValues) {
    const hash = this.generateHash(optionValues);
    const combo = await this.getByHash(productId, hash);
    return combo ? combo.stock_quantity : 0;
  }

  /**
   * Check if combination is in stock
   */
  static async isInStock(combinationId, requiredQuantity = 1) {
    const combo = await this.getById(combinationId);
    return combo && combo.stock_quantity >= requiredQuantity;
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Generate combinations from option types (optionally filtered by selected values)
   * @param {number} productId - Product ID
   * @param {number[]} optionTypeIds - Array of option type IDs
   * @param {number} defaultStock - Default stock quantity
   * @param {Object} selectedValues - Optional: { typeId: [valueId1, valueId2, ...], ... }
   */
  static async generateAllCombinations(productId, optionTypeIds, defaultStock = 0, selectedValues = null) {
    // Get values for each option type
    const typeValues = [];
    for (const typeId of optionTypeIds) {
      let values;

      // If selectedValues is provided, only use those specific values
      if (selectedValues && selectedValues[typeId] && Array.isArray(selectedValues[typeId])) {
        const valueIds = selectedValues[typeId];
        if (valueIds.length === 0) continue;

        const placeholders = valueIds.map(() => '?').join(',');
        values = await query(
          `SELECT option_value_id, option_type_id FROM product_option_values
           WHERE option_type_id = ? AND option_value_id IN (${placeholders}) AND is_active = 1`,
          [typeId, ...valueIds]
        );
      } else {
        // No filter, get all values for this type
        values = await query(
          'SELECT option_value_id, option_type_id FROM product_option_values WHERE option_type_id = ? AND is_active = 1',
          [typeId]
        );
      }

      if (values.length > 0) {
        typeValues.push(values);
      }
    }

    if (typeValues.length === 0) return [];

    // Generate cartesian product
    const cartesian = (...arrays) => {
      return arrays.reduce((acc, arr) => {
        return acc.flatMap(x => arr.map(y => [...x, y]));
      }, [[]]);
    };

    const allCombinations = cartesian(...typeValues);
    const created = [];

    for (const optionValues of allCombinations) {
      try {
        const combo = await this.create({
          product_id: productId,
          option_values: optionValues,
          stock_quantity: defaultStock,
        });
        created.push(combo);
      } catch (e) {
        // Skip if already exists
        if (!e.message.includes('already exists')) {
          console.error('Error creating combination:', e);
        }
      }
    }

    return created;
  }

  /**
   * Bulk update stock
   */
  static async bulkUpdateStock(updates) {
    // updates is array of { combination_id, stock_quantity }
    for (const update of updates) {
      await this.updateStock(update.combination_id, update.stock_quantity);
    }
    return true;
  }

  /**
   * Delete all combinations for a product
   */
  static async deleteByProduct(productId) {
    // First check for orders
    const orderCheck = await query(`
      SELECT COUNT(*) as count
      FROM order_items oi
      JOIN product_option_combinations poc ON oi.combination_id = poc.combination_id
      WHERE poc.product_id = ?
    `, [productId]);

    if (orderCheck[0].count > 0) {
      // Soft delete all
      await query(
        'UPDATE product_option_combinations SET is_active = 0 WHERE product_id = ?',
        [productId]
      );
    } else {
      // Hard delete
      await query('DELETE FROM product_option_combinations WHERE product_id = ?', [productId]);
    }

    return true;
  }

  // ==================== QUERY METHODS ====================

  /**
   * Find combination by option values
   */
  static async findByOptionValues(productId, optionValues) {
    const hash = this.generateHash(optionValues);
    return await this.getByHash(productId, hash);
  }

  /**
   * Get combinations with low stock
   */
  static async getLowStock(options = {}) {
    const { threshold = 5, limit = 50 } = options;

    const sql = `
      SELECT
        c.*,
        p.product_name_en,
        p.sku as product_sku
      FROM product_option_combinations c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.stock_quantity <= ? AND c.is_active = 1
      ORDER BY c.stock_quantity ASC
      LIMIT ?
    `;

    return await query(sql, [threshold, limit]);
  }

  /**
   * Get out of stock combinations
   */
  static async getOutOfStock(options = {}) {
    const { limit = 50 } = options;

    const sql = `
      SELECT
        c.*,
        p.product_name_en,
        p.sku as product_sku
      FROM product_option_combinations c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.stock_quantity = 0 AND c.is_active = 1
      ORDER BY c.updated_at DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get total stock for a product
   */
  static async getTotalStock(productId) {
    const sql = `
      SELECT COALESCE(SUM(stock_quantity), 0) as total_stock
      FROM product_option_combinations
      WHERE product_id = ? AND is_active = 1
    `;

    const result = await query(sql, [productId]);
    return result[0].total_stock;
  }

  /**
   * Get statistics
   */
  static async getStatistics() {
    const stats = await query(`
      SELECT
        COUNT(*) as total_combinations,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_combinations,
        SUM(CASE WHEN stock_quantity = 0 AND is_active = 1 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 5 AND is_active = 1 THEN 1 ELSE 0 END) as low_stock,
        SUM(stock_quantity) as total_stock,
        COUNT(DISTINCT product_id) as products_with_combinations
      FROM product_option_combinations
    `);

    return stats[0];
  }

  // ==================== PRICE CALCULATION ====================

  /**
   * Calculate final price for a combination
   */
  static async calculatePrice(productId, optionValues) {
    // Get base price
    const productResult = await query('SELECT base_price FROM products WHERE product_id = ?', [productId]);
    if (!productResult[0]) return null;

    let finalPrice = parseFloat(productResult[0].base_price);

    // Add option value additional prices
    if (optionValues && optionValues.length > 0) {
      const valueIds = optionValues.map(v => v.option_value_id);
      const placeholders = valueIds.map(() => '?').join(',');

      const priceResult = await query(
        `SELECT COALESCE(SUM(additional_price), 0) as total_additional
         FROM product_option_values
         WHERE option_value_id IN (${placeholders})`,
        valueIds
      );

      finalPrice += parseFloat(priceResult[0].total_additional);
    }

    return finalPrice;
  }

  /**
   * Get price breakdown for a combination
   */
  static async getPriceBreakdown(combinationId) {
    const combo = await this.getById(combinationId);
    if (!combo) return null;

    const basePrice = parseFloat(combo.base_price);
    const additionalPrice = parseFloat(combo.additional_price);

    return {
      base_price: basePrice,
      additional_price: additionalPrice,
      final_price: basePrice + additionalPrice,
      option_summary: combo.option_summary,
    };
  }
}

module.exports = ProductOptionCombination;
