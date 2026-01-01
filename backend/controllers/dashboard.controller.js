/**
 * Dashboard Controller
 * @module controllers/dashboard
 * 
 * FIXED ISSUES:
 * 1. Response includes both camelCase and snake_case naming
 * 2. Chart data format standardized
 * 3. Statistics format consistent for frontend widgets
 */

const dashboardService = require('../services/dashboard.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Helper: Format statistics with both naming conventions
 */
const formatStats = (stats) => {
  if (!stats) return {};
  
  const result = {};
  for (const [key, value] of Object.entries(stats)) {
    // Original key
    result[key] = value;
    
    // camelCase version
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (camelKey !== key) {
      result[camelKey] = value;
    }
    
    // snake_case version  
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (snakeKey !== key) {
      result[snakeKey] = value;
    }
  }
  return result;
};

/**
 * Get dashboard overview statistics
 */
const getOverview = async (req, res, next) => {
  try {
    const stats = await dashboardService.getOverview();
    
    const formattedStats = {
      // Orders
      totalOrders: stats.total_orders || stats.totalOrders || 0,
      total_orders: stats.total_orders || stats.totalOrders || 0,
      pendingOrders: stats.pending_orders || stats.pendingOrders || 0,
      pending_orders: stats.pending_orders || stats.pendingOrders || 0,
      processingOrders: stats.processing_orders || stats.processingOrders || 0,
      processing_orders: stats.processing_orders || stats.processingOrders || 0,
      completedOrders: stats.completed_orders || stats.completedOrders || 0,
      completed_orders: stats.completed_orders || stats.completedOrders || 0,
      
      // Revenue
      totalRevenue: parseFloat(stats.total_revenue || stats.totalRevenue) || 0,
      total_revenue: parseFloat(stats.total_revenue || stats.totalRevenue) || 0,
      todayRevenue: parseFloat(stats.today_revenue || stats.todayRevenue) || 0,
      today_revenue: parseFloat(stats.today_revenue || stats.todayRevenue) || 0,
      monthRevenue: parseFloat(stats.month_revenue || stats.monthRevenue) || 0,
      month_revenue: parseFloat(stats.month_revenue || stats.monthRevenue) || 0,
      
      // Products
      totalProducts: stats.total_products || stats.totalProducts || 0,
      total_products: stats.total_products || stats.totalProducts || 0,
      activeProducts: stats.active_products || stats.activeProducts || 0,
      active_products: stats.active_products || stats.activeProducts || 0,
      lowStockProducts: stats.low_stock_products || stats.lowStockProducts || 0,
      low_stock_products: stats.low_stock_products || stats.lowStockProducts || 0,
      outOfStockProducts: stats.out_of_stock_products || stats.outOfStockProducts || 0,
      out_of_stock_products: stats.out_of_stock_products || stats.outOfStockProducts || 0,
      
      // Users
      totalUsers: stats.total_users || stats.totalUsers || 0,
      total_users: stats.total_users || stats.totalUsers || 0,
      activeUsers: stats.active_users || stats.activeUsers || 0,
      active_users: stats.active_users || stats.activeUsers || 0,
      newUsersToday: stats.new_users_today || stats.newUsersToday || 0,
      new_users_today: stats.new_users_today || stats.newUsersToday || 0,
      
      // Reviews & Messages
      pendingReviews: stats.pending_reviews || stats.pendingReviews || 0,
      pending_reviews: stats.pending_reviews || stats.pendingReviews || 0,
      unreadMessages: stats.unread_messages || stats.unreadMessages || 0,
      unread_messages: stats.unread_messages || stats.unreadMessages || 0,
      
      // Averages
      averageOrderValue: parseFloat(stats.average_order_value || stats.averageOrderValue) || 0,
      average_order_value: parseFloat(stats.average_order_value || stats.averageOrderValue) || 0,
    };

    return successResponse(res, formattedStats, 'Dashboard overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales statistics
 */
const getSalesStats = async (req, res, next) => {
  try {
    const { period = 'month', date_from, dateFrom, date_to, dateTo } = req.query;

    const stats = await dashboardService.getSalesStats({
      period,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    return successResponse(res, formatStats(stats), 'Sales statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders statistics
 */
const getOrdersStats = async (req, res, next) => {
  try {
    const { period = 'month', date_from, dateFrom, date_to, dateTo } = req.query;

    const stats = await dashboardService.getOrdersStats({
      period,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    return successResponse(res, formatStats(stats), 'Orders statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue chart data
 */
const getRevenueChart = async (req, res, next) => {
  try {
    const { period = 'month', group_by, groupBy } = req.query;

    const chartData = await dashboardService.getRevenueChart({
      period,
      group_by: group_by || groupBy || 'day',
    });

    // Ensure consistent format for chart data
    const formattedData = {
      labels: chartData.labels || [],
      data: chartData.data || chartData.values || [],
      values: chartData.values || chartData.data || [],
      datasets: chartData.datasets || [{
        label: 'Revenue',
        data: chartData.data || chartData.values || [],
      }],
      period,
      groupBy: group_by || groupBy || 'day',
      group_by: group_by || groupBy || 'day',
    };

    return successResponse(res, formattedData, 'Revenue chart data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders chart data
 */
const getOrdersChart = async (req, res, next) => {
  try {
    const { period = 'month', group_by, groupBy } = req.query;

    const chartData = await dashboardService.getOrdersChart({
      period,
      group_by: group_by || groupBy || 'day',
    });

    const formattedData = {
      labels: chartData.labels || [],
      data: chartData.data || chartData.values || [],
      values: chartData.values || chartData.data || [],
      datasets: chartData.datasets || [{
        label: 'Orders',
        data: chartData.data || chartData.values || [],
      }],
      period,
      groupBy: group_by || groupBy || 'day',
      group_by: group_by || groupBy || 'day',
    };

    return successResponse(res, formattedData, 'Orders chart data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top selling products
 */
const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10, period = 'month', lang = 'en' } = req.query;

    const products = await dashboardService.getTopProducts({
      limit: parseInt(limit),
      period,
      lang,
    });

    // Format products for frontend
    const formattedProducts = (products || []).map(p => ({
      id: p.product_id || p.id,
      productId: p.product_id || p.id,
      product_id: p.product_id || p.id,
      name: p.name || p.product_name,
      productName: p.name || p.product_name,
      product_name: p.name || p.product_name,
      image: p.image || p.primary_image,
      primaryImage: p.primary_image || p.image,
      primary_image: p.primary_image || p.image,
      totalSold: p.total_sold || p.totalSold || 0,
      total_sold: p.total_sold || p.totalSold || 0,
      totalRevenue: parseFloat(p.total_revenue || p.totalRevenue) || 0,
      total_revenue: parseFloat(p.total_revenue || p.totalRevenue) || 0,
      price: parseFloat(p.price) || 0,
    }));

    return successResponse(res, formattedProducts, 'Top products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top categories by sales
 */
const getTopCategories = async (req, res, next) => {
  try {
    const { limit = 10, period = 'month', lang = 'en' } = req.query;

    const categories = await dashboardService.getTopCategories({
      limit: parseInt(limit),
      period,
      lang,
    });

    const formattedCategories = (categories || []).map(c => ({
      id: c.category_id || c.id,
      categoryId: c.category_id || c.id,
      category_id: c.category_id || c.id,
      name: c.name || c.category_name,
      categoryName: c.name || c.category_name,
      category_name: c.name || c.category_name,
      totalSold: c.total_sold || c.totalSold || 0,
      total_sold: c.total_sold || c.totalSold || 0,
      totalRevenue: parseFloat(c.total_revenue || c.totalRevenue) || 0,
      total_revenue: parseFloat(c.total_revenue || c.totalRevenue) || 0,
      orderCount: c.order_count || c.orderCount || 0,
      order_count: c.order_count || c.orderCount || 0,
    }));

    return successResponse(res, formattedCategories, 'Top categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top customers by spending
 */
const getTopCustomers = async (req, res, next) => {
  try {
    const { limit = 10, period = 'month' } = req.query;

    const customers = await dashboardService.getTopCustomers({
      limit: parseInt(limit),
      period,
    });

    const formattedCustomers = (customers || []).map(c => ({
      id: c.user_id || c.id,
      userId: c.user_id || c.id,
      user_id: c.user_id || c.id,
      name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.username,
      email: c.email,
      avatar: c.profile_image || c.avatar,
      profileImage: c.profile_image || c.avatar,
      profile_image: c.profile_image || c.avatar,
      totalSpent: parseFloat(c.total_spent || c.totalSpent) || 0,
      total_spent: parseFloat(c.total_spent || c.totalSpent) || 0,
      orderCount: c.order_count || c.orderCount || 0,
      order_count: c.order_count || c.orderCount || 0,
    }));

    return successResponse(res, formattedCustomers, 'Top customers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent orders
 */
const getRecentOrders = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const orders = await dashboardService.getRecentOrders({
      limit: parseInt(limit),
    });

    const formattedOrders = (orders || []).map(o => ({
      id: o.order_id || o.id,
      orderId: o.order_id || o.id,
      order_id: o.order_id || o.id,
      orderNumber: o.order_number,
      order_number: o.order_number,
      userName: o.user_name || `${o.first_name || ''} ${o.last_name || ''}`.trim(),
      user_name: o.user_name || `${o.first_name || ''} ${o.last_name || ''}`.trim(),
      userEmail: o.user_email || o.email,
      user_email: o.user_email || o.email,
      total: parseFloat(o.total_amount || o.total) || 0,
      totalAmount: parseFloat(o.total_amount || o.total) || 0,
      total_amount: parseFloat(o.total_amount || o.total) || 0,
      status: o.status,
      paymentStatus: o.payment_status,
      payment_status: o.payment_status,
      createdAt: o.created_at,
      created_at: o.created_at,
    }));

    return successResponse(res, formattedOrders, 'Recent orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent users
 */
const getRecentUsers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const users = await dashboardService.getRecentUsers({
      limit: parseInt(limit),
    });

    const formattedUsers = (users || []).map(u => ({
      id: u.user_id || u.id,
      userId: u.user_id || u.id,
      user_id: u.user_id || u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
      username: u.username,
      email: u.email,
      avatar: u.profile_image || u.avatar,
      profileImage: u.profile_image || u.avatar,
      profile_image: u.profile_image || u.avatar,
      status: u.status,
      createdAt: u.created_at,
      created_at: u.created_at,
    }));

    return successResponse(res, formattedUsers, 'Recent users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const { limit = 10, threshold = 10, lang = 'en' } = req.query;

    const products = await dashboardService.getLowStockProducts({
      limit: parseInt(limit),
      threshold: parseInt(threshold),
      lang,
    });

    const formattedProducts = (products || []).map(p => ({
      id: p.product_id || p.id,
      productId: p.product_id || p.id,
      product_id: p.product_id || p.id,
      name: p.name || p.product_name,
      productName: p.name || p.product_name,
      product_name: p.name || p.product_name,
      sku: p.sku,
      stockQuantity: p.stock_quantity || p.stockQuantity || 0,
      stock_quantity: p.stock_quantity || p.stockQuantity || 0,
      image: p.image || p.primary_image,
    }));

    return successResponse(res, formattedProducts, 'Low stock products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get out of stock products
 */
const getOutOfStockProducts = async (req, res, next) => {
  try {
    const { limit = 10, lang = 'en' } = req.query;

    const products = await dashboardService.getOutOfStockProducts({
      limit: parseInt(limit),
      lang,
    });

    const formattedProducts = (products || []).map(p => ({
      id: p.product_id || p.id,
      productId: p.product_id || p.id,
      product_id: p.product_id || p.id,
      name: p.name || p.product_name,
      productName: p.name || p.product_name,
      product_name: p.name || p.product_name,
      sku: p.sku,
      stockQuantity: 0,
      stock_quantity: 0,
      image: p.image || p.primary_image,
    }));

    return successResponse(res, formattedProducts, 'Out of stock products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending orders count
 */
const getPendingOrdersCount = async (req, res, next) => {
  try {
    const count = await dashboardService.getPendingOrdersCount();
    return successResponse(res, { count, pendingOrders: count, pending_orders: count }, 'Pending orders count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread messages count
 */
const getUnreadMessagesCount = async (req, res, next) => {
  try {
    const count = await dashboardService.getUnreadMessagesCount();
    return successResponse(res, { count, unreadMessages: count, unread_messages: count }, 'Unread messages count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending reviews count
 */
const getPendingReviewsCount = async (req, res, next) => {
  try {
    const count = await dashboardService.getPendingReviewsCount();
    return successResponse(res, { count, pendingReviews: count, pending_reviews: count }, 'Pending reviews count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders by status distribution
 */
const getOrdersByStatus = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const distribution = await dashboardService.getOrdersByStatus({ period });

    return successResponse(res, distribution, 'Orders by status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders by payment method distribution
 */
const getOrdersByPaymentMethod = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const distribution = await dashboardService.getOrdersByPaymentMethod({ period });

    return successResponse(res, distribution, 'Orders by payment method retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get users growth chart
 */
const getUsersGrowthChart = async (req, res, next) => {
  try {
    const { period = 'month', group_by, groupBy } = req.query;

    const chartData = await dashboardService.getUsersGrowthChart({
      period,
      group_by: group_by || groupBy || 'day',
    });

    const formattedData = {
      labels: chartData.labels || [],
      data: chartData.data || chartData.values || [],
      values: chartData.values || chartData.data || [],
      datasets: chartData.datasets || [{
        label: 'New Users',
        data: chartData.data || chartData.values || [],
      }],
    };

    return successResponse(res, formattedData, 'Users growth chart data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top cities by orders
 */
const getTopCities = async (req, res, next) => {
  try {
    const { limit = 10, period = 'month' } = req.query;

    const cities = await dashboardService.getTopCities({
      limit: parseInt(limit),
      period,
    });

    return successResponse(res, cities, 'Top cities retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get average order value
 */
const getAverageOrderValue = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const aov = await dashboardService.getAverageOrderValue({ period });

    return successResponse(res, {
      value: aov.value || aov.average || 0,
      average: aov.value || aov.average || 0,
      averageOrderValue: aov.value || aov.average || 0,
      average_order_value: aov.value || aov.average || 0,
      change: aov.change || 0,
      changePercent: aov.change_percent || aov.changePercent || 0,
      change_percent: aov.change_percent || aov.changePercent || 0,
    }, 'Average order value retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversion rate
 */
const getConversionRate = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const rate = await dashboardService.getConversionRate({ period });

    return successResponse(res, {
      rate: rate.rate || rate.value || 0,
      value: rate.rate || rate.value || 0,
      conversionRate: rate.rate || rate.value || 0,
      conversion_rate: rate.rate || rate.value || 0,
      change: rate.change || 0,
    }, 'Conversion rate retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get today's statistics
 */
const getTodayStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getTodayStats();
    return successResponse(res, formatStats(stats), 'Today statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get comparison with previous period
 */
const getPeriodComparison = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const comparison = await dashboardService.getPeriodComparison({ period });

    return successResponse(res, formatStats(comparison), 'Period comparison retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get real-time statistics
 */
const getRealTimeStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getRealTimeStats();
    return successResponse(res, formatStats(stats), 'Real-time statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get notifications summary
 */
const getNotificationsSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getNotificationsSummary();
    return successResponse(res, summary, 'Notifications summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity feed
 */
const getActivityFeed = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await dashboardService.getActivityFeed({
      limit: parseInt(limit),
    });

    return successResponse(res, activities, 'Activity feed retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get system health
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const health = await dashboardService.getSystemHealth();
    return successResponse(res, health, 'System health retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory summary
 */
const getInventorySummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getInventorySummary();
    return successResponse(res, formatStats(summary), 'Inventory summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer analytics
 */
const getCustomerAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const analytics = await dashboardService.getCustomerAnalytics({ period });

    return successResponse(res, formatStats(analytics), 'Customer analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product performance
 */
const getProductPerformance = async (req, res, next) => {
  try {
    const { period = 'month', limit = 10, lang = 'en' } = req.query;

    const performance = await dashboardService.getProductPerformance({
      period,
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, performance, 'Product performance retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales by hour
 */
const getSalesByHour = async (req, res, next) => {
  try {
    const sales = await dashboardService.getSalesByHour();
    return successResponse(res, sales, 'Sales by hour retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales by day of week
 */
const getSalesByDayOfWeek = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const sales = await dashboardService.getSalesByDayOfWeek({ period });

    return successResponse(res, sales, 'Sales by day of week retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Export dashboard report
 */
const exportDashboardReport = async (req, res, next) => {
  try {
    const { format = 'pdf', period = 'month' } = req.query;

    const reportBuffer = await dashboardService.exportDashboardReport({
      format,
      period,
    });

    const contentType = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=dashboard-report.${extension}`);
    res.send(reportBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Get widget data by type
 */
const getWidgetData = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { period = 'month', limit = 10, lang = 'en' } = req.query;

    const validWidgets = [
      'revenue', 'orders', 'customers', 'products',
      'top_products', 'top_categories', 'recent_orders',
      'low_stock', 'pending_orders', 'sales_chart'
    ];

    if (!validWidgets.includes(type)) {
      return errorResponse(
        res,
        'Invalid widget type',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const data = await dashboardService.getWidgetData(type, {
      period,
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, data, `Widget data retrieved successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh dashboard cache
 */
const refreshCache = async (req, res, next) => {
  try {
    await dashboardService.refreshCache();
    return successResponse(res, null, 'Dashboard cache refreshed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getSalesStats,
  getOrdersStats,
  getRevenueChart,
  getOrdersChart,
  getTopProducts,
  getTopCategories,
  getTopCustomers,
  getRecentOrders,
  getRecentUsers,
  getLowStockProducts,
  getOutOfStockProducts,
  getPendingOrdersCount,
  getUnreadMessagesCount,
  getPendingReviewsCount,
  getOrdersByStatus,
  getOrdersByPaymentMethod,
  getUsersGrowthChart,
  getTopCities,
  getAverageOrderValue,
  getConversionRate,
  getTodayStats,
  getPeriodComparison,
  getRealTimeStats,
  getNotificationsSummary,
  getActivityFeed,
  getSystemHealth,
  getInventorySummary,
  getCustomerAnalytics,
  getProductPerformance,
  getSalesByHour,
  getSalesByDayOfWeek,
  exportDashboardReport,
  getWidgetData,
  refreshCache,
};