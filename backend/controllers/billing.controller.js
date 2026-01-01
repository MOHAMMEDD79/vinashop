/**
 * Billing Controller
 * @module controllers/billing
 * 
 * FIXED: Accepts both camelCase and snake_case, responses include both formats
 */

const billingService = require('../services/billing.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const VALID_INVOICE_STATUSES = ['draft', 'pending', 'sent', 'paid', 'cancelled', 'overdue'];
const VALID_PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'refunded'];

/**
 * Helper: Format invoice for response
 */
const formatInvoice = (invoice) => {
  if (!invoice) return null;

  return {
    id: invoice.invoice_id || invoice.id,
    invoiceId: invoice.invoice_id || invoice.id,
    invoice_id: invoice.invoice_id || invoice.id,
    invoiceNumber: invoice.invoice_number,
    invoice_number: invoice.invoice_number,
    
    orderId: invoice.order_id,
    order_id: invoice.order_id,
    orderNumber: invoice.order_number,
    order_number: invoice.order_number,
    
    userId: invoice.user_id,
    user_id: invoice.user_id,
    userName: invoice.user_name,
    user_name: invoice.user_name,
    userEmail: invoice.user_email,
    user_email: invoice.user_email,
    
    status: invoice.status,
    paymentStatus: invoice.payment_status,
    payment_status: invoice.payment_status,
    paymentMethod: invoice.payment_method,
    payment_method: invoice.payment_method,
    paymentReference: invoice.payment_reference,
    payment_reference: invoice.payment_reference,
    
    subtotal: parseFloat(invoice.subtotal) || 0,
    discountAmount: parseFloat(invoice.discount_amount) || 0,
    discount_amount: parseFloat(invoice.discount_amount) || 0,
    taxRate: parseFloat(invoice.tax_rate) || 0,
    tax_rate: parseFloat(invoice.tax_rate) || 0,
    taxAmount: parseFloat(invoice.tax_amount) || 0,
    tax_amount: parseFloat(invoice.tax_amount) || 0,
    shippingCost: parseFloat(invoice.shipping_cost) || 0,
    shipping_cost: parseFloat(invoice.shipping_cost) || 0,
    total: parseFloat(invoice.total) || 0,
    totalAmount: parseFloat(invoice.total) || 0,
    total_amount: parseFloat(invoice.total) || 0,
    paidAmount: parseFloat(invoice.paid_amount) || 0,
    paid_amount: parseFloat(invoice.paid_amount) || 0,
    dueAmount: parseFloat(invoice.due_amount) || 0,
    due_amount: parseFloat(invoice.due_amount) || 0,
    
    notes: invoice.notes,
    dueDate: invoice.due_date,
    due_date: invoice.due_date,
    paidAt: invoice.paid_at,
    paid_at: invoice.paid_at,
    sentAt: invoice.sent_at,
    sent_at: invoice.sent_at,
    
    items: invoice.items || [],
    
    createdAt: invoice.created_at,
    created_at: invoice.created_at,
    updatedAt: invoice.updated_at,
    updated_at: invoice.updated_at,
  };
};

/**
 * Helper: Format supplier bill for response
 */
const formatSupplierBill = (bill) => {
  if (!bill) return null;

  return {
    id: bill.bill_id || bill.id,
    billId: bill.bill_id || bill.id,
    bill_id: bill.bill_id || bill.id,
    billNumber: bill.bill_number,
    bill_number: bill.bill_number,
    
    supplierId: bill.supplier_id,
    supplier_id: bill.supplier_id,
    supplierName: bill.supplier_name,
    supplier_name: bill.supplier_name,
    supplierEmail: bill.supplier_email,
    supplier_email: bill.supplier_email,
    supplierPhone: bill.supplier_phone,
    supplier_phone: bill.supplier_phone,
    supplierAddress: bill.supplier_address,
    supplier_address: bill.supplier_address,
    
    status: bill.status,
    paymentStatus: bill.payment_status,
    payment_status: bill.payment_status,
    paymentMethod: bill.payment_method,
    payment_method: bill.payment_method,
    paymentReference: bill.payment_reference,
    payment_reference: bill.payment_reference,
    
    subtotal: parseFloat(bill.subtotal) || 0,
    taxRate: parseFloat(bill.tax_rate) || 0,
    tax_rate: parseFloat(bill.tax_rate) || 0,
    taxAmount: parseFloat(bill.tax_amount) || 0,
    tax_amount: parseFloat(bill.tax_amount) || 0,
    total: parseFloat(bill.total) || 0,
    totalAmount: parseFloat(bill.total) || 0,
    total_amount: parseFloat(bill.total) || 0,
    paidAmount: parseFloat(bill.paid_amount) || 0,
    paid_amount: parseFloat(bill.paid_amount) || 0,
    dueAmount: parseFloat(bill.due_amount) || 0,
    due_amount: parseFloat(bill.due_amount) || 0,
    
    notes: bill.notes,
    dueDate: bill.due_date,
    due_date: bill.due_date,
    paidAt: bill.paid_at,
    paid_at: bill.paid_at,
    
    items: bill.items || [],
    
    createdAt: bill.created_at,
    created_at: bill.created_at,
    updatedAt: bill.updated_at,
    updated_at: bill.updated_at,
  };
};

