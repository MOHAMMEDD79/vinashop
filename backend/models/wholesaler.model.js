/**
 * Wholesaler Model
 * @module models/wholesaler
 */

const { query } = require('../config/database');

/**
 * Wholesaler Model - Handles wholesaler database operations
 */
class Wholesaler {
  /**
   * Get all wholesalers with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (w.company_name LIKE ? OR w.contact_person LIKE ? OR w.phone LIKE ? OR w.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND w.status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM wholesalers w ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const allowedSorts = ['wholesaler_id', 'company_name', 'current_balance', 'discount_percentage', 'status', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `w.${sort}` : 'w.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        w.*,
        (SELECT COUNT(*) FROM wholesaler_orders WHERE wholesaler_id = w.wholesaler_id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM wholesaler_orders WHERE wholesaler_id = w.wholesaler_id) as total_sales,
        (SELECT COALESCE(SUM(amount), 0) FROM wholesaler_payments WHERE wholesaler_id = w.wholesaler_id) as total_payments
      FROM wholesalers w
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const wholesalers = await query(sql, params);

    return {
      data: wholesalers,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get wholesaler by ID
   */
  static async getById(wholesalerId) {
    const sql = `
      SELECT
        w.*,
        (SELECT COUNT(*) FROM wholesaler_orders WHERE wholesaler_id = w.wholesaler_id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM wholesaler_orders WHERE wholesaler_id = w.wholesaler_id) as total_sales,
        (SELECT COALESCE(SUM(amount), 0) FROM wholesaler_payments WHERE wholesaler_id = w.wholesaler_id) as total_payments
      FROM wholesalers w
      WHERE w.wholesaler_id = ?
    `;

    const results = await query(sql, [wholesalerId]);
    return results[0] || null;
  }

