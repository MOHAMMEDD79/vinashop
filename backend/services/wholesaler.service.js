/**
 * Wholesaler Service
 * @module services/wholesaler
 */

const Wholesaler = require('../models/wholesaler.model');
const Product = require('../models/product.model');

class WholesalerService {
  /**
   * Get all wholesalers
   */
  static async getAll(options = {}) {
    return await Wholesaler.getAll(options);
  }

  /**
   * Get wholesaler by ID
   */
  static async getById(wholesalerId) {
    const wholesaler = await Wholesaler.getById(wholesalerId);
    if (!wholesaler) {
      throw new Error('Wholesaler not found');
    }
    return wholesaler;
  }

  /**
   * Create wholesaler
   */
  static async create(data) {
    if (!data.company_name) {
      throw new Error('Company name is required');
    }
    return await Wholesaler.create(data);
  }

  /**
   * Update wholesaler
   */
  static async update(wholesalerId, data) {
    const wholesaler = await Wholesaler.getById(wholesalerId);
    if (!wholesaler) {
      throw new Error('Wholesaler not found');
    }
    return await Wholesaler.update(wholesalerId, data);
  }

  /**
   * Delete wholesaler
   */
  static async delete(wholesalerId) {
    const wholesaler = await Wholesaler.getById(wholesalerId);
    if (!wholesaler) {
      throw new Error('Wholesaler not found');
    }

    if (parseFloat(wholesaler.current_balance) > 0) {
      throw new Error('Cannot delete wholesaler with outstanding balance');
    }

    return await Wholesaler.delete(wholesalerId);
  }

  // ==================== ORDERS ====================

  /**
   * Get wholesaler orders
   */
  static async getOrders(wholesalerId, options = {}) {
    const wholesaler = await Wholesaler.getById(wholesalerId);
    if (!wholesaler) {
      throw new Error('Wholesaler not found');
    }
    return await Wholesaler.getOrders(wholesalerId, options);
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId) {
    const order = await Wholesaler.getOrderWithItems(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  /**
   * Create order
   */
  static async createOrder(wholesalerId, data, createdBy) {
    const wholesaler = await Wholesaler.getById(wholesalerId);
    if (!wholesaler) {
      throw new Error('Wholesaler not found');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // Calculate totals from items
    let subtotal = 0;
    for (const item of data.items) {
      if (!item.product_id) {
        throw new Error('Product ID is required for each item');
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Valid quantity is required for each item');
      }
      if (!item.unit_price || item.unit_price <= 0) {
        throw new Error('Valid unit price is required for each item');
      }

      const discountPercent = item.discount_percent || wholesaler.discount_percentage || 0;
      const itemTotal = (item.unit_price * item.quantity) * (1 - discountPercent / 100);
      subtotal += itemTotal;
    }

    const discountAmount = data.discount_amount || 0;
    const taxAmount = data.tax_amount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Create order
    const order = await Wholesaler.createOrder(wholesalerId, {
      ...data,
      subtotal,
      total_amount: totalAmount,
      created_by: createdBy,
    });

    // Add items
    for (const item of data.items) {
      await Wholesaler.addOrderItem(order.order_id, {
        ...item,
        discount_percent: item.discount_percent || wholesaler.discount_percentage || 0,
      });
    }

    return await this.getOrderById(order.order_id);
  }

  /**
   * Update order
   */
  static async updateOrder(orderId, data) {
    const order = await Wholesaler.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    return await Wholesaler.updateOrder(orderId, data);
  }

  /**
   * Delete order
   */
  static async deleteOrder(orderId) {
    const order = await Wholesaler.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (parseFloat(order.amount_paid) > 0) {
      throw new Error('Cannot delete order with payments');
    }

    return await Wholesaler.deleteOrder(orderId);
  }

  /**
   * Add item to order
   */
  static async addOrderItem(orderId, itemData) {
    const order = await Wholesaler.getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!itemData.product_id) {
      throw new Error('Product ID is required');
    }

    if (!itemData.quantity || itemData.quantity <= 0) {
      throw new Error('Valid quantity is required');
    }

    if (!itemData.unit_price || itemData.unit_price <= 0) {
      throw new Error('Valid unit price is required');
    }

    return await Wholesaler.addOrderItem(orderId, itemData);
  }

  /**
   * Update order item
   */
  static async updateOrderItem(itemId, data) {
    const item = await Wholesaler.getOrderItemById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    return await Wholesaler.updateOrderItem(itemId, data);
  }

  /**
   * Remove order item
   */
  static async removeOrderItem(itemId) {
    const item = await Wholesaler.getOrderItemById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    return await Wholesaler.removeOrderItem(itemId);
  }

  // ==================== PAYMENTS ====================

  /**
   * Record payment
   */
  static async recordPayment(wholesalerId, data, createdBy) {
    const wholesaler = await Wholesaler.getById(wholesalerId);
    if (!wholesaler) {
      throw new Error('Wholesaler not found');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    return await Wholesaler.recordPayment(wholesalerId, {
      ...data,
      created_by: createdBy,
    });
  }

  /**
   * Get wholesaler payments
   */
  static async getPayments(wholesalerId, options = {}) {
    const wholesaler = await Wholesaler.getById(wholesalerId);
    if (!wholesaler) {
      throw new Error('Wholesaler not found');
    }
    return await Wholesaler.getPayments(wholesalerId, options);
  }

  /**
   * Get wholesaler balance
   */
  static async getBalance(wholesalerId) {
    const wholesaler = await Wholesaler.getById(wholesalerId);
    if (!wholesaler) {
      throw new Error('Wholesaler not found');
    }
    return {
      wholesaler_id: wholesalerId,
      company_name: wholesaler.company_name,
      discount_percentage: parseFloat(wholesaler.discount_percentage),
      credit_limit: parseFloat(wholesaler.credit_limit),
      current_balance: parseFloat(wholesaler.current_balance),
      total_sales: parseFloat(wholesaler.total_sales),
      total_payments: parseFloat(wholesaler.total_payments),
    };
  }

  /**
   * Get statistics
   */
  static async getStatistics() {
    return await Wholesaler.getStatistics();
  }
}

module.exports = WholesalerService;
