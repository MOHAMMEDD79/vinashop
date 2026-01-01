/**
 * Image Model
 * @module models/image
 */

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Image Model - Handles image database operations for products, categories, banners, etc.
 */
class Image {
  // ==================== Product Images ====================

  /**
   * Get all images for a product
   */
  static async getProductImages(productId) {
    const sql = `
      SELECT 
        image_id,
        product_id,
        image_url,
        alt_text,
        display_order,
        is_primary,
        created_at,
        updated_at
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC
    `;

    return await query(sql, [productId]);
  }

  /**
   * Get image by ID
   */
  static async getById(imageId) {
    const sql = `
      SELECT 
        image_id,
        product_id,
        image_url,
        alt_text,
        display_order,
        is_primary,
        created_at,
        updated_at
      FROM product_images
      WHERE image_id = ?
    `;

    const results = await query(sql, [imageId]);
    return results[0] || null;
  }

  /**
   * Get primary image for a product
   */
  static async getPrimaryImage(productId) {
    const sql = `
      SELECT 
        image_id,
        product_id,
        image_url,
        alt_text
      FROM product_images
      WHERE product_id = ? AND is_primary = 1
      LIMIT 1
    `;

    const results = await query(sql, [productId]);
    return results[0] || null;
  }

  /**
   * Create product image
   */
  static async createProductImage(data) {
    const {
      product_id,
      image_url,
      alt_text,
      display_order = 0,
      is_primary = false,
    } = data;

    // If this is set as primary, unset other primaries first
    if (is_primary) {
      await query(
        'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
        [product_id]
      );
    }

    const sql = `
      INSERT INTO product_images (
        product_id,
        image_url,
        alt_text,
        display_order,
        is_primary,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      product_id,
      image_url,
      alt_text || null,
      display_order,
      is_primary ? 1 : 0,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Create multiple product images
   */
  static async createMultipleProductImages(productId, images) {
    const created = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const result = await this.createProductImage({
        product_id: productId,
        image_url: image.image_url || image,
        alt_text: image.alt_text || null,
        display_order: image.display_order || i,
        is_primary: i === 0 && !await this.getPrimaryImage(productId),
      });
      created.push(result);
    }

    return created;
  }

  /**
   * Update product image
   */
  static async updateProductImage(imageId, data) {
    const allowedFields = ['image_url', 'alt_text', 'display_order', 'is_primary'];
    const updates = [];
    const values = [];

    const image = await this.getById(imageId);
    if (!image) return null;

    // Handle primary flag
    if (data.is_primary === true) {
      await query(
        'UPDATE product_images SET is_primary = 0 WHERE product_id = ? AND image_id != ?',
        [image.product_id, imageId]
      );
    }

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getById(imageId);
    }

    updates.push('updated_at = NOW()');
    values.push(imageId);

    const sql = `UPDATE product_images SET ${updates.join(', ')} WHERE image_id = ?`;
    await query(sql, values);

    return await this.getById(imageId);
  }

  /**
   * Delete product image
   */
  static async deleteProductImage(imageId) {
    const image = await this.getById(imageId);
    if (!image) return false;

    const sql = 'DELETE FROM product_images WHERE image_id = ?';
    const result = await query(sql, [imageId]);

    // If deleted image was primary, set another as primary
    if (image.is_primary && result.affectedRows > 0) {
      await query(
        `UPDATE product_images 
         SET is_primary = 1 
         WHERE product_id = ? 
         ORDER BY display_order ASC 
         LIMIT 1`,
        [image.product_id]
      );
    }

    return result.affectedRows > 0;
  }

  /**
   * Delete all images for a product
   */
  static async deleteProductImages(productId) {
    const sql = 'DELETE FROM product_images WHERE product_id = ?';
    const result = await query(sql, [productId]);
    return result.affectedRows;
  }

  /**
   * Set image as primary
   */
  static async setPrimaryImage(imageId) {
    const image = await this.getById(imageId);
    if (!image) return null;

    // Unset current primary
    await query(
      'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
      [image.product_id]
    );

    // Set new primary
    await query(
      'UPDATE product_images SET is_primary = 1, updated_at = NOW() WHERE image_id = ?',
      [imageId]
    );

    return await this.getById(imageId);
  }

  /**
   * Update display order for multiple images
   */
  static async updateDisplayOrder(images) {
    for (const img of images) {
      await query(
        'UPDATE product_images SET display_order = ?, updated_at = NOW() WHERE image_id = ?',
        [img.display_order, img.image_id]
      );
    }
    return true;
  }

  /**
   * Get image count for product
   */
  static async getProductImageCount(productId) {
    const sql = 'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?';
    const results = await query(sql, [productId]);
    return results[0].count;
  }

  // ==================== Banner Images ====================

  /**
   * Get all banners
   */
  static async getAllBanners(options = {}) {
    const {
      page = 1,
      limit = 10,
      is_active,
      position,
      sort = 'display_order',
      order = 'ASC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    const titleField = `title_${lang}`;

    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (position) {
      whereClause += ' AND position = ?';
      params.push(position);
    }

    const countSql = `SELECT COUNT(*) as total FROM banners ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        banner_id,
        title_en,
        title_ar,
        title_he,
        ${titleField} as title,
        subtitle_en,
        subtitle_ar,
        subtitle_he,
        image_url,
        mobile_image_url,
        link_url,
        link_target,
        position,
        display_order,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
      FROM banners
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const banners = await query(sql, params);

    return {
      data: banners,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get active banners for display
   */
  static async getActiveBanners(options = {}) {
    const { position, limit = 10, lang = 'en' } = options;

    const titleField = `title_${lang}`;
    const subtitleField = `subtitle_${lang}`;

    let sql = `
      SELECT 
        banner_id,
        ${titleField} as title,
        ${subtitleField} as subtitle,
        image_url,
        mobile_image_url,
        link_url,
        link_target,
        position,
        display_order
      FROM banners
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    `;

    const params = [];

    if (position) {
      sql += ' AND position = ?';
      params.push(position);
    }

    sql += ' ORDER BY display_order ASC LIMIT ?';
    params.push(limit);

    return await query(sql, params);
  }

  /**
   * Get banner by ID
   */
  static async getBannerById(bannerId, lang = 'en') {
    const titleField = `title_${lang}`;
    const subtitleField = `subtitle_${lang}`;

    const sql = `
      SELECT 
        banner_id,
        title_en,
        title_ar,
        title_he,
        ${titleField} as title,
        subtitle_en,
        subtitle_ar,
        subtitle_he,
        ${subtitleField} as subtitle,
        image_url,
        mobile_image_url,
        link_url,
        link_target,
        position,
        display_order,
        start_date,
        end_date,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM banners
      WHERE banner_id = ?
    `;

    const results = await query(sql, [bannerId]);
    return results[0] || null;
  }

  /**
   * Create banner
   */
  static async createBanner(data) {
    const {
      title_en,
      title_ar,
      title_he,
      subtitle_en,
      subtitle_ar,
      subtitle_he,
      image_url,
      mobile_image_url,
      link_url,
      link_target = '_self',
      position = 'home',
      display_order = 0,
      start_date,
      end_date,
      is_active = true,
      created_by,
    } = data;

    const sql = `
      INSERT INTO banners (
        title_en,
        title_ar,
        title_he,
        subtitle_en,
        subtitle_ar,
        subtitle_he,
        image_url,
        mobile_image_url,
        link_url,
        link_target,
        position,
        display_order,
        start_date,
        end_date,
        is_active,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      title_en || null,
      title_ar || null,
      title_he || null,
      subtitle_en || null,
      subtitle_ar || null,
      subtitle_he || null,
      image_url,
      mobile_image_url || null,
      link_url || null,
      link_target,
      position,
      display_order,
      start_date || null,
      end_date || null,
      is_active ? 1 : 0,
      created_by || null,
    ]);

    return await this.getBannerById(result.insertId);
  }

  /**
   * Update banner
   */
  static async updateBanner(bannerId, data) {
    const allowedFields = [
      'title_en',
      'title_ar',
      'title_he',
      'subtitle_en',
      'subtitle_ar',
      'subtitle_he',
      'image_url',
      'mobile_image_url',
      'link_url',
      'link_target',
      'position',
      'display_order',
      'start_date',
      'end_date',
      'is_active',
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getBannerById(bannerId);
    }

    updates.push('updated_at = NOW()');
    values.push(bannerId);

    const sql = `UPDATE banners SET ${updates.join(', ')} WHERE banner_id = ?`;
    await query(sql, values);

    return await this.getBannerById(bannerId);
  }

  /**
   * Delete banner
   */
  static async deleteBanner(bannerId) {
    const sql = 'DELETE FROM banners WHERE banner_id = ?';
    const result = await query(sql, [bannerId]);
    return result.affectedRows > 0;
  }

  /**
   * Toggle banner active status
   */
  static async toggleBannerStatus(bannerId) {
    const banner = await this.getBannerById(bannerId);
    if (!banner) return null;

    const newStatus = banner.is_active ? 0 : 1;

    await query(
      'UPDATE banners SET is_active = ?, updated_at = NOW() WHERE banner_id = ?',
      [newStatus, bannerId]
    );

    return await this.getBannerById(bannerId);
  }

  /**
   * Update banner display order
   */
  static async updateBannerDisplayOrder(banners) {
    for (const banner of banners) {
      await query(
        'UPDATE banners SET display_order = ?, updated_at = NOW() WHERE banner_id = ?',
        [banner.display_order, banner.banner_id]
      );
    }
    return true;
  }

  // ==================== Category Images ====================

  /**
   * Update category image
   */
  static async updateCategoryImage(categoryId, imageUrl) {
    const sql = `
      UPDATE categories 
      SET image_url = ?, updated_at = NOW()
      WHERE category_id = ?
    `;

    await query(sql, [imageUrl, categoryId]);
    return true;
  }

  /**
   * Delete category image
   */
  static async deleteCategoryImage(categoryId) {
    const sql = `
      UPDATE categories 
      SET image_url = NULL, updated_at = NOW()
      WHERE category_id = ?
    `;

    await query(sql, [categoryId]);
    return true;
  }

  // ==================== Subcategory Images ====================

  /**
   * Update subcategory image
   */
  static async updateSubcategoryImage(subcategoryId, imageUrl) {
    const sql = `
      UPDATE subcategories 
      SET image_url = ?, updated_at = NOW()
      WHERE subcategory_id = ?
    `;

    await query(sql, [imageUrl, subcategoryId]);
    return true;
  }

  /**
   * Delete subcategory image
   */
  static async deleteSubcategoryImage(subcategoryId) {
    const sql = `
      UPDATE subcategories 
      SET image_url = NULL, updated_at = NOW()
      WHERE subcategory_id = ?
    `;

    await query(sql, [subcategoryId]);
    return true;
  }

  // ==================== User Avatars ====================

  /**
   * Update user avatar
   */
  static async updateUserAvatar(userId, imageUrl) {
    const sql = `
      UPDATE users 
      SET profile_image = ?, updated_at = NOW()
      WHERE user_id = ?
    `;

    await query(sql, [imageUrl, userId]);
    return true;
  }

  /**
   * Delete user avatar
   */
  static async deleteUserAvatar(userId) {
    const sql = `
      UPDATE users 
      SET profile_image = NULL, updated_at = NOW()
      WHERE user_id = ?
    `;

    await query(sql, [userId]);
    return true;
  }

  // ==================== Admin Avatars ====================

  /**
   * Update admin avatar
   */
  static async updateAdminAvatar(adminId, imageUrl) {
    const sql = `
      UPDATE admin_users 
      SET profile_image = ?, updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [imageUrl, adminId]);
    return true;
  }

  /**
   * Delete admin avatar
   */
  static async deleteAdminAvatar(adminId) {
    const sql = `
      UPDATE admin_users 
      SET profile_image = NULL, updated_at = NOW()
      WHERE admin_id = ?
    `;

    await query(sql, [adminId]);
    return true;
  }

  // ==================== Utility Methods ====================

  /**
   * Delete image file from filesystem
   */
  static async deleteImageFile(imageUrl) {
    if (!imageUrl) return false;

    try {
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error('Error deleting image file:', error);
    }
    return false;
  }

  /**
   * Get image statistics
   */
  static async getStatistics() {
    const productImages = await query('SELECT COUNT(*) as count FROM product_images');
    const banners = await query('SELECT COUNT(*) as count FROM banners');
    const activeBanners = await query('SELECT COUNT(*) as count FROM banners WHERE is_active = 1');

    const categoriesWithImages = await query(
      'SELECT COUNT(*) as count FROM categories WHERE image_url IS NOT NULL'
    );
    const subcategoriesWithImages = await query(
      'SELECT COUNT(*) as count FROM subcategories WHERE image_url IS NOT NULL'
    );
    const usersWithAvatars = await query(
      'SELECT COUNT(*) as count FROM users WHERE profile_image IS NOT NULL'
    );

    return {
      product_images: productImages[0].count,
      banners: banners[0].count,
      active_banners: activeBanners[0].count,
      categories_with_images: categoriesWithImages[0].count,
      subcategories_with_images: subcategoriesWithImages[0].count,
      users_with_avatars: usersWithAvatars[0].count,
    };
  }

  /**
   * Get unused images (images not referenced in database)
   */
  static async getUnusedImages(directory = 'uploads/products') {
    // Get all images from database
    const productImages = await query('SELECT image_url FROM product_images');
    const mainImages = await query('SELECT main_image FROM products WHERE main_image IS NOT NULL');

    const usedImages = new Set([
      ...productImages.map(i => i.image_url),
      ...mainImages.map(i => i.main_image),
    ]);

    // Get all files in directory
    const uploadsDir = path.join(process.cwd(), directory);
    const unused = [];

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = `${directory}/${file}`;
        if (!usedImages.has(filePath)) {
          unused.push(filePath);
        }
      }
    }

