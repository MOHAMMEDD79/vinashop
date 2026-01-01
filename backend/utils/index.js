/**
 * Utils Index
 * @module utils
 */

const ResponseHandler = require('./responseHandler');
const DateFormatter = require('./dateFormatter');
const FileHandler = require('./fileHandler');
const Helpers = require('./helpers');
const Logger = require('./logger');
const Pagination = require('./pagination');
const Validators = require('./validators');

module.exports = {
  // Response Handler
  ResponseHandler,
  successResponse: ResponseHandler.successResponse,
  errorResponse: ResponseHandler.errorResponse,
  paginatedResponse: ResponseHandler.paginatedResponse,
  AppError: ResponseHandler.AppError,
  BadRequestError: ResponseHandler.BadRequestError,
  UnauthorizedError: ResponseHandler.UnauthorizedError,
  ForbiddenError: ResponseHandler.ForbiddenError,
  NotFoundError: ResponseHandler.NotFoundError,
  ConflictError: ResponseHandler.ConflictError,
  ValidationError: ResponseHandler.ValidationError,
  TooManyRequestsError: ResponseHandler.TooManyRequestsError,

  // Date Formatter
  DateFormatter,

  // File Handler
  FileHandler,

  // Helpers
  Helpers,

  // Logger
  Logger,

  // Pagination
  Pagination,

  // Validators
  Validators,
};