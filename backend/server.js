/**
 * VinaShop Admin Backend Server
 * @description Main entry point for the Express application
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Config
const corsConfig = require('./config/cors');
const { testConnection } = require('./config/database');
const { runMigrations } = require('./config/migrations');

// Middleware
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const rateLimiter = require('./middleware/rateLimiter.middleware');

// Utils
const Logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const subcategoryRoutes = require('./routes/subcategory.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const messageRoutes = require('./routes/message.routes');
const reviewRoutes = require('./routes/review.routes');
// DEPRECATED: variant, color, size routes removed in Phase 6
const imageRoutes = require('./routes/image.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const billingRoutes = require('./routes/billing.routes');
const settingsRoutes = require('./routes/settings.routes');
const testRoutes = require('./routes/test.routes');
const productOptionRoutes = require('./routes/productOption.routes');
// const productOptionCombinationRoutes = require('./routes/productOptionCombination.routes'); // REMOVED - not needed
const dataMigrationRoutes = require('./routes/dataMigration.routes');
const billImageRoutes = require('./routes/billImage.routes');

// Phase 2 - New modules
const customerBillRoutes = require('./routes/customerBill.routes');
const customerDebtRoutes = require('./routes/customerDebt.routes');
const workerRoutes = require('./routes/worker.routes');
const traderRoutes = require('./routes/trader.routes');
const wholesalerRoutes = require('./routes/wholesaler.routes');

// Public routes (storefront - no auth required)
const publicRoutes = require('./routes/public.routes');

// Initialize Express app
const app = express();

// Initialize Logger
const logger = Logger.configure({
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.NODE_ENV === 'production',
  logDir: path.join(__dirname, 'logs'),
});

// ==================== Core Middleware ====================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors(corsConfig));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: Logger.stream }));
}

// Rate limiting
//app.use(rateLimiter.general);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ==================== Static Files ====================

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
}));

// Serve static assets
app.use('/static', express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
}));

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VinaShop Admin API',
    version: process.env.API_VERSION || '1.0.0',
    documentation: '/api/docs',
  });
});

// ==================== API Routes ====================

const API_PREFIX = '/api/admin/v1';

// ==================== Public Routes (Storefront) ====================
// No authentication required for public endpoints
app.use('/api/public', publicRoutes);

// ==================== Admin Routes ====================

// Authentication
app.use(`${API_PREFIX}/auth`, authRoutes);

// Admin management
app.use(`${API_PREFIX}/admins`, adminRoutes);

// Products
app.use(`${API_PREFIX}/products`, productRoutes);

// Categories
app.use(`${API_PREFIX}/categories`, categoryRoutes);

// Subcategories
app.use(`${API_PREFIX}/subcategories`, subcategoryRoutes);

// Orders
app.use(`${API_PREFIX}/orders`, orderRoutes);

// Users
app.use(`${API_PREFIX}/users`, userRoutes);

// Messages
app.use(`${API_PREFIX}/messages`, messageRoutes);

// Reviews
app.use(`${API_PREFIX}/reviews`, reviewRoutes);

// DEPRECATED: variants, colors, sizes routes removed in Phase 6

// Images
app.use(`${API_PREFIX}/images`, imageRoutes);

// Notifications
app.use(`${API_PREFIX}/notifications`, notificationRoutes);

// Dashboard
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Reports
app.use(`${API_PREFIX}/reports`, reportRoutes);

// Billing
app.use(`${API_PREFIX}/billing`, billingRoutes);

// Settings
app.use(`${API_PREFIX}/settings`, settingsRoutes);

// Test routes (for debugging)
app.use(`${API_PREFIX}/test`, testRoutes);

// Product Options
app.use(`${API_PREFIX}/product-options`, productOptionRoutes);

// Option Combinations - REMOVED (not needed, using simple options instead)
// app.use(`${API_PREFIX}/option-combinations`, productOptionCombinationRoutes);

// Data Migration (for Phase 2 migration utilities)
app.use(`${API_PREFIX}/migration`, dataMigrationRoutes);

// Bill Images
app.use(`${API_PREFIX}/bill-images`, billImageRoutes);

// Phase 2 - New routes
app.use(`${API_PREFIX}/customer-bills`, customerBillRoutes);
app.use(`${API_PREFIX}/customer-debts`, customerDebtRoutes);
app.use(`${API_PREFIX}/workers`, workerRoutes);
app.use(`${API_PREFIX}/traders`, traderRoutes);
app.use(`${API_PREFIX}/wholesalers`, wholesalerRoutes);

// ==================== Error Handling ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==================== Server Startup ====================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    logger.info('Database connected successfully');

    // Run database migrations (skip if SKIP_MIGRATIONS=true)
    if (process.env.SKIP_MIGRATIONS !== 'true') {
      const migrationResult = await runMigrations();
      if (!migrationResult.success) {
        logger.error('Database migrations failed:', migrationResult.error);
        process.exit(1);
      }
    } else {
      logger.info('Skipping database migrations (SKIP_MIGRATIONS=true)');
    }

    // Start server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API: http://${HOST}:${PORT}${API_PREFIX}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;