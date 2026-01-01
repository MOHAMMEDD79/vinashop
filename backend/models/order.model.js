/**
 * Order Model
 * @module models/order
 */

const { query } = require('../config/database');

/**
 * Order Model - Handles order database operations
 */
class Order {
  /**
   * Get all orders with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      payment_status,
      payment_method,
      user_id,
      date_from,
      date_to,
      min_amount,
      max_amount,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (o.order_number LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR o.shipping_first_name LIKE ? OR o.shipping_last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (payment_status) {
      whereClause += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    if (payment_method) {
      whereClause += ' AND o.payment_method = ?';
      params.push(payment_method);
    }

    if (user_id) {
      whereClause += ' AND o.user_id = ?';
      params.push(user_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(o.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(o.created_at) <= ?';
      params.push(date_to);
    }

    if (min_amount) {
      whereClause += ' AND o.total_amount >= ?';
      params.push(min_amount);
    }

    if (max_amount) {
      whereClause += ' AND o.total_amount <= ?';
      params.push(max_amount);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['order_id', 'order_number', 'total_amount', 'status', 'payment_status', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `o.${sort}` : 'o.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        o.*,
        u.full_name as customer_name,
        u.email as user_email,
        u.phone_number as user_phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const orders = await query(sql, params);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order by ID
   */
  static async getById(orderId) {
    const sql = `
      SELECT
        o.*,
        u.full_name as customer_name,
        u.email as user_email,
        u.phone_number as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    `;

    const results = await query(sql, [orderId]);
    return results[0] || null;
  }

  /**
   * Get order by order number
   */
  static async getByOrderNumber(orderNumber) {
    const sql = `
      SELECT
        o.*,
        u.full_name as customer_name,
        u.email as user_email,
        u.phone_number as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE o.order_number = ?
    `;

    const results = await query(sql, [orderNumber]);
    return results[0] || null;
  }

  /**
   * Get order with items
   * Supports both legacy (variant/color/size) and new (combination) systems
   */
  static async getWithItems(orderId, lang = 'en') {
    const order = await this.getById(orderId);
    if (!order) return null;

    const nameField = `product_name_${lang}`;

    const itemsSql = `
      SELECT
        oi.*,
        p.${nameField} as product_name,
        p.sku,
        COALESCE(pi.image_url, p.main_image) as image_url,
        -- Legacy color/size support
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        -- New combination support
        poc.sku as combination_sku,
        poc.option_summary,
        poc.option_values_json
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_colors c ON oi.color_id = c.color_id
      LEFT JOIN product_sizes s ON oi.size_id = s.size_id
      LEFT JOIN product_option_combinations poc ON oi.combination_id = poc.combination_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id ASC
    `;

    order.items = await query(itemsSql, [orderId]);

    return order;
  }

