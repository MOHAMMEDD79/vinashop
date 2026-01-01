/**
 * Variant Model
 * @module models/variant
 */

const { query } = require('../config/database');

/**
 * Variant Model - Handles product variants database operations
 */
class Variant {
  /**
   * Get all variants with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      product_id,
      color_id,
      size_id,
      is_active,
      in_stock,
      sort = 'created_at',
      order = 'DESC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    const nameField = `p.product_name_${lang}`;

    if (search) {
      whereClause += ' AND (v.sku LIKE ? OR p.product_name_en LIKE ? OR p.sku LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (product_id) {
      whereClause += ' AND v.product_id = ?';
      params.push(product_id);
    }

    if (color_id) {
      whereClause += ' AND v.color_id = ?';
      params.push(color_id);
    }

    if (size_id) {
      whereClause += ' AND v.size_id = ?';
      params.push(size_id);
    }

    // Note: is_active column doesn't exist in product_variants table
    // Variants are always active if they exist

    if (in_stock !== undefined) {
      if (in_stock) {
        whereClause += ' AND v.stock_quantity > 0';
      } else {
        whereClause += ' AND v.stock_quantity = 0';
      }
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    // Note: display_order column doesn't exist in product_variants table
    const allowedSorts = ['variant_id', 'sku', 'additional_price', 'stock_quantity', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `v.${sort}` : 'v.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        v.variant_id,
        v.product_id,
        v.color_id,
        v.size_id,
        v.additional_price as price,
        v.stock_quantity,
        v.sku,
        v.created_at,
        ${nameField} as product_name,
        p.sku as product_sku,
        p.base_price as product_price,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        s.size_value as size_code
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      ${whereClause}
      ORDER BY v.variant_id DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const variants = await query(sql, params);

    return {
      data: variants,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get variant by ID
   */
  static async getById(variantId, lang = 'en') {
    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT
        v.variant_id,
        v.product_id,
        v.color_id,
        v.size_id,
        v.additional_price as price,
        v.stock_quantity,
        v.sku,
        v.created_at,
        ${nameField} as product_name,
        p.sku as product_sku,
        p.base_price as product_price,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        s.size_value as size_code
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE v.variant_id = ?
    `;

    const results = await query(sql, [variantId]);
    return results[0] || null;
  }

  /**
   * Get variant by SKU
   */
  static async getBySku(sku) {
    const sql = 'SELECT * FROM product_variants WHERE sku = ?';
    const results = await query(sql, [sku]);
    return results[0] || null;
  }

  /**
   * Get variants by product ID
   */
  static async getByProductId(productId, options = {}) {
    const { lang = 'en' } = options;

    const sql = `
      SELECT
        v.variant_id,
        v.product_id,
        v.color_id,
        v.size_id,
        v.additional_price as price,
        v.stock_quantity,
        v.sku,
        v.created_at,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        s.size_value as size_code
      FROM product_variants v
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE v.product_id = ?
      ORDER BY v.variant_id ASC
    `;

    return await query(sql, [productId]);
  }

  /**
   * Get variant by product, color, and size
   */
  static async getByProductColorSize(productId, colorId, sizeId) {
    let sql = 'SELECT * FROM product_variants WHERE product_id = ?';
    const params = [productId];

    if (colorId) {
      sql += ' AND color_id = ?';
      params.push(colorId);
    } else {
      sql += ' AND color_id IS NULL';
    }

    if (sizeId) {
      sql += ' AND size_id = ?';
      params.push(sizeId);
    } else {
      sql += ' AND size_id IS NULL';
    }

    const results = await query(sql, params);
    return results[0] || null;
  }

  /**
   * Create a new variant
   */
  static async create(data) {
    const {
      product_id,
      color_id,
      size_id,
      price,
      additional_price,
      stock_quantity = 0,
    } = data;

    // Use additional_price if provided, otherwise use price
    const priceValue = additional_price !== undefined ? additional_price : (price || 0);

    // Auto-generate SKU
    const timestamp = Date.now().toString(36).toUpperCase();
    const colorPart = color_id ? `C${color_id}` : '';
    const sizePart = size_id ? `S${size_id}` : '';
    const autoSku = `P${product_id}-${colorPart}${sizePart}-${timestamp}`;

    const sql = `
      INSERT INTO product_variants (
        product_id,
        color_id,
        size_id,
        sku,
        additional_price,
        stock_quantity,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      product_id,
      color_id || null,
      size_id || null,
      autoSku,
      priceValue,
      stock_quantity,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Create multiple variants
   */
  static async createMultiple(productId, variants) {
    const created = [];

    for (const variant of variants) {
      const newVariant = await this.create({
        product_id: productId,
        ...variant,
      });
      created.push(newVariant);
    }

    return created;
  }

  /**
   * Update variant
   */
  static async update(variantId, data) {
    const allowedFields = [
      'color_id',
      'size_id',
      'sku',
      'additional_price',
      'stock_quantity',
    ];

    const updates = [];
    const values = [];

    // Map 'price' to 'additional_price' if provided
    if (data.price !== undefined && data.additional_price === undefined) {
      data.additional_price = data.price;
    }

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return await this.getById(variantId);
    }

    values.push(variantId);

    const sql = `UPDATE product_variants SET ${updates.join(', ')} WHERE variant_id = ?`;
    await query(sql, values);

    return await this.getById(variantId);
  }

  /**
   * Delete variant
   */
  static async delete(variantId) {
    const sql = 'DELETE FROM product_variants WHERE variant_id = ?';
    const result = await query(sql, [variantId]);
    return result.affectedRows > 0;
  }

  /**
   * Delete variants by product
   */
  static async deleteByProductId(productId) {
    const sql = 'DELETE FROM product_variants WHERE product_id = ?';
    const result = await query(sql, [productId]);
    return result.affectedRows;
  }

  /**
   * Toggle active status
   * Note: is_active column doesn't exist in product_variants table
   * This method is kept for compatibility but does nothing
   */
  static async toggleStatus(variantId) {
    const variant = await this.getById(variantId);
    if (!variant) return null;
    // No is_active column in product_variants - variants are always active
    return variant;
  }

  /**
   * Update stock quantity
   */
  static async updateStock(variantId, quantity, operation = 'set') {
    let sql;

    if (operation === 'add') {
      sql = 'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE variant_id = ?';
    } else if (operation === 'subtract') {
      sql = 'UPDATE product_variants SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE variant_id = ?';
    } else {
      sql = 'UPDATE product_variants SET stock_quantity = ? WHERE variant_id = ?';
    }

    await query(sql, [quantity, variantId]);
    return await this.getById(variantId);
  }

  /**
   * Reserve stock
   * Note: reserved_quantity column doesn't exist - using stock_quantity directly
   */
  static async reserveStock(variantId, quantity) {
    const variant = await this.getById(variantId);
    if (!variant || variant.stock_quantity < quantity) {
      return false;
    }
    // Reduce stock quantity directly
    await query('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE variant_id = ? AND stock_quantity >= ?',
      [quantity, variantId, quantity]);
    return true;
  }

  /**
   * Release reserved stock
   * Note: reserved_quantity column doesn't exist - using stock_quantity directly
   */
  static async releaseStock(variantId, quantity) {
    // Add back to stock quantity
    await query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE variant_id = ?',
      [quantity, variantId]);
    return await this.getById(variantId);
  }

