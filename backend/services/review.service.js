/**
 * Review Service
 * @module services/review
 */

const Review = require('../models/review.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const ImageService = require('./image.service');
const NotificationService = require('./notification.service');

class ReviewService {
  /**
   * Get all reviews with pagination
   */
  static async getAll(options = {}) {
    return await Review.getAll(options);
  }

  /**
   * Get review by ID
   */
  static async getById(reviewId) {
    const review = await Review.getById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    return review;
  }

  /**
   * Get reviews by product
   */
  static async getByProduct(productId, options = {}) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return await Review.getByProductId(productId, options);
  }

  /**
   * Get reviews by user
   */
  static async getByUser(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return await Review.getByUserId(userId, options);
  }

  /**
   * Get product rating summary
   */
  static async getProductSummary(productId) {
    const product = await Product.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return await Review.getProductRatingSummary(productId);
  }

  /**
   * Update review
   */
  static async update(reviewId, data) {
    const review = await Review.getById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    return await Review.update(reviewId, data);
  }

  /**
   * Delete review
   */
  static async delete(reviewId) {
    const review = await Review.getById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Delete review images
    const images = await Review.getImages(reviewId);
    for (const image of images) {
      await ImageService.deleteFile(image.image_url);
    }

    await Review.delete(reviewId);

    // Update product rating
    await Review.updateProductRating(review.product_id);

    return true;
  }

  /**
   * Update review status
   */
  static async updateStatus(reviewId, status, adminId = null) {
    const review = await Review.getById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const updatedReview = await Review.updateStatus(reviewId, status, adminId);

    // Update product rating if approved/rejected
    if (['approved', 'rejected'].includes(status)) {
      await Review.updateProductRating(review.product_id);
    }

    // Notify user
    if (review.user_id) {
      await NotificationService.sendReviewStatusNotification(
        review.user_id,
        reviewId,
        status
      );
    }

    return updatedReview;
  }

  /**
   * Approve review
   */
  static async approve(reviewId, adminId) {
    return await this.updateStatus(reviewId, 'approved', adminId);
  }

  /**
   * Reject review
   */
  static async reject(reviewId, adminId) {
    return await this.updateStatus(reviewId, 'rejected', adminId);
  }

  /**
   * Add admin response
   */
  static async addResponse(reviewId, response, adminId) {
    const review = await Review.getById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const updatedReview = await Review.addResponse(reviewId, response, adminId);

    // Notify user
    if (review.user_id) {
      await NotificationService.sendToUser(review.user_id, {
        notification_type: 'review',
        title: 'Response to Your Review',
        message: 'The store has responded to your review',
        data: { review_id: reviewId },
      });
    }

    return updatedReview;
  }

  /**
   * Remove admin response
   */
  static async removeResponse(reviewId) {
    const review = await Review.getById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    return await Review.removeResponse(reviewId);
  }

  /**
   * Get review images
   */
  static async getImages(reviewId) {
    const review = await Review.getById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    return await Review.getImages(reviewId);
  }

  /**
   * Delete review image
   */
  static async deleteImage(reviewId, imageId) {
    const review = await Review.getById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const images = await Review.getImages(reviewId);
    const image = images.find(img => img.image_id === imageId);
    
    if (!image) {
      throw new Error('Image not found');
    }

    await ImageService.deleteFile(image.image_url);
    await Review.deleteImage(imageId);

    return true;
  }

  /**
   * Get pending reviews count
   */
  static async getPendingCount() {
    return await Review.getPendingCount();
  }

  /**
   * Get recent reviews
   */
  static async getRecent(limit = 10) {
    return await Review.getRecent(limit);
  }

  /**
   * Get reviews needing response (low ratings without admin response)
   */
  static async getNeedingResponse(options = {}) {
    return await Review.getNeedingResponse(options);
  }

  /**
   * Get rating distribution
   */
  static async getRatingDistribution(options = {}) {
    return await Review.getRatingDistribution(options);
  }

  /**
   * Get top reviewed products
   */
  static async getTopReviewedProducts(options = {}) {
    return await Review.getTopReviewedProducts(options);
  }

  /**
   * Get review statistics
   */
  static async getStatistics(options = {}) {
    return await Review.getStatistics(options);
  }

  /**
   * Search reviews
   */
  static async search(searchTerm, options = {}) {
    return await Review.search(searchTerm, options);
  }

  /**
   * Bulk update status
   */
  static async bulkUpdateStatus(reviewIds, status, adminId = null) {
    const result = await Review.bulkUpdateStatus(reviewIds, status, adminId);

    // Update product ratings for affected products
    const reviews = await Promise.all(
      reviewIds.map(id => Review.getById(id))
    );
    
    const productIds = [...new Set(reviews.filter(r => r).map(r => r.product_id))];
    for (const productId of productIds) {
      await Review.updateProductRating(productId);
    }

    return result;
  }

  /**
   * Bulk delete reviews
   */
  static async bulkDelete(reviewIds) {
    // Get reviews to update product ratings after deletion
    const reviews = await Promise.all(
      reviewIds.map(id => Review.getById(id))
    );

    // Delete images
    for (const reviewId of reviewIds) {
      try {
        const images = await Review.getImages(reviewId);
        for (const image of images) {
          await ImageService.deleteFile(image.image_url);
        }
      } catch (e) {
        // Continue
      }
    }

    const result = await Review.bulkDelete(reviewIds);

    // Update product ratings
    const productIds = [...new Set(reviews.filter(r => r).map(r => r.product_id))];
    for (const productId of productIds) {
      await Review.updateProductRating(productId);
    }

    return result;
  }

  /**
   * Export reviews
   */
  static async export(options = {}) {
    return await Review.getAllForExport(options);
  }
}

module.exports = ReviewService;