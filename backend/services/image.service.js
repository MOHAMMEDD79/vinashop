/**
 * Image Service
 * @module services/image
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const Image = require('../models/image.model');

class ImageService {
  static uploadDir = path.join(__dirname, '../../uploads');
  static productDir = path.join(ImageService.uploadDir, 'products');
  static categoryDir = path.join(ImageService.uploadDir, 'categories');
  static subcategoryDir = path.join(ImageService.uploadDir, 'subcategories');
  static userDir = path.join(ImageService.uploadDir, 'users');
  static adminDir = path.join(ImageService.uploadDir, 'admins');
  static bannerDir = path.join(ImageService.uploadDir, 'banners');
  static generalDir = path.join(ImageService.uploadDir, 'general');
  static variantDir = path.join(ImageService.uploadDir, 'variants');

  /**
   * Initialize upload directories
   */
  static async initDirectories() {
    const dirs = [
      this.uploadDir,
      this.productDir,
      this.categoryDir,
      this.subcategoryDir,
      this.userDir,
      this.adminDir,
      this.bannerDir,
      this.generalDir,
      this.variantDir,
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Generate unique filename
   */
  static generateFilename(originalName, prefix = '') {
    const ext = path.extname(originalName).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${prefix}${prefix ? '_' : ''}${timestamp}_${hash}${ext}`;
  }

  /**
   * Process and save image
   */
  static async processAndSave(file, targetDir, options = {}) {
    const {
      width,
      height,
      quality = 85,
      format = 'jpeg',
      prefix = '',
    } = options;

    await this.initDirectories();

    const filename = this.generateFilename(file.originalname, prefix);
    const filepath = path.join(targetDir, filename);

    let image = sharp(file.buffer);

    // Resize if dimensions provided
    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Format and quality
    if (format === 'jpeg' || format === 'jpg') {
      image = image.jpeg({ quality });
    } else if (format === 'png') {
      image = image.png({ quality });
    } else if (format === 'webp') {
      image = image.webp({ quality });
    }

    await image.toFile(filepath);

    // Return relative path for URL
    const relativePath = path.relative(this.uploadDir, filepath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Save product image
   */
  static async saveProductImage(file, productId) {
    return await this.processAndSave(file, this.productDir, {
      width: 1200,
      height: 1200,
      prefix: `product_${productId}`,
    });
  }

  /**
   * Save product thumbnail
   */
  static async saveProductThumbnail(file, productId) {
    return await this.processAndSave(file, this.productDir, {
      width: 300,
      height: 300,
      prefix: `thumb_${productId}`,
    });
  }

  /**
   * Save category image
   */
  static async saveCategoryImage(file, categoryId) {
    return await this.processAndSave(file, this.categoryDir, {
      width: 800,
      height: 600,
      prefix: `category_${categoryId}`,
    });
  }

  /**
   * Save subcategory image
   */
  static async saveSubcategoryImage(file, subcategoryId) {
    return await this.processAndSave(file, this.subcategoryDir, {
      width: 800,
      height: 600,
      prefix: `subcategory_${subcategoryId}`,
    });
  }

  /**
   * Save user avatar
   */
  static async saveUserAvatar(file, userId) {
    return await this.processAndSave(file, this.userDir, {
      width: 200,
      height: 200,
      prefix: `user_${userId}`,
    });
  }

  /**
   * Save admin avatar
   */
  static async saveAdminAvatar(file, adminId) {
    return await this.processAndSave(file, this.adminDir, {
      width: 200,
      height: 200,
      prefix: `admin_${adminId}`,
    });
  }

  /**
   * Save banner image
   */
  static async saveBannerImage(file, bannerId = '') {
    return await this.processAndSave(file, this.bannerDir, {
      width: 1920,
      height: 600,
      prefix: `banner_${bannerId}`,
    });
  }

  /**
   * Save variant image
   */
  static async saveVariantImage(file, variantId) {
    return await this.processAndSave(file, this.variantDir, {
      width: 800,
      height: 800,
      prefix: `variant_${variantId}`,
    });
  }

  /**
   * Save general image
   */
  static async saveGeneral(file) {
    return await this.processAndSave(file, this.generalDir, {
      width: 1200,
      height: 1200,
      prefix: 'img',
    });
  }

  /**
   * Delete file
   */
  static async deleteFile(fileUrl) {
    if (!fileUrl) return true;

    try {
      // Convert URL to filepath
      const filepath = path.join(
        this.uploadDir,
        fileUrl.replace('/uploads/', '')
      );

      await fs.access(filepath);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      // File doesn't exist or couldn't be deleted
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteFiles(fileUrls) {
    const results = [];
    for (const url of fileUrls) {
      const deleted = await this.deleteFile(url);
      results.push({ url, deleted });
    }
    return results;
  }

  // ==================== Product Images ====================

  /**
   * Get product images
   */
  static async getProductImages(productId) {
    return await Image.getByProductId(productId);
  }

  /**
   * Upload product images
   */
  static async uploadProductImages(productId, files) {
    const images = [];
    const existingImages = await Image.getByProductId(productId);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageUrl = await this.saveProductImage(file, productId);
      const isPrimary = existingImages.length === 0 && i === 0;

      const image = await Image.createProductImage({
        product_id: productId,
        image_url: imageUrl,
        is_primary: isPrimary,
        display_order: existingImages.length + i,
      });

      images.push(image);
    }

    return images;
  }

  /**
   * Set primary image
   */
  static async setPrimaryImage(productId, imageId) {
    return await Image.setPrimaryImage(productId, imageId);
  }

  /**
   * Reorder product images
   */
  static async reorderProductImages(productId, imageOrders) {
    return await Image.reorderProductImages(productId, imageOrders);
  }

  /**
   * Delete product image
   */
  static async deleteProductImage(productId, imageId) {
    const image = await Image.getById(imageId);
    if (!image || image.product_id !== productId) {
      throw new Error('Image not found');
    }

    await this.deleteFile(image.image_url);
    await Image.delete(imageId);

    return true;
  }

  // ==================== Banners ====================

  /**
   * Get all banners
   */
  static async getAllBanners(options = {}) {
    return await Image.getAllBanners(options);
  }

  /**
   * Get active banners
   */
  static async getActiveBanners(position = null) {
    return await Image.getActiveBanners(position);
  }

  /**
   * Get banner by ID
   */
  static async getBannerById(bannerId) {
    return await Image.getBannerById(bannerId);
  }

  /**
   * Create banner
   */
  static async createBanner(file, data) {
    const imageUrl = await this.saveBannerImage(file);

    return await Image.createBanner({
      ...data,
      image_url: imageUrl,
    });
  }

  /**
   * Update banner
   */
  static async updateBanner(bannerId, file, data) {
    const banner = await Image.getBannerById(bannerId);
    if (!banner) {
      throw new Error('Banner not found');
    }

    let imageUrl = banner.image_url;

    // Update image if new file provided
    if (file) {
      await this.deleteFile(banner.image_url);
      imageUrl = await this.saveBannerImage(file, bannerId);
    }

    return await Image.updateBanner(bannerId, {
      ...data,
      image_url: imageUrl,
    });
  }

  /**
   * Delete banner
   */
  static async deleteBanner(bannerId) {
    const banner = await Image.getBannerById(bannerId);
    if (!banner) {
      throw new Error('Banner not found');
    }

    await this.deleteFile(banner.image_url);
    return await Image.deleteBanner(bannerId);
  }

  /**
   * Toggle banner status
   */
  static async toggleBannerStatus(bannerId) {
    return await Image.toggleBannerStatus(bannerId);
  }

  // ==================== Utilities ====================

  /**
   * Get image statistics
   */
  static async getStatistics() {
    return await Image.getStatistics();
  }

  /**
   * Get unused images
   */
  static async getUnusedImages() {
    return await Image.getUnusedImages();
  }

  /**
   * Cleanup unused images
   */
  static async cleanupUnusedImages() {
    const unusedImages = await Image.getUnusedImages();
    
    for (const image of unusedImages) {
      await this.deleteFile(image.image_url);
    }

    return { deleted: unusedImages.length };
  }

  /**
   * Get products without images
   */
  static async getProductsWithoutImages() {
    return await Image.getProductsWithoutImages();
  }

  /**
   * Validate image file
   */
  static validateImageFile(file) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size: 5MB');
    }

    return true;
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(file) {
    const metadata = await sharp(file.buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  }
}

module.exports = ImageService;