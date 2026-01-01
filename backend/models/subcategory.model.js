/**
 * Subcategory Model
 * @module models/subcategory
 */

const { query } = require('../config/database');

/**
 * Subcategory Model - Handles subcategories database operations
 */
class Subcategory {
  /**
   * Get all subcategories with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      category_id,
      is_active,
      is_featured,
      sort = 'display_order',
      order = 'ASC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    const nameField = `sc.subcategory_name_${lang}`;
    const catNameField = `c.category_name_${lang}`;

    if (search) {
      whereClause += ' AND (sc.subcategory_name_en LIKE ? OR sc.subcategory_name_ar LIKE ? OR sc.subcategory_name_he LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      whereClause += ' AND sc.category_id = ?';
      params.push(category_id);
    }

    if (is_active !== undefined) {
      whereClause += ' AND sc.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (is_featured !== undefined) {
      whereClause += ' AND sc.is_featured = ?';
      params.push(is_featured ? 1 : 0);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM subcategories sc
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['subcategory_id', 'subcategory_name_en', 'display_order', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `sc.${sort}` : 'sc.display_order';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        sc.subcategory_id,
        sc.category_id,
        sc.parent_id,
        sc.level,
        sc.subcategory_name_en,
        sc.subcategory_name_ar,
        sc.subcategory_name_he,
        ${nameField} as subcategory_name,
        sc.subcategory_description_en as description_en,
        sc.subcategory_description_en as description,
        sc.subcategory_image as image_url,
        sc.is_active,
        COALESCE(sc.is_featured, 0) as is_featured,
        sc.display_order,
        sc.created_at,
        ${catNameField} as category_name,
        c.category_name_en,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id) as product_count,
        (SELECT COUNT(*) FROM subcategories WHERE parent_id = sc.subcategory_id) as children_count
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.category_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const subcategories = await query(sql, params);

    return {
      data: subcategories,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all subcategories without pagination (for dropdowns)
   */
  static async getAllList(options = {}) {
    const { is_active = true, category_id, lang = 'en' } = options;

    const nameField = `sc.subcategory_name_${lang}`;
    const catNameField = `c.category_name_${lang}`;

    let sql = `
      SELECT 
        sc.subcategory_id,
        sc.category_id,
        sc.subcategory_name_en,
        sc.subcategory_name_ar,
        sc.subcategory_name_he,
        ${nameField} as subcategory_name,
        ${catNameField} as category_name,
        sc.is_active
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.category_id
      WHERE 1=1
    `;

    const params = [];

    if (is_active) {
      sql += ' AND sc.is_active = 1';
    }

    if (category_id) {
      sql += ' AND sc.category_id = ?';
      params.push(category_id);
    }

    sql += ' ORDER BY c.display_order ASC, sc.display_order ASC, sc.subcategory_name_en ASC';

    return await query(sql, params);
  }

  /**
   * Get subcategory by ID
   */
  static async getById(subcategoryId, lang = 'en') {
    const nameField = `sc.subcategory_name_${lang}`;
    const catNameField = `c.category_name_${lang}`;

    const sql = `
      SELECT
        sc.subcategory_id,
        sc.category_id,
        sc.parent_id,
        sc.level,
        sc.subcategory_name_en,
        sc.subcategory_name_ar,
        sc.subcategory_name_he,
        ${nameField} as subcategory_name,
        sc.subcategory_description_en as description_en,
        sc.subcategory_description_en as description,
        sc.subcategory_image as image_url,
        sc.display_order,
        sc.is_active,
        COALESCE(sc.is_featured, 0) as is_featured,
        sc.created_at,
        ${catNameField} as category_name,
        c.category_name_en,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id) as product_count,
        (SELECT COUNT(*) FROM subcategories WHERE parent_id = sc.subcategory_id) as children_count
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.category_id
      WHERE sc.subcategory_id = ?
    `;

    const results = await query(sql, [subcategoryId]);
    return results[0] || null;
  }

  /**
   * Get subcategory by name
   */
  static async getByName(subcategoryName, lang = 'en') {
    const nameField = `subcategory_name_${lang}`;
    const sql = `SELECT * FROM subcategories WHERE ${nameField} = ?`;
    const results = await query(sql, [subcategoryName]);
    return results[0] || null;
  }

