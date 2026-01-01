import axios from 'axios';

// Get API URL from environment variable, with fallback
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vinashop.ps';
const API_URL = `${API_BASE}/api/admin/v1`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log(token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors - don't auto-redirect, let ProtectedRoute handle auth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log 401 errors for debugging but don't auto-redirect
    if (error.response?.status === 401) {
      console.log('API 401 error:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Dashboard - Enhanced Analytics
export const dashboardAPI = {
  // Core stats
  getStats: () => api.get('/dashboard'),
  getOverview: () => api.get('/dashboard/overview'),
  getTodayStats: () => api.get('/dashboard/today'),
  getRealTimeStats: () => api.get('/dashboard/realtime'),

  // Revenue & Sales
  getRevenueChart: (params) => api.get('/dashboard/revenue/chart', { params }),
  getSalesStats: (params) => api.get('/dashboard/sales', { params }),
  getSalesByHour: () => api.get('/dashboard/sales/by-hour'),
  getSalesByDay: () => api.get('/dashboard/sales/by-day'),
  getPeriodComparison: (params) => api.get('/dashboard/comparison', { params }),

  // Orders
  getRecentOrders: (params) => api.get('/dashboard/orders/recent', { params }),
  getOrdersByStatus: () => api.get('/dashboard/orders/by-status'),
  getOrdersChart: (params) => api.get('/dashboard/orders/chart', { params }),
  getAverageOrderValue: () => api.get('/dashboard/orders/aov'),
  getPendingOrders: () => api.get('/dashboard/orders/pending'),

  // Products
  getTopProducts: (params) => api.get('/dashboard/products/top', { params }),
  getLowStockProducts: (params) => api.get('/dashboard/products/low-stock', { params }),
  getOutOfStockProducts: () => api.get('/dashboard/products/out-of-stock'),
  getProductPerformance: (params) => api.get('/dashboard/products', { params }),

  // Categories
  getTopCategories: (params) => api.get('/dashboard/categories/top', { params }),

  // Inventory & Alerts
  getInventorySummary: () => api.get('/dashboard/inventory'),
  getNotifications: () => api.get('/dashboard/notifications'),

  // Activity
  getActivityFeed: (params) => api.get('/dashboard/activity', { params }),

  // Export
  exportReport: (params) => api.get('/dashboard/export', { params, responseType: 'blob' }),
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  toggleStatus: (id) => api.patch(`/products/${id}/status`),
  getStatistics: () => api.get('/products/statistics'),
};

// Categories
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  getTree: () => api.get('/categories/tree'),
};

// Subcategories (with nested hierarchy support)
export const subcategoriesAPI = {
  getAll: (params) => api.get('/subcategories', { params }),
  getById: (id) => api.get(`/subcategories/${id}`),
  create: (data) => api.post('/subcategories', data),
  update: (id, data) => api.put(`/subcategories/${id}`, data),
  delete: (id) => api.delete(`/subcategories/${id}`),
  // Nested hierarchy methods
  getByCategory: (categoryId, params) => api.get(`/subcategories/category/${categoryId}`, { params }),
  getChildren: (parentId, params) => api.get(`/subcategories/${parentId}/children`, { params }),
  getRoots: (categoryId) => api.get(`/subcategories/category/${categoryId}/roots`),
  getTree: (categoryId) => api.get(`/subcategories/category/${categoryId}/tree`),
  getParentChain: (id) => api.get(`/subcategories/${id}/parent-chain`),
  moveToParent: (id, parentId) => api.patch(`/subcategories/${id}/move`, { parent_id: parentId }),
};

// Orders
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  cancel: (id, data) => api.patch(`/orders/${id}/cancel`, data),
  getStatistics: () => api.get('/orders/statistics'),
  getCountByStatus: () => api.get('/orders/status-count'),
  // Order items editing
  addItem: (orderId, data) => api.post(`/orders/${orderId}/items`, data),
  updateItem: (orderId, itemId, data) => api.put(`/orders/${orderId}/items/${itemId}`, data),
  removeItem: (orderId, itemId) => api.delete(`/orders/${orderId}/items/${itemId}`),
};

// Users
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  getStatistics: () => api.get('/users/statistics'),
};

// Admins
export const adminsAPI = {
  getAll: (params) => api.get('/admins', { params }),
  getById: (id) => api.get(`/admins/${id}`),
  create: (data) => api.post('/admins', data),
  update: (id, data) => api.put(`/admins/${id}`, data),
  delete: (id) => api.delete(`/admins/${id}`),
  toggleStatus: (id) => api.patch(`/admins/${id}/status`),
};

// Billing - Invoices
export const invoicesAPI = {
  getAll: (params) => api.get('/billing/invoices', { params }),
  getById: (id) => api.get(`/billing/invoices/${id}`),
  create: (data) => api.post('/billing/invoices', data),
  update: (id, data) => api.put(`/billing/invoices/${id}`, data),
  delete: (id) => api.delete(`/billing/invoices/${id}`),
  markPaid: (id) => api.patch(`/billing/invoices/${id}/paid`),
  getStatistics: () => api.get('/billing/statistics'),
};

