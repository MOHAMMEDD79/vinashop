/**
 * Worker Controller
 * @module controllers/worker
 */

const workerService = require('../services/worker.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Format worker for response
 */
const formatWorker = (worker) => {
  if (!worker) return null;

  return {
    id: worker.worker_id,
    workerId: worker.worker_id,
    worker_id: worker.worker_id,
    fullName: worker.full_name,
    full_name: worker.full_name,
    phone: worker.phone,
    email: worker.email,
    idNumber: worker.id_number,
    id_number: worker.id_number,
    address: worker.address,
    position: worker.position,
    hireDate: worker.hire_date,
    hire_date: worker.hire_date,
    baseSalary: parseFloat(worker.base_salary) || 0,
    base_salary: parseFloat(worker.base_salary) || 0,
    salaryType: worker.salary_type,
    salary_type: worker.salary_type,
    status: worker.status,
    bankName: worker.bank_name,
    bank_name: worker.bank_name,
    bankAccount: worker.bank_account,
    bank_account: worker.bank_account,
    notes: worker.notes,
    totalPresentDays: worker.total_present_days,
    total_present_days: worker.total_present_days,
    totalPaidSalary: parseFloat(worker.total_paid_salary) || 0,
    total_paid_salary: parseFloat(worker.total_paid_salary) || 0,
    createdAt: worker.created_at,
    created_at: worker.created_at,
    updatedAt: worker.updated_at,
    updated_at: worker.updated_at,
  };
};

/**
 * Format attendance for response
 */
const formatAttendance = (attendance) => {
  if (!attendance) return null;

  return {
    id: attendance.attendance_id,
    attendanceId: attendance.attendance_id,
    attendance_id: attendance.attendance_id,
    workerId: attendance.worker_id,
    worker_id: attendance.worker_id,
    workerName: attendance.worker_name,
    worker_name: attendance.worker_name,
    workDate: attendance.work_date,
    work_date: attendance.work_date,
    checkIn: attendance.check_in,
    check_in: attendance.check_in,
    checkOut: attendance.check_out,
    check_out: attendance.check_out,
    hoursWorked: parseFloat(attendance.hours_worked) || 0,
    hours_worked: parseFloat(attendance.hours_worked) || 0,
    status: attendance.status,
    notes: attendance.notes,
    recordedBy: attendance.recorded_by,
    recorded_by: attendance.recorded_by,
    recordedByName: attendance.recorded_by_name,
    recorded_by_name: attendance.recorded_by_name,
    createdAt: attendance.created_at,
    created_at: attendance.created_at,
  };
};

/**
 * Format salary for response
 */
const formatSalary = (salary) => {
  if (!salary) return null;

  return {
    id: salary.salary_id,
    salaryId: salary.salary_id,
    salary_id: salary.salary_id,
    workerId: salary.worker_id,
    worker_id: salary.worker_id,
    workerName: salary.worker_name,
    worker_name: salary.worker_name,
    month: salary.month,
    year: salary.year,
    calculationType: salary.calculation_type,
    calculation_type: salary.calculation_type,
    workingDaysInMonth: salary.working_days_in_month,
    working_days_in_month: salary.working_days_in_month,
    daysWorked: salary.days_worked,
    days_worked: salary.days_worked,
    hoursWorked: parseFloat(salary.hours_worked) || 0,
    hours_worked: parseFloat(salary.hours_worked) || 0,
    baseSalary: parseFloat(salary.base_salary) || 0,
    base_salary: parseFloat(salary.base_salary) || 0,
    calculatedAmount: parseFloat(salary.calculated_amount) || 0,
    calculated_amount: parseFloat(salary.calculated_amount) || 0,
    bonus: parseFloat(salary.bonus) || 0,
    deductions: parseFloat(salary.deductions) || 0,
    netSalary: parseFloat(salary.net_salary) || 0,
    net_salary: parseFloat(salary.net_salary) || 0,
    paymentStatus: salary.payment_status,
    payment_status: salary.payment_status,
    paymentDate: salary.payment_date,
    payment_date: salary.payment_date,
    paymentMethod: salary.payment_method,
    payment_method: salary.payment_method,
    notes: salary.notes,
    createdBy: salary.created_by,
    created_by: salary.created_by,
    createdByName: salary.created_by_name,
    created_by_name: salary.created_by_name,
    createdAt: salary.created_at,
    created_at: salary.created_at,
  };
};

class WorkerController {
  /**
   * Get all workers
   */
  static async getAll(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        status: req.query.status,
        position: req.query.position,
        sort: req.query.sort,
        order: req.query.order,
      };

      const result = await workerService.getAll(options);
      const formattedData = result.data.map(formatWorker);

      return successResponse(res, formattedData, 'Workers retrieved successfully', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get worker by ID
   */
  static async getById(req, res) {
    try {
      const worker = await workerService.getById(req.params.id);
      return successResponse(res, formatWorker(worker), 'Worker retrieved successfully');
    } catch (error) {
      const status = error.message === 'Worker not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Create new worker
   */
  static async create(req, res) {
    try {
      const data = {
        full_name: req.body.full_name || req.body.fullName,
        phone: req.body.phone,
        email: req.body.email,
        id_number: req.body.id_number || req.body.idNumber,
        address: req.body.address,
        position: req.body.position,
        hire_date: req.body.hire_date || req.body.hireDate,
        base_salary: req.body.base_salary || req.body.baseSalary,
        salary_type: req.body.salary_type || req.body.salaryType,
        status: req.body.status,
        bank_name: req.body.bank_name || req.body.bankName,
        bank_account: req.body.bank_account || req.body.bankAccount,
        notes: req.body.notes,
      };

      const worker = await workerService.create(data);
      return successResponse(res, formatWorker(worker), 'Worker created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Update worker
   */
  static async update(req, res) {
    try {
      const data = {
        full_name: req.body.full_name || req.body.fullName,
        phone: req.body.phone,
        email: req.body.email,
        id_number: req.body.id_number || req.body.idNumber,
        address: req.body.address,
        position: req.body.position,
        hire_date: req.body.hire_date || req.body.hireDate,
        base_salary: req.body.base_salary || req.body.baseSalary,
        salary_type: req.body.salary_type || req.body.salaryType,
        status: req.body.status,
        bank_name: req.body.bank_name || req.body.bankName,
        bank_account: req.body.bank_account || req.body.bankAccount,
        notes: req.body.notes,
      };

      const worker = await workerService.update(req.params.id, data);
      return successResponse(res, formatWorker(worker), 'Worker updated successfully');
    } catch (error) {
      const status = error.message === 'Worker not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Delete worker
   */
  static async remove(req, res) {
    try {
      await workerService.delete(req.params.id);
      return successResponse(res, null, 'Worker deleted successfully');
    } catch (error) {
      const status = error.message === 'Worker not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Record attendance
   */
  static async recordAttendance(req, res) {
    try {
      const data = {
        work_date: req.body.work_date || req.body.workDate,
        check_in: req.body.check_in || req.body.checkIn,
        check_out: req.body.check_out || req.body.checkOut,
        hours_worked: req.body.hours_worked || req.body.hoursWorked,
        status: req.body.status || 'present',
        notes: req.body.notes,
      };

      const attendance = await workerService.recordAttendance(
        req.params.id,
        data,
        req.admin.admin_id
      );
      return successResponse(res, formatAttendance(attendance), 'Attendance recorded successfully');
    } catch (error) {
      const status = error.message === 'Worker not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get worker attendance
   */
  static async getAttendance(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 31,
        month: parseInt(req.query.month),
        year: parseInt(req.query.year),
      };

      const result = await workerService.getAttendance(req.params.id, options);
      const formattedData = result.data.map(formatAttendance);

      return successResponse(res, formattedData, 'Attendance retrieved successfully', 200, result.pagination);
    } catch (error) {
      const status = error.message === 'Worker not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Generate salary for worker
   */
  static async generateSalary(req, res) {
    try {
      const data = {
        month: parseInt(req.body.month),
        year: parseInt(req.body.year),
        calculation_type: req.body.calculation_type || req.body.calculationType,
        working_days_in_month: req.body.working_days_in_month || req.body.workingDaysInMonth,
        days_worked: req.body.days_worked || req.body.daysWorked,
        hours_worked: req.body.hours_worked || req.body.hoursWorked,
        base_salary: req.body.base_salary || req.body.baseSalary,
        calculated_amount: req.body.calculated_amount || req.body.calculatedAmount,
        bonus: req.body.bonus,
        deductions: req.body.deductions,
        notes: req.body.notes,
      };

      const salary = await workerService.generateSalary(
        req.params.id,
        data,
        req.admin.admin_id
      );
      return successResponse(res, formatSalary(salary), 'Salary generated successfully', 201);
    } catch (error) {
      const status = error.message === 'Worker not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Update salary
   */
  static async updateSalary(req, res) {
    try {
      const data = {
        calculation_type: req.body.calculation_type || req.body.calculationType,
        working_days_in_month: req.body.working_days_in_month || req.body.workingDaysInMonth,
        days_worked: req.body.days_worked || req.body.daysWorked,
        hours_worked: req.body.hours_worked || req.body.hoursWorked,
        base_salary: req.body.base_salary || req.body.baseSalary,
        calculated_amount: req.body.calculated_amount || req.body.calculatedAmount,
        bonus: req.body.bonus,
        deductions: req.body.deductions,
        notes: req.body.notes,
      };

      const salary = await workerService.updateSalary(req.params.salaryId, data);
      return successResponse(res, formatSalary(salary), 'Salary updated successfully');
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Mark salary as paid
   */
  static async markSalaryPaid(req, res) {
    try {
      const paymentData = {
        payment_date: req.body.payment_date || req.body.paymentDate,
        payment_method: req.body.payment_method || req.body.paymentMethod,
      };

      const salary = await workerService.markSalaryPaid(req.params.salaryId, paymentData);
      return successResponse(res, formatSalary(salary), 'Salary marked as paid');
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get worker salary history
   */
  static async getSalaryHistory(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 12,
        year: parseInt(req.query.year),
      };

      const result = await workerService.getSalaryHistory(req.params.id, options);
      const formattedData = result.data.map(formatSalary);

      return successResponse(res, formattedData, 'Salary history retrieved successfully', 200, result.pagination);
    } catch (error) {
      const status = error.message === 'Worker not found' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get monthly report
   */
  static async getMonthlyReport(req, res) {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);

      const report = await workerService.getMonthlyReport(year, month);
      const formattedData = report.map(formatSalary);

      return successResponse(res, formattedData, 'Monthly report retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get worker statistics
   */
  static async getStatistics(req, res) {
    try {
      const stats = await workerService.getStatistics();
      return successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get unique positions
   */
  static async getPositions(req, res) {
    try {
      const positions = await workerService.getPositions();
      return successResponse(res, positions, 'Positions retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Calculate salary preview
   */
  static async calculateSalaryPreview(req, res) {
    try {
      const month = parseInt(req.query.month);
      const year = parseInt(req.query.year);
      const calculationType = req.query.calculation_type || req.query.calculationType || 'fixed';

      const preview = await workerService.calculateSalaryPreview(
        req.params.id,
        month,
        year,
        calculationType
      );
      return successResponse(res, preview, 'Salary preview calculated successfully');
    } catch (error) {
      const status = error.message === 'Worker not found' ? 404 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * Get all salaries for a specific period (all workers)
   */
  static async getAllSalariesByPeriod(req, res) {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        status: req.query.status,
      };

      const result = await workerService.getAllSalariesByPeriod(year, month, options);
      const formattedData = result.data.map(salary => ({
        ...formatSalary(salary),
        position: salary.position,
        phone: salary.phone,
        email: salary.email,
        bankName: salary.bank_name,
        bank_name: salary.bank_name,
        bankAccount: salary.bank_account,
        bank_account: salary.bank_account,
        salaryType: salary.salary_type,
        salary_type: salary.salary_type,
      }));

      return successResponse(res, {
        salaries: formattedData,
        summary: {
          totalRecords: result.summary.total_records,
          total_records: result.summary.total_records,
          totalAmount: parseFloat(result.summary.total_amount) || 0,
          total_amount: parseFloat(result.summary.total_amount) || 0,
          paidCount: result.summary.paid_count,
          paid_count: result.summary.paid_count,
          pendingCount: result.summary.pending_count,
          pending_count: result.summary.pending_count,
          totalPaid: parseFloat(result.summary.total_paid) || 0,
          total_paid: parseFloat(result.summary.total_paid) || 0,
          totalPending: parseFloat(result.summary.total_pending) || 0,
          total_pending: parseFloat(result.summary.total_pending) || 0,
        }
      }, 'Salaries retrieved successfully', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get unpaid workers for a specific period
   */
  static async getUnpaidWorkers(req, res) {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);

      const result = await workerService.getUnpaidWorkers(year, month);
      const formattedData = result.data.map(worker => ({
        ...formatWorker(worker),
        salaryStatus: worker.salary_status,
        salary_status: worker.salary_status,
        salaryId: worker.salary_id,
        salary_id: worker.salary_id,
        netSalary: parseFloat(worker.net_salary) || 0,
        net_salary: parseFloat(worker.net_salary) || 0,
        paymentStatus: worker.payment_status,
        payment_status: worker.payment_status,
        salaryCreatedAt: worker.salary_created_at,
        salary_created_at: worker.salary_created_at,
      }));

      return successResponse(res, {
        workers: formattedData,
        summary: {
          notGenerated: result.summary.not_generated,
          not_generated: result.summary.not_generated,
          pending: result.summary.pending,
          totalUnpaid: result.summary.total_unpaid,
          total_unpaid: result.summary.total_unpaid,
          totalPendingAmount: result.summary.total_pending_amount,
          total_pending_amount: result.summary.total_pending_amount,
        }
      }, 'Unpaid workers retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get past salaries report (all workers, all months)
   */
  static async getPastSalariesReport(req, res) {
    try {
      const options = {
        year: parseInt(req.query.year),
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 100,
      };

      const result = await workerService.getPastSalariesReport(options);
      const formattedData = result.data.map(salary => ({
        ...formatSalary(salary),
        position: salary.position,
        phone: salary.phone,
        salaryType: salary.salary_type,
        salary_type: salary.salary_type,
        workerStatus: salary.worker_status,
        worker_status: salary.worker_status,
      }));

      const monthlySummary = result.monthly_summary.map(s => ({
        year: s.year,
        month: s.month,
        totalWorkers: s.total_workers,
        total_workers: s.total_workers,
        totalAmount: parseFloat(s.total_amount) || 0,
        total_amount: parseFloat(s.total_amount) || 0,
        paidCount: s.paid_count,
        paid_count: s.paid_count,
        pendingCount: s.pending_count,
        pending_count: s.pending_count,
      }));

      return successResponse(res, {
        salaries: formattedData,
        monthlySummary: monthlySummary,
        monthly_summary: monthlySummary,
      }, 'Past salaries report retrieved successfully', 200, result.pagination);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = WorkerController;
