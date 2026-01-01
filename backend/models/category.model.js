/**
 * Category Model
 * @module models/category
 */

const { query } = require('../config/database');

/**
 * Category Model - Handles category database operations
 */
class Category {
  /**
   * Get all categories with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      is_active,
      is_featured,
      sort = 'display_order',
      order = 'ASC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    const nameField = `category_name_${lang}`;
    const descField = `category_description_${lang}`;

    if (search) {
      whereClause += ` AND (category_name_en LIKE ? OR category_name_ar LIKE ? OR category_name_he LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (is_featured !== undefined) {
      whereClause += ' AND is_featured = ?';
      params.push(is_featured ? 1 : 0);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM categories ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['category_id', 'category_name_en', 'display_order', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'display_order';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const sql = `
      SELECT
        category_id,
        category_name_en,
        category_name_ar,
        category_name_he,
        ${nameField} as category_name,
        category_description_en as description_en,
        category_description_ar as description_ar,
        category_description_he as description_he,
        ${descField} as description,
        category_image as image_url,
        display_order,
        is_active,
        is_featured,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM subcategories WHERE category_id = categories.category_id) as subcategory_count,
        (SELECT COUNT(*) FROM products WHERE category_id = categories.category_id) as product_count
      FROM categories
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const categories = await query(sql, params);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all categories without pagination (for dropdowns)
   */
  static async getAllList(options = {}) {
    const { is_active = true, lang = 'en' } = options;

    const nameField = `category_name_${lang}`;

    let sql = `
      SELECT
        category_id,
        category_name_en,
        category_name_ar,
        category_name_he,
        ${nameField} as category_name,
        category_image as image_url,
        display_order,
        is_active
      FROM categories
    `;

    const params = [];

    if (is_active) {
      sql += ' WHERE is_active = 1';
    }

    sql += ' ORDER BY display_order ASC, category_name_en ASC';

    return await query(sql, params);
  }

  /**
   * Get category by ID
   */
  static async getById(categoryId, lang = 'en') {
    const nameField = `category_name_${lang}`;
    const descField = `category_description_${lang}`;

    const sql = `
      SELECT
        category_id,
        category_name_en,
        category_name_ar,
        category_name_he,
        ${nameField} as category_name,
        category_description_en as description_en,
        category_description_ar as description_ar,
        category_description_he as description_he,
        ${descField} as description,
        category_image as image_url,
        display_order,
        is_active,
        is_featured,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM subcategories WHERE category_id = categories.category_id) as subcategory_count,
        (SELECT COUNT(*) FROM products WHERE category_id = categories.category_id) as product_count
      FROM categories
      WHERE category_id = ?
    `;

    const results = await query(sql, [categoryId]);
    return results[0] || null;
  }

  /**
   * Get category by name
   */
  static async getByName(name, lang = 'en') {
    const nameField = `category_name_${lang}`;

    const sql = `
      SELECT * FROM categories
      WHERE ${nameField} = ?
    `;

    const results = await query(sql, [name]);
    return results[0] || null;
  }

