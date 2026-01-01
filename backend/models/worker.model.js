/**
 * Worker Model
 * @module models/worker
 */

const { query } = require('../config/database');

/**
 * Worker Model - Handles worker/employee database operations
 */
class Worker {
  /**
   * Get all workers with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      position,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (w.full_name LIKE ? OR w.email LIKE ? OR w.phone LIKE ? OR w.id_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND w.status = ?';
      params.push(status);
    }

    if (position) {
      whereClause += ' AND w.position = ?';
      params.push(position);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM workers w ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['worker_id', 'full_name', 'position', 'base_salary', 'hire_date', 'status', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `w.${sort}` : 'w.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        w.*,
        (SELECT COUNT(*) FROM worker_attendance WHERE worker_id = w.worker_id AND status = 'present') as total_present_days,
        (SELECT COALESCE(SUM(net_salary), 0) FROM worker_salaries WHERE worker_id = w.worker_id AND payment_status = 'paid') as total_paid_salary
      FROM workers w
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const workers = await query(sql, params);

    return {
      data: workers,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get worker by ID
   */
  static async getById(workerId) {
    const sql = `
      SELECT
        w.*,
        (SELECT COUNT(*) FROM worker_attendance WHERE worker_id = w.worker_id AND status = 'present') as total_present_days,
        (SELECT COALESCE(SUM(net_salary), 0) FROM worker_salaries WHERE worker_id = w.worker_id AND payment_status = 'paid') as total_paid_salary
      FROM workers w
      WHERE w.worker_id = ?
    `;

    const results = await query(sql, [workerId]);
    return results[0] || null;
  }

  /**
   * Create new worker
   */
  static async create(data) {
    const sql = `
      INSERT INTO workers (
        full_name, phone, email, id_number, address,
        position, hire_date, base_salary, salary_type,
        status, bank_name, bank_account, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.full_name,
      data.phone || null,
      data.email || null,
      data.id_number || null,
      data.address || null,
      data.position,
      data.hire_date,
      data.base_salary,
      data.salary_type || 'monthly',
      data.status || 'active',
      data.bank_name || null,
      data.bank_account || null,
      data.notes || null,
    ];

    const result = await query(sql, params);
    return await this.getById(result.insertId);
  }

  /**
   * Update worker
   */
  static async update(workerId, data) {
    const allowedFields = [
      'full_name', 'phone', 'email', 'id_number', 'address',
      'position', 'hire_date', 'base_salary', 'salary_type',
      'status', 'bank_name', 'bank_account', 'notes'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return await this.getById(workerId);
    }

    params.push(workerId);
    const sql = `UPDATE workers SET ${updates.join(', ')} WHERE worker_id = ?`;
    await query(sql, params);

    return await this.getById(workerId);
  }

  /**
   * Delete worker
   */
  static async delete(workerId) {
    const sql = 'DELETE FROM workers WHERE worker_id = ?';
    const result = await query(sql, [workerId]);
    return result.affectedRows > 0;
  }

  /**
   * Record attendance
   */
  static async recordAttendance(data) {
    // Check if attendance already exists for this date
    const checkSql = `
      SELECT attendance_id FROM worker_attendance
      WHERE worker_id = ? AND work_date = ?
    `;
    const existing = await query(checkSql, [data.worker_id, data.work_date]);

    if (existing.length > 0) {
      // Update existing
      const updateSql = `
        UPDATE worker_attendance SET
          check_in = ?, check_out = ?, hours_worked = ?,
          status = ?, notes = ?, recorded_by = ?
        WHERE attendance_id = ?
      `;
      await query(updateSql, [
        data.check_in || null,
        data.check_out || null,
        data.hours_worked || null,
        data.status || 'present',
        data.notes || null,
        data.recorded_by || null,
        existing[0].attendance_id,
      ]);
      return await this.getAttendanceById(existing[0].attendance_id);
    }

    // Insert new
    const sql = `
      INSERT INTO worker_attendance (
        worker_id, work_date, check_in, check_out,
        hours_worked, status, notes, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.worker_id,
      data.work_date,
      data.check_in || null,
      data.check_out || null,
      data.hours_worked || null,
      data.status || 'present',
      data.notes || null,
      data.recorded_by || null,
    ];

    const result = await query(sql, params);
    return await this.getAttendanceById(result.insertId);
  }

