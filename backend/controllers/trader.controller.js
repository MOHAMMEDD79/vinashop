/**
 * Trader Controller
 * @module controllers/trader
 */

const traderService = require('../services/trader.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Format trader for response
 */
const formatTrader = (trader) => {
  if (!trader) return null;
  return {
    id: trader.trader_id,
    traderId: trader.trader_id,
    trader_id: trader.trader_id,
    companyName: trader.company_name,
    company_name: trader.company_name,
    contactPerson: trader.contact_person,
    contact_person: trader.contact_person,
    phone: trader.phone,
    email: trader.email,
    address: trader.address,
    taxNumber: trader.tax_number,
    tax_number: trader.tax_number,
    paymentTerms: trader.payment_terms,
    payment_terms: trader.payment_terms,
    creditLimit: parseFloat(trader.credit_limit) || 0,
    credit_limit: parseFloat(trader.credit_limit) || 0,
    currentBalance: parseFloat(trader.current_balance) || 0,
    current_balance: parseFloat(trader.current_balance) || 0,
    status: trader.status,
    notes: trader.notes,
    billCount: trader.bill_count,
    bill_count: trader.bill_count,
    totalPurchases: parseFloat(trader.total_purchases) || 0,
    total_purchases: parseFloat(trader.total_purchases) || 0,
    totalPayments: parseFloat(trader.total_payments) || 0,
    total_payments: parseFloat(trader.total_payments) || 0,
    createdAt: trader.created_at,
    created_at: trader.created_at,
    updatedAt: trader.updated_at,
    updated_at: trader.updated_at,
  };
};

/**
 * Format bill for response
 */
const formatBill = (bill) => {
  if (!bill) return null;
  return {
    id: bill.bill_id,
    billId: bill.bill_id,
    bill_id: bill.bill_id,
    traderId: bill.trader_id,
    trader_id: bill.trader_id,
    traderName: bill.trader_name,
    trader_name: bill.trader_name,
    billNumber: bill.bill_number,
    bill_number: bill.bill_number,
    billDate: bill.bill_date,
    bill_date: bill.bill_date,
    dueDate: bill.due_date,
    due_date: bill.due_date,
    subtotal: parseFloat(bill.subtotal) || 0,
    taxAmount: parseFloat(bill.tax_amount) || 0,
    tax_amount: parseFloat(bill.tax_amount) || 0,
    totalAmount: parseFloat(bill.total_amount) || 0,
    total_amount: parseFloat(bill.total_amount) || 0,
    amountPaid: parseFloat(bill.amount_paid) || 0,
    amount_paid: parseFloat(bill.amount_paid) || 0,
    amountDue: parseFloat(bill.amount_due) || 0,
    amount_due: parseFloat(bill.amount_due) || 0,
    paymentStatus: bill.payment_status,
    payment_status: bill.payment_status,
    billImage: bill.bill_image,
    bill_image: bill.bill_image,
    notes: bill.notes,
    itemCount: bill.item_count,
    item_count: bill.item_count,
    createdBy: bill.created_by,
    created_by: bill.created_by,
    createdByName: bill.created_by_name,
    created_by_name: bill.created_by_name,
    items: bill.items ? bill.items.map(formatBillItem) : undefined,
    createdAt: bill.created_at,
    created_at: bill.created_at,
  };
};

/**
 * Format bill item
 */
const formatBillItem = (item) => {
  if (!item) return null;
  return {
    id: item.item_id,
    itemId: item.item_id,
    item_id: item.item_id,
    billId: item.bill_id,
    bill_id: item.bill_id,
    productId: item.product_id,
    product_id: item.product_id,
    productName: item.product_name,
    product_name: item.product_name,
    description: item.description,
    quantity: item.quantity,
    unitCost: parseFloat(item.unit_cost) || 0,
    unit_cost: parseFloat(item.unit_cost) || 0,
    totalCost: parseFloat(item.total_cost) || 0,
    total_cost: parseFloat(item.total_cost) || 0,
  };
};

/**
 * Format payment
 */
const formatPayment = (payment) => {
  if (!payment) return null;
  return {
    id: payment.payment_id,
    paymentId: payment.payment_id,
    payment_id: payment.payment_id,
    traderId: payment.trader_id,
    trader_id: payment.trader_id,
    traderName: payment.trader_name,
    trader_name: payment.trader_name,
    billId: payment.bill_id,
    bill_id: payment.bill_id,
    billNumber: payment.bill_number,
    bill_number: payment.bill_number,
    amount: parseFloat(payment.amount) || 0,
    paymentMethod: payment.payment_method,
    payment_method: payment.payment_method,
    paymentDate: payment.payment_date,
    payment_date: payment.payment_date,
    referenceNumber: payment.reference_number,
    reference_number: payment.reference_number,
    notes: payment.notes,
    createdBy: payment.created_by,
    created_by: payment.created_by,
    createdByName: payment.created_by_name,
    created_by_name: payment.created_by_name,
    createdAt: payment.created_at,
    created_at: payment.created_at,
  };
};

class TraderController {
  /**
   * Get all traders
   */
  static async getAll(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        status: req.query.status,
        sort: req.query.sort,
        order: req.query.order,
      };

      const result = await traderService.getAll(options);
      return successResponse(res, result.data.map(formatTrader), 'Traders retrieved', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get trader by ID
   */
  static async getById(req, res) {
    try {
      const trader = await traderService.getById(req.params.id);
      return successResponse(res, formatTrader(trader), 'Trader retrieved');
    } catch (error) {
      const status = error.message === 'Trader not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Create trader
   */
  static async create(req, res) {
    try {
      const data = {
        company_name: req.body.company_name || req.body.companyName,
        contact_person: req.body.contact_person || req.body.contactPerson,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address,
        tax_number: req.body.tax_number || req.body.taxNumber,
        payment_terms: req.body.payment_terms || req.body.paymentTerms,
        credit_limit: req.body.credit_limit || req.body.creditLimit,
        status: req.body.status,
        notes: req.body.notes,
      };

      const trader = await traderService.create(data);
      return successResponse(res, formatTrader(trader), 'Trader created', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Update trader
   */
  static async update(req, res) {
    try {
      const data = {
        company_name: req.body.company_name || req.body.companyName,
        contact_person: req.body.contact_person || req.body.contactPerson,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address,
        tax_number: req.body.tax_number || req.body.taxNumber,
        payment_terms: req.body.payment_terms || req.body.paymentTerms,
        credit_limit: req.body.credit_limit || req.body.creditLimit,
        status: req.body.status,
        notes: req.body.notes,
      };

      const trader = await traderService.update(req.params.id, data);
      return successResponse(res, formatTrader(trader), 'Trader updated');
    } catch (error) {
      const status = error.message === 'Trader not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Delete trader
   */
  static async remove(req, res) {
    try {
      await traderService.delete(req.params.id);
      return successResponse(res, null, 'Trader deleted');
    } catch (error) {
      const status = error.message === 'Trader not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  // ==================== BILLS ====================

  /**
   * Get trader bills
   */
  static async getBills(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        payment_status: req.query.payment_status || req.query.paymentStatus,
      };

      const result = await traderService.getBills(req.params.id, options);
      return successResponse(res, result.data.map(formatBill), 'Bills retrieved', 200, result.pagination);
    } catch (error) {
      const status = error.message === 'Trader not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get bill by ID
   */
  static async getBillById(req, res) {
    try {
      const bill = await traderService.getBillById(req.params.billId);
      return successResponse(res, formatBill(bill), 'Bill retrieved');
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Create bill
   */
  static async createBill(req, res) {
    try {
      const data = {
        bill_number: req.body.bill_number || req.body.billNumber,
        bill_date: req.body.bill_date || req.body.billDate,
        due_date: req.body.due_date || req.body.dueDate,
        subtotal: req.body.subtotal,
        tax_amount: req.body.tax_amount || req.body.taxAmount,
        total_amount: req.body.total_amount || req.body.totalAmount,
        bill_image: req.body.bill_image || req.body.billImage,
        notes: req.body.notes,
        items: req.body.items,
      };

      const adminId = req.admin?.adminId || req.admin?.admin_id;
      const bill = await traderService.createBill(req.params.id, data, adminId);
      return successResponse(res, formatBill(bill), 'Bill created', 201);
    } catch (error) {
      const status = error.message === 'Trader not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Update bill
   */
  static async updateBill(req, res) {
    try {
      const data = {
        bill_number: req.body.bill_number || req.body.billNumber,
        bill_date: req.body.bill_date || req.body.billDate,
        due_date: req.body.due_date || req.body.dueDate,
        subtotal: req.body.subtotal,
        tax_amount: req.body.tax_amount || req.body.taxAmount,
        total_amount: req.body.total_amount || req.body.totalAmount,
        bill_image: req.body.bill_image || req.body.billImage,
        notes: req.body.notes,
      };

      const bill = await traderService.updateBill(req.params.billId, data);
      return successResponse(res, formatBill(bill), 'Bill updated');
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Delete bill
   */
  static async deleteBill(req, res) {
    try {
      await traderService.deleteBill(req.params.billId);
      return successResponse(res, null, 'Bill deleted');
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Add bill item
   */
  static async addBillItem(req, res) {
    try {
      const itemData = {
        product_id: req.body.product_id || req.body.productId,
        description: req.body.description,
        quantity: req.body.quantity || 1,
        unit_cost: req.body.unit_cost || req.body.unitCost,
      };

      const item = await traderService.addBillItem(req.params.billId, itemData);
      return successResponse(res, formatBillItem(item), 'Item added', 201);
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  // ==================== PAYMENTS ====================

  /**
   * Record payment
   */
  static async recordPayment(req, res) {
    try {
      const data = {
        bill_id: req.body.bill_id || req.body.billId,
        amount: req.body.amount,
        payment_method: req.body.payment_method || req.body.paymentMethod,
        payment_date: req.body.payment_date || req.body.paymentDate,
        reference_number: req.body.reference_number || req.body.referenceNumber,
        notes: req.body.notes,
      };

      const adminId = req.admin?.adminId || req.admin?.admin_id;
      const payment = await traderService.recordPayment(req.params.id, data, adminId);
      return successResponse(res, formatPayment(payment), 'Payment recorded');
    } catch (error) {
      const status = error.message === 'Trader not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get trader payments
   */
  static async getPayments(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await traderService.getPayments(req.params.id, options);
      return successResponse(res, result.data.map(formatPayment), 'Payments retrieved', 200, result.pagination);
    } catch (error) {
      const status = error.message === 'Trader not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get trader balance
   */
  static async getBalance(req, res) {
    try {
      const balance = await traderService.getBalance(req.params.id);
      return successResponse(res, balance, 'Balance retrieved');
    } catch (error) {
      const status = error.message === 'Trader not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get statistics
   */
  static async getStatistics(req, res) {
    try {
      const stats = await traderService.getStatistics();
      return successResponse(res, stats, 'Statistics retrieved');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = TraderController;