  /**
   * Get available stock
   */
  static async getAvailableStock(variantId) {
    const sql = `
      SELECT stock_quantity as available_stock
      FROM product_variants
      WHERE variant_id = ?
    `;

    const results = await query(sql, [variantId]);
    return results[0]?.available_stock || 0;
  }

  /**
   * Check stock availability
   */
  static async checkStockAvailability(variantId, quantity) {
    const availableStock = await this.getAvailableStock(variantId);
    return availableStock >= quantity;
  }

  /**
   * Update image
   * Note: image_url column doesn't exist in product_variants table
   * Variant images should be handled through product_images table
   */
  static async updateImage(variantId, imageUrl) {
    // image_url column doesn't exist - return variant as-is
    return await this.getById(variantId);
  }

  /**
   * Update display order
   * Note: display_order column doesn't exist in product_variants table
   */
  static async updateDisplayOrder(variantId, displayOrder) {
    // display_order column doesn't exist - return variant as-is
    return await this.getById(variantId);
  }

  // ==================== Inventory ====================

  /**
   * Get low stock variants
   * Note: is_active and low_stock_threshold columns don't exist
   * Using a default threshold of 10
   */
  static async getLowStock(options = {}) {
    const { limit = 50, lang = 'en', threshold = 10 } = options;

    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT
        v.variant_id,
        v.product_id,
        v.color_id,
        v.size_id,
        v.additional_price,
        v.stock_quantity,
        v.sku,
        v.created_at,
        ${nameField} as product_name,
        p.sku as product_sku,
        c.color_name_${lang} as color_name,
        s.size_name as size_name
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE v.stock_quantity <= ?
        AND v.stock_quantity > 0
      ORDER BY v.stock_quantity ASC
      LIMIT ?
    `;

    return await query(sql, [threshold, limit]);
  }

  /**
   * Get out of stock variants
   */
  static async getOutOfStock(options = {}) {
    const { limit = 50, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT
        v.variant_id,
        v.product_id,
        v.color_id,
        v.size_id,
        v.additional_price,
        v.stock_quantity,
        v.sku,
        v.created_at,
        ${nameField} as product_name,
        p.sku as product_sku,
        c.color_name_${lang} as color_name,
        s.size_name as size_name
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE v.stock_quantity = 0
      ORDER BY v.created_at DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  // ==================== Statistics ====================

  /**
   * Get variant statistics
   * Note: is_active, low_stock_threshold, price columns don't exist
   */
  static async getStatistics() {
    const sql = `
      SELECT
        COUNT(*) as total_variants,
        COUNT(*) as active_variants,
        0 as inactive_variants,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 10 THEN 1 ELSE 0 END) as low_stock,
        COALESCE(SUM(stock_quantity), 0) as total_stock,
        COALESCE(AVG(additional_price), 0) as avg_price,
        COUNT(DISTINCT product_id) as products_with_variants
      FROM product_variants
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get variant count for product
   */
  static async getCountByProduct(productId) {
    const sql = 'SELECT COUNT(*) as count FROM product_variants WHERE product_id = ?';
    const results = await query(sql, [productId]);
    return results[0].count;
  }

