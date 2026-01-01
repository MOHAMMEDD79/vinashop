/**
 * Size Model
 * @module models/size
 */

const { query } = require('../config/database');

/**
 * Size Model - Handles product sizes database operations
 */
class Size {
  /**
   * Get all sizes with pagination
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

    const nameField = `size_name_${lang}`;

    if (search) {
      whereClause += ' AND (size_name_en LIKE ? OR size_name_ar LIKE ? OR size_name_he LIKE ? OR size_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM sizes ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['size_id', 'size_name_en', 'size_code', 'display_order', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'display_order';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        size_id,
        size_name_en,
        size_name_ar,
        size_name_he,
        ${nameField} as size_name,
        size_code,
        description,
        is_active,
        display_order,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM product_sizes WHERE size_id = sizes.size_id) as product_count
      FROM sizes
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const sizes = await query(sql, params);

    return {
      data: sizes,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all sizes without pagination (for dropdowns)
   */
  static async getAllList(options = {}) {
    const sql = `
      SELECT
        size_id,
        size_name,
        size_value,
        size_unit
      FROM product_sizes
      ORDER BY size_id ASC
    `;

    return await query(sql);
  }

  /**
   * Get size by ID
   */
  static async getById(sizeId, lang = 'en') {
    const nameField = `size_name_${lang}`;

    const sql = `
      SELECT 
        size_id,
        size_name_en,
        size_name_ar,
        size_name_he,
        ${nameField} as size_name,
        size_code,
        description,
        is_active,
        display_order,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM product_sizes WHERE size_id = sizes.size_id) as product_count
      FROM sizes
      WHERE size_id = ?
    `;

    const results = await query(sql, [sizeId]);
    return results[0] || null;
  }

  /**
   * Get size by code
   */
  static async getByCode(sizeCode) {
    const sql = 'SELECT * FROM sizes WHERE size_code = ?';
    const results = await query(sql, [sizeCode]);
    return results[0] || null;
  }

  /**
   * Get size by name
   */
  static async getByName(sizeName, lang = 'en') {
    const nameField = `size_name_${lang}`;
    const sql = `SELECT * FROM sizes WHERE ${nameField} = ?`;
    const results = await query(sql, [sizeName]);
    return results[0] || null;
  }

