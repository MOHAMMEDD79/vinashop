/**
 * Billing Model
 * @module models/billing
 */

const { query } = require('../config/database');

/**
 * Billing Model - Handles invoices, payments, transactions, and billing for customers and admin-traders
 */
class Billing {
  // ==================== Invoices ====================

  /**
   * Get all invoices with pagination
   */
  static async getAllInvoices(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type,
      user_id,
      admin_trader_id,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (i.invoice_number LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    if (type) {
      whereClause += ' AND i.invoice_type = ?';
      params.push(type);
    }

    if (user_id) {
      whereClause += ' AND i.user_id = ?';
      params.push(user_id);
    }

    if (admin_trader_id) {
      whereClause += ' AND i.admin_trader_id = ?';
      params.push(admin_trader_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(i.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(i.created_at) <= ?';
      params.push(date_to);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.user_id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['invoice_id', 'invoice_number', 'total_amount', 'status', 'created_at', 'due_date'];
    const sortColumn = allowedSorts.includes(sort) ? `i.${sort}` : 'i.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        i.*,
        u.username,
        u.email as user_email,
        u.first_name,
        u.last_name,
        at.business_name as trader_name
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.user_id
      LEFT JOIN admin_traders at ON i.admin_trader_id = at.trader_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const invoices = await query(sql, params);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId) {
    const sql = `
      SELECT 
        i.*,
        u.username,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.phone as user_phone,
        u.address as user_address,
        at.business_name as trader_name,
        at.contact_email as trader_email
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.user_id
      LEFT JOIN admin_traders at ON i.admin_trader_id = at.trader_id
      WHERE i.invoice_id = ?
    `;

    const results = await query(sql, [invoiceId]);
    return results[0] || null;
  }

  /**
   * Get invoice by number
   */
  static async getInvoiceByNumber(invoiceNumber) {
    const sql = `
      SELECT 
        i.*,
        u.username,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.user_id
      WHERE i.invoice_number = ?
    `;

    const results = await query(sql, [invoiceNumber]);
    return results[0] || null;
  }

  /**
   * Generate invoice number
   */
  static async generateInvoiceNumber(prefix = 'INV') {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const sql = `
      SELECT invoice_number FROM invoices 
      WHERE invoice_number LIKE ?
      ORDER BY invoice_id DESC LIMIT 1
    `;

    const results = await query(sql, [`${prefix}-${year}${month}-%`]);

    let sequence = 1;
    if (results.length > 0) {
      const lastNumber = results[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-').pop());
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}${month}-${String(sequence).padStart(5, '0')}`;
  }

  /**
   * Create invoice
   */
  static async createInvoice(data) {
    const {
      invoice_number,
      invoice_type = 'customer',
      user_id,
      admin_trader_id,
      order_id,
      subtotal,
      tax_amount = 0,
      discount_amount = 0,
      shipping_amount = 0,
      total_amount,
      currency = 'ILS',
      status = 'pending',
      due_date,
      notes,
      billing_address,
      created_by,
    } = data;

    const sql = `
      INSERT INTO invoices (
        invoice_number,
        invoice_type,
        user_id,
        admin_trader_id,
        order_id,
        subtotal,
        tax_amount,
        discount_amount,
        shipping_amount,
        total_amount,
        currency,
        status,
        due_date,
        notes,
        billing_address,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      invoice_number,
      invoice_type,
      user_id || null,
      admin_trader_id || null,
      order_id || null,
      subtotal,
      tax_amount,
      discount_amount,
      shipping_amount,
      total_amount,
      currency,
      status,
      due_date || null,
      notes || null,
      billing_address ? JSON.stringify(billing_address) : null,
      created_by || null,
    ]);

    return await this.getInvoiceById(result.insertId);
  }

  /**
   * Update invoice
   */
  static async updateInvoice(invoiceId, data) {
    const allowedFields = [
      'subtotal',
      'tax_amount',
      'discount_amount',
      'shipping_amount',
      'total_amount',
      'status',
      'due_date',
      'paid_date',
      'notes',
      'billing_address',
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        if (key === 'billing_address' && typeof value === 'object') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getInvoiceById(invoiceId);
    }

    updates.push('updated_at = NOW()');
    values.push(invoiceId);

    const sql = `UPDATE invoices SET ${updates.join(', ')} WHERE invoice_id = ?`;
    await query(sql, values);

    return await this.getInvoiceById(invoiceId);
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(invoiceId, status, paidDate = null) {
    let sql = 'UPDATE invoices SET status = ?, updated_at = NOW()';
    const params = [status];

    if (status === 'paid' && paidDate) {
      sql += ', paid_date = ?';
      params.push(paidDate);
    } else if (status === 'paid') {
      sql += ', paid_date = NOW()';
    }

    sql += ' WHERE invoice_id = ?';
    params.push(invoiceId);

    await query(sql, params);
    return await this.getInvoiceById(invoiceId);
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(invoiceId) {
    // Delete invoice items first
    await query('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

    const sql = 'DELETE FROM invoices WHERE invoice_id = ?';
    const result = await query(sql, [invoiceId]);
    return result.affectedRows > 0;
  }

  /**
   * Get invoices by user
   */
  static async getInvoicesByUser(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    const params = [userId];

    let whereClause = 'WHERE i.user_id = ?';

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM invoices i ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT i.* FROM invoices i
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const invoices = await query(sql, params);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== Invoice Items ====================

  /**
   * Get invoice items
   */
  static async getInvoiceItems(invoiceId) {
    const sql = `
      SELECT 
        ii.*,
        p.product_name_en,
        p.product_name_ar,
        p.product_name_he
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.product_id
      WHERE ii.invoice_id = ?
      ORDER BY ii.item_id ASC
    `;

    return await query(sql, [invoiceId]);
  }

  /**
   * Add invoice item
   */
  static async addInvoiceItem(data) {
    const {
      invoice_id,
      product_id,
      description,
      quantity,
      unit_price,
      discount = 0,
      tax = 0,
      total,
    } = data;

    const sql = `
      INSERT INTO invoice_items (
        invoice_id,
        product_id,
        description,
        quantity,
        unit_price,
        discount,
        tax,
        total,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      invoice_id,
      product_id || null,
      description,
      quantity,
      unit_price,
      discount,
      tax,
      total,
    ]);

    return result.insertId;
  }

  /**
   * Update invoice item
   */
  static async updateInvoiceItem(itemId, data) {
    const allowedFields = ['description', 'quantity', 'unit_price', 'discount', 'tax', 'total'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return false;
    }

    values.push(itemId);
    const sql = `UPDATE invoice_items SET ${updates.join(', ')} WHERE item_id = ?`;
    const result = await query(sql, values);

    return result.affectedRows > 0;
  }

  /**
   * Delete invoice item
   */
  static async deleteInvoiceItem(itemId) {
    const sql = 'DELETE FROM invoice_items WHERE item_id = ?';
    const result = await query(sql, [itemId]);
    return result.affectedRows > 0;
  }

  // ==================== Payments ====================

  /**
   * Get all payments with pagination
   */
  static async getAllPayments(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      payment_method,
      invoice_id,
      user_id,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (p.transaction_id LIKE ? OR p.reference_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (payment_method) {
      whereClause += ' AND p.payment_method = ?';
      params.push(payment_method);
    }

    if (invoice_id) {
      whereClause += ' AND p.invoice_id = ?';
      params.push(invoice_id);
    }

    if (user_id) {
      whereClause += ' AND p.user_id = ?';
      params.push(user_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(p.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(p.created_at) <= ?';
      params.push(date_to);
    }

    const countSql = `SELECT COUNT(*) as total FROM payments p ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const allowedSorts = ['payment_id', 'amount', 'status', 'payment_method', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `p.${sort}` : 'p.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        p.*,
        i.invoice_number,
        u.username,
        u.email as user_email
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
      LEFT JOIN users u ON p.user_id = u.user_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const payments = await query(sql, params);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId) {
    const sql = `
      SELECT 
        p.*,
        i.invoice_number,
        i.total_amount as invoice_total,
        u.username,
        u.email as user_email
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.payment_id = ?
    `;

    const results = await query(sql, [paymentId]);
    return results[0] || null;
  }

  /**
   * Create payment
   */
  static async createPayment(data) {
    const {
      invoice_id,
      user_id,
      order_id,
      amount,
      currency = 'ILS',
      payment_method,
      transaction_id,
      reference_number,
      status = 'pending',
      payment_details,
      created_by,
    } = data;

    const sql = `
      INSERT INTO payments (
        invoice_id,
        user_id,
        order_id,
        amount,
        currency,
        payment_method,
        transaction_id,
        reference_number,
        status,
        payment_details,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      invoice_id || null,
      user_id || null,
      order_id || null,
      amount,
      currency,
      payment_method,
      transaction_id || null,
      reference_number || null,
      status,
      payment_details ? JSON.stringify(payment_details) : null,
      created_by || null,
    ]);

    return await this.getPaymentById(result.insertId);
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(paymentId, status, transactionId = null) {
    let sql = 'UPDATE payments SET status = ?, updated_at = NOW()';
    const params = [status];

    if (transactionId) {
      sql += ', transaction_id = ?';
      params.push(transactionId);
    }

    if (status === 'completed') {
      sql += ', completed_at = NOW()';
    }

    sql += ' WHERE payment_id = ?';
    params.push(paymentId);

    await query(sql, params);
    return await this.getPaymentById(paymentId);
  }

  /**
   * Get payments by invoice
   */
  static async getPaymentsByInvoice(invoiceId) {
    const sql = `
      SELECT * FROM payments
      WHERE invoice_id = ?
      ORDER BY created_at DESC
    `;

    return await query(sql, [invoiceId]);
  }

  /**
   * Get payments by user
   */
  static async getPaymentsByUser(userId, limit = 10) {
    const sql = `
      SELECT 
        p.*,
        i.invoice_number
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    return await query(sql, [userId, limit]);
  }

  // ==================== Transactions (Ledger) ====================

  /**
   * Get all transactions with pagination
   */
  static async getAllTransactions(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      user_id,
      admin_trader_id,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (t.reference_number LIKE ? OR t.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (type) {
      whereClause += ' AND t.transaction_type = ?';
      params.push(type);
    }

    if (user_id) {
      whereClause += ' AND t.user_id = ?';
      params.push(user_id);
    }

    if (admin_trader_id) {
      whereClause += ' AND t.admin_trader_id = ?';
      params.push(admin_trader_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(t.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(t.created_at) <= ?';
      params.push(date_to);
    }

    const countSql = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const allowedSorts = ['transaction_id', 'amount', 'transaction_type', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `t.${sort}` : 't.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        t.*,
        u.username,
        u.email as user_email,
        at.business_name as trader_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN admin_traders at ON t.admin_trader_id = at.trader_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const transactions = await query(sql, params);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create transaction record
   */
  static async createTransaction(data) {
    const {
      user_id,
      admin_trader_id,
      invoice_id,
      payment_id,
      order_id,
      transaction_type,
      amount,
      currency = 'ILS',
      balance_before,
      balance_after,
      description,
      reference_number,
      created_by,
    } = data;

    const sql = `
      INSERT INTO transactions (
        user_id,
        admin_trader_id,
        invoice_id,
        payment_id,
        order_id,
        transaction_type,
        amount,
        currency,
        balance_before,
        balance_after,
        description,
        reference_number,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      user_id || null,
      admin_trader_id || null,
      invoice_id || null,
      payment_id || null,
      order_id || null,
      transaction_type,
      amount,
      currency,
      balance_before || 0,
      balance_after || 0,
      description || null,
      reference_number || null,
      created_by || null,
    ]);

    return result.insertId;
  }

  /**
   * Get transactions by user
   */
  static async getTransactionsByUser(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
    const countResult = await query(countSql, [userId]);
    const total = countResult[0].total;

    const sql = `
      SELECT * FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const transactions = await query(sql, [userId, limit, offset]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== Admin Traders ====================

  /**
   * Get all admin traders
   */
  static async getAllTraders(options = {}) {
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
      whereClause += ' AND (business_name LIKE ? OR contact_email LIKE ? OR contact_phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM admin_traders ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT * FROM admin_traders
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const traders = await query(sql, params);

    return {
      data: traders,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get trader by ID
   */
  static async getTraderById(traderId) {
    const sql = 'SELECT * FROM admin_traders WHERE trader_id = ?';
    const results = await query(sql, [traderId]);
    return results[0] || null;
  }

  /**
   * Create admin trader
   */
  static async createTrader(data) {
    const {
      admin_id,
      business_name,
      contact_email,
      contact_phone,
      address,
      tax_number,
      credit_limit = 0,
      current_balance = 0,
      status = 'active',
      notes,
      created_by,
    } = data;

    const sql = `
      INSERT INTO admin_traders (
        admin_id,
        business_name,
        contact_email,
        contact_phone,
        address,
        tax_number,
        credit_limit,
        current_balance,
        status,
        notes,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      admin_id || null,
      business_name,
      contact_email || null,
      contact_phone || null,
      address || null,
      tax_number || null,
      credit_limit,
      current_balance,
      status,
      notes || null,
      created_by || null,
    ]);

    return await this.getTraderById(result.insertId);
  }

  /**
   * Update trader
   */
  static async updateTrader(traderId, data) {
    const allowedFields = [
      'business_name',
      'contact_email',
      'contact_phone',
      'address',
      'tax_number',
      'credit_limit',
      'current_balance',
      'status',
      'notes',
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
      return await this.getTraderById(traderId);
    }

    updates.push('updated_at = NOW()');
    values.push(traderId);

    const sql = `UPDATE admin_traders SET ${updates.join(', ')} WHERE trader_id = ?`;
    await query(sql, values);

    return await this.getTraderById(traderId);
  }

  /**
   * Update trader balance
   */
  static async updateTraderBalance(traderId, amount, operation = 'add') {
    const operator = operation === 'add' ? '+' : '-';

    const sql = `
      UPDATE admin_traders 
      SET current_balance = current_balance ${operator} ?, updated_at = NOW()
      WHERE trader_id = ?
    `;

    await query(sql, [Math.abs(amount), traderId]);
    return await this.getTraderById(traderId);
  }

  /**
   * Get trader balance
   */
  static async getTraderBalance(traderId) {
    const sql = 'SELECT current_balance, credit_limit FROM admin_traders WHERE trader_id = ?';
    const results = await query(sql, [traderId]);

    if (results.length === 0) {
      return null;
    }

    return {
      current_balance: results[0].current_balance,
      credit_limit: results[0].credit_limit,
      available_credit: results[0].credit_limit - results[0].current_balance,
    };
  }

  // ==================== Statistics ====================

  /**
   * Get billing statistics
   */
  static async getStatistics(options = {}) {
    const { period = 'month' } = options;

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

    const invoiceStats = await query(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invoices,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_invoices,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_invoices,
        COALESCE(SUM(total_amount), 0) as total_invoiced,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as total_pending
      FROM invoices
      WHERE 1=1 ${dateFilter}
    `);

    const paymentStats = await query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_received
      FROM payments
      WHERE 1=1 ${dateFilter}
    `);

    const traderStats = await query(`
      SELECT 
        COUNT(*) as total_traders,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_traders,
        COALESCE(SUM(current_balance), 0) as total_outstanding,
        COALESCE(SUM(credit_limit), 0) as total_credit_limit
      FROM admin_traders
    `);

    return {
      invoices: invoiceStats[0],
      payments: paymentStats[0],
      traders: traderStats[0],
    };
  }

  /**
   * Get revenue report
   */
  static async getRevenueReport(options = {}) {
    const { date_from, date_to, group_by = 'day' } = options;

    let dateFormat = '%Y-%m-%d';
    if (group_by === 'week') {
      dateFormat = '%Y-%u';
    } else if (group_by === 'month') {
      dateFormat = '%Y-%m';
    } else if (group_by === 'year') {
      dateFormat = '%Y';
    }

    let whereClause = "WHERE status = 'paid'";
    const params = [];

    if (date_from) {
      whereClause += ' AND DATE(paid_date) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(paid_date) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT 
        DATE_FORMAT(paid_date, '${dateFormat}') as period,
        COUNT(*) as invoice_count,
        SUM(total_amount) as revenue,
        SUM(tax_amount) as tax_collected,
        SUM(discount_amount) as discounts_given
      FROM invoices
      ${whereClause}
      GROUP BY DATE_FORMAT(paid_date, '${dateFormat}')
      ORDER BY period ASC
    `;

    return await query(sql, params);
  }

  /**
   * Get overdue invoices
   */
  static async getOverdueInvoices() {
    const sql = `
      SELECT 
        i.*,
        u.username,
        u.email as user_email,
        DATEDIFF(NOW(), i.due_date) as days_overdue
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.user_id
      WHERE i.status = 'pending' AND i.due_date < CURDATE()
      ORDER BY i.due_date ASC
    `;

    return await query(sql);
  }

  /**
   * Mark overdue invoices
   */
  static async markOverdueInvoices() {
    const sql = `
      UPDATE invoices 
      SET status = 'overdue', updated_at = NOW()
      WHERE status = 'pending' AND due_date < CURDATE()
    `;

    const result = await query(sql);
    return result.affectedRows;
  }
}

module.exports = Billing;