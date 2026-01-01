/**
 * Public Controller
 * @module controllers/public
 * @description Request handlers for public (storefront) endpoints
 */

const PublicService = require('../services/public.service');

/**
 * Public Controller - Handles public-facing requests
 */
class PublicController {
  /**
   * Get products with filters
   * GET /api/public/products
   */
  static async getProducts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        category_id,
        subcategory_id,
        min_price,
        max_price,
        colors,
        sizes,
        sort = 'newest',
        lang = 'en',
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        category_id: category_id ? parseInt(category_id) : undefined,
        subcategory_id: subcategory_id ? parseInt(subcategory_id) : undefined,
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        color_ids: colors ? colors.split(',').map(Number) : undefined,
        size_ids: sizes ? sizes.split(',').map(Number) : undefined,
        sort,
        lang,
      };

      const result = await PublicService.getProducts(options);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single product by ID
   * GET /api/public/products/:id
   */
  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const { lang = 'en' } = req.query;

      const product = await PublicService.getProductById(parseInt(id), lang);

      res.json({
        success: true,
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured products
   * GET /api/public/products/featured
   */
  static async getFeaturedProducts(req, res, next) {
    try {
      const { limit = 8, lang = 'en' } = req.query;

      const products = await PublicService.getFeaturedProducts(parseInt(limit), lang);

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get new arrivals
   * GET /api/public/products/new-arrivals
   */
  static async getNewArrivals(req, res, next) {
    try {
      const { limit = 8, lang = 'en' } = req.query;

      const products = await PublicService.getNewArrivals(parseInt(limit), lang);

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get related products
   * GET /api/public/products/:id/related
   */
  static async getRelatedProducts(req, res, next) {
    try {
      const { id } = req.params;
      let { category_id, limit = 4, lang = 'en' } = req.query;

      // If category_id not provided, get it from the product
      if (!category_id) {
        const product = await PublicService.getProductById(parseInt(id), lang);
        if (product) {
          category_id = product.category_id;
        }
      }

      const products = await PublicService.getRelatedProducts(
        parseInt(id),
        parseInt(category_id),
        parseInt(limit),
        lang
      );

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all categories
   * GET /api/public/categories
   */
  static async getCategories(req, res, next) {
    try {
      const { lang = 'en' } = req.query;

      const categories = await PublicService.getCategories(lang);

      res.json({
        success: true,
        categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/public/categories/:id
   */
  static async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const { lang = 'en' } = req.query;

      const category = await PublicService.getCategoryById(parseInt(id), lang);

      res.json({
        success: true,
        category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get products by category
   * GET /api/public/categories/:id/products
   */
  static async getProductsByCategory(req, res, next) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 12,
        min_price,
        max_price,
        colors,
        sizes,
        sort = 'newest',
        lang = 'en',
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        category_id: parseInt(id),
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        color_ids: colors ? colors.split(',').map(Number) : undefined,
        size_ids: sizes ? sizes.split(',').map(Number) : undefined,
        sort,
        lang,
      };

      const result = await PublicService.getProductsByCategory(parseInt(id), options);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active banners
   * GET /api/public/banners
   */
  static async getBanners(req, res, next) {
    try {
      const { lang = 'en' } = req.query;

      const banners = await PublicService.getBanners(lang);

      res.json({
        success: true,
        banners,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get banner media (image/video) directly
   * GET /api/public/banners/:id/media
   * Now redirects to the static file path since we use file-based storage
   */
  static async getBannerMedia(req, res, next) {
    try {
      const { id } = req.params;

      const banner = await PublicService.getBannerMedia(parseInt(id));

      if (!banner || !banner.media_path) {
        return res.status(404).json({
          success: false,
          message: 'Banner media not found',
        });
      }

      // Redirect to the static file path
      res.redirect(`/${banner.media_path}`);
    } catch (error) {
      console.error('Error serving banner media:', error);
      next(error);
    }
  }

  /**
   * Get store settings
   * GET /api/public/settings
   */
  static async getStoreSettings(req, res, next) {
    try {
      const settings = await PublicService.getStoreSettings();

      res.json({
        success: true,
        settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get homepage data
   * GET /api/public/homepage
   */
  static async getHomepageData(req, res, next) {
    try {
      const { lang = 'en' } = req.query;

      const data = await PublicService.getHomepageData(lang);

      res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get filter options
   * GET /api/public/filters
   */
  static async getFilterOptions(req, res, next) {
    try {
      const { lang = 'en' } = req.query;

      const filters = await PublicService.getFilterOptions(lang);

      res.json({
        success: true,
        ...filters,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available colors
   * GET /api/public/filters/colors
   */
  static async getColors(req, res, next) {
    try {
      const { lang = 'en' } = req.query;

      const colors = await PublicService.getColors(lang);

      res.json({
        success: true,
        colors,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available sizes
   * GET /api/public/filters/sizes
   */
  static async getSizes(req, res, next) {
    try {
      const { lang = 'en' } = req.query;

      const sizes = await PublicService.getSizes(lang);

      res.json({
        success: true,
        sizes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all option filters (dynamic)
   * GET /api/public/filters/options
   */
  static async getOptionFilters(req, res, next) {
    try {
      const { lang = 'en' } = req.query;

      const options = await PublicService.getOptionFilters(lang);

      res.json({
        success: true,
        options,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get option filters for a specific category
   * GET /api/public/filters/options/:categoryId
   */
  static async getOptionFiltersByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { lang = 'en' } = req.query;

      const options = await PublicService.getOptionFilters(lang, parseInt(categoryId));

      res.json({
        success: true,
        options,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create guest order
   * POST /api/public/orders
   */
  static async createOrder(req, res, next) {
    try {
      const orderData = req.body;

      const order = await PublicService.createGuestOrder(orderData);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit contact message
   * POST /api/public/contact
   */
  static async submitContact(req, res, next) {
    try {
      const data = req.body;

      await PublicService.submitContactMessage(data);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit product review
   * POST /api/public/products/:id/reviews
   */
  static async submitReview(req, res, next) {
    try {
      const { id } = req.params;
      const { rating, review_text, user_id, reviewer_name } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      if (!review_text || review_text.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Review text must be at least 10 characters',
        });
      }

      // reviewer_name is required for guest reviews (but we'll handle DB compatibility in the model)
      const review = await PublicService.submitReview({
        product_id: parseInt(id),
        user_id: user_id || null,
        reviewer_name: reviewer_name ? reviewer_name.trim() : 'Guest',
        rating,
        review_text: review_text.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subcategory by ID
   * GET /api/public/subcategories/:id
   */
  static async getSubcategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const { lang = 'en' } = req.query;

      const subcategory = await PublicService.getSubcategoryById(parseInt(id), lang);

      res.json({
        success: true,
        subcategory,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get products by subcategory
   * GET /api/public/subcategories/:id/products
   */
  static async getProductsBySubcategory(req, res, next) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 12,
        min_price,
        max_price,
        sort = 'newest',
        lang = 'en',
        include_children = 'true',
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        sort,
        lang,
        include_children: include_children === 'true',
      };

      const result = await PublicService.getProductsBySubcategory(parseInt(id), options);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PublicController;
