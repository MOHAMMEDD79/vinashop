/**
 * Size Controller
 * @module controllers/size
 */

const sizeService = require('../services/size.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Get all sizes
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      is_active,
      category,
      sort = 'display_order',
      order = 'ASC',
      lang = 'en',
    } = req.query;

    const result = await sizeService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      category,
      sort,
      order,
      lang,
    });

    return successResponse(res, result, 'Sizes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sizes (no pagination - for dropdowns)
 */
const getAllList = async (req, res, next) => {
  try {
    const { is_active = true, category, lang = 'en' } = req.query;

    const sizes = await sizeService.getAllList({
      is_active: is_active === 'true' || is_active === true,
      category,
      lang,
    });

    return successResponse(res, sizes, 'Sizes list retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get size by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const size = await sizeService.getById(id, lang);

    if (!size) {
      return errorResponse(
        res,
        'Size not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, size);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new size
 */
const create = async (req, res, next) => {
  try {
    const {
      size_name_en,
      size_name_ar,
      size_name_he,
      size_code,
      category,
      display_order,
      is_active,
    } = req.body;

    // Validate required fields
    if (!size_name_en || !size_name_ar || !size_name_he) {
      return errorResponse(
        res,
        'Size name is required in all languages (EN, AR, HE)',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if size code already exists
    if (size_code) {
      const existingCode = await sizeService.findByCode(size_code);
      if (existingCode) {
        return errorResponse(
          res,
          'Size with this code already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    // Check if size name already exists
    const existingName = await sizeService.findByName(size_name_en, 'en');
    if (existingName) {
      return errorResponse(
        res,
        'Size with this name already exists',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
      );
    }

    const size = await sizeService.create({
      size_name_en,
      size_name_ar,
      size_name_he,
      size_code,
      category,
      display_order: display_order ? parseInt(display_order) : 0,
      is_active: is_active !== 'false' && is_active !== false,
      created_by: req.admin.adminId,
    });

    return successResponse(res, size, 'Size created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update size
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      size_name_en,
      size_name_ar,
      size_name_he,
      size_code,
      category,
      display_order,
      is_active,
    } = req.body;

    // Check if size exists
    const existingSize = await sizeService.getById(id);
    if (!existingSize) {
      return errorResponse(
        res,
        'Size not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if new code already exists (if changing code)
    if (size_code && size_code !== existingSize.size_code) {
      const existingCode = await sizeService.findByCode(size_code);
      if (existingCode && existingCode.size_id !== parseInt(id)) {
        return errorResponse(
          res,
          'Size with this code already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    // Check if new name already exists (if changing name)
    if (size_name_en && size_name_en !== existingSize.size_name_en) {
      const existingName = await sizeService.findByName(size_name_en, 'en');
      if (existingName && existingName.size_id !== parseInt(id)) {
        return errorResponse(
          res,
          'Size with this name already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    const updateData = {};
    if (size_name_en !== undefined) updateData.size_name_en = size_name_en;
    if (size_name_ar !== undefined) updateData.size_name_ar = size_name_ar;
    if (size_name_he !== undefined) updateData.size_name_he = size_name_he;
    if (size_code !== undefined) updateData.size_code = size_code;
    if (category !== undefined) updateData.category = category;
    if (display_order !== undefined) updateData.display_order = parseInt(display_order);
    if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;

    const size = await sizeService.update(id, updateData);

    return successResponse(res, size, 'Size updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete size
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if size exists
    const existingSize = await sizeService.getById(id);
    if (!existingSize) {
      return errorResponse(
        res,
        'Size not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if size is used by any products
    const productCount = await sizeService.getProductCount(id);
    if (productCount > 0) {
      return errorResponse(
        res,
        `Cannot delete size. It is used by ${productCount} product(s)`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await sizeService.remove(id);

    return successResponse(res, null, 'Size deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle size active status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if size exists
    const existingSize = await sizeService.getById(id);
    if (!existingSize) {
      return errorResponse(
        res,
        'Size not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const size = await sizeService.toggleStatus(id);
    const status = size.is_active ? 'activated' : 'deactivated';

    return successResponse(res, size, `Size ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update display order
 */
const updateDisplayOrder = async (req, res, next) => {
  try {
    const { sizes } = req.body;

    if (!sizes || !Array.isArray(sizes)) {
      return errorResponse(
        res,
        'Sizes array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    await sizeService.updateDisplayOrder(sizes);

    return successResponse(res, null, 'Display order updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get size statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await sizeService.getStatistics();
    return successResponse(res, stats, 'Size statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by size
 */
const getProductsBySize = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, lang = 'en' } = req.query;

    // Check if size exists
    const existingSize = await sizeService.getById(id);
    if (!existingSize) {
      return errorResponse(
        res,
        'Size not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const result = await sizeService.getProductsBySize(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, result, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update sizes
 */
const bulkUpdate = async (req, res, next) => {
  try {
    const { size_ids, updates } = req.body;

    if (!size_ids || !Array.isArray(size_ids) || size_ids.length === 0) {
      return errorResponse(
        res,
        'Size IDs array is required',
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

    const result = await sizeService.bulkUpdate(size_ids, updates);

    return successResponse(res, result, `${result.updated} sizes updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete sizes
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { size_ids } = req.body;

    if (!size_ids || !Array.isArray(size_ids) || size_ids.length === 0) {
      return errorResponse(
        res,
        'Size IDs array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if any size is used by products
    for (const id of size_ids) {
      const productCount = await sizeService.getProductCount(id);
      if (productCount > 0) {
        return errorResponse(
          res,
          `Size ${id} is used by ${productCount} product(s). Cannot delete.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    const result = await sizeService.bulkDelete(size_ids);

    return successResponse(res, result, `${result.deleted} sizes deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Export sizes to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { is_active, category } = req.query;

    const excelBuffer = await sizeService.exportToExcel({
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      category,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sizes.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Import sizes from Excel
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

    const result = await sizeService.importFromExcel(req.file.path, req.admin.adminId);

    return successResponse(res, result, `Import completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get sizes by category
 */
const getByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { is_active = true, lang = 'en' } = req.query;

    const sizes = await sizeService.getByCategory(category, {
      is_active: is_active === 'true' || is_active === true,
      lang,
    });

    return successResponse(res, sizes, 'Sizes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get size categories
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await sizeService.getCategories();
    return successResponse(res, categories, 'Size categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search sizes
 */
const search = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10, lang = 'en' } = req.query;

    if (!q) {
      return errorResponse(
        res,
        'Search query is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await sizeService.search({
      query: q,
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, result, 'Search results retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular sizes
 */
const getPopularSizes = async (req, res, next) => {
  try {
    const { limit = 10, period = 'month', lang = 'en' } = req.query;

    const sizes = await sizeService.getPopularSizes({
      limit: parseInt(limit),
      period,
      lang,
    });

    return successResponse(res, sizes, 'Popular sizes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate size
 */
const duplicate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if size exists
    const existingSize = await sizeService.getById(id);
    if (!existingSize) {
      return errorResponse(
        res,
        'Size not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const newSize = await sizeService.duplicate(id, req.admin.adminId);

    return successResponse(res, newSize, 'Size duplicated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get size usage report
 */
const getUsageReport = async (req, res, next) => {
  try {
    const { period = 'month', lang = 'en' } = req.query;

    const report = await sizeService.getUsageReport({
      period,
      lang,
    });

    return successResponse(res, report, 'Size usage report retrieved successfully');
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
  getProductsBySize,
  bulkUpdate,
  bulkDelete,
  exportToExcel,
  importFromExcel,
  getByCategory,
  getCategories,
  search,
  getPopularSizes,
  duplicate,
  getUsageReport,
};