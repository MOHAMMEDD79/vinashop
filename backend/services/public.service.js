/**
 * Public Service
 * @module services/public
 * @description Business logic for public (storefront) endpoints
 */

const PublicModel = require('../models/public.model');

/**
 * Public Service - Handles public-facing business logic
 */
class PublicService {
  /**
   * Get products with filters
   */
  static async getProducts(options) {
    return await PublicModel.getProducts(options);
  }

  /**
   * Get single product by ID
   */
  static async getProductById(productId, lang = 'en') {
    const product = await PublicModel.getProductById(productId, lang);
    if (!product) {
      throw { status: 404, message: 'Product not found' };
    }
    return product;
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit = 8, lang = 'en') {
    return await PublicModel.getFeaturedProducts(limit, lang);
  }

  /**
   * Get new arrivals
   */
  static async getNewArrivals(limit = 8, lang = 'en') {
    return await PublicModel.getNewArrivals(limit, lang);
  }

  /**
   * Get all categories with subcategories
   */
  static async getCategories(lang = 'en') {
    return await PublicModel.getCategories(lang);
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId, lang = 'en') {
    const category = await PublicModel.getCategoryById(categoryId, lang);
    if (!category) {
      throw { status: 404, message: 'Category not found' };
    }
    return category;
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId, options) {
    return await PublicModel.getProducts({ ...options, category_id: categoryId });
  }

  /**
   * Get active banners
   */
  static async getBanners(lang = 'en') {
    return await PublicModel.getBanners(lang);
  }

  /**
   * Get banner media by ID
   */
  static async getBannerMedia(bannerId) {
    return await PublicModel.getBannerMedia(bannerId);
  }

  /**
   * Get store settings
   */
  static async getStoreSettings() {
    return await PublicModel.getStoreSettings();
  }

  /**
   * Get homepage data (banners, featured, new arrivals)
   */
  static async getHomepageData(lang = 'en') {
    const [banners, featured, newArrivals, categories] = await Promise.all([
      PublicModel.getBanners(lang),
      PublicModel.getFeaturedProducts(8, lang),
      PublicModel.getNewArrivals(8, lang),
      PublicModel.getCategories(lang),
    ]);

    return {
      banners,
      featured,
      newArrivals,
      categories,
    };
  }

  /**
   * Create guest order
   */
  static async createGuestOrder(orderData) {
    // Validate required fields
    const required = ['guest_name', 'guest_email', 'guest_phone', 'guest_city', 'guest_address', 'items'];
    for (const field of required) {
      if (!orderData[field]) {
        throw { status: 400, message: `${field} is required` };
      }
    }

    if (!orderData.items || orderData.items.length === 0) {
      throw { status: 400, message: 'Order must have at least one item' };
    }

    // Validate delivery method
    if (orderData.delivery_method === 'delivery' && !orderData.region) {
      throw { status: 400, message: 'Region is required for delivery orders' };
    }

    return await PublicModel.createGuestOrder(orderData);
  }

  /**
   * Get related products
   */
  static async getRelatedProducts(productId, categoryId, limit = 4, lang = 'en') {
    return await PublicModel.getRelatedProducts(productId, categoryId, limit, lang);
  }

  /**
   * Get filter options (colors, sizes)
   */
  static async getFilterOptions(lang = 'en') {
    const [colors, sizes] = await Promise.all([
      PublicModel.getAvailableColors(lang),
      PublicModel.getAvailableSizes(lang),
    ]);

    return { colors, sizes };
  }

  /**
   * Get available colors
   */
  static async getColors(lang = 'en') {
    return await PublicModel.getAvailableColors(lang);
  }

  /**
   * Get available sizes
   */
  static async getSizes(lang = 'en') {
    return await PublicModel.getAvailableSizes(lang);
  }

  /**
   * Get all option types with values for filtering
   */
  static async getOptionFilters(lang = 'en', categoryId = null) {
    return await PublicModel.getOptionFilters(lang, categoryId);
  }

  /**
   * Submit contact message
   */
  static async submitContactMessage(data) {
    const required = ['name', 'email', 'message'];
    for (const field of required) {
      if (!data[field]) {
        throw { status: 400, message: `${field} is required` };
      }
    }

    return await PublicModel.submitContactMessage(data);
  }

  /**
   * Submit product review
   */
  static async submitReview(data) {
    return await PublicModel.submitReview(data);
  }

  /**
   * Get subcategory by ID with nested subcategories
   */
  static async getSubcategoryById(subcategoryId, lang = 'en') {
    const subcategory = await PublicModel.getSubcategoryById(subcategoryId, lang);
    if (!subcategory) {
      throw { status: 404, message: 'Subcategory not found' };
    }
    return subcategory;
  }

  /**
   * Get products by subcategory
   */
  static async getProductsBySubcategory(subcategoryId, options) {
    return await PublicModel.getProductsBySubcategory(subcategoryId, options);
  }
}

module.exports = PublicService;
