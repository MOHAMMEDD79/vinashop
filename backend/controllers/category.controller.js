/**
 * Category Controller
 * @module controllers/category
 * 
 * FIXED: Accepts both camelCase and snake_case, responses include both formats
 */

const categoryService = require('../services/category.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Helper: Format category for response
 */
const formatCategory = (category, lang = 'en') => {
  if (!category) return null;

  return {
    id: category.category_id || category.id,
    categoryId: category.category_id || category.id,
    category_id: category.category_id || category.id,
    
    name: category[`category_name_${lang}`] || category.category_name_en || category.name,
    categoryName: category[`category_name_${lang}`] || category.category_name_en,
    category_name: category[`category_name_${lang}`] || category.category_name_en,
    nameEn: category.category_name_en,
    nameAr: category.category_name_ar,
    nameHe: category.category_name_he,
    category_name_en: category.category_name_en,
    category_name_ar: category.category_name_ar,
    category_name_he: category.category_name_he,
    
    description: category[`category_description_${lang}`] || category.category_description_en,
    categoryDescription: category[`category_description_${lang}`] || category.category_description_en,
    category_description: category[`category_description_${lang}`] || category.category_description_en,
    descriptionEn: category.category_description_en,
    descriptionAr: category.category_description_ar,
    descriptionHe: category.category_description_he,
    category_description_en: category.category_description_en,
    category_description_ar: category.category_description_ar,
    category_description_he: category.category_description_he,
    
    image: category.category_image,
    categoryImage: category.category_image,
    category_image: category.category_image,
    
    displayOrder: category.display_order || 0,
    display_order: category.display_order || 0,
    
    isActive: category.is_active === 1 || category.is_active === true,
    is_active: category.is_active === 1 || category.is_active === true,
    isFeatured: category.is_featured === 1 || category.is_featured === true,
    is_featured: category.is_featured === 1 || category.is_featured === true,
    
    productCount: category.product_count || 0,
    product_count: category.product_count || 0,
    subcategoryCount: category.subcategory_count || 0,
    subcategory_count: category.subcategory_count || 0,
    
    subcategories: category.subcategories || [],
    
    createdAt: category.created_at,
    created_at: category.created_at,
    updatedAt: category.updated_at,
    updated_at: category.updated_at,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result, lang = 'en') => {
  const items = (result.items || result.data || result.categories || []).map(c => formatCategory(c, lang));
  return {
    items,
    data: items,
    categories: items,
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
 * Get all categories
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search,
      is_active, isActive, is_featured, isFeatured,
      sort = 'display_order', order = 'ASC',
      sortBy, sort_by, sortOrder, sort_order,
      lang = 'en',
    } = req.query;

    const result = await categoryService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      is_featured: (is_featured ?? isFeatured) !== undefined ? (is_featured || isFeatured) === 'true' : undefined,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
      lang,
    });

    return successResponse(res, formatPaginationResponse(result, lang), 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories (no pagination - for dropdowns)
 */
const getAllList = async (req, res, next) => {
  try {
    const { is_active, isActive, lang = 'en' } = req.query;
    const active = is_active ?? isActive;

    const categories = await categoryService.getAllList({
      is_active: active === 'true' || active === true || active === undefined,
      lang,
    });

    const formattedCategories = (categories || []).map(c => formatCategory(c, lang));
    return successResponse(res, formattedCategories, 'Categories list retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get category tree with subcategories
 */
const getTree = async (req, res, next) => {
  try {
    const { lang = 'en', is_active, isActive } = req.query;
    const active = is_active ?? isActive;

    const categories = await categoryService.getAllList({
      is_active: active !== undefined ? active === 'true' : true,
      lang,
    });

    const tree = [];
    for (const category of categories) {
      const subcategories = await categoryService.getCategorySubcategories(category.category_id, lang);
      const formattedCategory = formatCategory(category, lang);
      formattedCategory.subcategories = subcategories || [];
      tree.push(formattedCategory);
    }

    return successResponse(res, tree, 'Category tree retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search categories
 */
const search = async (req, res, next) => {
  try {
    const { q, query, lang = 'en', limit = 20 } = req.query;
    const searchTerm = q || query || '';

    if (!searchTerm || searchTerm.trim().length < 1) {
      return successResponse(res, [], 'Search term required');
    }

    const result = await categoryService.getAll({
      page: 1,
      limit: parseInt(limit),
      search: searchTerm.trim(),
      lang,
    });

    const formattedResults = (result.data || result.items || []).map(c => formatCategory(c, lang));
    return successResponse(res, formattedResults, 'Categories search completed');
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const category = await categoryService.getById(id, lang);

    if (!category) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatCategory(category, lang));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category
 */
const create = async (req, res, next) => {
  try {
    const {
      category_name_en, categoryNameEn, nameEn,
      category_name_ar, categoryNameAr, nameAr,
      category_name_he, categoryNameHe, nameHe,
      category_description_en, categoryDescriptionEn, descriptionEn,
      category_description_ar, categoryDescriptionAr, descriptionAr,
      category_description_he, categoryDescriptionHe, descriptionHe,
      display_order, displayOrder,
      is_featured, isFeatured,
      is_active, isActive,
    } = req.body;

    const nameEN = category_name_en || categoryNameEn || nameEn;
    const nameAR = category_name_ar || categoryNameAr || nameAr;
    const nameHE = category_name_he || categoryNameHe || nameHe;

    if (!nameEN || !nameAR || !nameHE) {
      return errorResponse(res, 'Category name is required in all languages (EN, AR, HE)', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const existingCategory = await categoryService.findByName(nameEN, 'en');
    if (existingCategory) {
      return errorResponse(res, 'Category with this name already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    let category_image = null;
    if (req.file) {
      category_image = `uploads/categories/${req.file.filename}`;
    }

    const category = await categoryService.create({
      category_name_en: nameEN,
      category_name_ar: nameAR,
      category_name_he: nameHE,
      category_description_en: category_description_en || categoryDescriptionEn || descriptionEn,
      category_description_ar: category_description_ar || categoryDescriptionAr || descriptionAr,
      category_description_he: category_description_he || categoryDescriptionHe || descriptionHe,
      category_image,
      display_order: parseInt(display_order || displayOrder) || 0,
      is_featured: (is_featured ?? isFeatured) === 'true' || (is_featured ?? isFeatured) === true,
      is_active: (is_active ?? isActive) !== 'false' && (is_active ?? isActive) !== false,
    });

    return successResponse(res, formatCategory(category), 'Category created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      category_name_en, categoryNameEn, nameEn,
      category_name_ar, categoryNameAr, nameAr,
      category_name_he, categoryNameHe, nameHe,
      category_description_en, categoryDescriptionEn, descriptionEn,
      category_description_ar, categoryDescriptionAr, descriptionAr,
      category_description_he, categoryDescriptionHe, descriptionHe,
      display_order, displayOrder,
      is_featured, isFeatured,
      is_active, isActive,
    } = req.body;

    const existingCategory = await categoryService.getById(id);
    if (!existingCategory) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const nameEN = category_name_en ?? categoryNameEn ?? nameEn;
    if (nameEN && nameEN !== existingCategory.category_name_en) {
      const nameExists = await categoryService.findByName(nameEN, 'en');
      if (nameExists && nameExists.category_id !== parseInt(id)) {
        return errorResponse(res, 'Category with this name already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    let category_image = existingCategory.category_image;
    if (req.file) {
      category_image = `uploads/categories/${req.file.filename}`;
      if (existingCategory.category_image) {
        await categoryService.deleteImage(existingCategory.category_image);
      }
    }

    const updateData = {};
    if (nameEN !== undefined) updateData.category_name_en = nameEN;
    
    const nameAR = category_name_ar ?? categoryNameAr ?? nameAr;
    const nameHE = category_name_he ?? categoryNameHe ?? nameHe;
    if (nameAR !== undefined) updateData.category_name_ar = nameAR;
    if (nameHE !== undefined) updateData.category_name_he = nameHE;
    
    const descEN = category_description_en ?? categoryDescriptionEn ?? descriptionEn;
    const descAR = category_description_ar ?? categoryDescriptionAr ?? descriptionAr;
    const descHE = category_description_he ?? categoryDescriptionHe ?? descriptionHe;
    if (descEN !== undefined) updateData.category_description_en = descEN;
    if (descAR !== undefined) updateData.category_description_ar = descAR;
    if (descHE !== undefined) updateData.category_description_he = descHE;
    
    if (category_image !== existingCategory.category_image) updateData.category_image = category_image;
    
    const order = display_order ?? displayOrder;
    if (order !== undefined) updateData.display_order = parseInt(order);
    
    const featured = is_featured ?? isFeatured;
    const active = is_active ?? isActive;
    if (featured !== undefined) updateData.is_featured = featured === 'true' || featured === true;
    if (active !== undefined) updateData.is_active = active === 'true' || active === true;

    const category = await categoryService.update(id, updateData);

    return successResponse(res, formatCategory(category), 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await categoryService.getById(id);
    if (!existingCategory) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const productCount = await categoryService.getProductCount(id);
    if (productCount > 0) {
      return errorResponse(res, `Cannot delete category with ${productCount} products. Please move or delete products first.`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const subcategoryCount = await categoryService.getSubcategoryCount(id);
    if (subcategoryCount > 0) {
      return errorResponse(res, `Cannot delete category with ${subcategoryCount} subcategories. Please move or delete subcategories first.`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    if (existingCategory.category_image) {
      await categoryService.deleteImage(existingCategory.category_image);
    }

    await categoryService.remove(id);

    return successResponse(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle category status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await categoryService.getById(id);
    if (!existingCategory) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const newStatus = !existingCategory.is_active;
    const category = await categoryService.update(id, { is_active: newStatus });

    return successResponse(res, formatCategory(category), `Category ${newStatus ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle category featured
 */
const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await categoryService.getById(id);
    if (!existingCategory) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const newStatus = !existingCategory.is_featured;
    const category = await categoryService.update(id, { is_featured: newStatus });

    return successResponse(res, formatCategory(category), `Category ${newStatus ? 'marked as featured' : 'removed from featured'}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update category image
 */
const updateImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await categoryService.getById(id);
    if (!existingCategory) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!req.file) {
      return errorResponse(res, 'Image file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (existingCategory.category_image) {
      await categoryService.deleteImage(existingCategory.category_image);
    }

    const category_image = `uploads/categories/${req.file.filename}`;
    const category = await categoryService.update(id, { category_image });

    return successResponse(res, formatCategory(category), 'Category image updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove category image
 */
const removeImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await categoryService.getById(id);
    if (!existingCategory) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingCategory.category_image) {
      await categoryService.deleteImage(existingCategory.category_image);
    }

    const category = await categoryService.update(id, { category_image: null });

    return successResponse(res, formatCategory(category), 'Category image removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update category display order
 */
const updateDisplayOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { display_order, displayOrder } = req.body;
    const order = display_order ?? displayOrder;

    const existingCategory = await categoryService.getById(id);
    if (!existingCategory) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (order === undefined || isNaN(parseInt(order))) {
      return errorResponse(res, 'Valid display order is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const category = await categoryService.update(id, { display_order: parseInt(order) });

    return successResponse(res, formatCategory(category), 'Display order updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder categories
 */
const reorder = async (req, res, next) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return errorResponse(res, 'Categories array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    for (let i = 0; i < categories.length; i++) {
      const { id, category_id, categoryId, display_order, displayOrder } = categories[i];
      const catId = id || category_id || categoryId;
      const order = display_order ?? displayOrder ?? i;
      if (catId) {
        await categoryService.update(catId, { display_order: order });
      }
    }

    return successResponse(res, null, 'Categories reordered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate category
 */
const duplicate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const originalCategory = await categoryService.getById(id);
    if (!originalCategory) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const duplicateData = {
      category_name_en: `${originalCategory.category_name_en} (Copy)`,
      category_name_ar: `${originalCategory.category_name_ar} (نسخة)`,
      category_name_he: `${originalCategory.category_name_he} (העתק)`,
      category_description_en: originalCategory.category_description_en,
      category_description_ar: originalCategory.category_description_ar,
      category_description_he: originalCategory.category_description_he,
      category_image: originalCategory.category_image,
      display_order: originalCategory.display_order + 1,
      is_featured: false,
      is_active: false,
    };

    const newCategory = await categoryService.create(duplicateData);

    return successResponse(res, formatCategory(newCategory), 'Category duplicated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get category statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await categoryService.getStatistics();
    
    const formattedStats = {
      total: stats.total || 0,
      totalCategories: stats.total || 0,
      total_categories: stats.total || 0,
      active: stats.active || 0,
      activeCategories: stats.active || 0,
      active_categories: stats.active || 0,
      inactive: stats.inactive || 0,
      featured: stats.featured || 0,
      featuredCategories: stats.featured || 0,
      featured_categories: stats.featured || 0,
      withProducts: stats.with_products || stats.withProducts || 0,
      with_products: stats.with_products || stats.withProducts || 0,
      empty: stats.empty || 0,
      emptyCategories: stats.empty || 0,
      empty_categories: stats.empty || 0,
    };
    
    return successResponse(res, formattedStats, 'Category statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get category with products
 */
const getCategoryWithProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, lang = 'en' } = req.query;

    const category = await categoryService.getById(id, lang);
    if (!category) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const products = await categoryService.getCategoryProducts(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, {
      category: formatCategory(category, lang),
      products,
    }, 'Category with products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get category with subcategories
 */
const getCategoryWithSubcategories = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const category = await categoryService.getById(id, lang);
    if (!category) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const subcategories = await categoryService.getCategorySubcategories(id, lang);

    return successResponse(res, {
      category: formatCategory(category, lang),
      subcategories,
    }, 'Category with subcategories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured categories
 */
const getFeatured = async (req, res, next) => {
  try {
    const { limit = 10, lang = 'en' } = req.query;

    const categories = await categoryService.getFeatured({
      limit: parseInt(limit),
      lang,
    });

    const formattedCategories = (categories || []).map(c => formatCategory(c, lang));
    return successResponse(res, formattedCategories, 'Featured categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update categories
 */
const bulkUpdate = async (req, res, next) => {
  try {
    const { category_ids, categoryIds, ids, updates } = req.body;
    const idList = category_ids || categoryIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Category IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (!updates || Object.keys(updates).length === 0) {
      return errorResponse(res, 'Updates object is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await categoryService.bulkUpdate(idList, updates);

    return successResponse(res, result, `${result.updated} categories updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete categories
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { category_ids, categoryIds, ids } = req.body;
    const idList = category_ids || categoryIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Category IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    for (const id of idList) {
      const productCount = await categoryService.getProductCount(id);
      if (productCount > 0) {
        return errorResponse(res, `Category ${id} has ${productCount} products. Cannot delete.`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      const subcategoryCount = await categoryService.getSubcategoryCount(id);
      if (subcategoryCount > 0) {
        return errorResponse(res, `Category ${id} has ${subcategoryCount} subcategories. Cannot delete.`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }
    }

    const result = await categoryService.bulkDelete(idList);

    return successResponse(res, result, `${result.deleted} categories deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Export categories to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { is_active, isActive, is_featured, isFeatured } = req.query;

    const excelBuffer = await categoryService.exportToExcel({
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      is_featured: (is_featured ?? isFeatured) !== undefined ? (is_featured || isFeatured) === 'true' : undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Import categories from Excel
 */
const importFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Excel file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await categoryService.importFromExcel(req.file.path);

    return successResponse(res, result, `Import completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getAllList,
  getById,
  getTree,
  search,
  create,
  update,
  remove,
  toggleStatus,
  toggleFeatured,
  updateImage,
  removeImage,
  updateDisplayOrder,
  reorder,
  duplicate,
  getStatistics,
  getCategoryWithProducts,
  getCategoryWithSubcategories,
  getFeatured,
  bulkUpdate,
  bulkDelete,
  exportToExcel,
  importFromExcel,
};