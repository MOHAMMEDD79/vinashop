/**
 * Application Constants
 * @module config/constants
 */

module.exports = {
  // ==========================================
  // APP CONFIGURATION
  // ==========================================
  APP: {
    NAME: 'VinaShop Admin',
    VERSION: '1.0.0',
    DESCRIPTION: 'VinaShop E-commerce Admin Panel',
    DEFAULT_LANGUAGE: 'ar',
    SUPPORTED_LANGUAGES: ['en', 'ar'],
    RTL_LANGUAGES: ['ar'],
    DEFAULT_TIMEZONE: 'Asia/Jerusalem',
    DEFAULT_CURRENCY: 'ILS',
    CURRENCY_SYMBOL: '₪',
  },

  // ==========================================
  // PAGINATION
  // ==========================================
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
  },

  // ==========================================
  // USER ROLES
  // ==========================================
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },

  ROLE_HIERARCHY: {
    super_admin: 3,
    admin: 2,
    moderator: 1,
  },

  // ==========================================
  // PERMISSIONS
  // ==========================================
  PERMISSIONS: {
    // Dashboard
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_STATISTICS: 'view_statistics',
    
    // Products
    VIEW_PRODUCTS: 'view_products',
    CREATE_PRODUCT: 'create_product',
    EDIT_PRODUCT: 'edit_product',
    DELETE_PRODUCT: 'delete_product',
    
    // Categories
    VIEW_CATEGORIES: 'view_categories',
    CREATE_CATEGORY: 'create_category',
    EDIT_CATEGORY: 'edit_category',
    DELETE_CATEGORY: 'delete_category',
    
    // Subcategories
    VIEW_SUBCATEGORIES: 'view_subcategories',
    CREATE_SUBCATEGORY: 'create_subcategory',
    EDIT_SUBCATEGORY: 'edit_subcategory',
    DELETE_SUBCATEGORY: 'delete_subcategory',
    
    // Orders
    VIEW_ORDERS: 'view_orders',
    UPDATE_ORDER_STATUS: 'update_order_status',
    CANCEL_ORDER: 'cancel_order',
    
    // Users
    VIEW_USERS: 'view_users',
    CREATE_USER: 'create_user',
    EDIT_USER: 'edit_user',
    DELETE_USER: 'delete_user',
    BLOCK_USER: 'block_user',
    
    // Admins (Super Admin Only)
    VIEW_ADMINS: 'view_admins',
    CREATE_ADMIN: 'create_admin',
    EDIT_ADMIN: 'edit_admin',
    DELETE_ADMIN: 'delete_admin',
    
    // Messages
    VIEW_MESSAGES: 'view_messages',
    REPLY_MESSAGE: 'reply_message',
    DELETE_MESSAGE: 'delete_message',
    
    // Reviews
    VIEW_REVIEWS: 'view_reviews',
    APPROVE_REVIEW: 'approve_review',
    DELETE_REVIEW: 'delete_review',
    
    // Colors & Sizes
    MANAGE_COLORS: 'manage_colors',
    MANAGE_SIZES: 'manage_sizes',
    
    // Notifications
    VIEW_NOTIFICATIONS: 'view_notifications',
    SEND_NOTIFICATION: 'send_notification',
    
    // Billing
    VIEW_BILLING: 'view_billing',
    CREATE_INVOICE: 'create_invoice',
    MANAGE_BILLING: 'manage_billing',
    
    // Reports
    VIEW_REPORTS: 'view_reports',
    EXPORT_REPORTS: 'export_reports',
    
    // Settings
    VIEW_SETTINGS: 'view_settings',
    EDIT_SETTINGS: 'edit_settings',
  },

  // Role-based permissions mapping
  ROLE_PERMISSIONS: {
    super_admin: ['*'], // All permissions
    admin: [
      'view_dashboard',
      'view_statistics',
      'view_products',
      'create_product',
      'edit_product',
      'delete_product',
      'view_categories',
      'create_category',
      'edit_category',
      'delete_category',
      'view_subcategories',
      'create_subcategory',
      'edit_subcategory',
      'delete_subcategory',
      'view_orders',
      'update_order_status',
      'cancel_order',
      'view_users',
      'edit_user',
      'block_user',
      'view_messages',
      'reply_message',
      'view_reviews',
      'approve_review',
      'manage_colors',
      'manage_sizes',
      'view_notifications',
      'send_notification',
      'view_billing',
      'create_invoice',
      'view_reports',
      'export_reports',
      'view_settings',
    ],
    moderator: [
      'view_dashboard',
      'view_products',
      'view_categories',
      'view_subcategories',
      'view_orders',
      'update_order_status',
      'view_users',
      'view_messages',
      'reply_message',
      'view_reviews',
      'approve_review',
      'view_notifications',
    ],
  },

  // ==========================================
  // ORDER STATUS
  // ==========================================
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },

  ORDER_STATUS_FLOW: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  },

  ORDER_STATUS_COLORS: {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#8b5cf6',
    shipped: '#06b6d4',
    delivered: '#22c55e',
    cancelled: '#ef4444',
  },

  // ==========================================
  // PAYMENT STATUS
  // ==========================================
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },

  PAYMENT_METHODS: {
    CASH: 'cash',
    VISA: 'visa',
    PAYPAL: 'paypal',
    BANK_TRANSFER: 'bank_transfer',
  },

  // ==========================================
  // MESSAGE STATUS
  // ==========================================
  MESSAGE_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
  },

  MESSAGE_STATUS_COLORS: {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    resolved: '#22c55e',
    closed: '#64748b',
  },

  // ==========================================
  // NOTIFICATION TYPES
  // ==========================================
  NOTIFICATION_TYPES: {
    ORDER: 'order',
    PROMOTION: 'promotion',
    ACCOUNT: 'account',
    SYSTEM: 'system',
  },

  // ==========================================
  // FILE UPLOAD
  // ==========================================
  UPLOAD: {
    // Max file sizes (in bytes)
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    
    // Allowed file types
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    ALLOWED_DOCUMENT_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    
    // Image dimensions
    PRODUCT_IMAGE: {
      WIDTH: 800,
      HEIGHT: 800,
      THUMBNAIL_WIDTH: 200,
      THUMBNAIL_HEIGHT: 200,
    },
    CATEGORY_IMAGE: {
      WIDTH: 600,
      HEIGHT: 400,
    },
    USER_AVATAR: {
      WIDTH: 200,
      HEIGHT: 200,
    },
    
    // Upload paths
    PATHS: {
      PRODUCTS: 'uploads/products',
      CATEGORIES: 'uploads/categories',
      SUBCATEGORIES: 'uploads/subcategories',
      USERS: 'uploads/users',
      ADMINS: 'uploads/admins',
      BANNERS: 'uploads/banners',
      TEMP: 'uploads/temp',
    },
  },

  // ==========================================
  // VALIDATION
  // ==========================================
  VALIDATION: {
    // Password
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    
    // Username
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
    
    // Email
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Phone
    PHONE_REGEX: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    
    // Product
    PRODUCT_NAME_MIN_LENGTH: 2,
    PRODUCT_NAME_MAX_LENGTH: 255,
    PRODUCT_DESCRIPTION_MAX_LENGTH: 5000,
    
    // Category
    CATEGORY_NAME_MIN_LENGTH: 2,
    CATEGORY_NAME_MAX_LENGTH: 255,
    
    // Price
    MIN_PRICE: 0,
    MAX_PRICE: 999999.99,
    MAX_DISCOUNT_PERCENTAGE: 100,
    
    // Stock
    MIN_STOCK: 0,
    MAX_STOCK: 999999,
    
    // Review
    MIN_RATING: 1,
    MAX_RATING: 5,
    REVIEW_MAX_LENGTH: 1000,
    
    // OTP
    OTP_LENGTH: 6,
    OTP_EXPIRY_MINUTES: 10,
    MAX_OTP_ATTEMPTS: 3,
  },

  // ==========================================
  // API RESPONSE CODES
  // ==========================================
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // ==========================================
  // ERROR CODES
  // ==========================================
  ERROR_CODES: {
    // Authentication
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
    AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
    
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    
    // Resource
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
    
    // File Upload
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
    FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
    
    // Database
    DATABASE_ERROR: 'DATABASE_ERROR',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    FOREIGN_KEY_CONSTRAINT: 'FOREIGN_KEY_CONSTRAINT',
    
    // Rate Limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // Server
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  },

  // ==========================================
  // RATE LIMITING
  // ==========================================
  RATE_LIMIT: {
    // General API
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    
    // Login attempts
    LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    LOGIN_MAX_ATTEMPTS: 5,
    
    // Password reset
    RESET_WINDOW_MS: 60 * 60 * 1000, // 1 hour
    RESET_MAX_ATTEMPTS: 3,
    
    // File upload
    UPLOAD_WINDOW_MS: 60 * 60 * 1000, // 1 hour
    UPLOAD_MAX_REQUESTS: 50,
  },

  // ==========================================
  // CACHE
  // ==========================================
  CACHE: {
    // TTL in seconds
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
    
    // Cache keys
    KEYS: {
      CATEGORIES: 'categories',
      SUBCATEGORIES: 'subcategories',
      COLORS: 'colors',
      SIZES: 'sizes',
      DASHBOARD_STATS: 'dashboard_stats',
      TOP_PRODUCTS: 'top_products',
      TOP_CITIES: 'top_cities',
    },
  },

  // ==========================================
  // EMAIL TEMPLATES
  // ==========================================
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password_reset',
    ORDER_CONFIRMATION: 'order_confirmation',
    ORDER_STATUS_UPDATE: 'order_status_update',
    ORDER_SHIPPED: 'order_shipped',
    ORDER_DELIVERED: 'order_delivered',
    ADMIN_INVITATION: 'admin_invitation',
    CONTACT_REPLY: 'contact_reply',
  },

  // ==========================================
  // REPORT TYPES
  // ==========================================
  REPORT_TYPES: {
    SALES: 'sales',
    ORDERS: 'orders',
    PRODUCTS: 'products',
    USERS: 'users',
    REVENUE: 'revenue',
  },

  REPORT_PERIODS: {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_YEAR: 'this_year',
    CUSTOM: 'custom',
  },

  // ==========================================
  // EXPORT FORMATS
  // ==========================================
  EXPORT_FORMATS: {
    CSV: 'csv',
    EXCEL: 'excel',
    PDF: 'pdf',
  },

  // ==========================================
  // SORT OPTIONS
  // ==========================================
  SORT_ORDER: {
    ASC: 'ASC',
    DESC: 'DESC',
  },

  DEFAULT_SORT: {
    PRODUCTS: { field: 'created_at', order: 'DESC' },
    CATEGORIES: { field: 'display_order', order: 'ASC' },
    ORDERS: { field: 'created_at', order: 'DESC' },
    USERS: { field: 'created_at', order: 'DESC' },
    MESSAGES: { field: 'created_at', order: 'DESC' },
    REVIEWS: { field: 'created_at', order: 'DESC' },
  },

  // ==========================================
  // BILLING
  // ==========================================
  BILLING: {
    INVOICE_PREFIX: 'INV',
    SUPPLIER_BILL_PREFIX: 'SUP',
    TAX_RATE: 0.17, // 17% VAT
    DEFAULT_SHIPPING_COST: 20,
    FREE_SHIPPING_THRESHOLD: 200,
  },

  // ==========================================
  // REGEX PATTERNS
  // ==========================================
  REGEX: {
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    ARABIC_TEXT: /[\u0600-\u06FF]/,
    HEBREW_TEXT: /[\u0590-\u05FF]/,
    SKU: /^[A-Z0-9-]+$/,
    ORDER_NUMBER: /^ORD-\d{8}-[A-Z0-9]{6}$/,
    PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // ==========================================
  // DATE FORMATS
  // ==========================================
  DATE_FORMATS: {
    DEFAULT: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
    TIME: 'HH:mm:ss',
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  },
};