  /**
   * Create a new category
   */
  static async create(data) {
    const {
      category_name_en,
      category_name_ar,
      category_name_he,
      description_en,
      description_ar,
      description_he,
      image_url,
      display_order = 0,
      is_active = true,
      is_featured = false,
    } = data;

    const sql = `
      INSERT INTO categories (
        category_name_en,
        category_name_ar,
        category_name_he,
        category_description_en,
        category_description_ar,
        category_description_he,
        category_image,
        display_order,
        is_active,
        is_featured,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      category_name_en,
      category_name_ar,
      category_name_he,
      description_en || null,
      description_ar || null,
      description_he || null,
      image_url || null,
      display_order,
      is_active ? 1 : 0,
      is_featured ? 1 : 0,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update a category
   */
  static async update(categoryId, data) {
    // Map frontend field names to actual database column names
    const fieldMapping = {
      'category_name_en': 'category_name_en',
      'category_name_ar': 'category_name_ar',
      'category_name_he': 'category_name_he',
      'description_en': 'category_description_en',
      'description_ar': 'category_description_ar',
      'description_he': 'category_description_he',
      'image_url': 'category_image',
      'display_order': 'display_order',
      'is_active': 'is_active',
      'is_featured': 'is_featured',
    };

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      const dbColumn = fieldMapping[key];
      if (dbColumn && value !== undefined) {
        updates.push(`${dbColumn} = ?`);
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getById(categoryId);
    }

    updates.push('updated_at = NOW()');
    values.push(categoryId);

    const sql = `UPDATE categories SET ${updates.join(', ')} WHERE category_id = ?`;
    await query(sql, values);

    return await this.getById(categoryId);
  }

  /**
   * Delete a category
   */
  static async delete(categoryId) {
    const sql = 'DELETE FROM categories WHERE category_id = ?';
    const result = await query(sql, [categoryId]);
    return result.affectedRows > 0;
  }

  /**
   * Toggle active status
   */
  static async toggleStatus(categoryId) {
    const category = await this.getById(categoryId);
    if (!category) return null;

    const newStatus = category.is_active ? 0 : 1;

    const sql = `
      UPDATE categories 
      SET is_active = ?, updated_at = NOW()
      WHERE category_id = ?
    `;

    await query(sql, [newStatus, categoryId]);
    return await this.getById(categoryId);
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(categoryId) {
    const category = await this.getById(categoryId);
    if (!category) return null;

    const newStatus = category.is_featured ? 0 : 1;

    const sql = `
      UPDATE categories 
      SET is_featured = ?, updated_at = NOW()
      WHERE category_id = ?
    `;

    await query(sql, [newStatus, categoryId]);
    return await this.getById(categoryId);
  }

  /**
   * Update image
   */
  static async updateImage(categoryId, imageUrl) {
    const sql = `
      UPDATE categories
      SET category_image = ?, updated_at = NOW()
      WHERE category_id = ?
    `;

    await query(sql, [imageUrl, categoryId]);
    return await this.getById(categoryId);
  }

  /**
   * Update display order for multiple categories
   */
  static async updateDisplayOrder(categories) {
    for (const cat of categories) {
      await query(
        'UPDATE categories SET display_order = ?, updated_at = NOW() WHERE category_id = ?',
        [cat.display_order, cat.category_id]
      );
    }
    return true;
  }

  /**
   * Get subcategory count
   */
  static async getSubcategoryCount(categoryId) {
    const sql = 'SELECT COUNT(*) as count FROM subcategories WHERE category_id = ?';
    const results = await query(sql, [categoryId]);
    return results[0].count;
  }

  /**
   * Get product count
   */
  static async getProductCount(categoryId) {
    const sql = 'SELECT COUNT(*) as count FROM products WHERE category_id = ?';
    const results = await query(sql, [categoryId]);
    return results[0].count;
  }

  /**
   * Get category with subcategories
   */
  static async getCategoryWithSubcategories(categoryId, lang = 'en') {
    const category = await this.getById(categoryId, lang);
    if (!category) return null;

    const nameField = `subcategory_name_${lang}`;

    const subcategoriesSql = `
      SELECT 
        subcategory_id,
        subcategory_name_en,
        subcategory_name_ar,
        subcategory_name_he,
        ${nameField} as subcategory_name,
        image_url,
        display_order,
        is_active,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = subcategories.subcategory_id) as product_count
      FROM subcategories
      WHERE category_id = ? AND is_active = 1
      ORDER BY display_order ASC
    `;

    category.subcategories = await query(subcategoriesSql, [categoryId]);

    return category;
  }

  /**
   * Get category with products
   */
  static async getCategoryWithProducts(categoryId, options = {}) {
    const { page = 1, limit = 10, lang = 'en' } = options;
    const offset = (page - 1) * limit;

    const category = await this.getById(categoryId, lang);
    if (!category) return null;

    const nameField = `product_name_${lang}`;

    const countSql = 'SELECT COUNT(*) as total FROM products WHERE category_id = ? AND is_active = 1';
    const countResult = await query(countSql, [categoryId]);
    const total = countResult[0].total;

    const productsSql = `
      SELECT
        p.product_id,
        p.${nameField} as product_name,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        p.is_featured,
        pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.category_id = ? AND p.is_active = 1
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = await query(productsSql, [categoryId, limit, offset]);

