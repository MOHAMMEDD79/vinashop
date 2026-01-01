/**
 * OrderItem Model
 * @module models/orderItem
 */

const { query } = require('../config/database');

/**
 * OrderItem Model - Handles order items database operations
 */
class OrderItem {
  /**
   * Get all order items with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      order_id,
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

    if (order_id) {
      whereClause += ' AND oi.order_id = ?';
      params.push(order_id);
    }

    if (product_id) {
      whereClause += ' AND oi.product_id = ?';
      params.push(product_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(oi.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(oi.created_at) <= ?';
      params.push(date_to);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM order_items oi
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['order_item_id', 'quantity', 'price', 'total', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `oi.${sort}` : 'oi.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        oi.*,
        ${nameField} as product_name,
        p.sku,
        p.main_image,
        o.order_number,
        o.order_status,
        o.user_id,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        v.sku as variant_sku
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN product_colors c ON oi.color_id = c.color_id
      LEFT JOIN product_sizes s ON oi.size_id = s.size_id
      LEFT JOIN product_variants v ON oi.variant_id = v.variant_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
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
   * Get order item by ID
   */
  static async getById(itemId, lang = 'en') {
    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT 
        oi.*,
        ${nameField} as product_name,
        p.sku,
        p.main_image,
        p.price as current_price,
        o.order_number,
        o.order_status,
        o.payment_status,
        o.user_id,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        v.sku as variant_sku,
        v.price as variant_price
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN product_colors c ON oi.color_id = c.color_id
      LEFT JOIN product_sizes s ON oi.size_id = s.size_id
      LEFT JOIN product_variants v ON oi.variant_id = v.variant_id
      WHERE oi.order_item_id = ?
    `;

    const results = await query(sql, [itemId]);
    return results[0] || null;
  }

  /**
   * Get items by order ID
   */
  static async getByOrderId(orderId, lang = 'en') {
    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT 
        oi.*,
        ${nameField} as product_name,
        p.sku,
        COALESCE(pi.image_url, p.main_image) as image_url,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        v.sku as variant_sku
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_colors c ON oi.color_id = c.color_id
      LEFT JOIN product_sizes s ON oi.size_id = s.size_id
      LEFT JOIN product_variants v ON oi.variant_id = v.variant_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id ASC
    `;

    return await query(sql, [orderId]);
  }

