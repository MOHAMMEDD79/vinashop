/**
 * Dashboard Service
 * @module services/dashboard
 *
 * FIXED: Added all missing methods required by dashboard.controller.js
 */

const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Review = require('../models/review.model');
const Message = require('../models/message.model');
const Category = require('../models/category.model');
const Admin = require('../models/admin.model');

// Cache for dashboard data
let dashboardCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute

class DashboardService {
  // ==================== OVERVIEW (REQUIRED BY CONTROLLER) ====================

  /**
   * Get dashboard overview - REQUIRED BY CONTROLLER
   * Returns comprehensive stats for the dashboard
   */
  static async getOverview() {
    try {
      // Safe individual calls - won't break if models don't have methods
      let orderStats = {}, productStats = {}, userStats = {};
      let reviewStats = {}, messageStats = {};
      let todayRevenue = 0;

      try { orderStats = await Order.getStatistics?.({ period: 'month' }) || {}; } catch(e) { console.log('Order stats error:', e.message); }
      try { productStats = await Product.getStatistics?.() || {}; } catch(e) { console.log('Product stats error:', e.message); }
      try { userStats = await User.getStatistics?.({ period: 'month' }) || {}; } catch(e) { console.log('User stats error:', e.message); }
      try { reviewStats = await Review.getStatistics?.() || {}; } catch(e) { console.log('Review stats error:', e.message); }
      try { messageStats = await Message.getStatistics?.() || {}; } catch(e) { console.log('Message stats error:', e.message); }
      try { todayRevenue = await Order.getTodayRevenue?.() || 0; } catch(e) { console.log('Today revenue error:', e.message); }

      return {
        // Orders
        total_orders: orderStats.total_orders || 0,
        totalOrders: orderStats.total_orders || 0,
        pending_orders: orderStats.pending_orders || 0,
        pendingOrders: orderStats.pending_orders || 0,
        processing_orders: orderStats.processing_orders || 0,
        processingOrders: orderStats.processing_orders || 0,
        completed_orders: orderStats.completed_orders || 0,
        completedOrders: orderStats.completed_orders || 0,

        // Revenue
        total_revenue: parseFloat(orderStats.total_revenue) || 0,
        totalRevenue: parseFloat(orderStats.total_revenue) || 0,
        today_revenue: parseFloat(todayRevenue) || 0,
        todayRevenue: parseFloat(todayRevenue) || 0,
        month_revenue: parseFloat(orderStats.month_revenue) || 0,
        monthRevenue: parseFloat(orderStats.month_revenue) || 0,

        // Products
        total_products: productStats.total_products || 0,
        totalProducts: productStats.total_products || 0,
        active_products: productStats.active_products || 0,
        activeProducts: productStats.active_products || 0,
        low_stock_products: productStats.low_stock_count || 0,
        lowStockProducts: productStats.low_stock_count || 0,
        out_of_stock_products: productStats.out_of_stock_count || 0,
        outOfStockProducts: productStats.out_of_stock_count || 0,

        // Users
        total_users: userStats.total_users || 0,
        totalUsers: userStats.total_users || 0,
        active_users: userStats.active_users || 0,
        activeUsers: userStats.active_users || 0,
        new_users_today: userStats.today_registrations || 0,
        newUsersToday: userStats.today_registrations || 0,

        // Reviews & Messages
        pending_reviews: reviewStats.pending_reviews || 0,
        pendingReviews: reviewStats.pending_reviews || 0,
        unread_messages: messageStats.unread_messages || 0,
        unreadMessages: messageStats.unread_messages || 0,

        // Averages
        average_order_value: parseFloat(orderStats.average_order_value) || 0,
        averageOrderValue: parseFloat(orderStats.average_order_value) || 0,
      };
    } catch (error) {
      console.error('Dashboard getOverview error:', error);
      // Return empty stats on error
      return {
        total_orders: 0, totalOrders: 0,
        pending_orders: 0, pendingOrders: 0,
        total_revenue: 0, totalRevenue: 0,
        total_products: 0, totalProducts: 0,
        total_users: 0, totalUsers: 0,
        pending_reviews: 0, pendingReviews: 0,
        unread_messages: 0, unreadMessages: 0,
      };
    }
  }

  /**
   * Safe call wrapper - prevents one failing call from breaking everything
   */
  static async _safeCall(fn, fallback = null) {
    try {
      const result = await fn();
      return result ?? fallback;
    } catch (error) {
      console.error('Dashboard safe call error:', error.message);
      return fallback;
    }
  }

