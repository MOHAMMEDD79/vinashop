/**
 * Validation Middleware
 * @module middleware/validation
 */

const Joi = require('joi');
const { VALIDATION, REGEX } = require('../config/constants');

/**
 * Validate request against schema
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true,
    });

    if (error) {
      const errors = {};
      error.details.forEach(detail => {
        const field = detail.path.join('.');
        errors[field] = detail.message.replace(/"/g, '');
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error_code: 'VALIDATION_ERROR',
        errors,
      });
    }

    // Replace request property with sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Validate multiple properties
 * @param {Object} schemas - Object with schemas for each property
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const allErrors = {};

    for (const [property, schema] of Object.entries(schemas)) {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        error.details.forEach(detail => {
          const field = `${property}.${detail.path.join('.')}`;
          allErrors[field] = detail.message.replace(/"/g, '');
        });
      } else {
        req[property] = value;
      }
    }

    if (Object.keys(allErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error_code: 'VALIDATION_ERROR',
        errors: allErrors,
      });
    }

    next();
  };
};

// ==================== Common Schemas ====================

/**
 * Common field schemas
 */
const commonSchemas = {
  id: Joi.number().integer().positive().required(),
  optionalId: Joi.number().integer().positive(),
  email: Joi.string().email().max(255).lowercase().trim(),
  password: Joi.string().min(VALIDATION.PASSWORD_MIN_LENGTH).max(128),
  username: Joi.string().min(3).max(50).trim(),
  phone: Joi.string().pattern(REGEX.PHONE).max(20),
  url: Joi.string().uri().max(500),
  date: Joi.date().iso(),
  boolean: Joi.boolean(),
  positiveNumber: Joi.number().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().max(50).default('created_at'),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
  lang: Joi.string().valid('en', 'ar', 'he').default('en'),
  search: Joi.string().max(100).trim(),
};

// ==================== Auth Schemas ====================

const authSchemas = {
  login: Joi.object({
    email: commonSchemas.email.required(),
    password: Joi.string().required(),
    remember_me: Joi.boolean().default(false),
  }),

  register: Joi.object({
    username: commonSchemas.username.required(),
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    confirm_password: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
    first_name: Joi.string().max(100).trim(),
    last_name: Joi.string().max(100).trim(),
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email.required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonSchemas.password.required(),
    confirm_password: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: commonSchemas.password.required(),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  }),

  verifyTwoFactor: Joi.object({
    code: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),
};

// ==================== Admin Schemas ====================

const adminSchemas = {
  create: Joi.object({
    username: commonSchemas.username.required(),
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    first_name: Joi.string().max(100).trim(),
    last_name: Joi.string().max(100).trim(),
    role: Joi.string().valid('super_admin', 'admin', 'moderator', 'employee').default('employee'),
    status: Joi.string().valid('active', 'inactive').default('active'),
    permissions: Joi.array().items(Joi.string()),
  }),

  update: Joi.object({
    username: commonSchemas.username,
    email: commonSchemas.email,
    first_name: Joi.string().max(100).trim(),
    last_name: Joi.string().max(100).trim(),
    role: Joi.string().valid('super_admin', 'admin', 'moderator', 'employee'),
    status: Joi.string().valid('active', 'inactive'),
    permissions: Joi.array().items(Joi.string()),
  }),
};

// ==================== Product Schemas ====================

const productSchemas = {
  create: Joi.object({
    product_name_en: Joi.string().max(255).trim().required(),
    product_name_ar: Joi.string().max(255).trim().required(),
    product_name_he: Joi.string().max(255).trim().required(),
    product_description_en: Joi.string().max(5000).trim(),
    product_description_ar: Joi.string().max(5000).trim(),
    product_description_he: Joi.string().max(5000).trim(),
    sku: Joi.string().max(100).trim(),
    price: Joi.number().positive().required(),
    discount_percentage: Joi.number().min(0).max(100).default(0),
    stock_quantity: Joi.number().integer().min(0).default(0),
    category_id: Joi.number().integer().positive().required(),
    subcategory_id: Joi.number().integer().positive(),
    is_featured: commonSchemas.boolean.default(false),
    is_active: commonSchemas.boolean.default(true),
    colors: Joi.alternatives().try(Joi.array().items(Joi.number()), Joi.string()),
    sizes: Joi.alternatives().try(Joi.array().items(Joi.number()), Joi.string()),
    meta_title: Joi.string().max(100),
    meta_description: Joi.string().max(300),
    meta_keywords: Joi.string().max(255),
  }),

  update: Joi.object({
    product_name_en: Joi.string().max(255).trim(),
    product_name_ar: Joi.string().max(255).trim(),
    product_name_he: Joi.string().max(255).trim(),
    product_description_en: Joi.string().max(5000).trim(),
    product_description_ar: Joi.string().max(5000).trim(),
    product_description_he: Joi.string().max(5000).trim(),
    sku: Joi.string().max(100).trim(),
    price: Joi.number().positive(),
    discount_percentage: Joi.number().min(0).max(100),
    stock_quantity: Joi.number().integer().min(0),
    category_id: Joi.number().integer().positive(),
    subcategory_id: Joi.number().integer().positive().allow(null),
    is_featured: commonSchemas.boolean,
    is_active: commonSchemas.boolean,
    colors: Joi.alternatives().try(Joi.array().items(Joi.number()), Joi.string()),
    sizes: Joi.alternatives().try(Joi.array().items(Joi.number()), Joi.string()),
    meta_title: Joi.string().max(100),
    meta_description: Joi.string().max(300),
    meta_keywords: Joi.string().max(255),
  }),

  updateStock: Joi.object({
    quantity: Joi.number().integer().required(),
    operation: Joi.string().valid('set', 'add', 'subtract').default('set'),
  }),

  query: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    search: commonSchemas.search,
    category_id: commonSchemas.optionalId,
    subcategory_id: commonSchemas.optionalId,
    is_active: commonSchemas.boolean,
    is_featured: commonSchemas.boolean,
    in_stock: commonSchemas.boolean,
    min_price: commonSchemas.positiveNumber,
    max_price: commonSchemas.positiveNumber,
    sort: commonSchemas.sort,
    order: commonSchemas.order,
    lang: commonSchemas.lang,
  }),
};

