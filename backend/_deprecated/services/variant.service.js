/**
 * Variant Service
 * @module services/variant
 */

const Variant = require('../models/variant.model');
const Product = require('../models/product.model');
const ImageService = require('./image.service');

class VariantService {
  /**
   * Get all variants with pagination
   */
  static async getAll(options = {}) {
    return await Variant.getAll(options);
  }

  /**
   * Get variant by ID
   */
  static async getById(variantId, lang = 'en') {
    const variant = await Variant.getById(variantId, lang);
    if (!variant) {
      throw new Error('Variant not found');
    }
    return variant;
  }

  /**
   * Get variant by SKU
   */
  static async getBySku(sku) {
    const variant = await Variant.getBySku(sku);
    if (!variant) {
      throw new Error('Variant not found');
    }
    return variant;
  }

  /**
   * Get variants by product
   */
  static async getByProduct(productId, options = {}) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return await Variant.getByProductId(productId, options);
  }

  /**
   * Get variants by color
   */
  static async getByColor(colorId, options = {}) {
    return await Variant.getByColorId(colorId, options);
  }

  /**
   * Get variants by size
   */
  static async getBySize(sizeId, options = {}) {
    return await Variant.getBySizeId(sizeId, options);
  }

  /**
   * Get variant matrix for product
   */
  static async getMatrix(productId, lang = 'en') {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return await Variant.getMatrix(productId, lang);
  }

  /**
   * Get price range for product variants
   */
  static async getPriceRange(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return await Variant.getPriceRange(productId);
  }

  /**
   * Get available stock
   */
  static async getAvailableStock(variantId) {
    const variant = await Variant.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }
    return await Variant.getAvailableStock(variantId);
  }

  /**
   * Create new variant
   */
  static async create(data) {
    // Check product exists
    const product = await Product.getById(data.product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if combination exists
    const exists = await Variant.combinationExists(
      data.product_id,
      data.color_id,
      data.size_id
    );
    if (exists) {
      throw new Error('Variant combination already exists');
    }

    // Check SKU uniqueness
    if (data.sku) {
      const skuExists = await Variant.skuExists(data.sku);
      if (skuExists) {
        throw new Error('SKU already exists');
      }
    }

    const variant = await Variant.create(data);

    // Sync product stock
    await Variant.syncProductStock(data.product_id);

    return variant;
  }

  /**
   * Update variant
   */
  static async update(variantId, data) {
    const variant = await Variant.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    // Check SKU uniqueness if changed
    if (data.sku && data.sku !== variant.sku) {
      const skuExists = await Variant.skuExists(data.sku, variantId);
      if (skuExists) {
        throw new Error('SKU already exists');
      }
    }

    // Check combination if color or size changed
    if (data.color_id !== undefined || data.size_id !== undefined) {
      const colorId = data.color_id !== undefined ? data.color_id : variant.color_id;
      const sizeId = data.size_id !== undefined ? data.size_id : variant.size_id;

      const exists = await Variant.combinationExists(
        variant.product_id,
        colorId,
        sizeId,
        variantId
      );
      if (exists) {
        throw new Error('Variant combination already exists');
      }
    }

    const updatedVariant = await Variant.update(variantId, data);

    // Sync product stock if quantity changed
    if (data.stock_quantity !== undefined) {
      await Variant.syncProductStock(variant.product_id);
    }

    return updatedVariant;
  }

  /**
   * Delete variant
   */
  static async delete(variantId) {
    const variant = await Variant.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    // Delete image if exists
    if (variant.image_url) {
      await ImageService.deleteFile(variant.image_url);
    }

    await Variant.delete(variantId);

    // Sync product stock
    await Variant.syncProductStock(variant.product_id);

    return true;
  }

  /**
   * Toggle variant status
   */
  static async toggleStatus(variantId) {
    const variant = await Variant.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    return await Variant.toggleStatus(variantId);
  }

  /**
   * Update stock
   */
  static async updateStock(variantId, quantity, operation = 'set') {
    const variant = await Variant.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    const updatedVariant = await Variant.updateStock(variantId, quantity, operation);

    // Sync product stock
    await Variant.syncProductStock(variant.product_id);

    return updatedVariant;
  }

  /**
   * Upload variant image
   */
  static async uploadImage(variantId, file) {
    const variant = await Variant.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    // Delete old image
    if (variant.image_url) {
      await ImageService.deleteFile(variant.image_url);
    }

    // Save new image
    const imageUrl = await ImageService.saveVariantImage(file, variantId);
    return await Variant.updateImage(variantId, imageUrl);
  }

  /**
   * Delete variant image
   */
  static async deleteImage(variantId) {
    const variant = await Variant.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    if (variant.image_url) {
      await ImageService.deleteFile(variant.image_url);
      await Variant.updateImage(variantId, null);
    }

    return true;
  }

  /**
   * Duplicate variant
   */
  static async duplicate(variantId) {
    const variant = await Variant.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    return await Variant.duplicate(variantId);
  }

  /**
   * Generate variant combinations
   */
  static async generateCombinations(productId, colorIds, sizeIds, baseData = {}) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const variants = await Variant.generateCombinations(
      productId,
      colorIds,
      sizeIds,
      baseData
    );

    // Sync product stock
    await Variant.syncProductStock(productId);

    return variants;
  }

  /**
   * Reorder variants
   */
  static async reorder(variantOrders) {
    return await Variant.reorder(variantOrders);
  }

  /**
   * Get low stock variants
   */
  static async getLowStock(options = {}) {
    return await Variant.getLowStock(options);
  }

  /**
   * Get out of stock variants
   */
  static async getOutOfStock(options = {}) {
    return await Variant.getOutOfStock(options);
  }

  /**
   * Get variant statistics
   */
  static async getStatistics() {
    return await Variant.getStatistics();
  }

  /**
   * Search variants
   */
  static async search(searchTerm, options = {}) {
    return await Variant.search(searchTerm, options);
  }

  /**
   * Bulk update variants
   */
  static async bulkUpdate(variantIds, data) {
    const result = await Variant.bulkUpdate(variantIds, data);

    // Sync product stocks if quantity changed
    if (data.stock_quantity !== undefined) {
      const variants = await Promise.all(
        variantIds.map(id => Variant.getById(id))
      );
      const productIds = [...new Set(variants.filter(v => v).map(v => v.product_id))];
      for (const productId of productIds) {
        await Variant.syncProductStock(productId);
      }
    }

    return result;
  }

  /**
   * Bulk delete variants
   */
  static async bulkDelete(variantIds) {
    // Get variants to sync products after deletion
    const variants = await Promise.all(
      variantIds.map(id => Variant.getById(id))
    );

    // Delete images
    for (const variant of variants) {
      if (variant && variant.image_url) {
        await ImageService.deleteFile(variant.image_url);
      }
    }

    const result = await Variant.bulkDelete(variantIds);

    // Sync product stocks
    const productIds = [...new Set(variants.filter(v => v).map(v => v.product_id))];
    for (const productId of productIds) {
      await Variant.syncProductStock(productId);
    }

    return result;
  }

  /**
   * Bulk update stock
   */
  static async bulkUpdateStock(variantUpdates) {
    // variantUpdates: [{ variant_id, quantity, operation }]
    for (const update of variantUpdates) {
      await this.updateStock(update.variant_id, update.quantity, update.operation || 'set');
    }

    return { updated: variantUpdates.length };
  }

  /**
   * Export variants
   */
  static async export(options = {}) {
    return await Variant.getAllForExport(options);
  }

  /**
   * Check if product exists
   */
  static async checkProductExists(productId) {
    const product = await Product.getById(productId);
    return !!product;
  }

  /**
   * Find variant by SKU
   */
  static async findBySku(sku) {
    return await Variant.getBySku(sku);
  }

  /**
   * Find variant by combination
   */
  static async findByCombination(productId, colorId, sizeId) {
    return await Variant.getByProductColorSize(productId, colorId, sizeId);
  }
}

module.exports = VariantService;