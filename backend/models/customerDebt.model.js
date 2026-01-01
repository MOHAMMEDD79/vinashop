/**
 * Customer Debt Model
 * @module models/customerDebt
 */

const { query } = require('../config/database');

/**
 * Customer Debt Model - Handles customer debt database operations
 */
class CustomerDebt {
  /**
   * Get all customer debts with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      user_id,
      date_from,
      date_to,
      min_amount,
      max_amount,
      overdue_only,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (cd.customer_name LIKE ? OR cd.customer_phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND cd.status = ?';
      params.push(status);
    }

    if (user_id) {
      whereClause += ' AND cd.user_id = ?';
      params.push(user_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(cd.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(cd.created_at) <= ?';
      params.push(date_to);
    }

    if (min_amount) {
      whereClause += ' AND cd.remaining_debt >= ?';
      params.push(min_amount);
    }

    if (max_amount) {
      whereClause += ' AND cd.remaining_debt <= ?';
      params.push(max_amount);
    }

    if (overdue_only) {
      whereClause += ' AND cd.due_date < CURDATE() AND cd.status != "settled"';
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM customer_debts cd
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['debt_id', 'total_debt', 'remaining_debt', 'status', 'due_date', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `cd.${sort}` : 'cd.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        cd.*,
        cd.customer_name,
        cd.customer_phone,
        cb.bill_number,
        o.order_number,
        (SELECT COUNT(*) FROM debt_payments WHERE debt_id = cd.debt_id) as payment_count,
        CASE WHEN cd.due_date < CURDATE() AND cd.status != 'settled' THEN 1 ELSE 0 END as is_overdue
      FROM customer_debts cd
      LEFT JOIN customer_bills cb ON cd.bill_id = cb.bill_id
      LEFT JOIN orders o ON cd.order_id = o.order_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const debts = await query(sql, params);

    return {
      data: debts,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer debt by ID
   */
  static async getById(debtId) {
    const sql = `
      SELECT
        cd.*,
        cd.customer_name,
        cd.customer_phone,
        cb.bill_number,
        o.order_number,
        CASE WHEN cd.due_date < CURDATE() AND cd.status != 'settled' THEN 1 ELSE 0 END as is_overdue
      FROM customer_debts cd
      LEFT JOIN customer_bills cb ON cd.bill_id = cb.bill_id
      LEFT JOIN orders o ON cd.order_id = o.order_id
      WHERE cd.debt_id = ?
    `;

    const results = await query(sql, [debtId]);
    return results[0] || null;
  }

  /**
   * Get debt with payment history
   */
  static async getWithPayments(debtId) {
    const debt = await this.getById(debtId);
    if (!debt) return null;

    const paymentsSql = `
      SELECT
        dp.*,
        NULL as recorded_by_name
      FROM debt_payments dp
      WHERE dp.debt_id = ?
      ORDER BY dp.payment_date DESC
    `;

    debt.payments = await query(paymentsSql, [debtId]);
    return debt;
  }

  /**
   * Get debts by user ID
   */
  static async getByUserId(userId, options = {}) {
    return await this.getAll({ ...options, user_id: userId });
  }

