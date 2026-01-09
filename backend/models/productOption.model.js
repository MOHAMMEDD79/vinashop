/**
 * Product Option Model
 * @module models/productOption
 *
 * Handles product option types and option values
 */

const { query } = require('../config/database');

class ProductOption {
  // ==================== Option Types ====================

  /**
   * Get all option types with pagination
   */
  static async getAllTypes(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      is_active,
      sort = 'display_order',
      order = 'ASC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (type_name_en LIKE ? OR type_name_ar LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM product_option_types ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['option_type_id', 'type_name_en', 'display_order', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'display_order';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const sql = `
      SELECT
        ot.*,
        (SELECT COUNT(*) FROM product_option_values WHERE option_type_id = ot.option_type_id) as value_count,
        (SELECT COUNT(*) FROM product_options WHERE option_type_id = ot.option_type_id) as product_count
      FROM product_option_types ot
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const types = await query(sql, params);

    return {
      data: types,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get option type by ID with values
   */
  static async getTypeById(typeId) {
    const sql = `
      SELECT * FROM product_option_types WHERE option_type_id = ?
    `;
    const results = await query(sql, [typeId]);

    if (results.length === 0) return null;

    const type = results[0];

    // Get values for this type
    const valuesSql = `
      SELECT * FROM product_option_values
      WHERE option_type_id = ?
      ORDER BY display_order ASC
    `;
    type.values = await query(valuesSql, [typeId]);

    return type;
  }

  /**
   * Create option type
   */
  static async createType(data) {
    const {
      type_name_en,
      type_name_ar,
      display_order = 0,
      is_active = true,
    } = data;

    const sql = `
      INSERT INTO product_option_types (
        type_name_en, type_name_ar,
        display_order, is_active, created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      type_name_en,
      type_name_ar,
      display_order,
      is_active ? 1 : 0,
    ]);

    return await this.getTypeById(result.insertId);
  }

  /**
   * Update option type
   */
  static async updateType(typeId, data) {
    const allowedFields = [
      'type_name_en', 'type_name_ar',
      'display_order', 'is_active'
    ];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    }

    if (updates.length === 0) {
      return await this.getTypeById(typeId);
    }

    values.push(typeId);
    const sql = `UPDATE product_option_types SET ${updates.join(', ')} WHERE option_type_id = ?`;
    await query(sql, values);

    return await this.getTypeById(typeId);
  }

  /**
   * Delete option type
   */
  static async deleteType(typeId) {
    // First delete all values
    await query('DELETE FROM product_option_values WHERE option_type_id = ?', [typeId]);
    // Then delete the type
    const sql = 'DELETE FROM product_option_types WHERE option_type_id = ?';
    const result = await query(sql, [typeId]);
    return result.affectedRows > 0;
  }

  /**
   * Check if type is used in products
   */
  static async isTypeUsedInProducts(typeId) {
    const sql = 'SELECT COUNT(*) as count FROM product_options WHERE option_type_id = ?';
    const result = await query(sql, [typeId]);
    return result[0].count > 0;
  }

  // ==================== Option Values ====================

  /**
   * Get all values for an option type
   */
  static async getValuesByType(typeId, options = {}) {
    const { is_active } = options;

    let whereClause = 'WHERE option_type_id = ?';
    const params = [typeId];

    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    const sql = `
      SELECT * FROM product_option_values
      ${whereClause}
      ORDER BY display_order ASC
    `;

    return await query(sql, params);
  }

  /**
   * Get option value by ID
   */
  static async getValueById(valueId) {
    const sql = `
      SELECT
        v.*,
        t.type_name_en,
        t.type_name_ar
      FROM product_option_values v
      LEFT JOIN product_option_types t ON v.option_type_id = t.option_type_id
      WHERE v.option_value_id = ?
    `;
    const results = await query(sql, [valueId]);
    return results[0] || null;
  }

  /**
   * Create option value
   */
  static async createValue(data) {
    const {
      option_type_id,
      value_name_en,
      value_name_ar,
      additional_price = 0,
      display_order = 0,
      is_active = true,
      color_code = null,
    } = data;

    const sql = `
      INSERT INTO product_option_values (
        option_type_id, value_name_en, value_name_ar,
        color_code, additional_price, display_order, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      option_type_id,
      value_name_en,
      value_name_ar,
      color_code,
      additional_price,
      display_order,
      is_active ? 1 : 0,
    ]);

    return await this.getValueById(result.insertId);
  }

  /**
   * Update option value
   */
  static async updateValue(valueId, data) {
    const allowedFields = [
      'value_name_en', 'value_name_ar',
      'additional_price', 'display_order', 'is_active',
      'color_code'
    ];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    }

    if (updates.length === 0) {
      return await this.getValueById(valueId);
    }

    values.push(valueId);
    const sql = `UPDATE product_option_values SET ${updates.join(', ')} WHERE option_value_id = ?`;
    await query(sql, values);

    return await this.getValueById(valueId);
  }

  /**
   * Delete option value
   */
  static async deleteValue(valueId) {
    const sql = 'DELETE FROM product_option_values WHERE option_value_id = ?';
    const result = await query(sql, [valueId]);
    return result.affectedRows > 0;
  }

