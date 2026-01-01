/**
 * Product Controller
 * @module controllers/product
 * 
 * FIXED ISSUES:
 * 1. Accepts both camelCase and snake_case field names
 * 2. Response includes both naming conventions for compatibility
 * 3. Pagination response standardized (items array + pagination object)
 * 4. Multi-language field handling improved
 */

const productService = require('../services/product.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Helper: Format product for response (includes both naming conventions)
 */
const formatProduct = (product, lang = 'en') => {
  if (!product) return null;
  
  return {
    // IDs
    id: product.product_id || product.id,
    productId: product.product_id || product.id,
    product_id: product.product_id || product.id,
    
    // Names - all languages
    name: product[`product_name_${lang}`] || product.product_name_en || product.name,
    productName: product[`product_name_${lang}`] || product.product_name_en,
    product_name: product[`product_name_${lang}`] || product.product_name_en,
    nameEn: product.product_name_en,
    nameAr: product.product_name_ar,
    nameHe: product.product_name_he,
    product_name_en: product.product_name_en,
    product_name_ar: product.product_name_ar,
    product_name_he: product.product_name_he,
    
    // Descriptions - all languages
    description: product[`product_description_${lang}`] || product.product_description_en || product.description,
    productDescription: product[`product_description_${lang}`] || product.product_description_en,
    product_description: product[`product_description_${lang}`] || product.product_description_en,
    descriptionEn: product.product_description_en,
    descriptionAr: product.product_description_ar,
    descriptionHe: product.product_description_he,
    product_description_en: product.product_description_en,
    product_description_ar: product.product_description_ar,
    product_description_he: product.product_description_he,
    
    // Pricing
    sku: product.sku,
    price: parseFloat(product.price) || 0,
    discountPercentage: parseFloat(product.discount_percentage) || 0,
    discount_percentage: parseFloat(product.discount_percentage) || 0,
    discountedPrice: product.discount_percentage > 0 
      ? parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)
      : parseFloat(product.price),
    discounted_price: product.discount_percentage > 0 
      ? parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)
      : parseFloat(product.price),
    
    // Stock
    stockQuantity: parseInt(product.stock_quantity) || 0,
    stock_quantity: parseInt(product.stock_quantity) || 0,
    inStock: (parseInt(product.stock_quantity) || 0) > 0,
    in_stock: (parseInt(product.stock_quantity) || 0) > 0,
    
    // Category
    categoryId: product.category_id,
    category_id: product.category_id,
    categoryName: product.category_name || product[`category_name_${lang}`],
    category_name: product.category_name || product[`category_name_${lang}`],
    subcategoryId: product.subcategory_id,
    subcategory_id: product.subcategory_id,
    subcategoryName: product.subcategory_name || product[`subcategory_name_${lang}`],
    subcategory_name: product.subcategory_name || product[`subcategory_name_${lang}`],
    
    // Status flags
    isActive: product.is_active === 1 || product.is_active === true,
    is_active: product.is_active === 1 || product.is_active === true,
    isFeatured: product.is_featured === 1 || product.is_featured === true,
    is_featured: product.is_featured === 1 || product.is_featured === true,
    
    // Images
    images: product.images || [],
    primaryImage: product.primary_image || (product.images && product.images[0]?.image_url) || null,
    primary_image: product.primary_image || (product.images && product.images[0]?.image_url) || null,
    
    // Relations
    colors: product.colors || [],
    sizes: product.sizes || [],
    variants: product.variants || [],
    
    // SEO
    metaTitle: product.meta_title,
    meta_title: product.meta_title,
    metaDescription: product.meta_description,
    meta_description: product.meta_description,
    metaKeywords: product.meta_keywords,
    meta_keywords: product.meta_keywords,
    
    // Statistics
    reviewCount: product.review_count || 0,
    review_count: product.review_count || 0,
    averageRating: parseFloat(product.average_rating) || 0,
    average_rating: parseFloat(product.average_rating) || 0,
    totalSold: product.total_sold || 0,
    total_sold: product.total_sold || 0,
    
    // Timestamps
    createdAt: product.created_at,
    created_at: product.created_at,
    updatedAt: product.updated_at,
    updated_at: product.updated_at,
    createdBy: product.created_by,
    created_by: product.created_by,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result, lang = 'en') => {
  const items = (result.items || result.data || result.products || []).map(p => formatProduct(p, lang));
  
  return {
    items: items,
    data: items, // Alias
    products: items, // Alias
    pagination: {
      page: result.page || result.pagination?.page || 1,
      limit: result.limit || result.pagination?.limit || 10,
      total: result.total || result.pagination?.total || items.length,
      totalPages: result.totalPages || result.pagination?.totalPages || Math.ceil((result.total || items.length) / (result.limit || 10)),
      hasMore: result.hasMore || result.pagination?.hasMore || false,
    },
    // Also include at root level for compatibility
    page: result.page || result.pagination?.page || 1,
    limit: result.limit || result.pagination?.limit || 10,
    total: result.total || result.pagination?.total || items.length,
    totalPages: result.totalPages || result.pagination?.totalPages || 1,
  };
};