// ==================== Category Schemas ====================

const categorySchemas = {
  create: Joi.object({
    category_name_en: Joi.string().max(255).trim().required(),
    category_name_ar: Joi.string().max(255).trim().required(),
    category_name_he: Joi.string().max(255).trim().required(),
    description_en: Joi.string().max(1000).trim(),
    description_ar: Joi.string().max(1000).trim(),
    description_he: Joi.string().max(1000).trim(),
    display_order: Joi.number().integer().min(0).default(0),
    is_active: commonSchemas.boolean.default(true),
    is_featured: commonSchemas.boolean.default(false),
  }),

  update: Joi.object({
    category_name_en: Joi.string().max(255).trim(),
    category_name_ar: Joi.string().max(255).trim(),
    category_name_he: Joi.string().max(255).trim(),
    description_en: Joi.string().max(1000).trim(),
    description_ar: Joi.string().max(1000).trim(),
    description_he: Joi.string().max(1000).trim(),
    display_order: Joi.number().integer().min(0),
    is_active: commonSchemas.boolean,
    is_featured: commonSchemas.boolean,
  }),
};

// ==================== Order Schemas ====================

const orderSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    items: Joi.array().items(Joi.object({
      product_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required(),
      price: Joi.number().positive(),
      variant_id: Joi.number().integer().positive(),
      color_id: Joi.number().integer().positive(),
      size_id: Joi.number().integer().positive(),
    })).min(1).required(),
    shipping_address: Joi.string().max(500).required(),
    shipping_city: Joi.string().max(100).required(),
    shipping_country: Joi.string().max(100),
    shipping_postal_code: Joi.string().max(20),
    shipping_phone: commonSchemas.phone.required(),
    payment_method: Joi.string().valid('cash', 'visa', 'paypal', 'bank_transfer').default('cash'),
    notes: Joi.string().max(1000),
    discount_amount: Joi.number().min(0).default(0),
    shipping_cost: Joi.number().min(0).default(0),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required(),
    notify_customer: commonSchemas.boolean.default(true),
    note: Joi.string().max(500),
  }),

  updatePaymentStatus: Joi.object({
    payment_status: Joi.string().valid('pending', 'paid', 'failed', 'refunded').required(),
    payment_reference: Joi.string().max(255),
    notify_customer: commonSchemas.boolean.default(false),
  }),

  addTracking: Joi.object({
    tracking_number: Joi.string().max(100).required(),
    shipping_carrier: Joi.string().max(100),
    tracking_url: commonSchemas.url,
    notify_customer: commonSchemas.boolean.default(true),
  }),

  query: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    search: commonSchemas.search,
    status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    payment_status: Joi.string().valid('pending', 'paid', 'failed', 'refunded'),
    payment_method: Joi.string().valid('cash', 'visa', 'paypal', 'bank_transfer'),
    user_id: commonSchemas.optionalId,
    date_from: commonSchemas.date,
    date_to: commonSchemas.date,
    min_total: commonSchemas.positiveNumber,
    max_total: commonSchemas.positiveNumber,
    sort: commonSchemas.sort,
    order: commonSchemas.order,
  }),
};