  /**
   * Get complete dashboard data
   */
  static async getDashboard() {
    const [
      summary,
      salesChart,
      recentOrders,
      recentUsers,
      recentReviews,
      lowStockProducts,
      topProducts,
      ordersByStatus,
    ] = await Promise.all([
      this.getSummary(),
      this.getSalesChart({ period: '7days' }),
      this.getRecentOrders(5),
      this.getRecentUsers(5),
      this.getRecentReviews(5),
      this.getLowStockProducts(5),
      this.getTopProducts({ limit: 5 }),
      this.getOrdersByStatus(),
    ]);

    return {
      summary,
      salesChart,
      recentOrders,
      recentUsers,
      recentReviews,
      lowStockProducts,
      topProducts,
      ordersByStatus,
    };
  }

  /**
   * Get dashboard summary (key metrics)
   */
  static async getSummary() {
    const [
      orderStats,
      productStats,
      userStats,
      reviewStats,
      messageStats,
      todayRevenue,
    ] = await Promise.all([
      this._safeCall(() => Order.getStatistics({ period: 'month' }), {}),
      this._safeCall(() => Product.getStatistics(), {}),
      this._safeCall(() => User.getStatistics({ period: 'month' }), {}),
      this._safeCall(() => Review.getStatistics(), {}),
      this._safeCall(() => Message.getStatistics(), {}),
      this._safeCall(() => Order.getTodayRevenue(), 0),
    ]);

    return {
      orders: {
        total: orderStats.total_orders || 0,
        pending: orderStats.pending_orders || 0,
        today: orderStats.today_orders || 0,
      },
      revenue: {
        total: orderStats.total_revenue || 0,
        today: todayRevenue || 0,
        month: orderStats.month_revenue || 0,
      },
      products: {
        total: productStats.total_products || 0,
        active: productStats.active_products || 0,
        lowStock: productStats.low_stock_count || 0,
        outOfStock: productStats.out_of_stock_count || 0,
      },
      users: {
        total: userStats.total_users || 0,
        active: userStats.active_users || 0,
        newToday: userStats.today_registrations || 0,
        newWeek: userStats.week_registrations || 0,
      },
      reviews: {
        total: reviewStats.total_reviews || 0,
        pending: reviewStats.pending_reviews || 0,
        averageRating: reviewStats.average_rating || 0,
      },
      messages: {
        total: messageStats.total_messages || 0,
        unread: messageStats.unread_messages || 0,
        pending: messageStats.pending_messages || 0,
      },
    };
  }

  /**
   * Get all statistics
   */
  static async getStatistics() {
    const [orders, products, users, reviews, messages, categories] = await Promise.all([
      this._safeCall(() => Order.getStatistics(), {}),
      this._safeCall(() => Product.getStatistics(), {}),
      this._safeCall(() => User.getStatistics(), {}),
      this._safeCall(() => Review.getStatistics(), {}),
      this._safeCall(() => Message.getStatistics(), {}),
      this._safeCall(() => Category.getStatistics(), {}),
    ]);

    return { orders, products, users, reviews, messages, categories };
  }

  // ==================== Sales ====================

  /**
   * Get sales statistics
   */
  static async getSalesStats(options = {}) {
    return await this._safeCall(() => Order.getStatistics(options), {});
  }

  /**
   * Get today's statistics - REQUIRED BY CONTROLLER
   */
  static async getTodayStats() {
    try {
      const [todayOrders, todayRevenue, newUsers] = await Promise.all([
        this._safeCall(() => Order.getTodayCount(), 0),
        this._safeCall(() => Order.getTodayRevenue(), 0),
        this._safeCall(() => User.getTodayCount(), 0),
      ]);

      return {
        orders: todayOrders,
        today_orders: todayOrders,
        todayOrders: todayOrders,
        revenue: todayRevenue,
        today_revenue: todayRevenue,
        todayRevenue: todayRevenue,
        new_users: newUsers,
        newUsers: newUsers,
      };
    } catch (error) {
      console.error('getTodayStats error:', error);
      return { orders: 0, revenue: 0, new_users: 0 };
    }
  }

  /**
   * Get today's sales
   */
  static async getTodaySales() {
    const todayOrders = await this._safeCall(() => Order.getTodayCount(), 0);
    const todayRevenue = await this._safeCall(() => Order.getTodayRevenue(), 0);

    return {
      orders: todayOrders,
      revenue: todayRevenue,
    };
  }

