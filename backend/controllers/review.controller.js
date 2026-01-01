/**
 * Review Controller
 * @module controllers/review
 * 
 * FIXED: Accepts both camelCase and snake_case, responses include both formats
 */

const reviewService = require('../services/review.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

/**
 * Helper: Format review for response
 */
const formatReview = (review, lang = 'en') => {
  if (!review) return null;

  return {
    id: review.review_id || review.id,
    reviewId: review.review_id || review.id,
    review_id: review.review_id || review.id,
    
    productId: review.product_id,
    product_id: review.product_id,
    productName: review.product_name,
    product_name: review.product_name,
    productImage: review.product_image,
    product_image: review.product_image,
    
    userId: review.user_id,
    user_id: review.user_id,
    userName: review.user_name || `${review.first_name || ''} ${review.last_name || ''}`.trim(),
    user_name: review.user_name || `${review.first_name || ''} ${review.last_name || ''}`.trim(),
    userEmail: review.user_email || review.email,
    user_email: review.user_email || review.email,
    userAvatar: review.user_avatar || review.profile_image,
    user_avatar: review.user_avatar || review.profile_image,
    
    rating: review.rating || 0,
    title: review.title,
    comment: review.comment,
    
    status: review.status || 'pending',
    isVerifiedPurchase: review.is_verified_purchase === 1 || review.is_verified_purchase === true,
    is_verified_purchase: review.is_verified_purchase === 1 || review.is_verified_purchase === true,
    verifiedPurchase: review.is_verified_purchase === 1 || review.is_verified_purchase === true,
    verified_purchase: review.is_verified_purchase === 1 || review.is_verified_purchase === true,
    
    isFeatured: review.is_featured === 1 || review.is_featured === true,
    is_featured: review.is_featured === 1 || review.is_featured === true,
    isFlagged: review.is_flagged === 1 || review.is_flagged === true,
    is_flagged: review.is_flagged === 1 || review.is_flagged === true,
    flagReason: review.flag_reason,
    flag_reason: review.flag_reason,
    
    helpfulCount: review.helpful_count || 0,
    helpful_count: review.helpful_count || 0,
    
    images: review.images || [],
    
    adminReply: review.admin_reply,
    admin_reply: review.admin_reply,
    adminReplyAt: review.admin_reply_at,
    admin_reply_at: review.admin_reply_at,
    adminReplyBy: review.admin_reply_by,
    admin_reply_by: review.admin_reply_by,
    
    rejectionReason: review.rejection_reason,
    rejection_reason: review.rejection_reason,
    
    createdAt: review.created_at,
    created_at: review.created_at,
    updatedAt: review.updated_at,
    updated_at: review.updated_at,
    approvedAt: review.approved_at,
    approved_at: review.approved_at,
    approvedBy: review.approved_by,
    approved_by: review.approved_by,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result, lang = 'en') => {
  const items = (result.items || result.data || result.reviews || []).map(r => formatReview(r, lang));
  return {
    items,
    data: items,
    reviews: items,
    pagination: {
      page: result.page || 1,
      limit: result.limit || 10,
      total: result.total || items.length,
      totalPages: result.totalPages || 1,
    },
    page: result.page || 1,
    limit: result.limit || 10,
    total: result.total || items.length,
    totalPages: result.totalPages || 1,
  };
};

/**
 * Get all reviews
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search, status, rating,
      product_id, productId, user_id, userId,
      date_from, dateFrom, date_to, dateTo,
      sort = 'created_at', order = 'DESC',
      sortBy, sort_by, sortOrder, sort_order,
      lang = 'en',
    } = req.query;

    const result = await reviewService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      rating: rating ? parseInt(rating) : undefined,
      product_id: parseInt(product_id || productId) || undefined,
      user_id: parseInt(user_id || userId) || undefined,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
      lang,
    });

    return successResponse(res, formatPaginationResponse(result, lang), 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get review by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const review = await reviewService.getById(id, lang);

    if (!review) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatReview(review, lang));
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews by product
 */
const getByProduct = async (req, res, next) => {
  try {
    const { product_id, productId } = req.params;
    const pId = product_id || productId;
    const { page = 1, limit = 10, status, rating, sort = 'created_at', order = 'DESC' } = req.query;

    const result = await reviewService.getByProduct(pId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      rating: rating ? parseInt(rating) : undefined,
      sort,
      order,
    });

    return successResponse(res, formatPaginationResponse(result), 'Product reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews by user
 */
const getByUser = async (req, res, next) => {
  try {
    const { user_id, userId } = req.params;
    const uId = user_id || userId;
    const { page = 1, limit = 10, status } = req.query;

    const result = await reviewService.getByUser(uId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });

    return successResponse(res, formatPaginationResponse(result), 'User reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending reviews
 */
const getPending = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewService.getPending({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Pending reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending reviews count
 */
const getPendingCount = async (req, res, next) => {
  try {
    const count = await reviewService.getPendingCount();
    return successResponse(res, { count, pendingCount: count, pending_count: count }, 'Pending reviews count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Approve review
 */
const approve = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingReview.status === 'approved') {
      return errorResponse(res, 'Review is already approved', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const review = await reviewService.approve(id, req.admin?.adminId);

    return successResponse(res, formatReview(review), 'Review approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject review
 */
const reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, rejection_reason, rejectionReason } = req.body;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingReview.status === 'rejected') {
      return errorResponse(res, 'Review is already rejected', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const review = await reviewService.reject(id, {
      reason: reason || rejection_reason || rejectionReason,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, formatReview(review), 'Review rejected successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update review status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason, rejection_reason, rejectionReason } = req.body;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const review = await reviewService.updateStatus(id, {
      status,
      reason: reason || rejection_reason || rejectionReason,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, formatReview(review), `Review status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await reviewService.remove(id);

    return successResponse(res, null, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk approve reviews
 */
const bulkApprove = async (req, res, next) => {
  try {
    const { review_ids, reviewIds, ids } = req.body;
    const idList = review_ids || reviewIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Review IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await reviewService.bulkApprove(idList, req.admin?.adminId);

    return successResponse(res, result, `${result.approved} reviews approved successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk reject reviews
 */
const bulkReject = async (req, res, next) => {
  try {
    const { review_ids, reviewIds, ids, reason, rejection_reason, rejectionReason } = req.body;
    const idList = review_ids || reviewIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Review IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await reviewService.bulkReject(idList, {
      reason: reason || rejection_reason || rejectionReason,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, result, `${result.rejected} reviews rejected successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete reviews
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { review_ids, reviewIds, ids } = req.body;
    const idList = review_ids || reviewIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Review IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await reviewService.bulkDelete(idList);

    return successResponse(res, result, `${result.deleted} reviews deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to review
 */
const reply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply, reply_message, replyMessage, admin_reply, adminReply } = req.body;
    const replyText = reply || reply_message || replyMessage || admin_reply || adminReply;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!replyText || replyText.trim() === '') {
      return errorResponse(res, 'Reply message is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const review = await reviewService.reply(id, {
      reply: replyText,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, formatReview(review), 'Reply added successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update reply
 */
const updateReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply, reply_message, replyMessage, admin_reply, adminReply } = req.body;
    const replyText = reply || reply_message || replyMessage || admin_reply || adminReply;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!existingReview.admin_reply) {
      return errorResponse(res, 'No reply exists to update', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    if (!replyText || replyText.trim() === '') {
      return errorResponse(res, 'Reply message is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const review = await reviewService.updateReply(id, {
      reply: replyText,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, formatReview(review), 'Reply updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete reply
 */
const deleteReply = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!existingReview.admin_reply) {
      return errorResponse(res, 'No reply exists to delete', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const review = await reviewService.deleteReply(id);

    return successResponse(res, formatReview(review), 'Reply deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Flag review as inappropriate
 */
const flag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, flag_reason, flagReason } = req.body;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const review = await reviewService.flag(id, {
      reason: reason || flag_reason || flagReason,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, formatReview(review), 'Review flagged successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Unflag review
 */
const unflag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const review = await reviewService.unflag(id);

    return successResponse(res, formatReview(review), 'Review unflagged successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get flagged reviews
 */
const getFlagged = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewService.getFlagged({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Flagged reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get review statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const { period = 'month', date_from, dateFrom, date_to, dateTo } = req.query;

    const stats = await reviewService.getStatistics({
      period,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    const formattedStats = {
      total: stats.total || 0,
      totalReviews: stats.total || 0,
      total_reviews: stats.total || 0,
      pending: stats.pending || 0,
      pendingReviews: stats.pending || 0,
      pending_reviews: stats.pending || 0,
      approved: stats.approved || 0,
      approvedReviews: stats.approved || 0,
      approved_reviews: stats.approved || 0,
      rejected: stats.rejected || 0,
      rejectedReviews: stats.rejected || 0,
      rejected_reviews: stats.rejected || 0,
      flagged: stats.flagged || 0,
      averageRating: stats.average_rating || stats.averageRating || 0,
      average_rating: stats.average_rating || stats.averageRating || 0,
      ratingDistribution: stats.rating_distribution || stats.ratingDistribution || {},
      rating_distribution: stats.rating_distribution || stats.ratingDistribution || {},
    };

    return successResponse(res, formattedStats, 'Review statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product rating summary
 */
const getProductRatingSummary = async (req, res, next) => {
  try {
    const { product_id, productId } = req.params;
    const pId = product_id || productId;

    const summary = await reviewService.getProductRatingSummary(pId);

    const formattedSummary = {
      productId: pId,
      product_id: pId,
      averageRating: summary.average_rating || summary.averageRating || 0,
      average_rating: summary.average_rating || summary.averageRating || 0,
      totalReviews: summary.total_reviews || summary.totalReviews || 0,
      total_reviews: summary.total_reviews || summary.totalReviews || 0,
      ratingDistribution: summary.rating_distribution || summary.ratingDistribution || {},
      rating_distribution: summary.rating_distribution || summary.ratingDistribution || {},
    };

    return successResponse(res, formattedSummary, 'Product rating summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent reviews
 */
const getRecent = async (req, res, next) => {
  try {
    const { limit = 10, status, lang = 'en' } = req.query;

    const reviews = await reviewService.getRecent({
      limit: parseInt(limit),
      status,
      lang,
    });

    const formattedReviews = (reviews || []).map(r => formatReview(r, lang));
    return successResponse(res, formattedReviews, 'Recent reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews by rating
 */
const getByRating = async (req, res, next) => {
  try {
    const { rating } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    if (rating < 1 || rating > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await reviewService.getByRating(parseInt(rating), {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });

    return successResponse(res, formatPaginationResponse(result), 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Export reviews to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { status, rating, product_id, productId, date_from, dateFrom, date_to, dateTo } = req.query;

    const excelBuffer = await reviewService.exportToExcel({
      status,
      rating: rating ? parseInt(rating) : undefined,
      product_id: parseInt(product_id || productId) || undefined,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reviews.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Search reviews
 */
const search = async (req, res, next) => {
  try {
    const { q, query, page = 1, limit = 10, lang = 'en' } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return errorResponse(res, 'Search query is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await reviewService.search({
      query: searchQuery,
      page: parseInt(page),
      limit: parseInt(limit),
      lang,
    });

    return successResponse(res, formatPaginationResponse(result, lang), 'Search results retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get review rating distribution
 */
const getRatingDistribution = async (req, res, next) => {
  try {
    const { product_id, productId, status = 'approved' } = req.query;

    const distribution = await reviewService.getRatingDistribution({
      product_id: parseInt(product_id || productId) || undefined,
      status,
    });

    return successResponse(res, distribution, 'Rating distribution retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify review purchase
 */
const verifyPurchase = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const result = await reviewService.verifyPurchase(id);

    return successResponse(res, {
      reviewId: id,
      review_id: id,
      isVerified: result.is_verified,
      is_verified: result.is_verified,
      verifiedPurchase: result.is_verified,
      verified_purchase: result.is_verified,
    }, 'Purchase verification completed');
  } catch (error) {
    next(error);
  }
};

/**
 * Get unverified reviews
 */
const getUnverified = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewService.getUnverified({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Unverified reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark review as featured
 */
const markFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_featured, isFeatured } = req.body;
    const featured = is_featured ?? isFeatured;

    const existingReview = await reviewService.getById(id);
    if (!existingReview) {
      return errorResponse(res, 'Review not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const review = await reviewService.markFeatured(id, featured !== false);
    const status = review.is_featured ? 'featured' : 'unfeatured';

    return successResponse(res, formatReview(review), `Review marked as ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured reviews
 */
const getFeatured = async (req, res, next) => {
  try {
    const { limit = 10, product_id, productId, lang = 'en' } = req.query;

    const reviews = await reviewService.getFeatured({
      limit: parseInt(limit),
      product_id: parseInt(product_id || productId) || undefined,
      lang,
    });

    const formattedReviews = (reviews || []).map(r => formatReview(r, lang));
    return successResponse(res, formattedReviews, 'Featured reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByProduct,
  getByUser,
  getPending,
  getPendingCount,
  approve,
  reject,
  updateStatus,
  remove,
  bulkApprove,
  bulkReject,
  bulkDelete,
  reply,
  updateReply,
  deleteReply,
  flag,
  unflag,
  getFlagged,
  getStatistics,
  getProductRatingSummary,
  getRecent,
  getByRating,
  exportToExcel,
  search,
  getRatingDistribution,
  verifyPurchase,
  getUnverified,
  markFeatured,
  getFeatured,
  VALID_STATUSES,
};