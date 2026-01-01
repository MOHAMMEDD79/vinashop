/**
 * Product Service
 * @module services/product
 */

const Product = require('../models/product.model');
const ProductOptionCombination = require('../models/productOptionCombination.model');
const Image = require('../models/image.model');
const ImageService = require('./image.service');

class ProductService {
  /**
   * Get all products with pagination
   */
  static async getAll(options = {}) {
    return await Product.getAll(options);
  }

  /**
   * Get all products for dropdown
   */
  static async getAllList(options = {}) {
    return await Product.getAllList(options);
  }

  /**
   * Get product by ID
   */
  static async getById(productId, lang = 'en') {
    const product = await Product.getById(productId, lang);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  /**
   * Get product by SKU
   */
  static async getBySku(sku) {
    const product = await Product.getBySku(sku);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  /**
   * Get product with full details
   */
  static async getWithDetails(productId, lang = 'en') {
    const product = await Product.getWithDetails(productId, lang);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  /**
   * Create new product
   */
  static async create(data, createdBy) {
    // Check SKU uniqueness
    if (data.sku) {
      const existingSku = await Product.skuExists(data.sku);
      if (existingSku) {
        throw new Error('SKU already exists');
      }
    }

    // Create product
    const product = await Product.create({
      ...data,
      created_by: createdBy,
    });

    // Sync colors if provided
    if (data.color_ids && data.color_ids.length > 0) {
      await Product.syncColors(product.product_id, data.color_ids);
    }

    // Sync sizes if provided
    if (data.size_ids && data.size_ids.length > 0) {
      await Product.syncSizes(product.product_id, data.size_ids);
    }

    // NOTE: auto_generate_variants is deprecated
    // Use ProductOptionCombination.generateForProduct() instead
    // Legacy variant generation removed in Phase 6

    return await this.getWithDetails(product.product_id);
  }

  /**
   * Update product
   */
  static async update(productId, data) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check SKU uniqueness
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await Product.skuExists(data.sku, productId);
      if (existingSku) {
        throw new Error('SKU already exists');
      }
    }

    const updatedProduct = await Product.update(productId, data);

    // Sync colors if provided
    if (data.color_ids !== undefined) {
      await Product.syncColors(productId, data.color_ids || []);
    }

    // Sync sizes if provided
    if (data.size_ids !== undefined) {
      await Product.syncSizes(productId, data.size_ids || []);
    }

    return await this.getWithDetails(productId);
  }

  /**
   * Delete product
   */
  static async delete(productId) {
    const product = await Product.getWithDetails(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Delete product images from filesystem
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await ImageService.deleteFile(image.image_url);
      }
    }

    // Delete main image
    if (product.main_image) {
      await ImageService.deleteFile(product.main_image);
    }

    // Delete product (cascade deletes images, variants, etc.)
    await Product.delete(productId);

    return true;
  }

  /**
   * Toggle product status
   */
  static async toggleStatus(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Product.toggleStatus(productId);
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Product.toggleFeatured(productId);
  }

  /**
   * Update stock
   */
  static async updateStock(productId, quantity, operation = 'set') {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Product.updateStock(productId, quantity, operation);
  }

  /**
   * Duplicate product
   */
  static async duplicate(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Product.duplicate(productId);
  }

  /**
   * Get product images
   */
  static async getImages(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Image.getByProductId(productId);
  }

  /**
   * Upload product images
   */
  static async uploadImages(productId, files) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageUrl = await ImageService.saveProductImage(file, productId);
      
      // Check if this is the first image (make it primary)
      const existingImages = await Image.getByProductId(productId);
      const isPrimary = existingImages.length === 0 && i === 0;

      const image = await Image.createProductImage({
        product_id: productId,
        image_url: imageUrl,
        is_primary: isPrimary,
        display_order: existingImages.length + i,
      });

      // Update main_image if primary
      if (isPrimary) {
        await Product.updateMainImage(productId, imageUrl);
      }