/**
 * Helper: Format supplier for response
 */
const formatSupplier = (supplier) => {
  if (!supplier) return null;

  return {
    id: supplier.supplier_id || supplier.id,
    supplierId: supplier.supplier_id || supplier.id,
    supplier_id: supplier.supplier_id || supplier.id,
    name: supplier.name,
    supplierName: supplier.name,
    supplier_name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    contactPerson: supplier.contact_person,
    contact_person: supplier.contact_person,
    taxId: supplier.tax_id,
    tax_id: supplier.tax_id,
    notes: supplier.notes,
    isActive: supplier.is_active === 1 || supplier.is_active === true,
    is_active: supplier.is_active === 1 || supplier.is_active === true,
    totalBills: supplier.total_bills || 0,
    total_bills: supplier.total_bills || 0,
    totalAmount: parseFloat(supplier.total_amount) || 0,
    total_amount: parseFloat(supplier.total_amount) || 0,
    createdAt: supplier.created_at,
    created_at: supplier.created_at,
    updatedAt: supplier.updated_at,
    updated_at: supplier.updated_at,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result, formatFn) => {
  const items = (result.items || result.data || []).map(formatFn);
  return {
    items,
    data: items,
    pagination: {
      page: result.page || 1,
      limit: result.limit || 10,
      total: result.total || items.length,
      totalPages: result.totalPages || 1,
    },
    page: result.page || 1,
    limit: result.limit || 10,
    total: result.total || items.length,
    totalPages: result.totalPages || 1,
  };
};

/**
 * Get all customer invoices
 */
const getCustomerInvoices = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search, status,
      payment_status, paymentStatus,
      date_from, dateFrom, date_to, dateTo,
      user_id, userId,
      sort = 'created_at', order = 'DESC',
      sortBy, sort_by, sortOrder, sort_order,
    } = req.query;

    const result = await billingService.getCustomerInvoices({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      payment_status: payment_status || paymentStatus,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      user_id: parseInt(user_id || userId) || undefined,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
    });

    return successResponse(res, formatPaginationResponse(result, formatInvoice), 'Customer invoices retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer invoice by ID
 */
const getCustomerInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await billingService.getCustomerInvoiceById(id);

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatInvoice(invoice));
  } catch (error) {
    next(error);
  }
};

/**
 * Create customer invoice from order
 */