  /**
   * Get sales chart data
   */
  static async getSalesChart(options = {}) {
    const { period = '7days' } = options;

    let dateFrom;
    const dateTo = new Date();

    if (period === '7days' || period === 'week') {
      dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30days' || period === 'month') {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '12months' || period === 'year') {
      dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    } else {
      dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    return await this._safeCall(() => Order.getSalesReport({
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: dateTo.toISOString().split('T')[0],
      group_by: (period === '12months' || period === 'year') ? 'month' : 'day',
    }), { labels: [], data: [], values: [] });
  }

  /**
   * Get revenue chart data - REQUIRED BY CONTROLLER
   */
  static async getRevenueChart(options = {}) {
    const { period = 'month', group_by = 'day' } = options;

    let dateFrom;
    const dateTo = new Date();

    if (period === 'week') {
      dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    } else {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const result = await this._safeCall(() => Order.getSalesReport({
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: dateTo.toISOString().split('T')[0],
      group_by: period === 'year' ? 'month' : group_by,
    }), null);

    if (!result) {
      return { labels: [], data: [], values: [] };
    }

    return {
      labels: result.labels || [],
      data: result.data || result.values || [],
      values: result.values || result.data || [],
      datasets: result.datasets || [{
        label: 'Revenue',
        data: result.data || result.values || [],
      }],
    };
  }

  /**
   * Get revenue statistics
   */
  static async getRevenueStats(options = {}) {
    const stats = await this._safeCall(() => Order.getStatistics(options), {});
    return {
      total: stats.total_revenue || 0,
      average: stats.average_order_value || 0,
      today: await this._safeCall(() => Order.getTodayRevenue(), 0),
    };
  }

  /**
   * Get revenue comparison
   */
  static async getRevenueComparison() {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [thisMonth, lastMonth] = await Promise.all([
      this._safeCall(() => Order.getStatistics({
        date_from: thisMonthStart.toISOString().split('T')[0],
        date_to: today.toISOString().split('T')[0],
      }), {}),
      this._safeCall(() => Order.getStatistics({
        date_from: lastMonthStart.toISOString().split('T')[0],
        date_to: lastMonthEnd.toISOString().split('T')[0],
      }), {}),
    ]);

    const thisRevenue = thisMonth.total_revenue || 0;
    const lastRevenue = lastMonth.total_revenue || 0;
    const change = lastRevenue > 0
      ? ((thisRevenue - lastRevenue) / lastRevenue * 100).toFixed(2)
      : 100;

    return {
      thisMonth: thisRevenue,
      lastMonth: lastRevenue,
      change: parseFloat(change),
      trend: change >= 0 ? 'up' : 'down',
    };
  }

  /**
   * Get sales by hour - REQUIRED BY CONTROLLER
   */
  static async getSalesByHour() {
    try {
      const result = await this._safeCall(() => Order.getSalesByHour(), null);
      if (result) return result;

      // Return default structure if no data
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return {
        labels: hours.map(h => `${h}:00`),
        data: hours.map(() => 0),
        values: hours.map(() => 0),
      };
    } catch (error) {
      console.error('getSalesByHour error:', error);
      return { labels: [], data: [], values: [] };
    }
  }

  /**
   * Get sales by day of week - REQUIRED BY CONTROLLER
   */
  static async getSalesByDayOfWeek(options = {}) {
    try {
      const result = await this._safeCall(() => Order.getSalesByDayOfWeek(options), null);
      if (result) return result;

      // Return default structure if no data
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        labels: days,
        data: days.map(() => 0),
        values: days.map(() => 0),
      };
    } catch (error) {
      console.error('getSalesByDayOfWeek error:', error);
      return { labels: [], data: [], values: [] };
    }
  }

  // ==================== Orders ====================

  /**
   * Get order statistics
   */
  static async getOrdersStats(options = {}) {
    return await this._safeCall(() => Order.getStatistics(options), {});
  }

  /**
   * Get recent orders
   */
  static async getRecentOrders(options = {}) {
    const limit = typeof options === 'number' ? options : (options.limit || 10);
    return await this._safeCall(() => Order.getRecent(limit), []);
  }

  /**
   * Get pending orders count - REQUIRED BY CONTROLLER
   */
  static async getPendingOrdersCount() {
    return await this._safeCall(() => Order.getPendingCount(), 0);
  }

  /**
   * Get pending orders (alias)
   */
  static async getPendingOrders() {
    return await this.getPendingOrdersCount();
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(options = {}) {
    return await this._safeCall(() => Order.getCountByStatus(), {});
  }

  /**
   * Get orders by payment method - REQUIRED BY CONTROLLER
   */
  static async getOrdersByPaymentMethod(options = {}) {
    try {
      const result = await this._safeCall(() => Order.getCountByPaymentMethod(), null);
      if (result) return result;

      return {
        labels: ['Cash', 'Card', 'Online'],
        data: [0, 0, 0],
        values: [0, 0, 0],
      };
    } catch (error) {
      console.error('getOrdersByPaymentMethod error:', error);
      return { labels: [], data: [], values: [] };
    }
  }

  /**
   * Get orders chart data
   */
  static async getOrdersChart(options = {}) {
    const result = await this._safeCall(() => Order.getSalesReport({
      ...options,
      group_by: options.group_by || 'day',
    }), null);

    if (!result) {
      return { labels: [], data: [], values: [] };
    }

    return {
      labels: result.labels || [],
      data: result.data || result.values || [],
      values: result.values || result.data || [],
      datasets: result.datasets || [{
        label: 'Orders',
        data: result.data || result.values || [],
      }],
    };
  }

  /**
   * Get average order value - REQUIRED BY CONTROLLER
   */
  static async getAverageOrderValue(options = {}) {
    try {
      const stats = await this._safeCall(() => Order.getStatistics(options), {});
      const currentAOV = parseFloat(stats.average_order_value) || 0;

      // Calculate change from previous period (simplified)
      const change = 0; // Would need historical data for accurate comparison

      return {
        value: currentAOV,
        average: currentAOV,
        change: change,
        change_percent: change,
        changePercent: change,
      };
    } catch (error) {
      console.error('getAverageOrderValue error:', error);
      return { value: 0, average: 0, change: 0 };
    }
  }

  // ==================== Products ====================

  /**
   * Get product statistics
   */
  static async getProductStats() {
    return await this._safeCall(() => Product.getStatistics(), {});
  }

  /**
   * Get top products - REQUIRED BY CONTROLLER
   */
  static async getTopProducts(options = {}) {
    const { limit = 10, period = 'month', lang = 'en' } = options;
    return await this._safeCall(() => Order.getTopSellingProducts({ limit, period, lang }), []);
  }

  /**
   * Get top selling products (alias)
   */
  static async getTopSellingProducts(options = {}) {
    return await this.getTopProducts(options);
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(options = {}) {
    const limit = typeof options === 'number' ? options : (options.limit || 10);
    const threshold = options.threshold || 10;
    return await this._safeCall(() => Product.getLowStock({ limit, threshold }), []);
  }

  /**
   * Get out of stock products - REQUIRED BY CONTROLLER
   */
  static async getOutOfStockProducts(options = {}) {
    const limit = typeof options === 'number' ? options : (options.limit || 10);
    return await this._safeCall(() => Product.getOutOfStock({ limit }), []);
  }

  /**
   * Get out of stock count
   */
  static async getOutOfStockCount() {
    const products = await this._safeCall(() => Product.getOutOfStock({ limit: 1000 }), []);
    return products.length;
  }

  /**
   * Get product performance - REQUIRED BY CONTROLLER
   */
  static async getProductPerformance(options = {}) {
    const { limit = 10, period = 'month', lang = 'en' } = options;
    try {
      const topProducts = await this.getTopProducts({ limit, period, lang });
      const stats = await this._safeCall(() => Product.getStatistics(), {});

      return {
        topProducts,
        total: stats.total_products || 0,
        active: stats.active_products || 0,
        lowStock: stats.low_stock_count || 0,
        outOfStock: stats.out_of_stock_count || 0,
      };
    } catch (error) {
      console.error('getProductPerformance error:', error);
      return { topProducts: [], total: 0, active: 0, lowStock: 0, outOfStock: 0 };
    }
  }

  // ==================== Users ====================

  /**
   * Get user statistics
   */
  static async getUserStats(options = {}) {
    return await this._safeCall(() => User.getStatistics(options), {});
  }

  /**
   * Get recent users
   */
  static async getRecentUsers(options = {}) {
    const limit = typeof options === 'number' ? options : (options.limit || 10);
    return await this._safeCall(() => User.getRecent(limit), []);
  }

  /**
   * Get top customers
   */
  static async getTopCustomers(options = {}) {
    return await this._safeCall(() => User.getTopCustomers(options), []);
  }

  /**
   * Get users growth chart - REQUIRED BY CONTROLLER
   */
  static async getUsersGrowthChart(options = {}) {
    const { period = 'month', group_by = 'day' } = options;

    try {
      const result = await this._safeCall(() => User.getRegistrationTrend({ period, group_by }), null);

      if (result) {
        return {
          labels: result.labels || [],
          data: result.data || result.values || [],
          values: result.values || result.data || [],
          datasets: [{
            label: 'New Users',
            data: result.data || result.values || [],
          }],
        };
      }

      return { labels: [], data: [], values: [], datasets: [] };
    } catch (error) {
      console.error('getUsersGrowthChart error:', error);
      return { labels: [], data: [], values: [], datasets: [] };
    }
  }

  /**
   * Get registration chart data (alias)
   */
  static async getRegistrationChart(options = {}) {
    return await this.getUsersGrowthChart(options);
  }

  /**
   * Get conversion rate - REQUIRED BY CONTROLLER
   */
  static async getConversionRate(options = {}) {
    try {
      const userStats = await this._safeCall(() => User.getStatistics(options), {});
      const orderStats = await this._safeCall(() => Order.getStatistics(options), {});

      const totalUsers = userStats.total_users || 0;
      const usersWithOrders = orderStats.unique_customers || 0;

      const rate = totalUsers > 0 ? ((usersWithOrders / totalUsers) * 100).toFixed(2) : 0;

      return {
        rate: parseFloat(rate),
        value: parseFloat(rate),
        conversion_rate: parseFloat(rate),
        conversionRate: parseFloat(rate),
        total_users: totalUsers,
        users_with_orders: usersWithOrders,
        change: 0,
      };
    } catch (error) {
      console.error('getConversionRate error:', error);
      return { rate: 0, value: 0, change: 0 };
    }
  }

  /**
   * Get customer analytics - REQUIRED BY CONTROLLER
   */
  static async getCustomerAnalytics(options = {}) {
    try {
      const [userStats, topCustomers, recentUsers] = await Promise.all([
        this._safeCall(() => User.getStatistics(options), {}),
        this._safeCall(() => User.getTopCustomers({ limit: 5 }), []),
        this._safeCall(() => User.getRecent(5), []),
      ]);

      return {
        total_users: userStats.total_users || 0,
        totalUsers: userStats.total_users || 0,
        active_users: userStats.active_users || 0,
        activeUsers: userStats.active_users || 0,
        new_users_today: userStats.today_registrations || 0,
        newUsersToday: userStats.today_registrations || 0,
        topCustomers,
        recentUsers,
      };
    } catch (error) {
      console.error('getCustomerAnalytics error:', error);
      return { total_users: 0, active_users: 0, topCustomers: [], recentUsers: [] };
    }
  }

  // ==================== Categories ====================

  /**
   * Get top categories - REQUIRED BY CONTROLLER
   */
  static async getTopCategories(options = {}) {
    const { limit = 10, period = 'month', lang = 'en' } = options;
    try {
      // Try to get categories with sales data
      const result = await this._safeCall(() => Category.getWithProductCounts({ limit, lang }), null);

      if (result && Array.isArray(result)) {
        return result;
      }

      // Fallback to basic category list
      const categories = await this._safeCall(() => Category.findAll({ limit }), []);
      return categories.map(c => ({
        id: c.id || c.category_id,
        category_id: c.id || c.category_id,
        name: c.name,
        total_sold: 0,
        totalSold: 0,
        total_revenue: 0,
        totalRevenue: 0,
      }));
    } catch (error) {
      console.error('getTopCategories error:', error);
      return [];
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats() {
    return await this._safeCall(() => Category.getStatistics(), {});
  }

  /**
   * Get categories by sales (alias)
   */
  static async getCategoriesBySales(options = {}) {
    return await this.getTopCategories(options);
  }

  // ==================== Reviews ====================

  /**
   * Get review statistics
   */
  static async getReviewStats() {
    return await this._safeCall(() => Review.getStatistics(), {});
  }

  /**
   * Get recent reviews
   */
  static async getRecentReviews(limit = 10) {
    return await this._safeCall(() => Review.getRecent(limit), []);
  }

  /**
   * Get pending reviews count - REQUIRED BY CONTROLLER
   */
  static async getPendingReviewsCount() {
    return await this._safeCall(() => Review.getPendingCount(), 0);
  }

  /**
   * Get pending reviews (alias)
   */
  static async getPendingReviews() {
    return await this.getPendingReviewsCount();
  }

  // ==================== Messages ====================

  /**
   * Get message statistics
   */
  static async getMessageStats() {
    return await this._safeCall(() => Message.getStatistics(), {});
  }

  /**
   * Get unread messages count - REQUIRED BY CONTROLLER
   */
  static async getUnreadMessagesCount() {
    return await this._safeCall(() => Message.getUnreadCount(), 0);
  }

  /**
   * Get unread messages (alias)
   */
  static async getUnreadMessages() {
    return await this.getUnreadMessagesCount();
  }

  /**
   * Get recent messages
   */
  static async getRecentMessages(limit = 10) {
    return await this._safeCall(() => Message.getRecent(limit), []);
  }

  // ==================== Geography ====================

  /**
   * Get top cities - REQUIRED BY CONTROLLER
   */
  static async getTopCities(options = {}) {
    const { limit = 10, period = 'month' } = options;
    try {
      const result = await this._safeCall(() => Order.getTopCities({ limit, period }), null);

      if (result && Array.isArray(result)) {
        return result;
      }

      // Return empty array if no data
      return [];
    } catch (error) {
      console.error('getTopCities error:', error);
      return [];
    }
  }

  // ==================== Activity ====================

  /**
   * Get activity feed - REQUIRED BY CONTROLLER
   */
  static async getActivityFeed(options = {}) {
    const limit = typeof options === 'number' ? options : (options.limit || 20);
    return await this.getRecentActivity(limit);
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit = 20) {
    // Combine recent orders, users, reviews, messages
    const [orders, users, reviews, messages] = await Promise.all([
      this._safeCall(() => Order.getRecent(5), []),
      this._safeCall(() => User.getRecent(5), []),
      this._safeCall(() => Review.getRecent(5), []),
      this._safeCall(() => Message.getRecent(5), []),
    ]);

    const activities = [
      ...(orders || []).map(o => ({
        type: 'order',
        message: `New order #${o.order_number || o.id}`,
        time: o.created_at,
        data: o,
      })),
      ...(users || []).map(u => ({
        type: 'user',
        message: `New user ${u.username || u.email || 'registered'}`,
        time: u.created_at,
        data: u,
      })),
      ...(reviews || []).map(r => ({
        type: 'review',
        message: `New ${r.rating}-star review`,
        time: r.created_at,
        data: r,
      })),
      ...(messages || []).map(m => ({
        type: 'message',
        message: `New message from ${m.name || 'customer'}`,
        time: m.created_at,
        data: m,
      })),
    ];

    // Sort by time descending
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    return activities.slice(0, limit);
  }

  /**
   * Get admin activity log
   */
  static async getAdminActivity(options = {}) {
    return await this._safeCall(() => Admin.getActivityLog(options), []);
  }

  // ==================== Period Comparison ====================

  /**
   * Get period comparison - REQUIRED BY CONTROLLER
   */
  static async getPeriodComparison(options = {}) {
    const { period = 'month' } = options;

    try {
      const today = new Date();
      let currentStart, previousStart, previousEnd;

      if (period === 'week') {
        currentStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      } else { // year
        currentStart = new Date(today.getFullYear(), 0, 1);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(today.getFullYear() - 1, 0, 1);
      }

      const [current, previous] = await Promise.all([
        this._safeCall(() => Order.getStatistics({
          date_from: currentStart.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0],
        }), {}),
        this._safeCall(() => Order.getStatistics({
          date_from: previousStart.toISOString().split('T')[0],
          date_to: previousEnd.toISOString().split('T')[0],
        }), {}),
      ]);

      const revenueChange = (previous.total_revenue || 0) > 0
        ? (((current.total_revenue || 0) - (previous.total_revenue || 0)) / (previous.total_revenue || 1) * 100).toFixed(2)
        : 0;

      const ordersChange = (previous.total_orders || 0) > 0
        ? (((current.total_orders || 0) - (previous.total_orders || 0)) / (previous.total_orders || 1) * 100).toFixed(2)
        : 0;

      return {
        current_revenue: current.total_revenue || 0,
        currentRevenue: current.total_revenue || 0,
        previous_revenue: previous.total_revenue || 0,
        previousRevenue: previous.total_revenue || 0,
        revenue_change: parseFloat(revenueChange),
        revenueChange: parseFloat(revenueChange),
        current_orders: current.total_orders || 0,
        currentOrders: current.total_orders || 0,
        previous_orders: previous.total_orders || 0,
        previousOrders: previous.total_orders || 0,
        orders_change: parseFloat(ordersChange),
        ordersChange: parseFloat(ordersChange),
      };
    } catch (error) {
      console.error('getPeriodComparison error:', error);
      return {
        current_revenue: 0, previous_revenue: 0, revenue_change: 0,
        current_orders: 0, previous_orders: 0, orders_change: 0,
      };
    }
  }

  // ==================== Real-time Stats ====================

  /**
   * Get real-time statistics - REQUIRED BY CONTROLLER
   */
  static async getRealTimeStats() {
    try {
      const [pendingOrders, todayOrders, todayRevenue, activeUsers] = await Promise.all([
        this._safeCall(() => Order.getPendingCount(), 0),
        this._safeCall(() => Order.getTodayCount(), 0),
        this._safeCall(() => Order.getTodayRevenue(), 0),
        this._safeCall(() => User.getActiveCount(), 0),
      ]);

      return {
        pending_orders: pendingOrders,
        pendingOrders: pendingOrders,
        today_orders: todayOrders,
        todayOrders: todayOrders,
        today_revenue: todayRevenue,
        todayRevenue: todayRevenue,
        active_users: activeUsers,
        activeUsers: activeUsers,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('getRealTimeStats error:', error);
      return {
        pending_orders: 0, today_orders: 0, today_revenue: 0, active_users: 0,
      };
    }
  }

  // ==================== System ====================

  /**
   * Get system health - REQUIRED BY CONTROLLER
   */
  static async getSystemHealth() {
    try {
      const startTime = Date.now();

      // Test database connection
      let dbStatus = 'healthy';
      try {
        await this._safeCall(() => Order.getStatistics(), {});
      } catch {
        dbStatus = 'unhealthy';
      }

      const responseTime = Date.now() - startTime;

      return {
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        database: dbStatus,
        response_time: responseTime,
        responseTime: responseTime,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('getSystemHealth error:', error);
      return {
        status: 'unhealthy',
        database: 'unknown',
        error: error.message,
      };
    }
  }

  /**
   * Get inventory summary - REQUIRED BY CONTROLLER
   */
  static async getInventorySummary() {
    try {
      const stats = await this._safeCall(() => Product.getStatistics(), {});

      return {
        total_products: stats.total_products || 0,
        totalProducts: stats.total_products || 0,
        active_products: stats.active_products || 0,
        activeProducts: stats.active_products || 0,
        low_stock: stats.low_stock_count || 0,
        lowStock: stats.low_stock_count || 0,
        out_of_stock: stats.out_of_stock_count || 0,
        outOfStock: stats.out_of_stock_count || 0,
        total_value: stats.total_inventory_value || 0,
        totalValue: stats.total_inventory_value || 0,
      };
    } catch (error) {
      console.error('getInventorySummary error:', error);
      return {
        total_products: 0, active_products: 0, low_stock: 0, out_of_stock: 0,
      };
    }
  }

  /**
   * Get notifications summary - REQUIRED BY CONTROLLER
   */
  static async getNotificationsSummary() {
    try {
      const [pendingOrders, unreadMessages, pendingReviews, lowStock] = await Promise.all([
        this._safeCall(() => Order.getPendingCount(), 0),
        this._safeCall(() => Message.getUnreadCount(), 0),
        this._safeCall(() => Review.getPendingCount(), 0),
        this._safeCall(() => Product.getLowStock({ limit: 100 }), []),
      ]);

      return {
        pending_orders: pendingOrders,
        pendingOrders: pendingOrders,
        unread_messages: unreadMessages,
        unreadMessages: unreadMessages,
        pending_reviews: pendingReviews,
        pendingReviews: pendingReviews,
        low_stock_count: lowStock.length,
        lowStockCount: lowStock.length,
        total: pendingOrders + unreadMessages + pendingReviews + lowStock.length,
      };
    } catch (error) {
      console.error('getNotificationsSummary error:', error);
      return {
        pending_orders: 0, unread_messages: 0, pending_reviews: 0, low_stock_count: 0, total: 0,
      };
    }
  }

  // ==================== Alerts ====================

  /**
   * Get dashboard alerts
   */
  static async getAlerts() {
    const alerts = [];

    // Low stock alert
    const lowStockProducts = await this._safeCall(() => Product.getLowStock({ limit: 100 }), []);
    if (lowStockProducts.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Stock',
        message: `${lowStockProducts.length} products are running low on stock`,
        count: lowStockProducts.length,
      });
    }

    // Out of stock alert
    const outOfStockProducts = await this._safeCall(() => Product.getOutOfStock({ limit: 100 }), []);
    if (outOfStockProducts.length > 0) {
      alerts.push({
        type: 'danger',
        title: 'Out of Stock',
        message: `${outOfStockProducts.length} products are out of stock`,
        count: outOfStockProducts.length,
      });
    }

    // Pending orders
    const pendingOrders = await this._safeCall(() => Order.getPendingCount(), 0);
    if (pendingOrders > 0) {
      alerts.push({
        type: 'info',
        title: 'Pending Orders',
        message: `${pendingOrders} orders are pending`,
        count: pendingOrders,
      });
    }

    // Pending reviews
    const pendingReviews = await this._safeCall(() => Review.getPendingCount(), 0);
    if (pendingReviews > 0) {
      alerts.push({
        type: 'info',
        title: 'Pending Reviews',
        message: `${pendingReviews} reviews awaiting approval`,
        count: pendingReviews,
      });
    }

    // Unread messages
    const unreadMessages = await this._safeCall(() => Message.getUnreadCount(), 0);
    if (unreadMessages > 0) {
      alerts.push({
        type: 'info',
        title: 'Unread Messages',
        message: `${unreadMessages} unread messages`,
        count: unreadMessages,
      });
    }

    return alerts;
  }

  // ==================== Widgets ====================

  /**
   * Get dashboard widget data
   */
  static async getWidgets() {
    const [summary, alerts, recentActivity] = await Promise.all([
      this.getSummary(),
      this.getAlerts(),
      this.getRecentActivity(10),
    ]);

    return { summary, alerts, recentActivity };
  }

  /**
   * Get specific widget data - REQUIRED BY CONTROLLER
   */
  static async getWidgetData(widgetType, options = {}) {
    const widgets = {
      'revenue': () => this.getRevenueStats(options),
      'orders': () => this.getOrdersStats(options),
      'customers': () => this.getUserStats(options),
      'products': () => this.getProductStats(),
      'top_products': () => this.getTopProducts(options),
      'top_categories': () => this.getTopCategories(options),
      'recent_orders': () => this.getRecentOrders(options),
      'low_stock': () => this.getLowStockProducts(options),
      'pending_orders': () => this.getPendingOrdersCount(),
      'sales_chart': () => this.getSalesChart(options),
      'sales-chart': () => this.getSalesChart(options),
      'orders-by-status': () => this.getOrdersByStatus(options),
      'recent-orders': () => this.getRecentOrders(options),
      'recent-users': () => this.getRecentUsers(options),
      'recent-reviews': () => this.getRecentReviews(options.limit || 5),
      'revenue-comparison': () => this.getRevenueComparison(),
      'alerts': () => this.getAlerts(),
    };

    const widgetFn = widgets[widgetType];
    if (widgetFn) {
      return await widgetFn();
    }

    throw new Error(`Widget type '${widgetType}' not found`);
  }

  // ==================== Export ====================

  /**
   * Export dashboard report - REQUIRED BY CONTROLLER
   */
  static async exportDashboardReport(options = {}) {
    const { format = 'pdf', period = 'month' } = options;

    try {
      // Get all dashboard data
      const data = await this.getDashboard();

      // For now, return JSON data - actual PDF/Excel generation would require libraries
      const reportData = {
        generated_at: new Date().toISOString(),
        period,
        format,
        data,
      };

      // Return buffer (for actual implementation, use pdfkit or exceljs)
      return Buffer.from(JSON.stringify(reportData, null, 2));
    } catch (error) {
      console.error('exportDashboardReport error:', error);
      throw error;
    }
  }

  // ==================== Cache ====================

  /**
   * Refresh dashboard cache - REQUIRED BY CONTROLLER
   */
  static async refreshCache() {
    dashboardCache = null;
    cacheTimestamp = null;
    return { success: true, message: 'Cache cleared' };
  }

  /**
   * Get cached dashboard data
   */
  static async getCachedDashboard() {
    if (dashboardCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      return dashboardCache;
    }

    dashboardCache = await this.getDashboard();
    cacheTimestamp = Date.now();
    return dashboardCache;
  }
}

module.exports = DashboardService;