  /**
   * Get items by product ID
   */
  static async getByProductId(productId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM order_items WHERE product_id = ?';
    const countResult = await query(countSql, [productId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        oi.*,
        o.order_number,
        o.order_status,
        o.created_at as order_date,
        u.username,
        u.email
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE oi.product_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = await query(sql, [productId, limit, offset]);

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
   * Create order item
   */
  static async create(data) {
    const {
      order_id,
      product_id,
      variant_id,
      color_id,
      size_id,
      quantity,
      price,
      discount = 0,
      tax = 0,
      total,
      product_name,
      product_sku,
      notes,
    } = data;

    const sql = `
      INSERT INTO order_items (
        order_id,
        product_id,
        variant_id,
        color_id,
        size_id,
        quantity,
        price,
        discount,
        tax,
        total,
        product_name,
        product_sku,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      order_id,
      product_id,
      variant_id || null,
      color_id || null,
      size_id || null,
      quantity,
      price,
      discount,
      tax,
      total,
      product_name || null,
      product_sku || null,
      notes || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Create multiple order items
   */
  static async createMultiple(orderId, items) {
    const created = [];

    for (const item of items) {
      const orderItem = await this.create({
        order_id: orderId,
        ...item,
      });
      created.push(orderItem);
    }

    return created;
  }

  /**
   * Update order item
   */
  static async update(itemId, data) {
    const allowedFields = [
      'quantity',
      'price',
      'discount',
      'tax',
      'total',
      'notes',
      'status',
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return await this.getById(itemId);
    }

    updates.push('updated_at = NOW()');
    values.push(itemId);

    const sql = `UPDATE order_items SET ${updates.join(', ')} WHERE order_item_id = ?`;
    await query(sql, values);

    return await this.getById(itemId);
  }

  /**
   * Update quantity
   */
  static async updateQuantity(itemId, quantity) {
    const item = await this.getById(itemId);
    if (!item) return null;

    const total = (item.price - item.discount + item.tax) * quantity;

    const sql = `
      UPDATE order_items 
      SET quantity = ?, total = ?, updated_at = NOW()
      WHERE order_item_id = ?
    `;

    await query(sql, [quantity, total, itemId]);

    // Recalculate order totals
    await this.recalculateOrderTotals(item.order_id);

    return await this.getById(itemId);
  }

  /**
   * Delete order item
   */
  static async delete(itemId) {
    const item = await this.getById(itemId);
    if (!item) return false;

    const sql = 'DELETE FROM order_items WHERE order_item_id = ?';
    const result = await query(sql, [itemId]);

    if (result.affectedRows > 0) {
      // Recalculate order totals
      await this.recalculateOrderTotals(item.order_id);
    }

    return result.affectedRows > 0;
  }

  /**
   * Delete all items for an order
   */
  static async deleteByOrderId(orderId) {
    const sql = 'DELETE FROM order_items WHERE order_id = ?';
    const result = await query(sql, [orderId]);
    return result.affectedRows;
  }

  /**
   * Recalculate order totals
   */
  static async recalculateOrderTotals(orderId) {
    const sql = `
      SELECT 
        COALESCE(SUM(price * quantity), 0) as subtotal,
        COALESCE(SUM(discount * quantity), 0) as total_discount,
        COALESCE(SUM(tax * quantity), 0) as total_tax,
        COALESCE(SUM(total), 0) as items_total
      FROM order_items
      WHERE order_id = ?
    `;

    const results = await query(sql, [orderId]);
    const totals = results[0];

    // Get current shipping amount
    const orderSql = 'SELECT shipping_amount FROM orders WHERE order_id = ?';
    const orderResults = await query(orderSql, [orderId]);
    const shippingAmount = orderResults[0]?.shipping_amount || 0;

    // Update order
    const updateSql = `
      UPDATE orders 
      SET 
        subtotal = ?,
        discount_amount = ?,
        tax_amount = ?,
        total_amount = ? + ?,
        updated_at = NOW()
      WHERE order_id = ?
    `;

    await query(updateSql, [
      totals.subtotal,
      totals.total_discount,
      totals.total_tax,
      totals.items_total,
      shippingAmount,
      orderId,
    ]);

    return totals;
  }

  /**
   * Get item count for order
   */
  static async getCountByOrderId(orderId) {
    const sql = 'SELECT COUNT(*) as count FROM order_items WHERE order_id = ?';
    const results = await query(sql, [orderId]);
    return results[0].count;
  }

  /**
   * Get total quantity for order
   */
  static async getTotalQuantityByOrderId(orderId) {
    const sql = 'SELECT COALESCE(SUM(quantity), 0) as total FROM order_items WHERE order_id = ?';
    const results = await query(sql, [orderId]);
    return results[0].total;
  }

  /**
   * Get items by variant
   */
  static async getByVariantId(variantId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM order_items WHERE variant_id = ?';
    const countResult = await query(countSql, [variantId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        oi.*,
        o.order_number,
        o.order_status,
        o.created_at as order_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE oi.variant_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = await query(sql, [variantId, limit, offset]);

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
   * Get item statistics
   */
  static async getStatistics(options = {}) {
    const { period = 'all' } = options;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = 'AND DATE(oi.created_at) = CURDATE()';
    } else if (period === 'week') {
      dateFilter = 'AND oi.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND oi.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    const sql = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT oi.order_id) as total_orders,
        COUNT(DISTINCT oi.product_id) as unique_products,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COALESCE(SUM(oi.total), 0) as total_revenue,
        COALESCE(AVG(oi.price), 0) as avg_item_price,
        COALESCE(AVG(oi.quantity), 0) as avg_quantity_per_item
      FROM order_items oi
      WHERE 1=1 ${dateFilter}
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get most ordered products
   */
  static async getMostOrdered(options = {}) {
    const { limit = 10, date_from, date_to, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    let whereClause = '';
    const params = [];

    if (date_from || date_to) {
      whereClause = 'WHERE ';
      if (date_from) {
        whereClause += 'DATE(oi.created_at) >= ?';
        params.push(date_from);
      }
      if (date_to) {
        if (date_from) whereClause += ' AND ';
        whereClause += 'DATE(oi.created_at) <= ?';
        params.push(date_to);
      }
    }

    const sql = `
      SELECT 
        oi.product_id,
        ${nameField} as product_name,
        p.sku,
        p.main_image,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count,
        AVG(oi.price) as avg_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      ${whereClause}
      GROUP BY oi.product_id
      ORDER BY total_quantity DESC
      LIMIT ?
    `;

    params.push(limit);
    return await query(sql, params);
  }

  /**
   * Get items by color
   */
  static async getByColorId(colorId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM order_items WHERE color_id = ?';
    const countResult = await query(countSql, [colorId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        oi.*,
        o.order_number,
        o.order_status,
        o.created_at as order_date,
        p.product_name_en as product_name
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.color_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = await query(sql, [colorId, limit, offset]);

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
   * Get items by size
   */
  static async getBySizeId(sizeId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM order_items WHERE size_id = ?';
    const countResult = await query(countSql, [sizeId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        oi.*,
        o.order_number,
        o.order_status,
        o.created_at as order_date,
        p.product_name_en as product_name
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.size_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = await query(sql, [sizeId, limit, offset]);

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
   * Get revenue by product
   */
  static async getRevenueByProduct(productId, options = {}) {
    const { date_from, date_to, group_by = 'day' } = options;

    let dateFormat = '%Y-%m-%d';
    if (group_by === 'week') {
      dateFormat = '%Y-%u';
    } else if (group_by === 'month') {
      dateFormat = '%Y-%m';
    }

    let whereClause = 'WHERE oi.product_id = ?';
    const params = [productId];

    if (date_from) {
      whereClause += ' AND DATE(oi.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(oi.created_at) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT 
        DATE_FORMAT(oi.created_at, '${dateFormat}') as period,
        SUM(oi.quantity) as quantity,
        SUM(oi.total) as revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      ${whereClause}
      GROUP BY DATE_FORMAT(oi.created_at, '${dateFormat}')
      ORDER BY period ASC
    `;

    return await query(sql, params);
  }

  /**
   * Bulk delete items
   */
  static async bulkDelete(itemIds) {
    if (!itemIds || itemIds.length === 0) {
      return { deleted: 0 };
    }

    // Get order IDs to recalculate totals
    const placeholders = itemIds.map(() => '?').join(',');
    const ordersSql = `SELECT DISTINCT order_id FROM order_items WHERE order_item_id IN (${placeholders})`;
    const orders = await query(ordersSql, itemIds);

    const sql = `DELETE FROM order_items WHERE order_item_id IN (${placeholders})`;
    const result = await query(sql, itemIds);

    // Recalculate order totals
    for (const order of orders) {
      await this.recalculateOrderTotals(order.order_id);
    }

    return { deleted: result.affectedRows };
  }

  /**
   * Get item totals for an order
   */
  static async getOrderItemTotals(orderId) {
    const sql = `
      SELECT 
        COUNT(*) as item_count,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(price * quantity), 0) as subtotal,
        COALESCE(SUM(discount * quantity), 0) as total_discount,
        COALESCE(SUM(tax * quantity), 0) as total_tax,
        COALESCE(SUM(total), 0) as grand_total
      FROM order_items
      WHERE order_id = ?
    `;

    const results = await query(sql, [orderId]);
    return results[0];
  }

  /**
   * Check if product was ordered by user
   */
  static async wasOrderedByUser(productId, userId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE oi.product_id = ? AND o.user_id = ? AND o.order_status != 'cancelled'
    `;

    const results = await query(sql, [productId, userId]);
    return results[0].count > 0;
  }

  /**
   * Get color/size breakdown for product orders
   */
  static async getProductVariantBreakdown(productId, options = {}) {
    const { date_from, date_to, lang = 'en' } = options;

    let whereClause = 'WHERE oi.product_id = ?';
    const params = [productId];

    if (date_from) {
      whereClause += ' AND DATE(oi.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(oi.created_at) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT 
        oi.color_id,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        oi.size_id,
        s.size_name as size_name,
        SUM(oi.quantity) as quantity,
        SUM(oi.total) as revenue
      FROM order_items oi
      LEFT JOIN product_colors c ON oi.color_id = c.color_id
      LEFT JOIN product_sizes s ON oi.size_id = s.size_id
      ${whereClause}
      GROUP BY oi.color_id, oi.size_id
      ORDER BY quantity DESC
    `;

    return await query(sql, params);
  }

  /**
   * Get items for export
   */
  static async getAllForExport(options = {}) {
    const { order_id, date_from, date_to, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (order_id) {
      whereClause += ' AND oi.order_id = ?';
      params.push(order_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(oi.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(oi.created_at) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT 
        oi.*,
        ${nameField} as product_name,
        p.sku,
        o.order_number,
        o.order_status,
        o.created_at as order_date,
        c.color_name_en as color_name,
        s.size_name as size_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN product_colors c ON oi.color_id = c.color_id
      LEFT JOIN product_sizes s ON oi.size_id = s.size_id
      ${whereClause}
      ORDER BY o.created_at DESC, oi.order_item_id ASC
    `;

    return await query(sql, params);
  }
}

module.exports = OrderItem;