const createCustomerInvoice = async (req, res, next) => {
  try {
    const {
      order_id, orderId,
      notes,
      due_date, dueDate,
      discount_amount, discountAmount,
      tax_rate, taxRate,
    } = req.body;

    const oId = order_id || orderId;
    if (!oId) {
      return errorResponse(res, 'Order ID is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const invoice = await billingService.createCustomerInvoice({
      order_id: oId,
      notes,
      due_date: due_date || dueDate,
      discount_amount: discount_amount ?? discountAmount,
      tax_rate: tax_rate ?? taxRate,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatInvoice(invoice), 'Invoice created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Create manual customer invoice
 */
const createManualInvoice = async (req, res, next) => {
  try {
    const {
      user_id, userId,
      items,
      notes,
      due_date, dueDate,
      discount_amount, discountAmount,
      tax_rate, taxRate,
      shipping_cost, shippingCost,
    } = req.body;

    const uId = user_id || userId;
    if (!uId || !items || !items.length) {
      return errorResponse(res, 'User ID and items are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const invoice = await billingService.createManualInvoice({
      user_id: uId,
      items,
      notes,
      due_date: due_date || dueDate,
      discount_amount: discount_amount ?? discountAmount,
      tax_rate: tax_rate ?? taxRate,
      shipping_cost: shipping_cost ?? shippingCost,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatInvoice(invoice), 'Invoice created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer invoice
 */
const updateCustomerInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      payment_status, paymentStatus,
      notes,
      due_date, dueDate,
      discount_amount, discountAmount,
    } = req.body;

    const existingInvoice = await billingService.getCustomerInvoiceById(id);
    if (!existingInvoice) {
      return errorResponse(res, 'Invoice not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const invoice = await billingService.updateCustomerInvoice(id, {
      status,
      payment_status: payment_status || paymentStatus,
      notes,
      due_date: due_date || dueDate,
      discount_amount: discount_amount ?? discountAmount,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatInvoice(invoice), 'Invoice updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete customer invoice
 */
const deleteCustomerInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingInvoice = await billingService.getCustomerInvoiceById(id);
    if (!existingInvoice) {
      return errorResponse(res, 'Invoice not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingInvoice.payment_status === 'paid') {
      return errorResponse(res, 'Cannot delete a paid invoice', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    await billingService.deleteCustomerInvoice(id);

    return successResponse(res, null, 'Invoice deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark invoice as paid
 */
const markInvoiceAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      payment_method, paymentMethod,
      payment_reference, paymentReference,
      paid_amount, paidAmount,
    } = req.body;

    const existingInvoice = await billingService.getCustomerInvoiceById(id);
    if (!existingInvoice) {
      return errorResponse(res, 'Invoice not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const invoice = await billingService.markInvoiceAsPaid(id, {
      payment_method: payment_method || paymentMethod,
      payment_reference: payment_reference || paymentReference,
      paid_amount: paid_amount ?? paidAmount,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatInvoice(invoice), 'Invoice marked as paid');
  } catch (error) {
    next(error);
  }
};

/**
 * Send invoice to customer
 */
const sendInvoiceToCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingInvoice = await billingService.getCustomerInvoiceById(id);
    if (!existingInvoice) {
      return errorResponse(res, 'Invoice not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await billingService.sendInvoiceEmail(id);

    return successResponse(res, null, 'Invoice sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all supplier bills
 */
const getSupplierBills = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search, status,
      payment_status, paymentStatus,
      supplier_id, supplierId,
      date_from, dateFrom, date_to, dateTo,
      sort = 'created_at', order = 'DESC',
      sortBy, sort_by, sortOrder, sort_order,
    } = req.query;

    const result = await billingService.getSupplierBills({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      payment_status: payment_status || paymentStatus,
      supplier_id: parseInt(supplier_id || supplierId) || undefined,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
    });

    return successResponse(res, formatPaginationResponse(result, formatSupplierBill), 'Supplier bills retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get supplier bill by ID
 */
const getSupplierBillById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await billingService.getSupplierBillById(id);

    if (!bill) {
      return errorResponse(res, 'Supplier bill not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatSupplierBill(bill));
  } catch (error) {
    next(error);
  }
};

/**
 * Create supplier bill
 */
const createSupplierBill = async (req, res, next) => {
  try {
    const {
      supplier_id, supplierId,
      supplier_name, supplierName,
      supplier_email, supplierEmail,
      supplier_phone, supplierPhone,
      supplier_address, supplierAddress,
      items,
      notes,
      due_date, dueDate,
      tax_rate, taxRate,
      bill_number, billNumber,
    } = req.body;

    const sName = supplier_name || supplierName;
    if (!sName || !items || !items.length) {
      return errorResponse(res, 'Supplier name and items are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const bill = await billingService.createSupplierBill({
      supplier_id: supplier_id || supplierId,
      supplier_name: sName,
      supplier_email: supplier_email || supplierEmail,
      supplier_phone: supplier_phone || supplierPhone,
      supplier_address: supplier_address || supplierAddress,
      items,
      notes,
      due_date: due_date || dueDate,
      tax_rate: tax_rate ?? taxRate,
      bill_number: bill_number || billNumber,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatSupplierBill(bill), 'Supplier bill created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update supplier bill
 */
const updateSupplierBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      payment_status, paymentStatus,
      notes,
      due_date, dueDate,
    } = req.body;

    const existingBill = await billingService.getSupplierBillById(id);
    if (!existingBill) {
      return errorResponse(res, 'Supplier bill not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const bill = await billingService.updateSupplierBill(id, {
      status,
      payment_status: payment_status || paymentStatus,
      notes,
      due_date: due_date || dueDate,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatSupplierBill(bill), 'Supplier bill updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete supplier bill
 */
const deleteSupplierBill = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingBill = await billingService.getSupplierBillById(id);
    if (!existingBill) {
      return errorResponse(res, 'Supplier bill not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingBill.payment_status === 'paid') {
      return errorResponse(res, 'Cannot delete a paid bill', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    await billingService.deleteSupplierBill(id);

    return successResponse(res, null, 'Supplier bill deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark supplier bill as paid
 */
const markSupplierBillAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      payment_method, paymentMethod,
      payment_reference, paymentReference,
      paid_amount, paidAmount,
    } = req.body;

    const existingBill = await billingService.getSupplierBillById(id);
    if (!existingBill) {
      return errorResponse(res, 'Supplier bill not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const bill = await billingService.markSupplierBillAsPaid(id, {
      payment_method: payment_method || paymentMethod,
      payment_reference: payment_reference || paymentReference,
      paid_amount: paid_amount ?? paidAmount,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatSupplierBill(bill), 'Supplier bill marked as paid');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all suppliers
 */
const getSuppliers = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search,
      is_active, isActive,
      sort = 'created_at', order = 'DESC',
      sortBy, sort_by, sortOrder, sort_order,
    } = req.query;

    const result = await billingService.getSuppliers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
    });

    return successResponse(res, formatPaginationResponse(result, formatSupplier), 'Suppliers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create supplier
 */
const createSupplier = async (req, res, next) => {
  try {
    const {
      name, supplier_name, supplierName,
      email, phone, address,
      contact_person, contactPerson,
      tax_id, taxId,
      notes,
      is_active, isActive,
    } = req.body;

    const sName = name || supplier_name || supplierName;
    if (!sName) {
      return errorResponse(res, 'Supplier name is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const supplier = await billingService.createSupplier({
      name: sName,
      email,
      phone,
      address,
      contact_person: contact_person || contactPerson,
      tax_id: tax_id || taxId,
      notes,
      is_active: (is_active ?? isActive) !== 'false' && (is_active ?? isActive) !== false,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatSupplier(supplier), 'Supplier created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update supplier
 */
const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, supplier_name, supplierName,
      email, phone, address,
      contact_person, contactPerson,
      tax_id, taxId,
      notes,
      is_active, isActive,
    } = req.body;

    const existingSupplier = await billingService.getSupplierById(id);
    if (!existingSupplier) {
      return errorResponse(res, 'Supplier not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const supplier = await billingService.updateSupplier(id, {
      name: name || supplier_name || supplierName,
      email,
      phone,
      address,
      contact_person: contact_person || contactPerson,
      tax_id: tax_id || taxId,
      notes,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' || (is_active || isActive) === true : undefined,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatSupplier(supplier), 'Supplier updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete supplier
 */
const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSupplier = await billingService.getSupplierById(id);
    if (!existingSupplier) {
      return errorResponse(res, 'Supplier not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const hasBills = await billingService.supplierHasBills(id);
    if (hasBills) {
      return errorResponse(res, 'Cannot delete supplier with existing bills', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    await billingService.deleteSupplier(id);

    return successResponse(res, null, 'Supplier deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get billing statistics
 */
const getBillingStatistics = async (req, res, next) => {
  try {
    const { period = 'month', date_from, dateFrom, date_to, dateTo } = req.query;

    const stats = await billingService.getBillingStatistics({
      period,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    const formattedStats = {
      totalInvoices: stats.total_invoices || stats.totalInvoices || 0,
      total_invoices: stats.total_invoices || stats.totalInvoices || 0,
      totalRevenue: parseFloat(stats.total_revenue || stats.totalRevenue) || 0,
      total_revenue: parseFloat(stats.total_revenue || stats.totalRevenue) || 0,
      paidInvoices: stats.paid_invoices || stats.paidInvoices || 0,
      paid_invoices: stats.paid_invoices || stats.paidInvoices || 0,
      pendingInvoices: stats.pending_invoices || stats.pendingInvoices || 0,
      pending_invoices: stats.pending_invoices || stats.pendingInvoices || 0,
      overdueInvoices: stats.overdue_invoices || stats.overdueInvoices || 0,
      overdue_invoices: stats.overdue_invoices || stats.overdueInvoices || 0,
      totalSupplierBills: stats.total_supplier_bills || stats.totalSupplierBills || 0,
      total_supplier_bills: stats.total_supplier_bills || stats.totalSupplierBills || 0,
      totalExpenses: parseFloat(stats.total_expenses || stats.totalExpenses) || 0,
      total_expenses: parseFloat(stats.total_expenses || stats.totalExpenses) || 0,
      netProfit: parseFloat(stats.net_profit || stats.netProfit) || 0,
      net_profit: parseFloat(stats.net_profit || stats.netProfit) || 0,
    };

    return successResponse(res, formattedStats, 'Billing statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue report
 */
const getRevenueReport = async (req, res, next) => {
  try {
    const { period = 'month', date_from, dateFrom, date_to, dateTo, group_by, groupBy } = req.query;

    const report = await billingService.getRevenueReport({
      period,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      group_by: group_by || groupBy || 'day',
    });

    return successResponse(res, report, 'Revenue report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get expenses report
 */
const getExpensesReport = async (req, res, next) => {
  try {
    const { period = 'month', date_from, dateFrom, date_to, dateTo, group_by, groupBy } = req.query;

    const report = await billingService.getExpensesReport({
      period,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      group_by: group_by || groupBy || 'day',
    });

    return successResponse(res, report, 'Expenses report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Generate invoice PDF
 */
const generateInvoicePDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingInvoice = await billingService.getCustomerInvoiceById(id);
    if (!existingInvoice) {
      return errorResponse(res, 'Invoice not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const pdfBuffer = await billingService.generateInvoicePDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${existingInvoice.invoice_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate supplier bill PDF
 */
const generateSupplierBillPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingBill = await billingService.getSupplierBillById(id);
    if (!existingBill) {
      return errorResponse(res, 'Supplier bill not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const pdfBuffer = await billingService.generateSupplierBillPDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${existingBill.bill_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export invoices to Excel
 */
const exportInvoicesToExcel = async (req, res, next) => {
  try {
    const { date_from, dateFrom, date_to, dateTo, status, payment_status, paymentStatus } = req.query;

    const excelBuffer = await billingService.exportInvoicesToExcel({
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      status,
      payment_status: payment_status || paymentStatus,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export supplier bills to Excel
 */
const exportSupplierBillsToExcel = async (req, res, next) => {
  try {
    const { date_from, dateFrom, date_to, dateTo, status, payment_status, paymentStatus } = req.query;

    const excelBuffer = await billingService.exportSupplierBillsToExcel({
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      status,
      payment_status: payment_status || paymentStatus,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=supplier-bills.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue invoices
 */
const getOverdueInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await billingService.getOverdueInvoices({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result, formatInvoice), 'Overdue invoices retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue supplier bills
 */
const getOverdueSupplierBills = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await billingService.getOverdueSupplierBills({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result, formatSupplierBill), 'Overdue supplier bills retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Record payment for invoice
 */
const recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      amount,
      payment_method, paymentMethod,
      payment_reference, paymentReference,
      payment_date, paymentDate,
      notes,
    } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, 'Valid payment amount is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const payment = await billingService.recordPayment(id, {
      amount,
      payment_method: payment_method || paymentMethod,
      payment_reference: payment_reference || paymentReference,
      payment_date: payment_date || paymentDate,
      notes,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, payment, 'Payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history for invoice
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payments = await billingService.getPaymentHistory(id);

    return successResponse(res, payments, 'Payment history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerInvoices,
  getCustomerInvoiceById,
  createCustomerInvoice,
  createManualInvoice,
  updateCustomerInvoice,
  deleteCustomerInvoice,
  markInvoiceAsPaid,
  sendInvoiceToCustomer,
  getSupplierBills,
  getSupplierBillById,
  createSupplierBill,
  updateSupplierBill,
  deleteSupplierBill,
  markSupplierBillAsPaid,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getBillingStatistics,
  getRevenueReport,
  getExpensesReport,
  generateInvoicePDF,
  generateSupplierBillPDF,
  exportInvoicesToExcel,
  exportSupplierBillsToExcel,
  getOverdueInvoices,
  getOverdueSupplierBills,
  recordPayment,
  getPaymentHistory,
  VALID_INVOICE_STATUSES,
  VALID_PAYMENT_STATUSES,
};