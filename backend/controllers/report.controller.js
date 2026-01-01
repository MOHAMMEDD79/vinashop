/**
 * Report Controller
 * @module controllers/report
 */

const reportService = require('../services/report.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Get sales report
 */
const getSalesReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'day',
      category_id,
      product_id,
    } = req.query;

    const report = await reportService.getSalesReport({
      period,
      date_from,
      date_to,
      group_by,
      category_id: category_id ? parseInt(category_id) : undefined,
      product_id: product_id ? parseInt(product_id) : undefined,
    });

    return successResponse(res, report, 'Sales report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders report
 */
const getOrdersReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'day',
      status,
      payment_status,
    } = req.query;

    const report = await reportService.getOrdersReport({
      period,
      date_from,
      date_to,
      group_by,
      status,
      payment_status,
    });

    return successResponse(res, report, 'Orders report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get products report
 */
const getProductsReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      category_id,
      sort_by = 'sales',
      limit = 50,
      lang = 'en',
    } = req.query;

    const report = await reportService.getProductsReport({
      period,
      date_from,
      date_to,
      category_id: category_id ? parseInt(category_id) : undefined,
      sort_by,
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, report, 'Products report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get users report
 */
const getUsersReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'day',
    } = req.query;

    const report = await reportService.getUsersReport({
      period,
      date_from,
      date_to,
      group_by,
    });

    return successResponse(res, report, 'Users report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue report
 */
const getRevenueReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'day',
      include_expenses = false,
    } = req.query;

    const report = await reportService.getRevenueReport({
      period,
      date_from,
      date_to,
      group_by,
      include_expenses: include_expenses === 'true' || include_expenses === true,
    });

    return successResponse(res, report, 'Revenue report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory report
 */
const getInventoryReport = async (req, res, next) => {
  try {
    const {
      category_id,
      stock_status,
      sort_by = 'stock',
      order = 'ASC',
      lang = 'en',
    } = req.query;

    const report = await reportService.getInventoryReport({
      category_id: category_id ? parseInt(category_id) : undefined,
      stock_status, // 'low', 'out', 'in_stock', 'all'
      sort_by,
      order,
      lang,
    });

    return successResponse(res, report, 'Inventory report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get categories report
 */
const getCategoriesReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      sort_by = 'sales',
      lang = 'en',
    } = req.query;

    const report = await reportService.getCategoriesReport({
      period,
      date_from,
      date_to,
      sort_by,
      lang,
    });

    return successResponse(res, report, 'Categories report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get customers report
 */
const getCustomersReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      sort_by = 'total_spent',
      limit = 100,
    } = req.query;

    const report = await reportService.getCustomersReport({
      period,
      date_from,
      date_to,
      sort_by,
      limit: parseInt(limit),
    });

    return successResponse(res, report, 'Customers report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get geographic report (sales by location)
 */
const getGeographicReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'city',
    } = req.query;

    const report = await reportService.getGeographicReport({
      period,
      date_from,
      date_to,
      group_by, // 'city', 'country', 'region'
    });

    return successResponse(res, report, 'Geographic report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment methods report
 */
const getPaymentMethodsReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
    } = req.query;

    const report = await reportService.getPaymentMethodsReport({
      period,
      date_from,
      date_to,
    });

    return successResponse(res, report, 'Payment methods report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get traffic/conversion report
 */
const getConversionReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'day',
    } = req.query;

    const report = await reportService.getConversionReport({
      period,
      date_from,
      date_to,
      group_by,
    });

    return successResponse(res, report, 'Conversion report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get refunds report
 */
const getRefundsReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'day',
    } = req.query;

    const report = await reportService.getRefundsReport({
      period,
      date_from,
      date_to,
      group_by,
    });

    return successResponse(res, report, 'Refunds report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get discounts report
 */
const getDiscountsReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
    } = req.query;

    const report = await reportService.getDiscountsReport({
      period,
      date_from,
      date_to,
    });

    return successResponse(res, report, 'Discounts report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipping report
 */
const getShippingReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      carrier,
    } = req.query;

    const report = await reportService.getShippingReport({
      period,
      date_from,
      date_to,
      carrier,
    });

    return successResponse(res, report, 'Shipping report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews report
 */
const getReviewsReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      rating,
    } = req.query;

    const report = await reportService.getReviewsReport({
      period,
      date_from,
      date_to,
      rating: rating ? parseInt(rating) : undefined,
    });

    return successResponse(res, report, 'Reviews report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get abandoned carts report
 */
const getAbandonedCartsReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
    } = req.query;

    const report = await reportService.getAbandonedCartsReport({
      period,
      date_from,
      date_to,
    });

    return successResponse(res, report, 'Abandoned carts report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get profit/loss report
 */
const getProfitLossReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'month',
    } = req.query;

    const report = await reportService.getProfitLossReport({
      period,
      date_from,
      date_to,
      group_by,
    });

    return successResponse(res, report, 'Profit/Loss report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get tax report
 */
const getTaxReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      date_from,
      date_to,
      group_by = 'month',
    } = req.query;

    const report = await reportService.getTaxReport({
      period,
      date_from,
      date_to,
      group_by,
    });

    return successResponse(res, report, 'Tax report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get comparison report (current vs previous period)
 */
const getComparisonReport = async (req, res, next) => {
  try {
    const {
      period = 'month',
      metrics = 'all',
    } = req.query;

    const report = await reportService.getComparisonReport({
      period,
      metrics, // 'all', 'sales', 'orders', 'customers', 'revenue'
    });

    return successResponse(res, report, 'Comparison report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get custom report
 */
const getCustomReport = async (req, res, next) => {
  try {
    const {
      report_type,
      date_from,
      date_to,
      group_by,
      filters,
      metrics,
      sort_by,
      order,
      limit,
    } = req.body;

    if (!report_type) {
      return errorResponse(
        res,
        'Report type is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const report = await reportService.getCustomReport({
      report_type,
      date_from,
      date_to,
      group_by,
      filters: filters || {},
      metrics: metrics || [],
      sort_by,
      order,
      limit: limit ? parseInt(limit) : 100,
    });

    return successResponse(res, report, 'Custom report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Export report to PDF
 */
const exportToPdf = async (req, res, next) => {
  try {
    const { report_type } = req.params;
    const { period, date_from, date_to, ...otherParams } = req.query;

    const validReportTypes = [
      'sales', 'orders', 'products', 'users', 'revenue',
      'inventory', 'categories', 'customers', 'geographic',
      'payment_methods', 'refunds', 'profit_loss', 'tax'
    ];

    if (!validReportTypes.includes(report_type)) {
      return errorResponse(
        res,
        'Invalid report type',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const pdfBuffer = await reportService.exportToPdf(report_type, {
      period,
      date_from,
      date_to,
      ...otherParams,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${report_type}-report.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export report to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { report_type } = req.params;
    const { period, date_from, date_to, ...otherParams } = req.query;

    const validReportTypes = [
      'sales', 'orders', 'products', 'users', 'revenue',
      'inventory', 'categories', 'customers', 'geographic',
      'payment_methods', 'refunds', 'profit_loss', 'tax'
    ];

    if (!validReportTypes.includes(report_type)) {
      return errorResponse(
        res,
        'Invalid report type',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const excelBuffer = await reportService.exportToExcel(report_type, {
      period,
      date_from,
      date_to,
      ...otherParams,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${report_type}-report.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export report to CSV
 */
const exportToCsv = async (req, res, next) => {
  try {
    const { report_type } = req.params;
    const { period, date_from, date_to, ...otherParams } = req.query;

    const validReportTypes = [
      'sales', 'orders', 'products', 'users', 'revenue',
      'inventory', 'categories', 'customers', 'geographic',
      'payment_methods', 'refunds', 'profit_loss', 'tax'
    ];

    if (!validReportTypes.includes(report_type)) {
      return errorResponse(
        res,
        'Invalid report type',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const csvContent = await reportService.exportToCsv(report_type, {
      period,
      date_from,
      date_to,
      ...otherParams,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${report_type}-report.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule report
 */
const scheduleReport = async (req, res, next) => {
  try {
    const {
      report_type,
      frequency,
      recipients,
      format,
      parameters,
      is_active,
    } = req.body;

    if (!report_type || !frequency || !recipients || recipients.length === 0) {
      return errorResponse(
        res,
        'Report type, frequency, and recipients are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    if (!validFrequencies.includes(frequency)) {
      return errorResponse(
        res,
        'Invalid frequency. Valid values are: daily, weekly, monthly, quarterly, yearly',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const scheduledReport = await reportService.scheduleReport({
      report_type,
      frequency,
      recipients,
      format: format || 'pdf',
      parameters: parameters || {},
      is_active: is_active !== false,
      created_by: req.admin.adminId,
    });

    return successResponse(res, scheduledReport, 'Report scheduled successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get scheduled reports
 */
const getScheduledReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await reportService.getScheduledReports({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, result, 'Scheduled reports retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update scheduled report
 */
const updateScheduledReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      frequency,
      recipients,
      format,
      parameters,
      is_active,
    } = req.body;

    const report = await reportService.updateScheduledReport(id, {
      frequency,
      recipients,
      format,
      parameters,
      is_active,
      updated_by: req.admin.adminId,
    });

    if (!report) {
      return errorResponse(
        res,
        'Scheduled report not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, report, 'Scheduled report updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete scheduled report
 */
const deleteScheduledReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await reportService.deleteScheduledReport(id);

    if (!deleted) {
      return errorResponse(
        res,
        'Scheduled report not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, null, 'Scheduled report deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get saved reports
 */
const getSavedReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await reportService.getSavedReports(req.admin.adminId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, result, 'Saved reports retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Save report
 */
const saveReport = async (req, res, next) => {
  try {
    const {
      name,
      report_type,
      parameters,
      description,
    } = req.body;

    if (!name || !report_type) {
      return errorResponse(
        res,
        'Name and report type are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const savedReport = await reportService.saveReport({
      name,
      report_type,
      parameters: parameters || {},
      description,
      admin_id: req.admin.adminId,
    });

    return successResponse(res, savedReport, 'Report saved successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete saved report
 */
const deleteSavedReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await reportService.deleteSavedReport(id, req.admin.adminId);

    if (!deleted) {
      return errorResponse(
        res,
        'Saved report not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, null, 'Saved report deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Run saved report
 */
const runSavedReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { override_params } = req.body;

    const report = await reportService.runSavedReport(id, req.admin.adminId, override_params);

    if (!report) {
      return errorResponse(
        res,
        'Saved report not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, report, 'Report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get report types
 */
const getReportTypes = async (req, res, next) => {
  try {
    const reportTypes = [
      { id: 'sales', name: 'Sales Report', description: 'Sales data over time' },
      { id: 'orders', name: 'Orders Report', description: 'Order statistics and trends' },
      { id: 'products', name: 'Products Report', description: 'Product performance analysis' },
      { id: 'users', name: 'Users Report', description: 'User registration and activity' },
      { id: 'revenue', name: 'Revenue Report', description: 'Revenue breakdown and analysis' },
      { id: 'inventory', name: 'Inventory Report', description: 'Stock levels and movement' },
      { id: 'categories', name: 'Categories Report', description: 'Category performance' },
      { id: 'customers', name: 'Customers Report', description: 'Customer behavior and value' },
      { id: 'geographic', name: 'Geographic Report', description: 'Sales by location' },
      { id: 'payment_methods', name: 'Payment Methods Report', description: 'Payment method usage' },
      { id: 'conversion', name: 'Conversion Report', description: 'Cart to order conversion' },
      { id: 'refunds', name: 'Refunds Report', description: 'Refund statistics' },
      { id: 'discounts', name: 'Discounts Report', description: 'Discount usage analysis' },
      { id: 'shipping', name: 'Shipping Report', description: 'Shipping costs and carriers' },
      { id: 'reviews', name: 'Reviews Report', description: 'Product reviews analysis' },
      { id: 'abandoned_carts', name: 'Abandoned Carts Report', description: 'Abandoned cart analysis' },
      { id: 'profit_loss', name: 'Profit/Loss Report', description: 'Profit and loss statement' },
      { id: 'tax', name: 'Tax Report', description: 'Tax collection summary' },
    ];

    return successResponse(res, reportTypes, 'Report types retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard summary report
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const { period = 'today' } = req.query;

    const summary = await reportService.getDashboardSummary({ period });

    return successResponse(res, summary, 'Dashboard summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Email report
 */
const emailReport = async (req, res, next) => {
  try {
    const { report_type } = req.params;
    const { recipients, subject, message, format = 'pdf', parameters } = req.body;

    if (!recipients || recipients.length === 0) {
      return errorResponse(
        res,
        'At least one recipient email is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await reportService.emailReport({
      report_type,
      recipients,
      subject,
      message,
      format,
      parameters: parameters || {},
      sent_by: req.admin.adminId,
    });

    return successResponse(res, result, 'Report emailed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Standard reports
  getSalesReport,
  getOrdersReport,
  getProductsReport,
  getUsersReport,
  getRevenueReport,
  getInventoryReport,
  getCategoriesReport,
  getCustomersReport,
  getGeographicReport,
  getPaymentMethodsReport,
  getConversionReport,
  getRefundsReport,
  getDiscountsReport,
  getShippingReport,
  getReviewsReport,
  getAbandonedCartsReport,
  getProfitLossReport,
  getTaxReport,
  getComparisonReport,
  getCustomReport,
  
  // Export
  exportToPdf,
  exportToExcel,
  exportToCsv,
  
  // Scheduled reports
  scheduleReport,
  getScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
  
  // Saved reports
  getSavedReports,
  saveReport,
  deleteSavedReport,
  runSavedReport,
  
  // Utilities
  getReportTypes,
  getDashboardSummary,
  emailReport,
};