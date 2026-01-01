/**
 * Product Model
 * @module models/product
 */

const { query } = require('../config/database');

/**
 * Product Model - Handles product database operations
 */
class Product {
  /**
   * Get all products with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      category_id,
      subcategory_id,
      is_active,
      is_featured,
      min_price,
      max_price,
      in_stock,
      color_id,
      size_id,
      sort = 'created_at',
      order = 'DESC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    const nameField = `p.product_name_${lang}`;
    const descField = `p.product_description_${lang}`;

    if (search) {
      whereClause += ` AND (p.product_name_en LIKE ? OR p.product_name_ar LIKE ? OR p.product_name_he LIKE ? OR p.sku LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      whereClause += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (subcategory_id) {
      whereClause += ' AND p.subcategory_id = ?';
      params.push(subcategory_id);
    }

    if (is_active !== undefined) {
      whereClause += ' AND p.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (is_featured !== undefined) {
      whereClause += ' AND p.is_featured = ?';
      params.push(is_featured ? 1 : 0);
    }

    if (min_price !== undefined) {
      whereClause += ' AND p.base_price >= ?';
      params.push(min_price);
    }

    if (max_price !== undefined) {
      whereClause += ' AND p.base_price <= ?';
      params.push(max_price);
    }

    if (in_stock !== undefined) {
      if (in_stock) {
        whereClause += ' AND p.stock_quantity > 0';
      } else {
        whereClause += ' AND p.stock_quantity = 0';
      }
    }

    // Support both old (color_id/size_id) and new (option_values) filtering
    if (color_id) {
      // Try new system first (option_value_id), fallback to old system
      whereClause += ` AND (
        EXISTS (SELECT 1 FROM product_option_combinations poc
                WHERE poc.product_id = p.product_id
                AND JSON_CONTAINS(poc.option_values_json, JSON_OBJECT('option_value_id', ?)))
        OR EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.product_id AND pv.color_id = ?)
      )`;
      params.push(color_id, color_id);
    }

    if (size_id) {
      // Try new system first (option_value_id), fallback to old system
      whereClause += ` AND (
        EXISTS (SELECT 1 FROM product_option_combinations poc
                WHERE poc.product_id = p.product_id
                AND JSON_CONTAINS(poc.option_values_json, JSON_OBJECT('option_value_id', ?)))
        OR EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.product_id AND pv.size_id = ?)
      )`;
      params.push(size_id, size_id);
    }

    // New option-based filtering (supports any option type)
    if (options.option_values && Array.isArray(options.option_values)) {
      for (const valueId of options.option_values) {
        whereClause += ` AND EXISTS (
          SELECT 1 FROM product_option_combinations poc
          WHERE poc.product_id = p.product_id
          AND JSON_CONTAINS(poc.option_values_json, JSON_OBJECT('option_value_id', ?))
        )`;
        params.push(valueId);
      }
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['product_id', 'product_name_en', 'base_price', 'stock_quantity', 'created_at', 'display_order', 'view_count', 'sold_count'];
    const sortColumn = allowedSorts.includes(sort) ? `p.${sort === 'price' ? 'base_price' : sort}` : 'p.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        p.product_id,
        p.sku,
        p.product_name_en,
        p.product_name_ar,
        p.product_name_he,
        ${nameField} as product_name,
        p.product_description_en,
        p.product_description_ar,
        p.product_description_he,
        ${descField} as product_description,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        p.category_id,
        p.subcategory_id,
        p.is_active,
        p.is_featured,
        p.view_count,
        p.rating_count,
        p.average_rating,
        p.created_at,
        p.updated_at,
        c.category_name_${lang} as category_name,
        sc.subcategory_name_${lang} as subcategory_name,
        pi.image_url,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.product_id) as variant_count,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.product_id AND is_approved = 1) as review_count,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.product_id AND is_approved = 1) as avg_rating
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const products = await query(sql, params);

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
   * Get all products without pagination (for dropdowns/exports)
   */
  static async getAllList(options = {}) {
    const { is_active = true, lang = 'en', category_id } = options;

    const nameField = `product_name_${lang}`;

    let sql = `
      SELECT 
        product_id,
        sku,
        product_name_en,
        product_name_ar,
        product_name_he,
        ${nameField} as product_name,
        price,
        stock_quantity,
        is_active
      FROM products
      WHERE 1=1
    `;

    const params = [];

    if (is_active) {
      sql += ' AND is_active = 1';
    }

    if (category_id) {
      sql += ' AND category_id = ?';
      params.push(category_id);
    }

    sql += ' ORDER BY product_name_en ASC';

    return await query(sql, params);
  }

