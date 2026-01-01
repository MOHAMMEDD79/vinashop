/**
 * Response Handler Utility
 * @module utils/responseHandler
 */

class ResponseHandler {
  /**
   * HTTP Status Codes
   */
  static STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
  };

  /**
   * Standard success response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Success with pagination
   */
  static successPaginated(res, data, pagination, message = 'Success') {
    const response = {
      success: true,
      message,
      data,
      pagination,
    };

    return res.status(200).json(response);
  }

  /**
   * Created response (201)
   */
  static created(res, data = null, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Standard error response
   */
  static error(res, message = 'An error occurred', statusCode = 500, errors = null, code = null) {
    const response = {
      success: false,
      message,
      ...(errors && { errors }),
      ...(code && { code }),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Bad request error (400)
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, 400, errors, 'BAD_REQUEST');
  }

  /**
   * Unauthorized error (401)
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401, null, 'UNAUTHORIZED');
  }

  /**
   * Forbidden error (403)
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403, null, 'FORBIDDEN');
  }

  /**
   * Not found error (404)
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404, null, 'NOT_FOUND');
  }

  /**
   * Method not allowed (405)
   */
  static methodNotAllowed(res, message = 'Method not allowed') {
    return this.error(res, message, 405, null, 'METHOD_NOT_ALLOWED');
  }

  /**
   * Conflict error (409)
   */
  static conflict(res, message = 'Resource conflict') {
    return this.error(res, message, 409, null, 'CONFLICT');
  }

  /**
   * Validation error (422)
   */
  static validationError(res, errors, message = 'Validation failed') {
    return this.error(res, message, 422, errors, 'VALIDATION_ERROR');
  }

  /**
   * Too many requests (429)
   */
  static tooManyRequests(res, message = 'Too many requests', retryAfter = null) {
    if (retryAfter) {
      res.set('Retry-After', retryAfter);
    }
    return this.error(res, message, 429, null, 'TOO_MANY_REQUESTS');
  }

  /**
   * Internal server error (500)
   */
  static serverError(res, message = 'Internal server error', error = null) {
    const errors = process.env.NODE_ENV === 'development' && error ? {
      stack: error.stack,
      details: error.message,
    } : null;

    return this.error(res, message, 500, errors, 'SERVER_ERROR');
  }

  /**
   * Service unavailable (503)
   */
  static serviceUnavailable(res, message = 'Service unavailable') {
    return this.error(res, message, 503, null, 'SERVICE_UNAVAILABLE');
  }

  // ==================== Specialized Responses ====================

  /**
   * Login success response
   */
  static loginSuccess(res, user, token, refreshToken = null) {
    const data = {
      user,
      token,
      ...(refreshToken && { refreshToken }),
    };

    return this.success(res, data, 'Login successful');
  }

  /**
   * Logout success response
   */
  static logoutSuccess(res) {
    return this.success(res, null, 'Logout successful');
  }

  /**
   * Token refresh response
   */
  static tokenRefreshed(res, token, refreshToken = null) {
    const data = {
      token,
      ...(refreshToken && { refreshToken }),
    };

    return this.success(res, data, 'Token refreshed');
  }

  /**
   * File upload success
   */
  static uploadSuccess(res, file, message = 'File uploaded successfully') {
    return this.success(res, { file }, message);
  }

  /**
   * Multiple files upload success
   */
  static uploadsSuccess(res, files, message = 'Files uploaded successfully') {
    return this.success(res, { files }, message);
  }

  /**
   * Delete success
   */
  static deleteSuccess(res, message = 'Deleted successfully') {
    return this.success(res, null, message);
  }

  /**
   * Bulk operation result
   */
  static bulkResult(res, results, message = 'Bulk operation completed') {
    const data = {
      total: results.total || results.length,
      successful: results.successful || results.filter(r => r.success).length,
      failed: results.failed || results.filter(r => !r.success).length,
      results: results.details || results,
    };

    return this.success(res, data, message);
  }

  /**
   * Export success
   */
  static exportSuccess(res, data, filename, format = 'json') {
    const contentTypes = {
      json: 'application/json',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf',
    };

    res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (format === 'json') {
      return res.json(data);
    }

    return res.send(data);
  }

  /**
   * Download file
   */
  static download(res, filePath, filename) {
    res.download(filePath, filename, (err) => {
      if (err) {
        this.serverError(res, 'Download failed', err);
      }
    });
  }

  /**
   * Stream response
   */
  static stream(res, stream, contentType = 'application/octet-stream') {
    res.setHeader('Content-Type', contentType);
    stream.pipe(res);
  }

  /**
   * Redirect response
   */
  static redirect(res, url, statusCode = 302) {
    return res.redirect(statusCode, url);
  }

  /**
   * Send HTML
   */
  static html(res, html, statusCode = 200) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(statusCode).send(html);
  }

  /**
   * Send XML
   */
  static xml(res, xml, statusCode = 200) {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(statusCode).send(xml);
  }

  // ==================== Response Helpers ====================

  /**
   * Set cache headers
   */
  static cache(res, maxAge = 3600, isPrivate = false) {
    const cacheControl = isPrivate
      ? `private, max-age=${maxAge}`
      : `public, max-age=${maxAge}`;

    res.setHeader('Cache-Control', cacheControl);
    return res;
  }

  /**
   * Set no-cache headers
   */
  static noCache(res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res;
  }

  /**
   * Set CORS headers
   */
  static cors(res, origin = '*') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
  }

  /**
   * Set custom header
   */
  static setHeader(res, name, value) {
    res.setHeader(name, value);
    return res;
  }

  /**
   * Set multiple headers
   */
  static setHeaders(res, headers) {
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
    return res;
  }

  // ==================== Express Middleware ====================

  /**
   * Attach response helpers to res object
   */
  static middleware() {
    return (req, res, next) => {
      // Success methods
      res.success = (data, message) => ResponseHandler.success(res, data, message);
      res.created = (data, message) => ResponseHandler.created(res, data, message);
      res.noContent = () => ResponseHandler.noContent(res);
      res.paginated = (data, pagination, message) => ResponseHandler.successPaginated(res, data, pagination, message);

      // Error methods
      res.badRequest = (message, errors) => ResponseHandler.badRequest(res, message, errors);
      res.unauthorized = (message) => ResponseHandler.unauthorized(res, message);
      res.forbidden = (message) => ResponseHandler.forbidden(res, message);
      res.notFound = (message) => ResponseHandler.notFound(res, message);
      res.conflict = (message) => ResponseHandler.conflict(res, message);
      res.validationError = (errors, message) => ResponseHandler.validationError(res, errors, message);
      res.serverError = (message, error) => ResponseHandler.serverError(res, message, error);

      next();
    };
  }

  /**
   * 404 handler middleware
   */
  static notFoundHandler() {
    return (req, res) => {
      this.notFound(res, `Route ${req.method} ${req.path} not found`);
    };
  }

  /**
   * Error handler middleware
   */
  static errorHandler(options = {}) {
    const { logger, includeStack = false } = options;

    return (err, req, res, next) => {
      // Log error
      if (logger) {
        logger.error(err.message, {
          stack: err.stack,
          method: req.method,
          path: req.path,
          body: req.body,
          params: req.params,
          query: req.query,
        });
      }

      // Determine status code
      const statusCode = err.statusCode || err.status || 500;

      // Build error response
      const response = {
        success: false,
        message: err.message || 'Internal server error',
        ...(err.code && { code: err.code }),
        ...(err.errors && { errors: err.errors }),
        ...(includeStack && process.env.NODE_ENV === 'development' && { stack: err.stack }),
      };

      return res.status(statusCode).json(response);
    };
  }
}

