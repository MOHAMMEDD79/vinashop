/**
 * Wholesaler Controller
 * @module controllers/wholesaler
 */

const wholesalerService = require('../services/wholesaler.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Format wholesaler for response
 */
const formatWholesaler = (w) => {
  if (!w) return null;
  return {
    id: w.wholesaler_id,
    wholesalerId: w.wholesaler_id,
    wholesaler_id: w.wholesaler_id,
    companyName: w.company_name,
    company_name: w.company_name,
    contactPerson: w.contact_person,
    contact_person: w.contact_person,
    phone: w.phone,
    email: w.email,
    address: w.address,
    taxNumber: w.tax_number,
    tax_number: w.tax_number,
    discountPercentage: parseFloat(w.discount_percentage) || 0,
    discount_percentage: parseFloat(w.discount_percentage) || 0,
    creditLimit: parseFloat(w.credit_limit) || 0,
    credit_limit: parseFloat(w.credit_limit) || 0,
    currentBalance: parseFloat(w.current_balance) || 0,
    current_balance: parseFloat(w.current_balance) || 0,
    status: w.status,
    notes: w.notes,
    orderCount: w.order_count,
    order_count: w.order_count,
    totalSales: parseFloat(w.total_sales) || 0,
    total_sales: parseFloat(w.total_sales) || 0,
    totalPayments: parseFloat(w.total_payments) || 0,
    total_payments: parseFloat(w.total_payments) || 0,
    createdAt: w.created_at,
    created_at: w.created_at,
    updatedAt: w.updated_at,
    updated_at: w.updated_at,
  };
};

/**
 * Format order for response
 */
const formatOrder = (o) => {
  if (!o) return null;
  return {
    id: o.order_id,
    orderId: o.order_id,
    order_id: o.order_id,
    wholesalerId: o.wholesaler_id,
    wholesaler_id: o.wholesaler_id,
    wholesalerName: o.wholesaler_name,
    wholesaler_name: o.wholesaler_name,
    orderNumber: o.order_number,
    order_number: o.order_number,
    orderDate: o.order_date,
    order_date: o.order_date,
    subtotal: parseFloat(o.subtotal) || 0,
    discountAmount: parseFloat(o.discount_amount) || 0,
    discount_amount: parseFloat(o.discount_amount) || 0,
    taxAmount: parseFloat(o.tax_amount) || 0,
    tax_amount: parseFloat(o.tax_amount) || 0,
    totalAmount: parseFloat(o.total_amount) || 0,
    total_amount: parseFloat(o.total_amount) || 0,
    amountPaid: parseFloat(o.amount_paid) || 0,
    amount_paid: parseFloat(o.amount_paid) || 0,
    amountDue: parseFloat(o.amount_due) || 0,
    amount_due: parseFloat(o.amount_due) || 0,
    paymentStatus: o.payment_status,
    payment_status: o.payment_status,
    orderStatus: o.order_status,
    order_status: o.order_status,
    notes: o.notes,
    itemCount: o.item_count,
    item_count: o.item_count,
    createdBy: o.created_by,
    created_by: o.created_by,
    createdByName: o.created_by_name,
    created_by_name: o.created_by_name,
    items: o.items ? o.items.map(formatOrderItem) : undefined,
    createdAt: o.created_at,
    created_at: o.created_at,
  };
};

/**
 * Format order item
 */
const formatOrderItem = (item) => {
  if (!item) return null;
  return {
    id: item.item_id,
    itemId: item.item_id,
    item_id: item.item_id,
    orderId: item.order_id,
    order_id: item.order_id,
    productId: item.product_id,
    product_id: item.product_id,
    variantId: item.variant_id,
    variant_id: item.variant_id,
    productName: item.product_name,
    product_name: item.product_name,
    sku: item.sku,
    productImage: item.product_image,
    product_image: item.product_image,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unit_price) || 0,
    unit_price: parseFloat(item.unit_price) || 0,
    discountPercent: parseFloat(item.discount_percent) || 0,
    discount_percent: parseFloat(item.discount_percent) || 0,
    totalPrice: parseFloat(item.total_price) || 0,
    total_price: parseFloat(item.total_price) || 0,
  };
};

/**
 * Format payment
 */
const formatPayment = (p) => {
  if (!p) return null;
  return {
    id: p.payment_id,
    paymentId: p.payment_id,
    payment_id: p.payment_id,
    wholesalerId: p.wholesaler_id,
    wholesaler_id: p.wholesaler_id,
    wholesalerName: p.wholesaler_name,
    wholesaler_name: p.wholesaler_name,
    orderId: p.order_id,
    order_id: p.order_id,
    orderNumber: p.order_number,
    order_number: p.order_number,
    amount: parseFloat(p.amount) || 0,
    paymentMethod: p.payment_method,
    payment_method: p.payment_method,
    paymentDate: p.payment_date,
    payment_date: p.payment_date,
    referenceNumber: p.reference_number,
    reference_number: p.reference_number,
    notes: p.notes,
    createdBy: p.created_by,
    created_by: p.created_by,
    createdByName: p.created_by_name,
    created_by_name: p.created_by_name,
    createdAt: p.created_at,
    created_at: p.created_at,
  };
};