// Bill Images
export const billImagesAPI = {
  getAll: (params) => api.get('/bill-images', { params }),
  getById: (id) => api.get(`/bill-images/${id}`),
  upload: (formData) => api.post('/bill-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/bill-images/${id}`, data),
  delete: (id) => api.delete(`/bill-images/${id}`),
  markProcessed: (id) => api.patch(`/bill-images/${id}/processed`),
  getStatistics: () => api.get('/bill-images/statistics'),
  getUnprocessed: () => api.get('/bill-images/unprocessed'),
};

// Product Options
export const productOptionsAPI = {
  getTypes: (params) => api.get('/product-options/types', { params }),
  getTypeById: (id) => api.get(`/product-options/types/${id}`),
  createType: (data) => api.post('/product-options/types', data),
  updateType: (id, data) => api.put(`/product-options/types/${id}`, data),
  deleteType: (id) => api.delete(`/product-options/types/${id}`),
  createValue: (typeId, data) => api.post(`/product-options/types/${typeId}/values`, data),
  createValuesBulk: (typeId, data) => api.post(`/product-options/types/${typeId}/values/bulk`, data),
  updateValue: (id, data) => api.put(`/product-options/values/${id}`, data),
  deleteValue: (id) => api.delete(`/product-options/values/${id}`),
  getProductOptions: (productId) => api.get(`/product-options/products/${productId}`),
  setProductOptions: (productId, data) => api.put(`/product-options/products/${productId}`, data),
  getStatistics: () => api.get('/product-options/statistics'),
};

// REMOVED: optionCombinationsAPI - combinations system deprecated (Dec 28, 2025)
// Use simple options with main product stock instead

// Data Migration (Admin only)
export const dataMigrationAPI = {
  getStatus: () => api.get('/migration/status'),
  runFullMigration: () => api.post('/migration/run'),
  rollback: () => api.post('/migration/rollback'),
  migrateColors: () => api.post('/migration/colors'),
  migrateSizes: () => api.post('/migration/sizes'),
  migrateVariants: () => api.post('/migration/variants'),
};

// Colors - DEPRECATED: Use productOptionsAPI instead
// Colors are now managed as option values with type_id for "Color" type
export const colorsAPI = {
  getAll: (params) => api.get('/colors', { params }),
  create: (data) => api.post('/colors', data),
  update: (id, data) => api.put(`/colors/${id}`, data),
  delete: (id) => api.delete(`/colors/${id}`),
};

// Sizes - DEPRECATED: Use productOptionsAPI instead
// Sizes are now managed as option values with type_id for "Size" type
export const sizesAPI = {
  getAll: (params) => api.get('/sizes', { params }),
  create: (data) => api.post('/sizes', data),
  update: (id, data) => api.put(`/sizes/${id}`, data),
  delete: (id) => api.delete(`/sizes/${id}`),
};

// Settings
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getByGroup: (group) => api.get(`/settings/group/${group}`),
};

