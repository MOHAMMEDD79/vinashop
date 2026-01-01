/**
 * Review Model
 * @module models/review
 */

const { query } = require('../config/database');

/**
 * Review Model - Handles product reviews database operations
 */
class Review {
  /**
   * Get all reviews with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      rating,
      product_id,
      user_id,
      is_verified,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'DESC',
      lang = 'en',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    const nameField = `p.product_name_${lang}`;

    if (search) {
      whereClause += ' AND (r.title LIKE ? OR r.review_text LIKE ? OR u.username LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND r.status = ?';
      params.push(status);
    }

    if (rating) {
      whereClause += ' AND r.rating = ?';
      params.push(rating);
    }

    if (product_id) {
      whereClause += ' AND r.product_id = ?';
      params.push(product_id);
    }

    if (user_id) {
      whereClause += ' AND r.user_id = ?';
      params.push(user_id);
    }

    if (is_verified !== undefined) {
      whereClause += ' AND r.is_verified_purchase = ?';
      params.push(is_verified ? 1 : 0);
    }

    if (date_from) {
      whereClause += ' AND DATE(r.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(r.created_at) <= ?';
      params.push(date_to);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['review_id', 'rating', 'status', 'created_at', 'helpful_count'];
    const sortColumn = allowedSorts.includes(sort) ? `r.${sort}` : 'r.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        r.*,
        u.username,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.profile_image as user_avatar,
        ${nameField} as product_name,
        p.sku as product_sku,
        COALESCE(pi.image_url, p.main_image) as product_image
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const reviews = await query(sql, params);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get review by ID
   */
  static async getById(reviewId, lang = 'en') {
    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT 
        r.*,
        u.username,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.profile_image as user_avatar,
        ${nameField} as product_name,
        p.sku as product_sku,
        COALESCE(pi.image_url, p.main_image) as product_image
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE r.review_id = ?
    `;

    const results = await query(sql, [reviewId]);
    return results[0] || null;
  }

  /**
   * Get reviews by product
   */
  static async getByProductId(productId, options = {}) {
    const { page = 1, limit = 10, status = 'approved', sort = 'created_at', order = 'DESC' } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE r.product_id = ?';
    const params = [productId];

    if (status) {
      whereClause += ' AND r.status = ?';
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM product_reviews r ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const allowedSorts = ['created_at', 'rating', 'helpful_count'];
    const sortColumn = allowedSorts.includes(sort) ? `r.${sort}` : 'r.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        r.*,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_image as user_avatar
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const reviews = await query(sql, params);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get reviews by user
   */
  static async getByUserId(userId, options = {}) {
    const { page = 1, limit = 10, lang = 'en' } = options;
    const offset = (page - 1) * limit;

    const nameField = `p.product_name_${lang}`;

    const countSql = 'SELECT COUNT(*) as total FROM product_reviews WHERE user_id = ?';
    const countResult = await query(countSql, [userId]);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        r.*,
        ${nameField} as product_name,
        COALESCE(pi.image_url, p.main_image) as product_image
      FROM product_reviews r
      LEFT JOIN products p ON r.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const reviews = await query(sql, [userId, limit, offset]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new review
   */
  static async create(data) {
    const {
      product_id,
      user_id,
      rating,
      title,
      review_text,
      pros,
      cons,
      is_verified_purchase = false,
      status = 'pending',
      ip_address,
      user_agent,
    } = data;

    const sql = `
      INSERT INTO product_reviews (
        product_id,
        user_id,
        rating,
        title,
        review_text,
        pros,
        cons,
        is_verified_purchase,
        status,
        ip_address,
        user_agent,
        helpful_count,
        not_helpful_count,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())
    `;

    const result = await query(sql, [
      product_id,
      user_id,
      rating,
      title || null,
      review_text,
      pros || null,
      cons || null,
      is_verified_purchase ? 1 : 0,
      status,
      ip_address || null,
      user_agent || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update review
   */
  static async update(reviewId, data) {
    const allowedFields = [
      'rating',
      'title',
      'review_text',
      'pros',
      'cons',
      'status',
      'is_verified_purchase',
      'admin_response',
      'response_by',
      'response_at',
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
      return await this.getById(reviewId);
    }

    updates.push('updated_at = NOW()');
    values.push(reviewId);

    const sql = `UPDATE product_reviews SET ${updates.join(', ')} WHERE review_id = ?`;
    await query(sql, values);

    return await this.getById(reviewId);
  }

  /**
   * Delete review
   */
  static async delete(reviewId) {
    // Delete review images
    await query('DELETE FROM review_images WHERE review_id = ?', [reviewId]);

    // Delete helpful votes
    await query('DELETE FROM review_helpful WHERE review_id = ?', [reviewId]);

    const sql = 'DELETE FROM product_reviews WHERE review_id = ?';
    const result = await query(sql, [reviewId]);
    return result.affectedRows > 0;
  }

  /**
   * Update review status
   */
  static async updateStatus(reviewId, status, updatedBy = null) {
    let sql = 'UPDATE product_reviews SET status = ?, updated_at = NOW()';
    const params = [status];

    if (status === 'approved') {
      sql += ', approved_at = NOW(), approved_by = ?';
      params.push(updatedBy);
    } else if (status === 'rejected') {
      sql += ', rejected_at = NOW(), rejected_by = ?';
      params.push(updatedBy);
    }

    sql += ' WHERE review_id = ?';
    params.push(reviewId);

    await query(sql, params);

    // Update product average rating
    const review = await this.getById(reviewId);
    if (review) {
      await this.updateProductRating(review.product_id);
    }

    return await this.getById(reviewId);
  }

  /**
   * Add admin response
   */
  static async addResponse(reviewId, response, adminId) {
    const sql = `
      UPDATE product_reviews 
      SET admin_response = ?, response_by = ?, response_at = NOW(), updated_at = NOW()
      WHERE review_id = ?
    `;

    await query(sql, [response, adminId, reviewId]);
    return await this.getById(reviewId);
  }

  /**
   * Remove admin response
   */
  static async removeResponse(reviewId) {
    const sql = `
      UPDATE product_reviews 
      SET admin_response = NULL, response_by = NULL, response_at = NULL, updated_at = NOW()
      WHERE review_id = ?
    `;

    await query(sql, [reviewId]);
    return await this.getById(reviewId);
  }

  /**
   * Mark as helpful
   */
  static async markHelpful(reviewId, userId, isHelpful = true) {
    // Check if user already voted
    const existingSql = 'SELECT * FROM review_helpful WHERE review_id = ? AND user_id = ?';
    const existing = await query(existingSql, [reviewId, userId]);

    if (existing.length > 0) {
      // Update existing vote
      if (existing[0].is_helpful !== (isHelpful ? 1 : 0)) {
        await query(
          'UPDATE review_helpful SET is_helpful = ? WHERE review_id = ? AND user_id = ?',
          [isHelpful ? 1 : 0, reviewId, userId]
        );
      }
    } else {
      // Insert new vote
      await query(
        'INSERT INTO review_helpful (review_id, user_id, is_helpful, created_at) VALUES (?, ?, ?, NOW())',
        [reviewId, userId, isHelpful ? 1 : 0]
      );
    }

    // Update counts
    await this.updateHelpfulCounts(reviewId);

    return await this.getById(reviewId);
  }

  /**
   * Remove helpful vote
   */
  static async removeHelpfulVote(reviewId, userId) {
    const sql = 'DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?';
    await query(sql, [reviewId, userId]);

    await this.updateHelpfulCounts(reviewId);

    return await this.getById(reviewId);
  }

  /**
   * Update helpful counts
   */
  static async updateHelpfulCounts(reviewId) {
    const sql = `
      UPDATE product_reviews r
      SET 
        helpful_count = (SELECT COUNT(*) FROM review_helpful WHERE review_id = ? AND is_helpful = 1),
        not_helpful_count = (SELECT COUNT(*) FROM review_helpful WHERE review_id = ? AND is_helpful = 0)
      WHERE r.review_id = ?
    `;

    await query(sql, [reviewId, reviewId, reviewId]);
  }

  /**
   * Update product average rating
   */
  static async updateProductRating(productId) {
    const sql = `
      UPDATE products p
      SET 
        avg_rating = (
          SELECT COALESCE(AVG(rating), 0) 
          FROM product_reviews 
          WHERE product_id = ? AND status = 'approved'
        ),
        review_count = (
          SELECT COUNT(*) 
          FROM product_reviews 
          WHERE product_id = ? AND status = 'approved'
        )
      WHERE p.product_id = ?
    `;

    await query(sql, [productId, productId, productId]);
  }

  /**
   * Get product rating summary
   */
  static async getProductRatingSummary(productId) {
    const sql = `
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
        SUM(CASE WHEN is_verified_purchase = 1 THEN 1 ELSE 0 END) as verified_purchases
      FROM product_reviews
      WHERE product_id = ? AND status = 'approved'
    `;

    const results = await query(sql, [productId]);
    return results[0];
  }

  /**
   * Check if user can review product
   */
  static async canUserReview(userId, productId) {
    // Check if user already reviewed this product
    const existingSql = 'SELECT review_id FROM product_reviews WHERE user_id = ? AND product_id = ?';
    const existing = await query(existingSql, [userId, productId]);

    if (existing.length > 0) {
      return { canReview: false, reason: 'already_reviewed', existingReviewId: existing[0].review_id };
    }

    // Check if user has purchased this product
    const purchaseSql = `
      SELECT COUNT(*) as count 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'delivered'
    `;
    const purchaseResult = await query(purchaseSql, [userId, productId]);

    const hasPurchased = purchaseResult[0].count > 0;

    return { canReview: true, isVerifiedPurchase: hasPurchased };
  }

  /**
   * Get review statistics
   */
  static async getStatistics(options = {}) {
    const { period = 'all' } = options;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = 'AND DATE(created_at) = CURDATE()';
    } else if (period === 'week') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    const sql = `
      SELECT 
        COUNT(*) as total_reviews,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reviews,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reviews,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_reviews,
        SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_reviews,
        SUM(CASE WHEN is_verified_purchase = 1 THEN 1 ELSE 0 END) as verified_purchases,
        SUM(CASE WHEN admin_response IS NOT NULL THEN 1 ELSE 0 END) as responded_reviews,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_reviews
      FROM product_reviews
      WHERE 1=1 ${dateFilter}
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get pending count
   */
  static async getPendingCount() {
    const sql = "SELECT COUNT(*) as count FROM product_reviews WHERE status = 'pending'";
    const results = await query(sql);
    return results[0].count;
  }

  /**
   * Get recent reviews
   */
  static async getRecent(options = {}) {
    const { limit = 10, status, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    let sql = `
      SELECT 
        r.review_id,
        r.rating,
        r.title,
        r.review_text,
        r.status,
        r.created_at,
        u.username,
        ${nameField} as product_name
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ?';
    params.push(limit);

    return await query(sql, params);
  }

  /**
   * Search reviews
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT 
        r.review_id,
        r.rating,
        r.title,
        r.review_text,
        r.status,
        r.created_at,
        u.username,
        ${nameField} as product_name
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE 
        r.title LIKE ? OR
        r.review_text LIKE ? OR
        u.username LIKE ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, limit]);
  }

  /**
   * Bulk update status
   */
  static async bulkUpdateStatus(reviewIds, status, updatedBy = null) {
    if (!reviewIds || reviewIds.length === 0) {
      return { updated: 0 };
    }

    const placeholders = reviewIds.map(() => '?').join(',');
    let sql = `UPDATE product_reviews SET status = ?, updated_at = NOW()`;
    const params = [status];

    if (status === 'approved') {
      sql += ', approved_at = NOW(), approved_by = ?';
      params.push(updatedBy);
    } else if (status === 'rejected') {
      sql += ', rejected_at = NOW(), rejected_by = ?';
      params.push(updatedBy);
    }

    sql += ` WHERE review_id IN (${placeholders})`;

    const result = await query(sql, [...params, ...reviewIds]);

    // Update product ratings for affected products
    const productsSql = `SELECT DISTINCT product_id FROM product_reviews WHERE review_id IN (${placeholders})`;
    const products = await query(productsSql, reviewIds);
    for (const product of products) {
      await this.updateProductRating(product.product_id);
    }

    return { updated: result.affectedRows };
  }

  /**
   * Bulk delete reviews
   */
  static async bulkDelete(reviewIds) {
    if (!reviewIds || reviewIds.length === 0) {
      return { deleted: 0 };
    }

    // Get affected products first
    const placeholders = reviewIds.map(() => '?').join(',');
    const productsSql = `SELECT DISTINCT product_id FROM product_reviews WHERE review_id IN (${placeholders})`;
    const products = await query(productsSql, reviewIds);

    // Delete related data
    await query(`DELETE FROM review_images WHERE review_id IN (${placeholders})`, reviewIds);
    await query(`DELETE FROM review_helpful WHERE review_id IN (${placeholders})`, reviewIds);

    const sql = `DELETE FROM product_reviews WHERE review_id IN (${placeholders})`;
    const result = await query(sql, reviewIds);

    // Update product ratings
    for (const product of products) {
      await this.updateProductRating(product.product_id);
    }

    return { deleted: result.affectedRows };
  }

  /**
   * Get reviews for export
   */
  static async getAllForExport(options = {}) {
    const { status, date_from, date_to, product_id, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    let sql = `
      SELECT 
        r.*,
        u.username,
        u.email as user_email,
        ${nameField} as product_name,
        p.sku as product_sku
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    if (product_id) {
      sql += ' AND r.product_id = ?';
      params.push(product_id);
    }

    if (date_from) {
      sql += ' AND DATE(r.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      sql += ' AND DATE(r.created_at) <= ?';
      params.push(date_to);
    }

    sql += ' ORDER BY r.created_at DESC';

    return await query(sql, params);
  }

  /**
   * Get rating distribution
   */
  static async getRatingDistribution(options = {}) {
    const { product_id, date_from, date_to } = options;

    let whereClause = "WHERE status = 'approved'";
    const params = [];

    if (product_id) {
      whereClause += ' AND product_id = ?';
      params.push(product_id);
    }

    if (date_from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT 
        rating,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM product_reviews ${whereClause}), 2) as percentage
      FROM product_reviews
      ${whereClause}
      GROUP BY rating
      ORDER BY rating DESC
    `;

    return await query(sql, [...params, ...params]);
  }

  /**
   * Get top reviewed products
   */
  static async getTopReviewedProducts(options = {}) {
    const { limit = 10, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT 
        p.product_id,
        ${nameField} as product_name,
        p.sku,
        COUNT(r.review_id) as review_count,
        AVG(r.rating) as avg_rating,
        SUM(CASE WHEN r.rating >= 4 THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN r.rating <= 2 THEN 1 ELSE 0 END) as negative_count
      FROM products p
      JOIN product_reviews r ON p.product_id = r.product_id AND r.status = 'approved'
      GROUP BY p.product_id
      ORDER BY review_count DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Get reviews needing response
   */
  static async getNeedingResponse(options = {}) {
    const { limit = 20, rating_max = 3, lang = 'en' } = options;

    const nameField = `p.product_name_${lang}`;

    const sql = `
      SELECT 
        r.*,
        u.username,
        ${nameField} as product_name
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE r.status = 'approved' 
        AND r.admin_response IS NULL 
        AND r.rating <= ?
      ORDER BY r.rating ASC, r.created_at DESC
      LIMIT ?
    `;

    return await query(sql, [rating_max, limit]);
  }

  // ==================== Review Images ====================

  /**
   * Get review images
   */
  static async getImages(reviewId) {
    const sql = `
      SELECT image_id, review_id, image_url, display_order, created_at
      FROM review_images
      WHERE review_id = ?
      ORDER BY display_order ASC
    `;

    return await query(sql, [reviewId]);
  }

  /**
   * Add review image
   */
  static async addImage(reviewId, imageUrl, displayOrder = 0) {
    const sql = `
      INSERT INTO review_images (review_id, image_url, display_order, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    const result = await query(sql, [reviewId, imageUrl, displayOrder]);
    return result.insertId;
  }

  /**
   * Delete review image
   */
  static async deleteImage(imageId) {
    const sql = 'DELETE FROM review_images WHERE image_id = ?';
    const result = await query(sql, [imageId]);
    return result.affectedRows > 0;
  }

  /**
   * Delete all images for a review
   */
  static async deleteAllImages(reviewId) {
    const sql = 'DELETE FROM review_images WHERE review_id = ?';
    const result = await query(sql, [reviewId]);
    return result.affectedRows;
  }
}

module.exports = Review;