/**
 * CORS Configuration
 * @module config/cors
 */

const allowedOrigins = [
  // Production domains
  'https://vinashop.ps',
  'https://admin.vinashop.ps',
  'https://api.vinashop.ps',
  'https://www.vinashop.ps',
  // Environment variables (for flexibility)
  process.env.FRONTEND_URL,
  process.env.ADMIN_PANEL_URL,
  // Development (only used when NODE_ENV !== production)
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ] : []),
].filter(Boolean);

const corsOptions = {
  /**
   * Origin validation
   */
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // Allow all origins in development
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  /**
   * Allowed HTTP methods
   */
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  /**
   * Allowed headers - FIXED: Added x-timezone and other common headers
   */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'Origin',
    'X-Access-Token',
    'X-Refresh-Token',
    'X-Admin-Id',
    'X-Request-Id',
    'Cache-Control',
    'Pragma',
    // NEW: Added timezone and language headers
    'X-Timezone',
    'x-timezone',
    'X-Language',
    'x-language',
    'X-Locale',
    'x-locale',
    'X-Device-Id',
    'x-device-id',
    'X-App-Version',
    'x-app-version',
    'X-Platform',
    'x-platform',
    'X-Client-Version',
    'x-client-version',
  ],

  /**
   * Headers exposed to the client
   */
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'X-Total-Count',
    'X-Total-Pages',
    'X-Current-Page',
    'X-Per-Page',
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  /**
   * Allow credentials (cookies, authorization headers)
   */
  credentials: true,

  /**
   * Preflight request cache duration (in seconds)
   */
  maxAge: 86400, // 24 hours

  /**
   * Pass preflight response to next handler
   */
  preflightContinue: false,

  /**
   * Success status for preflight requests
   */
  optionsSuccessStatus: 204,
};

/**
 * CORS error handler middleware
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Origin not allowed',
      error: {
        code: 'CORS_ERROR',
        origin: req.headers.origin,
      },
    });
  }
  next(err);
};

/**
 * Dynamic CORS for specific routes
 */
const dynamicCorsOptions = (allowedDomains = []) => {
  return {
    ...corsOptions,
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const allAllowed = [...allowedOrigins, ...allowedDomains];
      
      if (allAllowed.includes(origin)) {
        callback(null, true);
      } else if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  };
};

/**
 * Strict CORS for sensitive routes (no credentials from unknown origins)
 */
const strictCorsOptions = {
  ...corsOptions,
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, false);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

/**
 * Public CORS for open API endpoints
 */
const publicCorsOptions = {
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Accept-Language'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: false,
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

module.exports = corsOptions;

module.exports.corsOptions = corsOptions;
module.exports.corsErrorHandler = corsErrorHandler;
module.exports.dynamicCorsOptions = dynamicCorsOptions;
module.exports.strictCorsOptions = strictCorsOptions;
module.exports.publicCorsOptions = publicCorsOptions;
module.exports.allowedOrigins = allowedOrigins;