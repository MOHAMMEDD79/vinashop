/**
 * Category Service
 * @module services/category
 */

const Category = require('../models/category.model');
const Subcategory = require('../models/subcategory.model');
const ImageService = require('./image.service');

class CategoryService {
  /**
   * Get all categories with pagination
   */
  static async getAll(options = {}) {
    return await Category.getAll(options);
  }

  /**
   * Get all categories for dropdown
   */
  static async getAllList(options = {}) {
    return await Category.getAllList(options);
  }

  /**
   * Get category by ID
   */
  static async getById(categoryId, lang = 'en') {
    const category = await Category.getById(categoryId, lang);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  /**
   * Get category by name
   */
  static async getByName(categoryName, lang = 'en') {
    return await Category.getByName(categoryName, lang);
  }

  /**
   * Get category tree with subcategories
   */
  static async getTree(options = {}) {
    return await Category.getTree(options);
  }

  /**
   * Get category with subcategories
   */
  static async getWithSubcategories(categoryId, options = {}) {
    const category = await Category.getById(categoryId, options.lang);
    if (!category) {
      throw new Error('Category not found');
    }

    const subcategories = await Subcategory.getByCategory(categoryId, options);
    return {
      ...category,
      subcategories,
    };
  }

  /**
   * Get category with products
   */
  static async getWithProducts(categoryId, options = {}) {
    const result = await Category.getWithProducts(categoryId, options);
    if (!result) {
      throw new Error('Category not found');
    }
    return result;
  }

  /**
   * Create new category
   */
  static async create(data) {
    // Check name uniqueness in primary language
    const existingName = await Category.nameExists(data.category_name_en, 'en');
    if (existingName) {
      throw new Error('Category name already exists');
    }

    return await Category.create(data);
  }

  /**
   * Update category
   */
  static async update(categoryId, data) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check name uniqueness if changed
    if (data.category_name_en && data.category_name_en !== category.category_name_en) {
      const existingName = await Category.nameExists(data.category_name_en, 'en', categoryId);
      if (existingName) {
        throw new Error('Category name already exists');
      }
    }

    return await Category.update(categoryId, data);
  }

  /**
   * Delete category
   */
  static async delete(categoryId) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has products
    if (category.product_count > 0) {
      throw new Error('Cannot delete category with products. Please reassign products first.');
    }

    // Delete image if exists
    if (category.image_url) {
      await ImageService.deleteFile(category.image_url);
    }

    // Delete subcategory images
    const subcategories = await Subcategory.getByCategory(categoryId);
    for (const sub of subcategories) {
      if (sub.image_url) {
        await ImageService.deleteFile(sub.image_url);
      }
    }

    return await Category.delete(categoryId);
  }

  /**
   * Toggle category status
   */
  static async toggleStatus(categoryId) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    return await Category.toggleStatus(categoryId);
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(categoryId) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    return await Category.toggleFeatured(categoryId);
  }

  /**
   * Upload category image
   */
  static async uploadImage(categoryId, file) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Delete old image
    if (category.image_url) {
      await ImageService.deleteFile(category.image_url);
    }

    // Save new image
    const imageUrl = await ImageService.saveCategoryImage(file, categoryId);
    return await Category.updateImage(categoryId, imageUrl);
  }

  /**
   * Delete category image
   */
  static async deleteImage(categoryId) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    if (category.image_url) {
      await ImageService.deleteFile(category.image_url);
      await Category.updateImage(categoryId, null);
    }

    return true;
  }

  /**
   * Update display order
   */
  static async updateDisplayOrder(categoryId, displayOrder) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    return await Category.updateDisplayOrder(categoryId, displayOrder);
  }

  /**
   * Duplicate category
   */
  static async duplicate(categoryId) {
    const category = await Category.getById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    return await Category.duplicate(categoryId);
  }

  /**
   * Reorder categories
   */
  static async reorder(categoryOrders) {
    return await Category.reorder(categoryOrders);
  }

  /**
   * Get featured categories
   */
  static async getFeatured(options = {}) {
    return await Category.getFeatured(options);
  }

  /**
   * Get category statistics
   */
  static async getStatistics() {
    return await Category.getStatistics();
  }

  /**
   * Search categories
   */
  static async search(searchTerm, options = {}) {
    return await Category.search(searchTerm, options);
  }

  /**
   * Bulk update categories
   */
  static async bulkUpdate(categoryIds, data) {
    return await Category.bulkUpdate(categoryIds, data);
  }

  /**
   * Bulk delete categories
   */
  static async bulkDelete(categoryIds) {
    // Check each category for products
    for (const categoryId of categoryIds) {
      const category = await Category.getById(categoryId);
      if (category && category.product_count > 0) {
        throw new Error(`Category "${category.category_name_en}" has products and cannot be deleted`);
      }

      // Delete images
      if (category && category.image_url) {
        await ImageService.deleteFile(category.image_url);
      }

      // Delete subcategory images
      const subcategories = await Subcategory.getByCategory(categoryId);
      for (const sub of subcategories) {
        if (sub.image_url) {
          await ImageService.deleteFile(sub.image_url);
        }
      }
    }

    return await Category.bulkDelete(categoryIds);
  }

  /**
   * Export categories
   */
  static async export(options = {}) {
    return await Category.getAllForExport(options);
  }

  /**
   * Get categories with product counts
   */
  static async getWithProductCounts(options = {}) {
    return await Category.getWithProductCounts(options);
  }

  /**
   * Get categories with subcategory counts
   */
  static async getWithSubcategoryCounts(options = {}) {
    return await Category.getWithSubcategoryCounts(options);
  }
}

module.exports = CategoryService;