// ==================== Custom Error Classes ====================

class AppError extends Error {
  constructor(message, statusCode = 500, code = null, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors = null) {
    super(message, 400, 'BAD_REQUEST', errors);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class ValidationError extends AppError {
  constructor(errors, message = 'Validation failed') {
    super(message, 422, 'VALIDATION_ERROR', errors);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

// ==================== Standalone Functions ====================

/**
 * Success response function (standalone)
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return ResponseHandler.success(res, data, message, statusCode);
};

/**
 * Error response function (standalone)
 */
const errorResponse = (res, message = 'An error occurred', statusCode = 500, errorCode = null, errors = null) => {
  return ResponseHandler.error(res, message, statusCode, errors, errorCode);
};

/**
 * Paginated response function (standalone)
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return ResponseHandler.successPaginated(res, data, pagination, message);
};

// Export
module.exports = ResponseHandler;
module.exports.ResponseHandler = ResponseHandler;
module.exports.successResponse = successResponse;
module.exports.errorResponse = errorResponse;
module.exports.paginatedResponse = paginatedResponse;
module.exports.AppError = AppError;
module.exports.BadRequestError = BadRequestError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.NotFoundError = NotFoundError;
module.exports.ConflictError = ConflictError;
module.exports.ValidationError = ValidationError;
module.exports.TooManyRequestsError = TooManyRequestsError;