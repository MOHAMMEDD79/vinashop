/**
 * Color Controller
 * @module controllers/color
 */

const colorService = require('../services/color.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Get all colors
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      is_active,
      sort = 'display_order',
      order = 'ASC',
      lang = 'en',
    } = req.query;

    const result = await colorService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      sort,
      order,
      lang,
    });

    return successResponse(res, result, 'Colors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all colors (no pagination - for dropdowns)
 */
const getAllList = async (req, res, next) => {
  try {
    const { is_active = true, lang = 'en' } = req.query;

    const colors = await colorService.getAllList({
      is_active: is_active === 'true' || is_active === true,
      lang,
    });

    return successResponse(res, colors, 'Colors list retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get color by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const color = await colorService.getById(id, lang);

    if (!color) {
      return errorResponse(
        res,
        'Color not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, color);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new color
 */
const create = async (req, res, next) => {
  try {
    const {
      color_name_en,
      color_name_ar,
      color_name_he,
      color_code,
      display_order = 0,
      is_active = true,
    } = req.body;

    // Validate required fields
    if (!color_name_en || !color_name_ar || !color_name_he) {
      return errorResponse(
        res,
        'Color name is required in all languages (EN, AR, HE)',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    if (!color_code) {
      return errorResponse(
        res,
        'Color code (hex) is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Validate hex color code format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(color_code)) {
      return errorResponse(
        res,
        'Invalid color code format. Must be a valid hex color (e.g., #FF0000)',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check if color name already exists
    const existingColor = await colorService.findByName(color_name_en, 'en');
    if (existingColor) {
      return errorResponse(
        res,
        'Color with this name already exists',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
      );
    }

    // Check if color code already exists
    const existingCode = await colorService.findByCode(color_code);
    if (existingCode) {
      return errorResponse(
        res,
        'Color with this hex code already exists',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
      );
    }

    const color = await colorService.create({
      color_name_en,
      color_name_ar,
      color_name_he,
      color_code: color_code.toUpperCase(),
      display_order: parseInt(display_order),
      is_active: is_active === 'true' || is_active === true,
    });

    return successResponse(res, color, 'Color created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update color
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      color_name_en,
      color_name_ar,
      color_name_he,
      color_code,
      display_order,
      is_active,
    } = req.body;

    // Check if color exists
    const existingColor = await colorService.getById(id);
    if (!existingColor) {
      return errorResponse(
        res,
        'Color not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Validate hex color code format if provided
    if (color_code) {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexRegex.test(color_code)) {
        return errorResponse(
          res,
          'Invalid color code format. Must be a valid hex color (e.g., #FF0000)',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // Check if new name already exists (if changing name)
    if (color_name_en && color_name_en !== existingColor.color_name_en) {
      const nameExists = await colorService.findByName(color_name_en, 'en');
      if (nameExists && nameExists.color_id !== parseInt(id)) {
        return errorResponse(
          res,
          'Color with this name already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    // Check if new code already exists (if changing code)
    if (color_code && color_code.toUpperCase() !== existingColor.color_code) {
      const codeExists = await colorService.findByCode(color_code);
      if (codeExists && codeExists.color_id !== parseInt(id)) {
        return errorResponse(
          res,
          'Color with this hex code already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    const updateData = {};
    if (color_name_en !== undefined) updateData.color_name_en = color_name_en;
    if (color_name_ar !== undefined) updateData.color_name_ar = color_name_ar;
    if (color_name_he !== undefined) updateData.color_name_he = color_name_he;
    if (color_code !== undefined) updateData.color_code = color_code.toUpperCase();
    if (display_order !== undefined) updateData.display_order = parseInt(display_order);
    if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;

    const color = await colorService.update(id, updateData);

    return successResponse(res, color, 'Color updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete color
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if color exists
    const existingColor = await colorService.getById(id);
    if (!existingColor) {
      return errorResponse(
        res,
        'Color not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if color is used by any products
    const productCount = await colorService.getProductCount(id);
    if (productCount > 0) {
      return errorResponse(
        res,
        `Cannot delete color used by ${productCount} products. Please remove color from products first.`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await colorService.remove(id);

    return successResponse(res, null, 'Color deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle color active status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if color exists
    const existingColor = await colorService.getById(id);
    if (!existingColor) {
      return errorResponse(
        res,
        'Color not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const color = await colorService.toggleStatus(id);
    const status = color.is_active ? 'activated' : 'deactivated';

    return successResponse(res, color, `Color ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update colors display order
 */
const updateDisplayOrder = async (req, res, next) => {
  try {
    const { colors } = req.body;

    if (!colors || !Array.isArray(colors)) {
      return errorResponse(
        res,
        'Colors array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    await colorService.updateDisplayOrder(colors);

    return successResponse(res, null, 'Display order updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get color statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await colorService.getStatistics();
    return successResponse(res, stats, 'Color statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by color
 */
const getProductsByColor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, lang = 'en' } = req.query;

    // Check if color exists
    const existingColor = await colorService.getById(id, lang);
    if (!existingColor) {
      return errorResponse(
        res,
        'Color not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const result = await colorService.getProductsByColor(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, {
      color: existingColor,
      products: result,
    }, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update colors
 */
const bulkUpdate = async (req, res, next) => {
  try {
    const { color_ids, updates } = req.body;

    if (!color_ids || !Array.isArray(color_ids) || color_ids.length === 0) {
      return errorResponse(
        res,
        'Color IDs array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return errorResponse(
        res,
        'Updates object is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await colorService.bulkUpdate(color_ids, updates);

    return successResponse(res, result, `${result.updated} colors updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete colors
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { color_ids } = req.body;

    if (!color_ids || !Array.isArray(color_ids) || color_ids.length === 0) {
      return errorResponse(
        res,
        'Color IDs array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if any color is used by products
    for (const id of color_ids) {
      const productCount = await colorService.getProductCount(id);
      if (productCount > 0) {
        return errorResponse(
          res,
          `Color ${id} is used by ${productCount} products. Cannot delete.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    const result = await colorService.bulkDelete(color_ids);

    return successResponse(res, result, `${result.deleted} colors deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Export colors to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { is_active } = req.query;

    const excelBuffer = await colorService.exportToExcel({
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=colors.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Import colors from Excel
 */
const importFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(
        res,
        'Excel file is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await colorService.importFromExcel(req.file.path);

    return successResponse(res, result, `Import completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular colors
 */
const getPopularColors = async (req, res, next) => {
  try {
    const { limit = 10, lang = 'en' } = req.query;

    const colors = await colorService.getPopularColors({
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, colors, 'Popular colors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search colors
 */
const search = async (req, res, next) => {
  try {
    const { q, lang = 'en', limit = 10 } = req.query;

    if (!q) {
      return errorResponse(
        res,
        'Search query is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const colors = await colorService.search({
      query: q,
      lang,
      limit: parseInt(limit),
    });

    return successResponse(res, colors, 'Colors search results');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getAllList,
  getById,
  create,
  update,
  remove,
  toggleStatus,
  updateDisplayOrder,
  getStatistics,
  getProductsByColor,
  bulkUpdate,
  bulkDelete,
  exportToExcel,
  importFromExcel,
  getPopularColors,
  search,
};