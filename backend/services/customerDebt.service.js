/**
 * Customer Debt Service
 * @module services/customerDebt
 */

const CustomerDebt = require('../models/customerDebt.model');
const User = require('../models/user.model');

class CustomerDebtService {
  /**
   * Get all customer debts with pagination
   */
  static async getAll(options = {}) {
    return await CustomerDebt.getAll(options);
  }

  /**
   * Get customer debt by ID
   */
  static async getById(debtId) {
    const debt = await CustomerDebt.getById(debtId);
    if (!debt) {
      throw new Error('Debt not found');
    }
    return debt;
  }

  /**
   * Get debt with payment history
   */
  static async getWithPayments(debtId) {
    const debt = await CustomerDebt.getWithPayments(debtId);
    if (!debt) {
      throw new Error('Debt not found');
    }
    return debt;
  }

  /**
   * Get debts by user ID
   */
  static async getByUserId(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return await CustomerDebt.getByUserId(userId, options);
  }

  /**
   * Get user debt summary
   */
  static async getUserDebtSummary(userId) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const summary = await CustomerDebt.getUserDebtSummary(userId);
    if (!summary) {
      return {
        user_id: userId,
        full_name: user.full_name,
        email: user.email,
        total_debts: 0,
        total_debt_amount: 0,
        total_paid: 0,
        total_remaining: 0,
        pending_count: 0,
        partial_count: 0,
        settled_count: 0,
        overdue_count: 0,
        total_orders: 0,
      };
    }
    return summary;
  }

  /**
   * Create new customer debt
   */
  static async create(data, createdBy) {
    // Validate user
    const user = await User.getById(data.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    if (!data.total_debt || data.total_debt <= 0) {
      throw new Error('Valid debt amount is required');
    }

    return await CustomerDebt.create({
      ...data,
      created_by: createdBy,
    });
  }

  /**
   * Update customer debt
   */
  static async update(debtId, data) {
    const debt = await CustomerDebt.getById(debtId);
    if (!debt) {
      throw new Error('Debt not found');
    }

    // Prevent editing settled debts
    if (debt.status === 'settled' && data.total_debt) {
      throw new Error('Cannot modify settled debt amount');
    }

    return await CustomerDebt.update(debtId, data);
  }

  /**
   * Delete customer debt
   */
  static async delete(debtId) {
    const debt = await CustomerDebt.getById(debtId);
    if (!debt) {
      throw new Error('Debt not found');
    }

    // Prevent deleting debts with payments
    const payments = await CustomerDebt.getPayments(debtId);
    if (payments.length > 0) {
      throw new Error('Cannot delete debt with payment history');
    }

    return await CustomerDebt.delete(debtId);
  }

  /**
   * Record debt payment
   */
  static async recordPayment(debtId, paymentData, recordedBy) {
    const debt = await CustomerDebt.getById(debtId);
    if (!debt) {
      throw new Error('Debt not found');
    }

    if (debt.status === 'settled') {
      throw new Error('Debt is already settled');
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    const remainingDebt = parseFloat(debt.remaining_debt);
    if (paymentData.amount > remainingDebt) {
      throw new Error(`Payment amount cannot exceed remaining debt (${remainingDebt})`);
    }

    const payment = await CustomerDebt.recordPayment(debtId, {
      ...paymentData,
      user_id: debt.user_id,
      recorded_by: recordedBy,
    });

    // Return updated debt with payment
    const updatedDebt = await this.getWithPayments(debtId);
    return { debt: updatedDebt, payment };
  }

  /**
   * Get payment history for a debt
   */
  static async getPayments(debtId) {
    const debt = await CustomerDebt.getById(debtId);
    if (!debt) {
      throw new Error('Debt not found');
    }
    return await CustomerDebt.getPayments(debtId);
  }

  /**
   * Get overdue debts
   */
  static async getOverdue(options = {}) {
    return await CustomerDebt.getOverdue(options);
  }

  /**
   * Get debt statistics
   */
  static async getStatistics(options = {}) {
    return await CustomerDebt.getStatistics(options);
  }

  /**
   * Get customers with debt
   */
  static async getCustomersWithDebt(options = {}) {
    return await CustomerDebt.getCustomersWithDebt(options);
  }
}

module.exports = CustomerDebtService;
