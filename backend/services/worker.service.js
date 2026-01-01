/**
 * Worker Service
 * @module services/worker
 */

const Worker = require('../models/worker.model');

class WorkerService {
  /**
   * Get all workers with pagination
   */
  static async getAll(options = {}) {
    return await Worker.getAll(options);
  }

  /**
   * Get worker by ID
   */
  static async getById(workerId) {
    const worker = await Worker.getById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }
    return worker;
  }

  /**
   * Create new worker
   */
  static async create(data) {
    if (!data.full_name) {
      throw new Error('Worker name is required');
    }

    if (!data.position) {
      throw new Error('Position is required');
    }

    if (!data.hire_date) {
      throw new Error('Hire date is required');
    }

    if (!data.base_salary || data.base_salary <= 0) {
      throw new Error('Valid base salary is required');
    }

    return await Worker.create(data);
  }

  /**
   * Update worker
   */
  static async update(workerId, data) {
    const worker = await Worker.getById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    return await Worker.update(workerId, data);
  }

  /**
   * Delete worker
   */
  static async delete(workerId) {
    const worker = await Worker.getById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    return await Worker.delete(workerId);
  }

  /**
   * Record attendance
   */
  static async recordAttendance(workerId, data, recordedBy) {
    const worker = await Worker.getById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    if (!data.work_date) {
      throw new Error('Work date is required');
    }

    return await Worker.recordAttendance({
      ...data,
      worker_id: workerId,
      recorded_by: recordedBy,
    });
  }

  /**
   * Get worker attendance
   */
  static async getAttendance(workerId, options = {}) {
    const worker = await Worker.getById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    return await Worker.getAttendance(workerId, options);
  }

  /**
   * Generate salary for worker
   */
  static async generateSalary(workerId, data, createdBy) {
    const worker = await Worker.getById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    if (!data.month || !data.year) {
      throw new Error('Month and year are required');
    }

    // Calculate salary based on attendance if not provided
    let salaryData;
    if (data.calculated_amount) {
      salaryData = {
        ...data,
        worker_id: workerId,
        base_salary: data.base_salary || worker.base_salary,
        created_by: createdBy,
      };
    } else {
      // Auto-calculate
      const calculated = await Worker.calculateSalary(
        workerId,
        data.month,
        data.year,
        data.calculation_type || 'fixed'
      );
      salaryData = {
        ...calculated,
        ...data,
        created_by: createdBy,
      };
    }

    return await Worker.generateSalary(salaryData);
  }

  /**
   * Update salary
   */
  static async updateSalary(salaryId, data) {
    const salary = await Worker.getSalaryById(salaryId);
    if (!salary) {
      throw new Error('Salary record not found');
    }

    if (salary.payment_status === 'paid' && data.calculated_amount) {
      throw new Error('Cannot modify paid salary amount');
    }

    return await Worker.updateSalary(salaryId, data);
  }

  /**
   * Mark salary as paid
   */
  static async markSalaryPaid(salaryId, paymentData = {}) {
    const salary = await Worker.getSalaryById(salaryId);
    if (!salary) {
      throw new Error('Salary record not found');
    }

    if (salary.payment_status === 'paid') {
      throw new Error('Salary is already paid');
    }

    return await Worker.markSalaryPaid(salaryId, paymentData);
  }

  /**
   * Get worker salary history
   */
  static async getSalaryHistory(workerId, options = {}) {
    const worker = await Worker.getById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    return await Worker.getSalaryHistory(workerId, options);
  }

  /**
   * Get monthly report
   */
  static async getMonthlyReport(year, month) {
    if (!year || !month) {
      throw new Error('Year and month are required');
    }

    return await Worker.getMonthlyReport(year, month);
  }

  /**
   * Get worker statistics
   */
  static async getStatistics() {
    return await Worker.getStatistics();
  }

  /**
   * Get unique positions
   */
  static async getPositions() {
    return await Worker.getPositions();
  }

  /**
   * Calculate salary preview (without saving)
   */
  static async calculateSalaryPreview(workerId, month, year, calculationType = 'fixed') {
    const worker = await Worker.getById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    return await Worker.calculateSalary(workerId, month, year, calculationType);
  }

  /**
   * Get all salaries for a specific period (all workers)
   */
  static async getAllSalariesByPeriod(year, month, options = {}) {
    if (!year || !month) {
      throw new Error('Year and month are required');
    }

    return await Worker.getAllSalariesByPeriod(year, month, options);
  }

  /**
   * Get unpaid workers for a specific period
   */
  static async getUnpaidWorkers(year, month) {
    if (!year || !month) {
      throw new Error('Year and month are required');
    }

    return await Worker.getUnpaidWorkers(year, month);
  }

  /**
   * Get past salaries report (all workers, all months)
   */
  static async getPastSalariesReport(options = {}) {
    return await Worker.getPastSalariesReport(options);
  }
}

module.exports = WorkerService;
