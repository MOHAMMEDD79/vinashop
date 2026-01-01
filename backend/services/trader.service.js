/**
 * Trader Service
 * @module services/trader
 */

const Trader = require('../models/trader.model');

class TraderService {
  /**
   * Get all traders
   */
  static async getAll(options = {}) {
    return await Trader.getAll(options);
  }

  /**
   * Get trader by ID
   */
  static async getById(traderId) {
    const trader = await Trader.getById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }
    return trader;
  }

  /**
   * Create trader
   */
  static async create(data) {
    if (!data.company_name) {
      throw new Error('Company name is required');
    }
    return await Trader.create(data);
  }

  /**
   * Update trader
   */
  static async update(traderId, data) {
    const trader = await Trader.getById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }
    return await Trader.update(traderId, data);
  }

  /**
   * Delete trader
   */
  static async delete(traderId) {
    const trader = await Trader.getById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    if (parseFloat(trader.current_balance) > 0) {
      throw new Error('Cannot delete trader with outstanding balance');
    }

    return await Trader.delete(traderId);
  }

  // ==================== BILLS ====================

  /**
   * Get trader bills
   */
  static async getBills(traderId, options = {}) {
    const trader = await Trader.getById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }
    return await Trader.getBills(traderId, options);
  }

  /**
   * Get bill by ID
   */
  static async getBillById(billId) {
    const bill = await Trader.getBillWithItems(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }
    return bill;
  }

  /**
   * Create bill
   */
  static async createBill(traderId, data, createdBy) {
    const trader = await Trader.getById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    // Calculate totals from items if not provided
    let subtotal = parseFloat(data.subtotal) || 0;
    let totalAmount = parseFloat(data.total_amount) || 0;

    if (data.items && data.items.length > 0) {
      subtotal = data.items.reduce((sum, item) => {
        return sum + ((parseFloat(item.quantity) || 1) * (parseFloat(item.unit_cost) || 0));
      }, 0);
      totalAmount = subtotal + (parseFloat(data.tax_amount) || 0);
    }

    if (totalAmount <= 0 && subtotal <= 0) {
      throw new Error('Bill must have items with valid amounts');
    }

    const bill = await Trader.createBill(traderId, {
      ...data,
      subtotal: subtotal,
      total_amount: totalAmount,
      created_by: createdBy,
    });

    // Add items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await Trader.addBillItem(bill.bill_id, item);
      }
      return await this.getBillById(bill.bill_id);
    }

    return bill;
  }

  /**
   * Update bill
   */
  static async updateBill(billId, data) {
    const bill = await Trader.getBillById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }
    return await Trader.updateBill(billId, data);
  }

  /**
   * Delete bill
   */
  static async deleteBill(billId) {
    const bill = await Trader.getBillById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    if (parseFloat(bill.amount_paid) > 0) {
      throw new Error('Cannot delete bill with payments');
    }

    return await Trader.deleteBill(billId);
  }

  /**
   * Add item to bill
   */
  static async addBillItem(billId, itemData) {
    const bill = await Trader.getBillById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    if (!itemData.description) {
      throw new Error('Item description is required');
    }

    if (!itemData.unit_cost || itemData.unit_cost <= 0) {
      throw new Error('Valid unit cost is required');
    }

    return await Trader.addBillItem(billId, itemData);
  }

  /**
   * Update bill item
   */
  static async updateBillItem(itemId, data) {
    const item = await Trader.getBillItemById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    return await Trader.updateBillItem(itemId, data);
  }

  /**
   * Remove bill item
   */
  static async removeBillItem(itemId) {
    const item = await Trader.getBillItemById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    return await Trader.removeBillItem(itemId);
  }

  // ==================== PAYMENTS ====================

  /**
   * Record payment
   */
  static async recordPayment(traderId, data, createdBy) {
    const trader = await Trader.getById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    return await Trader.recordPayment(traderId, {
      ...data,
      created_by: createdBy,
    });
  }

  /**
   * Get trader payments
   */
  static async getPayments(traderId, options = {}) {
    const trader = await Trader.getById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }
    return await Trader.getPayments(traderId, options);
  }

  /**
   * Get trader balance
   */
  static async getBalance(traderId) {
    const trader = await Trader.getById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }
    return {
      trader_id: traderId,
      company_name: trader.company_name,
      credit_limit: parseFloat(trader.credit_limit),
      current_balance: parseFloat(trader.current_balance),
      total_purchases: parseFloat(trader.total_purchases),
      total_payments: parseFloat(trader.total_payments),
    };
  }

  /**
   * Get statistics
   */
  static async getStatistics() {
    return await Trader.getStatistics();
  }
}

module.exports = TraderService;