  /**
   * Get user debt summary (by user_id from debts table)
   */
  static async getUserDebtSummary(userId) {
    const sql = `
      SELECT
        cd.user_id,
        cd.customer_name as full_name,
        cd.customer_phone as phone_number,
        COUNT(cd.debt_id) as total_debts,
        COALESCE(SUM(cd.total_debt), 0) as total_debt_amount,
        COALESCE(SUM(cd.amount_paid), 0) as total_paid,
        COALESCE(SUM(cd.remaining_debt), 0) as total_remaining,
        COUNT(CASE WHEN cd.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN cd.status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN cd.status = 'settled' THEN 1 END) as settled_count,
        COUNT(CASE WHEN cd.due_date < CURDATE() AND cd.status != 'settled' THEN 1 END) as overdue_count,
        0 as total_orders
      FROM customer_debts cd
      WHERE cd.user_id = ?
      GROUP BY cd.user_id, cd.customer_name, cd.customer_phone
    `;

    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  /**
   * Create new customer debt
   */
  static async create(data) {
    const sql = `
      INSERT INTO customer_debts (
        user_id, bill_id, order_id, customer_name, customer_phone,
        total_debt, amount_paid, status, due_date, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.user_id || null,
      data.bill_id || null,
      data.order_id || null,
      data.customer_name || null,
      data.customer_phone || null,
      data.total_debt,
      data.amount_paid || 0,
      data.status || 'pending',
      data.due_date || null,
      data.notes || null,
      data.created_by || null,
    ];

    const result = await query(sql, params);
    return await this.getById(result.insertId);
  }

  /**
   * Update customer debt
   */
  static async update(debtId, data) {
    const allowedFields = [
      'total_debt', 'amount_paid', 'status', 'due_date', 'notes',
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
      return await this.getById(debtId);
    }

    params.push(debtId);
    const sql = `UPDATE customer_debts SET ${updates.join(', ')} WHERE debt_id = ?`;
    await query(sql, params);

    return await this.getById(debtId);
  }

  /**
   * Delete customer debt
   */
  static async delete(debtId) {
    const sql = 'DELETE FROM customer_debts WHERE debt_id = ?';
    const result = await query(sql, [debtId]);
    return result.affectedRows > 0;
  }

  /**
   * Record debt payment
   */
  static async recordPayment(debtId, paymentData) {
    const sql = `
      INSERT INTO debt_payments (
        debt_id, user_id, amount, payment_method,
        payment_date, receipt_number, notes, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      debtId,
      paymentData.user_id,
      paymentData.amount,
      paymentData.payment_method || 'cash',
      paymentData.payment_date || new Date(),
      paymentData.receipt_number || null,
      paymentData.notes || null,
      paymentData.recorded_by,
    ];

    const result = await query(sql, params);

    // The trigger will automatically update the debt status
    // Return the payment record
    return await this.getPaymentById(result.insertId);
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId) {
    const sql = `
      SELECT
        dp.*,
        NULL as recorded_by_name
      FROM debt_payments dp
      WHERE dp.payment_id = ?
    `;
    const results = await query(sql, [paymentId]);
    return results[0] || null;
  }

  /**
   * Get payments for a debt
   */
  static async getPayments(debtId) {
    const sql = `
      SELECT
        dp.*,
        NULL as recorded_by_name
      FROM debt_payments dp
      WHERE dp.debt_id = ?
      ORDER BY dp.payment_date DESC
    `;
    return await query(sql, [debtId]);
  }

  /**
   * Get overdue debts
   */
  static async getOverdue(options = {}) {
    return await this.getAll({ ...options, overdue_only: true });
  }

  /**
   * Get debt statistics
   */
  static async getStatistics(options = {}) {
    const { date_from, date_to } = options;
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
        COUNT(*) as total_debts,
        COUNT(DISTINCT user_id) as total_customers,
        COALESCE(SUM(total_debt), 0) as total_debt_amount,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(remaining_debt), 0) as total_remaining,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_count,
        COUNT(CASE WHEN due_date < CURDATE() AND status != 'settled' THEN 1 END) as overdue_count,
        COALESCE(SUM(CASE WHEN due_date < CURDATE() AND status != 'settled' THEN remaining_debt ELSE 0 END), 0) as overdue_amount
      FROM customer_debts
      ${whereClause}
    `;

    const results = await query(sql, params);
    return results[0];
  }

  /**
   * Get customers with debt summary (grouped by customer_name/phone from debts table)
   */
  static async getCustomersWithDebt(options = {}) {
    const { page = 1, limit = 10, min_debt = 0 } = options;
    const offset = (page - 1) * limit;

    const countSql = `
      SELECT COUNT(DISTINCT CONCAT(COALESCE(customer_name,''), COALESCE(customer_phone,''))) as total
      FROM customer_debts
      WHERE remaining_debt > ?
    `;
    const countResult = await query(countSql, [min_debt]);
    const total = countResult[0].total;

    const sql = `
      SELECT
        cd.user_id,
        cd.customer_name as full_name,
        cd.customer_phone as phone_number,
        COUNT(cd.debt_id) as debt_count,
        COALESCE(SUM(cd.total_debt), 0) as total_debt,
        COALESCE(SUM(cd.amount_paid), 0) as total_paid,
        COALESCE(SUM(cd.remaining_debt), 0) as remaining_debt,
        COUNT(CASE WHEN cd.due_date < CURDATE() AND cd.status != 'settled' THEN 1 END) as overdue_count,
        0 as total_orders,
        0 as total_purchases
      FROM customer_debts cd
      WHERE cd.remaining_debt > 0
      GROUP BY cd.user_id, cd.customer_name, cd.customer_phone
      HAVING remaining_debt > ?
      ORDER BY remaining_debt DESC
      LIMIT ? OFFSET ?
    `;

    const customers = await query(sql, [min_debt, limit, offset]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = CustomerDebt;
