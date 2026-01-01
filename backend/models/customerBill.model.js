/**
 * Customer Bill Model
 * @module models/customerBill
 */

const { query } = require('../config/database');

/**
 * Customer Bill Model - Handles customer bill database operations
 */
class CustomerBill {
  /**
   * Get all customer bills with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      payment_status,
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
      whereClause += ' AND (cb.bill_number LIKE ? OR cb.customer_name LIKE ? OR cb.customer_phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (payment_status) {
      whereClause += ' AND cb.payment_status = ?';
      params.push(payment_status);
    }

    if (user_id) {
      whereClause += ' AND cb.user_id = ?';
      params.push(user_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(cb.bill_date) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(cb.bill_date) <= ?';
      params.push(date_to);
    }

    if (min_amount) {
      whereClause += ' AND cb.total_amount >= ?';
      params.push(min_amount);
    }

    if (max_amount) {
      whereClause += ' AND cb.total_amount <= ?';
      params.push(max_amount);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM customer_bills cb
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['bill_id', 'bill_number', 'total_amount', 'amount_paid', 'amount_due', 'payment_status', 'bill_date', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `cb.${sort}` : 'cb.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        cb.*,
        cb.customer_name,
        cb.customer_phone,
        o.order_number,
        NULL as created_by_name,
        (SELECT COUNT(*) FROM customer_bill_items WHERE bill_id = cb.bill_id) as item_count
      FROM customer_bills cb
      LEFT JOIN orders o ON cb.order_id = o.order_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const bills = await query(sql, params);

    return {
      data: bills,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer bill by ID
   */
  static async getById(billId) {
    const sql = `
      SELECT
        cb.*,
        cb.customer_name,
        cb.customer_phone,
        o.order_number,
        NULL as created_by_name
      FROM customer_bills cb
      LEFT JOIN orders o ON cb.order_id = o.order_id
      WHERE cb.bill_id = ?
    `;

    const results = await query(sql, [billId]);
    return results[0] || null;
  }

  /**
   * Get customer bill with items
   */
  static async getWithItems(billId) {
    const bill = await this.getById(billId);
    if (!bill) return null;

    const itemsSql = `
      SELECT
        cbi.*,
        p.product_name_en,
        p.product_name_ar,
        p.product_name_en as product_name,
        p.sku,
        pi.image_url as product_image
      FROM customer_bill_items cbi
      LEFT JOIN products p ON cbi.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE cbi.bill_id = ?
      ORDER BY cbi.item_id ASC
    `;

    bill.items = await query(itemsSql, [billId]);
    return bill;
  }

  /**
   * Get bills by user ID
   */
  static async getByUserId(userId, options = {}) {
    return await this.getAll({ ...options, user_id: userId });
  }

  /**
   * Generate bill number (BILL-YYYY-XXXXX)
   */
  static async generateBillNumber() {
    const currentYear = new Date().getFullYear();

    // Get and increment sequence
    const updateSql = `
      UPDATE bill_sequences
      SET last_number = last_number + 1
      WHERE sequence_type = 'customer_bill' AND current_year = ?
    `;
    const updateResult = await query(updateSql, [currentYear]);

    // If no row was updated, insert new row for this year
    if (updateResult.affectedRows === 0) {
      const insertSql = `
        INSERT INTO bill_sequences (sequence_type, prefix, current_year, last_number)
        VALUES ('customer_bill', 'BILL', ?, 1)
        ON DUPLICATE KEY UPDATE last_number = 1
      `;
      await query(insertSql, [currentYear]);
    }

    // Get the current number
    const selectSql = `
      SELECT last_number
      FROM bill_sequences
      WHERE sequence_type = 'customer_bill' AND current_year = ?
    `;
    const result = await query(selectSql, [currentYear]);
    const lastNumber = result[0]?.last_number || 1;

    return `BILL-${currentYear}-${String(lastNumber).padStart(5, '0')}`;
  }

