import { useState, useEffect, useCallback } from 'react';
import {
  FiShoppingCart, FiDollarSign, FiBox, FiTrendingUp, FiTrendingDown,
  FiClock, FiAlertTriangle, FiPackage, FiCalendar, FiRefreshCw,
  FiArrowUp, FiArrowDown, FiMinus
} from 'react-icons/fi';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { dashboardAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import './Dashboard.css';

const COLORS = ['#d4af37', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard data states
  const [overview, setOverview] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [periodComparison, setPeriodComparison] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch all dashboard data in parallel
      const [
        overviewRes,
        todayRes,
        comparisonRes,
        revenueRes,
        ordersStatusRes,
        topProductsRes,
        lowStockRes,
        recentOrdersRes,
        inventoryRes
      ] = await Promise.allSettled([
        dashboardAPI.getOverview(),
        dashboardAPI.getTodayStats(),
        dashboardAPI.getPeriodComparison({ period: 'month' }),
        dashboardAPI.getRevenueChart({ period: 'month' }),
        dashboardAPI.getOrdersByStatus(),
        dashboardAPI.getTopProducts({ limit: 5 }),
        dashboardAPI.getLowStockProducts({ limit: 5 }),
        dashboardAPI.getRecentOrders({ limit: 5 }),
        dashboardAPI.getInventorySummary()
      ]);

      // Process responses safely
      if (overviewRes.status === 'fulfilled' && overviewRes.value?.data?.success) {
        setOverview(overviewRes.value.data.data);
      }

      if (todayRes.status === 'fulfilled' && todayRes.value?.data?.success) {
        setTodayStats(todayRes.value.data.data);
      }

      if (comparisonRes.status === 'fulfilled' && comparisonRes.value?.data?.success) {
        setPeriodComparison(comparisonRes.value.data.data);
      }

      if (revenueRes.status === 'fulfilled' && revenueRes.value?.data?.success) {
        const chartData = revenueRes.value.data.data;
        if (chartData?.labels && chartData?.data) {
          setRevenueChart(chartData.labels.map((label, i) => ({
            name: label,
            revenue: chartData.data[i] || 0
          })));
        }
      }

      if (ordersStatusRes.status === 'fulfilled' && ordersStatusRes.value?.data?.success) {
        const statusData = ordersStatusRes.value.data.data;
        if (statusData) {
          const formattedStatus = Object.entries(statusData).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: typeof value === 'number' ? value : 0
          })).filter(item => item.value > 0);
          setOrdersByStatus(formattedStatus);
        }
      }

      if (topProductsRes.status === 'fulfilled' && topProductsRes.value?.data?.success) {
        setTopProducts(topProductsRes.value.data.data || []);
      }

      if (lowStockRes.status === 'fulfilled' && lowStockRes.value?.data?.success) {
        setLowStockProducts(lowStockRes.value.data.data || []);
      }

      if (recentOrdersRes.status === 'fulfilled' && recentOrdersRes.value?.data?.success) {
        setRecentOrders(recentOrdersRes.value.data.data || []);
      }

      if (inventoryRes.status === 'fulfilled' && inventoryRes.value?.data?.success) {
        setInventorySummary(inventoryRes.value.data.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchDashboardData(true), 300000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    return `₪${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num) => {
    return parseFloat(num || 0).toLocaleString('en-US');
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <FiArrowUp className="change-icon up" />;
    if (change < 0) return <FiArrowDown className="change-icon down" />;
    return <FiMinus className="change-icon neutral" />;
  };

  const getChangeClass = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-info',
      shipped: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const thisMonthRevenue = periodComparison?.currentRevenue || overview?.monthRevenue || 0;
  const lastMonthRevenue = periodComparison?.previousRevenue || 0;
  const revenueChange = periodComparison?.revenueChange || 0;

  // Calculate yearly revenue (approximate from monthly * 12 or use overview data)
  const yearlyRevenue = overview?.totalRevenue || 0;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{t('dashboard.title') || 'Analytics Dashboard'}</h1>
          <p className="page-subtitle">Overview of your store performance</p>
        </div>
        <button
          className="btn btn-secondary refresh-btn"
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Today's Quick Stats */}
      <div className="section-title">
        <FiCalendar /> Today's Performance
      </div>
      <div className="stats-grid stats-grid-4">
        <div className="stat-card highlight">
          <div className="stat-info">
            <h3>Today's Revenue</h3>
            <p className="stat-value">{formatCurrency(todayStats?.todayRevenue || overview?.todayRevenue)}</p>
          </div>
          <div className="stat-icon gold"><FiDollarSign /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Today's Orders</h3>
            <p className="stat-value">{formatNumber(todayStats?.todayOrders || overview?.todayOrders || 0)}</p>
          </div>
          <div className="stat-icon blue"><FiShoppingCart /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Pending Orders</h3>
            <p className="stat-value">{formatNumber(overview?.pendingOrders || 0)}</p>
          </div>
          <div className="stat-icon red"><FiClock /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Avg. Order Value</h3>
            <p className="stat-value">{formatCurrency(overview?.averageOrderValue)}</p>
          </div>
          <div className="stat-icon green"><FiTrendingUp /></div>
        </div>
      </div>

      {/* Revenue Comparison Section */}
      <div className="section-title">
        <FiDollarSign /> Revenue Analytics
      </div>
      <div className="stats-grid stats-grid-3">
        <div className="stat-card large">
          <div className="stat-info">
            <h3>This Month</h3>
            <p className="stat-value large">{formatCurrency(thisMonthRevenue)}</p>
            <div className={`stat-change ${getChangeClass(revenueChange)}`}>
              {getChangeIcon(revenueChange)}
              <span>{Math.abs(revenueChange).toFixed(1)}% vs last month</span>
            </div>
          </div>
          <div className="stat-icon gold large"><FiTrendingUp /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Last Month</h3>
            <p className="stat-value">{formatCurrency(lastMonthRevenue)}</p>
            <span className="stat-label">Previous period</span>
          </div>
          <div className="stat-icon gray"><FiCalendar /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <p className="stat-value">{formatCurrency(yearlyRevenue)}</p>
            <span className="stat-label">All time</span>
          </div>
          <div className="stat-icon green"><FiDollarSign /></div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Revenue Trend Chart */}
        <div className="chart-card large">
          <div className="card-header">
            <h2>Revenue Trend (Last 30 Days)</h2>
          </div>
          <div className="chart-container">
            {revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c8" />
                  <XAxis dataKey="name" stroke="#8b7355" fontSize={12} />
                  <YAxis stroke="#8b7355" fontSize={12} tickFormatter={(v) => `₪${v}`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ background: '#fff', border: '1px solid #e0d5c8', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d4af37"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No revenue data available</div>
            )}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="chart-card">
          <div className="card-header">
            <h2>Orders by Status</h2>
          </div>
          <div className="chart-container">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No order data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory & Products Section */}
      <div className="section-title">
        <FiBox /> Inventory & Products
      </div>
      <div className="stats-grid stats-grid-4">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Products</h3>
            <p className="stat-value">{formatNumber(overview?.totalProducts || inventorySummary?.totalProducts || 0)}</p>
          </div>
          <div className="stat-icon blue"><FiBox /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Active Products</h3>
            <p className="stat-value">{formatNumber(overview?.activeProducts || inventorySummary?.activeProducts || 0)}</p>
          </div>
          <div className="stat-icon green"><FiPackage /></div>
        </div>
        <div className="stat-card warning">
          <div className="stat-info">
            <h3>Low Stock</h3>
            <p className="stat-value">{formatNumber(overview?.lowStockProducts || inventorySummary?.lowStock || 0)}</p>
          </div>
          <div className="stat-icon yellow"><FiAlertTriangle /></div>
        </div>
        <div className="stat-card danger">
          <div className="stat-info">
            <h3>Out of Stock</h3>
            <p className="stat-value">{formatNumber(overview?.outOfStockProducts || inventorySummary?.outOfStock || 0)}</p>
          </div>
          <div className="stat-icon red"><FiTrendingDown /></div>
        </div>
      </div>

      {/* Top Products & Low Stock Section */}
      <div className="data-row">
        {/* Top Selling Products */}
        <div className="card">
          <div className="card-header">
            <h2><FiTrendingUp /> Top Selling Products</h2>
          </div>
          <div className="table-container">
            {topProducts.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={product.product_id || index}>
                      <td><span className="rank-badge">{index + 1}</span></td>
                      <td>{product.product_name || product.name || 'Unknown Product'}</td>
                      <td><strong>{formatNumber(product.total_sold || product.totalSold || 0)}</strong></td>
                      <td className="revenue-cell">{formatCurrency(product.total_revenue || product.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No sales data yet</div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h2><FiAlertTriangle className="warning-icon" /> Low Stock Alert</h2>
          </div>
          <div className="table-container">
            {lowStockProducts.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product, index) => (
                    <tr key={product.product_id || index}>
                      <td>{product.product_name || product.name || 'Unknown'}</td>
                      <td><code>{product.sku || '-'}</code></td>
                      <td>
                        <span className={`stock-badge ${product.stock_quantity <= 5 ? 'critical' : 'warning'}`}>
                          {product.stock_quantity || 0}
                        </span>
                      </td>
                      <td>
                        {product.stock_quantity === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : product.stock_quantity <= 5 ? (
                          <span className="badge badge-danger">Critical</span>
                        ) : (
                          <span className="badge badge-warning">Low</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state success">
                <FiPackage />
                <p>All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <h2><FiShoppingCart /> Recent Orders</h2>
        </div>
        <div className="table-container">
          {recentOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td><strong>#{order.order_number || order.order_id}</strong></td>
                    <td>{order.customer_name || order.full_name || order.guest_name || 'Guest'}</td>
                    <td className="revenue-cell">{formatCurrency(order.total_amount)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No orders yet</div>
          )}
        </div>
      </div>

      {/* Quick Summary Footer */}
      <div className="summary-footer">
        <div className="summary-item">
          <span className="summary-label">Total Orders</span>
          <span className="summary-value">{formatNumber(overview?.totalOrders || 0)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Revenue</span>
          <span className="summary-value">{formatCurrency(overview?.totalRevenue)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Pending Reviews</span>
          <span className="summary-value">{formatNumber(overview?.pendingReviews || 0)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Unread Messages</span>
          <span className="summary-value">{formatNumber(overview?.unreadMessages || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
