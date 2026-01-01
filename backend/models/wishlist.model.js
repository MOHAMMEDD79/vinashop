/**
 * Wishlist Model
 * @module models/wishlist
 */

const { query } = require('../config/database');

/**
 * Wishlist Model - Handles user wishlist database operations
 */
class Wishlist {
  /**
   * Get user's wishlist with pagination
   */
  static async getByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'DESC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const nameField = `p.product_name_${lang}`;
    const descField = `p.product_description_${lang}`;

    // Get total count
    const countSql = 'SELECT COUNT(*) as total FROM wishlist WHERE user_id = ?';
    const countResult = await query(countSql, [userId]);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['wishlist_id', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `w.${sort}` : 'w.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        w.wishlist_id,
        w.user_id,
        w.product_id,
        w.variant_id,
        w.created_at,
        ${nameField} as product_name,
        ${descField} as product_description,
        p.sku,
        p.price,
        p.compare_price,
        p.discount_percentage,
        p.stock_quantity,
        p.is_active as product_active,
        COALESCE(pi.image_url, p.main_image) as image_url,
        c.category_name_${lang} as category_name,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.product_id AND is_approved = 1) as avg_rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.product_id AND is_approved = 1) as review_count,
        v.variant_id,
        v.sku as variant_sku,
        v.price as variant_price,
        v.stock_quantity as variant_stock,
        v.is_active as variant_active,
        col.color_name_${lang} as color_name,
        col.color_hex_code as color_code,
        sz.size_name as size_name
      FROM wishlist w
      LEFT JOIN products p ON w.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_variants v ON w.variant_id = v.variant_id
      LEFT JOIN product_colors col ON v.color_id = col.color_id
      LEFT JOIN product_sizes sz ON v.size_id = sz.size_id
      WHERE w.user_id = ?
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const items = await query(sql, [userId, limit, offset]);

    // Calculate discounted price for each item
    items.forEach(item => {
      if (item.discount_percentage > 0) {
        const price = item.variant_price || item.price;
        item.discounted_price = price - (price * item.discount_percentage / 100);
      } else {
        item.discounted_price = item.variant_price || item.price;
      }
      item.in_stock = item.variant_id 
        ? item.variant_stock > 0 && item.variant_active
        : item.stock_quantity > 0 && item.product_active;
    });

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get wishlist item by ID
   */
  static async getById(wishlistId, lang = 'en') {
    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT 
        w.*,
        ${nameField} as product_name,
        p.sku,
        p.price,
        p.compare_price,
        p.discount_percentage,
        p.stock_quantity,
        p.is_active as product_active,
        COALESCE(pi.image_url, p.main_image) as image_url,
        v.sku as variant_sku,
        v.price as variant_price,
        v.stock_quantity as variant_stock
      FROM wishlist w
      LEFT JOIN products p ON w.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_variants v ON w.variant_id = v.variant_id
      WHERE w.wishlist_id = ?
    `;

    const results = await query(sql, [wishlistId]);
    return results[0] || null;
  }

  /**
   * Get wishlist item by user and product
   */
  static async getByUserAndProduct(userId, productId, variantId = null) {
    let sql = 'SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?';
    const params = [userId, productId];

    if (variantId) {
      sql += ' AND variant_id = ?';
      params.push(variantId);
    } else {
      sql += ' AND variant_id IS NULL';
    }

    const results = await query(sql, params);
    return results[0] || null;
  }

  /**
   * Add item to wishlist
   */
  static async add(data) {
    const { user_id, product_id, variant_id } = data;

    // Check if already in wishlist
    const existing = await this.getByUserAndProduct(user_id, product_id, variant_id);
    if (existing) {
      return existing;
    }

    const sql = `
      INSERT INTO wishlist (user_id, product_id, variant_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      user_id,
      product_id,
      variant_id || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Remove item from wishlist
   */
  static async remove(wishlistId) {
    const sql = 'DELETE FROM wishlist WHERE wishlist_id = ?';
    const result = await query(sql, [wishlistId]);
    return result.affectedRows > 0;
  }

  /**
   * Remove item by user and product
   */
  static async removeByUserAndProduct(userId, productId, variantId = null) {
    let sql = 'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?';
    const params = [userId, productId];

    if (variantId) {
      sql += ' AND variant_id = ?';
      params.push(variantId);
    }

    const result = await query(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * Remove all items by product
   */
  static async removeByProduct(productId) {
    const sql = 'DELETE FROM wishlist WHERE product_id = ?';
    const result = await query(sql, [productId]);
    return result.affectedRows;
  }

  /**
   * Clear user's wishlist
   */
  static async clearByUserId(userId) {
    const sql = 'DELETE FROM wishlist WHERE user_id = ?';
    const result = await query(sql, [userId]);
    return result.affectedRows;
  }

  /**
   * Check if item is in wishlist
   */
  static async isInWishlist(userId, productId, variantId = null) {
    const item = await this.getByUserAndProduct(userId, productId, variantId);
    return item !== null;
  }

  /**
   * Toggle wishlist item
   */
  static async toggle(userId, productId, variantId = null) {
    const existing = await this.getByUserAndProduct(userId, productId, variantId);

    if (existing) {
      await this.remove(existing.wishlist_id);
      return { added: false, removed: true };
    } else {
      await this.add({ user_id: userId, product_id: productId, variant_id: variantId });
      return { added: true, removed: false };
    }
  }

  /**
   * Get wishlist count for user
   */
  static async getCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?';
    const results = await query(sql, [userId]);
    return results[0].count;
  }

  /**
   * Check if wishlist is empty
   */
  static async isEmpty(userId) {
    const count = await this.getCount(userId);
    return count === 0;
  }

  /**
   * Move item to cart
   */
  static async moveToCart(wishlistId, quantity = 1) {
    const item = await this.getById(wishlistId);
    if (!item) return null;

    // Add to cart
    const cartSql = `
      INSERT INTO cart (user_id, product_id, variant_id, quantity, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE quantity = quantity + ?, updated_at = NOW()
    `;

    await query(cartSql, [
      item.user_id,
      item.product_id,
      item.variant_id,
      quantity,
      quantity,
    ]);

    // Remove from wishlist
    await this.remove(wishlistId);

    return { moved: true, product_id: item.product_id };
  }

  /**
   * Move all items to cart
   */
  static async moveAllToCart(userId) {
    const wishlistItems = await this.getByUserId(userId, { limit: 1000 });
    const moved = [];

    for (const item of wishlistItems.data) {
      if (item.in_stock) {
        await this.moveToCart(item.wishlist_id);
        moved.push(item.product_id);
      }
    }

    return { moved_count: moved.length, product_ids: moved };
  }

  // ==================== Admin Operations ====================

  /**
   * Get all wishlist items (admin)
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      user_id,
      product_id,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'DESC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    const nameField = `p.product_name_${lang}`;

    if (user_id) {
      whereClause += ' AND w.user_id = ?';
      params.push(user_id);
    }

    if (product_id) {
      whereClause += ' AND w.product_id = ?';
      params.push(product_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(w.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(w.created_at) <= ?';
      params.push(date_to);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM wishlist w
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const sql = `
      SELECT 
        w.*,
        u.username,
        u.email,
        ${nameField} as product_name,
        p.sku,
        p.price,
        COALESCE(pi.image_url, p.main_image) as image_url
      FROM wishlist w
      LEFT JOIN users u ON w.user_id = u.user_id
      LEFT JOIN products p ON w.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      ${whereClause}
      ORDER BY w.${sort} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const items = await query(sql, params);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get wishlist statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT user_id) as users_with_wishlist,
        COUNT(DISTINCT product_id) as unique_products,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_added,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_added
      FROM wishlist
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get most wishlisted products
   */
  static async getMostWishlisted(options = {}) {
    const { limit = 10, date_from, date_to, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    let whereClause = '';
    const params = [];

    if (date_from || date_to) {
      whereClause = 'WHERE ';
      if (date_from) {
        whereClause += 'DATE(w.created_at) >= ?';
        params.push(date_from);
      }
      if (date_to) {
        if (date_from) whereClause += ' AND ';
        whereClause += 'DATE(w.created_at) <= ?';
        params.push(date_to);
      }
    }

    const sql = `
      SELECT 
        p.product_id,
        ${nameField} as product_name,
        p.sku,
        p.price,
        COALESCE(pi.image_url, p.main_image) as image_url,
        COUNT(w.wishlist_id) as wishlist_count,
        COUNT(DISTINCT w.user_id) as unique_users
      FROM wishlist w
      JOIN products p ON w.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      ${whereClause}
      GROUP BY w.product_id
      ORDER BY wishlist_count DESC
      LIMIT ?
    `;

    params.push(limit);
    return await query(sql, params);
  }

  /**
   * Get users with most wishlist items
   */
  static async getTopUsers(options = {}) {
    const { limit = 10 } = options;

    const sql = `
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(w.wishlist_id) as wishlist_count,
        MAX(w.created_at) as last_added
      FROM wishlist w
      JOIN users u ON w.user_id = u.user_id
      GROUP BY w.user_id
      ORDER BY wishlist_count DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get wishlist trend
   */
  static async getTrend(options = {}) {
    const { date_from, date_to, group_by = 'day' } = options;

    let dateFormat = '%Y-%m-%d';
    if (group_by === 'week') {
      dateFormat = '%Y-%u';
    } else if (group_by === 'month') {
      dateFormat = '%Y-%m';
    }

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date_from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT 
        DATE_FORMAT(created_at, '${dateFormat}') as period,
        COUNT(*) as items_added,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT product_id) as unique_products
      FROM wishlist
      ${whereClause}
      GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
      ORDER BY period ASC
    `;

    return await query(sql, params);
  }

  /**
   * Get products in wishlist but not purchased
   */
  static async getNotPurchased(userId, lang = 'en') {
    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT 
        w.*,
        ${nameField} as product_name,
        p.price,
        COALESCE(pi.image_url, p.main_image) as image_url
      FROM wishlist w
      JOIN products p ON w.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE w.user_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          WHERE o.user_id = w.user_id 
            AND oi.product_id = w.product_id
            AND o.order_status != 'cancelled'
        )
      ORDER BY w.created_at DESC
    `;

    return await query(sql, [userId]);
  }

  /**
   * Get wishlist items for notification (price drop, back in stock)
   */
  static async getForNotification(type, options = {}) {
    const { lang = 'en' } = options;
    const nameField = `p.product_name_${lang}`;

    let sql;

    if (type === 'back_in_stock') {
      sql = `
        SELECT 
          w.wishlist_id,
          w.user_id,
          w.product_id,
          u.email,
          u.first_name,
          u.preferred_language,
          ${nameField} as product_name,
          p.price,
          p.stock_quantity,
          COALESCE(pi.image_url, p.main_image) as image_url
        FROM wishlist w
        JOIN users u ON w.user_id = u.user_id
        JOIN products p ON w.product_id = p.product_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
        WHERE p.stock_quantity > 0 
          AND p.is_active = 1
          AND u.status = 'active'
          AND w.notified_back_in_stock = 0
      `;
    } else if (type === 'price_drop') {
      sql = `
        SELECT 
          w.wishlist_id,
          w.user_id,
          w.product_id,
          w.price_when_added,
          u.email,
          u.first_name,
          u.preferred_language,
          ${nameField} as product_name,
          p.price as current_price,
          COALESCE(pi.image_url, p.main_image) as image_url
        FROM wishlist w
        JOIN users u ON w.user_id = u.user_id
        JOIN products p ON w.product_id = p.product_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
        WHERE p.price < w.price_when_added
          AND p.is_active = 1
          AND u.status = 'active'
          AND w.notified_price_drop = 0
      `;
    }

    return await query(sql);
  }

  /**
   * Mark as notified
   */
  static async markNotified(wishlistId, type) {
    let field;
    if (type === 'back_in_stock') {
      field = 'notified_back_in_stock';
    } else if (type === 'price_drop') {
      field = 'notified_price_drop';
    } else {
      return false;
    }

    const sql = `UPDATE wishlist SET ${field} = 1 WHERE wishlist_id = ?`;
    const result = await query(sql, [wishlistId]);
    return result.affectedRows > 0;
  }

  /**
   * Update price when added
   */
  static async updatePriceWhenAdded(wishlistId, price) {
    const sql = 'UPDATE wishlist SET price_when_added = ? WHERE wishlist_id = ?';
    const result = await query(sql, [price, wishlistId]);
    return result.affectedRows > 0;
  }

  /**
   * Bulk delete wishlist items
   */
  static async bulkDelete(wishlistIds) {
    if (!wishlistIds || wishlistIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = wishlistIds.map(() => '?').join(',');
    const sql = `DELETE FROM wishlist WHERE wishlist_id IN (${placeholders})`;
    const result = await query(sql, wishlistIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Get wishlist items for export
   */
  static async getAllForExport(options = {}) {
    const { user_id, date_from, date_to, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (user_id) {
      whereClause += ' AND w.user_id = ?';
      params.push(user_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(w.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(w.created_at) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT 
        w.*,
        u.username,
        u.email,
        ${nameField} as product_name,
        p.sku,
        p.price
      FROM wishlist w
      LEFT JOIN users u ON w.user_id = u.user_id
      LEFT JOIN products p ON w.product_id = p.product_id
      ${whereClause}
      ORDER BY w.created_at DESC
    `;

    return await query(sql, params);
  }

  /**
   * Get users who wishlisted a product
   */
  static async getUsersByProduct(productId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM wishlist WHERE product_id = ?';
    const countResult = await query(countSql, [productId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        w.wishlist_id,
        w.created_at,
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name
      FROM wishlist w
      JOIN users u ON w.user_id = u.user_id
      WHERE w.product_id = ?
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const users = await query(sql, [productId, limit, offset]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get conversion rate (wishlist to purchase)
   */
  static async getConversionRate(options = {}) {
    const { date_from, date_to } = options;

    let whereClause = '';
    const params = [];

    if (date_from || date_to) {
      whereClause = 'WHERE ';
      if (date_from) {
        whereClause += 'DATE(w.created_at) >= ?';
        params.push(date_from);
      }
      if (date_to) {
        if (date_from) whereClause += ' AND ';
        whereClause += 'DATE(w.created_at) <= ?';
        params.push(date_to);
      }
    }

    const sql = `
      SELECT 
        COUNT(DISTINCT w.wishlist_id) as total_wishlist_items,
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.user_id = w.user_id 
              AND oi.product_id = w.product_id
              AND o.created_at > w.created_at
              AND o.order_status != 'cancelled'
          ) THEN w.wishlist_id 
        END) as converted_items
      FROM wishlist w
      ${whereClause}
    `;

    const results = await query(sql, params);
    const data = results[0];

    data.conversion_rate = data.total_wishlist_items > 0
      ? ((data.converted_items / data.total_wishlist_items) * 100).toFixed(2)
      : 0;

    return data;
  }
}

module.exports = Wishlist;