  /**
   * Bulk create values for a type
   */
  static async bulkCreateValues(typeId, valuesArray) {
    const results = [];
    for (const val of valuesArray) {
      const created = await this.createValue({
        option_type_id: typeId,
        ...val,
      });
      results.push(created);
    }
    return results;
  }

  /**
   * Update display order for values
   */
  static async updateValuesOrder(typeId, orderArray) {
    for (const item of orderArray) {
      await query(
        'UPDATE product_option_values SET display_order = ? WHERE option_value_id = ? AND option_type_id = ?',
        [item.order, item.id, typeId]
      );
    }
    return true;
  }

  // ==================== Product Options ====================

  /**
   * Get options for a product
   */
  static async getProductOptions(productId) {
    const sql = `
      SELECT
        po.product_option_id,
        po.is_required,
        po.display_order,
        t.option_type_id,
        t.type_name_en,
        t.type_name_ar
      FROM product_options po
      JOIN product_option_types t ON po.option_type_id = t.option_type_id
      WHERE po.product_id = ?
      ORDER BY po.display_order ASC
    `;

    const options = await query(sql, [productId]);

    // Get values for each option type
    for (const option of options) {
      const valuesSql = `
        SELECT * FROM product_option_values
        WHERE option_type_id = ? AND is_active = 1
        ORDER BY display_order ASC
      `;
      option.values = await query(valuesSql, [option.option_type_id]);
    }

    return options;
  }

  /**
   * Set product options
   */
  static async setProductOptions(productId, options) {
    // Remove existing options
    await query('DELETE FROM product_options WHERE product_id = ?', [productId]);

    // Add new options
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      await query(
        `INSERT INTO product_options (product_id, option_type_id, is_required, display_order, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [productId, opt.option_type_id, opt.is_required ? 1 : 0, i]
      );
    }

    return await this.getProductOptions(productId);
  }

  /**
   * Set product options by value IDs
   * Converts option value IDs to option type associations
   * @param {number} productId - Product ID
   * @param {number[]} valueIds - Array of option value IDs
   */
  static async setProductOptionsByValueIds(productId, valueIds) {
    // Remove existing options
    await query('DELETE FROM product_options WHERE product_id = ?', [productId]);

    if (!valueIds || valueIds.length === 0) {
      return await this.getProductOptions(productId);
    }

    // Get unique option type IDs from the value IDs
    const placeholders = valueIds.map(() => '?').join(',');
    const typesSql = `
      SELECT DISTINCT option_type_id
      FROM product_option_values
      WHERE option_value_id IN (${placeholders})
    `;
    const types = await query(typesSql, valueIds);

    // Add option type associations
    for (let i = 0; i < types.length; i++) {
      await query(
        `INSERT INTO product_options (product_id, option_type_id, is_required, display_order, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [productId, types[i].option_type_id, 0, i]
      );
    }

    return await this.getProductOptions(productId);
  }

  /**
   * Add option to product
   */
  static async addProductOption(productId, optionTypeId, isRequired = false) {
    // Check if already exists
    const existing = await query(
      'SELECT * FROM product_options WHERE product_id = ? AND option_type_id = ?',
      [productId, optionTypeId]
    );

    if (existing.length > 0) {
      throw new Error('Option already exists for this product');
    }

    // Get max display order
    const maxOrder = await query(
      'SELECT MAX(display_order) as max_order FROM product_options WHERE product_id = ?',
      [productId]
    );

    const displayOrder = (maxOrder[0].max_order || 0) + 1;

    await query(
      `INSERT INTO product_options (product_id, option_type_id, is_required, display_order, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [productId, optionTypeId, isRequired ? 1 : 0, displayOrder]
    );

    return await this.getProductOptions(productId);
  }

  /**
   * Remove option from product
   */
  static async removeProductOption(productId, optionTypeId) {
    await query(
      'DELETE FROM product_options WHERE product_id = ? AND option_type_id = ?',
      [productId, optionTypeId]
    );

    return await this.getProductOptions(productId);
  }

  /**
   * Get statistics
   */
  static async getStatistics() {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM product_option_types) as total_types,
        (SELECT COUNT(*) FROM product_option_types WHERE is_active = 1) as active_types,
        (SELECT COUNT(*) FROM product_option_values) as total_values,
        (SELECT COUNT(*) FROM product_option_values WHERE is_active = 1) as active_values,
        (SELECT COUNT(DISTINCT product_id) FROM product_options) as products_with_options
    `);

    return stats[0];
  }

  // ==================== FILTER METHODS ====================