  /**
   * Create new customer bill
   */
  static async create(data) {
    const billNumber = await this.generateBillNumber();

    // Calculate total if not provided
    const subtotal = parseFloat(data.subtotal) || 0;
    const taxAmount = parseFloat(data.tax_amount) || 0;
    const discountAmount = parseFloat(data.discount_amount) || 0;
    const totalAmount = data.total_amount !== undefined ? parseFloat(data.total_amount) : (subtotal + taxAmount - discountAmount);

    const sql = `
      INSERT INTO customer_bills (
        user_id, order_id, bill_number, bill_date,
        customer_name, customer_phone,
        subtotal, tax_amount, discount_amount, total_amount,
        amount_paid, payment_status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // created_by is NOT NULL in database, must have a value
    if (!data.created_by) {
      throw new Error('created_by is required');
    }

    const params = [
      data.user_id || null,
      data.order_id || null,
      billNumber,
      data.bill_date || new Date(),
      data.customer_name || null,
      data.customer_phone || null,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      parseFloat(data.amount_paid) || 0,
      data.payment_status || 'unpaid',
      data.notes || null,
      data.created_by,
    ];

    const result = await query(sql, params);
    return await this.getById(result.insertId);
  }

  /**
   * Update customer bill
   */
  static async update(billId, data) {
    const allowedFields = [
      'user_id', 'order_id', 'bill_date', 'subtotal',
      'tax_amount', 'discount_amount', 'total_amount',
      'amount_paid', 'payment_status', 'notes',
      'customer_name', 'customer_phone'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return await this.getById(billId);
    }

    params.push(billId);
    const sql = `UPDATE customer_bills SET ${updates.join(', ')} WHERE bill_id = ?`;
    await query(sql, params);

    return await this.getById(billId);
  }

  /**
   * Delete customer bill
   */
  static async delete(billId) {
    const sql = 'DELETE FROM customer_bills WHERE bill_id = ?';
    const result = await query(sql, [billId]);
    return result.affectedRows > 0;
  }

  /**
   * Add item to bill
   */
  static async addItem(billId, itemData) {
    const sql = `
      INSERT INTO customer_bill_items (
        bill_id, product_id, variant_id, description,
        quantity, unit_price, discount_percent, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const quantity = parseInt(itemData.quantity) || 1;
    const unitPrice = parseFloat(itemData.unit_price) || 0;
    const discountPercent = parseFloat(itemData.discount_percent) || 0;
    const totalPrice = itemData.total_price !== undefined
      ? parseFloat(itemData.total_price)
      : (unitPrice * quantity) * (1 - discountPercent / 100);

    const params = [
      billId,
      itemData.product_id || null,
      itemData.variant_id || null,
      itemData.description || 'Item',
      quantity,
      unitPrice,
      discountPercent,
      totalPrice,
    ];

    const result = await query(sql, params);

    // Recalculate bill totals
    await this.recalculateTotals(billId);

    return await this.getItemById(result.insertId);
  }

  /**
   * Get bill item by ID
   */
  static async getItemById(itemId) {
    const sql = `
      SELECT cbi.*, p.product_name_en as product_name
      FROM customer_bill_items cbi
      LEFT JOIN products p ON cbi.product_id = p.product_id
      WHERE cbi.item_id = ?
    `;
    const results = await query(sql, [itemId]);
    return results[0] || null;
  }

  /**
   * Update bill item
   */
  static async updateItem(itemId, data) {
    const allowedFields = ['description', 'quantity', 'unit_price', 'discount_percent'];
    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    // Recalculate total_price if quantity or price changed
    if (data.quantity !== undefined || data.unit_price !== undefined || data.discount_percent !== undefined) {
      const item = await this.getItemById(itemId);
      const quantity = data.quantity ?? item.quantity;
      const unitPrice = data.unit_price ?? item.unit_price;
      const discountPercent = data.discount_percent ?? item.discount_percent;
      const totalPrice = (unitPrice * quantity) * (1 - discountPercent / 100);
      updates.push('total_price = ?');
      params.push(totalPrice);
    }

    if (updates.length === 0) {
      return await this.getItemById(itemId);
    }

    params.push(itemId);
    const sql = `UPDATE customer_bill_items SET ${updates.join(', ')} WHERE item_id = ?`;
    await query(sql, params);

    // Get bill_id and recalculate totals
    const item = await this.getItemById(itemId);
    if (item) {
      await this.recalculateTotals(item.bill_id);
    }

    return item;
  }

  /**
   * Remove item from bill
   */
  static async removeItem(itemId) {
    // Get bill_id before deleting
    const item = await this.getItemById(itemId);
    if (!item) return false;

    const sql = 'DELETE FROM customer_bill_items WHERE item_id = ?';
    const result = await query(sql, [itemId]);

    // Recalculate bill totals
    await this.recalculateTotals(item.bill_id);

    return result.affectedRows > 0;
  }

  /**
   * Recalculate bill totals
   */
  static async recalculateTotals(billId) {
    const sql = `
      UPDATE customer_bills cb
      SET subtotal = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM customer_bill_items
        WHERE bill_id = ?
      ),
      total_amount = subtotal + tax_amount - discount_amount
      WHERE bill_id = ?
    `;
    await query(sql, [billId, billId]);
  }

  /**
   * Record payment
   */
  static async recordPayment(billId, amount) {
    const bill = await this.getById(billId);
    if (!bill) return null;

    const newAmountPaid = parseFloat(bill.amount_paid) + parseFloat(amount);
    let newStatus = 'partial';

    if (newAmountPaid >= parseFloat(bill.total_amount)) {
      newStatus = 'paid';
    } else if (newAmountPaid <= 0) {
      newStatus = 'unpaid';
    }

    const sql = `
      UPDATE customer_bills
      SET amount_paid = ?, payment_status = ?
      WHERE bill_id = ?
    `;
    await query(sql, [newAmountPaid, newStatus, billId]);

    return await this.getById(billId);
  }

  /**
   * Get bill statistics
   */
  static async getStatistics(options = {}) {
    const { date_from, date_to } = options;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date_from) {
      whereClause += ' AND DATE(bill_date) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(bill_date) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT
        COUNT(*) as total_bills,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(amount_due), 0) as total_due,
        COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_count,
        COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
        COALESCE(SUM(CASE WHEN payment_status = 'unpaid' THEN total_amount ELSE 0 END), 0) as unpaid_amount,
        COALESCE(SUM(CASE WHEN payment_status = 'partial' THEN amount_due ELSE 0 END), 0) as partial_amount
      FROM customer_bills
      ${whereClause}
    `;

    const results = await query(sql, params);
    return results[0];
  }

  /**
   * Get print data for bill
   */
  static async getPrintData(billId) {
    const bill = await this.getWithItems(billId);
    if (!bill) return null;

    // Get user address
    const addressSql = `
      SELECT * FROM user_addresses
      WHERE user_id = ? AND is_default = 1
      LIMIT 1
    `;
    const addresses = await query(addressSql, [bill.user_id]);
    bill.customer_address = addresses[0] || null;

    return bill;
  }
}

module.exports = CustomerBill;