  /**
   * Get product by ID
   */
  static async getById(productId, lang = 'en') {
    const nameField = `p.product_name_${lang}`;
    const descField = `p.product_description_${lang}`;

    const sql = `
      SELECT 
        p.*,
        ${nameField} as product_name,
        ${descField} as product_description,
        c.category_name_${lang} as category_name,
        c.category_name_en,
        sc.subcategory_name_${lang} as subcategory_name,
        sc.subcategory_name_en,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.product_id) as variant_count,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.product_id AND is_approved = 1) as review_count,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.product_id AND is_approved = 1) as avg_rating
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
      WHERE p.product_id = ?
    `;

    const results = await query(sql, [productId]);
    return results[0] || null;
  }

  /**
   * Get product by SKU
   */
  static async getBySku(sku) {
    const sql = 'SELECT * FROM products WHERE sku = ?';
    const results = await query(sql, [sku]);
    return results[0] || null;
  }

  /**
   * Get product with full details (options, combinations, images)
   * Also includes legacy colors, sizes, variants for backward compatibility
   */
  static async getWithDetails(productId, lang = 'en') {
    const product = await this.getById(productId, lang);
    if (!product) return null;

    const nameField = `value_name_${lang}`;
    const typeNameField = `type_name_${lang}`;

    // Get images
    const imagesSql = `
      SELECT image_id, image_url, alt_text, display_order, is_primary
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC
    `;
    product.images = await query(imagesSql, [productId]);

    // ===== NEW SYSTEM: Options and Combinations =====

    // Get product options (option types assigned to this product)
    const optionsSql = `
      SELECT
        po.product_option_id,
        po.is_required,
        po.display_order,
        pot.option_type_id,
        pot.${typeNameField} as type_name,
        pot.type_name_en,
        pot.display_type
      FROM product_options po
      JOIN product_option_types pot ON po.option_type_id = pot.option_type_id
      WHERE po.product_id = ? AND pot.is_active = 1
      ORDER BY po.display_order ASC
    `;
    product.options = await query(optionsSql, [productId]);

    // Get option values for each option type
    for (const option of product.options) {
      const valuesSql = `
        SELECT
          option_value_id,
          ${nameField} as value_name,
          value_name_en,
          hex_code,
          image_url,
          additional_price,
          display_order
        FROM product_option_values
        WHERE option_type_id = ? AND is_active = 1
        ORDER BY display_order ASC
      `;
      option.values = await query(valuesSql, [option.option_type_id]);
    }

    // Get combinations (replaces variants)
    const combinationsSql = `
      SELECT
        combination_id,
        product_id,
        option_values_json,
        option_summary,
        sku,
        additional_price,
        stock_quantity,
        is_active,
        created_at
      FROM product_option_combinations
      WHERE product_id = ? AND is_active = 1
      ORDER BY combination_id ASC
    `;
    const combinations = await query(combinationsSql, [productId]);

    // Parse JSON and enrich combinations with option details
    for (const combo of combinations) {
      if (typeof combo.option_values_json === 'string') {
        combo.option_values = JSON.parse(combo.option_values_json);
      } else {
        combo.option_values = combo.option_values_json || [];
      }

      // Get detailed option info for each value
      combo.options_detail = [];
      for (const ov of combo.option_values) {
        const detailSql = `
          SELECT
            pov.option_value_id,
            pov.${nameField} as value_name,
            pov.hex_code,
            pot.option_type_id,
            pot.${typeNameField} as type_name,
            pot.display_type
          FROM product_option_values pov
          JOIN product_option_types pot ON pov.option_type_id = pot.option_type_id
          WHERE pov.option_value_id = ?
        `;
        const detail = await query(detailSql, [ov.option_value_id]);
        if (detail.length > 0) {
          combo.options_detail.push(detail[0]);
        }
      }
    }
    product.combinations = combinations;

    // ===== LEGACY SYSTEM: Colors, Sizes, Variants (for backward compatibility) =====

    // Get colors from new system (option type = Color)
    const colorsSql = `
      SELECT DISTINCT
        pov.option_value_id as color_id,
        pov.${nameField} as color_name,
        pov.hex_code as color_code
      FROM product_option_values pov
      JOIN product_option_types pot ON pov.option_type_id = pot.option_type_id
      WHERE pot.type_name_en = 'Color' AND pov.is_active = 1
      AND pov.option_value_id IN (
        SELECT JSON_UNQUOTE(JSON_EXTRACT(poc.option_values_json, '$[*].option_value_id'))
        FROM product_option_combinations poc
        WHERE poc.product_id = ?
      )
      ORDER BY pov.display_order ASC
    `;
    let colors = await query(colorsSql, [productId]);

    // Fallback to old system if no colors found
    if (colors.length === 0) {
      const oldColorsSql = `
        SELECT DISTINCT pc.color_id, pc.color_name_${lang} as color_name, pc.color_hex_code as color_code
        FROM product_colors pc
        WHERE pc.color_id IN (SELECT color_id FROM product_variants WHERE product_id = ? AND color_id IS NOT NULL)
        ORDER BY pc.color_id ASC
      `;
      colors = await query(oldColorsSql, [productId]);
    }
    product.colors = colors;

    // Get sizes from new system (option type = Size or Clothing Size)
    const sizesSql = `
      SELECT DISTINCT
        pov.option_value_id as size_id,
        pov.${nameField} as size_name,
        NULL as size_code
      FROM product_option_values pov
      JOIN product_option_types pot ON pov.option_type_id = pot.option_type_id
      WHERE pot.type_name_en IN ('Size', 'Clothing Size') AND pov.is_active = 1
      AND pov.option_value_id IN (
        SELECT JSON_UNQUOTE(JSON_EXTRACT(poc.option_values_json, '$[*].option_value_id'))
        FROM product_option_combinations poc
        WHERE poc.product_id = ?
      )
      ORDER BY pov.display_order ASC
    `;
    let sizes = await query(sizesSql, [productId]);

    // Fallback to old system if no sizes found
    if (sizes.length === 0) {
      const oldSizesSql = `
        SELECT DISTINCT ps.size_id, ps.size_name as size_name, ps.size_value as size_code
        FROM product_sizes ps
        WHERE ps.size_id IN (SELECT size_id FROM product_variants WHERE product_id = ? AND size_id IS NOT NULL)
        ORDER BY ps.size_id ASC
      `;
      sizes = await query(oldSizesSql, [productId]);
    }
    product.sizes = sizes;

    // Get legacy variants (for backward compatibility)
    const variantsSql = `
      SELECT
        v.variant_id,
        v.product_id,
        v.color_id,
        v.size_id,
        v.additional_price,
        v.stock_quantity,
        v.sku,
        v.created_at,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name
      FROM product_variants v
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE v.product_id = ?
      ORDER BY v.variant_id ASC
    `;
    product.variants = await query(variantsSql, [productId]);

    // Calculate total stock from combinations (or variants if no combinations)
    if (combinations.length > 0) {
      product.total_combination_stock = combinations.reduce((sum, c) => sum + (c.stock_quantity || 0), 0);
    }

    return product;
  }

