/**
 * Error Middleware
 * @module middleware/error
 * 
 * FIXED ISSUES:
 * 1. Standardized error response format matching frontend expectations
 * 2. Added errorCode alias for error_code (camelCase support)
 * 3. Better error messages for common scenarios
 */

const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  static conflict(message, details = null) {
    return new ApiError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS, details);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(message, HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Not found error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    `Route ${req.method} ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Handle Multer errors
 */
const handleMulterError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(
      'File size exceeds the allowed limit',
      HTTP_STATUS.BAD_REQUEST,
      'FILE_TOO_LARGE',
      { maxSize: error.limit }
    );
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ApiError(
      'Too many files uploaded',
      HTTP_STATUS.BAD_REQUEST,
      'TOO_MANY_FILES',
      { maxFiles: error.limit }
    );
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ApiError(
      'Unexpected file field',
      HTTP_STATUS.BAD_REQUEST,
      'UNEXPECTED_FILE',
      { field: error.field }
    );
  }

  return new ApiError(
    error.message || 'File upload error',
    HTTP_STATUS.BAD_REQUEST,
    'UPLOAD_ERROR'
  );
};

/**
 * Handle database errors
 */
const handleDatabaseError = (error) => {
  // Duplicate entry
  if (error.code === 'ER_DUP_ENTRY') {
    const match = error.message.match(/Duplicate entry '(.+)' for key '(.+)'/);
    return new ApiError(
      'A record with this value already exists',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      {
        value: match ? match[1] : null,
        field: match ? match[2] : null,
      }
    );
  }

  // Foreign key constraint
  if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_IS_REFERENCED_2') {
    return new ApiError(
      'Referenced resource not found or resource is in use',
      HTTP_STATUS.BAD_REQUEST,
      'FOREIGN_KEY_CONSTRAINT'
    );
  }

  // Data too long
  if (error.code === 'ER_DATA_TOO_LONG') {
    return new ApiError(
      'Data exceeds maximum allowed length',
      HTTP_STATUS.BAD_REQUEST,
      'DATA_TOO_LONG'
    );
  }

  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return new ApiError(
      'Database connection error',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      'DATABASE_ERROR'
    );
  }

  return null;
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
  if (error.name === 'TokenExpiredError') {
    return new ApiError(
      'Token has expired',
      HTTP_STATUS.UNAUTHORIZED,
      'TOKEN_EXPIRED'
    );
  }

  if (error.name === 'JsonWebTokenError') {
    return new ApiError(
      'Invalid token',
      HTTP_STATUS.UNAUTHORIZED,
      'INVALID_TOKEN'
    );
  }

  if (error.name === 'NotBeforeError') {
    return new ApiError(
      'Token not yet valid',
      HTTP_STATUS.UNAUTHORIZED,
      'TOKEN_NOT_ACTIVE'
    );
  }

  return null;
};

/**
 * Handle validation errors
 */
const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const details = {};
    
    if (error.details) {
      error.details.forEach(detail => {
        const field = detail.path.join('.');
        details[field] = detail.message;
      });
    }

    return new ApiError(
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      details
    );
  }

  return null;
};

/**
 * Handle syntax errors in JSON
 */
const handleSyntaxError = (error) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return new ApiError(
      'Invalid JSON in request body',
      HTTP_STATUS.BAD_REQUEST,
      'INVALID_JSON'
    );
  }

  return null;
};

/**
 * Log error to console/file
 */
const logError = (error, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    body: process.env.NODE_ENV !== 'production' ? req.body : '[HIDDEN]',
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    admin: req.admin ? { id: req.admin.adminId, email: req.admin.email } : null,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.errorCode || error.code,
    },
  };

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('\n=== Error ===');
    console.error(JSON.stringify(errorLog, null, 2));
    console.error('=============\n');
  } else {
    // In production, log to file or external service
    console.error(`[${errorLog.timestamp}] ${error.message}`);
  }

  return errorLog;
};

/**
 * Global error handler middleware
 * Returns standardized error format for frontend
 */
const errorHandler = (error, req, res, next) => {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Log the error
  logError(error, req);

  // Check for specific error types
  let apiError = null;

  // Multer errors
  if (error.name === 'MulterError') {
    apiError = handleMulterError(error);
  }

  // Database errors
  if (!apiError && error.code && error.code.startsWith && error.code.startsWith('ER_')) {
    apiError = handleDatabaseError(error);
  }

  // JWT errors
  if (!apiError) {
    apiError = handleJWTError(error);
  }

  // Validation errors
  if (!apiError) {
    apiError = handleValidationError(error);
  }

  // Syntax errors
  if (!apiError) {
    apiError = handleSyntaxError(error);
  }

  // If it's already an ApiError, use it directly
  if (error instanceof ApiError) {
    apiError = error;
  }

  // Default to internal server error
  if (!apiError) {
    apiError = new ApiError(
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  }

  // Build response - STANDARDIZED FORMAT FOR FRONTEND
  const response = {
    success: false,
    message: apiError.message,
    error_code: apiError.errorCode,    // snake_case
    errorCode: apiError.errorCode,      // camelCase alias for frontend
    status: apiError.statusCode,
  };

  // Add details if present
  if (apiError.details) {
    response.details = apiError.details;
    response.errors = apiError.details; // Alias for frontend validation display
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  // Add request ID if available
  if (req.requestId) {
    response.request_id = req.requestId;
    response.requestId = req.requestId; // camelCase alias
  }

  res.status(apiError.statusCode).json(response);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wrap controller methods with async error handling
 */
const wrapController = (controller) => {
  const wrappedController = {};

  Object.keys(controller).forEach(key => {
    if (typeof controller[key] === 'function') {
      wrappedController[key] = asyncHandler(controller[key]);
    } else {
      wrappedController[key] = controller[key];
    }
  });

  return wrappedController;
};

/**
 * Request timeout handler
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const error = new ApiError(
        'Request timeout',
        HTTP_STATUS.REQUEST_TIMEOUT || 408,
        'REQUEST_TIMEOUT'
      );
      next(error);
    });
    next();
  };
};

/**
 * Unhandled rejection handler
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
};

/**
 * Uncaught exception handler
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
};

/**
 * Initialize global error handlers
 */
const initializeErrorHandlers = () => {
  handleUnhandledRejection();
  handleUncaughtException();
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  wrapController,
  timeoutHandler,
  initializeErrorHandlers,
  handleMulterError,
  handleDatabaseError,
  handleJWTError,
  handleValidationError,
};