/**
 * Image Controller
 * @module controllers/image
 */

const imageService = require('../services/image.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Get all product images
 */
const getProductImages = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const images = await imageService.getProductImages(product_id);

    return successResponse(res, images, 'Product images retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get image by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const image = await imageService.getById(id);

    if (!image) {
      return errorResponse(
        res,
        'Image not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, image);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload single image for product
 */
const uploadProductImage = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const { is_primary = false, display_order = 0, alt_text } = req.body;

    if (!req.file) {
      return errorResponse(
        res,
        'No image file uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if product exists
    const productExists = await imageService.checkProductExists(product_id);
    if (!productExists) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const imagePath = `uploads/products/${req.file.filename}`;

    const image = await imageService.createProductImage({
      product_id,
      image_url: imagePath,
      is_primary: is_primary === 'true' || is_primary === true,
      display_order: parseInt(display_order),
      alt_text,
    });

    return successResponse(res, image, 'Image uploaded successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple images for product
 */
const uploadMultipleProductImages = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    if (!req.files || req.files.length === 0) {
      return errorResponse(
        res,
        'No image files uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Check if product exists
    const productExists = await imageService.checkProductExists(product_id);
    if (!productExists) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const images = [];
    let displayOrder = await imageService.getNextDisplayOrder(product_id);

    for (const file of req.files) {
      const imagePath = `uploads/products/${file.filename}`;
      
      const image = await imageService.createProductImage({
        product_id,
        image_url: imagePath,
        is_primary: false,
        display_order: displayOrder++,
      });
      
      images.push(image);
    }

    return successResponse(res, images, `${images.length} images uploaded successfully`, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update image
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_primary, display_order, alt_text } = req.body;

    // Check if image exists
    const existingImage = await imageService.getById(id);
    if (!existingImage) {
      return errorResponse(
        res,
        'Image not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const updateData = {};
    if (is_primary !== undefined) updateData.is_primary = is_primary === 'true' || is_primary === true;
    if (display_order !== undefined) updateData.display_order = parseInt(display_order);
    if (alt_text !== undefined) updateData.alt_text = alt_text;

    const image = await imageService.update(id, updateData);

    return successResponse(res, image, 'Image updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete image
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if image exists
    const existingImage = await imageService.getById(id);
    if (!existingImage) {
      return errorResponse(
        res,
        'Image not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Delete the physical file
    await imageService.deleteFile(existingImage.image_url);

    // Delete from database
    await imageService.remove(id);

    return successResponse(res, null, 'Image deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Set image as primary
 */
const setPrimary = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if image exists
    const existingImage = await imageService.getById(id);
    if (!existingImage) {
      return errorResponse(
        res,
        'Image not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const image = await imageService.setPrimary(id, existingImage.product_id);

    return successResponse(res, image, 'Image set as primary successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update images display order
 */
const updateDisplayOrder = async (req, res, next) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return errorResponse(
        res,
        'Images array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    await imageService.updateDisplayOrder(images);

    return successResponse(res, null, 'Display order updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all images for a product
 */
const deleteProductImages = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    // Check if product exists
    const productExists = await imageService.checkProductExists(product_id);
    if (!productExists) {
      return errorResponse(
        res,
        'Product not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const deletedCount = await imageService.deleteProductImages(product_id);

    return successResponse(res, { deleted: deletedCount }, `${deletedCount} images deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Replace image
 */
const replaceImage = async (req, res, next) => {
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

    // Check if image exists
    const existingImage = await imageService.getById(id);
    if (!existingImage) {
      return errorResponse(
        res,
        'Image not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Delete old file
    await imageService.deleteFile(existingImage.image_url);

    // Update with new file
    const newImagePath = `uploads/products/${req.file.filename}`;
    const image = await imageService.update(id, { image_url: newImagePath });

    return successResponse(res, image, 'Image replaced successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload category image
 */
const uploadCategoryImage = async (req, res, next) => {
  try {
    const { category_id } = req.params;

    if (!req.file) {
      return errorResponse(
        res,
        'No image file uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const imagePath = `uploads/categories/${req.file.filename}`;

    const result = await imageService.updateCategoryImage(category_id, imagePath);

    return successResponse(res, result, 'Category image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload subcategory image
 */
const uploadSubcategoryImage = async (req, res, next) => {
  try {
    const { subcategory_id } = req.params;

    if (!req.file) {
      return errorResponse(
        res,
        'No image file uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const imagePath = `uploads/subcategories/${req.file.filename}`;

    const result = await imageService.updateSubcategoryImage(subcategory_id, imagePath);

    return successResponse(res, result, 'Subcategory image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 */
const uploadUserAvatar = async (req, res, next) => {
  try {
    const { user_id } = req.params;

    if (!req.file) {
      return errorResponse(
        res,
        'No image file uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const imagePath = `uploads/users/${req.file.filename}`;

    const result = await imageService.updateUserAvatar(user_id, imagePath);

    return successResponse(res, result, 'User avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload banner image
 */
const uploadBannerImage = async (req, res, next) => {
  try {
    const { title, link, display_order = 0, is_active = true } = req.body;

    if (!req.file) {
      return errorResponse(
        res,
        'No image file uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const imagePath = `uploads/banners/${req.file.filename}`;

    const banner = await imageService.createBanner({
      image_url: imagePath,
      title,
      link,
      display_order: parseInt(display_order),
      is_active: is_active === 'true' || is_active === true,
    });

    return successResponse(res, banner, 'Banner created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all banners
 */
const getBanners = async (req, res, next) => {
  try {
    const { is_active } = req.query;

    const banners = await imageService.getBanners({
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
    });

    return successResponse(res, banners, 'Banners retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update banner
 */
const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, link, display_order, is_active } = req.body;

    // Check if banner exists
    const existingBanner = await imageService.getBannerById(id);
    if (!existingBanner) {
      return errorResponse(
        res,
        'Banner not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    let imagePath = existingBanner.image_url;
    if (req.file) {
      // Delete old image
      await imageService.deleteFile(existingBanner.image_url);
      imagePath = `uploads/banners/${req.file.filename}`;
    }

    const updateData = { image_url: imagePath };
    if (title !== undefined) updateData.title = title;
    if (link !== undefined) updateData.link = link;
    if (display_order !== undefined) updateData.display_order = parseInt(display_order);
    if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;

    const banner = await imageService.updateBanner(id, updateData);

    return successResponse(res, banner, 'Banner updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete banner
 */
const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if banner exists
    const existingBanner = await imageService.getBannerById(id);
    if (!existingBanner) {
      return errorResponse(
        res,
        'Banner not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Delete the physical file
    await imageService.deleteFile(existingBanner.image_url);

    // Delete from database
    await imageService.deleteBanner(id);

    return successResponse(res, null, 'Banner deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Optimize image
 */
const optimizeImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quality = 80, width, height } = req.body;

    // Check if image exists
    const existingImage = await imageService.getById(id);
    if (!existingImage) {
      return errorResponse(
        res,
        'Image not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const optimizedImage = await imageService.optimizeImage(existingImage.image_url, {
      quality: parseInt(quality),
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
    });

    return successResponse(res, optimizedImage, 'Image optimized successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Generate thumbnail
 */
const generateThumbnail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { width = 200, height = 200 } = req.body;

    // Check if image exists
    const existingImage = await imageService.getById(id);
    if (!existingImage) {
      return errorResponse(
        res,
        'Image not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const thumbnail = await imageService.generateThumbnail(existingImage.image_url, {
      width: parseInt(width),
      height: parseInt(height),
    });

    return successResponse(res, thumbnail, 'Thumbnail generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get image statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await imageService.getStatistics();
    return successResponse(res, stats, 'Image statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cleanup unused images
 */
const cleanupUnusedImages = async (req, res, next) => {
  try {
    const result = await imageService.cleanupUnusedImages();
    return successResponse(res, result, `Cleanup completed: ${result.deleted} unused images removed`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete images
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { image_ids } = req.body;

    if (!image_ids || !Array.isArray(image_ids) || image_ids.length === 0) {
      return errorResponse(
        res,
        'Image IDs array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await imageService.bulkDelete(image_ids);

    return successResponse(res, result, `${result.deleted} images deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload generic image (temp)
 */
const uploadTempImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(
        res,
        'No image file uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const imagePath = `uploads/temp/${req.file.filename}`;

    return successResponse(res, {
      path: imagePath,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'Image uploaded to temp successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Move temp image to destination
 */
const moveTempImage = async (req, res, next) => {
  try {
    const { temp_path, destination, entity_id } = req.body;

    if (!temp_path || !destination) {
      return errorResponse(
        res,
        'Temp path and destination are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const validDestinations = ['products', 'categories', 'subcategories', 'users', 'banners'];
    if (!validDestinations.includes(destination)) {
      return errorResponse(
        res,
        'Invalid destination',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const newPath = await imageService.moveTempImage(temp_path, destination, entity_id);

    return successResponse(res, { path: newPath }, 'Image moved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Product images
  getProductImages,
  getById,
  uploadProductImage,
  uploadMultipleProductImages,
  update,
  remove,
  setPrimary,
  updateDisplayOrder,
  deleteProductImages,
  replaceImage,
  
  // Category/Subcategory images
  uploadCategoryImage,
  uploadSubcategoryImage,
  
  // User avatar
  uploadUserAvatar,
  
  // Banners
  uploadBannerImage,
  getBanners,
  updateBanner,
  deleteBanner,
  
  // Image processing
  optimizeImage,
  generateThumbnail,
  
  // Statistics & Cleanup
  getStatistics,
  cleanupUnusedImages,
  bulkDelete,
  
  // Temp images
  uploadTempImage,
  moveTempImage,
};