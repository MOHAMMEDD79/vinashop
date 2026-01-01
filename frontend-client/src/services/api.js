// VinaShop Client API Service
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/public`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

// ==================== Categories ====================
export const categoryApi = {
  // Get all categories with subcategories
  getAll: (lang) => api.get(`/categories?lang=${lang || getCurrentLang()}`),

  // Get category by ID or slug
  getById: (id, lang) => api.get(`/categories/${id}?lang=${lang || getCurrentLang()}`),

  // Get category tree (nested structure)
  getTree: (lang) => api.get(`/categories/tree?lang=${lang || getCurrentLang()}`),

  // Get products by category
  getProducts: (categoryId, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('lang', params.lang || getCurrentLang());
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sort) queryParams.append('sort', params.sort);
    return api.get(`/categories/${categoryId}/products?${queryParams.toString()}`);
  }
};

// ==================== Subcategories ====================
export const subcategoryApi = {
  // Get subcategory by ID with nested subcategories
  getById: (id, lang) => api.get(`/subcategories/${id}?lang=${lang || getCurrentLang()}`),

  // Get products by subcategory (includes nested subcategory products)
  getProducts: (subcategoryId, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('lang', params.lang || getCurrentLang());
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.minPrice) queryParams.append('min_price', params.minPrice);
    if (params.maxPrice) queryParams.append('max_price', params.maxPrice);
    if (params.includeChildren !== undefined) queryParams.append('include_children', params.includeChildren);
    return api.get(`/subcategories/${subcategoryId}/products?${queryParams.toString()}`);
  }
};

// Helper to get current language
const getCurrentLang = () => localStorage.getItem('language') || 'en';

// ==================== Products ====================
export const productApi = {
  // Get products with filters (supports both legacy colors/sizes and new option_values)
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('lang', params.lang || getCurrentLang());

    if (params.category) queryParams.append('category_id', params.category);
    if (params.subcategory) queryParams.append('subcategory_id', params.subcategory);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('min_price', params.minPrice);
    if (params.maxPrice) queryParams.append('max_price', params.maxPrice);

    // Legacy filters (still supported)
    if (params.colors) queryParams.append('colors', params.colors);
    if (params.sizes) queryParams.append('sizes', params.sizes);

    // New option-based filters (option_type_id: option_value_id pairs)
    // Format: options[type_id]=value_id or options=type1:val1,type2:val2
    if (params.options) {
      if (typeof params.options === 'object') {
        Object.entries(params.options).forEach(([typeId, valueId]) => {
          queryParams.append(`option_${typeId}`, valueId);
        });
      } else {
        queryParams.append('options', params.options);
      }
    }

    if (params.sort) queryParams.append('sort', params.sort);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    return api.get(`/products?${queryParams.toString()}`);
  },

  // Get product by ID or slug
  getById: (id, lang) => api.get(`/products/${id}?lang=${lang || getCurrentLang()}`),

  // Get featured products
  getFeatured: (limit = 8, lang) => api.get(`/products/featured?limit=${limit}&lang=${lang || getCurrentLang()}`),

  // Get new arrivals
  getNewArrivals: (limit = 8, lang) => api.get(`/products/new-arrivals?limit=${limit}&lang=${lang || getCurrentLang()}`),

  // Get best sellers
  getBestSellers: (limit = 8, lang) => api.get(`/products/best-sellers?limit=${limit}&lang=${lang || getCurrentLang()}`),

  // Get related/similar products
  getSimilar: (productId, limit = 4, lang) => api.get(`/products/${productId}/related?limit=${limit}&lang=${lang || getCurrentLang()}`),

  // Get product reviews
  getReviews: (productId, page = 1) => api.get(`/products/${productId}/reviews?page=${page}`),

  // Search products
  search: (query, lang) => api.get(`/products/search?q=${encodeURIComponent(query)}&lang=${lang || getCurrentLang()}`),

  // Submit a review
  submitReview: (productId, reviewData) => api.post(`/products/${productId}/reviews`, reviewData)
};

// ==================== Cart (Guest) ====================
export const cartApi = {
  // Get cart by session ID
  get: (sessionId) => api.get(`/cart/${sessionId}`),

  // Create or update cart
  update: (sessionId, items) => api.post('/cart', { session_id: sessionId, items }),

  // Add item to cart
  addItem: (sessionId, item) => api.post('/cart/add', { session_id: sessionId, ...item }),

  // Remove item from cart
  removeItem: (sessionId, itemId) => api.delete(`/cart/${sessionId}/item/${itemId}`),

  // Clear cart
  clear: (sessionId) => api.delete(`/cart/${sessionId}`)
};

// ==================== Orders (Guest) ====================
export const orderApi = {
  // Create guest order
  create: (orderData) => api.post('/orders', orderData),

  // Get order by ID (for confirmation page)
  getById: (orderId) => api.get(`/orders/${orderId}`),

  // Track order by order number
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`)
};

// ==================== Contact ====================
export const contactApi = {
  // Submit contact form
  submit: (data) => api.post('/contact', data)
};

// ==================== Banners ====================
export const bannerApi = {
  // Get all active banners
  getAll: (lang) => api.get(`/banners?lang=${lang || getCurrentLang()}`),

  // Get homepage banners
  getHomepage: (lang) => api.get(`/banners/homepage?lang=${lang || getCurrentLang()}`)
};

// ==================== Settings ====================
export const settingsApi = {
  // Get public store settings
  get: () => api.get('/settings'),

  // Get about us content
  getAbout: () => api.get('/settings/about'),

  // Get contact info
  getContact: () => api.get('/settings/contact')
};

// ==================== Filters ====================
export const filterApi = {
  // Get available colors (legacy - still works)
  getColors: (lang) => api.get(`/filters/colors?lang=${lang || getCurrentLang()}`),

  // Get available sizes (legacy - still works)
  getSizes: (lang) => api.get(`/filters/sizes?lang=${lang || getCurrentLang()}`),

  // Get price range
  getPriceRange: () => api.get('/filters/price-range'),

  // NEW: Get all option types with values (dynamic filters)
  getOptionTypes: (lang, categoryId = null) => {
    const params = new URLSearchParams();
    params.append('lang', lang || getCurrentLang());
    if (categoryId) params.append('category_id', categoryId);
    return api.get(`/filters/options?${params.toString()}`);
  },

  // Get option types for a specific category
  getOptionTypesByCategory: (categoryId, lang) =>
    api.get(`/filters/options/${categoryId}?lang=${lang || getCurrentLang()}`)
};

// ==================== Product Combinations ====================
export const combinationApi = {
  // Get combinations for a product
  getByProduct: (productId) => api.get(`/products/${productId}/combinations`),

  // Find combination by selected option values
  findByOptions: (productId, optionValues) =>
    api.post(`/products/${productId}/combinations/find`, { option_values: optionValues }),

  // Calculate price for option values
  calculatePrice: (productId, optionValues) =>
    api.post(`/products/${productId}/combinations/price`, { option_values: optionValues }),

  // Check stock for a combination
  checkStock: (productId, optionValues) =>
    api.post(`/products/${productId}/combinations/stock`, { option_values: optionValues })
};

export default api;