  /**
   * Get attendance by ID
   */
  static async getAttendanceById(attendanceId) {
    const sql = `
      SELECT wa.*, w.full_name as worker_name, CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as recorded_by_name
      FROM worker_attendance wa
      LEFT JOIN workers w ON wa.worker_id = w.worker_id
      LEFT JOIN admins a ON wa.recorded_by = a.admin_id
      WHERE wa.attendance_id = ?
    `;
    const results = await query(sql, [attendanceId]);
    return results[0] || null;
  }

  /**
   * Get worker attendance history
   */
  static async getAttendance(workerId, options = {}) {
    const { month, year, page = 1, limit = 31 } = options;
    const offset = (page - 1) * limit;
    const params = [workerId];
    let whereClause = 'WHERE wa.worker_id = ?';

    if (month && year) {
      whereClause += ' AND MONTH(wa.work_date) = ? AND YEAR(wa.work_date) = ?';
      params.push(month, year);
    } else if (year) {
      whereClause += ' AND YEAR(wa.work_date) = ?';
      params.push(year);
    }

    const countSql = `SELECT COUNT(*) as total FROM worker_attendance wa ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT wa.*, CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as recorded_by_name
      FROM worker_attendance wa
      LEFT JOIN admins a ON wa.recorded_by = a.admin_id
      ${whereClause}
      ORDER BY wa.work_date DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const attendance = await query(sql, params);

    return {
      data: attendance,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Generate salary for worker
   */
  static async generateSalary(data) {
    // Check if salary already exists for this month/year
    const checkSql = `
      SELECT salary_id FROM worker_salaries
      WHERE worker_id = ? AND month = ? AND year = ?
    `;
    const existing = await query(checkSql, [data.worker_id, data.month, data.year]);

    if (existing.length > 0) {
      throw new Error('Salary already exists for this period');
    }

    const sql = `
      INSERT INTO worker_salaries (
        worker_id, month, year, calculation_type,
        working_days_in_month, days_worked, hours_worked,
        base_salary, calculated_amount, bonus, deductions,
        payment_status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.worker_id,
      data.month,
      data.year,
      data.calculation_type || 'fixed',
      data.working_days_in_month || 26,
      data.days_worked || 0,
      data.hours_worked || 0,
      data.base_salary,
      data.calculated_amount,
      data.bonus || 0,
      data.deductions || 0,
      'pending',
      data.notes || null,
      data.created_by || null,
    ];

    const result = await query(sql, params);
    return await this.getSalaryById(result.insertId);
  }

  /**
   * Get salary by ID
   */
  static async getSalaryById(salaryId) {
    const sql = `
      SELECT ws.*, w.full_name as worker_name, CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM worker_salaries ws
      LEFT JOIN workers w ON ws.worker_id = w.worker_id
      LEFT JOIN admins a ON ws.created_by = a.admin_id
      WHERE ws.salary_id = ?
    `;
    const results = await query(sql, [salaryId]);
    return results[0] || null;
  }

  /**
   * Update salary
   */
  static async updateSalary(salaryId, data) {
    const allowedFields = [
      'calculation_type', 'working_days_in_month', 'days_worked',
      'hours_worked', 'base_salary', 'calculated_amount',
      'bonus', 'deductions', 'payment_status', 'payment_date',
      'payment_method', 'notes'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return await this.getSalaryById(salaryId);
    }

    params.push(salaryId);
    const sql = `UPDATE worker_salaries SET ${updates.join(', ')} WHERE salary_id = ?`;
    await query(sql, params);

    return await this.getSalaryById(salaryId);
  }