  /**
   * Generate order number
   */
  static async generateOrderNumber(prefix = 'ORD') {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const sql = `
      SELECT order_number FROM orders 
      WHERE order_number LIKE ?
      ORDER BY order_id DESC LIMIT 1
    `;

    const results = await query(sql, [`${prefix}-${year}${month}${day}-%`]);

    let sequence = 1;
    if (results.length > 0) {
      const lastNumber = results[0].order_number;
      const lastSequence = parseInt(lastNumber.split('-').pop());
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Create order
   */
  static async create(data) {
    const {
      order_number,
      user_id,
      subtotal,
      tax_amount = 0,
      discount_amount = 0,
      shipping_cost = 0,
      total_amount,
      currency = 'ILS',
      status = 'pending',
      payment_status = 'pending',
      payment_method,
      shipping_method,
      shipping_first_name,
      shipping_last_name,
      shipping_company,
      shipping_address_1,
      shipping_address_2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      shipping_phone,
      billing_first_name,
      billing_last_name,
      billing_address_1,
      billing_address_2,
      billing_city,
      billing_state,
      billing_postal_code,
      billing_country,
      billing_phone,
      notes,
      internal_notes,
      coupon_code,
      coupon_discount,
      ip_address,
      user_agent,
    } = data;

    const sql = `
      INSERT INTO orders (
        order_number,
        user_id,
        subtotal,
        tax_amount,
        discount_amount,
        shipping_cost,
        total_amount,
        currency,
        status,
        payment_status,
        payment_method,
        shipping_method,
        shipping_first_name,
        shipping_last_name,
        shipping_company,
        shipping_address_1,
        shipping_address_2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        shipping_phone,
        billing_first_name,
        billing_last_name,
        billing_address_1,
        billing_address_2,
        billing_city,
        billing_state,
        billing_postal_code,
        billing_country,
        billing_phone,
        notes,
        internal_notes,
        coupon_code,
        coupon_discount,
        ip_address,
        user_agent,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      order_number,
      user_id || null,
      subtotal,
      tax_amount,
      discount_amount,
      shipping_cost,
      total_amount,
      currency,
      status,
      payment_status,
      payment_method || null,
      shipping_method || null,
      shipping_first_name || null,
      shipping_last_name || null,
      shipping_company || null,
      shipping_address_1 || null,
      shipping_address_2 || null,
      shipping_city || null,
      shipping_state || null,
      shipping_postal_code || null,
      shipping_country || null,
      shipping_phone || null,
      billing_first_name || null,
      billing_last_name || null,
      billing_address_1 || null,
      billing_address_2 || null,
      billing_city || null,
      billing_state || null,
      billing_postal_code || null,
      billing_country || null,
      billing_phone || null,
      notes || null,
      internal_notes || null,
      coupon_code || null,
      coupon_discount || 0,
      ip_address || null,
      user_agent || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update order
   */
  static async update(orderId, data) {
    const allowedFields = [
      'subtotal',
      'tax_amount',
      'discount_amount',
      'shipping_cost',
      'total_amount',
      'status',
      'payment_status',
      'payment_method',
      'shipping_method',
      'shipping_first_name',
      'shipping_last_name',
      'shipping_company',
      'shipping_address_1',
      'shipping_address_2',
      'shipping_city',
      'shipping_state',
      'shipping_postal_code',
      'shipping_country',
      'shipping_phone',
      'billing_first_name',
      'billing_last_name',
      'billing_address_1',
      'billing_address_2',
      'billing_city',
      'billing_state',
      'billing_postal_code',
      'billing_country',
      'billing_phone',
      'notes',
      'internal_notes',
      'tracking_number',
      'tracking_url',
      'shipped_at',
      'delivered_at',
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
      return await this.getById(orderId);
    }

    updates.push('updated_at = NOW()');
    values.push(orderId);

    const sql = `UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`;
    await query(sql, values);

    return await this.getById(orderId);
  }

  /**
   * Delete order
   */
  static async delete(orderId) {
    // Delete order items first
    await query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

    // Delete order status history
    await query('DELETE FROM status_history WHERE order_id = ?', [orderId]);

    const sql = 'DELETE FROM orders WHERE order_id = ?';
    const result = await query(sql, [orderId]);
    return result.affectedRows > 0;
  }

  /**
   * Update order status
   */
  static async updateStatus(orderId, status, updatedBy = null, notes = null) {
    const order = await this.getById(orderId);
    if (!order) return null;

    // Update order
    let sql = 'UPDATE orders SET status = ?, updated_at = NOW()';
    const params = [status];

    if (status === 'shipped') {
      sql += ', shipped_at = NOW()';
    } else if (status === 'delivered') {
      sql += ', delivered_at = NOW()';
    } else if (status === 'cancelled') {
      sql += ', cancelled_at = NOW()';
    }

    sql += ' WHERE order_id = ?';
    params.push(orderId);

    await query(sql, params);

    // Add to status history
    await this.addStatusHistory({
      order_id: orderId,
      old_status: order.status,
      new_status: status,
      changed_by: updatedBy,
      notes,
    });

    return await this.getById(orderId);
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(orderId, status, transactionId = null) {
    let sql = 'UPDATE orders SET payment_status = ?, updated_at = NOW()';
    const params = [status];

    if (transactionId) {
      sql += ', transaction_id = ?';
      params.push(transactionId);
    }

    if (status === 'paid') {
      sql += ', paid_at = NOW()';
    }

    sql += ' WHERE order_id = ?';
    params.push(orderId);

    await query(sql, params);
    return await this.getById(orderId);
  }

  /**
   * Add tracking information
   */
  static async addTracking(orderId, trackingNumber, trackingUrl = null, carrier = null) {
    const sql = `
      UPDATE orders 
      SET tracking_number = ?, tracking_url = ?, shipping_carrier = ?, updated_at = NOW()
      WHERE order_id = ?
    `;

    await query(sql, [trackingNumber, trackingUrl, carrier, orderId]);
    return await this.getById(orderId);
  }

  // ==================== Order Items ====================

  /**
   * Get order items
   * Supports both legacy (variant/color/size) and new (combination) systems
   */
  static async getItems(orderId, lang = 'en') {
    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT
        oi.*,
        p.${nameField} as product_name,
        p.sku,
        COALESCE(pi.image_url, p.main_image) as image_url,
        -- Legacy color/size support
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        -- New combination support
        poc.sku as combination_sku,
        poc.option_summary,
        poc.option_values_json
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_colors c ON oi.color_id = c.color_id
      LEFT JOIN product_sizes s ON oi.size_id = s.size_id
      LEFT JOIN product_option_combinations poc ON oi.combination_id = poc.combination_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id ASC
    `;

    return await query(sql, [orderId]);
  }

  /**
   * Add order item
   * Supports both legacy (variant/color/size) and new (combination) systems
   */
  static async addItem(data) {
    const {
      order_id,
      product_id,
      variant_id,
      color_id,
      size_id,
      combination_id,
      selected_options,
      quantity,
      price,
      discount = 0,
      tax = 0,
      total,
      product_name,
      product_sku,
    } = data;

    const sql = `
      INSERT INTO order_items (
        order_id,
        product_id,
        variant_id,
        color_id,
        size_id,
        combination_id,
        selected_options,
        quantity,
        price,
        discount,
        tax,
        total,
        product_name,
        product_sku,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      order_id,
      product_id,
      variant_id || null,
      color_id || null,
      size_id || null,
      combination_id || null,
      selected_options ? JSON.stringify(selected_options) : null,
      quantity,
      price,
      discount,
      tax,
      total,
      product_name || null,
      product_sku || null,
    ]);

    return result.insertId;
  }

  /**
   * Add order item with combination (new system)
   */
  static async addItemWithCombination(data) {
    const {
      order_id,
      product_id,
      combination_id,
      quantity,
      price,
      discount = 0,
      tax = 0,
      total,
      product_name,
      product_sku,
    } = data;

    // Get combination details
    const combinationSql = `SELECT option_values_json, option_summary FROM product_option_combinations WHERE combination_id = ?`;
    const [combination] = await query(combinationSql, [combination_id]);

    const sql = `
      INSERT INTO order_items (
        order_id,
        product_id,
        combination_id,
        selected_options,
        quantity,
        price,
        discount,
        tax,
        total,
        product_name,
        product_sku,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      order_id,
      product_id,
      combination_id,
      combination ? combination.option_values_json : null,
      quantity,
      price,
      discount,
      tax,
      total,
      product_name || null,
      product_sku || null,
    ]);

    return result.insertId;
  }

  /**
   * Update order item
   */
  static async updateItem(itemId, data) {
    const allowedFields = ['quantity', 'price', 'discount', 'tax', 'total'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return false;

    values.push(itemId);
    const sql = `UPDATE order_items SET ${updates.join(', ')} WHERE order_item_id = ?`;
    const result = await query(sql, values);

    return result.affectedRows > 0;
  }

  /**
   * Delete order item
   */
  static async deleteItem(itemId) {
    const sql = 'DELETE FROM order_items WHERE order_item_id = ?';
    const result = await query(sql, [itemId]);
    return result.affectedRows > 0;
  }

  // ==================== Order Status History ====================

  /**
   * Get order status history
   */
  static async getStatusHistory(orderId) {
    const sql = `
      SELECT 
        osh.*,
        a.username as admin_username
      FROM status_history osh
      LEFT JOIN admin_users a ON osh.changed_by = a.admin_id
      WHERE osh.order_id = ?
      ORDER BY osh.created_at DESC
    `;

    return await query(sql, [orderId]);
  }

  /**
   * Add status history entry
   */
  static async addStatusHistory(data) {
    const {
      order_id,
      old_status,
      new_status,
      changed_by,
      notes,
    } = data;

    const sql = `
      INSERT INTO status_history (
        order_id,
        old_status,
        new_status,
        changed_by,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      order_id,
      old_status,
      new_status,
      changed_by || null,
      notes || null,
    ]);

    return result.insertId;
  }

  // ==================== User Orders ====================

  /**
   * Get orders by user
   */
  static async getByUserId(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    const params = [userId];

    let whereClause = 'WHERE o.user_id = ?';

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
      FROM orders o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const orders = await query(sql, params);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user order count
   */
  static async getUserOrderCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?';
    const results = await query(sql, [userId]);
    return results[0].count;
  }

  /**
   * Get user total spent
   */
  static async getUserTotalSpent(userId) {
    const sql = `
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE user_id = ? AND payment_status = 'paid'
    `;
    const results = await query(sql, [userId]);
    return parseFloat(results[0].total);
  }

  // ==================== Statistics ====================

  /**
   * Get order statistics
   */
  static async getStatistics(options = {}) {
    const { period = 'all' } = options;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = 'AND DATE(created_at) = CURDATE()';
    } else if (period === 'week') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
    }

    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as payment_pending,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as collected_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value,
        COUNT(DISTINCT user_id) as unique_customers,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_orders
      FROM orders
      WHERE 1=1 ${dateFilter}
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get orders by status count
   */
  static async getCountByStatus() {
    const sql = `
      SELECT 
        status as status,
        COUNT(*) as count
      FROM orders
      GROUP BY status
    `;

    return await query(sql);
  }

  /**
   * Get recent orders
   */
  static async getRecent(limit = 10) {
    const sql = `
      SELECT
        o.order_id,
        o.order_number,
        o.total_amount,
        o.status,
        o.payment_status,
        o.created_at,
        u.full_name as customer_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      ORDER BY o.created_at DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get sales report
   */
  static async getSalesReport(options = {}) {
    const { date_from, date_to, group_by = 'day' } = options;

    let dateFormat = '%Y-%m-%d';
    if (group_by === 'week') {
      dateFormat = '%Y-%u';
    } else if (group_by === 'month') {
      dateFormat = '%Y-%m';
    } else if (group_by === 'year') {
      dateFormat = '%Y';
    }

    let whereClause = "WHERE payment_status = 'paid'";
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
        COUNT(*) as order_count,
        SUM(total_amount) as revenue,
        SUM(tax_amount) as tax_collected,
        SUM(discount_amount) as discounts_given,
        AVG(total_amount) as avg_order_value
      FROM orders
      ${whereClause}
      GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
      ORDER BY period ASC
    `;

    return await query(sql, params);
  }

  /**
   * Get top selling products
   */
  static async getTopSellingProducts(options = {}) {
    const { limit = 10, date_from, date_to, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

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
        oi.product_id,
        ${nameField} as product_name,
        p.sku,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total) as total_revenue,
        COUNT(DISTINCT o.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      ${whereClause}
      GROUP BY oi.product_id
      ORDER BY total_quantity DESC
      LIMIT ?
    `;

    params.push(limit);
    return await query(sql, params);
  }

  /**
   * Search orders
   */
  static async search(searchTerm, limit = 10) {
    const sql = `
      SELECT
        o.order_id,
        o.order_number,
        o.total_amount,
        o.status,
        o.payment_status,
        o.created_at,
        u.full_name as customer_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE
        o.order_number LIKE ? OR
        u.full_name LIKE ? OR
        u.email LIKE ? OR
        o.shipping_first_name LIKE ? OR
        o.shipping_last_name LIKE ?
      ORDER BY o.created_at DESC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, term, term, limit]);
  }

  /**
   * Bulk update order status
   */
  static async bulkUpdateStatus(orderIds, status, updatedBy = null) {
    if (!orderIds || orderIds.length === 0) {
      return { updated: 0 };
    }

    const placeholders = orderIds.map(() => '?').join(',');
    const sql = `
      UPDATE orders 
      SET status = ?, updated_at = NOW()
      WHERE order_id IN (${placeholders})
    `;

    const result = await query(sql, [status, ...orderIds]);

    // Add status history for each
    for (const orderId of orderIds) {
      await this.addStatusHistory({
        order_id: orderId,
        old_status: null,
        new_status: status,
        changed_by: updatedBy,
        notes: 'Bulk status update',
      });
    }

    return { updated: result.affectedRows };
  }

  /**
   * Get orders for export
   */
  static async getAllForExport(options = {}) {
    const { status, date_from, date_to } = options;

    let sql = `
      SELECT
        o.*,
        u.full_name as customer_name,
        u.email as user_email,
        u.phone_number as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    if (date_from) {
      sql += ' AND DATE(o.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      sql += ' AND DATE(o.created_at) <= ?';
      params.push(date_to);
    }

    sql += ' ORDER BY o.created_at DESC';

    return await query(sql, params);
  }

  /**
   * Cancel order
   */
  static async cancel(orderId, reason = null, cancelledBy = null) {
    const order = await this.getById(orderId);
    if (!order) return null;

    const sql = `
      UPDATE orders 
      SET status = 'cancelled', 
          cancelled_at = NOW(),
          cancellation_reason = ?,
          updated_at = NOW()
      WHERE order_id = ?
    `;

    await query(sql, [reason, orderId]);

    await this.addStatusHistory({
      order_id: orderId,
      old_status: order.status,
      new_status: 'cancelled',
      changed_by: cancelledBy,
      notes: reason,
    });

    return await this.getById(orderId);
  }

  /**
   * Refund order
   */
  static async refund(orderId, amount, reason = null, refundedBy = null) {
    const order = await this.getById(orderId);
    if (!order) return null;

    const sql = `
      UPDATE orders 
      SET payment_status = 'refunded',
          refund_amount = ?,
          refund_reason = ?,
          refunded_at = NOW(),
          updated_at = NOW()
      WHERE order_id = ?
    `;

    await query(sql, [amount, reason, orderId]);

    return await this.getById(orderId);
  }

  /**
   * Get pending orders count
   */
  static async getPendingCount() {
    const sql = "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'";
    const results = await query(sql);
    return results[0].count;
  }

  /**
   * Get today's orders count
   */
  static async getTodayCount() {
    const sql = 'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()';
    const results = await query(sql);
    return results[0].count;
  }

  /**
   * Get today's revenue
   */
  static async getTodayRevenue() {
    const sql = `
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE() AND payment_status = 'paid'
    `;
    const results = await query(sql);
    return parseFloat(results[0].revenue);
  }

  /**
   * Get top cities by orders - ADDED for dashboard
   */
  static async getTopCities(options = {}) {
    const { limit = 10, period = 'month' } = options;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
    }

    const sql = `
      SELECT
        COALESCE(shipping_city, 'Unknown') as city,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue
      FROM orders
      WHERE shipping_city IS NOT NULL AND shipping_city != '' ${dateFilter}
      GROUP BY shipping_city
      ORDER BY order_count DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get orders by payment method - ADDED for dashboard
   */
  static async getCountByPaymentMethod() {
    const sql = `
      SELECT
        COALESCE(payment_method, 'unknown') as payment_method,
        COUNT(*) as count
      FROM orders
      GROUP BY payment_method
    `;

    return await query(sql);
  }

  /**
   * Get sales by hour - ADDED for dashboard
   */
  static async getSalesByHour() {
    const sql = `
      SELECT
        HOUR(created_at) as hour,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE()
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `;

    const results = await query(sql);

    // Format into arrays for charts
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data = hours.map(h => {
      const found = results.find(r => r.hour === h);
      return found ? parseFloat(found.revenue) : 0;
    });

    return {
      labels: hours.map(h => `${h}:00`),
      data,
      values: data,
    };
  }

  /**
   * Get sales by day of week - ADDED for dashboard
   */
  static async getSalesByDayOfWeek(options = {}) {
    const { period = 'month' } = options;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
    }

    const sql = `
      SELECT
        DAYOFWEEK(created_at) as day_number,
        DAYNAME(created_at) as day_name,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE 1=1 ${dateFilter}
      GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
      ORDER BY day_number ASC
    `;

    const results = await query(sql);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = days.map((dayName, index) => {
      const found = results.find(r => r.day_number === index + 1);
      return found ? parseFloat(found.revenue) : 0;
    });

    return {
      labels: days,
      data,
      values: data,
    };
  }
}

module.exports = Order;