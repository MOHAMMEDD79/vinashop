/**
 * Customer Bill Service
 * @module services/customerBill
 */

const CustomerBill = require('../models/customerBill.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');

class CustomerBillService {
  /**
   * Get all customer bills with pagination
   */
  static async getAll(options = {}) {
    return await CustomerBill.getAll(options);
  }

  /**
   * Get customer bill by ID
   */
  static async getById(billId) {
    const bill = await CustomerBill.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }
    return bill;
  }

  /**
   * Get customer bill with items
   */
  static async getWithItems(billId) {
    const bill = await CustomerBill.getWithItems(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }
    return bill;
  }

  /**
   * Get bills by user ID
   */
  static async getByUserId(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return await CustomerBill.getByUserId(userId, options);
  }

  /**
   * Create new customer bill
   */
  static async create(data, createdBy) {
    // Validate user
    if (data.user_id) {
      const user = await User.getById(data.user_id);
      if (!user) {
        throw new Error('User not found');
      }
    }

    // Validate order if provided
    if (data.order_id) {
      const order = await Order.getById(data.order_id);
      if (!order) {
        throw new Error('Order not found');
      }
    }

    // Create bill
    const bill = await CustomerBill.create({
      ...data,
      created_by: createdBy,
    });

    // Add items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await CustomerBill.addItem(bill.bill_id, item);
      }
      // Refresh bill with items
      return await this.getWithItems(bill.bill_id);
    }

    return bill;
  }

  /**
   * Update customer bill
   */
  static async update(billId, data) {
    const bill = await CustomerBill.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    // Validate user if changing
    if (data.user_id && data.user_id !== bill.user_id) {
      const user = await User.getById(data.user_id);
      if (!user) {
        throw new Error('User not found');
      }
    }

    return await CustomerBill.update(billId, data);
  }

  /**
   * Delete customer bill
   */
  static async delete(billId) {
    const bill = await CustomerBill.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    return await CustomerBill.delete(billId);
  }

  /**
   * Add item to bill
   */
  static async addItem(billId, itemData) {
    const bill = await CustomerBill.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    if (!itemData.description) {
      throw new Error('Item description is required');
    }

    if (!itemData.unit_price || itemData.unit_price <= 0) {
      throw new Error('Valid unit price is required');
    }

    return await CustomerBill.addItem(billId, itemData);
  }

  /**
   * Update bill item
   */
  static async updateItem(billId, itemId, data) {
    const bill = await CustomerBill.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    const item = await CustomerBill.getItemById(itemId);
    if (!item || item.bill_id !== billId) {
      throw new Error('Item not found');
    }

    return await CustomerBill.updateItem(itemId, data);
  }

  /**
   * Remove item from bill
   */
  static async removeItem(billId, itemId) {
    const bill = await CustomerBill.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    const item = await CustomerBill.getItemById(itemId);
    if (!item || item.bill_id !== billId) {
      throw new Error('Item not found');
    }

    return await CustomerBill.removeItem(itemId);
  }

  /**
   * Record payment on bill
   */
  static async recordPayment(billId, amount, recordedBy) {
    const bill = await CustomerBill.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    const amountDue = parseFloat(bill.total_amount) - parseFloat(bill.amount_paid);
    if (amount > amountDue) {
      throw new Error(`Payment amount cannot exceed amount due (${amountDue})`);
    }

    return await CustomerBill.recordPayment(billId, amount);
  }

  /**
   * Get print data for bill
   */
  static async getPrintData(billId) {
    const bill = await CustomerBill.getPrintData(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }
    return bill;
  }

  /**
   * Get bill statistics
   */
  static async getStatistics(options = {}) {
    return await CustomerBill.getStatistics(options);
  }

  /**
   * Create bill from order
   */
  static async createFromOrder(orderId, createdBy) {
    const order = await Order.getWithItems(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Create bill data from order
    const billData = {
      user_id: order.user_id,
      order_id: orderId,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount || 0,
      discount_amount: order.discount_amount || 0,
      total_amount: order.total_amount,
      notes: `Generated from order ${order.order_number}`,
      items: (order.items || []).map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        description: item.product_name || `Product #${item.product_id}`,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: 0,
      })),
    };

    return await this.create(billData, createdBy);
  }
}

module.exports = CustomerBillService;