  /**
   * Get subcategories by category
   */
  static async getByCategory(categoryId, options = {}) {
    const { is_active, lang = 'en' } = options;

    const nameField = `subcategory_name_${lang}`;

    let sql = `
      SELECT
        subcategory_id,
        category_id,
        parent_id,
        level,
        subcategory_name_en,
        subcategory_name_ar,
        subcategory_name_he,
        ${nameField} as subcategory_name,
        subcategory_description_en as description,
        subcategory_image as image_url,
        is_active,
        COALESCE(is_featured, 0) as is_featured,
        display_order,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = subcategories.subcategory_id) as product_count,
        (SELECT COUNT(*) FROM subcategories sc2 WHERE sc2.parent_id = subcategories.subcategory_id) as children_count
      FROM subcategories
      WHERE category_id = ?
    `;

    const params = [categoryId];

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    sql += ' ORDER BY display_order ASC, subcategory_name_en ASC';

    return await query(sql, params);
  }

  /**
   * Create a new subcategory
   */
  static async create(data) {
    const {
      category_id,
      parent_id = null,
      level = 1,
      subcategory_name_en,
      subcategory_name_ar,
      subcategory_name_he,
      description_en,
      image_url,
      subcategory_image,
      is_active = true,
      is_featured = false,
      display_order = 0,
    } = data;

    const finalImageUrl = image_url || subcategory_image || null;

    const sql = `
      INSERT INTO subcategories (
        category_id,
        parent_id,
        level,
        subcategory_name_en,
        subcategory_name_ar,
        subcategory_name_he,
        subcategory_description_en,
        subcategory_image,
        is_active,
        is_featured,
        display_order,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      category_id,
      parent_id,
      level,
      subcategory_name_en,
      subcategory_name_ar || subcategory_name_en,
      subcategory_name_he || subcategory_name_en,
      description_en || null,
      finalImageUrl,
      is_active ? 1 : 0,
      is_featured ? 1 : 0,
      display_order,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update subcategory
   */
  static async update(subcategoryId, data) {
    const allowedFields = [
      'category_id',
      'parent_id',
      'level',
      'subcategory_name_en',
      'subcategory_name_ar',
      'subcategory_name_he',
      'subcategory_description_en',
      'subcategory_image',
      'image_url',
      'is_active',
      'is_featured',
      'display_order',
    ];

    // Map description_en to subcategory_description_en
    if (data.description_en !== undefined) {
      data.subcategory_description_en = data.description_en;
      delete data.description_en;
    }

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
      return await this.getById(subcategoryId);
    }

    updates.push('updated_at = NOW()');
    values.push(subcategoryId);

    const sql = `UPDATE subcategories SET ${updates.join(', ')} WHERE subcategory_id = ?`;
    await query(sql, values);

    return await this.getById(subcategoryId);
  }

  /**
   * Delete subcategory
   */
  static async delete(subcategoryId) {
    // Check if subcategory has products
    const productCount = await this.getProductCount(subcategoryId);
    if (productCount > 0) {
      // Update products to remove subcategory reference
      await query('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?', [subcategoryId]);
    }

    const sql = 'DELETE FROM subcategories WHERE subcategory_id = ?';
    const result = await query(sql, [subcategoryId]);
    return result.affectedRows > 0;
  }

  /**
   * Toggle active status
   */
  static async toggleStatus(subcategoryId) {
    const subcategory = await this.getById(subcategoryId);
    if (!subcategory) return null;

    const newStatus = subcategory.is_active ? 0 : 1;

    const sql = `
      UPDATE subcategories 
      SET is_active = ?, updated_at = NOW()
      WHERE subcategory_id = ?
    `;

    await query(sql, [newStatus, subcategoryId]);
    return await this.getById(subcategoryId);
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(subcategoryId) {
    const subcategory = await this.getById(subcategoryId);
    if (!subcategory) return null;

    const newStatus = subcategory.is_featured ? 0 : 1;

    const sql = `
      UPDATE subcategories 
      SET is_featured = ?, updated_at = NOW()
      WHERE subcategory_id = ?
    `;

    await query(sql, [newStatus, subcategoryId]);
    return await this.getById(subcategoryId);
  }

  /**
   * Update image
   */
  static async updateImage(subcategoryId, imageUrl) {
    const sql = `
      UPDATE subcategories 
      SET image_url = ?, updated_at = NOW()
      WHERE subcategory_id = ?
    `;

    await query(sql, [imageUrl, subcategoryId]);
    return await this.getById(subcategoryId);
  }

  /**
   * Update display order
   */
  static async updateDisplayOrder(subcategoryId, displayOrder) {
    const sql = `
      UPDATE subcategories 
      SET display_order = ?, updated_at = NOW()
      WHERE subcategory_id = ?
    `;

    await query(sql, [displayOrder, subcategoryId]);
    return await this.getById(subcategoryId);
  }

  /**
   * Get product count for subcategory
   */
  static async getProductCount(subcategoryId) {
    const sql = 'SELECT COUNT(*) as count FROM products WHERE subcategory_id = ?';
    const results = await query(sql, [subcategoryId]);
    return results[0].count;
  }

  /**
   * Get subcategory with products
   */
  static async getWithProducts(subcategoryId, options = {}) {
    const { page = 1, limit = 20, lang = 'en' } = options;
    const offset = (page - 1) * limit;

    const subcategory = await this.getById(subcategoryId, lang);
    if (!subcategory) return null;

    const nameField = `p.product_name_${lang}`;

    const countSql = 'SELECT COUNT(*) as total FROM products WHERE subcategory_id = ? AND is_active = 1';
    const countResult = await query(countSql, [subcategoryId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        p.product_id,
        p.sku,
        ${nameField} as product_name,
        p.price,
        p.compare_price,
        p.discount_percentage,
        p.stock_quantity,
        COALESCE(pi.image_url, p.main_image) as image_url,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.product_id AND is_approved = 1) as avg_rating
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.subcategory_id = ? AND p.is_active = 1
      ORDER BY p.display_order ASC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = await query(sql, [subcategoryId, limit, offset]);

    subcategory.products = {
      data: products,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };

    return subcategory;
  }

  /**
   * Get featured subcategories
   */
  static async getFeatured(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `sc.subcategory_name_${lang}`;
    const catNameField = `c.category_name_${lang}`;

    const sql = `
      SELECT 
        sc.subcategory_id,
        sc.category_id,
        ${nameField} as subcategory_name,
        ${catNameField} as category_name,
        sc.subcategory_image as image_url,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id AND is_active = 1) as product_count
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.category_id
      WHERE sc.is_active = 1 AND COALESCE(sc.is_featured, 0) = 1
      ORDER BY sc.display_order ASC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get subcategories with product counts
   */
  static async getWithProductCounts(options = {}) {
    const { category_id, is_active, lang = 'en' } = options;

    const nameField = `sc.subcategory_name_${lang}`;
    const catNameField = `c.category_name_${lang}`;

    let sql = `
      SELECT 
        sc.subcategory_id,
        sc.category_id,
        ${nameField} as subcategory_name,
        ${catNameField} as category_name,
        sc.subcategory_image as image_url,
        sc.is_active,
        COALESCE(sc.is_featured, 0) as is_featured,
        sc.display_order,
        COUNT(p.product_id) as product_count
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.category_id
      LEFT JOIN products p ON sc.subcategory_id = p.subcategory_id AND p.is_active = 1
      WHERE 1=1
    `;

    const params = [];

    if (category_id) {
      sql += ' AND sc.category_id = ?';
      params.push(category_id);
    }

    if (is_active !== undefined) {
      sql += ' AND sc.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    sql += ' GROUP BY sc.subcategory_id ORDER BY sc.display_order ASC';

    return await query(sql, params);
  }

  /**
   * Search subcategories
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `subcategory_name_${lang}`;

    const sql = `
      SELECT 
        sc.subcategory_id,
        sc.category_id,
        sc.subcategory_name_en,
        sc.subcategory_name_ar,
        sc.subcategory_name_he,
        sc.${nameField} as subcategory_name,
        sc.subcategory_image as image_url,
        sc.is_active,
        c.category_name_${lang} as category_name
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.category_id
      WHERE 
        sc.subcategory_name_en LIKE ? OR
        sc.subcategory_name_ar LIKE ? OR
        sc.subcategory_name_he LIKE ?
      ORDER BY sc.display_order ASC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, limit]);
  }

  /**
   * Get subcategory statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_subcategories,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_subcategories,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_subcategories,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_subcategories,
        (SELECT COUNT(*) FROM products WHERE subcategory_id IS NOT NULL) as products_with_subcategory
      FROM subcategories
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Bulk update subcategories
   */
  static async bulkUpdate(subcategoryIds, data) {
    if (!subcategoryIds || subcategoryIds.length === 0) {
      return { updated: 0 };
    }

    const allowedFields = ['is_active', 'is_featured', 'category_id', 'display_order'];
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

    const placeholders = subcategoryIds.map(() => '?').join(',');
    const sql = `UPDATE subcategories SET ${updates.join(', ')} WHERE subcategory_id IN (${placeholders})`;

    const result = await query(sql, [...values, ...subcategoryIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete subcategories
   */
  static async bulkDelete(subcategoryIds) {
    if (!subcategoryIds || subcategoryIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = subcategoryIds.map(() => '?').join(',');

    // Update products to remove subcategory reference
    await query(`UPDATE products SET subcategory_id = NULL WHERE subcategory_id IN (${placeholders})`, subcategoryIds);

    const sql = `DELETE FROM subcategories WHERE subcategory_id IN (${placeholders})`;
    const result = await query(sql, subcategoryIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Check if subcategory name exists
   */
  static async nameExists(subcategoryName, categoryId, lang = 'en', excludeId = null) {
    const nameField = `subcategory_name_${lang}`;
    let sql = `SELECT subcategory_id FROM subcategories WHERE ${nameField} = ? AND category_id = ?`;
    const params = [subcategoryName, categoryId];

    if (excludeId) {
      sql += ' AND subcategory_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Duplicate subcategory
   */
  static async duplicate(subcategoryId) {
    const subcategory = await this.getById(subcategoryId);
    if (!subcategory) return null;

    return await this.create({
      category_id: subcategory.category_id,
      subcategory_name_en: `${subcategory.subcategory_name_en} (Copy)`,
      subcategory_name_ar: `${subcategory.subcategory_name_ar || subcategory.subcategory_name_en} (نسخة)`,
      subcategory_name_he: `${subcategory.subcategory_name_he || subcategory.subcategory_name_en} (עותק)`,
      description_en: subcategory.description_en,
      image_url: subcategory.image_url,
      is_active: false,
      is_featured: false,
      display_order: subcategory.display_order,
    });
  }

  /**
   * Get all subcategories for export
   */
  static async getAllForExport(options = {}) {
    const { category_id } = options;

    let sql = `
      SELECT 
        sc.*,
        c.category_name_en,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id) as product_count
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.category_id
      WHERE 1=1
    `;

    const params = [];

    if (category_id) {
      sql += ' AND sc.category_id = ?';
      params.push(category_id);
    }

    sql += ' ORDER BY c.display_order ASC, sc.display_order ASC';

    return await query(sql, params);
  }

  /**
   * Move subcategory to another category
   */
  static async moveToCategory(subcategoryId, newCategoryId) {
    const sql = `
      UPDATE subcategories 
      SET category_id = ?, updated_at = NOW()
      WHERE subcategory_id = ?
    `;

    await query(sql, [newCategoryId, subcategoryId]);
    return await this.getById(subcategoryId);
  }

  /**
   * Reorder subcategories within a category
   */
  static async reorder(subcategoryOrders) {
    // subcategoryOrders is an array of { subcategory_id, display_order }
    for (const item of subcategoryOrders) {
      await query(
        'UPDATE subcategories SET display_order = ?, updated_at = NOW() WHERE subcategory_id = ?',
        [item.display_order, item.subcategory_id]
      );
    }

    return true;
  }

  /**
   * Get subcategory tree (grouped by category)
   */
  static async getTree(options = {}) {
    const { is_active, lang = 'en' } = options;

    const catNameField = `c.category_name_${lang}`;
    const subNameField = `sc.subcategory_name_${lang}`;

    let whereClause = 'WHERE c.is_active = 1';
    const params = [];

    if (is_active !== undefined) {
      whereClause += ' AND sc.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    const sql = `
      SELECT 
        c.category_id,
        ${catNameField} as category_name,
        c.display_order as category_order,
        sc.subcategory_id,
        ${subNameField} as subcategory_name,
        sc.display_order as subcategory_order,
        sc.is_active,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id) as product_count
      FROM categories c
      LEFT JOIN subcategories sc ON c.category_id = sc.category_id
      ${whereClause}
      ORDER BY c.display_order ASC, sc.display_order ASC
    `;

    const results = await query(sql, params);

    // Group by category
    const tree = [];
    const categoryMap = {};

    for (const row of results) {
      if (!categoryMap[row.category_id]) {
        categoryMap[row.category_id] = {
          category_id: row.category_id,
          category_name: row.category_name,
          subcategories: [],
        };
        tree.push(categoryMap[row.category_id]);
      }

      if (row.subcategory_id) {
        categoryMap[row.category_id].subcategories.push({
          subcategory_id: row.subcategory_id,
          subcategory_name: row.subcategory_name,
          is_active: row.is_active,
          product_count: row.product_count,
        });
      }
    }

    return tree;
  }

  /**
   * Get count by category
   */
  static async getCountByCategory() {
    const sql = `
      SELECT
        c.category_id,
        c.category_name_en as category_name,
        COUNT(sc.subcategory_id) as subcategory_count
      FROM categories c
      LEFT JOIN subcategories sc ON c.category_id = sc.category_id
      GROUP BY c.category_id
      ORDER BY c.display_order ASC
    `;

    return await query(sql);
  }

  // ==================== NESTED SUBCATEGORY METHODS ====================

  /**
   * Get children subcategories (direct children only)
   */
  static async getChildren(parentId, options = {}) {
    const { is_active, lang = 'en' } = options;
    const nameField = `subcategory_name_${lang}`;

    let sql = `
      SELECT
        sc.subcategory_id,
        sc.category_id,
        sc.parent_id,
        sc.level,
        sc.subcategory_name_en,
        sc.subcategory_name_ar,
        sc.subcategory_name_he,
        sc.${nameField} as subcategory_name,
        sc.subcategory_image as image_url,
        sc.is_active,
        sc.display_order,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id) as product_count,
        (SELECT COUNT(*) FROM subcategories WHERE parent_id = sc.subcategory_id) as children_count
      FROM subcategories sc
      WHERE sc.parent_id = ?
    `;

    const params = [parentId];

    if (is_active !== undefined) {
      sql += ' AND sc.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    sql += ' ORDER BY sc.display_order ASC, sc.subcategory_name_en ASC';

    return await query(sql, params);
  }

  /**
   * Get root subcategories (no parent, direct children of category)
   */
  static async getRootByCategory(categoryId, options = {}) {
    const { is_active, lang = 'en' } = options;
    const nameField = `subcategory_name_${lang}`;

    let sql = `
      SELECT
        sc.subcategory_id,
        sc.category_id,
        sc.parent_id,
        sc.level,
        sc.subcategory_name_en,
        sc.subcategory_name_ar,
        sc.subcategory_name_he,
        sc.${nameField} as subcategory_name,
        sc.subcategory_image as image_url,
        sc.is_active,
        sc.display_order,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id) as product_count,
        (SELECT COUNT(*) FROM subcategories WHERE parent_id = sc.subcategory_id) as children_count
      FROM subcategories sc
      WHERE sc.category_id = ? AND sc.parent_id IS NULL
    `;

    const params = [categoryId];

    if (is_active !== undefined) {
      sql += ' AND sc.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    sql += ' ORDER BY sc.display_order ASC, sc.subcategory_name_en ASC';

    return await query(sql, params);
  }

  /**
   * Get parent chain (breadcrumbs) from a subcategory up to root
   */
  static async getParentChain(subcategoryId, lang = 'en') {
    const nameField = `subcategory_name_${lang}`;
    const catNameField = `category_name_${lang}`;
    const chain = [];

    let currentId = subcategoryId;

    // Traverse up the tree
    while (currentId) {
      const sql = `
        SELECT
          sc.subcategory_id,
          sc.category_id,
          sc.parent_id,
          sc.level,
          sc.${nameField} as subcategory_name,
          c.${catNameField} as category_name
        FROM subcategories sc
        LEFT JOIN categories c ON sc.category_id = c.category_id
        WHERE sc.subcategory_id = ?
      `;

      const results = await query(sql, [currentId]);

      if (results.length === 0) break;

      chain.unshift(results[0]); // Add to beginning
      currentId = results[0].parent_id;
    }

    // Add category at the beginning if we have results
    if (chain.length > 0) {
      const catSql = `
        SELECT
          category_id,
          ${catNameField} as category_name,
          category_image
        FROM categories
        WHERE category_id = ?
      `;
      const catResult = await query(catSql, [chain[0].category_id]);
      if (catResult.length > 0) {
        chain.unshift({
          type: 'category',
          category_id: catResult[0].category_id,
          category_name: catResult[0].category_name,
          image: catResult[0].category_image,
        });
      }
    }

    return chain;
  }

  /**
   * Get all descendants (children, grandchildren, etc.)
   */
  static async getDescendants(subcategoryId, options = {}) {
    const { is_active, lang = 'en' } = options;
    const nameField = `subcategory_name_${lang}`;
    const descendants = [];

    // Recursive function to get all levels
    const getChildrenRecursive = async (parentId, level = 1) => {
      let sql = `
        SELECT
          sc.subcategory_id,
          sc.category_id,
          sc.parent_id,
          sc.level,
          sc.${nameField} as subcategory_name,
          sc.subcategory_image as image_url,
          sc.is_active,
          sc.display_order
        FROM subcategories sc
        WHERE sc.parent_id = ?
      `;

      const params = [parentId];

      if (is_active !== undefined) {
        sql += ' AND sc.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      sql += ' ORDER BY sc.display_order ASC';

      const children = await query(sql, params);

      for (const child of children) {
        child.depth = level;
        descendants.push(child);
        // Recursively get children
        await getChildrenRecursive(child.subcategory_id, level + 1);
      }
    };

    await getChildrenRecursive(subcategoryId);
    return descendants;
  }

  /**
   * Get all descendant IDs (for filtering products)
   */
  static async getDescendantIds(subcategoryId) {
    const descendants = await this.getDescendants(subcategoryId);
    return [subcategoryId, ...descendants.map(d => d.subcategory_id)];
  }

  /**
   * Get nested tree for a category (recursive structure)
   */
  static async getNestedTree(categoryId, options = {}) {
    const { is_active, lang = 'en' } = options;
    const nameField = `subcategory_name_${lang}`;

    const buildTree = async (parentId = null) => {
      let sql = `
        SELECT
          sc.subcategory_id,
          sc.category_id,
          sc.parent_id,
          sc.level,
          sc.subcategory_name_en,
          sc.subcategory_name_ar,
          sc.subcategory_name_he,
          sc.${nameField} as subcategory_name,
          sc.subcategory_image as image_url,
          sc.is_active,
          sc.display_order,
          (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id) as product_count
        FROM subcategories sc
        WHERE sc.category_id = ?
      `;

      const params = [categoryId];

      if (parentId === null) {
        sql += ' AND sc.parent_id IS NULL';
      } else {
        sql += ' AND sc.parent_id = ?';
        params.push(parentId);
      }

      if (is_active !== undefined) {
        sql += ' AND sc.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      sql += ' ORDER BY sc.display_order ASC';

      const items = await query(sql, params);

      // Recursively get children for each item
      for (const item of items) {
        item.children = await buildTree(item.subcategory_id);
      }

      return items;
    };

    return await buildTree();
  }

  /**
   * Update subcategory level (used when moving in hierarchy)
   */
  static async updateLevel(subcategoryId, newLevel) {
    const sql = 'UPDATE subcategories SET level = ?, updated_at = NOW() WHERE subcategory_id = ?';
    await query(sql, [newLevel, subcategoryId]);
    return await this.getById(subcategoryId);
  }

  /**
   * Move subcategory to new parent
   */
  static async moveToParent(subcategoryId, newParentId) {
    let newLevel = 1;
    let newCategoryId = null;

    if (newParentId) {
      // Get parent's level and category
      const parent = await this.getById(newParentId);
      if (!parent) {
        throw new Error('Parent subcategory not found');
      }
      newLevel = (parent.level || 1) + 1;
      newCategoryId = parent.category_id;
    }

    const sql = `
      UPDATE subcategories
      SET parent_id = ?, level = ?, ${newCategoryId ? 'category_id = ?,' : ''} updated_at = NOW()
      WHERE subcategory_id = ?
    `;

    const params = newCategoryId
      ? [newParentId, newLevel, newCategoryId, subcategoryId]
      : [newParentId, newLevel, subcategoryId];

    await query(sql, params);

    // Update all descendants' levels
    const descendants = await this.getDescendants(subcategoryId);
    for (const desc of descendants) {
      await this.updateLevel(desc.subcategory_id, newLevel + desc.depth);
    }

    return await this.getById(subcategoryId);
  }

  /**
   * Get products from subcategory and all its descendants
   */
  static async getProductsIncludingDescendants(subcategoryId, options = {}) {
    const { page = 1, limit = 20, lang = 'en' } = options;
    const offset = (page - 1) * limit;
    const nameField = `p.product_name_${lang}`;

    // Get all subcategory IDs including descendants
    const subcategoryIds = await this.getDescendantIds(subcategoryId);
    const placeholders = subcategoryIds.map(() => '?').join(',');

    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.subcategory_id IN (${placeholders}) AND p.is_active = 1
    `;
    const countResult = await query(countSql, subcategoryIds);
    const total = countResult[0].total;

    const sql = `
      SELECT
        p.product_id,
        p.sku,
        ${nameField} as product_name,
        p.base_price,
        p.discount_percentage,
        p.stock_quantity,
        p.is_featured,
        COALESCE(pi.image_url, '') as image_url,
        p.rating_average,
        p.rating_count
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.subcategory_id IN (${placeholders}) AND p.is_active = 1
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = await query(sql, [...subcategoryIds, limit, offset]);

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
   * Get full hierarchy tree (all categories with nested subcategories)
   */
  static async getFullHierarchy(options = {}) {
    const { is_active, lang = 'en' } = options;
    const catNameField = `category_name_${lang}`;

    // Get all categories
    let catSql = `
      SELECT
        category_id,
        ${catNameField} as category_name,
        category_image,
        display_order,
        is_active
      FROM categories
    `;

    if (is_active !== undefined) {
      catSql += ' WHERE is_active = ?';
    }
    catSql += ' ORDER BY display_order ASC';

    const categories = await query(catSql, is_active !== undefined ? [is_active ? 1 : 0] : []);

    // Get nested tree for each category
    for (const category of categories) {
      category.subcategories = await this.getNestedTree(category.category_id, options);
    }

    return categories;
  }

  // ==================== ALIAS METHODS (for service compatibility) ====================

  /**
   * Alias for getNestedTree
   */
  static async getTreeByCategory(categoryId, lang = 'en') {
    return await this.getNestedTree(categoryId, { lang });
  }

  /**
   * Alias for getRootByCategory
   */
  static async getRoots(categoryId, lang = 'en') {
    return await this.getRootByCategory(categoryId, { lang });
  }

  /**
   * Get products for a subcategory
   */
  static async getProducts(subcategoryId, options = {}) {
    const { page = 1, limit = 20, lang = 'en' } = options;
    const offset = (page - 1) * limit;
    const nameField = `p.product_name_${lang}`;

    const countSql = 'SELECT COUNT(*) as total FROM products WHERE subcategory_id = ? AND is_active = 1';
    const countResult = await query(countSql, [subcategoryId]);
    const total = countResult[0].total;

    const sql = `
      SELECT
        p.product_id,
        p.sku,
        ${nameField} as product_name,
        p.base_price,
        p.discount_percentage,
        p.stock_quantity,
        COALESCE(pi.image_url, '') as image_url,
        p.rating_average,
        p.rating_count
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.subcategory_id = ? AND p.is_active = 1
      ORDER BY p.display_order ASC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = await query(sql, [subcategoryId, limit, offset]);

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
}

module.exports = Subcategory;