/**
 * Billing Service
 * @module services/billing
 */

const Billing = require('../models/billing.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const EmailService = require('./email.service');
const PDFDocument = require('pdfkit');

class BillingService {
  // ==================== Invoices ====================

  /**
   * Get all invoices with pagination
   */
  static async getAllInvoices(options = {}) {
    return await Billing.getAllInvoices(options);
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  }

  /**
   * Get invoice by number
   */
  static async getInvoiceByNumber(invoiceNumber) {
    const invoice = await Billing.getInvoiceByNumber(invoiceNumber);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  }

  /**
   * Get invoices by user
   */
  static async getInvoicesByUser(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return await Billing.getInvoicesByUserId(userId, options);
  }

  /**
   * Create invoice
   */
  static async createInvoice(data) {
    // Validate user if provided
    if (data.user_id) {
      const user = await User.getById(data.user_id);
      if (!user) {
        throw new Error('User not found');
      }
    }

    // Generate invoice number
    const invoiceNumber = await Billing.generateInvoiceNumber();

    // Calculate totals
    let subtotal = 0;
    if (data.items && data.items.length > 0) {
      subtotal = data.items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_price),
        0
      );
    }

    const taxAmount = data.tax_rate 
      ? subtotal * (data.tax_rate / 100) 
      : (data.tax_amount || 0);
    
    const discountAmount = data.discount_amount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Create invoice
    const invoice = await Billing.createInvoice({
      ...data,
      invoice_number: invoiceNumber,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
    });

    // Add items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await Billing.addInvoiceItem(invoice.invoice_id, item);
      }
    }

    return await this.getInvoiceById(invoice.invoice_id);
  }

  /**
   * Update invoice
   */
  static async updateInvoice(invoiceId, data) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Cannot update paid invoices
    if (invoice.status === 'paid') {
      throw new Error('Cannot update paid invoice');
    }

    return await Billing.updateInvoice(invoiceId, data);
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(invoiceId) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Cannot delete paid invoices
    if (invoice.status === 'paid') {
      throw new Error('Cannot delete paid invoice');
    }

    return await Billing.deleteInvoice(invoiceId);
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(invoiceId, status) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const updatedInvoice = await Billing.updateInvoiceStatus(invoiceId, status);

    // Record payment if marked as paid
    if (status === 'paid' && invoice.status !== 'paid') {
      await Billing.createPayment({
        invoice_id: invoiceId,
        amount: invoice.total_amount,
        payment_method: 'manual',
        status: 'completed',
      });
    }

    return updatedInvoice;
  }

  /**
   * Send invoice
   */
  static async sendInvoice(invoiceId) {
    const invoice = await Billing.getInvoiceWithItems(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get user email
    let email = invoice.billing_email;
    let firstName = invoice.billing_name?.split(' ')[0] || 'Customer';

    if (invoice.user_id && !email) {
      const user = await User.getById(invoice.user_id);
      if (user) {
        email = user.email;
        firstName = user.first_name;
      }
    }

    if (!email) {
      throw new Error('No email address for invoice');
    }

    // Generate PDF
    const pdfBuffer = await this.generateInvoicePDF(invoice);

    // Send email
    await EmailService.sendInvoiceEmail(email, firstName, invoice, pdfBuffer);

    // Update status to sent
    if (invoice.status === 'draft') {
      await Billing.updateInvoiceStatus(invoiceId, 'sent');
    }

    return { success: true, sent_to: email };
  }

  /**
   * Generate invoice PDF
   */
  static async generateInvoicePDF(invoice) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(12);
      doc.text(`Invoice Number: ${invoice.invoice_number}`);
      doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`);
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`);
      doc.text(`Status: ${invoice.status.toUpperCase()}`);
      doc.moveDown();

      // Billing address
      if (invoice.billing_name) {
        doc.text('Bill To:', { underline: true });
        doc.text(invoice.billing_name);
        if (invoice.billing_address) doc.text(invoice.billing_address);
        if (invoice.billing_email) doc.text(invoice.billing_email);
        if (invoice.billing_phone) doc.text(invoice.billing_phone);
        doc.moveDown();
      }

      // Items table header
      const tableTop = doc.y;
      doc.text('Description', 50, tableTop);
      doc.text('Qty', 280, tableTop);
      doc.text('Price', 340, tableTop);
      doc.text('Total', 420, tableTop);
      doc.moveDown();

      // Draw line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Items
      if (invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          const y = doc.y;
          doc.text(item.description || item.product_name, 50, y, { width: 220 });
          doc.text(item.quantity.toString(), 280, y);
          doc.text(`$${parseFloat(item.unit_price).toFixed(2)}`, 340, y);
          doc.text(`$${(item.quantity * item.unit_price).toFixed(2)}`, 420, y);
          doc.moveDown();
        }
      }

      // Draw line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Totals
      const totalsX = 350;
      doc.text('Subtotal:', totalsX);
      doc.text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 420, doc.y - 12);
      
      if (invoice.tax_amount > 0) {
        doc.text('Tax:', totalsX);
        doc.text(`$${parseFloat(invoice.tax_amount).toFixed(2)}`, 420, doc.y - 12);
      }

      if (invoice.discount_amount > 0) {
        doc.text('Discount:', totalsX);
        doc.text(`-$${parseFloat(invoice.discount_amount).toFixed(2)}`, 420, doc.y - 12);
      }

      doc.moveDown(0.5);
      doc.fontSize(14).text('Total:', totalsX);
      doc.text(`$${parseFloat(invoice.total_amount).toFixed(2)}`, 420, doc.y - 14);

      // Notes
      if (invoice.notes) {
        doc.moveDown(2);
        doc.fontSize(10).text('Notes:', { underline: true });
        doc.text(invoice.notes);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10).text('Thank you for your business!', { align: 'center' });

      doc.end();
    });
  }

  // ==================== Invoice Items ====================

  /**
   * Get invoice items
   */
  static async getInvoiceItems(invoiceId) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return await Billing.getInvoiceItems(invoiceId);
  }

  /**
   * Add invoice item
   */
  static async addInvoiceItem(invoiceId, itemData) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot modify paid invoice');
    }

    const item = await Billing.addInvoiceItem(invoiceId, itemData);
    await this.recalculateInvoiceTotals(invoiceId);

    return item;
  }

  /**
   * Update invoice item
   */
  static async updateInvoiceItem(invoiceId, itemId, itemData) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot modify paid invoice');
    }

    const item = await Billing.updateInvoiceItem(itemId, itemData);
    await this.recalculateInvoiceTotals(invoiceId);

    return item;
  }

  /**
   * Delete invoice item
   */
  static async deleteInvoiceItem(invoiceId, itemId) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot modify paid invoice');
    }

    await Billing.deleteInvoiceItem(itemId);
    await this.recalculateInvoiceTotals(invoiceId);

    return true;
  }

  /**
   * Recalculate invoice totals
   */
  static async recalculateInvoiceTotals(invoiceId) {
    const items = await Billing.getInvoiceItems(invoiceId);
    const invoice = await Billing.getInvoiceById(invoiceId);

    const subtotal = items.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price),
      0
    );

    const taxAmount = invoice.tax_rate 
      ? subtotal * (invoice.tax_rate / 100) 
      : invoice.tax_amount;

    const totalAmount = subtotal + taxAmount - (invoice.discount_amount || 0);

    await Billing.updateInvoice(invoiceId, {
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    });
  }

  // ==================== Payments ====================

  /**
   * Get all payments
   */
  static async getAllPayments(options = {}) {
    return await Billing.getAllPayments(options);
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId) {
    const payment = await Billing.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }

  /**
   * Get payments by invoice
   */
  static async getPaymentsByInvoice(invoiceId) {
    const invoice = await Billing.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return await Billing.getPaymentsByInvoiceId(invoiceId);
  }

  /**
   * Create payment
   */
  static async createPayment(data) {
    // Validate invoice if provided
    if (data.invoice_id) {
      const invoice = await Billing.getInvoiceById(data.invoice_id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
    }

    const payment = await Billing.createPayment(data);

    // Update invoice status if fully paid
    if (data.invoice_id && data.status === 'completed') {
      const invoice = await Billing.getInvoiceById(data.invoice_id);
      const payments = await Billing.getPaymentsByInvoiceId(data.invoice_id);
      
      const totalPaid = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      if (totalPaid >= invoice.total_amount) {
        await Billing.updateInvoiceStatus(data.invoice_id, 'paid');
      }
    }

    return payment;
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(paymentId, status) {
    const payment = await Billing.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    return await Billing.updatePaymentStatus(paymentId, status);
  }

  // ==================== Transactions ====================

  /**
   * Get all transactions
   */
  static async getAllTransactions(options = {}) {
    return await Billing.getAllTransactions(options);
  }

  /**
   * Get transactions by user
   */
  static async getTransactionsByUser(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return await Billing.getTransactionsByUserId(userId, options);
  }

  /**
   * Create transaction
   */
  static async createTransaction(data) {
    return await Billing.createTransaction(data);
  }

  // ==================== Admin Traders ====================

  /**
   * Get all admin traders
   */
  static async getAllTraders(options = {}) {
    return await Billing.getAllTraders(options);
  }

  /**
   * Get trader by ID
   */
  static async getTraderById(traderId) {
    const trader = await Billing.getTraderById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }
    return trader;
  }

  /**
   * Create trader
   */
  static async createTrader(data) {
    // Check if user exists
    if (data.user_id) {
      const user = await User.getById(data.user_id);
      if (!user) {
        throw new Error('User not found');
      }
    }

    return await Billing.createTrader(data);
  }

  /**
   * Update trader
   */
  static async updateTrader(traderId, data) {
    const trader = await Billing.getTraderById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    return await Billing.updateTrader(traderId, data);
  }

  /**
   * Delete trader
   */
  static async deleteTrader(traderId) {
    const trader = await Billing.getTraderById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    return await Billing.deleteTrader(traderId);
  }

  /**
   * Get trader balance
   */
  static async getTraderBalance(traderId) {
    const trader = await Billing.getTraderById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    return {
      trader_id: traderId,
      balance: trader.balance || 0,
      credit_limit: trader.credit_limit || 0,
      available_credit: (trader.credit_limit || 0) - (trader.balance || 0),
    };
  }

  /**
   * Update trader balance
   */
  static async updateTraderBalance(traderId, amount, operation = 'add') {
    const trader = await Billing.getTraderById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    const currentBalance = parseFloat(trader.balance || 0);
    let newBalance;

    if (operation === 'add') {
      newBalance = currentBalance + amount;
    } else if (operation === 'subtract') {
      newBalance = currentBalance - amount;
    } else if (operation === 'set') {
      newBalance = amount;
    } else {
      throw new Error('Invalid operation');
    }

    // Check credit limit
    if (trader.credit_limit && newBalance > trader.credit_limit) {
      throw new Error('Balance exceeds credit limit');
    }

    await Billing.updateTraderBalance(traderId, newBalance);

    // Record transaction
    await Billing.createTraderTransaction({
      trader_id: traderId,
      amount,
      type: operation === 'subtract' ? 'payment' : 'charge',
      balance_after: newBalance,
    });

    return { balance: newBalance };
  }

  /**
   * Get trader invoices
   */
  static async getTraderInvoices(traderId, options = {}) {
    const trader = await Billing.getTraderById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    return await Billing.getTraderInvoices(traderId, options);
  }

  // ==================== Statistics & Reports ====================

  /**
   * Get billing statistics
   */
  static async getStatistics(options = {}) {
    return await Billing.getStatistics(options);
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStatistics() {
    return await Billing.getInvoiceStatistics();
  }

  /**
   * Get overdue invoices
   */
  static async getOverdueInvoices(options = {}) {
    return await Billing.getOverdueInvoices(options);
  }

  /**
   * Mark overdue invoices
   */
  static async markOverdueInvoices() {
    return await Billing.markOverdueInvoices();
  }

  /**
   * Get revenue report
   */
  static async getRevenueReport(options = {}) {
    const { date_from, date_to } = options;
    
    const invoices = await Billing.getAllInvoices({
      date_from,
      date_to,
      status: 'paid',
    });

    const payments = await Billing.getAllPayments({
      date_from,
      date_to,
      status: 'completed',
    });

    const totalInvoiced = invoices.data?.reduce(
      (sum, inv) => sum + parseFloat(inv.total_amount),
      0
    ) || 0;

    const totalPaid = payments.data?.reduce(
      (sum, pay) => sum + parseFloat(pay.amount),
      0
    ) || 0;

    return {
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      invoice_count: invoices.total || 0,
      payment_count: payments.total || 0,
      period: { date_from, date_to },
    };
  }

  // ==================== Export ====================

  /**
   * Export invoices
   */
  static async exportInvoices(options = {}) {
    return await Billing.getAllInvoicesForExport(options);
  }
}

module.exports = BillingService;