  /**
   * Mark salary as paid
   */
  static async markSalaryPaid(salaryId, paymentData = {}) {
    // Try with payment_method first, fall back to without if column doesn't exist
    try {
      const sql = `
        UPDATE worker_salaries SET
          payment_status = 'paid',
          payment_date = ?,
          payment_method = ?
        WHERE salary_id = ?
      `;
      await query(sql, [
        paymentData.payment_date || new Date(),
        paymentData.payment_method || 'cash',
        salaryId,
      ]);
    } catch (error) {
      // If payment_method column doesn't exist, update without it
      if (error.message.includes('payment_method') || error.code === 'ER_BAD_FIELD_ERROR') {
        const sql = `
          UPDATE worker_salaries SET
            payment_status = 'paid',
            payment_date = ?
          WHERE salary_id = ?
        `;
        await query(sql, [
          paymentData.payment_date || new Date(),
          salaryId,
        ]);
      } else {
        throw error;
      }
    }
    return await this.getSalaryById(salaryId);
  }

  /**
   * Get worker salary history
   */
  static async getSalaryHistory(workerId, options = {}) {
    const { year, page = 1, limit = 12 } = options;
    const offset = (page - 1) * limit;
    const params = [workerId];
    let whereClause = 'WHERE ws.worker_id = ?';

    if (year) {
      whereClause += ' AND ws.year = ?';
      params.push(year);
    }

    const countSql = `SELECT COUNT(*) as total FROM worker_salaries ws ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT ws.*, CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM worker_salaries ws
      LEFT JOIN admins a ON ws.created_by = a.admin_id
      ${whereClause}
      ORDER BY ws.year DESC, ws.month DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const salaries = await query(sql, params);

    return {
      data: salaries,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get monthly report
   */
  static async getMonthlyReport(year, month) {
    const sql = `
      SELECT
        ws.*,
        w.full_name as worker_name,
        w.position,
        w.bank_name,
        w.bank_account
      FROM worker_salaries ws
      LEFT JOIN workers w ON ws.worker_id = w.worker_id
      WHERE ws.year = ? AND ws.month = ?
      ORDER BY w.full_name ASC
    `;

    return await query(sql, [year, month]);
  }

  /**
   * Get worker statistics
   */
  static async getStatistics() {
    const sql = `
      SELECT
        COUNT(*) as total_workers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_workers,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_workers,
        COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_workers,
        COALESCE(SUM(base_salary), 0) as total_monthly_salary,
        COALESCE(AVG(base_salary), 0) as average_salary
      FROM workers
      WHERE status = 'active'
    `;

    const workersStats = await query(sql);

    // Get this month's salary stats
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const salaryStatsSql = `
      SELECT
        COUNT(*) as total_salaries,
        COALESCE(SUM(net_salary), 0) as total_net_salary,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN net_salary ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN net_salary ELSE 0 END), 0) as total_pending
      FROM worker_salaries
      WHERE year = ? AND month = ?
    `;

    const salaryStats = await query(salaryStatsSql, [currentYear, currentMonth]);

    return {
      ...workersStats[0],
      current_month_salary: salaryStats[0],
    };
  }

  /**
   * Get unique positions
   */
  static async getPositions() {
    const sql = `
      SELECT DISTINCT position, COUNT(*) as count
      FROM workers
      GROUP BY position
      ORDER BY position ASC
    `;
    return await query(sql);
  }

  /**
   * Get all salaries for a specific period (month/year) for all workers
   */
  static async getAllSalariesByPeriod(year, month, options = {}) {
    const { page = 1, limit = 50, status } = options;
    const offset = (page - 1) * limit;
    const params = [year, month];
    let whereClause = 'WHERE ws.year = ? AND ws.month = ?';

    if (status) {
      whereClause += ' AND ws.payment_status = ?';
      params.push(status);
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM worker_salaries ws
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT
        ws.*,
        w.full_name as worker_name,
        w.position,
        w.phone,
        w.email,
        w.bank_name,
        w.bank_account,
        w.salary_type,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as created_by_name
      FROM worker_salaries ws
      LEFT JOIN workers w ON ws.worker_id = w.worker_id
      LEFT JOIN admins a ON ws.created_by = a.admin_id
      ${whereClause}
      ORDER BY w.full_name ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const salaries = await query(sql, params);

    // Calculate totals
    const totalsSql = `
      SELECT
        COUNT(*) as total_records,
        COALESCE(SUM(net_salary), 0) as total_amount,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN net_salary ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN net_salary ELSE 0 END), 0) as total_pending
      FROM worker_salaries ws
      WHERE ws.year = ? AND ws.month = ?
    `;
    const totals = await query(totalsSql, [year, month]);

    return {
      data: salaries,
      summary: totals[0],
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get workers who haven't received salary for a specific period
   */
  static async getUnpaidWorkers(year, month) {
    const sql = `
      SELECT
        w.*,
        CASE
          WHEN ws.salary_id IS NULL THEN 'not_generated'
          WHEN ws.payment_status = 'pending' THEN 'pending'
          ELSE 'paid'
        END as salary_status,
        ws.salary_id,
        ws.net_salary,
        ws.payment_status,
        ws.created_at as salary_created_at
      FROM workers w
      LEFT JOIN worker_salaries ws ON w.worker_id = ws.worker_id
        AND ws.year = ? AND ws.month = ?
      WHERE w.status = 'active'
        AND (ws.salary_id IS NULL OR ws.payment_status = 'pending')
      ORDER BY
        CASE WHEN ws.salary_id IS NULL THEN 0 ELSE 1 END,
        w.full_name ASC
    `;

    const workers = await query(sql, [year, month]);

    // Calculate summary
    const notGenerated = workers.filter(w => w.salary_status === 'not_generated').length;
    const pending = workers.filter(w => w.salary_status === 'pending').length;
    const totalPending = workers
      .filter(w => w.salary_status === 'pending')
      .reduce((sum, w) => sum + parseFloat(w.net_salary || 0), 0);

    return {
      data: workers,
      summary: {
        not_generated: notGenerated,
        pending: pending,
        total_unpaid: notGenerated + pending,
        total_pending_amount: totalPending
      }
    };
  }

  /**
   * Get salary history for all workers (past salaries report)
   */
  static async getPastSalariesReport(options = {}) {
    const { year, page = 1, limit = 100 } = options;
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (year) {
      whereClause += ' AND ws.year = ?';
      params.push(year);
    }

    const countSql = `SELECT COUNT(*) as total FROM worker_salaries ws ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT
        ws.*,
        w.full_name as worker_name,
        w.position,
        w.phone,
        w.salary_type,
        w.status as worker_status
      FROM worker_salaries ws
      LEFT JOIN workers w ON ws.worker_id = w.worker_id
      ${whereClause}
      ORDER BY ws.year DESC, ws.month DESC, w.full_name ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const salaries = await query(sql, params);

    // Get summary by month
    const summarySql = `
      SELECT
        year, month,
        COUNT(*) as total_workers,
        COALESCE(SUM(net_salary), 0) as total_amount,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count
      FROM worker_salaries ws
      ${whereClause}
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `;

    const summary = await query(summarySql, year ? [year] : []);

    return {
      data: salaries,
      monthly_summary: summary,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Calculate salary for worker based on attendance
   */
  static async calculateSalary(workerId, month, year, calculationType = 'fixed') {
    const worker = await this.getById(workerId);
    if (!worker) return null;

    // Get attendance for the month
    const attendanceSql = `
      SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_days,
        COALESCE(SUM(hours_worked), 0) as total_hours
      FROM worker_attendance
      WHERE worker_id = ? AND MONTH(work_date) = ? AND YEAR(work_date) = ?
    `;

    const attendance = await query(attendanceSql, [workerId, month, year]);
    const attendanceData = attendance[0];

    const daysWorked = attendanceData.present_days + (attendanceData.half_days * 0.5);
    const workingDaysInMonth = 26; // Default working days

    let calculatedAmount;
    if (calculationType === 'fixed') {
      calculatedAmount = parseFloat(worker.base_salary);
    } else {
      // days_worked calculation
      const dailyRate = parseFloat(worker.base_salary) / workingDaysInMonth;
      calculatedAmount = dailyRate * daysWorked;
    }

    return {
      worker_id: workerId,
      month,
      year,
      calculation_type: calculationType,
      working_days_in_month: workingDaysInMonth,
      days_worked: daysWorked,
      hours_worked: attendanceData.total_hours,
      base_salary: parseFloat(worker.base_salary),
      calculated_amount: Math.round(calculatedAmount * 100) / 100,
    };
  }
}

module.exports = Worker;