  /**
   * Get all option types with their values (for filters)
   */
  static async getTypesWithValues(options = {}) {
    const { is_active = true, lang = 'en' } = options;
    // Only en and ar are supported
    const nameField = lang === 'ar' ? 'type_name_ar' : 'type_name_en';
    const valueNameField = lang === 'ar' ? 'value_name_ar' : 'value_name_en';

    const typesSql = `
      SELECT
        option_type_id,
        type_name_en,
        type_name_ar,
        ${nameField} as type_name,
        display_order
      FROM product_option_types
      ${is_active ? 'WHERE is_active = 1' : ''}
      ORDER BY display_order ASC
    `;

    const types = await query(typesSql);

    for (const type of types) {
      const valuesSql = `
        SELECT
          option_value_id,
          value_name_en,
          value_name_ar,
          ${valueNameField} as value_name,
          color_code,
          additional_price,
          display_order
        FROM product_option_values
        WHERE option_type_id = ?
        ${is_active ? 'AND is_active = 1' : ''}
        ORDER BY display_order ASC
      `;
      type.values = await query(valuesSql, [type.option_type_id]);
    }

    return types;
  }

  /**
   * Get filterable option types for a category
   * Note: category_option_types table doesn't exist, returning all active types
   */
  static async getFilterableByCategory(categoryId, options = {}) {
    const { lang = 'en' } = options;
    const nameField = lang === 'ar' ? 't.type_name_ar' : 't.type_name_en';
    const valueNameField = lang === 'ar' ? 'value_name_ar' : 'value_name_en';

    // Since category_option_types doesn't exist, return all active option types
    const sql = `
      SELECT
        t.option_type_id,
        ${nameField} as type_name,
        t.display_order
      FROM product_option_types t
      WHERE t.is_active = 1
      ORDER BY t.display_order ASC
    `;

    const types = await query(sql);

    for (const type of types) {
      const valuesSql = `
        SELECT
          option_value_id,
          ${valueNameField} as value_name,
          color_code
        FROM product_option_values
        WHERE option_type_id = ? AND is_active = 1
        ORDER BY display_order ASC
      `;
      type.values = await query(valuesSql, [type.option_type_id]);
    }

    return types;
  }

  /**
   * Link option type to category for filtering
   * Note: category_option_types table doesn't exist
   */
  static async linkTypeToCategory(categoryId, optionTypeId, isFilterable = true, displayOrder = 0) {
    // This table doesn't exist in the database
    console.warn('category_option_types table does not exist');
    return false;
    /* Original code - uncomment if table is created:
    const sql = `
      INSERT INTO category_option_types (category_id, option_type_id, is_filterable, display_order)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE is_filterable = ?, display_order = ?
    `;

    */
  }

  /**
   * Unlink option type from category
   * Note: category_option_types table doesn't exist
   */
  static async unlinkTypeFromCategory(categoryId, optionTypeId) {
    console.warn('category_option_types table does not exist');
    return false;
  }

  /**
   * Get all types list (no pagination, for dropdowns)
   */
  static async getAllTypesList(options = {}) {
    const { is_active = true, lang = 'en' } = options;
    const nameField = lang === 'ar' ? 'type_name_ar' : 'type_name_en';

    const sql = `
      SELECT
        option_type_id,
        type_name_en,
        type_name_ar,
        ${nameField} as type_name,
        is_active
      FROM product_option_types
      ${is_active ? 'WHERE is_active = 1' : ''}
      ORDER BY display_order ASC
    `;

    return await query(sql);
  }

  /**
   * Get color option type with values (convenience method)
   */
  static async getColorOptions(options = {}) {
    const { is_active = true, lang = 'en' } = options;
    const valueNameField = lang === 'ar' ? 'value_name_ar' : 'value_name_en';

    const sql = `
      SELECT
        v.option_value_id,
        v.value_name_en,
        v.value_name_ar,
        v.${valueNameField} as value_name,
        v.color_code,
        v.additional_price
      FROM product_option_values v
      JOIN product_option_types t ON v.option_type_id = t.option_type_id
      WHERE t.type_name_en = 'Color'
      ${is_active ? 'AND v.is_active = 1' : ''}
      ORDER BY v.display_order ASC
    `;

    return await query(sql);
  }

  /**
   * Get size option type with values (convenience method)
   */
  static async getSizeOptions(options = {}) {
    const { is_active = true, lang = 'en' } = options;
    const valueNameField = lang === 'ar' ? 'value_name_ar' : 'value_name_en';

    const sql = `
      SELECT
        v.option_value_id,
        v.value_name_en,
        v.value_name_ar,
        v.${valueNameField} as value_name,
        v.additional_price
      FROM product_option_values v
      JOIN product_option_types t ON v.option_type_id = t.option_type_id
      WHERE t.type_name_en = 'Size'
      ${is_active ? 'AND v.is_active = 1' : ''}
      ORDER BY v.display_order ASC
    `;

    return await query(sql);
  }

  /**
   * Search option values
   */
  static async searchValues(searchTerm, options = {}) {
    const { limit = 20, type_id } = options;

    let sql = `
      SELECT
        v.*,
        t.type_name_en
      FROM product_option_values v
      JOIN product_option_types t ON v.option_type_id = t.option_type_id
      WHERE (v.value_name_en LIKE ? OR v.value_name_ar LIKE ?)
    `;

    const params = [`%${searchTerm}%`, `%${searchTerm}%`];

    if (type_id) {
      sql += ' AND v.option_type_id = ?';
      params.push(type_id);
    }

    sql += ' LIMIT ?';
    params.push(limit);

    return await query(sql, params);
  }
}

module.exports = ProductOption;
