/**
 * Trader Model
 * @module models/trader
 */

const { query } = require('../config/database');

/**
 * Trader Model - Handles trader/supplier database operations
 */
class Trader {
  /**
   * Get all traders with pagination
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
      whereClause += ' AND (t.company_name LIKE ? OR t.contact_person LIKE ? OR t.phone LIKE ? OR t.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM traders t ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const allowedSorts = ['trader_id', 'company_name', 'current_balance', 'status', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `t.${sort}` : 't.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        t.*,
        (SELECT COUNT(*) FROM trader_bills WHERE trader_id = t.trader_id) as bill_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM trader_bills WHERE trader_id = t.trader_id) as total_purchases,
        (SELECT COALESCE(SUM(amount), 0) FROM trader_payments WHERE trader_id = t.trader_id) as total_payments
      FROM traders t
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const traders = await query(sql, params);

    return {
      data: traders,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get trader by ID
   */
  static async getById(traderId) {
    const sql = `
      SELECT
        t.*,
        (SELECT COUNT(*) FROM trader_bills WHERE trader_id = t.trader_id) as bill_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM trader_bills WHERE trader_id = t.trader_id) as total_purchases,
        (SELECT COALESCE(SUM(amount), 0) FROM trader_payments WHERE trader_id = t.trader_id) as total_payments
      FROM traders t
      WHERE t.trader_id = ?
    `;

    const results = await query(sql, [traderId]);
    return results[0] || null;
  }

