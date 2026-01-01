/**
 * Order Service
 * @module services/order
 */

const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const Product = require('../models/product.model');
const ProductOptionCombination = require('../models/productOptionCombination.model');
const User = require('../models/user.model');
const NotificationService = require('./notification.service');
const EmailService = require('./email.service');

// Helper: Update stock for variant/combination
const updateItemStock = async (item, quantity, operation) => {
  if (item.combination_id) {
    await ProductOptionCombination.updateStock(item.combination_id, quantity, operation);
  } else if (item.variant_id) {
    // Legacy variant_id - update product stock directly since variants table is deprecated
    await Product.updateStock(item.product_id, quantity, operation);
  } else {
    await Product.updateStock(item.product_id, quantity, operation);
  }
};

class OrderService {
  /**
   * Get all orders with pagination
   */
  static async getAll(options = {}) {
    return await Order.getAll(options);
  }

  /**
   * Get order by ID
   */
  static async getById(orderId, lang = 'en') {
    const order = await Order.getById(orderId, lang);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  /**
   * Get order by order number
   */
  static async getByOrderNumber(orderNumber) {
    const order = await Order.getByOrderNumber(orderNumber);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  /**
   * Get order with items
   */
  static async getWithItems(orderId, lang = 'en') {
    const order = await Order.getWithItems(orderId, lang);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  /**
   * Get orders by user
   */
  static async getByUser(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return await Order.getByUserId(userId, options);
  }

  /**
   * Create new order (manual order from admin)
   */
  static async create(data, createdBy) {
    // Validate user if provided
    if (data.user_id) {
      const user = await User.getById(data.user_id);
      if (!user) {
        throw new Error('User not found');
      }
    }

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // Create order
    const order = await Order.create({
      ...data,
      order_number: orderNumber,
      created_by: createdBy,
    });

    // Add items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await this.addItem(order.order_id, item);
      }
    }

    // Send notification to user
    if (data.user_id) {
      await NotificationService.sendOrderNotification(data.user_id, order.order_id, 'created');
    }

    return await this.getWithItems(order.order_id);
  }

  /**
   * Update order
   */
  static async update(orderId, data) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    return await Order.update(orderId, data);
  }

  /**
   * Delete order
   */
  static async delete(orderId) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Restore stock for items
    const items = await OrderItem.getByOrderId(orderId);
    for (const item of items) {
      await updateItemStock(item, item.quantity, 'add');
    }

