/**
 * Color Model
 * @module models/color
 */

const { query } = require('../config/database');

/**
 * Color Model - Handles product colors database operations
 */
class Color {
  /**
   * Get all colors with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      is_active,
      sort = 'display_order',
      order = 'ASC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    const nameField = `color_name_${lang}`;

    if (search) {
      whereClause += ' AND (color_name_en LIKE ? OR color_name_ar LIKE ? OR color_name_he LIKE ? OR color_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM colors ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['color_id', 'color_name_en', 'color_code', 'display_order', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'display_order';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const sql = `
      SELECT 
        color_id,
        color_name_en,
        color_name_ar,
        color_name_he,
        ${nameField} as color_name,
        color_code,
        display_order,
        is_active,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM product_colors WHERE color_id = colors.color_id) as product_count
      FROM colors
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const colors = await query(sql, params);

    return {
      data: colors,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all colors without pagination (for dropdowns)
   */
  static async getAllList(options = {}) {
    const { lang = 'en' } = options;

    const nameField = `color_name_${lang}`;

    const sql = `
      SELECT
        color_id,
        color_name_en,
        color_name_ar,
        color_name_he,
        ${nameField} as color_name,
        color_hex_code as color_code
      FROM product_colors
      ORDER BY color_name_en ASC
    `;

    return await query(sql);
  }

  /**
   * Get color by ID
   */
  static async getById(colorId, lang = 'en') {
    const nameField = `color_name_${lang}`;

    const sql = `
      SELECT 
        color_id,
        color_name_en,
        color_name_ar,
        color_name_he,
        ${nameField} as color_name,
        color_code,
        display_order,
        is_active,
        created_by,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM product_colors WHERE color_id = colors.color_id) as product_count
      FROM colors
      WHERE color_id = ?
    `;

    const results = await query(sql, [colorId]);
    return results[0] || null;
  }

  /**
   * Get color by code
   */
  static async getByCode(colorCode) {
    const sql = 'SELECT * FROM colors WHERE color_code = ?';
    const results = await query(sql, [colorCode]);
    return results[0] || null;
  }

  /**
   * Get color by name
   */
  static async getByName(name, lang = 'en') {
    const nameField = `color_name_${lang}`;
    const sql = `SELECT * FROM colors WHERE ${nameField} = ?`;
    const results = await query(sql, [name]);
    return results[0] || null;
  }

