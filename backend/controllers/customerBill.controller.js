/**
 * Customer Bill Controller
 * @module controllers/customerBill
 */

const customerBillService = require('../services/customerBill.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Format bill for response (both camelCase and snake_case)
 */
const formatBill = (bill) => {
  if (!bill) return null;

  return {
    // IDs
    id: bill.bill_id,
    billId: bill.bill_id,
    bill_id: bill.bill_id,
    billNumber: bill.bill_number,
    bill_number: bill.bill_number,

    // Customer
    userId: bill.user_id,
    user_id: bill.user_id,
    customerName: bill.customer_name,
    customer_name: bill.customer_name,
    customerEmail: bill.customer_email,
    customer_email: bill.customer_email,
    customerPhone: bill.customer_phone,
    customer_phone: bill.customer_phone,

    // Order
    orderId: bill.order_id,
    order_id: bill.order_id,
    orderNumber: bill.order_number,
    order_number: bill.order_number,

    // Amounts
    subtotal: parseFloat(bill.subtotal) || 0,
    taxAmount: parseFloat(bill.tax_amount) || 0,
    tax_amount: parseFloat(bill.tax_amount) || 0,
    discountAmount: parseFloat(bill.discount_amount) || 0,
    discount_amount: parseFloat(bill.discount_amount) || 0,
    totalAmount: parseFloat(bill.total_amount) || 0,
    total_amount: parseFloat(bill.total_amount) || 0,
    amountPaid: parseFloat(bill.amount_paid) || 0,
    amount_paid: parseFloat(bill.amount_paid) || 0,
    amountDue: parseFloat(bill.amount_due) || 0,
    amount_due: parseFloat(bill.amount_due) || 0,

    // Status
    paymentStatus: bill.payment_status,
    payment_status: bill.payment_status,

    // Dates
    billDate: bill.bill_date,
    bill_date: bill.bill_date,
    createdAt: bill.created_at,
    created_at: bill.created_at,
    updatedAt: bill.updated_at,
    updated_at: bill.updated_at,

    // Meta
    notes: bill.notes,
    createdBy: bill.created_by,
    created_by: bill.created_by,
    createdByName: bill.created_by_name,
    created_by_name: bill.created_by_name,
    itemCount: bill.item_count,
    item_count: bill.item_count,

    // Items (if loaded)
    items: bill.items ? bill.items.map(formatBillItem) : undefined,

    // Customer address (if loaded)
    customerAddress: bill.customer_address,
    customer_address: bill.customer_address,
  };
};

/**
 * Format bill item for response
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
    variantId: item.variant_id,
    variant_id: item.variant_id,
    // Multilingual product names
    productName: item.product_name,
    product_name: item.product_name,
    productNameEn: item.product_name_en,
    product_name_en: item.product_name_en,
    productNameAr: item.product_name_ar,
    product_name_ar: item.product_name_ar,
    productNameHe: item.product_name_he,
    product_name_he: item.product_name_he,
    productImage: item.product_image,
    product_image: item.product_image,
    description: item.description,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unit_price) || 0,
    unit_price: parseFloat(item.unit_price) || 0,
    discountPercent: parseFloat(item.discount_percent) || 0,
    discount_percent: parseFloat(item.discount_percent) || 0,
    totalPrice: parseFloat(item.total_price) || 0,
    total_price: parseFloat(item.total_price) || 0,
  };
};

class CustomerBillController {
  /**
   * Get all customer bills
   */
  static async getAll(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        payment_status: req.query.payment_status || req.query.paymentStatus,
        user_id: req.query.user_id || req.query.userId,
        date_from: req.query.date_from || req.query.dateFrom,
        date_to: req.query.date_to || req.query.dateTo,
        min_amount: req.query.min_amount || req.query.minAmount,
        max_amount: req.query.max_amount || req.query.maxAmount,
        sort: req.query.sort,
        order: req.query.order,
      };

      const result = await customerBillService.getAll(options);
      const formattedData = result.data.map(formatBill);

      return successResponse(res, formattedData, 'Bills retrieved successfully', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get customer bill by ID
   */
  static async getById(req, res) {
    try {
      const bill = await customerBillService.getWithItems(req.params.id);
      return successResponse(res, formatBill(bill), 'Bill retrieved successfully');
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get bills by user
   */
  static async getByUser(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        payment_status: req.query.payment_status,
      };

      const result = await customerBillService.getByUserId(req.params.userId, options);
      const formattedData = result.data.map(formatBill);

      return successResponse(res, formattedData, 'Bills retrieved successfully', 200, result.pagination);
    } catch (error) {
      const status = error.message === 'User not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Create new customer bill
   */
  static async create(req, res) {
    try {
      const data = {
        user_id: req.body.user_id || req.body.userId,
        order_id: req.body.order_id || req.body.orderId,
        bill_date: req.body.bill_date || req.body.billDate,
        subtotal: req.body.subtotal,
        tax_amount: req.body.tax_amount || req.body.taxAmount,
        discount_amount: req.body.discount_amount || req.body.discountAmount,
        total_amount: req.body.total_amount || req.body.totalAmount,
        notes: req.body.notes,
        items: req.body.items,
      };

      if (!data.total_amount && (!data.items || data.items.length === 0)) {
        return errorResponse(res, 'Total amount or items are required', 400);
      }

      // Use adminId (camelCase) - that's what auth middleware sets
      const adminId = req.admin?.adminId || req.admin?.admin_id;
      if (!adminId) {
        return errorResponse(res, 'Admin authentication required', 401);
      }
      const bill = await customerBillService.create(data, adminId);
      return successResponse(res, formatBill(bill), 'Bill created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Update customer bill
   */
  static async update(req, res) {
    try {
      const data = {
        user_id: req.body.user_id || req.body.userId,
        order_id: req.body.order_id || req.body.orderId,
        bill_date: req.body.bill_date || req.body.billDate,
        subtotal: req.body.subtotal,
        tax_amount: req.body.tax_amount || req.body.taxAmount,
        discount_amount: req.body.discount_amount || req.body.discountAmount,
        total_amount: req.body.total_amount || req.body.totalAmount,
        payment_status: req.body.payment_status || req.body.paymentStatus,
        notes: req.body.notes,
      };

      const bill = await customerBillService.update(req.params.id, data);
      return successResponse(res, formatBill(bill), 'Bill updated successfully');
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Delete customer bill
   */
  static async remove(req, res) {
    try {
      await customerBillService.delete(req.params.id);
      return successResponse(res, null, 'Bill deleted successfully');
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Add item to bill
   */
  static async addItem(req, res) {
    try {
      const itemData = {
        product_id: req.body.product_id || req.body.productId,
        variant_id: req.body.variant_id || req.body.variantId,
        description: req.body.description,
        quantity: req.body.quantity || 1,
        unit_price: req.body.unit_price || req.body.unitPrice,
        discount_percent: req.body.discount_percent || req.body.discountPercent || 0,
      };

      if (!itemData.description) {
        return errorResponse(res, 'Item description is required', 400);
      }

      if (!itemData.unit_price) {
        return errorResponse(res, 'Unit price is required', 400);
      }

      const item = await customerBillService.addItem(req.params.id, itemData);
      return successResponse(res, formatBillItem(item), 'Item added successfully', 201);
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Update bill item
   */
  static async updateItem(req, res) {
    try {
      const data = {
        description: req.body.description,
        quantity: req.body.quantity,
        unit_price: req.body.unit_price || req.body.unitPrice,
        discount_percent: req.body.discount_percent || req.body.discountPercent,
      };

      const item = await customerBillService.updateItem(req.params.id, req.params.itemId, data);
      return successResponse(res, formatBillItem(item), 'Item updated successfully');
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Remove item from bill
   */
  static async removeItem(req, res) {
    try {
      await customerBillService.removeItem(req.params.id, req.params.itemId);
      return successResponse(res, null, 'Item removed successfully');
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Record payment on bill
   */
  static async recordPayment(req, res) {
    try {
      const amount = req.body.amount;

      if (!amount || amount <= 0) {
        return errorResponse(res, 'Valid payment amount is required', 400);
      }

      const adminId = req.admin?.adminId || req.admin?.admin_id;
      const bill = await customerBillService.recordPayment(
        req.params.id,
        amount,
        adminId
      );
      return successResponse(res, formatBill(bill), 'Payment recorded successfully');
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get print data for bill
   */
  static async getPrintData(req, res) {
    try {
      const bill = await customerBillService.getPrintData(req.params.id);
      return successResponse(res, formatBill(bill), 'Print data retrieved successfully');
    } catch (error) {
      const status = error.message === 'Bill not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get bill statistics
   */
  static async getStatistics(req, res) {
    try {
      const options = {
        date_from: req.query.date_from || req.query.dateFrom,
        date_to: req.query.date_to || req.query.dateTo,
      };

      const stats = await customerBillService.getStatistics(options);
      return successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Create bill from order
   */
  static async createFromOrder(req, res) {
    try {
      const orderId = req.params.orderId || req.body.order_id || req.body.orderId;

      if (!orderId) {
        return errorResponse(res, 'Order ID is required', 400);
      }

      const adminId = req.admin?.adminId || req.admin?.admin_id;
      const bill = await customerBillService.createFromOrder(orderId, adminId);
      return successResponse(res, formatBill(bill), 'Bill created from order successfully', 201);
    } catch (error) {
      const status = error.message === 'Order not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }
}

module.exports = CustomerBillController;