    return {
      ...category,
      products: {
        data: products,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get featured categories
   */
  static async getFeatured(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `category_name_${lang}`;
    const descField = `category_description_${lang}`;

    const sql = `
      SELECT
        category_id,
        ${nameField} as category_name,
        ${descField} as description,
        category_image as image_url,
        display_order,
        (SELECT COUNT(*) FROM products WHERE category_id = categories.category_id AND is_active = 1) as product_count
      FROM categories
      WHERE is_active = 1 AND is_featured = 1
      ORDER BY display_order ASC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get categories with product counts
   */
  static async getWithProductCounts(lang = 'en') {
    const nameField = `category_name_${lang}`;

    const sql = `
      SELECT
        c.category_id,
        c.${nameField} as category_name,
        c.category_image as image_url,
        c.display_order,
        COUNT(DISTINCT p.product_id) as product_count,
        COUNT(DISTINCT s.subcategory_id) as subcategory_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
      LEFT JOIN subcategories s ON c.category_id = s.category_id AND s.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.category_id
      ORDER BY c.display_order ASC
    `;

    return await query(sql);
  }

  /**
   * Search categories
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `category_name_${lang}`;

    const sql = `
      SELECT
        category_id,
        category_name_en,
        category_name_ar,
        category_name_he,
        ${nameField} as category_name,
        category_image as image_url,
        is_active
      FROM categories
      WHERE
        category_name_en LIKE ? OR
        category_name_ar LIKE ? OR
        category_name_he LIKE ?
      ORDER BY display_order ASC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, limit]);
  }

  /**
   * Get category statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_categories,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_categories,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_categories,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_categories,
        (SELECT COUNT(*) FROM subcategories) as total_subcategories,
        (SELECT COUNT(*) FROM products) as total_products
      FROM categories
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Bulk update categories
   */
  static async bulkUpdate(categoryIds, data) {
    if (!categoryIds || categoryIds.length === 0) {
      return { updated: 0 };
    }

    const allowedFields = ['is_active', 'is_featured'];
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

    const placeholders = categoryIds.map(() => '?').join(',');
    const sql = `UPDATE categories SET ${updates.join(', ')} WHERE category_id IN (${placeholders})`;

    const result = await query(sql, [...values, ...categoryIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete categories
   */
  static async bulkDelete(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = categoryIds.map(() => '?').join(',');
    const sql = `DELETE FROM categories WHERE category_id IN (${placeholders})`;
    const result = await query(sql, categoryIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Check if category name exists
   */
  static async nameExists(name, lang = 'en', excludeId = null) {
    const nameField = `category_name_${lang}`;

    let sql = `SELECT category_id FROM categories WHERE ${nameField} = ?`;
    const params = [name];

    if (excludeId) {
      sql += ' AND category_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Duplicate category
   */
  static async duplicate(categoryId, createdBy = null) {
    const category = await this.getById(categoryId);
    if (!category) return null;

    const newCategory = await this.create({
      category_name_en: `${category.category_name_en} (Copy)`,
      category_name_ar: `${category.category_name_ar} (نسخة)`,
      category_name_he: `${category.category_name_he} (עותק)`,
      description_en: category.description_en,
      description_ar: category.description_ar,
      description_he: category.description_he,
      image_url: category.image_url,
      display_order: category.display_order + 1,
      is_active: false,
      is_featured: false,
      meta_title: category.meta_title,
      meta_description: category.meta_description,
      meta_keywords: category.meta_keywords,
      created_by: createdBy,
    });

    return newCategory;
  }

  /**
   * Get all categories for export
   */
  static async getAllForExport(options = {}) {
    const { is_active } = options;

    let sql = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM subcategories WHERE category_id = c.category_id) as subcategory_count,
        (SELECT COUNT(*) FROM products WHERE category_id = c.category_id) as product_count
      FROM categories c
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
   * Get category tree (categories with subcategories)
   */
  static async getCategoryTree(lang = 'en') {
    const catNameField = `category_name_${lang}`;
    const subNameField = `subcategory_name_${lang}`;

    const sql = `
      SELECT
        c.category_id,
        c.${catNameField} as category_name,
        c.category_image as category_image,
        c.display_order,
        s.subcategory_id,
        s.${subNameField} as subcategory_name,
        s.display_order as subcategory_order
      FROM categories c
      LEFT JOIN subcategories s ON c.category_id = s.category_id AND s.is_active = 1
      WHERE c.is_active = 1
      ORDER BY c.display_order ASC, s.display_order ASC
    `;

    const results = await query(sql);

    // Build tree structure
    const tree = [];
    const categoryMap = new Map();

    for (const row of results) {
      if (!categoryMap.has(row.category_id)) {
        const category = {
          category_id: row.category_id,
          category_name: row.category_name,
          image_url: row.category_image,
          display_order: row.display_order,
          subcategories: [],
        };
        categoryMap.set(row.category_id, category);
        tree.push(category);
      }

      if (row.subcategory_id) {
        categoryMap.get(row.category_id).subcategories.push({
          subcategory_id: row.subcategory_id,
          subcategory_name: row.subcategory_name,
          display_order: row.subcategory_order,
        });
      }
    }

    return tree;
  }
}

module.exports = Category;