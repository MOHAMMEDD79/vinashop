/**
 * Color Service
 * @module services/color
 */

const Color = require('../models/color.model');

class ColorService {
  /**
   * Get all colors with pagination
   */
  static async getAll(options = {}) {
    return await Color.getAll(options);
  }

  /**
   * Get all colors for dropdown
   */
  static async getAllList(options = {}) {
    return await Color.getAllList(options);
  }

  /**
   * Get color by ID
   */
  static async getById(colorId, lang = 'en') {
    const color = await Color.getById(colorId, lang);
    if (!color) {
      throw new Error('Color not found');
    }
    return color;
  }

  /**
   * Get color by code
   */
  static async getByCode(colorCode) {
    return await Color.getByCode(colorCode);
  }

  /**
   * Get products by color
   */
  static async getProducts(colorId, options = {}) {
    const color = await Color.getById(colorId);
    if (!color) {
      throw new Error('Color not found');
    }
    return await Color.getProductsByColor(colorId, options);
  }

  /**
   * Create new color
   */
  static async create(data) {
    // Check name uniqueness
    const existingName = await Color.nameExists(data.color_name_en, 'en');
    if (existingName) {
      throw new Error('Color name already exists');
    }

    // Check code uniqueness
    if (data.color_code) {
      const existingCode = await Color.codeExists(data.color_code);
      if (existingCode) {
        throw new Error('Color code already exists');
      }
    }

    return await Color.create(data);
  }

  /**
   * Update color
   */
  static async update(colorId, data) {
    const color = await Color.getById(colorId);
    if (!color) {
      throw new Error('Color not found');
    }

    // Check name uniqueness
    if (data.color_name_en && data.color_name_en !== color.color_name_en) {
      const existingName = await Color.nameExists(data.color_name_en, 'en', colorId);
      if (existingName) {
        throw new Error('Color name already exists');
      }
    }

    // Check code uniqueness
    if (data.color_code && data.color_code !== color.color_code) {
      const existingCode = await Color.codeExists(data.color_code, colorId);
      if (existingCode) {
        throw new Error('Color code already exists');
      }
    }

    return await Color.update(colorId, data);
  }

  /**
   * Delete color
   */
  static async delete(colorId) {
    const color = await Color.getById(colorId);
    if (!color) {
      throw new Error('Color not found');
    }

    // Check if color is used
    const productCount = await Color.getProductCount(colorId);
    if (productCount > 0) {
      throw new Error('Cannot delete color that is used by products');
    }

    return await Color.delete(colorId);
  }

  /**
   * Toggle color status
   */
  static async toggleStatus(colorId) {
    const color = await Color.getById(colorId);
    if (!color) {
      throw new Error('Color not found');
    }

    return await Color.toggleStatus(colorId);
  }

  /**
   * Update display order
   */
  static async updateDisplayOrder(colorId, displayOrder) {
    const color = await Color.getById(colorId);
    if (!color) {
      throw new Error('Color not found');
    }

    return await Color.updateDisplayOrder(colorId, displayOrder);
  }

  /**
   * Duplicate color
   */
  static async duplicate(colorId) {
    const color = await Color.getById(colorId);
    if (!color) {
      throw new Error('Color not found');
    }

    return await Color.duplicate(colorId);
  }

  /**
   * Reorder colors
   */
  static async reorder(colorOrders) {
    return await Color.reorder(colorOrders);
  }

  /**
   * Get popular colors
   */
  static async getPopular(options = {}) {
    return await Color.getPopularColors(options);
  }

  /**
   * Get color statistics
   */
  static async getStatistics() {
    return await Color.getStatistics();
  }

  /**
   * Get usage report
   */
  static async getUsageReport(options = {}) {
    return await Color.getUsageReport(options);
  }

  /**
   * Search colors
   */
  static async search(searchTerm, options = {}) {
    return await Color.search(searchTerm, options);
  }

  /**
   * Bulk update colors
   */
  static async bulkUpdate(colorIds, data) {
    return await Color.bulkUpdate(colorIds, data);
  }

  /**
   * Bulk delete colors
   */
  static async bulkDelete(colorIds) {
    // Check each color is not used
    for (const colorId of colorIds) {
      const productCount = await Color.getProductCount(colorId);
      if (productCount > 0) {
        const color = await Color.getById(colorId);
        throw new Error(`Color "${color.color_name_en}" is used by products and cannot be deleted`);
      }
    }

    return await Color.bulkDelete(colorIds);
  }

  /**
   * Export colors
   */
  static async export(options = {}) {
    return await Color.getAllForExport(options);
  }
}

module.exports = ColorService;