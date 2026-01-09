/**
 * Test Routes - For debugging API endpoints
 * Use these in Postman to verify backend functionality
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { productImageUpload, categoryImageUpload, bannerMediaUpload, handleMulterError, deleteFile } = require('../config/multer');

// ==================== PUBLIC TESTS (No Auth Required) ====================

/**
 * GET /api/admin/v1/test/ping
 * Basic connectivity test
 */
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/admin/v1/test/db
 * Database connection test
 */
router.get('/db', async (req, res) => {
  try {
    const [result] = await query('SELECT 1 as test');
    res.json({
      success: true,
      message: 'Database connected!',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/tables
 * List all tables in database
 */
router.get('/tables', async (req, res) => {
  try {
    const tables = await query('SHOW TABLES');
    res.json({
      success: true,
      message: 'Tables retrieved',
      data: tables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get tables',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/debug-admin
 * Debug admin login (TEMPORARY - REMOVE IN PRODUCTION)
 */
router.get('/debug-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const testPassword = 'Shahid@2026##123$$';

    // Check admin_users table
    const adminUsers = await query('SELECT admin_id, username, email, password_hash, is_active FROM admin_users WHERE email = ?', ['admin@vinashop.com']);

    // Check admins table
    const admins = await query('SELECT admin_id, email, password, is_active FROM admins WHERE email = ?', ['admin@vinashop.com']);

    let passwordMatch1 = false;
    let passwordMatch2 = false;

    if (adminUsers.length > 0 && adminUsers[0].password_hash) {
      passwordMatch1 = await bcrypt.compare(testPassword, adminUsers[0].password_hash);
    }

    if (admins.length > 0 && admins[0].password) {
      passwordMatch2 = await bcrypt.compare(testPassword, admins[0].password);
    }

    res.json({
      success: true,
      admin_users_table: {
        found: adminUsers.length > 0,
        data: adminUsers.length > 0 ? {
          admin_id: adminUsers[0].admin_id,
          email: adminUsers[0].email,
          username: adminUsers[0].username,
          is_active: adminUsers[0].is_active,
          password_hash_length: adminUsers[0].password_hash?.length,
          password_hash_preview: adminUsers[0].password_hash?.substring(0, 20) + '...',
          password_matches: passwordMatch1
        } : null
      },
      admins_table: {
        found: admins.length > 0,
        data: admins.length > 0 ? {
          admin_id: admins[0].admin_id,
          email: admins[0].email,
          is_active: admins[0].is_active,
          password_length: admins[0].password?.length,
          password_preview: admins[0].password?.substring(0, 20) + '...',
          password_matches: passwordMatch2
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/describe/:table
 * Describe table structure (PUBLIC - for debugging)
 */
router.get('/describe/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const columns = await query(`DESCRIBE ${table}`);
    res.json({
      success: true,
      table: table,
      columns: columns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to describe table',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/check-admin
 * Check if any admin exists (PUBLIC - for initial setup)
 */
router.get('/check-admin', async (req, res) => {
  try {
    const admins = await query('SELECT COUNT(*) as count FROM admin_users');
    res.json({
      success: true,
      hasAdmin: admins[0].count > 0,
      count: admins[0].count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check admin users',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/setup-admin
 * Create initial admin user (PUBLIC - only works if no admin exists)
 */
router.post('/setup-admin', async (req, res) => {
  try {
    // Check if any admin already exists
    const [count] = await query('SELECT COUNT(*) as count FROM admin_users');
    if (count.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists. Use login instead.',
      });
    }

    const { username = 'admin', email = 'admin@vinashop.com', password = 'Admin@123', full_name = 'System Admin' } = req.body;

    // Hash password
    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(`
      INSERT INTO admin_users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'super_admin', 1, NOW(), NOW())
    `, [username, email, password_hash, full_name]);

    res.status(201).json({
      success: true,
      message: 'Initial admin user created successfully',
      data: {
        admin_id: result.insertId,
        username,
        email,
        role: 'super_admin',
      },
      credentials: {
        email,
        password,
        note: 'Please change this password after first login'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/customer-bills-test
 * Test customer bills endpoint (no auth for debugging)
 */
router.get('/customer-bills-test', async (req, res) => {
  try {
    // First check table structure
    const columns = await query('DESCRIBE customer_bills');
    const columnNames = columns.map(c => c.Field);

    // Check if customer_name and customer_phone columns exist
    if (!columnNames.includes('customer_name') || !columnNames.includes('customer_phone')) {
      // Add missing columns
      if (!columnNames.includes('customer_name')) {
        await query('ALTER TABLE customer_bills ADD COLUMN customer_name VARCHAR(255) NULL AFTER bill_date');
      }
      if (!columnNames.includes('customer_phone')) {
        await query('ALTER TABLE customer_bills ADD COLUMN customer_phone VARCHAR(50) NULL AFTER customer_name');
      }
    }

    const CustomerBill = require('../models/customerBill.model');
    const result = await CustomerBill.getAll({
      page: 1,
      limit: 10,
    });
    res.json({
      success: true,
      message: 'Customer bills retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get customer bills',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/customer-debts-test
 * Test customer debts endpoint (no auth for debugging)
 */
router.get('/customer-debts-test', async (req, res) => {
  try {
    // First check table structure
    const columns = await query('DESCRIBE customer_debts');
    const columnNames = columns.map(c => c.Field);

    // Check if customer_name and customer_phone columns exist
    if (!columnNames.includes('customer_name') || !columnNames.includes('customer_phone')) {
      // Add missing columns
      if (!columnNames.includes('customer_name')) {
        await query('ALTER TABLE customer_debts ADD COLUMN customer_name VARCHAR(255) NULL AFTER order_id');
      }
      if (!columnNames.includes('customer_phone')) {
        await query('ALTER TABLE customer_debts ADD COLUMN customer_phone VARCHAR(50) NULL AFTER customer_name');
      }
    }

    const CustomerDebt = require('../models/customerDebt.model');
    const result = await CustomerDebt.getAll({
      page: 1,
      limit: 10,
    });
    res.json({
      success: true,
      message: 'Customer debts retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get customer debts',
      error: error.message,
    });
  }
});

// ==================== PROTECTED TESTS (Auth Required) ====================

/**
 * GET /api/admin/v1/test/auth
 * Test authentication
 */
router.get('/auth', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working!',
    admin: req.admin,
  });
});

// Admin users endpoints moved to line ~1785 to avoid duplication

/**
 * GET /api/admin/v1/test/products
 * Get products for dropdowns (PUBLIC - no auth, safe data only)
 */
router.get('/products', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const sql = `SELECT product_id, product_name_en as name_en, base_price as price, is_active FROM products WHERE is_active = 1 ORDER BY product_name_en ASC LIMIT ${limit}`;
    const products = await query(sql);
    res.json({
      success: true,
      message: 'Products retrieved',
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/categories
 * Get categories for dropdowns (PUBLIC - no auth, safe data only)
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT category_id, category_name_en as name_en, is_active FROM categories WHERE is_active = 1 ORDER BY category_name_en ASC');
    res.json({
      success: true,
      message: 'Categories retrieved',
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/users-public
 * Get users for dropdowns (PUBLIC - no auth, safe data only)
 */
router.get('/users-public', async (req, res) => {
  // Users table has been removed - return empty array
  res.json({
    success: true,
    message: 'Users table has been removed. Guest checkout only.',
    count: 0,
    data: [],
  });
});

/**
 * GET /api/admin/v1/test/orders-public
 * Get orders for dropdowns (PUBLIC - no auth, safe data only)
 */
router.get('/orders-public', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const orders = await query(`
      SELECT o.order_id, o.order_number, o.total_amount, o.status, o.created_at,
             o.guest_name as customer_name, o.guest_phone as customer_phone
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);
    res.json({
      success: true,
      message: 'Orders retrieved',
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/orders-public/:id
 * Get single order with items (PUBLIC - no auth, for import)
 */
router.get('/orders-public/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get order with guest info
    const [order] = await query(`
      SELECT o.order_id, o.order_number, o.user_id, o.total_amount, o.status,
             o.subtotal, o.discount_amount, o.tax_amount, o.shipping_cost,
             o.created_at, o.guest_name as customer_name, o.guest_phone as customer_phone
      FROM orders o
      WHERE o.order_id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const items = await query(`
      SELECT oi.*, p.product_name_en as product_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);

    order.items = items;

    res.json({
      success: true,
      message: 'Order retrieved',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/orders
 * Test orders table (simple test)
 */
router.get('/orders-simple', authenticate, async (req, res) => {
  try {
    const orders = await query(`
      SELECT o.order_id, o.order_number, o.user_id, o.total_amount, o.status,
             o.payment_status, o.payment_method, o.created_at,
             o.guest_name as full_name, o.guest_email as email, o.guest_phone as phone_number
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    res.json({
      success: true,
      message: 'Orders retrieved',
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/orders
 * Full orders list with pagination and filters
 */
router.get('/orders', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (o.order_number LIKE ? OR o.guest_name LIKE ? OR o.guest_email LIKE ? OR o.guest_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM orders o
      ${whereClause}
    `, params);
    const total = countResult[0]?.total || 0;

    // Get orders with guest info and items count
    // Note: Using template literals for LIMIT/OFFSET to avoid mysql2 prepared statement issues
    const orders = await query(`
      SELECT o.order_id, o.order_number, o.user_id, o.address_id,
             o.status, o.payment_method, o.payment_status,
             o.subtotal, COALESCE(o.delivery_fee, o.shipping_cost, 0) as shipping_cost, o.tax_amount, o.discount_amount,
             o.total_amount, o.notes, o.created_at, o.updated_at,
             o.guest_name as customer_name,
             o.guest_email as customer_email,
             o.guest_phone as customer_phone,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as items_count
      FROM orders o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params);

    res.json({
      success: true,
      data: {
        orders,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/orders/:id
 * Get single order with all details
 */
router.get('/orders/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order with guest info
    const [order] = await query(`
      SELECT o.*,
             COALESCE(o.delivery_fee, o.shipping_cost, 0) as shipping_cost,
             o.guest_name as customer_name,
             o.guest_email as customer_email,
             o.guest_phone as customer_phone,
             NULL as customer_avatar,
             o.guest_address as shipping_address,
             o.region as delivery_region
      FROM orders o
      WHERE o.order_id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Get order items
    const items = await query(`
      SELECT oi.*, p.product_name_en, p.product_name_ar,
             (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);

    // Address info is stored in guest_address, guest_city fields
    const address = {
      address: order.guest_address,
      city: order.guest_city,
      area_code: order.guest_area_code,
      region: order.region
    };

    order.items = items;
    order.address = address;

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/orders/:id/status
 * Update order status
 */
router.patch('/orders/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const [existing] = await query('SELECT * FROM orders WHERE order_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update status
    await query('UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?', [status, id]);

    // If delivered, update payment status to paid (for COD)
    if (status === 'delivered' && existing.payment_method === 'cash_on_delivery') {
      await query('UPDATE orders SET payment_status = "paid" WHERE order_id = ?', [id]);
    }

    const [updated] = await query('SELECT * FROM orders WHERE order_id = ?', [id]);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/users
 * Full users list with pagination and filters
 * Note: Users table has been removed - returning empty results
 */
router.get('/users', authenticate, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  res.json({
    success: true,
    message: 'Users table has been removed. Guest checkout only.',
    data: {
      users: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: 0
    }
  });
});

/**
 * GET /api/admin/v1/test/users/:id
 * Get single user with all details
 * Note: Users table has been removed
 */
router.get('/users/:id', authenticate, async (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Users table has been removed. Guest checkout only.'
  });
});

/**
 * PATCH /api/admin/v1/test/users/:id/toggle-status
 * Toggle user active status
 * Note: Users table has been removed
 */
router.patch('/users/:id/toggle-status', authenticate, async (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Users table has been removed. Guest checkout only.'
  });
});

/**
 * DELETE /api/admin/v1/test/users/:id
 * Delete user (soft delete by deactivating)
 * Note: Users table has been removed
 */
router.delete('/users/:id', authenticate, async (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Users table has been removed. Guest checkout only.'
  });
});

/**
 * GET /api/admin/v1/test/dashboard-simple
 * Simple dashboard stats (direct SQL queries, no models)
 */
router.get('/dashboard-simple', authenticate, async (req, res) => {
  try {
    const stats = {};

    // Count orders
    try {
      const [orderCount] = await query('SELECT COUNT(*) as total FROM orders');
      stats.totalOrders = orderCount?.total || 0;
    } catch (e) {
      stats.totalOrders = 0;
      stats.orderError = e.message;
    }

    // Count products
    try {
      const [productCount] = await query('SELECT COUNT(*) as total FROM products');
      stats.totalProducts = productCount?.total || 0;
    } catch (e) {
      stats.totalProducts = 0;
      stats.productError = e.message;
    }

    // Count users
    try {
      const [userCount] = await query('SELECT COUNT(*) as total FROM users');
      stats.totalUsers = userCount?.total || 0;
    } catch (e) {
      stats.totalUsers = 0;
      stats.userError = e.message;
    }

    // Count categories
    try {
      const [catCount] = await query('SELECT COUNT(*) as total FROM categories');
      stats.totalCategories = catCount?.total || 0;
    } catch (e) {
      stats.totalCategories = 0;
      stats.categoryError = e.message;
    }

    // Total revenue
    try {
      const [revenue] = await query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != "cancelled"');
      stats.totalRevenue = parseFloat(revenue?.total) || 0;
    } catch (e) {
      stats.totalRevenue = 0;
      stats.revenueError = e.message;
    }

    // Pending orders
    try {
      const [pending] = await query('SELECT COUNT(*) as total FROM orders WHERE status = "pending"');
      stats.pendingOrders = pending?.total || 0;
    } catch (e) {
      stats.pendingOrders = 0;
    }

    res.json({
      success: true,
      message: 'Dashboard stats retrieved',
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/all-tables-count
 * Count rows in all important tables
 */
router.get('/all-tables-count', authenticate, async (req, res) => {
  try {
    const counts = {};
    const tables = [
      'admin_users', 'users', 'products', 'categories',
      'orders', 'order_items', 'reviews', 'messages',
      'addresses', 'carts', 'cart_items', 'wishlists'
    ];

    for (const table of tables) {
      try {
        const [result] = await query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = result?.count || 0;
      } catch (e) {
        counts[table] = `Error: ${e.message}`;
      }
    }

    res.json({
      success: true,
      message: 'Table counts retrieved',
      data: counts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get table counts',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/products-list
 * Full products list with pagination
 */
router.get('/products-list', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category_id } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (p.product_name_en LIKE ? OR p.product_name_ar LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category_id) {
      whereClause += ' AND p.category_id = ?';
      params.push(parseInt(category_id));
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM products p ${whereClause}`, params);
    const total = countResult[0]?.total || 0;

    // Get products with primary image and subcategory
    // Note: Using template literals for LIMIT/OFFSET to avoid mysql2 prepared statement issues
    const products = await query(`
      SELECT p.product_id, p.product_name_en, p.product_name_ar,
             p.product_description_en, p.product_description_ar,
             p.base_price, p.discount_percentage, p.sku, p.stock_quantity,
             p.is_active, p.is_featured, p.category_id, p.subcategory_id,
             p.meta_keywords, p.created_at,
             c.category_name_en as category_name,
             sc.subcategory_name_en as subcategory_name,
             (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params);

    res.json({
      success: true,
      data: {
        items: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/categories-list
 * Full categories list
 */
router.get('/categories-list', authenticate, async (req, res) => {
  try {
    const categories = await query(`
      SELECT category_id, category_name_en, category_name_ar,
             category_description_en, category_description_ar,
             category_image, is_active, is_featured, display_order, created_at,
             (SELECT COUNT(*) FROM products WHERE category_id = categories.category_id) as product_count
      FROM categories
      ORDER BY display_order ASC, category_name_en ASC
    `);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/categories
 * Create category
 */
router.post('/categories', authenticate, async (req, res) => {
  try {
    const {
      category_name_en,
      category_name_ar,
      category_description_en,
      category_description_ar,
      category_image,
      display_order = 0,
      is_active = 1,
      is_featured = 0
    } = req.body;

    if (!category_name_en) {
      return res.status(400).json({ success: false, message: 'Category name (English) is required' });
    }

    const result = await query(`
      INSERT INTO categories (
        category_name_en, category_name_ar,
        category_description_en, category_description_ar,
        category_image, display_order, is_active, is_featured, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      category_name_en,
      category_name_ar || category_name_en,
      category_description_en || null,
      category_description_ar || null,
      category_image || null,
      display_order,
      is_active ? 1 : 0,
      is_featured ? 1 : 0
    ]);

    const [category] = await query('SELECT * FROM categories WHERE category_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/categories/:id
 * Update category
 */
router.put('/categories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [existing] = await query('SELECT * FROM categories WHERE category_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const allowedFields = [
      'category_name_en', 'category_name_ar',
      'category_description_en', 'category_description_ar',
      'category_image', 'display_order', 'is_active', 'is_featured'
    ];

    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(value === '' ? null : value);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    setClauses.push('updated_at = NOW()');
    values.push(id);

    await query(`UPDATE categories SET ${setClauses.join(', ')} WHERE category_id = ?`, values);

    const [category] = await query('SELECT * FROM categories WHERE category_id = ?', [id]);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/categories/:id
 * Delete category
 */
router.delete('/categories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM categories WHERE category_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if category has products
    const [productCount] = await query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    if (productCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount.count} products. Move or delete products first.`
      });
    }

    // Delete subcategories first
    await query('DELETE FROM subcategories WHERE category_id = ?', [id]);

    // Delete category
    await query('DELETE FROM categories WHERE category_id = ?', [id]);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/categories/:id/toggle-status
 * Toggle category active status
 */
router.patch('/categories/:id/toggle-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT is_active FROM categories WHERE category_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const newStatus = existing.is_active ? 0 : 1;
    await query('UPDATE categories SET is_active = ?, updated_at = NOW() WHERE category_id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { is_active: newStatus }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle status',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/categories/:id/image
 * Upload category image
 */
router.post('/categories/:id/image', authenticate, categoryImageUpload.single('image'), handleMulterError, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM categories WHERE category_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    // Delete old image if exists
    if (existing.category_image && !existing.category_image.startsWith('http')) {
      await deleteFile(existing.category_image);
    }

    const imagePath = `uploads/categories/${req.file.filename}`;
    await query('UPDATE categories SET category_image = ?, updated_at = NOW() WHERE category_id = ?', [imagePath, id]);

    res.json({
      success: true,
      message: 'Category image uploaded successfully',
      data: { category_image: imagePath }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/categories/:id/image
 * Delete category image
 */
router.delete('/categories/:id/image', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT category_image FROM categories WHERE category_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (existing.category_image && !existing.category_image.startsWith('http')) {
      await deleteFile(existing.category_image);
    }

    await query('UPDATE categories SET category_image = NULL, updated_at = NOW() WHERE category_id = ?', [id]);

    res.json({
      success: true,
      message: 'Category image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/categories/:id/image-url
 * Set category image via URL
 */
router.post('/categories/:id/image-url', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;

    const [existing] = await query('SELECT category_id, category_image FROM categories WHERE category_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (!url) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    // Delete old image file if it exists and is not a URL
    if (existing.category_image && !existing.category_image.startsWith('http')) {
      await deleteFile(existing.category_image);
    }

    await query('UPDATE categories SET category_image = ?, updated_at = NOW() WHERE category_id = ?', [url, id]);

    res.json({
      success: true,
      message: 'Category image updated successfully',
      data: { category_id: parseInt(id), category_image: url }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update image',
      error: error.message,
    });
  }
});

// ==================== PRODUCT OPTIONS ====================

/**
 * GET /api/admin/v1/test/option-types
 * Get all option types with their values
 */
router.get('/option-types', authenticate, async (req, res) => {
  try {
    const types = await query(`
      SELECT option_type_id, type_name_en, type_name_ar,
             display_order, is_active, created_at
      FROM product_option_types
      ORDER BY display_order ASC, type_name_en ASC
    `);

    // Get values for each type
    for (let type of types) {
      const values = await query(`
        SELECT option_value_id, option_type_id, value_name_en, value_name_ar,
               additional_price, display_order, is_active
        FROM product_option_values
        WHERE option_type_id = ?
        ORDER BY display_order ASC, value_name_en ASC
      `, [type.option_type_id]);
      type.values = values;
    }

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get option types',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/option-types
 * Create option type
 */
router.post('/option-types', authenticate, async (req, res) => {
  try {
    const {
      type_name_en,
      type_name_ar,
      display_order = 0,
      is_active = 1
    } = req.body;

    if (!type_name_en) {
      return res.status(400).json({ success: false, message: 'Type name (English) is required' });
    }

    const result = await query(`
      INSERT INTO product_option_types (type_name_en, type_name_ar, display_order, is_active, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [
      type_name_en,
      type_name_ar || type_name_en,
      display_order,
      is_active ? 1 : 0
    ]);

    const [optionType] = await query('SELECT * FROM product_option_types WHERE option_type_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Option type created successfully',
      data: optionType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create option type',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/option-types/:id
 * Update option type
 */
router.put('/option-types/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { type_name_en, type_name_ar, display_order, is_active } = req.body;

    const [existing] = await query('SELECT * FROM product_option_types WHERE option_type_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Option type not found' });
    }

    await query(`
      UPDATE product_option_types
      SET type_name_en = ?, type_name_ar = ?, display_order = ?, is_active = ?
      WHERE option_type_id = ?
    `, [
      type_name_en || existing.type_name_en,
      type_name_ar || existing.type_name_ar,
      display_order !== undefined ? display_order : existing.display_order,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    ]);

    const [updated] = await query('SELECT * FROM product_option_types WHERE option_type_id = ?', [id]);

    res.json({
      success: true,
      message: 'Option type updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update option type',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/option-types/:id
 * Delete option type
 */
router.delete('/option-types/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM product_option_types WHERE option_type_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Option type not found' });
    }

    // Delete all values first
    await query('DELETE FROM product_option_values WHERE option_type_id = ?', [id]);
    // Delete product options linking
    await query('DELETE FROM product_options WHERE option_type_id = ?', [id]);
    // Delete the type
    await query('DELETE FROM product_option_types WHERE option_type_id = ?', [id]);

    res.json({
      success: true,
      message: 'Option type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete option type',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/option-types/:typeId/values
 * Create option value
 */
router.post('/option-types/:typeId/values', authenticate, async (req, res) => {
  try {
    const { typeId } = req.params;
    const {
      value_name_en,
      value_name_ar,
      additional_price = 0,
      display_order = 0,
      is_active = 1
    } = req.body;

    const [type] = await query('SELECT * FROM product_option_types WHERE option_type_id = ?', [typeId]);
    if (!type) {
      return res.status(404).json({ success: false, message: 'Option type not found' });
    }

    if (!value_name_en) {
      return res.status(400).json({ success: false, message: 'Value name (English) is required' });
    }

    const result = await query(`
      INSERT INTO product_option_values (option_type_id, value_name_en, value_name_ar, additional_price, display_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      typeId,
      value_name_en,
      value_name_ar || value_name_en,
      parseFloat(additional_price) || 0,
      display_order,
      is_active ? 1 : 0
    ]);

    const [value] = await query('SELECT * FROM product_option_values WHERE option_value_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Option value created successfully',
      data: value
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create option value',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/option-values/:id
 * Update option value
 */
router.put('/option-values/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { value_name_en, value_name_ar, additional_price, display_order, is_active } = req.body;

    const [existing] = await query('SELECT * FROM product_option_values WHERE option_value_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Option value not found' });
    }

    await query(`
      UPDATE product_option_values
      SET value_name_en = ?, value_name_ar = ?, additional_price = ?, display_order = ?, is_active = ?
      WHERE option_value_id = ?
    `, [
      value_name_en || existing.value_name_en,
      value_name_ar || existing.value_name_ar,
      additional_price !== undefined ? parseFloat(additional_price) || 0 : existing.additional_price,
      display_order !== undefined ? display_order : existing.display_order,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    ]);

    const [updated] = await query('SELECT * FROM product_option_values WHERE option_value_id = ?', [id]);

    res.json({
      success: true,
      message: 'Option value updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update option value',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/option-values/:id
 * Delete option value
 */
router.delete('/option-values/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM product_option_values WHERE option_value_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Option value not found' });
    }

    await query('DELETE FROM product_option_values WHERE option_value_id = ?', [id]);

    res.json({
      success: true,
      message: 'Option value deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete option value',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/products
 * Create product (simplified)
 */
router.post('/products', authenticate, async (req, res) => {
  try {
    const {
      product_name_en,
      product_name_ar,
      product_description_en,
      product_description_ar,
      base_price,
      discount_percentage = 0,
      sku,
      stock_quantity = 0,
      category_id,
      subcategory_id,
      is_active = 1,
      is_featured = 0,
      meta_keywords,
      option_values = []
    } = req.body;

    // Validate required fields
    if (!product_name_en) {
      return res.status(400).json({ success: false, message: 'Product name (English) is required' });
    }
    if (!base_price || base_price <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    // Auto-generate SKU if not provided
    let finalSku = sku;
    if (!finalSku) {
      const prefix = product_name_en.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
      const timestamp = Date.now().toString(36).toUpperCase();
      finalSku = `${prefix}-${timestamp}`;
    }

    // Check if SKU exists
    const [existing] = await query('SELECT product_id FROM products WHERE sku = ?', [finalSku]);
    if (existing) {
      finalSku = `${finalSku}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    }

    const result = await query(`
      INSERT INTO products (
        category_id, subcategory_id, product_name_en, product_name_ar,
        product_description_en, product_description_ar,
        base_price, discount_percentage, sku, stock_quantity, is_active, is_featured,
        meta_keywords, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      category_id,
      subcategory_id || null,
      product_name_en,
      product_name_ar || product_name_en,
      product_description_en || '',
      product_description_ar || product_description_en || '',
      base_price,
      discount_percentage,
      finalSku,
      stock_quantity,
      is_active ? 1 : 0,
      is_featured ? 1 : 0,
      meta_keywords || null
    ]);

    const productId = result.insertId;

    // Insert product options if provided
    if (option_values && option_values.length > 0) {
      for (const optionValueId of option_values) {
        // Get the option_type_id for this value
        const [optionValue] = await query('SELECT option_type_id FROM product_option_values WHERE option_value_id = ?', [optionValueId]);
        if (optionValue) {
          try {
            await query(`
              INSERT INTO product_options (product_id, option_type_id, option_value_id)
              VALUES (?, ?, ?)
            `, [productId, optionValue.option_type_id, optionValueId]);
          } catch (insertError) {
            console.error('Error inserting product option:', insertError.message);
          }
        }
      }
    }

    // Get created product
    const [product] = await query('SELECT * FROM products WHERE product_id = ?', [productId]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/products/:id
 * Update product (simplified)
 */
router.put('/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { option_values, ...updates } = req.body;

    // Check if product exists
    const [existing] = await query('SELECT * FROM products WHERE product_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Build update query dynamically
    const allowedFields = [
      'product_name_en', 'product_name_ar',
      'product_description_en', 'product_description_ar',
      'base_price', 'discount_percentage', 'sku', 'stock_quantity',
      'category_id', 'subcategory_id', 'is_active', 'is_featured',
      'meta_keywords'
    ];

    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(value === '' ? null : value);
      }
    }

    if (setClauses.length > 0) {
      setClauses.push('updated_at = NOW()');
      values.push(id);
      await query(`UPDATE products SET ${setClauses.join(', ')} WHERE product_id = ?`, values);
    }

    // Update product options if provided (only if table exists)
    if (option_values !== undefined) {
      try {
        // Check if product_options table exists
        const tableCheck = await query(`
          SELECT COUNT(*) as cnt FROM information_schema.tables
          WHERE table_schema = DATABASE() AND table_name = 'product_options'
        `);

        if (tableCheck[0]?.cnt > 0) {
          // Delete existing options
          await query('DELETE FROM product_options WHERE product_id = ?', [id]);

          // Insert new options
          if (option_values && option_values.length > 0) {
            for (const optionValueId of option_values) {
              const [optionValue] = await query('SELECT option_type_id FROM product_option_values WHERE option_value_id = ?', [optionValueId]);
              if (optionValue) {
                await query(`
                  INSERT INTO product_options (product_id, option_type_id, option_value_id)
                  VALUES (?, ?, ?)
                `, [id, optionValue.option_type_id, optionValueId]);
              }
            }
          }
        } else {
          console.log('product_options table does not exist, skipping options update');
        }
      } catch (optionError) {
        console.error('Error updating product options:', optionError.message);
        // Continue anyway - don't fail the entire update
      }
    }

    // Get updated product
    const [product] = await query('SELECT * FROM products WHERE product_id = ?', [id]);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/products/:id
 * Delete product
 */
router.delete('/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [existing] = await query('SELECT * FROM products WHERE product_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check for order items
    const [orderItem] = await query('SELECT order_item_id FROM order_items WHERE product_id = ? LIMIT 1', [id]);
    if (orderItem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with existing orders. Deactivate it instead.'
      });
    }

    // Helper to safely delete from tables (ignores if table doesn't exist)
    const safeDelete = async (sql, params) => {
      try {
        await query(sql, params);
      } catch (err) {
        // Ignore table doesn't exist errors (1146)
        if (err.errno !== 1146) throw err;
      }
    };

    // Delete related data first (tables with foreign keys)
    await safeDelete('DELETE FROM product_images WHERE product_id = ?', [id]);
    await safeDelete('DELETE FROM product_option_combinations WHERE product_id = ?', [id]);
    await safeDelete('DELETE FROM product_attributes WHERE product_id = ?', [id]);
    await safeDelete('DELETE FROM product_options WHERE product_id = ?', [id]);
    await safeDelete('DELETE FROM cart_items WHERE product_id = ?', [id]);
    await safeDelete('DELETE FROM wishlist WHERE product_id = ?', [id]);
    await safeDelete('DELETE FROM product_reviews WHERE product_id = ?', [id]);

    // Delete from bill/invoice tables (no cascade)
    await safeDelete('DELETE FROM customer_bill_items WHERE product_id = ?', [id]);
    await safeDelete('DELETE FROM trader_bill_items WHERE product_id = ?', [id]);
    await safeDelete('DELETE FROM wholesaler_order_items WHERE product_id = ?', [id]);
    await safeDelete('UPDATE invoice_items SET product_id = NULL WHERE product_id = ?', [id]);

    // Delete product
    await query('DELETE FROM products WHERE product_id = ?', [id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/products/:id/toggle-status
 * Toggle product active status
 */
router.patch('/products/:id/toggle-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT is_active FROM products WHERE product_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newStatus = existing.is_active ? 0 : 1;
    await query('UPDATE products SET is_active = ?, updated_at = NOW() WHERE product_id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Product ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { is_active: newStatus }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle status',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/generate-sku
 * Generate unique SKU
 */
router.get('/generate-sku', authenticate, async (req, res) => {
  try {
    const { prefix = 'PRD' } = req.query;
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `${prefix}-${timestamp}-${random}`;

    res.json({
      success: true,
      data: { sku }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate SKU',
      error: error.message,
    });
  }
});

// ==================== PRODUCT IMAGES ====================

/**
 * POST /api/admin/v1/test/products/:id/images
 * Upload images for a product
 */
router.post('/products/:id/images', authenticate, productImageUpload.array('images', 10), handleMulterError, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [product] = await query('SELECT product_id FROM products WHERE product_id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    // Check existing images count
    const [countResult] = await query('SELECT COUNT(*) as count FROM product_images WHERE product_id = ?', [id]);
    const existingCount = countResult?.count || 0;

    // Insert images into database
    const insertedImages = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageUrl = `uploads/products/${file.filename}`;
      const isPrimary = existingCount === 0 && i === 0 ? 1 : 0;
      const displayOrder = existingCount + i;

      const result = await query(`
        INSERT INTO product_images (product_id, image_url, is_primary, display_order, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [id, imageUrl, isPrimary, displayOrder]);

      insertedImages.push({
        image_id: result.insertId,
        product_id: parseInt(id),
        image_url: imageUrl,
        is_primary: isPrimary,
        display_order: displayOrder
      });
    }

    res.status(201).json({
      success: true,
      message: `${insertedImages.length} image(s) uploaded successfully`,
      data: insertedImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/products/:id/images-url
 * Add images to a product via URL
 */
router.post('/products/:id/images-url', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { urls, primaryIndex = 0 } = req.body;

    // Check if product exists
    const [product] = await query('SELECT product_id FROM products WHERE product_id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, message: 'No image URLs provided' });
    }

    // Check existing images count
    const [countResult] = await query('SELECT COUNT(*) as count FROM product_images WHERE product_id = ?', [id]);
    const existingCount = countResult?.count || 0;

    // Insert images into database
    const insertedImages = [];
    for (let i = 0; i < urls.length; i++) {
      const imageUrl = urls[i];
      const isPrimary = existingCount === 0 && i === primaryIndex ? 1 : 0;
      const displayOrder = existingCount + i;

      const result = await query(`
        INSERT INTO product_images (product_id, image_url, is_primary, display_order, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [id, imageUrl, isPrimary, displayOrder]);

      insertedImages.push({
        image_id: result.insertId,
        product_id: parseInt(id),
        image_url: imageUrl,
        is_primary: isPrimary,
        display_order: displayOrder
      });
    }

    res.status(201).json({
      success: true,
      message: `${insertedImages.length} image(s) added successfully`,
      data: insertedImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add images',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/products/:id/images
 * Get all images for a product
 */
router.get('/products/:id/images', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const images = await query(`
      SELECT image_id, product_id, image_url, is_primary, display_order, created_at
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC
    `, [id]);

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get images',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/products/:productId/images/:imageId
 * Delete a product image
 */
router.delete('/products/:productId/images/:imageId', authenticate, async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    // Get image info
    const [image] = await query('SELECT * FROM product_images WHERE image_id = ? AND product_id = ?', [imageId, productId]);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Delete file from disk
    if (image.image_url) {
      await deleteFile(image.image_url);
    }

    // Delete from database
    await query('DELETE FROM product_images WHERE image_id = ?', [imageId]);

    // If deleted image was primary, set another as primary
    if (image.is_primary) {
      const [nextImage] = await query(
        'SELECT image_id FROM product_images WHERE product_id = ? ORDER BY display_order ASC LIMIT 1',
        [productId]
      );
      if (nextImage) {
        await query('UPDATE product_images SET is_primary = 1 WHERE image_id = ?', [nextImage.image_id]);
      }
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/products/:productId/images/:imageId/primary
 * Set image as primary
 */
router.patch('/products/:productId/images/:imageId/primary', authenticate, async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    // Check if image exists
    const [image] = await query('SELECT * FROM product_images WHERE image_id = ? AND product_id = ?', [imageId, productId]);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Reset all images for this product
    await query('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);

    // Set this image as primary
    await query('UPDATE product_images SET is_primary = 1 WHERE image_id = ?', [imageId]);

    res.json({
      success: true,
      message: 'Primary image updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to set primary image',
      error: error.message,
    });
  }
});

// ==================== SUBCATEGORIES ====================

/**
 * GET /api/admin/v1/test/subcategories-list
 * Full subcategories list
 */
router.get('/subcategories-list', authenticate, async (req, res) => {
  try {
    const { category_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category_id) {
      whereClause += ' AND sc.category_id = ?';
      params.push(category_id);
    }

    const subcategories = await query(`
      SELECT sc.subcategory_id, sc.category_id,
             sc.subcategory_name_en, sc.subcategory_name_ar,
             sc.is_active, sc.is_featured, sc.display_order, sc.created_at,
             c.category_name_en as category_name,
             (SELECT COUNT(*) FROM products WHERE subcategory_id = sc.subcategory_id) as product_count
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.category_id
      ${whereClause}
      ORDER BY c.display_order ASC, sc.display_order ASC, sc.subcategory_name_en ASC
    `, params);

    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get subcategories',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/products/:id
 * Get single product with all details
 */
router.get('/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [product] = await query(`
      SELECT p.*,
             c.category_name_en as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [id]);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get product images
    const images = await query(`
      SELECT image_id, product_id, image_url, is_primary, display_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC
    `, [id]);

    product.images = images;

    // Get product option types linked to this product
    const optionTypes = await query(`
      SELECT po.product_option_id, po.option_type_id, po.is_required, po.display_order,
             pot.type_name_en, pot.type_name_ar
      FROM product_options po
      JOIN product_option_types pot ON po.option_type_id = pot.option_type_id
      WHERE po.product_id = ?
      ORDER BY po.display_order
    `, [id]);

    // Get option values for each option type
    const optionTypeIds = optionTypes.map(ot => ot.option_type_id);
    let optionValues = [];
    if (optionTypeIds.length > 0) {
      const placeholders = optionTypeIds.map(() => '?').join(',');
      optionValues = await query(`
        SELECT pov.option_value_id, pov.option_type_id,
               pov.value_name_en, pov.value_name_ar,
               pov.additional_price, pov.display_order, pov.is_active
        FROM product_option_values pov
        WHERE pov.option_type_id IN (${placeholders}) AND pov.is_active = 1
        ORDER BY pov.display_order
      `, optionTypeIds);
    }

    product.option_types = optionTypes;
    product.option_values = optionValues;

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message,
    });
  }
});

// ==================== VARIANTS ====================

/**
 * GET /api/admin/v1/test/variants/product/:productId
 * Get variants for a product
 */
router.get('/variants/product/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const { lang = 'en' } = req.query;

    const variants = await query(`
      SELECT
        v.variant_id,
        v.product_id,
        v.color_id,
        v.size_id,
        v.additional_price as price,
        v.stock_quantity,
        v.sku,
        v.created_at,
        c.color_name_${lang} as color_name,
        c.color_hex_code as color_code,
        s.size_name as size_name,
        s.size_value as size_code
      FROM product_variants v
      LEFT JOIN product_colors c ON v.color_id = c.color_id
      LEFT JOIN product_sizes s ON v.size_id = s.size_id
      WHERE v.product_id = ?
      ORDER BY v.variant_id ASC
    `, [productId]);

    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get variants',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/variants
 * Create a new variant
 */
router.post('/variants', authenticate, async (req, res) => {
  try {
    const { product_id, color_id, size_id, price, stock_quantity = 0 } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Auto-generate SKU
    const timestamp = Date.now().toString(36).toUpperCase();
    const colorPart = color_id ? `C${color_id}` : '';
    const sizePart = size_id ? `S${size_id}` : '';
    const autoSku = `P${product_id}-${colorPart}${sizePart}-${timestamp}`;

    const result = await query(`
      INSERT INTO product_variants (product_id, color_id, size_id, sku, additional_price, stock_quantity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [product_id, color_id || null, size_id || null, autoSku, price || 0, stock_quantity]);

    const [variant] = await query('SELECT * FROM product_variants WHERE variant_id = ?', [result.insertId]);

    res.json({
      success: true,
      data: variant,
      message: 'Variant created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create variant',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/variants/:id
 * Update a variant
 */
router.put('/variants/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { color_id, size_id, price, stock_quantity } = req.body;

    const updates = [];
    const values = [];

    if (color_id !== undefined) {
      updates.push('color_id = ?');
      values.push(color_id || null);
    }
    if (size_id !== undefined) {
      updates.push('size_id = ?');
      values.push(size_id || null);
    }
    if (price !== undefined) {
      updates.push('additional_price = ?');
      values.push(price);
    }
    if (stock_quantity !== undefined) {
      updates.push('stock_quantity = ?');
      values.push(stock_quantity);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    await query(`UPDATE product_variants SET ${updates.join(', ')} WHERE variant_id = ?`, values);

    const [variant] = await query('SELECT * FROM product_variants WHERE variant_id = ?', [id]);

    res.json({
      success: true,
      data: variant,
      message: 'Variant updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update variant',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/variants/:id
 * Delete a variant
 */
router.delete('/variants/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if variant exists
    const [variant] = await query('SELECT * FROM product_variants WHERE variant_id = ?', [id]);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    await query('DELETE FROM product_variants WHERE variant_id = ?', [id]);

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete variant',
      error: error.message,
    });
  }
});

// ==================== ADMIN USERS ====================

/**
 * GET /api/admin/v1/test/admin-users
 * Get all admin users
 */
router.get('/admin-users', authenticate, async (req, res) => {
  try {
    // First check what columns exist
    const admins = await query(`
      SELECT admin_id, username, email, full_name, role, is_active, created_at, updated_at
      FROM admin_users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get admin users',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/admin-users/:id
 * Get single admin user
 */
router.get('/admin-users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [admin] = await query(`
      SELECT admin_id, username, email, full_name, role, is_active, created_at, updated_at
      FROM admin_users
      WHERE admin_id = ?
    `, [id]);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get admin',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/admin-users
 * Create new admin user
 */
router.post('/admin-users', authenticate, async (req, res) => {
  try {
    const { username, email, password, full_name, role = 'admin', is_active = true } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }

    // Check if email already exists
    const [existing] = await query('SELECT * FROM admin_users WHERE email = ? OR username = ?', [email, username]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or username already exists' });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(`
      INSERT INTO admin_users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [username, email, password_hash, full_name || null, role, is_active ? 1 : 0]);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: { admin_id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/admin-users/:id
 * Update admin user
 */
router.put('/admin-users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, full_name, role, is_active } = req.body;

    const [existing] = await query('SELECT * FROM admin_users WHERE admin_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Check if email/username already taken by another admin
    if (email || username) {
      const [duplicate] = await query(
        'SELECT * FROM admin_users WHERE (email = ? OR username = ?) AND admin_id != ?',
        [email || existing.email, username || existing.username, id]
      );
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Email or username already exists' });
      }
    }

    let updateQuery = `
      UPDATE admin_users SET
        username = ?,
        email = ?,
        full_name = ?,
        role = ?,
        is_active = ?,
        updated_at = NOW()
    `;
    let params = [
      username || existing.username,
      email || existing.email,
      full_name !== undefined ? full_name : existing.full_name,
      role || existing.role,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active
    ];

    // Update password if provided
    if (password) {
      const bcrypt = require('bcrypt');
      const password_hash = await bcrypt.hash(password, 10);
      updateQuery = `
        UPDATE admin_users SET
          username = ?,
          email = ?,
          password_hash = ?,
          full_name = ?,
          role = ?,
          is_active = ?,
          updated_at = NOW()
      `;
      params = [
        username || existing.username,
        email || existing.email,
        password_hash,
        full_name !== undefined ? full_name : existing.full_name,
        role || existing.role,
        is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active
      ];
      updateQuery += ' WHERE admin_id = ?';
    } else {
      updateQuery += ' WHERE admin_id = ?';
    }

    params.push(id);
    await query(updateQuery, params);

    res.json({
      success: true,
      message: 'Admin user updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update admin user',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/admin-users/:id/toggle-status
 * Toggle admin active status
 */
router.patch('/admin-users/:id/toggle-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT is_active FROM admin_users WHERE admin_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const newStatus = existing.is_active ? 0 : 1;
    await query('UPDATE admin_users SET is_active = ?, updated_at = NOW() WHERE admin_id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Admin ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle admin status',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/admin-users/:id
 * Delete admin user
 */
router.delete('/admin-users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.admin && req.admin.adminId === parseInt(id)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const [existing] = await query('SELECT * FROM admin_users WHERE admin_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await query('DELETE FROM admin_users WHERE admin_id = ?', [id]);

    res.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin user',
      error: error.message,
    });
  }
});

// ==================== BILL IMAGES ====================

/**
 * GET /api/admin/v1/test/bill-images
 * Get all bill images from database
 */
router.get('/bill-images', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 12, bill_type = '', is_processed = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (bill_type) {
      whereClause += ' AND bill_type = ?';
      params.push(bill_type);
    }

    if (is_processed === 'true') {
      whereClause += ' AND is_processed = 1';
    } else if (is_processed === 'false') {
      whereClause += ' AND is_processed = 0';
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM bill_images ${whereClause}`, params);
    const total = countResult[0]?.total || 0;

    // Get bill images with uploader info
    const billImages = await query(`
      SELECT bi.*, a.username as uploaded_by_name
      FROM bill_images bi
      LEFT JOIN admin_users a ON bi.uploaded_by = a.admin_id
      ${whereClause}
      ORDER BY bi.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params);

    res.json({
      success: true,
      data: {
        billImages,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bill images',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/bill-images/:id
 * Get single bill image
 */
router.get('/bill-images/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [billImage] = await query(`
      SELECT bi.*,
             a1.username as uploaded_by_name,
             a2.username as processed_by_name
      FROM bill_images bi
      LEFT JOIN admin_users a1 ON bi.uploaded_by = a1.admin_id
      LEFT JOIN admin_users a2 ON bi.processed_by = a2.admin_id
      WHERE bi.bill_image_id = ?
    `, [id]);

    if (!billImage) {
      return res.status(404).json({ success: false, message: 'Bill image not found' });
    }

    res.json({
      success: true,
      data: billImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bill image',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/bill-images
 * Upload bill images to database
 */
router.post('/bill-images', authenticate, productImageUpload.array('images', 10), handleMulterError, async (req, res) => {
  try {
    const { bill_type = 'purchase', description = '' } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const imageUrl = `uploads/products/${file.filename}`;

      const result = await query(`
        INSERT INTO bill_images (image_url, original_filename, file_size, bill_type, description, is_processed, uploaded_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, NOW(), NOW())
      `, [imageUrl, file.originalname, file.size, bill_type, description || null, req.admin.adminId]);

      const [billImage] = await query('SELECT * FROM bill_images WHERE bill_image_id = ?', [result.insertId]);
      uploadedImages.push(billImage);
    }

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} bill image(s) uploaded successfully`,
      data: uploadedImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload bill images',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/bill-images-url
 * Add bill images via URL
 */
router.post('/bill-images-url', authenticate, async (req, res) => {
  try {
    const { urls, bill_type = 'purchase', description = '' } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, message: 'No image URLs provided' });
    }

    const uploadedImages = [];
    for (const url of urls) {
      const result = await query(`
        INSERT INTO bill_images (image_url, original_filename, file_size, bill_type, description, is_processed, uploaded_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, NOW(), NOW())
      `, [url, url.split('/').pop() || 'image', 0, bill_type, description || null, req.admin.adminId]);

      const [billImage] = await query('SELECT * FROM bill_images WHERE bill_image_id = ?', [result.insertId]);
      uploadedImages.push(billImage);
    }

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} bill image(s) added successfully`,
      data: uploadedImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add bill images',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/bill-images/:id/processed
 * Toggle processed status in database
 */
router.patch('/bill-images/:id/processed', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_processed } = req.body;

    const [existing] = await query('SELECT * FROM bill_images WHERE bill_image_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bill image not found' });
    }

    // Update processed status
    if (is_processed) {
      await query(`
        UPDATE bill_images
        SET is_processed = 1, processed_by = ?, processed_at = NOW(), updated_at = NOW()
        WHERE bill_image_id = ?
      `, [req.admin.adminId, id]);
    } else {
      await query(`
        UPDATE bill_images
        SET is_processed = 0, processed_by = NULL, processed_at = NULL, updated_at = NOW()
        WHERE bill_image_id = ?
      `, [id]);
    }

    const [billImage] = await query('SELECT * FROM bill_images WHERE bill_image_id = ?', [id]);

    res.json({
      success: true,
      message: `Bill image marked as ${is_processed ? 'processed' : 'unprocessed'}`,
      data: billImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bill image',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/bill-images/:id
 * Update bill image details
 */
router.put('/bill-images/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { bill_type, description } = req.body;

    const [existing] = await query('SELECT * FROM bill_images WHERE bill_image_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bill image not found' });
    }

    await query(`
      UPDATE bill_images
      SET bill_type = ?, description = ?, updated_at = NOW()
      WHERE bill_image_id = ?
    `, [bill_type || existing.bill_type, description !== undefined ? description : existing.description, id]);

    const [billImage] = await query('SELECT * FROM bill_images WHERE bill_image_id = ?', [id]);

    res.json({
      success: true,
      message: 'Bill image updated successfully',
      data: billImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bill image',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/bill-images/:id
 * Delete a bill image from database and disk
 */
router.delete('/bill-images/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [billImage] = await query('SELECT * FROM bill_images WHERE bill_image_id = ?', [id]);
    if (!billImage) {
      return res.status(404).json({ success: false, message: 'Bill image not found' });
    }

    // Delete file from disk
    if (billImage.image_url) {
      await deleteFile(billImage.image_url);
    }

    // Delete from database
    await query('DELETE FROM bill_images WHERE bill_image_id = ?', [id]);

    res.json({
      success: true,
      message: 'Bill image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete bill image',
      error: error.message,
    });
  }
});

// ==================== INVOICES (from Orders) ====================

/**
 * GET /api/admin/v1/test/invoices
 * Get invoices derived from orders
 */
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (o.order_number LIKE ? OR o.guest_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Map invoice status to order payment_status
    if (status === 'paid') {
      whereClause += ' AND o.payment_status = "paid"';
    } else if (status === 'pending') {
      whereClause += ' AND o.payment_status = "pending"';
    } else if (status === 'cancelled') {
      whereClause += ' AND o.status = "cancelled"';
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM orders o
      ${whereClause}
    `, params);
    const total = countResult[0]?.total || 0;

    // Get orders as invoices
    const orders = await query(`
      SELECT o.order_id as invoice_id, o.order_id, o.order_number,
             o.subtotal, o.tax_amount, COALESCE(o.delivery_fee, o.shipping_cost, 0) as shipping_cost, o.discount_amount,
             o.total_amount, o.payment_status, o.status as order_status,
             o.created_at, o.updated_at,
             o.guest_name as customer_name,
             o.guest_email as customer_email
      FROM orders o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params);

    // Map to invoice format
    const invoices = orders.map(o => ({
      invoice_id: o.invoice_id,
      invoice_number: `INV-${o.order_number}`,
      order_id: o.order_id,
      customer_name: o.customer_name || 'Guest',
      customer_email: o.customer_email,
      subtotal: o.subtotal,
      tax_amount: o.tax_amount,
      shipping_cost: o.shipping_cost,
      discount_amount: o.discount_amount,
      total_amount: o.total_amount,
      status: o.order_status === 'cancelled' ? 'cancelled' : (o.payment_status === 'paid' ? 'paid' : 'pending'),
      created_at: o.created_at,
      updated_at: o.updated_at
    }));

    res.json({
      success: true,
      data: {
        invoices,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/invoices/:id
 * Get single invoice (order) details
 */
router.get('/invoices/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [order] = await query(`
      SELECT o.*,
             COALESCE(o.delivery_fee, o.shipping_cost, 0) as shipping_cost,
             o.guest_name as customer_name,
             o.guest_email as customer_email,
             o.guest_phone as customer_phone
      FROM orders o
      WHERE o.order_id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Get order items
    const items = await query(`
      SELECT oi.*, p.product_name_en
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);

    // Get address
    const [address] = await query('SELECT * FROM user_addresses WHERE address_id = ?', [order.address_id]);

    const invoice = {
      invoice_id: order.order_id,
      invoice_number: `INV-${order.order_number}`,
      order_id: order.order_id,
      customer_name: order.customer_name || 'Guest',
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      shipping_cost: order.shipping_cost,
      delivery_region: order.region,
      guest_address: order.guest_address,
      discount_amount: order.discount_amount,
      total_amount: order.total_amount,
      status: order.status === 'cancelled' ? 'cancelled' : (order.payment_status === 'paid' ? 'paid' : 'pending'),
      payment_method: order.payment_method,
      notes: order.notes,
      items: items,
      address: address,
      created_at: order.created_at,
      updated_at: order.updated_at
    };

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/invoices/:id/paid
 * Mark invoice as paid
 */
router.put('/invoices/:id/paid', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM orders WHERE order_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    await query('UPDATE orders SET payment_status = "paid", updated_at = NOW() WHERE order_id = ?', [id]);

    res.json({
      success: true,
      message: 'Invoice marked as paid'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message,
    });
  }
});

// ==================== MESSAGES ====================

/**
 * GET /api/admin/v1/test/messages
 * Get all contact messages with pagination and filters
 */
router.get('/messages', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND m.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM contact_messages m ${whereClause}`, params);
    const total = countResult[0]?.total || 0;

    // Get messages
    const messages = await query(`
      SELECT m.message_id, m.user_id, m.name, m.email, m.phone_number,
             m.subject, m.message, m.status, m.admin_reply,
             m.replied_by, m.replied_at, m.created_at, m.updated_at
      FROM contact_messages m
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params);

    // Map status to is_read for frontend compatibility
    const mappedMessages = messages.map(m => ({
      ...m,
      is_read: m.status !== 'pending'
    }));

    res.json({
      success: true,
      data: {
        messages: mappedMessages,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/messages/:id
 * Get single message
 */
router.get('/messages/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [message] = await query(`
      SELECT m.*, a.full_name as replied_by_name
      FROM contact_messages m
      LEFT JOIN admin_users a ON m.replied_by = a.admin_id
      WHERE m.message_id = ?
    `, [id]);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.is_read = message.status !== 'pending';

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get message',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/messages/:id/read
 * Mark message as read (change status from pending to in_progress)
 */
router.put('/messages/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM contact_messages WHERE message_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (existing.status === 'pending') {
      await query('UPDATE contact_messages SET status = "in_progress", updated_at = NOW() WHERE message_id = ?', [id]);
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/messages/:id/reply
 * Reply to a message
 */
router.put('/messages/:id/reply', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const [existing] = await query('SELECT * FROM contact_messages WHERE message_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await query(`
      UPDATE contact_messages
      SET admin_reply = ?, replied_by = ?, replied_at = NOW(), status = "resolved", updated_at = NOW()
      WHERE message_id = ?
    `, [reply, req.admin.adminId, id]);

    res.json({
      success: true,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/messages/:id/status
 * Update message status
 */
router.patch('/messages/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const [existing] = await query('SELECT * FROM contact_messages WHERE message_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await query('UPDATE contact_messages SET status = ?, updated_at = NOW() WHERE message_id = ?', [status, id]);

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/messages/:id
 * Delete a message
 */
router.delete('/messages/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM contact_messages WHERE message_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await query('DELETE FROM contact_messages WHERE message_id = ?', [id]);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
});

// ==================== REVIEWS ====================

/**
 * GET /api/admin/v1/test/reviews
 * Get all reviews with pagination and filters
 */
router.get('/reviews', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', rating = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status === 'pending') {
      whereClause += ' AND r.is_approved = 0';
    } else if (status === 'approved') {
      whereClause += ' AND r.is_approved = 1';
    } else if (status === 'rejected') {
      whereClause += ' AND r.is_approved = -1';
    }

    if (rating) {
      whereClause += ' AND r.rating = ?';
      params.push(parseInt(rating));
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM product_reviews r ${whereClause}`, params);
    const total = countResult[0]?.total || 0;

    // Get reviews with product info (users table removed)
    const reviews = await query(`
      SELECT r.review_id, r.product_id, r.user_id, r.rating, r.review_text, r.is_approved, r.created_at,
             p.product_name_en as product_name,
             'Guest' as customer_name, NULL as customer_email
      FROM product_reviews r
      LEFT JOIN products p ON r.product_id = p.product_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, params);

    // Map is_approved to status: 1=approved, 0=pending, -1=rejected
    const mappedReviews = reviews.map(r => ({
      ...r,
      status: r.is_approved === 1 ? 'approved' : (r.is_approved === -1 ? 'rejected' : 'pending')
    }));

    res.json({
      success: true,
      data: {
        reviews: mappedReviews,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/reviews/:id/status
 * Update review status (pending, approved, rejected)
 */
router.put('/reviews/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const [existing] = await query('SELECT * FROM product_reviews WHERE review_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Map status to is_approved: approved=1, pending=0, rejected=-1
    const isApprovedValue = status === 'approved' ? 1 : (status === 'rejected' ? -1 : 0);
    await query('UPDATE product_reviews SET is_approved = ? WHERE review_id = ?', [isApprovedValue, id]);

    res.json({
      success: true,
      message: `Review ${status} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update review status',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/reviews/:id/approve
 * Approve a review
 */
router.put('/reviews/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM product_reviews WHERE review_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await query('UPDATE product_reviews SET is_approved = 1 WHERE review_id = ?', [id]);

    res.json({
      success: true,
      message: 'Review approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve review',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/reviews/:id/reject
 * Reject a review (set is_approved to 0)
 */
router.put('/reviews/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM product_reviews WHERE review_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await query('UPDATE product_reviews SET is_approved = 0 WHERE review_id = ?', [id]);

    res.json({
      success: true,
      message: 'Review rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject review',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/reviews/:id
 * Delete a review
 */
router.delete('/reviews/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM product_reviews WHERE review_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await query('DELETE FROM product_reviews WHERE review_id = ?', [id]);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
});

// ==================== BANNERS ====================

/**
 * GET /api/admin/v1/test/banners
 * Get all banners sorted by display_order (media served from file path)
 */
router.get('/banners', authenticate, async (req, res) => {
  try {
    const banners = await query(`
      SELECT banner_id, title_en, title_ar, subtitle_en, subtitle_ar,
             media_path, media_type, mime_type, link_type, link_value, display_order,
             is_active, start_date, end_date, created_at, updated_at
      FROM banners
      ORDER BY display_order ASC, created_at DESC
    `);

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get banners',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/v1/test/banners/:id
 * Get single banner
 */
router.get('/banners/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [banner] = await query(`
      SELECT banner_id, title_en, title_ar, subtitle_en, subtitle_ar,
             media_path, media_type, mime_type, link_type, link_value, display_order,
             is_active, start_date, end_date, created_at, updated_at
      FROM banners WHERE banner_id = ?
    `, [id]);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get banner',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/v1/test/banners
 * Create a new banner with media upload stored as file path
 */
router.post('/banners', authenticate, bannerMediaUpload.single('media'), handleMulterError, async (req, res) => {
  try {
    const {
      title_en, title_ar,
      subtitle_en, subtitle_ar,
      media_type = 'image',
      link_type = 'none', link_value,
      display_order = 0, is_active = 1,
      start_date, end_date
    } = req.body;

    let mediaPath = null;
    let mimeType = null;

    if (req.file) {
      mediaPath = `uploads/banners/${req.file.filename}`; // Store file path
      mimeType = req.file.mimetype;
    }

    const result = await query(`
      INSERT INTO banners (
        title_en, title_ar, subtitle_en, subtitle_ar,
        media_path, media_type, mime_type, link_type, link_value,
        display_order, is_active, start_date, end_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      title_en || null, title_ar || null,
      subtitle_en || null, subtitle_ar || null,
      mediaPath, media_type, mimeType,
      link_type, link_value || null,
      parseInt(display_order) || 0, is_active ? 1 : 0,
      start_date || null, end_date || null
    ]);

    // Get created banner
    const [banner] = await query(`
      SELECT banner_id, title_en, title_ar, subtitle_en, subtitle_ar,
             media_path, media_type, mime_type, link_type, link_value, display_order,
             is_active, start_date, end_date, created_at, updated_at
      FROM banners WHERE banner_id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/v1/test/banners/:id
 * Update a banner with media stored as file path
 */
router.put('/banners/:id', authenticate, bannerMediaUpload.single('media'), handleMulterError, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title_en, title_ar,
      subtitle_en, subtitle_ar,
      media_type = 'image',
      link_type = 'none', link_value,
      display_order = 0, is_active = 1,
      start_date, end_date
    } = req.body;

    const [existing] = await query('SELECT banner_id, media_path FROM banners WHERE banner_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    // If new file uploaded, update media_path and delete old file
    if (req.file) {
      // Delete old media file if exists
      if (existing.media_path) {
        await deleteFile(existing.media_path);
      }

      const mediaPath = `uploads/banners/${req.file.filename}`;
      await query(`
        UPDATE banners SET
          title_en = ?, title_ar = ?,
          subtitle_en = ?, subtitle_ar = ?,
          media_path = ?, media_type = ?, mime_type = ?,
          link_type = ?, link_value = ?,
          display_order = ?, is_active = ?,
          start_date = ?, end_date = ?, updated_at = NOW()
        WHERE banner_id = ?
      `, [
        title_en || null, title_ar || null,
        subtitle_en || null, subtitle_ar || null,
        mediaPath, media_type, req.file.mimetype,
        link_type, link_value || null,
        parseInt(display_order) || 0, is_active ? 1 : 0,
        start_date || null, end_date || null,
        id
      ]);
    } else {
      // No new file, just update other fields
      await query(`
        UPDATE banners SET
          title_en = ?, title_ar = ?,
          subtitle_en = ?, subtitle_ar = ?,
          media_type = ?,
          link_type = ?, link_value = ?,
          display_order = ?, is_active = ?,
          start_date = ?, end_date = ?, updated_at = NOW()
        WHERE banner_id = ?
      `, [
        title_en || null, title_ar || null,
        subtitle_en || null, subtitle_ar || null,
        media_type,
        link_type, link_value || null,
        parseInt(display_order) || 0, is_active ? 1 : 0,
        start_date || null, end_date || null,
        id
      ]);
    }

    // Get updated banner
    const [banner] = await query(`
      SELECT banner_id, title_en, title_ar, subtitle_en, subtitle_ar,
             media_path, media_type, mime_type, link_type, link_value, display_order,
             is_active, start_date, end_date, created_at, updated_at
      FROM banners WHERE banner_id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/banners/:id/order
 * Update banner display order
 */
router.patch('/banners/:id/order', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { display_order } = req.body;

    const [existing] = await query('SELECT * FROM banners WHERE banner_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await query('UPDATE banners SET display_order = ?, updated_at = NOW() WHERE banner_id = ?', [
      parseInt(display_order) || 0, id
    ]);

    res.json({
      success: true,
      message: 'Display order updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update display order',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/v1/test/banners/:id/status
 * Toggle banner active status
 */
router.patch('/banners/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const [existing] = await query('SELECT * FROM banners WHERE banner_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await query('UPDATE banners SET is_active = ?, updated_at = NOW() WHERE banner_id = ?', [
      is_active ? 1 : 0, id
    ]);

    res.json({
      success: true,
      message: `Banner ${is_active ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update banner status',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/v1/test/banners/:id
 * Delete a banner and its media file
 */
router.delete('/banners/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT banner_id, media_path FROM banners WHERE banner_id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    // Delete media file from disk if exists
    if (existing.media_path) {
      await deleteFile(existing.media_path);
    }

    await query('DELETE FROM banners WHERE banner_id = ?', [id]);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message,
    });
  }
});

module.exports = router;