  /**
   * Create a new product
   */
  static async create(data) {
    const {
      sku,
      product_name_en,
      product_name_ar,
      product_name_he,
      product_description_en,
      product_description_ar,
      product_description_he,
      price,
      compare_price,
      cost_price,
      discount_percentage = 0,
      stock_quantity = 0,
      low_stock_threshold = 10,
      main_image,
      category_id,
      subcategory_id,
      is_active = true,
      is_featured = false,
      is_new = false,
      display_order = 0,
      weight,
      dimensions,
      meta_title,
      meta_description,
      meta_keywords,
      tags,
      created_by,
    } = data;

    const sql = `
      INSERT INTO products (
        sku,
        product_name_en,
        product_name_ar,
        product_name_he,
        product_description_en,
        product_description_ar,
        product_description_he,
        price,
        compare_price,
        cost_price,
        discount_percentage,
        stock_quantity,
        low_stock_threshold,
        main_image,
        category_id,
        subcategory_id,
        is_active,
        is_featured,
        is_new,
        display_order,
        weight,
        dimensions,
        meta_title,
        meta_description,
        meta_keywords,
        tags,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      sku,
      product_name_en,
      product_name_ar,
      product_name_he,
      product_description_en || null,
      product_description_ar || null,
      product_description_he || null,
      price,
      compare_price || null,
      cost_price || null,
      discount_percentage,
      stock_quantity,
      low_stock_threshold,
      main_image || null,
      category_id || null,
      subcategory_id || null,
      is_active ? 1 : 0,
      is_featured ? 1 : 0,
      is_new ? 1 : 0,
      display_order,
      weight || null,
      dimensions || null,
      meta_title || null,
      meta_description || null,
      meta_keywords || null,
      tags || null,
      created_by || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update a product
   */
  static async update(productId, data) {
    const allowedFields = [
      'sku',
      'product_name_en',
      'product_name_ar',
      'product_name_he',
      'product_description_en',
      'product_description_ar',
      'product_description_he',
      'price',
      'compare_price',
      'cost_price',
      'discount_percentage',
      'stock_quantity',
      'low_stock_threshold',
      'main_image',
      'category_id',
      'subcategory_id',
      'is_active',
      'is_featured',
      'is_new',
      'display_order',
      'weight',
      'dimensions',
      'meta_title',
      'meta_description',
      'meta_keywords',
      'tags',
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
      return await this.getById(productId);
    }

    updates.push('updated_at = NOW()');
    values.push(productId);

    const sql = `UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`;
    await query(sql, values);

    return await this.getById(productId);
  }

  /**
   * Delete a product
   */
  static async delete(productId) {
    // Delete related data
    await query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await query('DELETE FROM product_colors WHERE product_id = ?', [productId]);
    await query('DELETE FROM product_sizes WHERE product_id = ?', [productId]);
    await query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    await query('DELETE FROM wishlist WHERE product_id = ?', [productId]);
    await query('DELETE FROM cart WHERE product_id = ?', [productId]);

    const sql = 'DELETE FROM products WHERE product_id = ?';
    const result = await query(sql, [productId]);
    return result.affectedRows > 0;
  }

  /**
   * Toggle active status
   */
  static async toggleStatus(productId) {
    const product = await this.getById(productId);
    if (!product) return null;

    const newStatus = product.is_active ? 0 : 1;

    const sql = `
      UPDATE products 
      SET is_active = ?, updated_at = NOW()
      WHERE product_id = ?
    `;

    await query(sql, [newStatus, productId]);
    return await this.getById(productId);
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(productId) {
    const product = await this.getById(productId);
    if (!product) return null;

    const newStatus = product.is_featured ? 0 : 1;

    const sql = `
      UPDATE products 
      SET is_featured = ?, updated_at = NOW()
      WHERE product_id = ?
    `;

    await query(sql, [newStatus, productId]);
    return await this.getById(productId);
  }

  /**
   * Update stock quantity
   */
  static async updateStock(productId, quantity, operation = 'set') {
    let sql;

    if (operation === 'add') {
      sql = 'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = NOW() WHERE product_id = ?';
    } else if (operation === 'subtract') {
      sql = 'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?), updated_at = NOW() WHERE product_id = ?';
    } else {
      sql = 'UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE product_id = ?';
    }

    await query(sql, [quantity, productId]);
    return await this.getById(productId);
  }

  /**
   * Update main image
   */
  static async updateMainImage(productId, imageUrl) {
    const sql = `
      UPDATE products 
      SET main_image = ?, updated_at = NOW()
      WHERE product_id = ?
    `;

    await query(sql, [imageUrl, productId]);
    return await this.getById(productId);
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(productId) {
    const sql = 'UPDATE products SET view_count = view_count + 1 WHERE product_id = ?';
    await query(sql, [productId]);
  }

  /**
   * Increment sold count
   */
  static async incrementSoldCount(productId, quantity = 1) {
    const sql = 'UPDATE products SET sold_count = sold_count + ? WHERE product_id = ?';
    await query(sql, [quantity, productId]);
  }

  // ==================== Category/Subcategory ====================

  /**
   * Get products by category
   */
  static async getByCategory(categoryId, options = {}) {
    return await this.getAll({ ...options, category_id: categoryId });
  }

  /**
   * Get products by subcategory
   */
  static async getBySubcategory(subcategoryId, options = {}) {
    return await this.getAll({ ...options, subcategory_id: subcategoryId });
  }

  // ==================== Colors & Sizes ====================

  /**
   * Get product colors (through product_variants)
   */
  static async getColors(productId, lang = 'en') {
    const sql = `
      SELECT DISTINCT pc.color_id, pc.color_name_${lang} as color_name, pc.color_hex_code as color_code
      FROM product_colors pc
      WHERE pc.color_id IN (SELECT color_id FROM product_variants WHERE product_id = ? AND color_id IS NOT NULL)
      ORDER BY pc.color_id ASC
    `;

    return await query(sql, [productId]);
  }

  /**
   * Sync product colors (updates variants - removes variants with colors not in the list)
   * Note: This is a destructive operation that removes variants
   */
  static async syncColors(productId, colorIds) {
    if (!colorIds || colorIds.length === 0) {
      // Remove color_id from all variants for this product
      await query('UPDATE product_variants SET color_id = NULL WHERE product_id = ?', [productId]);
    } else {
      // Remove variants with colors not in the list
      const placeholders = colorIds.map(() => '?').join(',');
      await query(
        `DELETE FROM product_variants WHERE product_id = ? AND color_id IS NOT NULL AND color_id NOT IN (${placeholders})`,
        [productId, ...colorIds]
      );
    }

    return await this.getColors(productId);
  }

  /**
   * Get product sizes (through product_variants)
   */
  static async getSizes(productId, lang = 'en') {
    const sql = `
      SELECT DISTINCT ps.size_id, ps.size_name as size_name, ps.size_value as size_code
      FROM product_sizes ps
      WHERE ps.size_id IN (SELECT size_id FROM product_variants WHERE product_id = ? AND size_id IS NOT NULL)
      ORDER BY ps.size_id ASC
    `;

    return await query(sql, [productId]);
  }

  /**
   * Sync product sizes (updates variants - removes variants with sizes not in the list)
   * Note: This is a destructive operation that removes variants
   */
  static async syncSizes(productId, sizeIds) {
    if (!sizeIds || sizeIds.length === 0) {
      // Remove size_id from all variants for this product
      await query('UPDATE product_variants SET size_id = NULL WHERE product_id = ?', [productId]);
    } else {
      // Remove variants with sizes not in the list
      const placeholders = sizeIds.map(() => '?').join(',');
      await query(
        `DELETE FROM product_variants WHERE product_id = ? AND size_id IS NOT NULL AND size_id NOT IN (${placeholders})`,
        [productId, ...sizeIds]
      );
    }

    return await this.getSizes(productId);
  }

  // ==================== Featured & New ====================

  /**
   * Get featured products
   */
  static async getFeatured(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT
        p.product_id,
        p.sku,
        p.${nameField} as product_name,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        pi.image_url,
        p.average_rating as avg_rating
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.is_active = 1 AND p.is_featured = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get new products
   */
  static async getNew(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT
        p.product_id,
        p.sku,
        p.${nameField} as product_name,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        pi.image_url,
        p.average_rating as avg_rating
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get on-sale products (with discount)
   */
  static async getOnSale(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT
        p.product_id,
        p.sku,
        p.${nameField} as product_name,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.is_active = 1 AND p.discount_percentage > 0
      ORDER BY p.discount_percentage DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get best sellers
   */
  static async getBestSellers(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT
        p.product_id,
        p.sku,
        p.${nameField} as product_name,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        p.view_count,
        pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.is_active = 1
      ORDER BY p.view_count DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  // ==================== Inventory ====================

  /**
   * Get low stock products
   */
  static async getLowStock(options = {}) {
    const { limit = 50, lang = 'en' } = options;

    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT 
        p.product_id,
        p.sku,
        p.${nameField} as product_name,
        p.stock_quantity,
        p.low_stock_threshold,
        p.is_active
      FROM products p
      WHERE p.stock_quantity <= p.low_stock_threshold AND p.stock_quantity > 0
      ORDER BY p.stock_quantity ASC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStock(options = {}) {
    const { limit = 50, lang = 'en' } = options;

    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT 
        p.product_id,
        p.sku,
        p.${nameField} as product_name,
        p.stock_quantity,
        p.is_active
      FROM products p
      WHERE p.stock_quantity = 0
      ORDER BY p.updated_at DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  // ==================== Statistics ====================

  /**
   * Get product statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_products,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_products,
        SUM(CASE WHEN is_new = 1 THEN 1 ELSE 0 END) as new_products,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock,
        COALESCE(AVG(price), 0) as avg_price,
        COALESCE(SUM(stock_quantity), 0) as total_stock,
        COALESCE(SUM(sold_count), 0) as total_sold,
        COALESCE(SUM(view_count), 0) as total_views
      FROM products
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Search products
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT
        p.product_id,
        p.sku,
        p.${nameField} as product_name,
        p.base_price as price,
        p.stock_quantity,
        p.is_active,
        pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE
        p.product_name_en LIKE ? OR
        p.product_name_ar LIKE ? OR
        p.product_name_he LIKE ? OR
        p.sku LIKE ?
      ORDER BY
        CASE
          WHEN p.product_name_en LIKE ? THEN 1
          WHEN p.sku LIKE ? THEN 2
          ELSE 3
        END,
        p.product_name_en ASC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    const exactTerm = `${searchTerm}%`;
    return await query(sql, [term, term, term, term, exactTerm, exactTerm, limit]);
  }

  /**
   * Bulk update products
   */
  static async bulkUpdate(productIds, data) {
    if (!productIds || productIds.length === 0) {
      return { updated: 0 };
    }

    const allowedFields = ['is_active', 'is_featured', 'is_new', 'category_id', 'subcategory_id', 'discount_percentage'];
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

    const placeholders = productIds.map(() => '?').join(',');
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE product_id IN (${placeholders})`;

    const result = await query(sql, [...values, ...productIds]);
    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete products
   */
  static async bulkDelete(productIds) {
    if (!productIds || productIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = productIds.map(() => '?').join(',');

    // Delete related data
    await query(`DELETE FROM product_images WHERE product_id IN (${placeholders})`, productIds);
    await query(`DELETE FROM product_colors WHERE product_id IN (${placeholders})`, productIds);
    await query(`DELETE FROM product_sizes WHERE product_id IN (${placeholders})`, productIds);
    await query(`DELETE FROM product_variants WHERE product_id IN (${placeholders})`, productIds);
    await query(`DELETE FROM wishlist WHERE product_id IN (${placeholders})`, productIds);
    await query(`DELETE FROM cart WHERE product_id IN (${placeholders})`, productIds);

    const sql = `DELETE FROM products WHERE product_id IN (${placeholders})`;
    const result = await query(sql, productIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Check if SKU exists
   */
  static async skuExists(sku, excludeId = null) {
    let sql = 'SELECT product_id FROM products WHERE sku = ?';
    const params = [sku];

    if (excludeId) {
      sql += ' AND product_id != ?';
      params.push(excludeId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Duplicate product
   */
  static async duplicate(productId, createdBy = null) {
    const product = await this.getById(productId);
    if (!product) return null;

    // Generate new SKU
    const newSku = `${product.sku}-COPY-${Date.now()}`;

    const newProduct = await this.create({
      sku: newSku,
      product_name_en: `${product.product_name_en} (Copy)`,
      product_name_ar: `${product.product_name_ar} (نسخة)`,
      product_name_he: `${product.product_name_he} (עותק)`,
      product_description_en: product.product_description_en,
      product_description_ar: product.product_description_ar,
      product_description_he: product.product_description_he,
      price: product.price,
      compare_price: product.compare_price,
      cost_price: product.cost_price,
      discount_percentage: product.discount_percentage,
      stock_quantity: 0,
      low_stock_threshold: product.low_stock_threshold,
      main_image: product.main_image,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id,
      is_active: false,
      is_featured: false,
      is_new: false,
      display_order: product.display_order,
      weight: product.weight,
      dimensions: product.dimensions,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      meta_keywords: product.meta_keywords,
      tags: product.tags,
      created_by: createdBy,
    });

    // Copy colors and sizes
    const colors = await this.getColors(productId);
    const sizes = await this.getSizes(productId);

    if (colors.length > 0) {
      await this.syncColors(newProduct.product_id, colors.map(c => c.color_id));
    }

    if (sizes.length > 0) {
      await this.syncSizes(newProduct.product_id, sizes.map(s => s.size_id));
    }

    return newProduct;
  }

  /**
   * Get all products for export
   */
  static async getAllForExport(options = {}) {
    const { is_active, category_id } = options;

    let sql = `
      SELECT 
        p.*,
        c.category_name_en,
        sc.subcategory_name_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
      WHERE 1=1
    `;

    const params = [];

    if (is_active !== undefined) {
      sql += ' AND p.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    sql += ' ORDER BY p.product_id ASC';

    return await query(sql, params);
  }

  /**
   * Get related products
   */
  static async getRelated(productId, options = {}) {
    const { limit = 8, lang = 'en' } = options;

    const product = await this.getById(productId);
    if (!product) return [];

    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT
        p.product_id,
        p.${nameField} as product_name,
        p.base_price as price,
        p.discount_percentage,
        pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.product_id != ?
        AND p.is_active = 1
        AND (p.category_id = ? OR p.subcategory_id = ?)
      ORDER BY RAND()
      LIMIT ?
    `;

    return await query(sql, [productId, product.category_id, product.subcategory_id, limit]);
  }

  /**
   * Get product count
   */
  static async getCount(options = {}) {
    const { is_active, category_id } = options;

    let sql = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (category_id) {
      sql += ' AND category_id = ?';
      params.push(category_id);
    }

    const results = await query(sql, params);
    return results[0].count;
  }
}

module.exports = Product;