  /**
   * Create a new size
   */
  static async create(data) {
    const {
      size_name_en,
      size_name_ar,
      size_name_he,
      size_code,
      description,
      is_active = true,
      display_order = 0,
    } = data;

    const sql = `
      INSERT INTO sizes (
        size_name_en,
        size_name_ar,
        size_name_he,
        size_code,
        description,
        is_active,
        display_order,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      size_name_en,
      size_name_ar,
      size_name_he,
      size_code || null,
      description || null,
      is_active ? 1 : 0,
      display_order,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update size
   */
  static async update(sizeId, data) {
    const allowedFields = [
      'size_name_en',
      'size_name_ar',
      'size_name_he',
      'size_code',
      'description',
      'is_active',
      'display_order',
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
      return await this.getById(sizeId);
    }

    updates.push('updated_at = NOW()');
    values.push(sizeId);

    const sql = `UPDATE sizes SET ${updates.join(', ')} WHERE size_id = ?`;
    await query(sql, values);

    return await this.getById(sizeId);
  }

  /**
   * Delete size
   */
  static async delete(sizeId) {
    // Remove from product_sizes first
    await query('DELETE FROM product_sizes WHERE size_id = ?', [sizeId]);

    const sql = 'DELETE FROM sizes WHERE size_id = ?';
    const result = await query(sql, [sizeId]);
    return result.affectedRows > 0;
  }

  /**
   * Toggle active status
   */
  static async toggleStatus(sizeId) {
    const size = await this.getById(sizeId);
    if (!size) return null;

    const newStatus = size.is_active ? 0 : 1;

    const sql = `
      UPDATE sizes 
      SET is_active = ?, updated_at = NOW()
      WHERE size_id = ?
    `;

    await query(sql, [newStatus, sizeId]);
    return await this.getById(sizeId);
  }

  /**
   * Update display order
   */
  static async updateDisplayOrder(sizeId, displayOrder) {
    const sql = `
      UPDATE sizes 
      SET display_order = ?, updated_at = NOW()
      WHERE size_id = ?
    `;

    await query(sql, [displayOrder, sizeId]);
    return await this.getById(sizeId);
  }

  /**
   * Get product count for size
   */
  static async getProductCount(sizeId) {
    const sql = 'SELECT COUNT(*) as count FROM product_sizes WHERE size_id = ?';
    const results = await query(sql, [sizeId]);
    return results[0].count;
  }

  /**
   * Get products by size
   */
  static async getProductsBySize(sizeId, options = {}) {
    const { page = 1, limit = 20, lang = 'en' } = options;
    const offset = (page - 1) * limit;

    const nameField = `p.product_name_${lang}`;

    const countSql = `
      SELECT COUNT(*) as total 
      FROM product_sizes ps
      JOIN products p ON ps.product_id = p.product_id
      WHERE ps.size_id = ?
    `;
    const countResult = await query(countSql, [sizeId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        p.product_id,
        p.sku,
        ${nameField} as product_name,
        p.price,
        p.stock_quantity,
        p.is_active,
        COALESCE(pi.image_url, p.main_image) as image_url
      FROM product_sizes ps
      JOIN products p ON ps.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE ps.size_id = ?
      ORDER BY p.product_name_en ASC
      LIMIT ? OFFSET ?
    `;

    const products = await query(sql, [sizeId, limit, offset]);

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
   * Search sizes
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `size_name_${lang}`;

    const sql = `
      SELECT 
        size_id,
        size_name_en,
        size_name_ar,
        size_name_he,
        ${nameField} as size_name,
        size_code,
        is_active
      FROM sizes
      WHERE 
        size_name_en LIKE ? OR
        size_name_ar LIKE ? OR
        size_name_he LIKE ? OR
        size_code LIKE ?
      ORDER BY display_order ASC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, term, limit]);
  }

  /**
   * Get size statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_sizes,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_sizes,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_sizes
      FROM sizes
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get popular sizes (most used in products)
   */
  static async getPopularSizes(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `s.size_name_${lang}`;

    const sql = `
      SELECT 
        s.size_id,
        ${nameField} as size_name,
        s.size_code,
        COUNT(ps.product_id) as product_count
      FROM sizes s
      LEFT JOIN product_sizes ps ON s.size_id = ps.size_id
      WHERE s.is_active = 1
      GROUP BY s.size_id
      ORDER BY product_count DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Bulk update sizes
   */
  static async bulkUpdate(sizeIds, data) {
    if (!sizeIds || sizeIds.length === 0) {
      return { updated: 0 };
    }

    const allowedFields = ['is_active', 'display_order'];
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

    const placeholders = sizeIds.map(() => '?').join(',');
    const sql = `UPDATE sizes SET ${updates.join(', ')} WHERE size_id IN (${placeholders})`;

    const result = await query(sql, [...values, ...sizeIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete sizes
   */
  static async bulkDelete(sizeIds) {
    if (!sizeIds || sizeIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = sizeIds.map(() => '?').join(',');

    // Remove from product_sizes first
    await query(`DELETE FROM product_sizes WHERE size_id IN (${placeholders})`, sizeIds);

    const sql = `DELETE FROM sizes WHERE size_id IN (${placeholders})`;
    const result = await query(sql, sizeIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Check if size name exists
   */
  static async nameExists(sizeName, lang = 'en', excludeId = null) {
    const nameField = `size_name_${lang}`;
    let sql = `SELECT size_id FROM sizes WHERE ${nameField} = ?`;
    const params = [sizeName];

    if (excludeId) {
      sql += ' AND size_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Check if size code exists
   */
  static async codeExists(sizeCode, excludeId = null) {
    let sql = 'SELECT size_id FROM sizes WHERE size_code = ?';
    const params = [sizeCode];

    if (excludeId) {
      sql += ' AND size_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Duplicate size
   */
  static async duplicate(sizeId) {
    const size = await this.getById(sizeId);
    if (!size) return null;

    const newCode = size.size_code ? `${size.size_code}-COPY` : null;

    return await this.create({
      size_name_en: `${size.size_name_en} (Copy)`,
      size_name_ar: `${size.size_name_ar} (نسخة)`,
      size_name_he: `${size.size_name_he} (עותק)`,
      size_code: newCode,
      description: size.description,
      is_active: false,
      display_order: size.display_order,
    });
  }

  /**
   * Get all sizes for export
   */
  static async getAllForExport() {
    const sql = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM product_sizes WHERE size_id = s.size_id) as product_count
      FROM sizes s
      ORDER BY s.display_order ASC
    `;

    return await query(sql);
  }

  /**
   * Get sizes by product
   */
  static async getByProduct(productId, lang = 'en') {
    const nameField = `s.size_name_${lang}`;

    const sql = `
      SELECT 
        s.size_id,
        ${nameField} as size_name,
        s.size_code,
        s.is_active
      FROM product_sizes ps
      JOIN sizes s ON ps.size_id = s.size_id
      WHERE ps.product_id = ?
      ORDER BY s.display_order ASC
    `;

    return await query(sql, [productId]);
  }

  /**
   * Add size to product
   */
  static async addToProduct(productId, sizeId) {
    const sql = `
      INSERT IGNORE INTO product_sizes (product_id, size_id, created_at)
      VALUES (?, ?, NOW())
    `;

    const result = await query(sql, [productId, sizeId]);
    return result.affectedRows > 0;
  }

  /**
   * Remove size from product
   */
  static async removeFromProduct(productId, sizeId) {
    const sql = 'DELETE FROM product_sizes WHERE product_id = ? AND size_id = ?';
    const result = await query(sql, [productId, sizeId]);
    return result.affectedRows > 0;
  }

  /**
   * Sync product sizes
   */
  static async syncProductSizes(productId, sizeIds) {
    // Remove all existing
    await query('DELETE FROM product_sizes WHERE product_id = ?', [productId]);

    // Add new ones
    if (sizeIds && sizeIds.length > 0) {
      for (const sizeId of sizeIds) {
        await this.addToProduct(productId, sizeId);
      }
    }

    return await this.getByProduct(productId);
  }

  /**
   * Get size usage report (in orders)
   */
  static async getUsageReport(options = {}) {
    const { date_from, date_to, lang = 'en' } = options;

    const nameField = `s.size_name_${lang}`;

    let whereClause = '';
    const params = [];

    if (date_from || date_to) {
      whereClause = 'WHERE ';
      if (date_from) {
        whereClause += 'DATE(o.created_at) >= ?';
        params.push(date_from);
      }
      if (date_to) {
        if (date_from) whereClause += ' AND ';
        whereClause += 'DATE(o.created_at) <= ?';
        params.push(date_to);
      }
    }

    const sql = `
      SELECT 
        s.size_id,
        ${nameField} as size_name,
        s.size_code,
        COUNT(oi.order_item_id) as order_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total) as total_revenue
      FROM sizes s
      LEFT JOIN order_items oi ON s.size_id = oi.size_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      ${whereClause}
      GROUP BY s.size_id
      ORDER BY total_quantity DESC
    `;

    return await query(sql, params);
  }

  /**
   * Reorder sizes
   */
  static async reorder(sizeOrders) {
    // sizeOrders is an array of { size_id, display_order }
    for (const item of sizeOrders) {
      await query(
        'UPDATE sizes SET display_order = ?, updated_at = NOW() WHERE size_id = ?',
        [item.display_order, item.size_id]
      );
    }

    return true;
  }

  /**
   * Get sizes with variant counts
   */
  static async getWithVariantCounts(lang = 'en') {
    const nameField = `s.size_name_${lang}`;

    const sql = `
      SELECT 
        s.size_id,
        ${nameField} as size_name,
        s.size_code,
        s.is_active,
        (SELECT COUNT(*) FROM product_sizes WHERE size_id = s.size_id) as product_count,
        (SELECT COUNT(*) FROM product_variants WHERE size_id = s.size_id) as variant_count
      FROM sizes s
      ORDER BY s.display_order ASC
    `;

    return await query(sql);
  }
}

module.exports = Size;