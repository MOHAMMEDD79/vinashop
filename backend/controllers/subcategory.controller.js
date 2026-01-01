/**
 * Subcategory Controller
 * @module controllers/subcategory
 * 
 * FIXED: Accepts both camelCase and snake_case, responses include both formats
 */

const subcategoryService = require('../services/subcategory.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Helper: Format subcategory for response
 */
const formatSubcategory = (subcategory, lang = 'en') => {
  if (!subcategory) return null;

  return {
    id: subcategory.subcategory_id || subcategory.id,
    subcategoryId: subcategory.subcategory_id || subcategory.id,
    subcategory_id: subcategory.subcategory_id || subcategory.id,

    name: subcategory[`subcategory_name_${lang}`] || subcategory.subcategory_name_en || subcategory.name,
    subcategoryName: subcategory[`subcategory_name_${lang}`] || subcategory.subcategory_name_en,
    subcategory_name: subcategory[`subcategory_name_${lang}`] || subcategory.subcategory_name_en,
    nameEn: subcategory.subcategory_name_en,
    nameAr: subcategory.subcategory_name_ar,
    nameHe: subcategory.subcategory_name_he,
    subcategory_name_en: subcategory.subcategory_name_en,
    subcategory_name_ar: subcategory.subcategory_name_ar,
    subcategory_name_he: subcategory.subcategory_name_he,

    description: subcategory[`description_${lang}`] || subcategory.description_en,
    descriptionEn: subcategory.description_en,
    descriptionAr: subcategory.description_en,
    descriptionHe: subcategory.description_en,
    description_en: subcategory.description_en,
    description_ar: subcategory.description_en,
    description_he: subcategory.description_en,

    categoryId: subcategory.category_id,
    category_id: subcategory.category_id,
    categoryName: subcategory.category_name,
    category_name: subcategory.category_name,

    // Parent subcategory support (for nested subcategories)
    parentId: subcategory.parent_id,
    parent_id: subcategory.parent_id,
    parentName: subcategory.parent_name,
    parent_name: subcategory.parent_name,
    level: subcategory.level || 1,

    // Children (for tree structure)
    children: subcategory.children ? subcategory.children.map(c => formatSubcategory(c, lang)) : undefined,
    hasChildren: subcategory.has_children || subcategory.children_count > 0,
    childrenCount: subcategory.children_count || 0,

    image: subcategory.image_url || subcategory.subcategory_image,
    imageUrl: subcategory.image_url || subcategory.subcategory_image,
    image_url: subcategory.image_url || subcategory.subcategory_image,
    subcategory_image: subcategory.subcategory_image || subcategory.image_url,

    displayOrder: subcategory.display_order || 0,
    display_order: subcategory.display_order || 0,

    isActive: subcategory.is_active === 1 || subcategory.is_active === true,
    is_active: subcategory.is_active === 1 || subcategory.is_active === true,
    isFeatured: subcategory.is_featured === 1 || subcategory.is_featured === true,
    is_featured: subcategory.is_featured === 1 || subcategory.is_featured === true,

    productCount: subcategory.product_count || 0,
    product_count: subcategory.product_count || 0,

    metaTitle: null,
    meta_title: null,
    metaDescription: null,
    meta_description: null,
    metaKeywords: null,
    meta_keywords: null,

    createdAt: subcategory.created_at,
    created_at: subcategory.created_at,
    updatedAt: subcategory.updated_at,
    updated_at: subcategory.updated_at,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result, lang = 'en') => {
  const items = (result.items || result.data || result.subcategories || []).map(s => formatSubcategory(s, lang));
  return {
    items,
    data: items,
    subcategories: items,
    pagination: {
      page: result.page || 1,
      limit: result.limit || 10,
      total: result.total || items.length,
      totalPages: result.totalPages || 1,
    },
    page: result.page || 1,
    limit: result.limit || 10,
    total: result.total || items.length,
    totalPages: result.totalPages || 1,
  };
};

/**
 * Get all subcategories
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search,
      category_id, categoryId,
      is_active, isActive, is_featured, isFeatured,
      sort = 'display_order', order = 'ASC',
      sortBy, sort_by, sortOrder, sort_order,
      lang = 'en',
    } = req.query;

    const result = await subcategoryService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category_id: parseInt(category_id || categoryId) || undefined,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      is_featured: (is_featured ?? isFeatured) !== undefined ? (is_featured || isFeatured) === 'true' : undefined,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
      lang,
    });

    return successResponse(res, formatPaginationResponse(result, lang), 'Subcategories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all subcategories (no pagination - for dropdowns)
 */
const getAllList = async (req, res, next) => {
  try {
    const { is_active, isActive, category_id, categoryId, lang = 'en' } = req.query;
    const active = is_active ?? isActive;

    const subcategories = await subcategoryService.getAllList({
      is_active: active === 'true' || active === true || active === undefined,
      category_id: parseInt(category_id || categoryId) || undefined,
      lang,
    });

    const formattedSubcategories = (subcategories || []).map(s => formatSubcategory(s, lang));
    return successResponse(res, formattedSubcategories, 'Subcategories list retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategory by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const subcategory = await subcategoryService.getById(id, lang);

    if (!subcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatSubcategory(subcategory, lang));
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategories by category
 */
const getByCategory = async (req, res, next) => {
  try {
    const { category_id, categoryId } = req.params;
    const catId = category_id || categoryId;
    const { page = 1, limit = 10, is_active, isActive, lang = 'en' } = req.query;

    const result = await subcategoryService.getByCategory(catId, {
      page: parseInt(page),
      limit: parseInt(limit),
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      lang,
    });

    return successResponse(res, formatPaginationResponse(result, lang), 'Subcategories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new subcategory
 */
const create = async (req, res, next) => {
  try {
    const {
      subcategory_name_en, subcategoryNameEn, nameEn,
      subcategory_name_ar, subcategoryNameAr, nameAr,
      subcategory_name_he, subcategoryNameHe, nameHe,
      description_en, descriptionEn,
      description_ar, descriptionAr,
      description_he, descriptionHe,
      category_id, categoryId,
      parent_id, parentId,  // Support for nested subcategories
      display_order, displayOrder,
      is_active, isActive,
      is_featured, isFeatured,
      meta_title, metaTitle,
      meta_description, metaDescription,
      meta_keywords, metaKeywords,
      subcategory_image, image_url, imageUrl,  // Image URL support
    } = req.body;

    const nameEN = subcategory_name_en || subcategoryNameEn || nameEn;
    const nameAR = subcategory_name_ar || subcategoryNameAr || nameAr;
    const nameHE = subcategory_name_he || subcategoryNameHe || nameHe;
    const catId = category_id || categoryId;
    const parId = parent_id || parentId;

    if (!nameEN) {
      return errorResponse(res, 'Subcategory name (English) is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (!catId) {
      return errorResponse(res, 'Category ID is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const categoryExists = await subcategoryService.checkCategoryExists(catId);
    if (!categoryExists) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Calculate level based on parent
    let level = 1;
    if (parId) {
      const parentSubcategory = await subcategoryService.getById(parId);
      if (!parentSubcategory) {
        return errorResponse(res, 'Parent subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
      }
      // Parent must belong to the same category
      if (parentSubcategory.category_id !== parseInt(catId)) {
        return errorResponse(res, 'Parent subcategory must belong to the same category', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }
      level = (parentSubcategory.level || 1) + 1;
    }

    const existingName = await subcategoryService.findByNameInCategory(nameEN, catId, 'en');
    if (existingName) {
      return errorResponse(res, 'Subcategory with this name already exists in this category', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    let imagePath = subcategory_image || image_url || imageUrl || null;
    if (req.file) {
      imagePath = `uploads/subcategories/${req.file.filename}`;
    }

    const subcategory = await subcategoryService.create({
      subcategory_name_en: nameEN,
      subcategory_name_ar: nameAR || nameEN,
      subcategory_name_he: nameHE || nameEN,
      description_en: description_en || descriptionEn,
      category_id: parseInt(catId),
      parent_id: parId ? parseInt(parId) : null,
      level: level,
      image_url: imagePath,
      subcategory_image: imagePath,
      display_order: parseInt(display_order || displayOrder) || 0,
      is_active: (is_active ?? isActive) !== 'false' && (is_active ?? isActive) !== false,
      is_featured: (is_featured ?? isFeatured) === 'true' || (is_featured ?? isFeatured) === true,
    });

    return successResponse(res, formatSubcategory(subcategory), 'Subcategory created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update subcategory
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      subcategory_name_en, subcategoryNameEn, nameEn,
      subcategory_name_ar, subcategoryNameAr, nameAr,
      subcategory_name_he, subcategoryNameHe, nameHe,
      description_en, descriptionEn,
      description_ar, descriptionAr,
      description_he, descriptionHe,
      category_id, categoryId,
      parent_id, parentId,  // Support for nested subcategories
      display_order, displayOrder,
      is_active, isActive,
      is_featured, isFeatured,
      meta_title, metaTitle,
      meta_description, metaDescription,
      meta_keywords, metaKeywords,
      subcategory_image, image_url, imageUrl,  // Image URL support
    } = req.body;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const catId = category_id ?? categoryId;
    if (catId && parseInt(catId) !== existingSubcategory.category_id) {
      const categoryExists = await subcategoryService.checkCategoryExists(catId);
      if (!categoryExists) {
        return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
      }
    }

    const targetCategoryId = catId ? parseInt(catId) : existingSubcategory.category_id;
    const nameEN = subcategory_name_en ?? subcategoryNameEn ?? nameEn;
    if (nameEN && nameEN !== existingSubcategory.subcategory_name_en) {
      const existingName = await subcategoryService.findByNameInCategory(nameEN, targetCategoryId, 'en');
      if (existingName && existingName.subcategory_id !== parseInt(id)) {
        return errorResponse(res, 'Subcategory with this name already exists in this category', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    let imagePath = existingSubcategory.image_url;
    if (req.file) {
      if (existingSubcategory.image_url) {
        await subcategoryService.deleteImage(existingSubcategory.image_url);
      }
      imagePath = `uploads/subcategories/${req.file.filename}`;
    }

    const updateData = {};
    if (nameEN !== undefined) updateData.subcategory_name_en = nameEN;

    const nameAR = subcategory_name_ar ?? subcategoryNameAr ?? nameAr;
    const nameHE = subcategory_name_he ?? subcategoryNameHe ?? nameHe;
    if (nameAR !== undefined) updateData.subcategory_name_ar = nameAR;
    if (nameHE !== undefined) updateData.subcategory_name_he = nameHE;

    const descEN = description_en ?? descriptionEn;
    if (descEN !== undefined) updateData.description_en = descEN;

    if (catId !== undefined) updateData.category_id = parseInt(catId);

    // Handle parent_id for nested subcategories
    const parId = parent_id ?? parentId;
    if (parId !== undefined) {
      if (parId === null || parId === '' || parId === 0) {
        updateData.parent_id = null;
        updateData.level = 1;
      } else {
        // Prevent setting self as parent
        if (parseInt(parId) === parseInt(id)) {
          return errorResponse(res, 'Cannot set subcategory as its own parent', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
        }
        const parentSubcategory = await subcategoryService.getById(parId);
        if (!parentSubcategory) {
          return errorResponse(res, 'Parent subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
        }
        updateData.parent_id = parseInt(parId);
        updateData.level = (parentSubcategory.level || 1) + 1;
      }
    }

    // Handle image URL
    const imgUrl = subcategory_image ?? image_url ?? imageUrl;
    if (imgUrl !== undefined) {
      updateData.image_url = imgUrl;
      updateData.subcategory_image = imgUrl;
    } else if (imagePath !== existingSubcategory.image_url) {
      updateData.image_url = imagePath;
    }

    const order = display_order ?? displayOrder;
    if (order !== undefined) updateData.display_order = parseInt(order);

    const active = is_active ?? isActive;
    const featured = is_featured ?? isFeatured;
    if (active !== undefined) updateData.is_active = active === 'true' || active === true;
    if (featured !== undefined) updateData.is_featured = featured === 'true' || featured === true;

    const subcategory = await subcategoryService.update(id, updateData);

    return successResponse(res, formatSubcategory(subcategory), 'Subcategory updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete subcategory
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const productCount = await subcategoryService.getProductCount(id);
    if (productCount > 0) {
      return errorResponse(res, `Cannot delete subcategory with ${productCount} products. Please move or delete products first.`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    if (existingSubcategory.image_url) {
      await subcategoryService.deleteImage(existingSubcategory.image_url);
    }

    await subcategoryService.remove(id);

    return successResponse(res, null, 'Subcategory deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle subcategory status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const newStatus = !existingSubcategory.is_active;
    const subcategory = await subcategoryService.update(id, { is_active: newStatus });

    return successResponse(res, formatSubcategory(subcategory), `Subcategory ${newStatus ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle subcategory featured
 */
const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const newStatus = !existingSubcategory.is_featured;
    const subcategory = await subcategoryService.update(id, { is_featured: newStatus });

    return successResponse(res, formatSubcategory(subcategory), `Subcategory ${newStatus ? 'marked as featured' : 'removed from featured'}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update subcategory image
 */
const updateImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!req.file) {
      return errorResponse(res, 'Image file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (existingSubcategory.image_url) {
      await subcategoryService.deleteImage(existingSubcategory.image_url);
    }

    const image_url = `uploads/subcategories/${req.file.filename}`;
    const subcategory = await subcategoryService.update(id, { image_url });

    return successResponse(res, formatSubcategory(subcategory), 'Subcategory image updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove subcategory image
 */
const removeImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingSubcategory.image_url) {
      await subcategoryService.deleteImage(existingSubcategory.image_url);
    }

    const subcategory = await subcategoryService.update(id, { image_url: null });

    return successResponse(res, formatSubcategory(subcategory), 'Subcategory image removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update subcategory display order
 */
const updateDisplayOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { display_order, displayOrder } = req.body;
    const order = display_order ?? displayOrder;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (order === undefined || isNaN(parseInt(order))) {
      return errorResponse(res, 'Valid display order is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const subcategory = await subcategoryService.update(id, { display_order: parseInt(order) });

    return successResponse(res, formatSubcategory(subcategory), 'Display order updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategory statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await subcategoryService.getStatistics();
    
    const formattedStats = {
      total: stats.total || 0,
      totalSubcategories: stats.total || 0,
      total_subcategories: stats.total || 0,
      active: stats.active || 0,
      activeSubcategories: stats.active || 0,
      active_subcategories: stats.active || 0,
      inactive: stats.inactive || 0,
      featured: stats.featured || 0,
      featuredSubcategories: stats.featured || 0,
      featured_subcategories: stats.featured || 0,
      withProducts: stats.with_products || stats.withProducts || 0,
      with_products: stats.with_products || stats.withProducts || 0,
      empty: stats.empty || 0,
    };
    
    return successResponse(res, formattedStats, 'Subcategory statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategory with products
 */
const getSubcategoryWithProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, lang = 'en' } = req.query;

    const subcategory = await subcategoryService.getById(id, lang);
    if (!subcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const products = await subcategoryService.getSubcategoryProducts(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, {
      subcategory: formatSubcategory(subcategory, lang),
      products,
    }, 'Subcategory with products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured subcategories
 */
const getFeatured = async (req, res, next) => {
  try {
    const { limit = 10, category_id, categoryId, lang = 'en' } = req.query;

    const subcategories = await subcategoryService.getFeatured({
      limit: parseInt(limit),
      category_id: parseInt(category_id || categoryId) || undefined,
      lang,
    });

    const formattedSubcategories = (subcategories || []).map(s => formatSubcategory(s, lang));
    return successResponse(res, formattedSubcategories, 'Featured subcategories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update subcategories
 */
const bulkUpdate = async (req, res, next) => {
  try {
    const { subcategory_ids, subcategoryIds, ids, updates } = req.body;
    const idList = subcategory_ids || subcategoryIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Subcategory IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (!updates || Object.keys(updates).length === 0) {
      return errorResponse(res, 'Updates object is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await subcategoryService.bulkUpdate(idList, updates);

    return successResponse(res, result, `${result.updated} subcategories updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete subcategories
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { subcategory_ids, subcategoryIds, ids } = req.body;
    const idList = subcategory_ids || subcategoryIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Subcategory IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    for (const id of idList) {
      const productCount = await subcategoryService.getProductCount(id);
      if (productCount > 0) {
        return errorResponse(res, `Subcategory ${id} has ${productCount} product(s). Cannot delete.`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }
    }

    const result = await subcategoryService.bulkDelete(idList);

    return successResponse(res, result, `${result.deleted} subcategories deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Export subcategories to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { category_id, categoryId, is_active, isActive } = req.query;

    const excelBuffer = await subcategoryService.exportToExcel({
      category_id: parseInt(category_id || categoryId) || undefined,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=subcategories.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Import subcategories from Excel
 */
const importFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Excel file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await subcategoryService.importFromExcel(req.file.path, req.admin?.adminId);

    return successResponse(res, result, `Import completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    next(error);
  }
};

/**
 * Move subcategory to another category
 */
const moveToCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, categoryId, target_category_id, targetCategoryId } = req.body;
    const catId = category_id || categoryId || target_category_id || targetCategoryId;

    if (!catId) {
      return errorResponse(res, 'Target category ID is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const categoryExists = await subcategoryService.checkCategoryExists(catId);
    if (!categoryExists) {
      return errorResponse(res, 'Target category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const existingName = await subcategoryService.findByNameInCategory(existingSubcategory.subcategory_name_en, catId, 'en');
    if (existingName) {
      return errorResponse(res, 'Subcategory with this name already exists in target category', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    const subcategory = await subcategoryService.moveToCategory(id, parseInt(catId));

    return successResponse(res, formatSubcategory(subcategory), 'Subcategory moved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search subcategories
 */
const search = async (req, res, next) => {
  try {
    const { q, query, page = 1, limit = 10, lang = 'en' } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return errorResponse(res, 'Search query is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await subcategoryService.search({
      query: searchQuery,
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, formatPaginationResponse(result, lang), 'Search results retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate subcategory
 */
const duplicate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { target_category_id, targetCategoryId, category_id, categoryId } = req.body;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const targetCatId = target_category_id || targetCategoryId || category_id || categoryId;

    const newSubcategory = await subcategoryService.duplicate(id, {
      target_category_id: targetCatId ? parseInt(targetCatId) : null,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatSubcategory(newSubcategory), 'Subcategory duplicated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategory product count
 */
const getProductCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const count = await subcategoryService.getProductCount(id);

    return successResponse(res, { count, productCount: count, product_count: count }, 'Product count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get children of a subcategory
 */
const getChildren = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const children = await subcategoryService.getChildren(id, lang);
    const formattedChildren = (children || []).map(c => formatSubcategory(c, lang));

    return successResponse(res, formattedChildren, 'Children retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategory tree for a category
 */
const getTree = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { lang = 'en' } = req.query;

    const categoryExists = await subcategoryService.checkCategoryExists(categoryId);
    if (!categoryExists) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const tree = await subcategoryService.getTree(categoryId, lang);
    const formattedTree = (tree || []).map(s => formatSubcategory(s, lang));

    return successResponse(res, formattedTree, 'Subcategory tree retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get root subcategories (no parent) for a category
 */
const getRoots = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { lang = 'en' } = req.query;

    const categoryExists = await subcategoryService.checkCategoryExists(categoryId);
    if (!categoryExists) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const roots = await subcategoryService.getRoots(categoryId, lang);
    const formattedRoots = (roots || []).map(s => formatSubcategory(s, lang));

    return successResponse(res, formattedRoots, 'Root subcategories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get parent chain (breadcrumbs) for a subcategory
 */
const getParentChain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const existingSubcategory = await subcategoryService.getById(id);
    if (!existingSubcategory) {
      return errorResponse(res, 'Subcategory not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const chain = await subcategoryService.getParentChain(id, lang);
    const formattedChain = (chain || []).map(s => formatSubcategory(s, lang));

    return successResponse(res, formattedChain, 'Parent chain retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getAllList,
  getById,
  getByCategory,
  create,
  update,
  remove,
  toggleStatus,
  toggleFeatured,
  updateImage,
  removeImage,
  updateDisplayOrder,
  getStatistics,
  getSubcategoryWithProducts,
  getFeatured,
  bulkUpdate,
  bulkDelete,
  exportToExcel,
  importFromExcel,
  moveToCategory,
  search,
  duplicate,
  getProductCount,
  // Nested subcategory support
  getChildren,
  getTree,
  getRoots,
  getParentChain,
};