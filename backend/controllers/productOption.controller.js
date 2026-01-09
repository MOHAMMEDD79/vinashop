/**
 * Product Option Controller
 * @module controllers/productOption
 *
 * Handles product option types and values management
 * Accepts both camelCase and snake_case, responses include both formats
 */

const productOptionService = require('../services/productOption.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Helper: Format option type for response
 */
const formatOptionType = (type, lang = 'en') => {
  if (!type) return null;

  return {
    id: type.option_type_id,
    optionTypeId: type.option_type_id,
    option_type_id: type.option_type_id,

    name: type[`type_name_${lang}`] || type.type_name_en,
    typeName: type[`type_name_${lang}`] || type.type_name_en,
    type_name: type[`type_name_${lang}`] || type.type_name_en,

    nameEn: type.type_name_en,
    nameAr: type.type_name_ar,
    nameHe: type.type_name_he,
    type_name_en: type.type_name_en,
    type_name_ar: type.type_name_ar,
    type_name_he: type.type_name_he,

    displayOrder: type.display_order,
    display_order: type.display_order,

    isActive: type.is_active === 1 || type.is_active === true,
    is_active: type.is_active === 1 || type.is_active === true,

    valueCount: type.value_count || 0,
    value_count: type.value_count || 0,
    productCount: type.product_count || 0,
    product_count: type.product_count || 0,

    values: (type.values || []).map(v => formatOptionValue(v, lang)),

    createdAt: type.created_at,
    created_at: type.created_at,
  };
};

/**
 * Helper: Format option value for response
 */
const formatOptionValue = (value, lang = 'en') => {
  if (!value) return null;

  return {
    id: value.option_value_id,
    optionValueId: value.option_value_id,
    option_value_id: value.option_value_id,

    optionTypeId: value.option_type_id,
    option_type_id: value.option_type_id,

    name: value[`value_name_${lang}`] || value.value_name_en,
    valueName: value[`value_name_${lang}`] || value.value_name_en,
    value_name: value[`value_name_${lang}`] || value.value_name_en,

    nameEn: value.value_name_en,
    nameAr: value.value_name_ar,
    nameHe: value.value_name_he,
    value_name_en: value.value_name_en,
    value_name_ar: value.value_name_ar,
    value_name_he: value.value_name_he,

    additionalPrice: parseFloat(value.additional_price) || 0,
    additional_price: parseFloat(value.additional_price) || 0,

    displayOrder: value.display_order,
    display_order: value.display_order,

    isActive: value.is_active === 1 || value.is_active === true,
    is_active: value.is_active === 1 || value.is_active === true,

    createdAt: value.created_at,
    created_at: value.created_at,
  };
};

// ==================== Option Types ====================

/**
 * Get all option types
 */
const getAllTypes = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search,
      is_active, isActive,
      sort = 'display_order', order = 'ASC',
      lang = 'en',
    } = req.query;

    const result = await productOptionService.getAllTypes({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      sort,
      order,
    });

    const items = (result.data || []).map(t => formatOptionType(t, lang));
    return successResponse(res, {
      items,
      data: items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    }, 'Option types retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get option type by ID
 */
const getTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const type = await productOptionService.getTypeById(id);

    if (!type) {
      return errorResponse(res, 'Option type not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatOptionType(type, lang));
  } catch (error) {
    next(error);
  }
};

/**
 * Create option type
 */
const createType = async (req, res, next) => {
  try {
    const {
      type_name_en, typeNameEn, nameEn,
      type_name_ar, typeNameAr, nameAr,
      type_name_he, typeNameHe, nameHe,
      display_order, displayOrder,
      is_active, isActive,
    } = req.body;

    const nameEN = type_name_en || typeNameEn || nameEn;
    const nameAR = type_name_ar || typeNameAr || nameAr;
    const nameHE = type_name_he || typeNameHe || nameHe;

    if (!nameEN || !nameAR || !nameHE) {
      return errorResponse(
        res,
        'Option type name is required in all languages (EN, AR, HE)',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const type = await productOptionService.createType({
      type_name_en: nameEN,
      type_name_ar: nameAR,
      type_name_he: nameHE,
      display_order: parseInt(display_order || displayOrder) || 0,
      is_active: (is_active ?? isActive) !== 'false' && (is_active ?? isActive) !== false,
    });

    return successResponse(res, formatOptionType(type), 'Option type created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update option type
 */
const updateType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type_name_en, typeNameEn, nameEn,
      type_name_ar, typeNameAr, nameAr,
      type_name_he, typeNameHe, nameHe,
      display_order, displayOrder,
      is_active, isActive,
    } = req.body;

    const existingType = await productOptionService.getTypeById(id);
    if (!existingType) {
      return errorResponse(res, 'Option type not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const updateData = {};

    const nameEN = type_name_en ?? typeNameEn ?? nameEn;
    const nameAR = type_name_ar ?? typeNameAr ?? nameAr;
    const nameHE = type_name_he ?? typeNameHe ?? nameHe;

    if (nameEN !== undefined) updateData.type_name_en = nameEN;
    if (nameAR !== undefined) updateData.type_name_ar = nameAR;
    if (nameHE !== undefined) updateData.type_name_he = nameHE;

    const order = display_order ?? displayOrder;
    if (order !== undefined) updateData.display_order = parseInt(order);

    const active = is_active ?? isActive;
    if (active !== undefined) updateData.is_active = active === 'true' || active === true;

    const type = await productOptionService.updateType(id, updateData);

    return successResponse(res, formatOptionType(type), 'Option type updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete option type
 */
const deleteType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingType = await productOptionService.getTypeById(id);
    if (!existingType) {
      return errorResponse(res, 'Option type not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const isUsed = await productOptionService.isTypeUsedInProducts(id);
    if (isUsed) {
      return errorResponse(
        res,
        'Cannot delete option type that is used in products',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await productOptionService.deleteType(id);

    return successResponse(res, null, 'Option type deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== Option Values ====================

/**
 * Get values for an option type
 */
const getValuesByType = async (req, res, next) => {
  try {
    const { typeId, type_id } = req.params;
    const tId = typeId || type_id;
    const { is_active, isActive, lang = 'en' } = req.query;

    const existingType = await productOptionService.getTypeById(tId);
    if (!existingType) {
      return errorResponse(res, 'Option type not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const values = await productOptionService.getValuesByType(tId, {
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
    });

    const formattedValues = values.map(v => formatOptionValue(v, lang));
    return successResponse(res, formattedValues, 'Option values retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get option value by ID
 */
const getValueById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const value = await productOptionService.getValueById(id);

    if (!value) {
      return errorResponse(res, 'Option value not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatOptionValue(value, lang));
  } catch (error) {
    next(error);
  }
};

/**
 * Create option value
 */
const createValue = async (req, res, next) => {
  try {
    const { typeId, type_id } = req.params;
    const tId = typeId || type_id || req.body.option_type_id || req.body.optionTypeId;

    const {
      value_name_en, valueNameEn, nameEn,
      value_name_ar, valueNameAr, nameAr,
      value_name_he, valueNameHe, nameHe,
      additional_price, additionalPrice,
      display_order, displayOrder,
      is_active, isActive,
    } = req.body;

    const existingType = await productOptionService.getTypeById(tId);
    if (!existingType) {
      return errorResponse(res, 'Option type not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const nameEN = value_name_en || valueNameEn || nameEn;
    const nameAR = value_name_ar || valueNameAr || nameAr;
    const nameHE = value_name_he || valueNameHe || nameHe;

    if (!nameEN || !nameAR || !nameHE) {
      return errorResponse(
        res,
        'Option value name is required in all languages (EN, AR, HE)',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const value = await productOptionService.createValue({
      option_type_id: tId,
      value_name_en: nameEN,
      value_name_ar: nameAR,
      value_name_he: nameHE,
      additional_price: parseFloat(additional_price || additionalPrice) || 0,
      display_order: parseInt(display_order || displayOrder) || 0,
      is_active: (is_active ?? isActive) !== 'false' && (is_active ?? isActive) !== false,
    });

    return successResponse(res, formatOptionValue(value), 'Option value created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update option value
 */
const updateValue = async (req, res, next) => {
  try {
    const { id, valueId, value_id } = req.params;
    const vId = valueId || value_id || id;

    const {
      value_name_en, valueNameEn, nameEn,
      value_name_ar, valueNameAr, nameAr,
      value_name_he, valueNameHe, nameHe,
      additional_price, additionalPrice,
      display_order, displayOrder,
      is_active, isActive,
    } = req.body;

    const existingValue = await productOptionService.getValueById(vId);
    if (!existingValue) {
      return errorResponse(res, 'Option value not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const updateData = {};

    const nameEN = value_name_en ?? valueNameEn ?? nameEn;
    const nameAR = value_name_ar ?? valueNameAr ?? nameAr;
    const nameHE = value_name_he ?? valueNameHe ?? nameHe;

    if (nameEN !== undefined) updateData.value_name_en = nameEN;
    if (nameAR !== undefined) updateData.value_name_ar = nameAR;
    if (nameHE !== undefined) updateData.value_name_he = nameHE;

    const price = additional_price ?? additionalPrice;
    if (price !== undefined) updateData.additional_price = parseFloat(price);

    const order = display_order ?? displayOrder;
    if (order !== undefined) updateData.display_order = parseInt(order);

    const active = is_active ?? isActive;
    if (active !== undefined) updateData.is_active = active === 'true' || active === true;

    const value = await productOptionService.updateValue(vId, updateData);

    return successResponse(res, formatOptionValue(value), 'Option value updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete option value
 */
const deleteValue = async (req, res, next) => {
  try {
    const { id, valueId, value_id } = req.params;
    const vId = valueId || value_id || id;

    const existingValue = await productOptionService.getValueById(vId);
    if (!existingValue) {
      return errorResponse(res, 'Option value not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await productOptionService.deleteValue(vId);

    return successResponse(res, null, 'Option value deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create values for a type
 */
const bulkCreateValues = async (req, res, next) => {
  try {
    const { typeId, type_id } = req.params;
    const tId = typeId || type_id;
    const { values } = req.body;

    const existingType = await productOptionService.getTypeById(tId);
    if (!existingType) {
      return errorResponse(res, 'Option type not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!values || !Array.isArray(values) || values.length === 0) {
      return errorResponse(res, 'Values array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const createdValues = await productOptionService.bulkCreateValues(tId, values);

    return successResponse(res, createdValues.map(v => formatOptionValue(v)), `${createdValues.length} values created successfully`, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update values order
 */
const updateValuesOrder = async (req, res, next) => {
  try {
    const { typeId, type_id } = req.params;
    const tId = typeId || type_id;
    const { order, orderArray } = req.body;

    const existingType = await productOptionService.getTypeById(tId);
    if (!existingType) {
      return errorResponse(res, 'Option type not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await productOptionService.updateValuesOrder(tId, order || orderArray);

    return successResponse(res, null, 'Values order updated successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== Product Options ====================

/**
 * Get options for a product
 */
const getProductOptions = async (req, res, next) => {
  try {
    const { productId, product_id } = req.params;
    const pId = productId || product_id;
    const { lang = 'en' } = req.query;

    const options = await productOptionService.getProductOptions(pId);

    const formattedOptions = options.map(opt => ({
      id: opt.product_option_id,
      productOptionId: opt.product_option_id,
      product_option_id: opt.product_option_id,
      optionTypeId: opt.option_type_id,
      option_type_id: opt.option_type_id,
      typeName: opt[`type_name_${lang}`] || opt.type_name_en,
      type_name: opt[`type_name_${lang}`] || opt.type_name_en,
      type_name_en: opt.type_name_en,
      type_name_ar: opt.type_name_ar,
      type_name_he: opt.type_name_he,
      isRequired: opt.is_required === 1 || opt.is_required === true,
      is_required: opt.is_required === 1 || opt.is_required === true,
      displayOrder: opt.display_order,
      display_order: opt.display_order,
      values: (opt.values || []).map(v => formatOptionValue(v, lang)),
    }));

    return successResponse(res, formattedOptions, 'Product options retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Set product options
 * Accepts either:
 * - { options: [{ option_type_id, is_required }] } - array of option types
 * - { option_value_ids: [1, 2, 3] } - array of option value IDs (will be converted to types)
 */
const setProductOptions = async (req, res, next) => {
  try {
    const { productId, product_id } = req.params;
    const pId = productId || product_id;
    const { options, option_value_ids, optionValueIds } = req.body;

    // Handle option_value_ids format (from frontend product form)
    const valueIds = option_value_ids || optionValueIds;
    if (valueIds && Array.isArray(valueIds)) {
      // Convert option value IDs to option type associations
      const result = await productOptionService.setProductOptionsByValueIds(pId, valueIds);
      return successResponse(res, result, 'Product options updated successfully');
    }

    // Handle traditional options array format
    if (!options || !Array.isArray(options)) {
      return errorResponse(res, 'Options array or option_value_ids array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await productOptionService.setProductOptions(pId, options);

    return successResponse(res, result, 'Product options updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add option to product
 */
const addProductOption = async (req, res, next) => {
  try {
    const { productId, product_id } = req.params;
    const pId = productId || product_id;
    const { option_type_id, optionTypeId, is_required, isRequired } = req.body;

    const typeId = option_type_id || optionTypeId;
    if (!typeId) {
      return errorResponse(res, 'Option type ID is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await productOptionService.addProductOption(
      pId,
      typeId,
      (is_required ?? isRequired) === 'true' || (is_required ?? isRequired) === true
    );

    return successResponse(res, result, 'Option added to product successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove option from product
 */
const removeProductOption = async (req, res, next) => {
  try {
    const { productId, product_id, typeId, type_id } = req.params;
    const pId = productId || product_id;
    const tId = typeId || type_id;

    await productOptionService.removeProductOption(pId, tId);

    return successResponse(res, null, 'Option removed from product successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await productOptionService.getStatistics();

    const formattedStats = {
      totalTypes: stats.total_types,
      total_types: stats.total_types,
      activeTypes: stats.active_types,
      active_types: stats.active_types,
      totalValues: stats.total_values,
      total_values: stats.total_values,
      activeValues: stats.active_values,
      active_values: stats.active_values,
      productsWithOptions: stats.products_with_options,
      products_with_options: stats.products_with_options,
    };

    return successResponse(res, formattedStats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Option Types
  getAllTypes,
  getTypeById,
  createType,
  updateType,
  deleteType,

  // Option Values
  getValuesByType,
  getValueById,
  createValue,
  updateValue,
  deleteValue,
  bulkCreateValues,
  updateValuesOrder,

  // Product Options
  getProductOptions,
  setProductOptions,
  addProductOption,
  removeProductOption,

  // Statistics
  getStatistics,
};