class WholesalerController {
  /**
   * Get all wholesalers
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

      const result = await wholesalerService.getAll(options);
      return successResponse(res, result.data.map(formatWholesaler), 'Wholesalers retrieved', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get wholesaler by ID
   */
  static async getById(req, res) {
    try {
      const wholesaler = await wholesalerService.getById(req.params.id);
      return successResponse(res, formatWholesaler(wholesaler), 'Wholesaler retrieved');
    } catch (error) {
      const status = error.message === 'Wholesaler not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Create wholesaler
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
        discount_percentage: req.body.discount_percentage || req.body.discountPercentage,
        credit_limit: req.body.credit_limit || req.body.creditLimit,
        status: req.body.status,
        notes: req.body.notes,
      };

      const wholesaler = await wholesalerService.create(data);
      return successResponse(res, formatWholesaler(wholesaler), 'Wholesaler created', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Update wholesaler
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
        discount_percentage: req.body.discount_percentage || req.body.discountPercentage,
        credit_limit: req.body.credit_limit || req.body.creditLimit,
        status: req.body.status,
        notes: req.body.notes,
      };

      const wholesaler = await wholesalerService.update(req.params.id, data);
      return successResponse(res, formatWholesaler(wholesaler), 'Wholesaler updated');
    } catch (error) {
      const status = error.message === 'Wholesaler not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Delete wholesaler
   */
  static async remove(req, res) {
    try {
      await wholesalerService.delete(req.params.id);
      return successResponse(res, null, 'Wholesaler deleted');
    } catch (error) {
      const status = error.message === 'Wholesaler not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  // ==================== ORDERS ====================

  /**
   * Get wholesaler orders
   */
  static async getOrders(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        payment_status: req.query.payment_status || req.query.paymentStatus,
        order_status: req.query.order_status || req.query.orderStatus,
      };

      const result = await wholesalerService.getOrders(req.params.id, options);
      return successResponse(res, result.data.map(formatOrder), 'Orders retrieved', 200, result.pagination);
    } catch (error) {
      const status = error.message === 'Wholesaler not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(req, res) {
    try {
      const order = await wholesalerService.getOrderById(req.params.orderId);
      return successResponse(res, formatOrder(order), 'Order retrieved');
    } catch (error) {
      const status = error.message === 'Order not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Create order
   */
  static async createOrder(req, res) {
    try {
      const data = {
        order_date: req.body.order_date || req.body.orderDate,
        discount_amount: req.body.discount_amount || req.body.discountAmount,
        tax_amount: req.body.tax_amount || req.body.taxAmount,
        order_status: req.body.order_status || req.body.orderStatus,
        notes: req.body.notes,
        items: req.body.items,
      };

      const order = await wholesalerService.createOrder(req.params.id, data, req.admin.admin_id);
      return successResponse(res, formatOrder(order), 'Order created', 201);
    } catch (error) {
      const status = error.message === 'Wholesaler not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Update order
   */
  static async updateOrder(req, res) {
    try {
      const data = {
        order_date: req.body.order_date || req.body.orderDate,
        discount_amount: req.body.discount_amount || req.body.discountAmount,
        tax_amount: req.body.tax_amount || req.body.taxAmount,
        order_status: req.body.order_status || req.body.orderStatus,
        payment_status: req.body.payment_status || req.body.paymentStatus,
        notes: req.body.notes,
      };

      const order = await wholesalerService.updateOrder(req.params.orderId, data);
      return successResponse(res, formatOrder(order), 'Order updated');
    } catch (error) {
      const status = error.message === 'Order not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Delete order
   */
  static async deleteOrder(req, res) {
    try {
      await wholesalerService.deleteOrder(req.params.orderId);
      return successResponse(res, null, 'Order deleted');
    } catch (error) {
      const status = error.message === 'Order not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Add order item
   */
  static async addOrderItem(req, res) {
    try {
      const itemData = {
        product_id: req.body.product_id || req.body.productId,
        variant_id: req.body.variant_id || req.body.variantId,
        quantity: req.body.quantity,
        unit_price: req.body.unit_price || req.body.unitPrice,
        discount_percent: req.body.discount_percent || req.body.discountPercent,
      };

      const item = await wholesalerService.addOrderItem(req.params.orderId, itemData);
      return successResponse(res, formatOrderItem(item), 'Item added', 201);
    } catch (error) {
      const status = error.message === 'Order not found' ? 404 : 400;
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
        order_id: req.body.order_id || req.body.orderId,
        amount: req.body.amount,
        payment_method: req.body.payment_method || req.body.paymentMethod,
        payment_date: req.body.payment_date || req.body.paymentDate,
        reference_number: req.body.reference_number || req.body.referenceNumber,
        notes: req.body.notes,
      };

      const payment = await wholesalerService.recordPayment(req.params.id, data, req.admin.admin_id);
      return successResponse(res, formatPayment(payment), 'Payment recorded');
    } catch (error) {
      const status = error.message === 'Wholesaler not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get wholesaler payments
   */
  static async getPayments(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await wholesalerService.getPayments(req.params.id, options);
      return successResponse(res, result.data.map(formatPayment), 'Payments retrieved', 200, result.pagination);
    } catch (error) {
      const status = error.message === 'Wholesaler not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get wholesaler balance
   */
  static async getBalance(req, res) {
    try {
      const balance = await wholesalerService.getBalance(req.params.id);
      return successResponse(res, balance, 'Balance retrieved');
    } catch (error) {
      const status = error.message === 'Wholesaler not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get statistics
   */
  static async getStatistics(req, res) {
    try {
      const stats = await wholesalerService.getStatistics();
      return successResponse(res, stats, 'Statistics retrieved');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = WholesalerController;