/**
 * Get all products
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category_id, categoryId,
      subcategory_id, subcategoryId,
      is_active, isActive,
      is_featured, isFeatured,
      in_stock, inStock,
      min_price, minPrice,
      max_price, maxPrice,
      color_id, colorId,
      size_id, sizeId,
      sort = 'created_at',
      order = 'DESC',
      lang = 'en',
      sortBy, sort_by,
      sortOrder, sort_order,
    } = req.query;

    const result = await productService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category_id: parseInt(category_id || categoryId) || undefined,
      subcategory_id: parseInt(subcategory_id || subcategoryId) || undefined,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      is_featured: (is_featured ?? isFeatured) !== undefined ? (is_featured || isFeatured) === 'true' : undefined,
      in_stock: (in_stock ?? inStock) !== undefined ? (in_stock || inStock) === 'true' : undefined,
      min_price: parseFloat(min_price || minPrice) || undefined,
      max_price: parseFloat(max_price || maxPrice) || undefined,
      color_id: parseInt(color_id || colorId) || undefined,
      size_id: parseInt(size_id || sizeId) || undefined,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
      lang,
    });

    const formattedResult = formatPaginationResponse(result, lang);
    return successResponse(res, formattedResult, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const product = await productService.getById(id, lang);

    if (!product) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, formatProduct(product, lang));
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by SKU
 */