    return await Order.delete(orderId);
  }

  /**
   * Update order status
   */
  static async updateStatus(orderId, status, notes = null, changedBy = null) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const oldStatus = order.order_status;
    const updatedOrder = await Order.updateStatus(orderId, status, changedBy, notes);

    // Add to status history
    await Order.addStatusHistory(orderId, {
      old_status: oldStatus,
      new_status: status,
      changed_by: changedBy,
      notes,
    });

    // Send notification to user
    if (order.user_id) {
      await NotificationService.sendOrderStatusNotification(order.user_id, orderId, status);
      
      // Send email for important status changes
      if (['shipped', 'delivered', 'cancelled'].includes(status)) {
        const user = await User.getById(order.user_id);
        if (user) {
          await EmailService.sendOrderStatusEmail(
            user.email,
            user.first_name,
            order.order_number,
            status
          );
        }
      }
    }

    return updatedOrder;
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = await Order.updatePaymentStatus(orderId, paymentStatus, transactionId);

    // Send notification for successful payment
    if (paymentStatus === 'paid' && order.user_id) {
      await NotificationService.sendPaymentNotification(order.user_id, orderId, 'success');
    }

    return updatedOrder;
  }

  /**
   * Add tracking information
   */
  static async addTracking(orderId, trackingData) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = await Order.addTracking(orderId, trackingData);

    // Send notification to user
    if (order.user_id) {
      await NotificationService.sendShippingNotification(
        order.user_id,
        orderId,
        trackingData.tracking_number
      );

      const user = await User.getById(order.user_id);
      if (user) {
        await EmailService.sendTrackingEmail(
          user.email,
          user.first_name,
          order.order_number,
          trackingData
        );
      }
    }

    return updatedOrder;
  }

  /**
   * Cancel order
   */
  static async cancel(orderId, reason = null, cancelledBy = null) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Cannot cancel delivered orders
    if (order.order_status === 'delivered') {
      throw new Error('Cannot cancel delivered orders');
    }

    // Restore stock
    const items = await OrderItem.getByOrderId(orderId);
    for (const item of items) {
      await updateItemStock(item, item.quantity, 'add');
    }

    const cancelledOrder = await Order.cancel(orderId, reason, cancelledBy);

    // Send notification
    if (order.user_id) {
      await NotificationService.sendOrderCancellationNotification(order.user_id, orderId);

      const user = await User.getById(order.user_id);
      if (user) {
        await EmailService.sendOrderCancellationEmail(
          user.email,
          user.first_name,
          order.order_number,
          reason
        );
      }
    }

    return cancelledOrder;
  }

  /**
   * Refund order
   */
  static async refund(orderId, refundAmount, reason = null) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.payment_status !== 'paid') {
      throw new Error('Cannot refund unpaid order');
    }

    if (refundAmount > order.total_amount) {
      throw new Error('Refund amount exceeds order total');
    }

    const refundedOrder = await Order.refund(orderId, refundAmount, reason);

    // Send notification
    if (order.user_id) {
      const user = await User.getById(order.user_id);
      if (user) {
        await EmailService.sendRefundEmail(
          user.email,
          user.first_name,
          order.order_number,
          refundAmount
        );
      }
    }

    return refundedOrder;
  }

  /**
   * Get order items
   */
  static async getItems(orderId) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    return await OrderItem.getByOrderId(orderId);
  }

  /**
   * Add item to order
   */
  static async addItem(orderId, itemData) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Get product details
    const product = await Product.getById(itemData.product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Create order item
    const item = await OrderItem.create({
      order_id: orderId,
      product_id: itemData.product_id,
      variant_id: itemData.variant_id,
      quantity: itemData.quantity,
      price: itemData.price || product.price,
      discount: itemData.discount || 0,
      tax: itemData.tax || 0,
      product_name: product.product_name_en,
      sku: product.sku,
    });

    // Update stock
    await updateItemStock(itemData, itemData.quantity, 'subtract');

    // Recalculate order totals
    await OrderItem.recalculateOrderTotals(orderId);

    return item;
  }

  /**
   * Update order item
   */
  static async updateItem(orderId, itemId, itemData) {
    const item = await OrderItem.getById(itemId);
    if (!item || item.order_id !== orderId) {
      throw new Error('Order item not found');
    }

    // Handle quantity change
    if (itemData.quantity !== undefined && itemData.quantity !== item.quantity) {
      const diff = itemData.quantity - item.quantity;
      await updateItemStock(item, Math.abs(diff), diff > 0 ? 'subtract' : 'add');
    }

    const updatedItem = await OrderItem.update(itemId, itemData);
    await OrderItem.recalculateOrderTotals(orderId);

    return updatedItem;
  }

  /**
   * Remove order item
   */
  static async removeItem(orderId, itemId) {
    const item = await OrderItem.getById(itemId);
    if (!item || item.order_id !== orderId) {
      throw new Error('Order item not found');
    }

    // Restore stock
    await updateItemStock(item, item.quantity, 'add');

    await OrderItem.delete(itemId);
    await OrderItem.recalculateOrderTotals(orderId);

    return true;
  }

  /**
   * Get order status history
   */
  static async getStatusHistory(orderId) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    return await Order.getStatusHistory(orderId);
  }

  /**
   * Get order statistics
   */
  static async getStatistics(options = {}) {
    return await Order.getStatistics(options);
  }

  /**
   * Get recent orders
   */
  static async getRecent(limit = 10) {
    return await Order.getRecent(limit);
  }

  /**
   * Get pending orders count
   */
  static async getPendingCount() {
    return await Order.getPendingCount();
  }

  /**
   * Get orders count by status
   */
  static async getCountByStatus() {
    return await Order.getCountByStatus();
  }

  /**
   * Get sales report
   */
  static async getSalesReport(options = {}) {
    return await Order.getSalesReport(options);
  }

  /**
   * Get top selling products
   */
  static async getTopProducts(options = {}) {
    return await Order.getTopSellingProducts(options);
  }

  /**
   * Search orders
   */
  static async search(searchTerm, options = {}) {
    return await Order.search(searchTerm, options);
  }

  /**
   * Bulk update status
   */
  static async bulkUpdateStatus(orderIds, status, changedBy = null) {
    const results = [];
    for (const orderId of orderIds) {
      try {
        const order = await this.updateStatus(orderId, status, null, changedBy);
        results.push({ order_id: orderId, success: true });
      } catch (error) {
        results.push({ order_id: orderId, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Bulk delete orders
   */
  static async bulkDelete(orderIds) {
    let deleted = 0;
    for (const orderId of orderIds) {
      try {
        await this.delete(orderId);
        deleted++;
      } catch (error) {
        // Continue with other orders
      }
    }
    return { deleted };
  }

  /**
   * Export orders
   */
  static async export(options = {}) {
    return await Order.getAllForExport(options);
  }

  /**
   * Get today's count
   */
  static async getTodayCount() {
    return await Order.getTodayCount();
  }

  /**
   * Get today's revenue
   */
  static async getTodayRevenue() {
    return await Order.getTodayRevenue();
  }
}

module.exports = OrderService;