    return unused;
  }

  /**
   * Clean up unused images
   */
  static async cleanupUnusedImages(directory = 'uploads/products') {
    const unusedImages = await this.getUnusedImages(directory);
    let deleted = 0;

    for (const imageUrl of unusedImages) {
      const success = await this.deleteImageFile(imageUrl);
      if (success) deleted++;
    }

    return { deleted, total: unusedImages.length };
  }

  /**
   * Bulk delete images
   */
  static async bulkDeleteProductImages(imageIds) {
    if (!imageIds || imageIds.length === 0) {
      return { deleted: 0 };
    }

    const placeholders = imageIds.map(() => '?').join(',');
    const sql = `DELETE FROM product_images WHERE image_id IN (${placeholders})`;
    const result = await query(sql, imageIds);
    return { deleted: result.affectedRows };
  }

  /**
   * Replace product image
   */
  static async replaceProductImage(imageId, newImageUrl) {
    const image = await this.getById(imageId);
    if (!image) return null;

    // Delete old file
    await this.deleteImageFile(image.image_url);

    // Update database
    await query(
      'UPDATE product_images SET image_url = ?, updated_at = NOW() WHERE image_id = ?',
      [newImageUrl, imageId]
    );

    return await this.getById(imageId);
  }

  /**
   * Get banner positions
   */
  static async getBannerPositions() {
    const sql = `
      SELECT DISTINCT position, COUNT(*) as count
      FROM banners
      GROUP BY position
      ORDER BY position
    `;

    return await query(sql);
  }

  /**
   * Check if image exists
   */
  static async imageExists(imageUrl) {
    if (!imageUrl) return false;

    const filePath = path.join(process.cwd(), imageUrl);
    return fs.existsSync(filePath);
  }

  /**
   * Get products without images
   */
  static async getProductsWithoutImages(limit = 50) {
    const sql = `
      SELECT 
        p.product_id,
        p.product_name_en,
        p.sku
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE pi.image_id IS NULL AND p.main_image IS NULL
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }
}

module.exports = Image;