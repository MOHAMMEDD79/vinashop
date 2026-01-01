/**
 * Report Service
 * @module services/report
 */

const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Category = require('../models/category.model');
// DEPRECATED: Variant model removed in Phase 6

class ReportService {
  // ==================== Sales Reports ====================

  /**
   * Get general sales report
   */
  static async getSalesReport(options = {}) {
    const { date_from, date_to, group_by = 'day' } = options;

    const report = await Order.getSalesReport({
      date_from,
      date_to,
      group_by,
    });

    // Calculate totals
    const totals = report.reduce(
      (acc, row) => ({
        total_orders: acc.total_orders + (row.order_count || 0),
        total_revenue: acc.total_revenue + parseFloat(row.revenue || 0),
        total_items: acc.total_items + (row.items_sold || 0),
      }),
      { total_orders: 0, total_revenue: 0, total_items: 0 }
    );

    return {
      data: report,
      totals,
      period: { date_from, date_to, group_by },
    };
  }

  /**
   * Get daily sales report
   */
  static async getDailySalesReport(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    return await this.getSalesReport({
      date_from: targetDate,
      date_to: targetDate,
      group_by: 'hour',
    });
  }

  /**
   * Get weekly sales report
   */
  static async getWeeklySalesReport(options = {}) {
    const endDate = options.date_to ? new Date(options.date_to) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    return await this.getSalesReport({
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0],
      group_by: 'day',
    });
  }

  /**
   * Get monthly sales report
   */
  static async getMonthlySalesReport(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return await this.getSalesReport({
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0],
      group_by: 'day',
    });
  }

  /**
   * Get yearly sales report
   */
  static async getYearlySalesReport(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return await this.getSalesReport({
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0],
      group_by: 'month',
    });
  }

  /**
   * Get sales by category
   */
  static async getSalesByCategory(options = {}) {
    const { date_from, date_to, limit = 10 } = options;

    const categories = await Category.getAll({ status: 'active' });
    const salesData = [];

    for (const category of categories.data || categories) {
      const categoryOrders = await Order.getStatistics({
        date_from,
        date_to,
        category_id: category.category_id,
      });

      salesData.push({
        category_id: category.category_id,
        category_name: category.category_name_en,
        total_orders: categoryOrders.total_orders || 0,
        total_revenue: categoryOrders.total_revenue || 0,
        total_items: categoryOrders.total_items || 0,
      });
    }

    // Sort by revenue and limit
    salesData.sort((a, b) => b.total_revenue - a.total_revenue);

    return salesData.slice(0, limit);
  }

  /**
   * Get sales by product
   */
  static async getSalesByProduct(options = {}) {
    return await Order.getTopSellingProducts(options);
  }

  /**
   * Get sales by payment method
   */
  static async getSalesByPaymentMethod(options = {}) {
    const { date_from, date_to } = options;

    // Get orders grouped by payment method
    const stats = await Order.getStatistics({ date_from, date_to });
    
    // This would require a custom query - placeholder implementation
    return {
      cash: { orders: 0, revenue: 0 },
      visa: { orders: 0, revenue: 0 },
      paypal: { orders: 0, revenue: 0 },
      summary: stats,
    };
  }

  // ==================== Revenue Reports ====================

  /**
   * Get revenue report
   */
  static async getRevenueReport(options = {}) {
    const stats = await Order.getStatistics(options);

    return {
      total_revenue: stats.total_revenue || 0,
      average_order_value: stats.average_order_value || 0,
      total_orders: stats.total_orders || 0,
      total_items_sold: stats.total_items || 0,
    };
  }

  /**
   * Get revenue comparison (current vs previous period)
   */
  static async getRevenueComparison(options = {}) {
    const { period = 'month' } = options;

    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    if (period === 'week') {
      currentEnd = now;
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 7);
    } else if (period === 'month') {
      currentEnd = now;
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
    } else if (period === 'year') {
      currentEnd = now;
      currentStart = new Date(now.getFullYear(), 0, 1);
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd.getFullYear(), 0, 1);
    }

    const [current, previous] = await Promise.all([
      Order.getStatistics({
        date_from: currentStart.toISOString().split('T')[0],
        date_to: currentEnd.toISOString().split('T')[0],
      }),
      Order.getStatistics({
        date_from: previousStart.toISOString().split('T')[0],
        date_to: previousEnd.toISOString().split('T')[0],
      }),
    ]);

    const revenueChange = previous.total_revenue > 0
      ? ((current.total_revenue - previous.total_revenue) / previous.total_revenue * 100)
      : 100;

    const ordersChange = previous.total_orders > 0
      ? ((current.total_orders - previous.total_orders) / previous.total_orders * 100)
      : 100;

    return {
      current: {
        revenue: current.total_revenue || 0,
        orders: current.total_orders || 0,
        average_order_value: current.average_order_value || 0,
        period: { start: currentStart, end: currentEnd },
      },
      previous: {
        revenue: previous.total_revenue || 0,
        orders: previous.total_orders || 0,
        average_order_value: previous.average_order_value || 0,
        period: { start: previousStart, end: previousEnd },
      },
      changes: {
        revenue: revenueChange.toFixed(2),
        orders: ordersChange.toFixed(2),
      },
    };
  }

  /**
   * Get revenue growth report
   */
  static async getRevenueGrowth(options = {}) {
    const { months = 12 } = options;
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const stats = await Order.getStatistics({
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0],
      });

      data.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: stats.total_revenue || 0,
        orders: stats.total_orders || 0,
      });
    }

    return data;
  }

  // ==================== Order Reports ====================

  /**
   * Get order report
   */
  static async getOrderReport(options = {}) {
    return await Order.getStatistics(options);
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(options = {}) {
    return await Order.getCountByStatus();
  }

  /**
   * Get order fulfillment report
   */
  static async getOrderFulfillmentReport(options = {}) {
    const stats = await Order.getStatistics(options);
    const byStatus = await Order.getCountByStatus();

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return {
      total_orders: total,
      fulfilled: byStatus.delivered || 0,
      pending: byStatus.pending || 0,
      processing: byStatus.processing || 0,
      shipped: byStatus.shipped || 0,
      cancelled: byStatus.cancelled || 0,
      fulfillment_rate: total > 0 ? ((byStatus.delivered || 0) / total * 100).toFixed(2) : 0,
    };
  }

  /**
   * Get average order value report
   */
  static async getAverageOrderValueReport(options = {}) {
    const { months = 6 } = options;
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const stats = await Order.getStatistics({
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0],
      });

      data.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        average_order_value: stats.average_order_value || 0,
        total_orders: stats.total_orders || 0,
      });
    }

    return data;
  }

  // ==================== Product Reports ====================

  /**
   * Get product report
   */
  static async getProductReport(options = {}) {
    return await Product.getStatistics();
  }

  /**
   * Get top selling products
   */
  static async getTopSellingProducts(options = {}) {
    return await Order.getTopSellingProducts(options);
  }

  /**
   * Get low performing products
   */
  static async getLowPerformingProducts(options = {}) {
    const { limit = 10 } = options;
    
    // Get products with lowest sales
    const allProducts = await Product.getAll({ limit: 100, status: 'active' });
    const productsWithSales = [];

    for (const product of allProducts.data || allProducts) {
      const sales = await Order.getProductSales(product.product_id);
      productsWithSales.push({
        ...product,
        total_sales: sales.total_quantity || 0,
        total_revenue: sales.total_revenue || 0,
      });
    }

    // Sort by sales ascending (lowest first)
    productsWithSales.sort((a, b) => a.total_sales - b.total_sales);

    return productsWithSales.slice(0, limit);
  }

  /**
   * Get products by views (most viewed)
   */
  static async getProductsByViews(options = {}) {
    const { limit = 10 } = options;
    
    // This would require view tracking - placeholder
    const products = await Product.getAll({ limit, sort: 'views', order: 'DESC' });
    return products.data || products;
  }

  // ==================== Inventory Reports ====================

  /**
   * Get inventory report
   */
  static async getInventoryReport() {
    const stats = await Product.getStatistics();
    const lowStock = await Product.getLowStock({ limit: 100 });
    const outOfStock = await Product.getOutOfStock({ limit: 100 });

    return {
      total_products: stats.total_products,
      total_stock: stats.total_stock || 0,
      low_stock_count: lowStock.length,
      out_of_stock_count: outOfStock.length,
      low_stock_products: lowStock.slice(0, 10),
      out_of_stock_products: outOfStock.slice(0, 10),
    };
  }

  /**
   * Get low stock report
   */
  static async getLowStockReport(options = {}) {
    return await Product.getLowStock(options);
  }

  /**
   * Get out of stock report
   */
  static async getOutOfStockReport(options = {}) {
    return await Product.getOutOfStock(options);
  }

  /**
   * Get inventory valuation
   */
  static async getInventoryValuation() {
    const products = await Product.getAll({ limit: 10000, status: 'active' });
    
    let totalValue = 0;
    let totalItems = 0;

    for (const product of products.data || products) {
      const value = (product.price || 0) * (product.stock_quantity || 0);
      totalValue += value;
      totalItems += product.stock_quantity || 0;
    }

    return {
      total_items: totalItems,
      total_value: totalValue.toFixed(2),
      average_item_value: totalItems > 0 ? (totalValue / totalItems).toFixed(2) : 0,
    };
  }

  // ==================== Customer Reports ====================

  /**
   * Get customer report
   */
  static async getCustomerReport(options = {}) {
    return await User.getStatistics(options);
  }

  /**
   * Get top customers
   */
  static async getTopCustomers(options = {}) {
    return await User.getTopCustomers(options);
  }

  /**
   * Get customer acquisition report
   */
  static async getCustomerAcquisitionReport(options = {}) {
    return await User.getRegistrationTrend(options);
  }

  /**
   * Get customer retention report
   */
  static async getCustomerRetentionReport(options = {}) {
    const stats = await User.getStatistics(options);
    
    // Calculate returning customers (users with more than 1 order)
    const topCustomers = await User.getTopCustomers({ limit: 1000 });
    const returningCustomers = topCustomers.filter(c => c.order_count > 1).length;
    const totalCustomers = topCustomers.length;

    return {
      total_customers: totalCustomers,
      returning_customers: returningCustomers,
      retention_rate: totalCustomers > 0 
        ? ((returningCustomers / totalCustomers) * 100).toFixed(2) 
        : 0,
    };
  }

  /**
   * Get customer lifetime value
   */
  static async getCustomerLifetimeValue(options = {}) {
    const topCustomers = await User.getTopCustomers({ limit: 100 });
    
    if (topCustomers.length === 0) {
      return { average_lifetime_value: 0 };
    }

    const totalValue = topCustomers.reduce(
      (sum, customer) => sum + parseFloat(customer.total_spent || 0),
      0
    );

    return {
      average_lifetime_value: (totalValue / topCustomers.length).toFixed(2),
      top_customer_value: topCustomers[0]?.total_spent || 0,
      data: topCustomers.slice(0, 10),
    };
  }

  // ==================== Category Reports ====================

  /**
   * Get category report
   */
  static async getCategoryReport(options = {}) {
    return await Category.getStatistics();
  }

  /**
   * Get category performance
   */
  static async getCategoryPerformance(options = {}) {
    const categories = await Category.getWithProductCounts(options);
    return categories;
  }

  // ==================== Export & Custom Reports ====================

  /**
   * Export report to specified format
   */
  static async exportReport(reportType, options = {}) {
    const { format = 'json' } = options;

    let data;
    switch (reportType) {
      case 'sales':
        data = await this.getSalesReport(options);
        break;
      case 'revenue':
        data = await this.getRevenueReport(options);
        break;
      case 'orders':
        data = await this.getOrderReport(options);
        break;
      case 'products':
        data = await this.getProductReport(options);
        break;
      case 'inventory':
        data = await this.getInventoryReport();
        break;
      case 'customers':
        data = await this.getCustomerReport(options);
        break;
      case 'categories':
        data = await this.getCategoryReport(options);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return {
      report_type: reportType,
      generated_at: new Date().toISOString(),
      format,
      data,
    };
  }

  /**
   * Generate custom report
   */
  static async generateCustomReport(config) {
    const {
      metrics = [],
      date_from,
      date_to,
      group_by,
      filters = {},
    } = config;

    const results = {};

    for (const metric of metrics) {
      switch (metric) {
        case 'sales':
          results.sales = await this.getSalesReport({ date_from, date_to, group_by });
          break;
        case 'revenue':
          results.revenue = await this.getRevenueReport({ date_from, date_to });
          break;
        case 'orders':
          results.orders = await this.getOrderReport({ date_from, date_to });
          break;
        case 'products':
          results.products = await this.getProductReport();
          break;
        case 'customers':
          results.customers = await this.getCustomerReport({ date_from, date_to });
          break;
        case 'inventory':
          results.inventory = await this.getInventoryReport();
          break;
      }
    }

    return {
      generated_at: new Date().toISOString(),
      config,
      results,
    };
  }

  /**
   * Get scheduled reports
   */
  static async getScheduledReports() {
    // Placeholder - would need scheduled_reports table
    return [];
  }

  /**
   * Create scheduled report
   */
  static async createScheduledReport(config) {
    // Placeholder - would need scheduled_reports table
    return { id: null, ...config };
  }
}

module.exports = ReportService;