// ==================== User Schemas ====================

const userSchemas = {
  create: Joi.object({
    username: commonSchemas.username,
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    first_name: Joi.string().max(100).trim(),
    last_name: Joi.string().max(100).trim(),
    phone: commonSchemas.phone,
    address: Joi.string().max(500),
    city: Joi.string().max(100),
    country: Joi.string().max(100),
    postal_code: Joi.string().max(20),
    is_verified: commonSchemas.boolean.default(false),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'banned').default('active'),
    send_welcome_email: commonSchemas.boolean.default(true),
  }),

  update: Joi.object({
    username: commonSchemas.username,
    email: commonSchemas.email,
    first_name: Joi.string().max(100).trim(),
    last_name: Joi.string().max(100).trim(),
    phone: commonSchemas.phone,
    address: Joi.string().max(500),
    city: Joi.string().max(100),
    country: Joi.string().max(100),
    postal_code: Joi.string().max(20),
    is_verified: commonSchemas.boolean,
    status: Joi.string().valid('active', 'inactive', 'suspended', 'banned'),
  }),

  query: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    search: commonSchemas.search,
    status: Joi.string().valid('active', 'inactive', 'suspended', 'banned'),
    is_verified: commonSchemas.boolean,
    date_from: commonSchemas.date,
    date_to: commonSchemas.date,
    sort: commonSchemas.sort,
    order: commonSchemas.order,
  }),
};

// ==================== Message Schemas ====================

const messageSchemas = {
  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'in_progress', 'resolved', 'closed').required(),
  }),

  reply: Joi.object({
    reply_message: Joi.string().min(1).max(5000).required(),
    send_email: commonSchemas.boolean.default(true),
  }),

  query: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    search: commonSchemas.search,
    status: Joi.string().valid('pending', 'in_progress', 'resolved', 'closed'),
    is_read: commonSchemas.boolean,
    date_from: commonSchemas.date,
    date_to: commonSchemas.date,
    sort: commonSchemas.sort,
    order: commonSchemas.order,
  }),
};

// ==================== Review Schemas ====================

const reviewSchemas = {
  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected').required(),
    reason: Joi.string().max(500),
  }),

  reply: Joi.object({
    reply_message: Joi.string().min(1).max(1000).required(),
  }),

  query: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    search: commonSchemas.search,
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    rating: Joi.number().integer().min(1).max(5),
    product_id: commonSchemas.optionalId,
    user_id: commonSchemas.optionalId,
    date_from: commonSchemas.date,
    date_to: commonSchemas.date,
    sort: commonSchemas.sort,
    order: commonSchemas.order,
    lang: commonSchemas.lang,
  }),
};

// ==================== Pagination Schema ====================

const paginationSchema = Joi.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
  sort: commonSchemas.sort,
  order: commonSchemas.order,
});

// ==================== ID Param Schema ====================

const idParamSchema = Joi.object({
  id: commonSchemas.id,
});

// ==================== Bulk Actions Schema ====================

const bulkActionSchema = (field = 'ids') => Joi.object({
  [field]: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

// ==================== Date Range Schema ====================

const dateRangeSchema = Joi.object({
  date_from: commonSchemas.date,
  date_to: commonSchemas.date,
  period: Joi.string().valid('today', 'week', 'month', 'quarter', 'year', 'custom'),
});

/**
 * Sanitize string input
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim();
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

/**
 * Sanitize request body middleware
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Sanitize request query middleware
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

// ==================== Grouped Schemas Object ====================

const schemas = {
  auth: authSchemas,
  admin: adminSchemas,
  product: productSchemas,
  category: categorySchemas,
  order: orderSchemas,
  user: userSchemas,
  message: messageSchemas,
  review: reviewSchemas,
  common: commonSchemas,
  pagination: paginationSchema,
  idParam: idParamSchema,
  dateRange: dateRangeSchema,
};

module.exports = {
  // Core validation function
  validate,
  validateMultiple,

  // Grouped schemas object (for routes)
  schemas,

  // Common schemas
  commonSchemas,

  // Entity schemas
  authSchemas,
  adminSchemas,
  productSchemas,
  categorySchemas,
  orderSchemas,
  userSchemas,
  messageSchemas,
  reviewSchemas,

  // Utility schemas
  paginationSchema,
  idParamSchema,
  bulkActionSchema,
  dateRangeSchema,

  // Sanitization
  sanitizeBody,
  sanitizeQuery,
  sanitizeString,
  sanitizeObject,

  // Re-export Joi for custom schemas
  Joi,
};