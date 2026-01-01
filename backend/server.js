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
// const rateLimiter = require('./middleware/rateLimiter.middleware'); // optional

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
const imageRoutes = require('./routes/image.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const billingRoutes = require('./routes/billing.routes');
const settingsRoutes = require('./routes/settings.routes');
const testRoutes = require('./routes/test.routes');
const productOptionRoutes = require('./routes/productOption.routes');
const dataMigrationRoutes = require('./routes/dataMigration.routes');
const billImageRoutes = require('./routes/billImage.routes');

// Phase 2 - New modules
const customerBillRoutes = require('./routes/customerBill.routes');
const customerDebtRoutes = require('./routes/customerDebt.routes');
const workerRoutes = require('./routes/worker.routes');
const traderRoutes = require('./routes/trader.routes');
const wholesalerRoutes = require('./routes/wholesaler.routes');

// Public routes
const publicRoutes = require('./routes/public.routes');

// ==================== Initialize Express App ====================

const app = express();

// Initialize Logger
const logger = Logger.configure({
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.NODE_ENV === 'production',
  logDir: path.join(__dirname, 'logs'),
});

// ==================== Core Middleware ====================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors(corsConfig));
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: Logger.stream }));
}

app.set('trust proxy', 1);

// ==================== Static Files ====================

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
}));

app.use('/static', express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
}));

// ==================== Health Check ====================

app.get('/health', async (req, res) => {
  // Test database connection
  let dbStatus = 'unknown';
  try {
    const { testConnection } = require('./config/database');
    const connected = await testConnection();
    dbStatus = connected ? 'connected' : 'disconnected';
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    dbHost: process.env.DB_HOST || 'not set',
    dbName: process.env.DB_NAME || 'not set',
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VinaShop API Server',
    version: process.env.API_VERSION || '1.0.0',
    health: '/health',
    api: '/api',
  });
});

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

// Public routes
app.use('/api/public', publicRoutes);

// Admin Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/admins`, adminRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/subcategories`, subcategoryRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/images`, imageRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/test`, testRoutes);
app.use(`${API_PREFIX}/product-options`, productOptionRoutes);
app.use(`${API_PREFIX}/migration`, dataMigrationRoutes);
app.use(`${API_PREFIX}/bill-images`, billImageRoutes);

// Phase 2 routes
app.use(`${API_PREFIX}/customer-bills`, customerBillRoutes);
app.use(`${API_PREFIX}/customer-debts`, customerDebtRoutes);
app.use(`${API_PREFIX}/workers`, workerRoutes);
app.use(`${API_PREFIX}/traders`, traderRoutes);
app.use(`${API_PREFIX}/wholesalers`, wholesalerRoutes);

// ==================== Error Handling ====================

app.use(notFoundHandler);
app.use(errorHandler);

// ==================== Server Startup ====================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    // Test DB connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      return; // Removed process.exit()
    }

    logger.info('Database connected successfully');

    // Run migrations if not skipped
    if (process.env.SKIP_MIGRATIONS !== 'true') {
      const migrationResult = await runMigrations();
      if (!migrationResult.success) {
        logger.error('Database migrations failed:', migrationResult.error);
        return; // Removed process.exit()
      }
    } else {
      logger.info('Skipping database migrations (SKIP_MIGRATIONS=true)');
    }

    // Only listen if not production (Passenger handles production)
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, HOST, () => {
        logger.info(`Server running on http://${HOST}:${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`API: http://${HOST}:${PORT}${API_PREFIX}`);
      });
    }

  } catch (error) {
    logger.error('Failed to start server:', { error: error.message, stack: error.stack });
    // Removed process.exit() to keep Passenger alive
  }
};

startServer();

module.exports = app;