  /**
   * Create wholesaler
   */
  static async create(data) {
    const sql = `
      INSERT INTO wholesalers (
        company_name, contact_person, phone, email, address,
        tax_number, discount_percentage, credit_limit, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.company_name,
      data.contact_person || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.tax_number || null,
      data.discount_percentage || 0,
      data.credit_limit || 0,
      data.status || 'active',
      data.notes || null,
    ];

    const result = await query(sql, params);
    return await this.getById(result.insertId);
  }

  /**
   * Update wholesaler
   */
  static async update(wholesalerId, data) {
    const allowedFields = [
      'company_name', 'contact_person', 'phone', 'email', 'address',
      'tax_number', 'discount_percentage', 'credit_limit', 'status', 'notes'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) return await this.getById(wholesalerId);

    params.push(wholesalerId);
    const sql = `UPDATE wholesalers SET ${updates.join(', ')} WHERE wholesaler_id = ?`;
    await query(sql, params);

    return await this.getById(wholesalerId);
  }

  /**
   * Delete wholesaler
   */
  static async delete(wholesalerId) {
    const sql = 'DELETE FROM wholesalers WHERE wholesaler_id = ?';
    const result = await query(sql, [wholesalerId]);
    return result.affectedRows > 0;
  }

  // ==================== ORDERS ====================

  /**
   * Generate order number
   */
  static async generateOrderNumber() {
    const currentYear = new Date().getFullYear();

    const updateSql = `
      UPDATE bill_sequences
      SET last_number = last_number + 1
      WHERE sequence_type = 'wholesaler_order' AND current_year = ?
    `;
    const updateResult = await query(updateSql, [currentYear]);

    if (updateResult.affectedRows === 0) {
      const insertSql = `
        INSERT INTO bill_sequences (sequence_type, prefix, current_year, last_number)
        VALUES ('wholesaler_order', 'WS', ?, 1)
        ON DUPLICATE KEY UPDATE last_number = 1
      `;
      await query(insertSql, [currentYear]);
    }

    const selectSql = `
      SELECT last_number FROM bill_sequences
      WHERE sequence_type = 'wholesaler_order' AND current_year = ?
    `;
    const result = await query(selectSql, [currentYear]);
    const lastNumber = result[0]?.last_number || 1;

    return `WS-${currentYear}-${String(lastNumber).padStart(5, '0')}`;
  }

  /**
   * Get wholesaler orders
   */
  static async getOrders(wholesalerId, options = {}) {
    const { page = 1, limit = 10, payment_status, order_status } = options;
    const offset = (page - 1) * limit;
    const params = [wholesalerId];
    let whereClause = 'WHERE wo.wholesaler_id = ?';

    if (payment_status) {
      whereClause += ' AND wo.payment_status = ?';
      params.push(payment_status);
    }

    if (order_status) {
      whereClause += ' AND wo.order_status = ?';
      params.push(order_status);
    }

    const countSql = `SELECT COUNT(*) as total FROM wholesaler_orders wo ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT
        wo.*,
        w.company_name as wholesaler_name,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name,
        (SELECT COUNT(*) FROM wholesaler_order_items WHERE order_id = wo.order_id) as item_count
      FROM wholesaler_orders wo
      LEFT JOIN wholesalers w ON wo.wholesaler_id = w.wholesaler_id
      LEFT JOIN admins a ON wo.created_by = a.admin_id
      ${whereClause}
      ORDER BY wo.order_date DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const orders = await query(sql, params);

    return {
      data: orders,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId) {
    const sql = `
      SELECT
        wo.*,
        w.company_name as wholesaler_name,
        w.contact_person,
        w.phone as wholesaler_phone,
        w.discount_percentage as default_discount,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM wholesaler_orders wo
      LEFT JOIN wholesalers w ON wo.wholesaler_id = w.wholesaler_id
      LEFT JOIN admins a ON wo.created_by = a.admin_id
      WHERE wo.order_id = ?
    `;

    const results = await query(sql, [orderId]);
    return results[0] || null;
  }

  /**
   * Get order with items
   */
  static async getOrderWithItems(orderId) {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    const itemsSql = `
      SELECT
        woi.*,
        p.product_name_en as product_name,
        p.sku,
        pi.image_url as product_image
      FROM wholesaler_order_items woi
      LEFT JOIN products p ON woi.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE woi.order_id = ?
      ORDER BY woi.item_id ASC
    `;

    order.items = await query(itemsSql, [orderId]);
    return order;
  }

  /**
   * Create order
   */
  static async createOrder(wholesalerId, data) {
    const orderNumber = await this.generateOrderNumber();

    const sql = `
      INSERT INTO wholesaler_orders (
        wholesaler_id, order_number, order_date,
        subtotal, discount_amount, tax_amount, total_amount,
        order_status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      wholesalerId,
      orderNumber,
      data.order_date || new Date(),
      data.subtotal || 0,
      data.discount_amount || 0,
      data.tax_amount || 0,
      data.total_amount,
      data.order_status || 'pending',
      data.notes || null,
      data.created_by || null,
    ];

    const result = await query(sql, params);
    return await this.getOrderById(result.insertId);
  }

  /**
   * Update order
   */
  static async updateOrder(orderId, data) {
    const allowedFields = [
      'order_date', 'subtotal', 'discount_amount', 'tax_amount',
      'total_amount', 'order_status', 'payment_status', 'notes'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) return await this.getOrderById(orderId);

    params.push(orderId);
    const sql = `UPDATE wholesaler_orders SET ${updates.join(', ')} WHERE order_id = ?`;
    await query(sql, params);

    return await this.getOrderById(orderId);
  }

  /**
   * Delete order
   */
  static async deleteOrder(orderId) {
    const sql = 'DELETE FROM wholesaler_orders WHERE order_id = ?';
    const result = await query(sql, [orderId]);
    return result.affectedRows > 0;
  }

  /**
   * Add item to order
   */
  static async addOrderItem(orderId, itemData) {
    const discountPercent = itemData.discount_percent || 0;
    const totalPrice = (itemData.unit_price * itemData.quantity) * (1 - discountPercent / 100);

    const sql = `
      INSERT INTO wholesaler_order_items (
        order_id, product_id, variant_id, quantity,
        unit_price, discount_percent, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      orderId,
      itemData.product_id,
      itemData.variant_id || null,
      itemData.quantity,
      itemData.unit_price,
      discountPercent,
      totalPrice,
    ];

    const result = await query(sql, params);
    await this.recalculateOrderTotals(orderId);

    return await this.getOrderItemById(result.insertId);
  }

  /**
   * Get order item by ID
   */
  static async getOrderItemById(itemId) {
    const sql = `
      SELECT woi.*, p.product_name_en as product_name, p.sku
      FROM wholesaler_order_items woi
      LEFT JOIN products p ON woi.product_id = p.product_id
      WHERE woi.item_id = ?
    `;
    const results = await query(sql, [itemId]);
    return results[0] || null;
  }

  /**
   * Update order item
   */
  static async updateOrderItem(itemId, data) {
    const item = await this.getOrderItemById(itemId);
    if (!item) return null;

    const quantity = data.quantity ?? item.quantity;
    const unitPrice = data.unit_price ?? item.unit_price;
    const discountPercent = data.discount_percent ?? item.discount_percent;
    const totalPrice = (unitPrice * quantity) * (1 - discountPercent / 100);

    const sql = `
      UPDATE wholesaler_order_items SET
        quantity = ?, unit_price = ?, discount_percent = ?, total_price = ?
      WHERE item_id = ?
    `;

    await query(sql, [quantity, unitPrice, discountPercent, totalPrice, itemId]);
    await this.recalculateOrderTotals(item.order_id);

    return await this.getOrderItemById(itemId);
  }

  /**
   * Remove order item
   */
  static async removeOrderItem(itemId) {
    const item = await this.getOrderItemById(itemId);
    if (!item) return false;

    const sql = 'DELETE FROM wholesaler_order_items WHERE item_id = ?';
    const result = await query(sql, [itemId]);

    await this.recalculateOrderTotals(item.order_id);
    return result.affectedRows > 0;
  }

  /**
   * Recalculate order totals
   */
  static async recalculateOrderTotals(orderId) {
    const sql = `
      UPDATE wholesaler_orders SET
        subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM wholesaler_order_items WHERE order_id = ?),
        total_amount = subtotal + tax_amount - discount_amount
      WHERE order_id = ?
    `;
    await query(sql, [orderId, orderId]);
  }

  // ==================== PAYMENTS ====================

  /**
   * Record payment
   */
  static async recordPayment(wholesalerId, data) {
    const sql = `
      INSERT INTO wholesaler_payments (
        wholesaler_id, order_id, amount, payment_method,
        payment_date, reference_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      wholesalerId,
      data.order_id || null,
      data.amount,
      data.payment_method || 'cash',
      data.payment_date || new Date(),
      data.reference_number || null,
      data.notes || null,
      data.created_by || null,
    ];

    const result = await query(sql, params);
    return await this.getPaymentById(result.insertId);
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId) {
    const sql = `
      SELECT
        wp.*,
        w.company_name as wholesaler_name,
        wo.order_number,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM wholesaler_payments wp
      LEFT JOIN wholesalers w ON wp.wholesaler_id = w.wholesaler_id
      LEFT JOIN wholesaler_orders wo ON wp.order_id = wo.order_id
      LEFT JOIN admins a ON wp.created_by = a.admin_id
      WHERE wp.payment_id = ?
    `;
    const results = await query(sql, [paymentId]);
    return results[0] || null;
  }

  /**
   * Get wholesaler payments
   */
  static async getPayments(wholesalerId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM wholesaler_payments WHERE wholesaler_id = ?';
    const countResult = await query(countSql, [wholesalerId]);
    const total = countResult[0].total;

    const sql = `
      SELECT
        wp.*,
        wo.order_number,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM wholesaler_payments wp
      LEFT JOIN wholesaler_orders wo ON wp.order_id = wo.order_id
      LEFT JOIN admins a ON wp.created_by = a.admin_id
      WHERE wp.wholesaler_id = ?
      ORDER BY wp.payment_date DESC
      LIMIT ? OFFSET ?
    `;

    const payments = await query(sql, [wholesalerId, limit, offset]);

    return {
      data: payments,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get wholesaler statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT
        COUNT(*) as total_wholesalers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_wholesalers,
        COALESCE(SUM(current_balance), 0) as total_balance,
        (SELECT COALESCE(SUM(total_amount), 0) FROM wholesaler_orders) as total_sales,
        (SELECT COALESCE(SUM(amount), 0) FROM wholesaler_payments) as total_payments,
        (SELECT COUNT(*) FROM wholesaler_orders WHERE payment_status = 'unpaid') as unpaid_orders,
        (SELECT COALESCE(SUM(amount_due), 0) FROM wholesaler_orders WHERE payment_status != 'paid') as total_due
      FROM wholesalers
    `;

    const results = await query(sql);
    return results[0];
  }
}

module.exports = Wholesaler;