      uploadedImages.push(image);
    }

    return uploadedImages;
  }

  /**
   * Set primary image
   */
  static async setPrimaryImage(productId, imageId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const image = await Image.getById(imageId);
    if (!image || image.product_id !== productId) {
      throw new Error('Image not found');
    }

    await Image.setPrimaryImage(productId, imageId);
    await Product.updateMainImage(productId, image.image_url);

    return await this.getImages(productId);
  }

  /**
   * Delete product image
   */
  static async deleteImage(productId, imageId) {
    const image = await Image.getById(imageId);
    if (!image || image.product_id !== productId) {
      throw new Error('Image not found');
    }

    // Delete file
    await ImageService.deleteFile(image.image_url);

    // Delete from database
    await Image.delete(imageId);

    // If was primary, set new primary
    if (image.is_primary) {
      const images = await Image.getByProductId(productId);
      if (images.length > 0) {
        await Image.setPrimaryImage(productId, images[0].image_id);
        await Product.updateMainImage(productId, images[0].image_url);
      } else {
        await Product.updateMainImage(productId, null);
      }
    }

    return true;
  }

  /**
   * Reorder images
   */
  static async reorderImages(productId, imageOrders) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    await Image.reorderProductImages(productId, imageOrders);
    return await this.getImages(productId);
  }

  /**
   * Get product colors
   */
  static async getColors(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Product.getColors(productId);
  }

  /**
   * Sync product colors
   */
  static async syncColors(productId, colorIds) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    await Product.syncColors(productId, colorIds);
    return await this.getColors(productId);
  }

  /**
   * Get product sizes
   */
  static async getSizes(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Product.getSizes(productId);
  }

  /**
   * Sync product sizes
   */
  static async syncSizes(productId, sizeIds) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    await Product.syncSizes(productId, sizeIds);
    return await this.getSizes(productId);
  }

  /**
   * Get product variants (DEPRECATED - use getCombinations instead)
   * @deprecated Use ProductOptionCombination.getByProductId() instead
   */
  static async getVariants(productId, options = {}) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Return combinations instead of legacy variants
    return await ProductOptionCombination.getByProductId(productId);
  }

  /**
   * Get product combinations (NEW - replaces getVariants)
   */
  static async getCombinations(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await ProductOptionCombination.getByProductId(productId);
  }

  /**
   * Create variant (DEPRECATED - use createCombination instead)
   * @deprecated Use ProductOptionCombination.create() instead
   */
  static async createVariant(productId, data) {
    console.warn('createVariant is deprecated. Use ProductOptionCombination.create() instead.');
    throw new Error('createVariant is deprecated. Use the new combinations system at /api/option-combinations');
  }

  /**
   * Generate variants (DEPRECATED)
   * @deprecated Use ProductOptionCombination.generateForProduct() instead
   */
  static async generateVariants(productId, options = {}) {
    console.warn('generateVariants is deprecated. Use ProductOptionCombination.generateForProduct() instead.');
    throw new Error('generateVariants is deprecated. Use the new combinations system at /api/option-combinations');
  }

  /**
   * Get featured products
   */
  static async getFeatured(options = {}) {
    return await Product.getFeatured(options);
  }

  /**
   * Get new products
   */
  static async getNew(options = {}) {
    return await Product.getNew(options);
  }

  /**
   * Get best sellers
   */
  static async getBestSellers(options = {}) {
    return await Product.getBestSellers(options);
  }

  /**
   * Get on sale products
   */
  static async getOnSale(options = {}) {
    return await Product.getOnSale(options);
  }

  /**
   * Get low stock products
   */
  static async getLowStock(options = {}) {
    return await Product.getLowStock(options);
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStock(options = {}) {
    return await Product.getOutOfStock(options);
  }

  /**
   * Get related products
   */
  static async getRelated(productId, options = {}) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await Product.getRelated(productId, options);
  }

  /**
   * Get product statistics
   */
  static async getStatistics() {
    return await Product.getStatistics();
  }

  /**
   * Search products
   */
  static async search(searchTerm, options = {}) {
    return await Product.search(searchTerm, options);
  }

  /**
   * Bulk update products
   */
  static async bulkUpdate(productIds, data) {
    return await Product.bulkUpdate(productIds, data);
  }

  /**
   * Bulk delete products
   */
  static async bulkDelete(productIds) {
    // Get products to delete images
    for (const productId of productIds) {
      try {
        const product = await Product.getWithDetails(productId);
        if (product) {
          if (product.images) {
            for (const image of product.images) {
              await ImageService.deleteFile(image.image_url);
            }
          }
          if (product.main_image) {
            await ImageService.deleteFile(product.main_image);
          }
        }
      } catch (e) {
        // Continue even if image deletion fails
      }
    }

    return await Product.bulkDelete(productIds);
  }

  /**
   * Export products
   */
  static async export(options = {}) {
    return await Product.getAllForExport(options);
  }

  /**
   * Get products by category
   */
  static async getByCategory(categoryId, options = {}) {
    return await Product.getByCategory(categoryId, options);
  }

  /**
   * Get products by subcategory
   */
  static async getBySubcategory(subcategoryId, options = {}) {
    return await Product.getBySubcategory(subcategoryId, options);
  }

  /**
   * Get product count
   */
  static async getCount(options = {}) {
    return await Product.getCount(options);
  }
}

module.exports = ProductService;