  /**
   * Search variants
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT
        v.variant_id,
        v.product_id,
        v.sku,
        v.additional_price as price,
        v.stock_quantity,
        ${nameField} as product_name,
        c.color_name_${lang} as color_name,
        s.size_name as size_name
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE
        v.sku LIKE ? OR
        p.product_name_en LIKE ? OR
        p.sku LIKE ?
      ORDER BY p.product_name_en ASC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, limit]);
  }

  /**
   * Bulk update variants
   * Note: is_active, low_stock_threshold, updated_at columns don't exist
   */
  static async bulkUpdate(variantIds, data) {
    if (!variantIds || variantIds.length === 0) {
      return { updated: 0 };
    }

    // Map price to additional_price if provided
    if (data.price !== undefined && data.additional_price === undefined) {
      data.additional_price = data.price;
    }

    const allowedFields = ['additional_price', 'stock_quantity'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    }

    if (updates.length === 0) {
      return { updated: 0 };
    }

    const placeholders = variantIds.map(() => '?').join(',');
    const sql = `UPDATE product_variants SET ${updates.join(', ')} WHERE variant_id IN (${placeholders})`;

    const result = await query(sql, [...values, ...variantIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete variants
   */
  static async bulkDelete(variantIds) {
    if (!variantIds || variantIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = variantIds.map(() => '?').join(',');
    const sql = `DELETE FROM product_variants WHERE variant_id IN (${placeholders})`;
    const result = await query(sql, variantIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Check if SKU exists
   */
  static async skuExists(sku, excludeId = null) {
    let sql = 'SELECT variant_id FROM product_variants WHERE sku = ?';
    const params = [sku];

    if (excludeId) {
      sql += ' AND variant_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Check if variant combination exists
   */
  static async combinationExists(productId, colorId, sizeId, excludeId = null) {
    let sql = 'SELECT variant_id FROM product_variants WHERE product_id = ?';
    const params = [productId];

    if (colorId) {
      sql += ' AND color_id = ?';
      params.push(colorId);
    } else {
      sql += ' AND color_id IS NULL';
    }

    if (sizeId) {
      sql += ' AND size_id = ?';
      params.push(sizeId);
    } else {
      sql += ' AND size_id IS NULL';
    }

    if (excludeId) {
      sql += ' AND variant_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Generate all combinations for product
   */
  static async generateCombinations(productId, colorIds, sizeIds, baseData = {}) {
    const created = [];

    // If no colors and no sizes, create single variant
    if ((!colorIds || colorIds.length === 0) && (!sizeIds || sizeIds.length === 0)) {
      const variant = await this.create({
        product_id: productId,
        ...baseData,
      });
      return [variant];
    }

    // If only colors
    if ((!sizeIds || sizeIds.length === 0)) {
      for (const colorId of colorIds) {
        if (!await this.combinationExists(productId, colorId, null)) {
          const variant = await this.create({
            product_id: productId,
            color_id: colorId,
            ...baseData,
          });
          created.push(variant);
        }
      }
      return created;
    }

    // If only sizes
    if ((!colorIds || colorIds.length === 0)) {
      for (const sizeId of sizeIds) {
        if (!await this.combinationExists(productId, null, sizeId)) {
          const variant = await this.create({
            product_id: productId,
            size_id: sizeId,
            ...baseData,
          });
          created.push(variant);
        }
      }
      return created;
    }

    // Generate all color/size combinations
    for (const colorId of colorIds) {
      for (const sizeId of sizeIds) {
        if (!await this.combinationExists(productId, colorId, sizeId)) {
          const variant = await this.create({
            product_id: productId,
            color_id: colorId,
            size_id: sizeId,
            ...baseData,
          });
          created.push(variant);
        }
      }
    }

    return created;
  }

  /**
   * Get variants for export
   */
  static async getAllForExport(options = {}) {
    const { product_id } = options;

    let sql = `
      SELECT
        v.*,
        p.product_name_en,
        p.sku as product_sku,
        c.color_name_en,
        c.color_hex_code as color_code,
        s.size_name as size_name_en,
        s.size_value as size_code
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE 1=1
    `;

    const params = [];

    if (product_id) {
      sql += ' AND v.product_id = ?';
      params.push(product_id);
    }

    sql += ' ORDER BY p.product_name_en ASC, v.variant_id ASC';

    return await query(sql, params);
  }

  /**
   * Reorder variants
   * Note: display_order column doesn't exist in product_variants table
   */
  static async reorder(variantOrders) {
    // display_order column doesn't exist - no-op
    return true;
  }

  /**
   * Get variant price range for product
   * Note: price column is actually additional_price, is_active doesn't exist
   */
  static async getPriceRange(productId) {
    const sql = `
      SELECT
        MIN(additional_price) as min_price,
        MAX(additional_price) as max_price
      FROM product_variants
      WHERE product_id = ? AND additional_price IS NOT NULL
    `;

    const results = await query(sql, [productId]);
    return results[0];
  }

  /**
   * Get total stock for product
   */
  static async getTotalStock(productId) {
    const sql = `
      SELECT COALESCE(SUM(stock_quantity), 0) as total_stock
      FROM product_variants
      WHERE product_id = ?
    `;

    const results = await query(sql, [productId]);
    return results[0].total_stock;
  }

  /**
   * Sync product stock with variants
   */
  static async syncProductStock(productId) {
    const totalStock = await this.getTotalStock(productId);

    await query(
      'UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE product_id = ?',
      [totalStock, productId]
    );

    return totalStock;
  }

  /**
   * Get variants by color
   */
  static async getByColorId(colorId, options = {}) {
    const { page = 1, limit = 20, lang = 'en' } = options;
    const offset = (page - 1) * limit;

    const nameField = `p.product_name_${lang}`;

    const countSql = 'SELECT COUNT(*) as total FROM product_variants WHERE color_id = ?';
    const countResult = await query(countSql, [colorId]);
    const total = countResult[0].total;

    const sql = `
      SELECT
        v.*,
        ${nameField} as product_name,
        p.sku as product_sku,
        s.size_name as size_name
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE v.color_id = ?
      ORDER BY p.product_name_en ASC
      LIMIT ? OFFSET ?
    `;

    const variants = await query(sql, [colorId, limit, offset]);

    return {
      data: variants,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get variants by size
   */
  static async getBySizeId(sizeId, options = {}) {
    const { page = 1, limit = 20, lang = 'en' } = options;
    const offset = (page - 1) * limit;

    const nameField = `p.product_name_${lang}`;

    const countSql = 'SELECT COUNT(*) as total FROM product_variants WHERE size_id = ?';
    const countResult = await query(countSql, [sizeId]);
    const total = countResult[0].total;

    const sql = `
      SELECT
        v.*,
        ${nameField} as product_name,
        p.sku as product_sku,
        c.color_name_${lang} as color_name
      FROM product_variants v
      LEFT JOIN products p ON v.product_id = p.product_id
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      WHERE v.size_id = ?
      ORDER BY p.product_name_en ASC
      LIMIT ? OFFSET ?
    `;

    const variants = await query(sql, [sizeId, limit, offset]);

    return {
      data: variants,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Duplicate variant
   * Note: Many columns don't exist, using only actual columns
   */
  static async duplicate(variantId) {
    const variant = await this.getById(variantId);
    if (!variant) return null;

    return await this.create({
      product_id: variant.product_id,
      color_id: variant.color_id,
      size_id: variant.size_id,
      additional_price: variant.price || 0,
      stock_quantity: 0,
    });
  }

  /**
   * Get variant matrix for product (color x size)
   */
  static async getMatrix(productId, lang = 'en') {
    const variants = await this.getByProductId(productId, { lang });

    // Get unique colors and sizes
    const colors = [];
    const sizes = [];
    const colorMap = {};
    const sizeMap = {};

    for (const variant of variants) {
      if (variant.color_id && !colorMap[variant.color_id]) {
        colorMap[variant.color_id] = true;
        colors.push({
          color_id: variant.color_id,
          color_name: variant.color_name,
          color_code: variant.color_code,
        });
      }
      if (variant.size_id && !sizeMap[variant.size_id]) {
        sizeMap[variant.size_id] = true;
        sizes.push({
          size_id: variant.size_id,
          size_name: variant.size_name,
          size_code: variant.size_code,
        });
      }
    }

    // Build matrix
    const matrix = {};
    for (const variant of variants) {
      const colorKey = variant.color_id || 'none';
      const sizeKey = variant.size_id || 'none';

      if (!matrix[colorKey]) {
        matrix[colorKey] = {};
      }

      matrix[colorKey][sizeKey] = {
        variant_id: variant.variant_id,
        sku: variant.sku,
        price: variant.price,
        stock_quantity: variant.stock_quantity,
        is_active: variant.is_active,
      };
    }

    return {
      colors,
      sizes,
      variants,
      matrix,
    };
  }
}

module.exports = Variant;