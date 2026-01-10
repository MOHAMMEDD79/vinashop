/**
 * Public Model
 * @module models/public
 * @description Database operations for public (storefront) endpoints
 */

const { query, queryOne, insert, transaction } = require('../config/database');

/**
 * Public Model - Handles public-facing database operations
 */
class PublicModel {
  /**
   * Get active products with filters for storefront
   */
  static async getProducts(options = {}) {
    const {
      page = 1,
      limit = 12,
      search,
      category_id,
      subcategory_id,
      min_price,
      max_price,
      color_ids,
      size_ids,
      sort = 'created_at',
      order = 'DESC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE p.is_active = 1';

    if (search) {
      whereClause += ` AND (p.product_name_en LIKE ? OR p.product_name_ar LIKE ? OR p.sku LIKE ? OR p.meta_keywords LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      whereClause += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (subcategory_id) {
      whereClause += ' AND p.subcategory_id = ?';
      params.push(subcategory_id);
    }

    if (min_price !== undefined) {
      whereClause += ' AND p.base_price >= ?';
      params.push(min_price);
    }

    if (max_price !== undefined) {
      whereClause += ' AND p.base_price <= ?';
      params.push(max_price);
    }

    if (color_ids && color_ids.length > 0) {
      const placeholders = color_ids.map(() => '?').join(',');
      whereClause += ` AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.product_id AND pv.color_id IN (${placeholders}))`;
      params.push(...color_ids);
    }

    if (size_ids && size_ids.length > 0) {
      const placeholders = size_ids.map(() => '?').join(',');
      whereClause += ` AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.product_id AND pv.size_id IN (${placeholders}))`;
      params.push(...size_ids);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Sort options
    const sortMap = {
      'price_asc': 'p.base_price ASC',
      'price_desc': 'p.base_price DESC',
      'newest': 'p.created_at DESC',
      'name': `p.product_name_${lang} ASC`,
      'popular': 'p.view_count DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const nameField = lang === 'ar' ? 'p.product_name_ar' : 'p.product_name_en';
    const descField = lang === 'ar' ? 'p.product_description_ar' : 'p.product_description_en';

    const sql = `
      SELECT
        p.product_id,
        ${nameField} as name,
        ${descField} as description,
        p.product_name_en,
        p.product_name_ar,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        p.sku,
        p.is_featured,
        p.average_rating,
        p.rating_count as review_count,
        p.category_id,
        p.subcategory_id,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as primary_image,
        c.category_name_${lang} as category_name,
        sc.subcategory_name_${lang} as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const products = await query(sql, params);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get single product by ID with all details
   */
  static async getProductById(productId, lang = 'en') {
    // Validate language - only 'en' and 'ar' are supported in database columns
    const supportedLangs = ['en', 'ar'];
    const safeLang = supportedLangs.includes(lang) ? lang : 'en';

    const nameField = safeLang === 'ar' ? 'product_name_ar' : 'product_name_en';
    const descField = safeLang === 'ar' ? 'product_description_ar' : 'product_description_en';

    const product = await queryOne(`
      SELECT
        p.*,
        p.${nameField} as name,
        p.${descField} as description,
        c.category_name_${safeLang} as category_name,
        sc.subcategory_name_${safeLang} as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
      WHERE p.product_id = ? AND p.is_active = 1
    `, [productId]);

    if (!product) return null;

    // Get images
    const images = await query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC',
      [productId]
    );

    // Get colors available for this product (through variants) - legacy system
    let colors = [];
    let sizes = [];
    let variants = [];

    try {
      const colorField = safeLang === 'ar' ? 'color_name_ar' : 'color_name_en';
      colors = await query(`
        SELECT DISTINCT pc.color_id, pc.${colorField} as color_name, pc.color_hex_code as color_code
        FROM product_colors pc
        INNER JOIN product_variants pv ON pc.color_id = pv.color_id
        WHERE pv.product_id = ?
      `, [productId]);

      // Get sizes available for this product (through variants)
      sizes = await query(`
        SELECT DISTINCT ps.size_id, ps.size_name, ps.size_value, ps.size_unit
        FROM product_sizes ps
        INNER JOIN product_variants pv ON ps.size_id = pv.size_id
        WHERE pv.product_id = ?
      `, [productId]);

      // Get variants
      variants = await query(`
        SELECT pv.*,
          pc.${colorField} as color_name, pc.color_hex_code as color_code,
          ps.size_name
        FROM product_variants pv
        LEFT JOIN product_colors pc ON pv.color_id = pc.color_id
        LEFT JOIN product_sizes ps ON pv.size_id = ps.size_id
        WHERE pv.product_id = ?
      `, [productId]);
    } catch (err) {
      // Legacy tables might not exist - ignore errors
      console.log('Legacy variant tables not available:', err.message);
    }

    // Get product options with their types and values
    let options = [];
    try {
      options = await query(`
        SELECT
          po.product_option_id,
          po.is_required,
          po.display_order as option_order,
          pot.option_type_id,
          pot.type_name_${safeLang} as type_name,
          pot.type_name_en,
          pot.type_name_ar,
          pov.option_value_id,
          pov.value_name_${safeLang} as value_name,
          pov.value_name_en,
          pov.value_name_ar,
          pov.color_code,
          pov.additional_price,
          pov.display_order as value_order
        FROM product_options po
        INNER JOIN product_option_types pot ON po.option_type_id = pot.option_type_id
        INNER JOIN product_option_values pov ON pot.option_type_id = pov.option_type_id
        WHERE po.product_id = ? AND pot.is_active = 1 AND pov.is_active = 1
        ORDER BY po.display_order, pov.display_order
      `, [productId]);
    } catch (err) {
      console.error('Error fetching product options:', err.message);
      options = [];
    }

    // Group options by type
    const groupedOptions = options.reduce((acc, opt) => {
      const typeId = opt.option_type_id;
      if (!acc[typeId]) {
        acc[typeId] = {
          option_type_id: typeId,
          type_name: opt.type_name,
          type_name_en: opt.type_name_en,
          type_name_ar: opt.type_name_ar,
          is_required: opt.is_required,
          values: []
        };
      }
      acc[typeId].values.push({
        option_value_id: opt.option_value_id,
        value_name: opt.value_name,
        value_name_en: opt.value_name_en,
        value_name_ar: opt.value_name_ar,
        color_code: opt.color_code,
        additional_price: parseFloat(opt.additional_price) || 0
      });
      return acc;
    }, {});

    // Get reviews - don't depend on users table which may not exist
    let reviews = [];
    try {
      // Try simple query without users table join
      reviews = await query(`
        SELECT
          r.review_id,
          r.rating,
          r.review_text,
          r.created_at,
          r.reviewer_name
        FROM product_reviews r
        WHERE r.product_id = ? AND r.is_approved = 1
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [productId]);
    } catch (err) {
      console.error('Error fetching reviews:', err.message);
      reviews = [];
    }

    return {
      ...product,
      price: product.base_price,
      images,
      colors,
      sizes,
      variants,
      options: Object.values(groupedOptions),
      reviews,
      review_count: reviews.length,
    };
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit = 8, lang = 'en') {
    const nameField = lang === 'ar' ? 'p.product_name_ar' : 'p.product_name_en';

    return await query(`
      SELECT
        p.product_id,
        ${nameField} as name,
        p.product_name_en,
        p.product_name_ar,
        p.base_price as price,
        p.discount_percentage,
        p.average_rating,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      WHERE p.is_active = 1 AND p.is_featured = 1       ORDER BY p.created_at DESC
      LIMIT ?
    `, [limit]);
  }

  /**
   * Get new arrivals
   */
  static async getNewArrivals(limit = 8, lang = 'en') {
    const nameField = lang === 'ar' ? 'p.product_name_ar' : 'p.product_name_en';

    return await query(`
      SELECT
        p.product_id,
        ${nameField} as name,
        p.product_name_en,
        p.product_name_ar,
        p.base_price as price,
        p.discount_percentage,
        p.average_rating,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      WHERE p.is_active = 1       ORDER BY p.created_at DESC
      LIMIT ?
    `, [limit]);
  }

  /**
   * Get all active categories with subcategories
   */
  static async getCategories(lang = 'en') {
    const nameField = lang === 'ar' ? 'category_name_ar' : 'category_name_en';
    const descField = lang === 'ar' ? 'category_description_ar' : 'category_description_en';

    const categories = await query(`
      SELECT
        category_id,
        ${nameField} as name,
        category_name_en,
        category_name_ar,
        ${descField} as description,
        category_image as image_url,
        display_order,
        (SELECT COUNT(*) FROM products WHERE category_id = categories.category_id AND is_active = 1) as product_count,
        (SELECT COUNT(*) FROM subcategories WHERE category_id = categories.category_id AND is_active = 1 AND parent_id IS NULL) as subcategory_count
      FROM categories
      WHERE is_active = 1
      ORDER BY display_order ASC
    `);

    // Get only direct children subcategories for each category (parent_id IS NULL)
    for (const category of categories) {
      const subNameField = lang === 'ar' ? 'subcategory_name_ar' : 'subcategory_name_en';
      category.subcategories = await query(`
        SELECT
          subcategory_id,
          ${subNameField} as name,
          subcategory_name_en,
          subcategory_name_ar,
          subcategory_image as image_url,
          display_order,
          (SELECT COUNT(*) FROM products WHERE subcategory_id = subcategories.subcategory_id AND is_active = 1) as product_count,
          (SELECT COUNT(*) FROM subcategories sc2 WHERE sc2.parent_id = subcategories.subcategory_id AND sc2.is_active = 1) as children_count
        FROM subcategories
        WHERE category_id = ? AND is_active = 1 AND parent_id IS NULL
        ORDER BY display_order ASC
      `, [category.category_id]);
    }

    return categories;
  }

  /**
   * Get category by ID with products
   */
  static async getCategoryById(categoryId, lang = 'en') {
    const nameField = lang === 'ar' ? 'category_name_ar' : 'category_name_en';
    const descField = lang === 'ar' ? 'category_description_ar' : 'category_description_en';

    const category = await queryOne(`
      SELECT
        category_id,
        ${nameField} as name,
        category_name_en,
        category_name_ar,
        ${descField} as description,
        category_image as image_url
      FROM categories
      WHERE category_id = ? AND is_active = 1
    `, [categoryId]);

    if (category) {
      // Get only direct children subcategories (parent_id IS NULL means top-level under this category)
      const subNameField = lang === 'ar' ? 'subcategory_name_ar' : 'subcategory_name_en';
      category.subcategories = await query(`
        SELECT
          subcategory_id,
          ${subNameField} as name,
          subcategory_name_en,
          subcategory_name_ar,
          subcategory_image as image_url,
          display_order,
          (SELECT COUNT(*) FROM products WHERE subcategory_id = subcategories.subcategory_id AND is_active = 1) as product_count,
          (SELECT COUNT(*) FROM subcategories sc2 WHERE sc2.parent_id = subcategories.subcategory_id AND sc2.is_active = 1) as children_count
        FROM subcategories
        WHERE category_id = ? AND is_active = 1 AND parent_id IS NULL
        ORDER BY display_order ASC
      `, [categoryId]);
    }

    return category;
  }

  /**
   * Get active banners
   */
  static async getBanners(lang = 'en') {
    const titleField = lang === 'ar' ? 'title_ar' : 'title_en';
    const subtitleField = lang === 'ar' ? 'subtitle_ar' : 'subtitle_en';

    const banners = await query(`
      SELECT
        banner_id,
        ${titleField} as title,
        ${subtitleField} as description,
        title_en,
        title_ar,
        subtitle_en,
        subtitle_ar,
        media_path,
        media_type,
        mime_type,
        link_type,
        link_value as link_url,
        display_order
      FROM banners
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY display_order ASC
    `);

    // Process banners - use media_path for file-based storage
    return banners.map(banner => {
      const hasMedia = banner.media_path && banner.media_path.length > 0;
      const isVideo = banner.media_type === 'video';

      let imageUrl = null;
      let videoUrl = null;

      if (hasMedia) {
        // Return the media path - frontend will construct full URL
        if (isVideo) {
          videoUrl = banner.media_path;
        } else {
          imageUrl = banner.media_path;
        }
      }

      return {
        id: banner.banner_id,
        banner_id: banner.banner_id,
        title: banner.title,
        title_en: banner.title_en,
        title_ar: banner.title_ar,
        subtitle: banner.description,
        description: banner.description,
        subtitle_en: banner.subtitle_en,
        subtitle_ar: banner.subtitle_ar,
        image: imageUrl,
        video: videoUrl,
        media_url: imageUrl || videoUrl,
        media_path: banner.media_path,
        media_type: banner.media_type || 'image',
        mime_type: banner.mime_type,
        link_type: banner.link_type,
        link_url: banner.link_url,
        display_order: banner.display_order
      };
    });
  }

  /**
   * Get banner media by ID
   */
  static async getBannerMedia(bannerId) {
    // Don't check is_active for media endpoint - allow serving media for all banners
    // The banners list already filters active banners
    return await queryOne(`
      SELECT
        banner_id,
        media_path,
        media_type,
        mime_type
      FROM banners
      WHERE banner_id = ?
    `, [bannerId]);
  }

  /**
   * Get store settings
   */
  static async getStoreSettings() {
    const settings = await query(`
      SELECT setting_key, setting_value
      FROM settings
      WHERE is_public = 1 OR setting_key IN (
        'store_name', 'store_email', 'store_phone', 'store_address',
        'shipping_cost_west_bank', 'shipping_cost_jerusalem', 'shipping_cost_occupied_48',
        'store_pickup_enabled', 'about_us_en', 'about_us_ar'
      )
    `);

    const result = {};
    for (const s of settings) {
      result[s.setting_key] = s.setting_value;
    }
    return result;
  }

  /**
   * Get delivery fee by region
   */
  static async getDeliveryFee(region) {
    const feeMap = {
      'west_bank': 'shipping_cost_west_bank',
      'jerusalem': 'shipping_cost_jerusalem',
      'other': 'shipping_cost_occupied_48',
    };

    const settingKey = feeMap[region] || feeMap['other'];
    const setting = await queryOne(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      [settingKey]
    );

    return setting ? parseFloat(setting.setting_value) : 0;
  }

  /**
   * Create guest order
   */
  static async createGuestOrder(orderData) {
    const {
      guest_name,
      guest_email,
      guest_phone,
      guest_city,
      guest_address,
      guest_area_code,
      delivery_method,
      region,
      notes,
      items,
    } = orderData;

    return await transaction(async (connection) => {
      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        const [product] = await connection.execute(
          'SELECT base_price, discount_percentage FROM products WHERE product_id = ?',
          [item.product_id]
        );
        if (product.length > 0) {
          const price = product[0].discount_percentage > 0
            ? product[0].base_price * (1 - product[0].discount_percentage / 100)
            : product[0].base_price;
          subtotal += price * item.quantity;
        }
      }

      // Get delivery fee
      let delivery_fee = 0;
      if (delivery_method === 'delivery' && region) {
        const feeMap = {
          'west_bank': 'shipping_cost_west_bank',
          'jerusalem': 'shipping_cost_jerusalem',
          'other': 'shipping_cost_occupied_48',
        };
        const [feeSetting] = await connection.execute(
          'SELECT setting_value FROM settings WHERE setting_key = ?',
          [feeMap[region] || feeMap['other']]
        );
        if (feeSetting.length > 0) {
          delivery_fee = parseFloat(feeSetting[0].setting_value);
        }
      }

      const total = subtotal + delivery_fee;

      // Generate order number
      const orderNumber = `VS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Insert order
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          order_number, user_id, address_id,
          guest_name, guest_email, guest_phone, guest_city, guest_address, guest_area_code,
          delivery_method, delivery_fee, region,
          subtotal, shipping_cost, total_amount, notes, status
        ) VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'pending')
      `, [
        orderNumber, guest_name, guest_email, guest_phone,
        guest_city, guest_address, guest_area_code,
        delivery_method, delivery_fee, region,
        subtotal, total, notes
      ]);

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of items) {
        const [product] = await connection.execute(
          'SELECT base_price, discount_percentage, product_name_en, product_name_ar FROM products WHERE product_id = ?',
          [item.product_id]
        );

        if (product.length > 0) {
          const p = product[0];
          const unitPrice = p.discount_percentage > 0
            ? p.base_price * (1 - p.discount_percentage / 100)
            : p.base_price;

          await connection.execute(`
            INSERT INTO order_items (
              order_id, product_id, variant_id,
              quantity, unit_price, total_price, product_name, selected_options
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            orderId, item.product_id, item.variant_id || null,
            item.quantity, unitPrice, unitPrice * item.quantity,
            p.product_name_en, JSON.stringify(item.selected_options || [])
          ]);
        }
      }

      return {
        order_id: orderId,
        order_number: orderNumber,
        subtotal,
        delivery_fee,
        total,
      };
    });
  }

  /**
   * Get related products
   */
  static async getRelatedProducts(productId, categoryId, limit = 4, lang = 'en') {
    const nameField = lang === 'ar' ? 'p.product_name_ar' : 'p.product_name_en';

    return await query(`
      SELECT
        p.product_id,
        ${nameField} as name,
        p.base_price as price,
        p.discount_percentage,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      WHERE p.category_id = ?
        AND p.product_id != ?
        AND p.is_active = 1
              ORDER BY RAND()
      LIMIT ?
    `, [categoryId, productId, limit]);
  }

  /**
   * Get available colors for filtering (uses new options system)
   */
  static async getAvailableColors(lang = 'en') {
    // Only en and ar supported
    const nameField = lang === 'ar' ? 'value_name_ar' : 'value_name_en';

    // Try new options system first
    const optionColors = await query(`
      SELECT DISTINCT
        pov.option_value_id as color_id,
        pov.${nameField} as name,
        pov.color_code as color_code
      FROM product_option_values pov
      INNER JOIN product_option_types pot ON pov.option_type_id = pot.option_type_id
      WHERE pot.type_name_en = 'Color' AND pov.is_active = 1
      ORDER BY pov.display_order ASC
    `);

    if (optionColors.length > 0) {
      return optionColors;
    }

    // Fallback to old system for backward compatibility
    const oldNameField = lang === 'ar' ? 'color_name_ar' : 'color_name_en';
    return await query(`
      SELECT DISTINCT
        pc.color_id,
        pc.${oldNameField} as name,
        pc.color_hex_code as color_code
      FROM product_colors pc
      INNER JOIN product_variants pv ON pc.color_id = pv.color_id
      INNER JOIN products p ON pv.product_id = p.product_id
      WHERE p.is_active = 1       ORDER BY pc.color_id
    `);
  }

  /**
   * Get available sizes for filtering (uses new options system)
   */
  static async getAvailableSizes(lang = 'en') {
    // Only en and ar supported
    const nameField = lang === 'ar' ? 'value_name_ar' : 'value_name_en';

    // Try new options system first - both Size and Clothing Size
    const optionSizes = await query(`
      SELECT DISTINCT
        pov.option_value_id as size_id,
        pov.${nameField} as name,
        NULL as size_value,
        NULL as size_unit
      FROM product_option_values pov
      INNER JOIN product_option_types pot ON pov.option_type_id = pot.option_type_id
      WHERE pot.type_name_en IN ('Size', 'Clothing Size') AND pov.is_active = 1
      ORDER BY pov.display_order ASC
    `);

    if (optionSizes.length > 0) {
      return optionSizes;
    }

    // Fallback to old system for backward compatibility
    return await query(`
      SELECT DISTINCT
        ps.size_id,
        ps.size_name as name,
        ps.size_value,
        ps.size_unit
      FROM product_sizes ps
      INNER JOIN product_variants pv ON ps.size_id = pv.size_id
      INNER JOIN products p ON pv.product_id = p.product_id
      WHERE p.is_active = 1       ORDER BY ps.size_id
    `);
  }

  /**
   * Get all option types with values for dynamic filters
   */
  static async getOptionFilters(lang = 'en', categoryId = null) {
    // Only en and ar are supported in the database
    const nameField = lang === 'ar' ? 'type_name_ar' : 'type_name_en';
    const valueNameField = lang === 'ar' ? 'value_name_ar' : 'value_name_en';

    let typesSql = `
      SELECT DISTINCT
        pot.option_type_id,
        pot.${nameField} as type_name,
        pot.type_name_en,
        pot.display_order
      FROM product_option_types pot
      WHERE pot.is_active = 1
    `;

    const params = [];

    // Note: category_option_types table doesn't exist, so we skip category filtering for now
    // If you need category-based filtering, you'll need to create that table

    typesSql += ' ORDER BY pot.display_order ASC';

    const types = await query(typesSql, params);

    // Get values for each type
    for (const type of types) {
      const valuesSql = `
        SELECT
          option_value_id,
          ${valueNameField} as value_name,
          color_code,
          additional_price,
          display_order
        FROM product_option_values
        WHERE option_type_id = ? AND is_active = 1
        ORDER BY display_order ASC
      `;

      type.values = await query(valuesSql, [type.option_type_id]);
    }

    return types;
  }

  /**
   * Submit contact message
   */
  static async submitContactMessage(data) {
    const { name, email, phone, subject, message } = data;

    const result = await insert('contact_messages', {
      name,
      email,
      phone_number: phone || null,
      subject: subject || 'General Inquiry',
      message,
      status: 'pending',
    });

    return result;
  }

  /**
   * Get subcategory by ID with nested subcategories
   */
  static async getSubcategoryById(subcategoryId, lang = 'en') {
    const nameField = lang === 'ar' ? 'subcategory_name_ar' : 'subcategory_name_en';
    const catNameField = lang === 'ar' ? 'category_name_ar' : 'category_name_en';

    const subcategory = await queryOne(`
      SELECT
        s.subcategory_id,
        s.category_id,
        s.parent_id,
        s.${nameField} as name,
        s.subcategory_name_en,
        s.subcategory_name_ar,
        s.subcategory_description_en as description,
        s.subcategory_image as image_url,
        c.${catNameField} as category_name,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = s.subcategory_id AND is_active = 1) as product_count
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.category_id
      WHERE s.subcategory_id = ? AND s.is_active = 1
    `, [subcategoryId]);

    if (!subcategory) return null;

    // Get nested subcategories (children) - direct children only
    subcategory.children = await query(`
      SELECT
        subcategory_id,
        ${nameField} as name,
        subcategory_name_en,
        subcategory_name_ar,
        subcategory_image as image_url,
        display_order,
        (SELECT COUNT(*) FROM products WHERE subcategory_id = subcategories.subcategory_id AND is_active = 1) as product_count,
        (SELECT COUNT(*) FROM subcategories sc2 WHERE sc2.parent_id = subcategories.subcategory_id AND sc2.is_active = 1) as children_count
      FROM subcategories
      WHERE parent_id = ? AND is_active = 1
      ORDER BY display_order ASC
    `, [subcategoryId]);

    // Get parent subcategory if exists
    if (subcategory.parent_id) {
      subcategory.parent = await queryOne(`
        SELECT
          subcategory_id,
          ${nameField} as name,
          subcategory_name_en,
          subcategory_name_ar
        FROM subcategories
        WHERE subcategory_id = ? AND is_active = 1
      `, [subcategory.parent_id]);
    }

    return subcategory;
  }

  /**
   * Get products by subcategory (including nested subcategory products)
   */
  static async getProductsBySubcategory(subcategoryId, options = {}) {
    const {
      page = 1,
      limit = 12,
      min_price,
      max_price,
      sort = 'newest',
      lang = 'en',
      include_children = true,
    } = options;

    const offset = (page - 1) * limit;
    const params = [];

    // Get all child subcategory IDs if include_children is true
    let subcategoryIds = [subcategoryId];
    if (include_children) {
      const children = await query(
        'SELECT subcategory_id FROM subcategories WHERE parent_id = ? AND is_active = 1',
        [subcategoryId]
      );
      subcategoryIds = subcategoryIds.concat(children.map(c => c.subcategory_id));

      // Get grandchildren too
      for (const child of children) {
        const grandchildren = await query(
          'SELECT subcategory_id FROM subcategories WHERE parent_id = ? AND is_active = 1',
          [child.subcategory_id]
        );
        subcategoryIds = subcategoryIds.concat(grandchildren.map(c => c.subcategory_id));
      }
    }

    const placeholders = subcategoryIds.map(() => '?').join(',');
    let whereClause = `WHERE p.is_active = 1 AND p.subcategory_id IN (${placeholders})`;
    params.push(...subcategoryIds);

    if (min_price !== undefined) {
      whereClause += ' AND p.base_price >= ?';
      params.push(min_price);
    }

    if (max_price !== undefined) {
      whereClause += ' AND p.base_price <= ?';
      params.push(max_price);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Sort options
    const sortMap = {
      'price_asc': 'p.base_price ASC',
      'price_desc': 'p.base_price DESC',
      'newest': 'p.created_at DESC',
      'name': `p.product_name_${lang} ASC`,
      'popular': 'p.view_count DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const nameField = lang === 'ar' ? 'p.product_name_ar' : 'p.product_name_en';

    const sql = `
      SELECT
        p.product_id,
        ${nameField} as name,
        p.product_name_en,
        p.product_name_ar,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        p.average_rating,
        p.rating_count as review_count,
        p.category_id,
        p.subcategory_id,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as primary_image,
        c.category_name_${lang} as category_name,
        sc.subcategory_name_${lang} as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const products = await query(sql, params);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Submit product review
   */
  static async submitReview(data) {
    const { product_id, user_id, reviewer_name, rating, review_text } = data;

    let result;
    try {
      // Try inserting with reviewer_name column
      result = await query(`
        INSERT INTO product_reviews (
          product_id,
          user_id,
          reviewer_name,
          rating,
          review_text,
          is_approved,
          created_at
        ) VALUES (?, ?, ?, ?, ?, 0, NOW())
      `, [product_id, user_id, reviewer_name, rating, review_text]);
    } catch (err) {
      // Fallback if reviewer_name column doesn't exist yet
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        result = await query(`
          INSERT INTO product_reviews (
            product_id,
            user_id,
            rating,
            review_text,
            is_approved,
            created_at
          ) VALUES (?, ?, ?, ?, 0, NOW())
        `, [product_id, user_id, rating, review_text]);
      } else {
        throw err;
      }
    }

    // Update product average rating
    await query(`
      UPDATE products SET
        rating_average = (SELECT AVG(rating) FROM product_reviews WHERE product_id = ? AND is_approved = 1),
        rating_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = ? AND is_approved = 1)
      WHERE product_id = ?
    `, [product_id, product_id, product_id]);

    return {
      review_id: result.insertId,
      product_id,
      reviewer_name,
      rating,
      review_text,
    };
  }
}

module.exports = PublicModel;
