/**
 * Subcategory Service
 * @module services/subcategory
 */

const Subcategory = require('../models/subcategory.model');
const Category = require('../models/category.model');
const ImageService = require('./image.service');

class SubcategoryService {
  /**
   * Get all subcategories with pagination
   */
  static async getAll(options = {}) {
    return await Subcategory.getAll(options);
  }

  /**
   * Get all subcategories for dropdown
   */
  static async getAllList(options = {}) {
    return await Subcategory.getAllList(options);
  }

  /**
   * Get subcategory by ID
   */
  static async getById(subcategoryId, lang = 'en') {
    const subcategory = await Subcategory.getById(subcategoryId, lang);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }
    return subcategory;
  }

  /**
   * Get subcategories by category
   */
  static async getByCategory(categoryId, options = {}) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }
    return await Subcategory.getByCategory(categoryId, options);
  }

  /**
   * Get subcategory tree (grouped by category)
   */
  static async getTree(options = {}) {
    return await Subcategory.getTree(options);
  }

  /**
   * Get subcategory with products
   */
  static async getWithProducts(subcategoryId, options = {}) {
    const result = await Subcategory.getWithProducts(subcategoryId, options);
    if (!result) {
      throw new Error('Subcategory not found');
    }
    return result;
  }

  /**
   * Create new subcategory
   */
  static async create(data) {
    // Check if category exists
    const category = await Category.getById(data.category_id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check name uniqueness within category
    const existingName = await Subcategory.nameExists(
      data.subcategory_name_en,
      data.category_id,
      'en'
    );
    if (existingName) {
      throw new Error('Subcategory name already exists in this category');
    }

    return await Subcategory.create(data);
  }

  /**
   * Update subcategory
   */
  static async update(subcategoryId, data) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    // Check category exists if changing
    if (data.category_id && data.category_id !== subcategory.category_id) {
      const category = await Category.getById(data.category_id);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    // Check name uniqueness if changed
    if (data.subcategory_name_en && data.subcategory_name_en !== subcategory.subcategory_name_en) {
      const categoryId = data.category_id || subcategory.category_id;
      const existingName = await Subcategory.nameExists(
        data.subcategory_name_en,
        categoryId,
        'en',
        subcategoryId
      );
      if (existingName) {
        throw new Error('Subcategory name already exists in this category');
      }
    }

    return await Subcategory.update(subcategoryId, data);
  }

  /**
   * Delete subcategory
   */
  static async delete(subcategoryId) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    // Check if subcategory has products
    if (subcategory.product_count > 0) {
      throw new Error('Cannot delete subcategory with products. Please reassign products first.');
    }

    // Delete image if exists
    if (subcategory.image_url) {
      await ImageService.deleteFile(subcategory.image_url);
    }

    return await Subcategory.delete(subcategoryId);
  }

  /**
   * Toggle subcategory status
   */
  static async toggleStatus(subcategoryId) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    return await Subcategory.toggleStatus(subcategoryId);
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(subcategoryId) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    return await Subcategory.toggleFeatured(subcategoryId);
  }

  /**
   * Upload subcategory image
   */
  static async uploadImage(subcategoryId, file) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    // Delete old image
    if (subcategory.image_url) {
      await ImageService.deleteFile(subcategory.image_url);
    }

    // Save new image
    const imageUrl = await ImageService.saveSubcategoryImage(file, subcategoryId);
    return await Subcategory.updateImage(subcategoryId, imageUrl);
  }

  /**
   * Delete subcategory image
   */
  static async deleteImage(subcategoryId) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    if (subcategory.image_url) {
      await ImageService.deleteFile(subcategory.image_url);
      await Subcategory.updateImage(subcategoryId, null);
    }

    return true;
  }

  /**
   * Update display order
   */
  static async updateDisplayOrder(subcategoryId, displayOrder) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    return await Subcategory.updateDisplayOrder(subcategoryId, displayOrder);
  }

  /**
   * Move subcategory to another category
   */
  static async moveToCategory(subcategoryId, newCategoryId) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    const category = await Category.getById(newCategoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check name uniqueness in new category
    const existingName = await Subcategory.nameExists(
      subcategory.subcategory_name_en,
      newCategoryId,
      'en',
      subcategoryId
    );
    if (existingName) {
      throw new Error('Subcategory name already exists in target category');
    }

    return await Subcategory.moveToCategory(subcategoryId, newCategoryId);
  }

  /**
   * Duplicate subcategory
   */
  static async duplicate(subcategoryId) {
    const subcategory = await Subcategory.getById(subcategoryId);
    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    return await Subcategory.duplicate(subcategoryId);
  }

  /**
   * Reorder subcategories
   */
  static async reorder(subcategoryOrders) {
    return await Subcategory.reorder(subcategoryOrders);
  }

  /**
   * Get featured subcategories
   */
  static async getFeatured(options = {}) {
    return await Subcategory.getFeatured(options);
  }

  /**
   * Get subcategory statistics
   */
  static async getStatistics() {
    return await Subcategory.getStatistics();
  }

  /**
   * Search subcategories
   */
  static async search(searchTerm, options = {}) {
    return await Subcategory.search(searchTerm, options);
  }

  /**
   * Bulk update subcategories
   */
  static async bulkUpdate(subcategoryIds, data) {
    return await Subcategory.bulkUpdate(subcategoryIds, data);
  }

  /**
   * Bulk delete subcategories
   */
  static async bulkDelete(subcategoryIds) {
    // Check each subcategory for products
    for (const subcategoryId of subcategoryIds) {
      const subcategory = await Subcategory.getById(subcategoryId);
      if (subcategory && subcategory.product_count > 0) {
        throw new Error(`Subcategory "${subcategory.subcategory_name_en}" has products and cannot be deleted`);
      }

      // Delete images
      if (subcategory && subcategory.image_url) {
        await ImageService.deleteFile(subcategory.image_url);
      }
    }

    return await Subcategory.bulkDelete(subcategoryIds);
  }

  /**
   * Export subcategories
   */
  static async export(options = {}) {
    return await Subcategory.getAllForExport(options);
  }

  /**
   * Get subcategories with product counts
   */
  static async getWithProductCounts(options = {}) {
    return await Subcategory.getWithProductCounts(options);
  }

  /**
   * Get count by category
   */
  static async getCountByCategory() {
    return await Subcategory.getCountByCategory();
  }

  /**
   * Check if category exists
   */
  static async checkCategoryExists(categoryId) {
    try {
      const category = await Category.getById(categoryId);
      return !!category;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find subcategory by name in category
   */
  static async findByNameInCategory(name, categoryId, lang = 'en') {
    return await Subcategory.nameExists(name, categoryId, lang);
  }

  /**
   * Get product count for subcategory
   */
  static async getProductCount(subcategoryId) {
    const subcategory = await Subcategory.getById(subcategoryId);
    return subcategory?.product_count || 0;
  }

  /**
   * Remove subcategory (alias for delete)
   */
  static async remove(subcategoryId) {
    return await Subcategory.delete(subcategoryId);
  }

  /**
   * Get subcategory products
   */
  static async getSubcategoryProducts(subcategoryId, options = {}) {
    return await Subcategory.getProducts(subcategoryId, options);
  }

  /**
   * Export to Excel
   */
  static async exportToExcel(options = {}) {
    return await Subcategory.getAllForExport(options);
  }

  /**
   * Import from Excel
   */
  static async importFromExcel(filePath, adminId) {
    // Basic implementation - could be expanded
    return { created: 0, updated: 0, failed: 0 };
  }

  // ==================== NESTED SUBCATEGORY METHODS ====================

  /**
   * Get children of a subcategory
   */
  static async getChildren(subcategoryId, lang = 'en') {
    return await Subcategory.getChildren(subcategoryId, lang);
  }

  /**
   * Get subcategory tree for a category
   */
  static async getTree(categoryId, lang = 'en') {
    return await Subcategory.getTreeByCategory(categoryId, lang);
  }

  /**
   * Get root subcategories (no parent) for a category
   */
  static async getRoots(categoryId, lang = 'en') {
    return await Subcategory.getRoots(categoryId, lang);
  }

  /**
   * Get parent chain (breadcrumbs) for a subcategory
   */
  static async getParentChain(subcategoryId, lang = 'en') {
    return await Subcategory.getParentChain(subcategoryId, lang);
  }
}

module.exports = SubcategoryService;