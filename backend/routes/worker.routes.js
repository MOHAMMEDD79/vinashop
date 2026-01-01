/**
 * Worker Routes
 * Routes for worker/employee management (Super Admin Only)
 */

const express = require('express');
const router = express.Router();
const workerController = require('../controllers/worker.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { superAdminOnly } = require('../middleware/admin.middleware');

// All routes require authentication and super admin role
router.use(authenticate);
router.use(superAdminOnly);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/workers
 * @desc    Get all workers with pagination
 * @access  Super Admin Only
 */
router.get('/', workerController.getAll);

/**
 * @route   GET /api/workers/statistics
 * @desc    Get worker statistics
 * @access  Super Admin Only
 */
router.get('/statistics', workerController.getStatistics);

/**
 * @route   GET /api/workers/positions
 * @desc    Get unique positions
 * @access  Super Admin Only
 */
router.get('/positions', workerController.getPositions);

/**
 * @route   GET /api/workers/monthly-report/:year/:month
 * @desc    Get monthly salary report
 * @access  Super Admin Only
 */
router.get('/monthly-report/:year/:month', workerController.getMonthlyReport);

/**
 * @route   GET /api/workers/salaries/:year/:month
 * @desc    Get all salaries for a specific period (all workers)
 * @access  Super Admin Only
 */
router.get('/salaries/:year/:month', workerController.getAllSalariesByPeriod);

/**
 * @route   GET /api/workers/unpaid/:year/:month
 * @desc    Get workers who haven't received salary for a specific period
 * @access  Super Admin Only
 */
router.get('/unpaid/:year/:month', workerController.getUnpaidWorkers);

/**
 * @route   GET /api/workers/past-salaries
 * @desc    Get past salaries report (all workers, all months)
 * @access  Super Admin Only
 */
router.get('/past-salaries', workerController.getPastSalariesReport);

/**
 * @route   GET /api/workers/:id
 * @desc    Get worker by ID
 * @access  Super Admin Only
 */
router.get('/:id', workerController.getById);

/**
 * @route   GET /api/workers/:id/attendance
 * @desc    Get worker attendance history
 * @access  Super Admin Only
 */
router.get('/:id/attendance', workerController.getAttendance);

/**
 * @route   GET /api/workers/:id/salary-history
 * @desc    Get worker salary history
 * @access  Super Admin Only
 */
router.get('/:id/salary-history', workerController.getSalaryHistory);

/**
 * @route   GET /api/workers/:id/salary-preview
 * @desc    Calculate salary preview without saving
 * @access  Super Admin Only
 */
router.get('/:id/salary-preview', workerController.calculateSalaryPreview);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/workers
 * @desc    Create new worker
 * @access  Super Admin Only
 */
router.post('/', workerController.create);

/**
 * @route   POST /api/workers/:id/attendance
 * @desc    Record attendance for worker
 * @access  Super Admin Only
 */
router.post('/:id/attendance', workerController.recordAttendance);

/**
 * @route   POST /api/workers/:id/salary
 * @desc    Generate salary for worker
 * @access  Super Admin Only
 */
router.post('/:id/salary', workerController.generateSalary);

// ==================== PUT ROUTES ====================

/**
 * @route   PUT /api/workers/:id
 * @desc    Update worker
 * @access  Super Admin Only
 */
router.put('/:id', workerController.update);

/**
 * @route   PUT /api/workers/salaries/:salaryId
 * @desc    Update salary record
 * @access  Super Admin Only
 */
router.put('/salaries/:salaryId', workerController.updateSalary);

// ==================== PATCH ROUTES ====================

/**
 * @route   PATCH /api/workers/salaries/:salaryId/pay
 * @desc    Mark salary as paid
 * @access  Super Admin Only
 */
router.patch('/salaries/:salaryId/pay', workerController.markSalaryPaid);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/workers/:id
 * @desc    Delete worker
 * @access  Super Admin Only
 */
router.delete('/:id', workerController.remove);

module.exports = router;
