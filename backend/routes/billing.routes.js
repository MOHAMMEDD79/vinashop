/**
 * Billing Routes
 * Routes for billing, invoices, and supplier management
 */

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== STATISTICS & REPORTS ====================

/**
 * @route   GET /api/billing/statistics
 * @desc    Get billing statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('billing', 'read'),
  billingController.getBillingStatistics
);

/**
 * @route   GET /api/billing/revenue-report
 * @desc    Get revenue report
 * @access  Private
 */
router.get(
  '/revenue-report',
  checkPermission('billing', 'read'),
  billingController.getRevenueReport
);

/**
 * @route   GET /api/billing/expenses-report
 * @desc    Get expenses report
 * @access  Private
 */
router.get(
  '/expenses-report',
  checkPermission('billing', 'read'),
  billingController.getExpensesReport
);

// ==================== CUSTOMER INVOICES ====================

/**
 * @route   GET /api/billing/invoices
 * @desc    Get all customer invoices
 * @access  Private
 */
router.get(
  '/invoices',
  checkPermission('billing', 'read'),
  billingController.getCustomerInvoices
);

/**
 * @route   GET /api/billing/invoices/overdue
 * @desc    Get overdue invoices
 * @access  Private
 */
router.get(
  '/invoices/overdue',
  checkPermission('billing', 'read'),
  billingController.getOverdueInvoices
);

/**
 * @route   GET /api/billing/invoices/:id
 * @desc    Get customer invoice by ID
 * @access  Private
 */
router.get(
  '/invoices/:id',
  checkPermission('billing', 'read'),
  billingController.getCustomerInvoiceById
);

/**
 * @route   POST /api/billing/invoices
 * @desc    Create customer invoice
 * @access  Private
 */
router.post(
  '/invoices',
  checkPermission('billing', 'create'),
  billingController.createCustomerInvoice
);

/**
 * @route   POST /api/billing/invoices/manual
 * @desc    Create manual invoice
 * @access  Private
 */
router.post(
  '/invoices/manual',
  checkPermission('billing', 'create'),
  billingController.createManualInvoice
);

/**
 * @route   POST /api/billing/invoices/:id/send
 * @desc    Send invoice to customer
 * @access  Private
 */
router.post(
  '/invoices/:id/send',
  checkPermission('billing', 'update'),
  billingController.sendInvoiceToCustomer
);

/**
 * @route   POST /api/billing/invoices/:id/pdf
 * @desc    Generate invoice PDF
 * @access  Private
 */
router.post(
  '/invoices/:id/pdf',
  checkPermission('billing', 'read'),
  billingController.generateInvoicePDF
);

/**
 * @route   POST /api/billing/invoices/export
 * @desc    Export invoices to Excel
 * @access  Private
 */
router.post(
  '/invoices/export',
  checkPermission('billing', 'read'),
  billingController.exportInvoicesToExcel
);

/**
 * @route   PUT /api/billing/invoices/:id
 * @desc    Update customer invoice
 * @access  Private
 */
router.put(
  '/invoices/:id',
  checkPermission('billing', 'update'),
  billingController.updateCustomerInvoice
);

/**
 * @route   PATCH /api/billing/invoices/:id/paid
 * @desc    Mark invoice as paid
 * @access  Private
 */
router.patch(
  '/invoices/:id/paid',
  checkPermission('billing', 'update'),
  billingController.markInvoiceAsPaid
);

/**
 * @route   DELETE /api/billing/invoices/:id
 * @desc    Delete customer invoice
 * @access  Private
 */
router.delete(
  '/invoices/:id',
  checkPermission('billing', 'delete'),
  billingController.deleteCustomerInvoice
);

// ==================== SUPPLIER BILLS ====================

/**
 * @route   GET /api/billing/supplier-bills
 * @desc    Get all supplier bills
 * @access  Private
 */
router.get(
  '/supplier-bills',
  checkPermission('billing', 'read'),
  billingController.getSupplierBills
);

/**
 * @route   GET /api/billing/supplier-bills/overdue
 * @desc    Get overdue supplier bills
 * @access  Private
 */
router.get(
  '/supplier-bills/overdue',
  checkPermission('billing', 'read'),
  billingController.getOverdueSupplierBills
);

/**
 * @route   GET /api/billing/supplier-bills/:id
 * @desc    Get supplier bill by ID
 * @access  Private
 */
router.get(
  '/supplier-bills/:id',
  checkPermission('billing', 'read'),
  billingController.getSupplierBillById
);

/**
 * @route   POST /api/billing/supplier-bills
 * @desc    Create supplier bill
 * @access  Private
 */
router.post(
  '/supplier-bills',
  checkPermission('billing', 'create'),
  billingController.createSupplierBill
);

/**
 * @route   POST /api/billing/supplier-bills/:id/pdf
 * @desc    Generate supplier bill PDF
 * @access  Private
 */
router.post(
  '/supplier-bills/:id/pdf',
  checkPermission('billing', 'read'),
  billingController.generateSupplierBillPDF
);

/**
 * @route   POST /api/billing/supplier-bills/export
 * @desc    Export supplier bills to Excel
 * @access  Private
 */
router.post(
  '/supplier-bills/export',
  checkPermission('billing', 'read'),
  billingController.exportSupplierBillsToExcel
);

/**
 * @route   PUT /api/billing/supplier-bills/:id
 * @desc    Update supplier bill
 * @access  Private
 */
router.put(
  '/supplier-bills/:id',
  checkPermission('billing', 'update'),
  billingController.updateSupplierBill
);

/**
 * @route   PATCH /api/billing/supplier-bills/:id/paid
 * @desc    Mark supplier bill as paid
 * @access  Private
 */
router.patch(
  '/supplier-bills/:id/paid',
  checkPermission('billing', 'update'),
  billingController.markSupplierBillAsPaid
);

/**
 * @route   DELETE /api/billing/supplier-bills/:id
 * @desc    Delete supplier bill
 * @access  Private
 */
router.delete(
  '/supplier-bills/:id',
  checkPermission('billing', 'delete'),
  billingController.deleteSupplierBill
);

// ==================== SUPPLIERS ====================

/**
 * @route   GET /api/billing/suppliers
 * @desc    Get all suppliers
 * @access  Private
 */
router.get(
  '/suppliers',
  checkPermission('billing', 'read'),
  billingController.getSuppliers
);

/**
 * @route   POST /api/billing/suppliers
 * @desc    Create supplier
 * @access  Private
 */
router.post(
  '/suppliers',
  checkPermission('billing', 'create'),
  billingController.createSupplier
);

/**
 * @route   PUT /api/billing/suppliers/:id
 * @desc    Update supplier
 * @access  Private
 */
router.put(
  '/suppliers/:id',
  checkPermission('billing', 'update'),
  billingController.updateSupplier
);

/**
 * @route   DELETE /api/billing/suppliers/:id
 * @desc    Delete supplier
 * @access  Private
 */
router.delete(
  '/suppliers/:id',
  checkPermission('billing', 'delete'),
  billingController.deleteSupplier
);

// ==================== PAYMENTS ====================

/**
 * @route   GET /api/billing/payments/history
 * @desc    Get payment history
 * @access  Private
 */
router.get(
  '/payments/history',
  checkPermission('billing', 'read'),
  billingController.getPaymentHistory
);

/**
 * @route   POST /api/billing/payments
 * @desc    Record payment
 * @access  Private
 */
router.post(
  '/payments',
  checkPermission('billing', 'create'),
  billingController.recordPayment
);

module.exports = router;