const getBySku = async (req, res, next) => {
  try {
    const { sku } = req.params;
    const { lang = 'en' } = req.query;

    const product = await productService.getBySku(sku, lang);

    if (!product) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, formatProduct(product, lang));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product
 */
const create = async (req, res, next) => {
  try {
    // Accept both camelCase and snake_case
    const {
      product_name_en, productNameEn, nameEn,
      product_name_ar, productNameAr, nameAr,
      product_name_he, productNameHe, nameHe,
      product_description_en, productDescriptionEn, descriptionEn,
      product_description_ar, productDescriptionAr, descriptionAr,
      product_description_he, productDescriptionHe, descriptionHe,
      sku,
      price,
      discount_percentage, discountPercentage,
      stock_quantity, stockQuantity,
      category_id, categoryId,
      subcategory_id, subcategoryId,
      is_featured, isFeatured,
      is_active, isActive,
      colors,
      sizes,
      variants,
      meta_title, metaTitle,
      meta_description, metaDescription,
      meta_keywords, metaKeywords,
    } = req.body;

    // Resolve field values (prefer snake_case, fallback to camelCase)
    const nameEN = product_name_en || productNameEn || nameEn;
    const nameAR = product_name_ar || productNameAr || nameAr;
    const nameHE = product_name_he || productNameHe || nameHe;

    // Validate required fields
    if (!nameEN || !nameAR || !nameHE) {
      return errorResponse(
        res,
        'Product name is required in all languages (EN, AR, HE)',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    if (!price || price <= 0) {
      return errorResponse(
        res,
        'Valid price is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const catId = category_id || categoryId;
    if (!catId) {
      return errorResponse(
        res,
        'Category is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if SKU already exists
    if (sku) {
      const existingSku = await productService.findBySku(sku);
      if (existingSku) {
        return errorResponse(
          res,
          'Product with this SKU already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file, index) => ({
        image_url: `uploads/products/${file.filename}`,
        is_primary: index === 0,
        display_order: index,
      }));
    }

    // Parse arrays if they come as strings
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    };

    const product = await productService.create({
      product_name_en: nameEN,
      product_name_ar: nameAR,
      product_name_he: nameHE,
      product_description_en: product_description_en || productDescriptionEn || descriptionEn,
      product_description_ar: product_description_ar || productDescriptionAr || descriptionAr,
      product_description_he: product_description_he || productDescriptionHe || descriptionHe,
      sku,
      price: parseFloat(price),
      discount_percentage: parseFloat(discount_percentage || discountPercentage) || 0,
      stock_quantity: parseInt(stock_quantity || stockQuantity) || 0,
      category_id: parseInt(catId),
      subcategory_id: parseInt(subcategory_id || subcategoryId) || null,
      is_featured: (is_featured ?? isFeatured) === 'true' || (is_featured ?? isFeatured) === true,
      is_active: (is_active ?? isActive) !== 'false' && (is_active ?? isActive) !== false,
      colors: parseArray(colors),
      sizes: parseArray(sizes),
      variants: parseArray(variants),
      images,
      meta_title: meta_title || metaTitle,
      meta_description: meta_description || metaDescription,
      meta_keywords: meta_keywords || metaKeywords,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatProduct(product), 'Product created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update product
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      product_name_en, productNameEn, nameEn,
      product_name_ar, productNameAr, nameAr,
      product_name_he, productNameHe, nameHe,
      product_description_en, productDescriptionEn, descriptionEn,
      product_description_ar, productDescriptionAr, descriptionAr,
      product_description_he, productDescriptionHe, descriptionHe,
      sku,
      price,
      discount_percentage, discountPercentage,
      stock_quantity, stockQuantity,
      category_id, categoryId,
      subcategory_id, subcategoryId,
      is_featured, isFeatured,
      is_active, isActive,
      colors,
      sizes,
      meta_title, metaTitle,
      meta_description, metaDescription,
      meta_keywords, metaKeywords,
    } = req.body;

    // Check if product exists
    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if new SKU already exists (if changing SKU)
    const newSku = sku;
    if (newSku && newSku !== existingProduct.sku) {
      const existingSku = await productService.findBySku(newSku);
      if (existingSku && existingSku.product_id !== parseInt(id)) {
        return errorResponse(
          res,
          'Product with this SKU already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    const parseArray = (val) => {
      if (val === undefined) return undefined;
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    };

    const parseBool = (val) => {
      if (val === undefined) return undefined;
      return val === 'true' || val === true;
    };

    const updateData = {};
    
    // Name fields
    const nameEN = product_name_en ?? productNameEn ?? nameEn;
    const nameAR = product_name_ar ?? productNameAr ?? nameAr;
    const nameHE = product_name_he ?? productNameHe ?? nameHe;
    if (nameEN !== undefined) updateData.product_name_en = nameEN;
    if (nameAR !== undefined) updateData.product_name_ar = nameAR;
    if (nameHE !== undefined) updateData.product_name_he = nameHE;
    
    // Description fields
    const descEN = product_description_en ?? productDescriptionEn ?? descriptionEn;
    const descAR = product_description_ar ?? productDescriptionAr ?? descriptionAr;
    const descHE = product_description_he ?? productDescriptionHe ?? descriptionHe;
    if (descEN !== undefined) updateData.product_description_en = descEN;
    if (descAR !== undefined) updateData.product_description_ar = descAR;
    if (descHE !== undefined) updateData.product_description_he = descHE;
    
    // Other fields
    if (newSku !== undefined) updateData.sku = newSku;
    if (price !== undefined) updateData.price = parseFloat(price);
    
    const discount = discount_percentage ?? discountPercentage;
    if (discount !== undefined) updateData.discount_percentage = parseFloat(discount);
    
    const stock = stock_quantity ?? stockQuantity;
    if (stock !== undefined) updateData.stock_quantity = parseInt(stock);
    
    const catId = category_id ?? categoryId;
    if (catId !== undefined) updateData.category_id = parseInt(catId);
    
    const subCatId = subcategory_id ?? subcategoryId;
    if (subCatId !== undefined) updateData.subcategory_id = subCatId ? parseInt(subCatId) : null;
    
    const featured = is_featured ?? isFeatured;
    if (featured !== undefined) updateData.is_featured = parseBool(featured);
    
    const active = is_active ?? isActive;
    if (active !== undefined) updateData.is_active = parseBool(active);
    
    const parsedColors = parseArray(colors);
    if (parsedColors !== undefined) updateData.colors = parsedColors;
    
    const parsedSizes = parseArray(sizes);
    if (parsedSizes !== undefined) updateData.sizes = parsedSizes;
    
    // Meta fields
    const mTitle = meta_title ?? metaTitle;
    const mDesc = meta_description ?? metaDescription;
    const mKeywords = meta_keywords ?? metaKeywords;
    if (mTitle !== undefined) updateData.meta_title = mTitle;
    if (mDesc !== undefined) updateData.meta_description = mDesc;
    if (mKeywords !== undefined) updateData.meta_keywords = mKeywords;

    updateData.updated_by = req.admin?.adminId;

    const product = await productService.update(id, updateData);

    return successResponse(res, formatProduct(product), 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Check if product has orders
    const hasOrders = await productService.hasOrders(id);
    if (hasOrders) {
      return errorResponse(
        res,
        'Cannot delete product with existing orders. Consider deactivating instead.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await productService.remove(id);

    return successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle product active status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const newStatus = !existingProduct.is_active;
    const product = await productService.update(id, {
      is_active: newStatus,
      updated_by: req.admin?.adminId,
    });

    return successResponse(
      res,
      formatProduct(product),
      `Product ${newStatus ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle product featured status
 */
const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const newStatus = !existingProduct.is_featured;
    const product = await productService.update(id, {
      is_featured: newStatus,
      updated_by: req.admin?.adminId,
    });

    return successResponse(
      res,
      formatProduct(product),
      `Product ${newStatus ? 'marked as featured' : 'removed from featured'}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update product stock
 */
const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock_quantity, stockQuantity, operation = 'set' } = req.body;

    const quantity = parseInt(stock_quantity ?? stockQuantity);
    
    if (isNaN(quantity)) {
      return errorResponse(
        res,
        'Valid stock quantity is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = existingProduct.stock_quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, existingProduct.stock_quantity - quantity);
        break;
      default:
        newQuantity = quantity;
    }

    const product = await productService.update(id, {
      stock_quantity: newQuantity,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatProduct(product), 'Stock updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update stock
 */
const bulkUpdateStock = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(
        res,
        'Items array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await productService.bulkUpdateStock(items, req.admin?.adminId);

    return successResponse(res, result, `${result.updated} products stock updated`);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload product images
 */
const uploadImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (!req.files || req.files.length === 0) {
      return errorResponse(
        res,
        'At least one image is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const images = req.files.map((file, index) => ({
      image_url: `uploads/products/${file.filename}`,
      is_primary: existingProduct.images?.length === 0 && index === 0,
      display_order: (existingProduct.images?.length || 0) + index,
    }));

    const result = await productService.addImages(id, images);

    return successResponse(res, result, 'Images uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product images
 */
const getImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const images = await productService.getImages(id);

    return successResponse(res, images, 'Images retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product image
 */
const deleteImage = async (req, res, next) => {
  try {
    const { id, imageId, image_id } = req.params;
    const imgId = imageId || image_id;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    await productService.deleteImage(id, imgId);

    return successResponse(res, null, 'Image deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Set primary image
 */
const setPrimaryImage = async (req, res, next) => {
  try {
    const { id, imageId, image_id } = req.params;
    const imgId = imageId || image_id || req.body.imageId || req.body.image_id;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    await productService.setPrimaryImage(id, imgId);

    return successResponse(res, null, 'Primary image set successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update images order
 */
const updateImagesOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, imageOrder } = req.body;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    await productService.updateImagesOrder(id, order || imageOrder);

    return successResponse(res, null, 'Images order updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product colors
 */
const getColors = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const colors = await productService.getColors(id);

    return successResponse(res, colors, 'Colors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update product colors
 */
const updateColors = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { colors, color_ids, colorIds } = req.body;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const colorData = colors || color_ids || colorIds;
    await productService.updateColors(id, colorData);

    return successResponse(res, null, 'Colors updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product sizes
 */
const getSizes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const sizes = await productService.getSizes(id);

    return successResponse(res, sizes, 'Sizes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update product sizes
 */
const updateSizes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sizes, size_ids, sizeIds } = req.body;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const sizeData = sizes || size_ids || sizeIds;
    await productService.updateSizes(id, sizeData);

    return successResponse(res, null, 'Sizes updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product variants
 */
const getVariants = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const variants = await productService.getVariants(id);

    return successResponse(res, variants, 'Variants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create product variant
 */
const createVariant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const variant = await productService.createVariant(id, req.body);

    return successResponse(res, variant, 'Variant created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update product variant
 */
const updateVariant = async (req, res, next) => {
  try {
    const { id, variantId, variant_id } = req.params;
    const vId = variantId || variant_id;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const variant = await productService.updateVariant(vId, req.body);

    return successResponse(res, variant, 'Variant updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product variant
 */
const deleteVariant = async (req, res, next) => {
  try {
    const { id, variantId, variant_id } = req.params;
    const vId = variantId || variant_id;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    await productService.deleteVariant(vId);

    return successResponse(res, null, 'Variant deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product reviews
 */
const getReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const result = await productService.getReviews(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });

    return successResponse(res, result, 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await productService.getStatistics();
    
    // Format statistics with both naming conventions
    const formattedStats = {
      total: stats.total,
      totalProducts: stats.total,
      total_products: stats.total,
      active: stats.active,
      activeProducts: stats.active,
      active_products: stats.active,
      inactive: stats.inactive,
      inactiveProducts: stats.inactive,
      inactive_products: stats.inactive,
      featured: stats.featured,
      featuredProducts: stats.featured,
      featured_products: stats.featured,
      outOfStock: stats.out_of_stock || stats.outOfStock,
      out_of_stock: stats.out_of_stock || stats.outOfStock,
      lowStock: stats.low_stock || stats.lowStock,
      low_stock: stats.low_stock || stats.lowStock,
      totalValue: stats.total_value || stats.totalValue,
      total_value: stats.total_value || stats.totalValue,
    };
    
    return successResponse(res, formattedStats, 'Product statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products
 */
const getLowStock = async (req, res, next) => {
  try {
    const { threshold = 10, page = 1, limit = 10, lang = 'en' } = req.query;

    const result = await productService.getLowStock({
      threshold: parseInt(threshold),
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    const formattedResult = formatPaginationResponse(result, lang);
    return successResponse(res, formattedResult, 'Low stock products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get out of stock products
 */
const getOutOfStock = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, lang = 'en' } = req.query;

    const result = await productService.getOutOfStock({
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    const formattedResult = formatPaginationResponse(result, lang);
    return successResponse(res, formattedResult, 'Out of stock products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured products
 */
const getFeatured = async (req, res, next) => {
  try {
    const { limit = 10, lang = 'en' } = req.query;

    const products = await productService.getFeatured({
      limit: parseInt(limit),
      lang,
    });

    const formattedProducts = (products || []).map(p => formatProduct(p, lang));
    return successResponse(res, formattedProducts, 'Featured products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update products
 */
const bulkUpdate = async (req, res, next) => {
  try {
    const { product_ids, productIds, ids, updates } = req.body;
    const productIdList = product_ids || productIds || ids;

    if (!productIdList || !Array.isArray(productIdList) || productIdList.length === 0) {
      return errorResponse(
        res,
        'Product IDs array is required',
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

    const result = await productService.bulkUpdate(productIdList, updates, req.admin?.adminId);

    return successResponse(res, result, `${result.updated} products updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete products
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { product_ids, productIds, ids } = req.body;
    const productIdList = product_ids || productIds || ids;

    if (!productIdList || !Array.isArray(productIdList) || productIdList.length === 0) {
      return errorResponse(
        res,
        'Product IDs array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if any product has orders
    for (const id of productIdList) {
      const hasOrders = await productService.hasOrders(id);
      if (hasOrders) {
        return errorResponse(
          res,
          `Product ${id} has existing orders. Cannot delete.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    const result = await productService.bulkDelete(productIdList);

    return successResponse(res, result, `${result.deleted} products deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Export products to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { category_id, categoryId, is_active, isActive, is_featured, isFeatured } = req.query;

    const excelBuffer = await productService.exportToExcel({
      category_id: parseInt(category_id || categoryId) || undefined,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      is_featured: (is_featured ?? isFeatured) !== undefined ? (is_featured || isFeatured) === 'true' : undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Import products from Excel
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

    const result = await productService.importFromExcel(req.file.path, req.admin?.adminId);

    return successResponse(res, result, `Import completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate product
 */
const duplicate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const newProduct = await productService.duplicate(id, req.admin?.adminId);

    return successResponse(res, formatProduct(newProduct), 'Product duplicated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Search products
 */
const search = async (req, res, next) => {
  try {
    const { q, query, page = 1, limit = 10, lang = 'en' } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return errorResponse(
        res,
        'Search query is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await productService.search({
      query: searchQuery,
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    const formattedResult = formatPaginationResponse(result, lang);
    return successResponse(res, formattedResult, 'Search results retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get related products
 */
const getRelated = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 8, lang = 'en' } = req.query;

    const existingProduct = await productService.getById(id);
    if (!existingProduct) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const products = await productService.getRelated(id, {
      limit: parseInt(limit),
      lang,
    });

    const formattedProducts = (products || []).map(p => formatProduct(p, lang));
    return successResponse(res, formattedProducts, 'Related products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getBySku,
  create,
  update,
  remove,
  toggleStatus,
  toggleFeatured,
  updateStock,
  bulkUpdateStock,
  uploadImages,
  getImages,
  deleteImage,
  setPrimaryImage,
  updateImagesOrder,
  getColors,
  updateColors,
  getSizes,
  updateSizes,
  getVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  getReviews,
  getStatistics,
  getLowStock,
  getOutOfStock,
  getFeatured,
  bulkUpdate,
  bulkDelete,
  exportToExcel,
  importFromExcel,
  duplicate,
  search,
  getRelated,
};