  /**
   * Create a new color
   */
  static async create(data) {
    const {
      color_name_en,
      color_name_ar,
      color_name_he,
      color_code,
      display_order = 0,
      is_active = true,
      created_by,
    } = data;

    const sql = `
      INSERT INTO colors (
        color_name_en,
        color_name_ar,
        color_name_he,
        color_code,
        display_order,
        is_active,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      color_name_en,
      color_name_ar,
      color_name_he,
      color_code || null,
      display_order,
      is_active ? 1 : 0,
      created_by || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update a color
   */
  static async update(colorId, data) {
    const allowedFields = [
      'color_name_en',
      'color_name_ar',
      'color_name_he',
      'color_code',
      'display_order',
      'is_active',
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getById(colorId);
    }

    updates.push('updated_at = NOW()');
    values.push(colorId);

    const sql = `UPDATE colors SET ${updates.join(', ')} WHERE color_id = ?`;
    await query(sql, values);

    return await this.getById(colorId);
  }

  /**
   * Delete a color
   */
  static async delete(colorId) {
    const sql = 'DELETE FROM colors WHERE color_id = ?';
    const result = await query(sql, [colorId]);
    return result.affectedRows > 0;
  }

  /**
   * Toggle active status
   */
  static async toggleStatus(colorId) {
    const color = await this.getById(colorId);
    if (!color) return null;

    const newStatus = color.is_active ? 0 : 1;

    const sql = `
      UPDATE colors 
      SET is_active = ?, updated_at = NOW()
      WHERE color_id = ?
    `;

    await query(sql, [newStatus, colorId]);
    return await this.getById(colorId);
  }

  /**
   * Update display order for multiple colors
   */
  static async updateDisplayOrder(colors) {
    for (const color of colors) {
      await query(
        'UPDATE colors SET display_order = ?, updated_at = NOW() WHERE color_id = ?',
        [color.display_order, color.color_id]
      );
    }
    return true;
  }

  /**
   * Get product count for a color
   */
  static async getProductCount(colorId) {
    const sql = 'SELECT COUNT(*) as count FROM product_colors WHERE color_id = ?';
    const results = await query(sql, [colorId]);
    return results[0].count;
  }

  /**
   * Get products by color
   */
  static async getProductsByColor(colorId, options = {}) {
    const { page = 1, limit = 10, lang = 'en' } = options;
    const offset = (page - 1) * limit;

    const nameField = `product_name_${lang}`;

    const countSql = `
      SELECT COUNT(*) as total 
      FROM product_colors pc
      JOIN products p ON pc.product_id = p.product_id
      WHERE pc.color_id = ? AND p.is_active = 1
    `;
    const countResult = await query(countSql, [colorId]);
    const total = countResult[0].total;

    const sql = `
      SELECT
        p.product_id,
        p.${nameField} as product_name,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        pi.image_url
      FROM product_variants pv
      JOIN product_colors pc ON pv.color_id = pc.color_id
      JOIN products p ON pv.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE pc.color_id = ? AND p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = await query(sql, [colorId, limit, offset]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search colors
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `color_name_${lang}`;

    const sql = `
      SELECT 
        color_id,
        color_name_en,
        color_name_ar,
        color_name_he,
        ${nameField} as color_name,
        color_code,
        is_active
      FROM colors
      WHERE 
        color_name_en LIKE ? OR
        color_name_ar LIKE ? OR
        color_name_he LIKE ? OR
        color_code LIKE ?
      ORDER BY display_order ASC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, term, limit]);
  }

  /**
   * Get color statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_colors,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_colors,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_colors,
        (SELECT COUNT(DISTINCT color_id) FROM product_colors) as colors_in_use
      FROM colors
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get popular colors (most used in products)
   */
  static async getPopularColors(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `color_name_${lang}`;

    const sql = `
      SELECT 
        c.color_id,
        c.${nameField} as color_name,
        c.color_code,
        COUNT(pc.product_id) as product_count
      FROM colors c
      LEFT JOIN product_colors pc ON c.color_id = pc.color_id
      WHERE c.is_active = 1
      GROUP BY c.color_id
      ORDER BY product_count DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Bulk update colors
   */
  static async bulkUpdate(colorIds, data) {
    if (!colorIds || colorIds.length === 0) {
      return { updated: 0 };
    }

    const allowedFields = ['is_active'];
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

    updates.push('updated_at = NOW()');

    const placeholders = colorIds.map(() => '?').join(',');
    const sql = `UPDATE colors SET ${updates.join(', ')} WHERE color_id IN (${placeholders})`;

    const result = await query(sql, [...values, ...colorIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete colors
   */
  static async bulkDelete(colorIds) {
    if (!colorIds || colorIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = colorIds.map(() => '?').join(',');
    const sql = `DELETE FROM colors WHERE color_id IN (${placeholders})`;
    const result = await query(sql, colorIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Check if color name exists
   */
  static async nameExists(name, lang = 'en', excludeId = null) {
    const nameField = `color_name_${lang}`;

    let sql = `SELECT color_id FROM colors WHERE ${nameField} = ?`;
    const params = [name];

    if (excludeId) {
      sql += ' AND color_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Check if color code exists
   */
  static async codeExists(code, excludeId = null) {
    let sql = 'SELECT color_id FROM colors WHERE color_code = ?';
    const params = [code];

    if (excludeId) {
      sql += ' AND color_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Duplicate color
   */
  static async duplicate(colorId, createdBy = null) {
    const color = await this.getById(colorId);
    if (!color) return null;

    const newColor = await this.create({
      color_name_en: `${color.color_name_en} (Copy)`,
      color_name_ar: `${color.color_name_ar} (نسخة)`,
      color_name_he: `${color.color_name_he} (עותק)`,
      color_code: null, // Must be unique
      display_order: color.display_order + 1,
      is_active: false,
      created_by: createdBy,
    });

    return newColor;
  }

  /**
   * Get all colors for export
   */
  static async getAllForExport(options = {}) {
    const { is_active } = options;

    let sql = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM product_colors WHERE color_id = c.color_id) as product_count
      FROM colors c
    `;

    const params = [];

    if (is_active !== undefined) {
      sql += ' WHERE c.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    sql += ' ORDER BY c.display_order ASC';

    return await query(sql, params);
  }

  /**
   * Get colors by product
   */
  static async getByProduct(productId, lang = 'en') {
    const nameField = `color_name_${lang}`;

    const sql = `
      SELECT 
        c.color_id,
        c.color_name_en,
        c.color_name_ar,
        c.color_name_he,
        c.${nameField} as color_name,
        c.color_code,
        c.is_active
      FROM colors c
      JOIN product_colors pc ON c.color_id = pc.color_id
      WHERE pc.product_id = ?
      ORDER BY c.display_order ASC
    `;

    return await query(sql, [productId]);
  }

  /**
   * Add colors to product
   */
  static async addToProduct(productId, colorIds) {
    if (!colorIds || colorIds.length === 0) {
      return { added: 0 };
    }

    let added = 0;
    for (const colorId of colorIds) {
      try {
        await query(
          'INSERT IGNORE INTO product_colors (product_id, color_id) VALUES (?, ?)',
          [productId, colorId]
        );
        added++;
      } catch (error) {
        // Ignore duplicate entry errors
      }
    }

    return { added };
  }

  /**
   * Remove colors from product
   */
  static async removeFromProduct(productId, colorIds = null) {
    if (colorIds && colorIds.length > 0) {
      const placeholders = colorIds.map(() => '?').join(',');
      const sql = `DELETE FROM product_colors WHERE product_id = ? AND color_id IN (${placeholders})`;
      const result = await query(sql, [productId, ...colorIds]);
      return { removed: result.affectedRows };
    } else {
      // Remove all colors from product
      const sql = 'DELETE FROM product_colors WHERE product_id = ?';
      const result = await query(sql, [productId]);
      return { removed: result.affectedRows };
    }
  }

  /**
   * Sync product colors (replace all)
   */
  static async syncProductColors(productId, colorIds) {
    // Remove all existing
    await this.removeFromProduct(productId);

    // Add new ones
    if (colorIds && colorIds.length > 0) {
      return await this.addToProduct(productId, colorIds);
    }

    return { added: 0 };
  }

  /**
   * Get usage report
   */
  static async getUsageReport(options = {}) {
    const { period = 'month', lang = 'en' } = options;

    const nameField = `color_name_${lang}`;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
    }

    const sql = `
      SELECT 
        c.color_id,
        c.${nameField} as color_name,
        c.color_code,
        COUNT(DISTINCT oi.order_item_id) as order_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM colors c
      LEFT JOIN order_items oi ON c.color_id = oi.color_id
      LEFT JOIN orders o ON oi.order_id = o.order_id ${dateFilter}
      WHERE c.is_active = 1
      GROUP BY c.color_id
      ORDER BY total_quantity DESC
    `;

    return await query(sql);
  }
}

module.exports = Color;