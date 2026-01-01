/**
 * Variant Controller
 * @module controllers/variant
 */

const variantService = require('../services/variant.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Get all variants
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      product_id,
      color_id,
      size_id,
      is_active,
      in_stock,
      sort = 'created_at',
      order = 'DESC',
      lang = 'en',
    } = req.query;

    const result = await variantService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      product_id: product_id ? parseInt(product_id) : undefined,
      color_id: color_id ? parseInt(color_id) : undefined,
      size_id: size_id ? parseInt(size_id) : undefined,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      in_stock: in_stock !== undefined ? in_stock === 'true' : undefined,
      sort,
      order,
      lang,
    });

    return successResponse(res, result, 'Variants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get variant by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const variant = await variantService.getById(id, lang);

    if (!variant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, variant);
  } catch (error) {
    next(error);
  }
};

/**
 * Get variants by product
 */
const getByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { is_active, lang = 'en' } = req.query;

    const variants = await variantService.getByProduct(productId, {
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      lang,
    });

    return successResponse(res, variants, 'Product variants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get variant by SKU
 */
const getBySku = async (req, res, next) => {
  try {
    const { sku } = req.params;
    const { lang = 'en' } = req.query;

    const variant = await variantService.getBySku(sku, lang);

    if (!variant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, variant);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new variant
 */
const create = async (req, res, next) => {
  try {
    const {
      product_id,
      color_id,
      size_id,
      sku,
      price,
      compare_price,
      cost_price,
      stock_quantity,
      low_stock_threshold,
      weight,
      is_active,
      is_default,
    } = req.body;

    // Validate required fields
    if (!product_id) {
      return errorResponse(
        res,
        'Product ID is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if product exists
    const productExists = await variantService.checkProductExists(product_id);
    if (!productExists) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if SKU already exists
    if (sku) {
      const existingSku = await variantService.findBySku(sku);
      if (existingSku) {
        return errorResponse(
          res,
          'Variant with this SKU already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    // Check if variant combination already exists
    if (color_id || size_id) {
      const existingCombination = await variantService.findByCombination(product_id, color_id, size_id);
      if (existingCombination) {
        return errorResponse(
          res,
          'Variant with this color/size combination already exists for this product',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    // Handle image upload
    let imagePath = null;
    if (req.file) {
      imagePath = `uploads/variants/${req.file.filename}`;
    }

    const variant = await variantService.create({
      product_id: parseInt(product_id),
      color_id: color_id ? parseInt(color_id) : null,
      size_id: size_id ? parseInt(size_id) : null,
      sku,
      price: price ? parseFloat(price) : null,
      compare_price: compare_price ? parseFloat(compare_price) : null,
      cost_price: cost_price ? parseFloat(cost_price) : null,
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
      low_stock_threshold: low_stock_threshold ? parseInt(low_stock_threshold) : 5,
      weight: weight ? parseFloat(weight) : null,
      image_url: imagePath,
      is_active: is_active !== 'false' && is_active !== false,
      is_default: is_default === 'true' || is_default === true,
      created_by: req.admin.adminId,
    });

    return successResponse(res, variant, 'Variant created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update variant
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      color_id,
      size_id,
      sku,
      price,
      compare_price,
      cost_price,
      stock_quantity,
      low_stock_threshold,
      weight,
      is_active,
      is_default,
    } = req.body;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if new SKU already exists (if changing SKU)
    if (sku && sku !== existingVariant.sku) {
      const existingSku = await variantService.findBySku(sku);
      if (existingSku && existingSku.variant_id !== parseInt(id)) {
        return errorResponse(
          res,
          'Variant with this SKU already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    // Check if new combination already exists (if changing color/size)
    const newColorId = color_id !== undefined ? (color_id ? parseInt(color_id) : null) : existingVariant.color_id;
    const newSizeId = size_id !== undefined ? (size_id ? parseInt(size_id) : null) : existingVariant.size_id;
    
    if (newColorId !== existingVariant.color_id || newSizeId !== existingVariant.size_id) {
      const existingCombination = await variantService.findByCombination(
        existingVariant.product_id,
        newColorId,
        newSizeId
      );
      if (existingCombination && existingCombination.variant_id !== parseInt(id)) {
        return errorResponse(
          res,
          'Variant with this color/size combination already exists for this product',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    // Handle image upload
    let imagePath = existingVariant.image_url;
    if (req.file) {
      // Delete old image if exists
      if (existingVariant.image_url) {
        await variantService.deleteImage(existingVariant.image_url);
      }
      imagePath = `uploads/variants/${req.file.filename}`;
    }

    const updateData = {};
    if (color_id !== undefined) updateData.color_id = color_id ? parseInt(color_id) : null;
    if (size_id !== undefined) updateData.size_id = size_id ? parseInt(size_id) : null;
    if (sku !== undefined) updateData.sku = sku;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (compare_price !== undefined) updateData.compare_price = compare_price ? parseFloat(compare_price) : null;
    if (cost_price !== undefined) updateData.cost_price = cost_price ? parseFloat(cost_price) : null;
    if (stock_quantity !== undefined) updateData.stock_quantity = parseInt(stock_quantity);
    if (low_stock_threshold !== undefined) updateData.low_stock_threshold = parseInt(low_stock_threshold);
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (imagePath !== existingVariant.image_url) updateData.image_url = imagePath;
    if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;
    if (is_default !== undefined) updateData.is_default = is_default === 'true' || is_default === true;

    const variant = await variantService.update(id, updateData);

    return successResponse(res, variant, 'Variant updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete variant
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if variant is in any orders
    const orderCount = await variantService.getOrderCount(id);
    if (orderCount > 0) {
      return errorResponse(
        res,
        `Cannot delete variant. It is in ${orderCount} order(s)`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Delete image if exists
    if (existingVariant.image_url) {
      await variantService.deleteImage(existingVariant.image_url);
    }

    await variantService.remove(id);

    return successResponse(res, null, 'Variant deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle variant active status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const variant = await variantService.toggleStatus(id);
    const status = variant.is_active ? 'activated' : 'deactivated';

    return successResponse(res, variant, `Variant ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Set variant as default
 */
const setDefault = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const variant = await variantService.setDefault(id, existingVariant.product_id);

    return successResponse(res, variant, 'Variant set as default successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update variant stock
 */
const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (quantity === undefined || quantity === null) {
      return errorResponse(
        res,
        'Quantity is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const validOperations = ['set', 'add', 'subtract'];
    if (!validOperations.includes(operation)) {
      return errorResponse(
        res,
        'Invalid operation. Valid operations are: set, add, subtract',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const variant = await variantService.updateStock(id, {
      quantity: parseInt(quantity),
      operation,
      updated_by: req.admin.adminId,
    });

    return successResponse(res, variant, 'Variant stock updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update variant stock
 */
const bulkUpdateStock = async (req, res, next) => {
  try {
    const { variants } = req.body;

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return errorResponse(
        res,
        'Variants array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await variantService.bulkUpdateStock(variants, req.admin.adminId);

    return successResponse(res, result, `${result.updated} variants stock updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload variant image
 */
const uploadImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return errorResponse(
        res,
        'No image file uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Delete old image if exists
    if (existingVariant.image_url) {
      await variantService.deleteImage(existingVariant.image_url);
    }

    const imagePath = `uploads/variants/${req.file.filename}`;
    const variant = await variantService.updateImage(id, imagePath);

    return successResponse(res, variant, 'Variant image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove variant image
 */
const removeImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (!existingVariant.image_url) {
      return errorResponse(
        res,
        'Variant has no image to remove',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Delete image file
    await variantService.deleteImage(existingVariant.image_url);

    const variant = await variantService.updateImage(id, null);

    return successResponse(res, variant, 'Variant image removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get variant statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await variantService.getStatistics();
    return successResponse(res, stats, 'Variant statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock variants
 */
const getLowStock = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, lang = 'en' } = req.query;

    const result = await variantService.getLowStock({
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, result, 'Low stock variants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get out of stock variants
 */
const getOutOfStock = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, lang = 'en' } = req.query;

    const result = await variantService.getOutOfStock({
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, result, 'Out of stock variants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update variants
 */
const bulkUpdate = async (req, res, next) => {
  try {
    const { variant_ids, updates } = req.body;

    if (!variant_ids || !Array.isArray(variant_ids) || variant_ids.length === 0) {
      return errorResponse(
        res,
        'Variant IDs array is required',
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

    const result = await variantService.bulkUpdate(variant_ids, updates);

    return successResponse(res, result, `${result.updated} variants updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete variants
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { variant_ids } = req.body;

    if (!variant_ids || !Array.isArray(variant_ids) || variant_ids.length === 0) {
      return errorResponse(
        res,
        'Variant IDs array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if any variant is in orders
    for (const id of variant_ids) {
      const orderCount = await variantService.getOrderCount(id);
      if (orderCount > 0) {
        return errorResponse(
          res,
          `Variant ${id} is in ${orderCount} order(s). Cannot delete.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    const result = await variantService.bulkDelete(variant_ids);

    return successResponse(res, result, `${result.deleted} variants deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Export variants to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { product_id, is_active, in_stock } = req.query;

    const excelBuffer = await variantService.exportToExcel({
      product_id: product_id ? parseInt(product_id) : undefined,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      in_stock: in_stock !== undefined ? in_stock === 'true' : undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=variants.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Import variants from Excel
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

    const result = await variantService.importFromExcel(req.file.path, req.admin.adminId);

    return successResponse(res, result, `Import completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate variants for product
 */
const generateVariants = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const { color_ids, size_ids, base_price, base_stock } = req.body;

    // Check if product exists
    const productExists = await variantService.checkProductExists(product_id);
    if (!productExists) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if ((!color_ids || color_ids.length === 0) && (!size_ids || size_ids.length === 0)) {
      return errorResponse(
        res,
        'At least color_ids or size_ids are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await variantService.generateVariants(product_id, {
      color_ids: color_ids || [],
      size_ids: size_ids || [],
      base_price: base_price ? parseFloat(base_price) : null,
      base_stock: base_stock ? parseInt(base_stock) : 0,
      created_by: req.admin.adminId,
    });

    return successResponse(res, result, `${result.created} variants generated successfully`, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all variants for product
 */
const deleteProductVariants = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    // Check if product exists
    const productExists = await variantService.checkProductExists(product_id);
    if (!productExists) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if any variant is in orders
    const hasOrders = await variantService.productVariantsHaveOrders(product_id);
    if (hasOrders) {
      return errorResponse(
        res,
        'Cannot delete variants. Some variants are in existing orders.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await variantService.deleteProductVariants(product_id);

    return successResponse(res, result, `${result.deleted} variants deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Search variants
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

    const result = await variantService.search({
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
 * Duplicate variant
 */
const duplicate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { target_product_id } = req.body;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const newVariant = await variantService.duplicate(id, {
      target_product_id: target_product_id ? parseInt(target_product_id) : null,
      created_by: req.admin.adminId,
    });

    return successResponse(res, newVariant, 'Variant duplicated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get variant price history
 */
const getPriceHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const result = await variantService.getPriceHistory(id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, result, 'Price history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get variant stock history
 */
const getStockHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const result = await variantService.getStockHistory(id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, result, 'Stock history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update variant price
 */
const updatePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, compare_price, cost_price, reason } = req.body;

    // Check if variant exists
    const existingVariant = await variantService.getById(id);
    if (!existingVariant) {
      return errorResponse(
        res,
        'Variant not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const variant = await variantService.updatePrice(id, {
      price: price !== undefined ? parseFloat(price) : undefined,
      compare_price: compare_price !== undefined ? parseFloat(compare_price) : undefined,
      cost_price: cost_price !== undefined ? parseFloat(cost_price) : undefined,
      reason,
      updated_by: req.admin.adminId,
    });

    return successResponse(res, variant, 'Variant price updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update prices
 */
const bulkUpdatePrices = async (req, res, next) => {
  try {
    const { variants, adjustment_type, adjustment_value } = req.body;

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return errorResponse(
        res,
        'Variants array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const validAdjustmentTypes = ['fixed', 'percentage', 'set'];
    if (adjustment_type && !validAdjustmentTypes.includes(adjustment_type)) {
      return errorResponse(
        res,
        'Invalid adjustment type. Valid types are: fixed, percentage, set',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await variantService.bulkUpdatePrices(variants, {
      adjustment_type,
      adjustment_value: adjustment_value ? parseFloat(adjustment_value) : null,
      updated_by: req.admin.adminId,
    });

    return successResponse(res, result, `${result.updated} variant prices updated successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByProduct,
  getBySku,
  create,
  update,
  remove,
  toggleStatus,
  setDefault,
  updateStock,
  bulkUpdateStock,
  uploadImage,
  removeImage,
  getStatistics,
  getLowStock,
  getOutOfStock,
  bulkUpdate,
  bulkDelete,
  exportToExcel,
  importFromExcel,
  generateVariants,
  deleteProductVariants,
  search,
  duplicate,
  getPriceHistory,
  getStockHistory,
  updatePrice,
  bulkUpdatePrices,
};