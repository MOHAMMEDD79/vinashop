/**
 * Customer Debt Controller
 * @module controllers/customerDebt
 */

const customerDebtService = require('../services/customerDebt.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Format debt for response (both camelCase and snake_case)
 */
const formatDebt = (debt) => {
  if (!debt) return null;

  return {
    // IDs
    id: debt.debt_id,
    debtId: debt.debt_id,
    debt_id: debt.debt_id,

    // Customer
    userId: debt.user_id,
    user_id: debt.user_id,
    customerName: debt.customer_name,
    customer_name: debt.customer_name,
    customerEmail: debt.customer_email,
    customer_email: debt.customer_email,
    customerPhone: debt.customer_phone,
    customer_phone: debt.customer_phone,

    // References
    billId: debt.bill_id,
    bill_id: debt.bill_id,
    billNumber: debt.bill_number,
    bill_number: debt.bill_number,
    orderId: debt.order_id,
    order_id: debt.order_id,
    orderNumber: debt.order_number,
    order_number: debt.order_number,

    // Amounts
    totalDebt: parseFloat(debt.total_debt) || 0,
    total_debt: parseFloat(debt.total_debt) || 0,
    amountPaid: parseFloat(debt.amount_paid) || 0,
    amount_paid: parseFloat(debt.amount_paid) || 0,
    remainingDebt: parseFloat(debt.remaining_debt) || 0,
    remaining_debt: parseFloat(debt.remaining_debt) || 0,

    // Status
    status: debt.status,
    isOverdue: debt.is_overdue === 1,
    is_overdue: debt.is_overdue === 1,

    // Dates
    dueDate: debt.due_date,
    due_date: debt.due_date,
    createdAt: debt.created_at,
    created_at: debt.created_at,
    updatedAt: debt.updated_at,
    updated_at: debt.updated_at,

    // Meta
    notes: debt.notes,
    createdBy: debt.created_by,
    created_by: debt.created_by,
    createdByName: debt.created_by_name,
    created_by_name: debt.created_by_name,
    paymentCount: debt.payment_count,
    payment_count: debt.payment_count,

    // Payments (if loaded)
    payments: debt.payments ? debt.payments.map(formatPayment) : undefined,
  };
};

/**
 * Format payment for response
 */
const formatPayment = (payment) => {
  if (!payment) return null;

  return {
    id: payment.payment_id,
    paymentId: payment.payment_id,
    payment_id: payment.payment_id,
    debtId: payment.debt_id,
    debt_id: payment.debt_id,
    userId: payment.user_id,
    user_id: payment.user_id,
    amount: parseFloat(payment.amount) || 0,
    paymentMethod: payment.payment_method,
    payment_method: payment.payment_method,
    paymentDate: payment.payment_date,
    payment_date: payment.payment_date,
    receiptNumber: payment.receipt_number,
    receipt_number: payment.receipt_number,
    notes: payment.notes,
    recordedBy: payment.recorded_by,
    recorded_by: payment.recorded_by,
    recordedByName: payment.recorded_by_name,
    recorded_by_name: payment.recorded_by_name,
    createdAt: payment.created_at,
    created_at: payment.created_at,
  };
};

class CustomerDebtController {
  /**
   * Get all customer debts
   */
  static async getAll(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        status: req.query.status,
        user_id: req.query.user_id || req.query.userId,
        date_from: req.query.date_from || req.query.dateFrom,
        date_to: req.query.date_to || req.query.dateTo,
        min_amount: req.query.min_amount || req.query.minAmount,
        max_amount: req.query.max_amount || req.query.maxAmount,
        overdue_only: req.query.overdue_only === 'true' || req.query.overdueOnly === 'true',
        sort: req.query.sort,
        order: req.query.order,
      };

      const result = await customerDebtService.getAll(options);
      const formattedData = result.data.map(formatDebt);

      return successResponse(res, formattedData, 'Debts retrieved successfully', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get customer debt by ID
   */
  static async getById(req, res) {
    try {
      const debt = await customerDebtService.getWithPayments(req.params.id);
      return successResponse(res, formatDebt(debt), 'Debt retrieved successfully');
    } catch (error) {
      const status = error.message === 'Debt not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get debts by user
   */
  static async getByUser(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
      };

      const result = await customerDebtService.getByUserId(req.params.userId, options);
      const formattedData = result.data.map(formatDebt);

      return successResponse(res, formattedData, 'Debts retrieved successfully', 200, result.pagination);
    } catch (error) {
      const status = error.message === 'User not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get user debt summary
   */
  static async getUserSummary(req, res) {
    try {
      const summary = await customerDebtService.getUserDebtSummary(req.params.userId);
      return successResponse(res, summary, 'Summary retrieved successfully');
    } catch (error) {
      const status = error.message === 'User not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Create new customer debt
   */
  static async create(req, res) {
    try {
      const data = {
        user_id: req.body.user_id || req.body.userId || null,
        bill_id: req.body.bill_id || req.body.billId,
        order_id: req.body.order_id || req.body.orderId,
        customer_name: req.body.customer_name || req.body.customerName,
        customer_phone: req.body.customer_phone || req.body.customerPhone,
        total_debt: req.body.total_debt || req.body.totalDebt,
        due_date: req.body.due_date || req.body.dueDate,
        notes: req.body.notes,
      };

      if (!data.total_debt || data.total_debt <= 0) {
        return errorResponse(res, 'Valid debt amount is required', 400);
      }

      const adminId = req.admin?.adminId || req.admin?.admin_id;
      const debt = await customerDebtService.create(data, adminId);
      return successResponse(res, formatDebt(debt), 'Debt created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Update customer debt
   */
  static async update(req, res) {
    try {
      const data = {
        customer_name: req.body.customer_name || req.body.customerName,
        customer_phone: req.body.customer_phone || req.body.customerPhone,
        total_debt: req.body.total_debt || req.body.totalDebt,
        due_date: req.body.due_date || req.body.dueDate,
        status: req.body.status,
        notes: req.body.notes,
      };

      const debt = await customerDebtService.update(req.params.id, data);
      return successResponse(res, formatDebt(debt), 'Debt updated successfully');
    } catch (error) {
      const status = error.message === 'Debt not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Delete customer debt
   */
  static async remove(req, res) {
    try {
      await customerDebtService.delete(req.params.id);
      return successResponse(res, null, 'Debt deleted successfully');
    } catch (error) {
      const status = error.message === 'Debt not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Record payment on debt
   */
  static async recordPayment(req, res) {
    try {
      const paymentData = {
        amount: req.body.amount,
        payment_method: req.body.payment_method || req.body.paymentMethod || 'cash',
        payment_date: req.body.payment_date || req.body.paymentDate,
        receipt_number: req.body.receipt_number || req.body.receiptNumber,
        notes: req.body.notes,
      };

      if (!paymentData.amount || paymentData.amount <= 0) {
        return errorResponse(res, 'Valid payment amount is required', 400);
      }

      const result = await customerDebtService.recordPayment(
        req.params.id,
        paymentData,
        req.admin.adminId
      );

      return successResponse(res, {
        debt: formatDebt(result.debt),
        payment: formatPayment(result.payment),
      }, 'Payment recorded successfully');
    } catch (error) {
      const status = error.message === 'Debt not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get payment history for a debt
   */
  static async getPayments(req, res) {
    try {
      const payments = await customerDebtService.getPayments(req.params.id);
      return successResponse(res, payments.map(formatPayment), 'Payments retrieved successfully');
    } catch (error) {
      const status = error.message === 'Debt not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get overdue debts
   */
  static async getOverdue(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await customerDebtService.getOverdue(options);
      const formattedData = result.data.map(formatDebt);

      return successResponse(res, formattedData, 'Overdue debts retrieved successfully', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get debt statistics
   */
  static async getStatistics(req, res) {
    try {
      const options = {
        date_from: req.query.date_from || req.query.dateFrom,
        date_to: req.query.date_to || req.query.dateTo,
      };

      const stats = await customerDebtService.getStatistics(options);
      return successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get customers with debt
   */
  static async getCustomersWithDebt(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        min_debt: parseFloat(req.query.min_debt) || 0,
      };

      const result = await customerDebtService.getCustomersWithDebt(options);
      return successResponse(res, result.data, 'Customers retrieved successfully', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = CustomerDebtController;