  /**
   * Create trader
   */
  static async create(data) {
    const sql = `
      INSERT INTO traders (
        company_name, contact_person, phone, email, address,
        tax_number, payment_terms, credit_limit, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.company_name,
      data.contact_person || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.tax_number || null,
      data.payment_terms || 30,
      data.credit_limit || 0,
      data.status || 'active',
      data.notes || null,
    ];

    const result = await query(sql, params);
    return await this.getById(result.insertId);
  }

  /**
   * Update trader
   */
  static async update(traderId, data) {
    const allowedFields = [
      'company_name', 'contact_person', 'phone', 'email', 'address',
      'tax_number', 'payment_terms', 'credit_limit', 'status', 'notes'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) return await this.getById(traderId);

    params.push(traderId);
    const sql = `UPDATE traders SET ${updates.join(', ')} WHERE trader_id = ?`;
    await query(sql, params);

    return await this.getById(traderId);
  }

  /**
   * Delete trader
   */
  static async delete(traderId) {
    const sql = 'DELETE FROM traders WHERE trader_id = ?';
    const result = await query(sql, [traderId]);
    return result.affectedRows > 0;
  }

  // ==================== BILLS ====================

  /**
   * Get trader bills
   */
  static async getBills(traderId, options = {}) {
    const { page = 1, limit = 10, payment_status } = options;
    const offset = (page - 1) * limit;
    const params = [traderId];
    let whereClause = 'WHERE tb.trader_id = ?';

    if (payment_status) {
      whereClause += ' AND tb.payment_status = ?';
      params.push(payment_status);
    }

    const countSql = `SELECT COUNT(*) as total FROM trader_bills tb ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT
        tb.*,
        t.company_name as trader_name,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name,
        (SELECT COUNT(*) FROM trader_bill_items WHERE bill_id = tb.bill_id) as item_count
      FROM trader_bills tb
      LEFT JOIN traders t ON tb.trader_id = t.trader_id
      LEFT JOIN admins a ON tb.created_by = a.admin_id
      ${whereClause}
      ORDER BY tb.bill_date DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const bills = await query(sql, params);

    return {
      data: bills,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get bill by ID
   */
  static async getBillById(billId) {
    const sql = `
      SELECT
        tb.*,
        t.company_name as trader_name,
        t.contact_person,
        t.phone as trader_phone,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM trader_bills tb
      LEFT JOIN traders t ON tb.trader_id = t.trader_id
      LEFT JOIN admins a ON tb.created_by = a.admin_id
      WHERE tb.bill_id = ?
    `;

    const results = await query(sql, [billId]);
    return results[0] || null;
  }

  /**
   * Get bill with items
   */
  static async getBillWithItems(billId) {
    const bill = await this.getBillById(billId);
    if (!bill) return null;

    const itemsSql = `
      SELECT tbi.*, p.product_name_en as product_name
      FROM trader_bill_items tbi
      LEFT JOIN products p ON tbi.product_id = p.product_id
      WHERE tbi.bill_id = ?
      ORDER BY tbi.item_id ASC
    `;

    bill.items = await query(itemsSql, [billId]);
    return bill;
  }

  /**
   * Generate bill number (TRD-YYYY-XXXXX)
   */
  static async generateBillNumber() {
    const currentYear = new Date().getFullYear();
    const prefix = 'TRD';

    // Get the last bill number for this year
    const sql = `
      SELECT bill_number FROM trader_bills
      WHERE bill_number LIKE ?
      ORDER BY bill_id DESC LIMIT 1
    `;
    const results = await query(sql, [`${prefix}-${currentYear}-%`]);

    let nextNumber = 1;
    if (results.length > 0) {
      const lastNumber = results[0].bill_number;
      const match = lastNumber.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${currentYear}-${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Create bill
   */
  static async createBill(traderId, data) {
    // Auto-generate bill number if not provided
    const billNumber = data.bill_number || await this.generateBillNumber();

    const sql = `
      INSERT INTO trader_bills (
        trader_id, bill_number, bill_date, due_date,
        subtotal, tax_amount, total_amount, bill_image, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      traderId,
      billNumber,
      data.bill_date || new Date(),
      data.due_date || null,
      parseFloat(data.subtotal) || 0,
      parseFloat(data.tax_amount) || 0,
      parseFloat(data.total_amount) || 0,
      data.bill_image || null,
      data.notes || null,
      data.created_by || null,
    ];

    const result = await query(sql, params);
    return await this.getBillById(result.insertId);
  }

  /**
   * Update bill
   */
  static async updateBill(billId, data) {
    const allowedFields = [
      'bill_number', 'bill_date', 'due_date', 'subtotal',
      'tax_amount', 'total_amount', 'bill_image', 'notes'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) return await this.getBillById(billId);

    params.push(billId);
    const sql = `UPDATE trader_bills SET ${updates.join(', ')} WHERE bill_id = ?`;
    await query(sql, params);

    return await this.getBillById(billId);
  }

  /**
   * Delete bill
   */
  static async deleteBill(billId) {
    const sql = 'DELETE FROM trader_bills WHERE bill_id = ?';
    const result = await query(sql, [billId]);
    return result.affectedRows > 0;
  }

  /**
   * Add item to bill
   */
  static async addBillItem(billId, itemData) {
    const sql = `
      INSERT INTO trader_bill_items (
        bill_id, product_id, description, quantity, unit_cost, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const totalCost = itemData.unit_cost * itemData.quantity;
    const params = [
      billId,
      itemData.product_id || null,
      itemData.description,
      itemData.quantity,
      itemData.unit_cost,
      totalCost,
    ];

    const result = await query(sql, params);

    // Recalculate bill totals
    await this.recalculateBillTotals(billId);

    return await this.getBillItemById(result.insertId);
  }

  /**
   * Get bill item by ID
   */
  static async getBillItemById(itemId) {
    const sql = `
      SELECT tbi.*, p.product_name_en as product_name
      FROM trader_bill_items tbi
      LEFT JOIN products p ON tbi.product_id = p.product_id
      WHERE tbi.item_id = ?
    `;
    const results = await query(sql, [itemId]);
    return results[0] || null;
  }

  /**
   * Update bill item
   */
  static async updateBillItem(itemId, data) {
    const item = await this.getBillItemById(itemId);
    if (!item) return null;

    const quantity = data.quantity ?? item.quantity;
    const unitCost = data.unit_cost ?? item.unit_cost;
    const totalCost = quantity * unitCost;

    const sql = `
      UPDATE trader_bill_items SET
        description = ?, quantity = ?, unit_cost = ?, total_cost = ?
      WHERE item_id = ?
    `;

    await query(sql, [
      data.description ?? item.description,
      quantity,
      unitCost,
      totalCost,
      itemId,
    ]);

    await this.recalculateBillTotals(item.bill_id);
    return await this.getBillItemById(itemId);
  }

  /**
   * Remove bill item
   */
  static async removeBillItem(itemId) {
    const item = await this.getBillItemById(itemId);
    if (!item) return false;

    const sql = 'DELETE FROM trader_bill_items WHERE item_id = ?';
    const result = await query(sql, [itemId]);

    await this.recalculateBillTotals(item.bill_id);
    return result.affectedRows > 0;
  }

  /**
   * Recalculate bill totals
   */
  static async recalculateBillTotals(billId) {
    const sql = `
      UPDATE trader_bills SET
        subtotal = (SELECT COALESCE(SUM(total_cost), 0) FROM trader_bill_items WHERE bill_id = ?),
        total_amount = subtotal + tax_amount
      WHERE bill_id = ?
    `;
    await query(sql, [billId, billId]);
  }

  // ==================== PAYMENTS ====================

  /**
   * Record payment
   */
  static async recordPayment(traderId, data) {
    const sql = `
      INSERT INTO trader_payments (
        trader_id, bill_id, amount, payment_method,
        payment_date, reference_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      traderId,
      data.bill_id || null,
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
        tp.*,
        t.company_name as trader_name,
        tb.bill_number,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM trader_payments tp
      LEFT JOIN traders t ON tp.trader_id = t.trader_id
      LEFT JOIN trader_bills tb ON tp.bill_id = tb.bill_id
      LEFT JOIN admins a ON tp.created_by = a.admin_id
      WHERE tp.payment_id = ?
    `;
    const results = await query(sql, [paymentId]);
    return results[0] || null;
  }

  /**
   * Get trader payments
   */
  static async getPayments(traderId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM trader_payments WHERE trader_id = ?';
    const countResult = await query(countSql, [traderId]);
    const total = countResult[0].total;

    const sql = `
      SELECT
        tp.*,
        tb.bill_number,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM trader_payments tp
      LEFT JOIN trader_bills tb ON tp.bill_id = tb.bill_id
      LEFT JOIN admins a ON tp.created_by = a.admin_id
      WHERE tp.trader_id = ?
      ORDER BY tp.payment_date DESC
      LIMIT ? OFFSET ?
    `;

    const payments = await query(sql, [traderId, limit, offset]);

    return {
      data: payments,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get trader statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT
        COUNT(*) as total_traders,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_traders,
        COALESCE(SUM(current_balance), 0) as total_balance,
        (SELECT COALESCE(SUM(total_amount), 0) FROM trader_bills) as total_purchases,
        (SELECT COALESCE(SUM(amount), 0) FROM trader_payments) as total_payments,
        (SELECT COUNT(*) FROM trader_bills WHERE payment_status = 'unpaid') as unpaid_bills,
        (SELECT COALESCE(SUM(amount_due), 0) FROM trader_bills WHERE payment_status != 'paid') as total_due
      FROM traders
    `;

    const results = await query(sql);
    return results[0];
  }
}

module.exports = Trader;
