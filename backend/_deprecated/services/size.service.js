/**
 * Size Service
 * @module services/size
 */

const Size = require('../models/size.model');

class SizeService {
  /**
   * Get all sizes with pagination
   */
  static async getAll(options = {}) {
    return await Size.getAll(options);
  }

  /**
   * Get all sizes for dropdown
   */
  static async getAllList(options = {}) {
    return await Size.getAllList(options);
  }

  /**
   * Get size by ID
   */
  static async getById(sizeId, lang = 'en') {
    const size = await Size.getById(sizeId, lang);
    if (!size) {
      throw new Error('Size not found');
    }
    return size;
  }

  /**
   * Get size by code
   */
  static async getByCode(sizeCode) {
    return await Size.getByCode(sizeCode);
  }

  /**
   * Get products by size
   */
  static async getProducts(sizeId, options = {}) {
    const size = await Size.getById(sizeId);
    if (!size) {
      throw new Error('Size not found');
    }
    return await Size.getProductsBySize(sizeId, options);
  }

  /**
   * Create new size
   */
  static async create(data) {
    // Check name uniqueness
    const existingName = await Size.nameExists(data.size_name_en, 'en');
    if (existingName) {
      throw new Error('Size name already exists');
    }

    // Check code uniqueness
    if (data.size_code) {
      const existingCode = await Size.codeExists(data.size_code);
      if (existingCode) {
        throw new Error('Size code already exists');
      }
    }

    return await Size.create(data);
  }

  /**
   * Update size
   */
  static async update(sizeId, data) {
    const size = await Size.getById(sizeId);
    if (!size) {
      throw new Error('Size not found');
    }

    // Check name uniqueness
    if (data.size_name_en && data.size_name_en !== size.size_name_en) {
      const existingName = await Size.nameExists(data.size_name_en, 'en', sizeId);
      if (existingName) {
        throw new Error('Size name already exists');
      }
    }

    // Check code uniqueness
    if (data.size_code && data.size_code !== size.size_code) {
      const existingCode = await Size.codeExists(data.size_code, sizeId);
      if (existingCode) {
        throw new Error('Size code already exists');
      }
    }

    return await Size.update(sizeId, data);
  }

  /**
   * Delete size
   */
  static async delete(sizeId) {
    const size = await Size.getById(sizeId);
    if (!size) {
      throw new Error('Size not found');
    }

    // Check if size is used
    const productCount = await Size.getProductCount(sizeId);
    if (productCount > 0) {
      throw new Error('Cannot delete size that is used by products');
    }

    return await Size.delete(sizeId);
  }

  /**
   * Toggle size status
   */
  static async toggleStatus(sizeId) {
    const size = await Size.getById(sizeId);
    if (!size) {
      throw new Error('Size not found');
    }

    return await Size.toggleStatus(sizeId);
  }

  /**
   * Update display order
   */
  static async updateDisplayOrder(sizeId, displayOrder) {
    const size = await Size.getById(sizeId);
    if (!size) {
      throw new Error('Size not found');
    }

    return await Size.updateDisplayOrder(sizeId, displayOrder);
  }

  /**
   * Duplicate size
   */
  static async duplicate(sizeId) {
    const size = await Size.getById(sizeId);
    if (!size) {
      throw new Error('Size not found');
    }

    return await Size.duplicate(sizeId);
  }

  /**
   * Reorder sizes
   */
  static async reorder(sizeOrders) {
    return await Size.reorder(sizeOrders);
  }

  /**
   * Get popular sizes
   */
  static async getPopular(options = {}) {
    return await Size.getPopularSizes(options);
  }

  /**
   * Get sizes with variant counts
   */
  static async getWithVariantCounts() {
    return await Size.getWithVariantCounts();
  }

  /**
   * Get size statistics
   */
  static async getStatistics() {
    return await Size.getStatistics();
  }

  /**
   * Get usage report
   */
  static async getUsageReport(options = {}) {
    return await Size.getUsageReport(options);
  }

  /**
   * Search sizes
   */
  static async search(searchTerm, options = {}) {
    return await Size.search(searchTerm, options);
  }

  /**
   * Bulk update sizes
   */
  static async bulkUpdate(sizeIds, data) {
    return await Size.bulkUpdate(sizeIds, data);
  }

  /**
   * Bulk delete sizes
   */
  static async bulkDelete(sizeIds) {
    // Check each size is not used
    for (const sizeId of sizeIds) {
      const productCount = await Size.getProductCount(sizeId);
      if (productCount > 0) {
        const size = await Size.getById(sizeId);
        throw new Error(`Size "${size.size_name_en}" is used by products and cannot be deleted`);
      }
    }

    return await Size.bulkDelete(sizeIds);
  }

  /**
   * Export sizes
   */
  static async export(options = {}) {
    return await Size.getAllForExport(options);
  }
}

module.exports = SizeService;