// Reviews
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  approve: (id) => api.patch(`/reviews/${id}/approve`),
  reject: (id) => api.patch(`/reviews/${id}/reject`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Messages
export const messagesAPI = {
  getAll: (params) => api.get('/messages', { params }),
  getById: (id) => api.get(`/messages/${id}`),
  reply: (id, data) => api.post(`/messages/${id}/reply`, data),
  updateStatus: (id, data) => api.put(`/messages/${id}/status`, data),
  delete: (id) => api.delete(`/messages/${id}`),
};

// ==================== Test APIs (for development) ====================

export const testAPI = {
  getUsers: (params) => api.get('/test/users-public', { params }),
  getProducts: (params) => api.get('/test/products', { params }),
  getOrders: (params) => api.get('/test/orders-public', { params }),
  getOrderById: (id) => api.get(`/test/orders-public/${id}`),
};

// ==================== Phase 2 - New APIs ====================

// Customer Bills
export const customerBillsAPI = {
  getAll: (params) => api.get('/customer-bills', { params }),
  getById: (id) => api.get(`/customer-bills/${id}`),
  create: (data) => api.post('/customer-bills', data),
  update: (id, data) => api.put(`/customer-bills/${id}`, data),
  delete: (id) => api.delete(`/customer-bills/${id}`),
  addItem: (billId, data) => api.post(`/customer-bills/${billId}/items`, data),
  updateItem: (billId, itemId, data) => api.put(`/customer-bills/${billId}/items/${itemId}`, data),
  removeItem: (billId, itemId) => api.delete(`/customer-bills/${billId}/items/${itemId}`),
  recordPayment: (billId, data) => api.post(`/customer-bills/${billId}/payment`, data),
  getPrintData: (id) => api.get(`/customer-bills/${id}/print`),
  getStatistics: () => api.get('/customer-bills/statistics'),
  getByUser: (userId, params) => api.get(`/customer-bills/user/${userId}`, { params }),
  createFromOrder: (orderId) => api.post(`/customer-bills/from-order/${orderId}`),
};

// Customer Debts
export const customerDebtsAPI = {
  getAll: (params) => api.get('/customer-debts', { params }),
  getById: (id) => api.get(`/customer-debts/${id}`),
  create: (data) => api.post('/customer-debts', data),
  update: (id, data) => api.put(`/customer-debts/${id}`, data),
  delete: (id) => api.delete(`/customer-debts/${id}`),
  recordPayment: (debtId, data) => api.post(`/customer-debts/${debtId}/payment`, data),
  getPayments: (debtId) => api.get(`/customer-debts/${debtId}/payments`),
  getStatistics: () => api.get('/customer-debts/statistics'),
  getOverdue: (params) => api.get('/customer-debts/overdue', { params }),
  getCustomersWithDebt: (params) => api.get('/customer-debts/customers', { params }),
  getByUser: (userId, params) => api.get(`/customer-debts/user/${userId}`, { params }),
  getUserSummary: (userId) => api.get(`/customer-debts/user/${userId}/summary`),
};

// Workers (Super Admin Only)
export const workersAPI = {
  getAll: (params) => api.get('/workers', { params }),
  getById: (id) => api.get(`/workers/${id}`),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
  recordAttendance: (workerId, data) => api.post(`/workers/${workerId}/attendance`, data),
  getAttendance: (workerId, params) => api.get(`/workers/${workerId}/attendance`, { params }),
  generateSalary: (workerId, data) => api.post(`/workers/${workerId}/salary`, data),
  getSalaryHistory: (workerId, params) => api.get(`/workers/${workerId}/salary-history`, { params }),
  getSalaryPreview: (workerId, params) => api.get(`/workers/${workerId}/salary-preview`, { params }),
  updateSalary: (salaryId, data) => api.put(`/workers/salaries/${salaryId}`, data),
  markSalaryPaid: (salaryId, data) => api.patch(`/workers/salaries/${salaryId}/pay`, data),
  getStatistics: () => api.get('/workers/statistics'),
  getMonthlyReport: (year, month) => api.get(`/workers/monthly-report/${year}/${month}`),
  getPositions: () => api.get('/workers/positions'),
  // New endpoints for past salaries and unpaid workers
  getAllSalariesByPeriod: (year, month, params) => api.get(`/workers/salaries/${year}/${month}`, { params }),
  getUnpaidWorkers: (year, month) => api.get(`/workers/unpaid/${year}/${month}`),
  getPastSalariesReport: (params) => api.get('/workers/past-salaries', { params }),
};

// Traders (Super Admin Only)
export const tradersAPI = {
  getAll: (params) => api.get('/traders', { params }),
  getById: (id) => api.get(`/traders/${id}`),
  create: (data) => api.post('/traders', data),
  update: (id, data) => api.put(`/traders/${id}`, data),
  delete: (id) => api.delete(`/traders/${id}`),
  getBills: (traderId, params) => api.get(`/traders/${traderId}/bills`, { params }),
  getBillById: (billId) => api.get(`/traders/bills/${billId}`),
  createBill: (traderId, data) => api.post(`/traders/${traderId}/bills`, data),
  updateBill: (billId, data) => api.put(`/traders/bills/${billId}`, data),
  deleteBill: (billId) => api.delete(`/traders/bills/${billId}`),
  addBillItem: (billId, data) => api.post(`/traders/bills/${billId}/items`, data),
  recordPayment: (traderId, data) => api.post(`/traders/${traderId}/payment`, data),
  getPayments: (traderId, params) => api.get(`/traders/${traderId}/payments`, { params }),
  getBalance: (traderId) => api.get(`/traders/${traderId}/balance`),
  getStatistics: () => api.get('/traders/statistics'),
};

// Wholesalers
export const wholesalersAPI = {
  getAll: (params) => api.get('/wholesalers', { params }),
  getById: (id) => api.get(`/wholesalers/${id}`),
  create: (data) => api.post('/wholesalers', data),
  update: (id, data) => api.put(`/wholesalers/${id}`, data),
  delete: (id) => api.delete(`/wholesalers/${id}`),
  getOrders: (wholesalerId, params) => api.get(`/wholesalers/${wholesalerId}/orders`, { params }),
  getOrderById: (orderId) => api.get(`/wholesalers/orders/${orderId}`),
  createOrder: (wholesalerId, data) => api.post(`/wholesalers/${wholesalerId}/orders`, data),
  updateOrder: (orderId, data) => api.put(`/wholesalers/orders/${orderId}`, data),
  deleteOrder: (orderId) => api.delete(`/wholesalers/orders/${orderId}`),
  addOrderItem: (orderId, data) => api.post(`/wholesalers/orders/${orderId}/items`, data),
  recordPayment: (wholesalerId, data) => api.post(`/wholesalers/${wholesalerId}/payment`, data),
  getPayments: (wholesalerId, params) => api.get(`/wholesalers/${wholesalerId}/payments`, { params }),
  getBalance: (wholesalerId) => api.get(`/wholesalers/${wholesalerId}/balance`),
  getStatistics: () => api.get('/wholesalers/statistics'),
};

export default api;
