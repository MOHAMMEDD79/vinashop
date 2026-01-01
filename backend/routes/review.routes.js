/**
 * Review Routes
 * Routes for review management
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/admin.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== GET ROUTES ====================

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews with pagination
 * @access  Private
 */
router.get('/', checkPermission('reviews', 'read'), reviewController.getAll);

/**
 * @route   GET /api/reviews/statistics
 * @desc    Get review statistics
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('reviews', 'read'),
  reviewController.getStatistics
);

/**
 * @route   GET /api/reviews/recent
 * @desc    Get recent reviews
 * @access  Private
 */
router.get('/recent', reviewController.getRecent);

/**
 * @route   GET /api/reviews/pending
 * @desc    Get pending reviews
 * @access  Private
 */
router.get('/pending', checkPermission('reviews', 'read'), reviewController.getPending);

/**
 * @route   GET /api/reviews/pending-count
 * @desc    Get pending review count
 * @access  Private
 */
router.get('/pending-count', reviewController.getPendingCount);

/**
 * @route   GET /api/reviews/flagged
 * @desc    Get flagged reviews
 * @access  Private
 */
router.get('/flagged', checkPermission('reviews', 'read'), reviewController.getFlagged);

/**
 * @route   GET /api/reviews/featured
 * @desc    Get featured reviews
 * @access  Private
 */
router.get('/featured', reviewController.getFeatured);

/**
 * @route   GET /api/reviews/unverified
 * @desc    Get unverified reviews
 * @access  Private
 */
router.get('/unverified', checkPermission('reviews', 'read'), reviewController.getUnverified);

/**
 * @route   GET /api/reviews/search
 * @desc    Search reviews
 * @access  Private
 */
router.get('/search', checkPermission('reviews', 'read'), reviewController.search);

/**
 * @route   GET /api/reviews/rating/:rating
 * @desc    Get reviews by rating
 * @access  Private
 */
router.get('/rating/:rating', checkPermission('reviews', 'read'), reviewController.getByRating);

/**
 * @route   GET /api/reviews/rating-distribution
 * @desc    Get rating distribution
 * @access  Private
 */
router.get('/rating-distribution', reviewController.getRatingDistribution);

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get reviews by product
 * @access  Private
 */
router.get('/product/:productId', reviewController.getByProduct);

/**
 * @route   GET /api/reviews/product/:productId/summary
 * @desc    Get product rating summary
 * @access  Private
 */
router.get('/product/:productId/summary', reviewController.getProductRatingSummary);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews by user
 * @access  Private
 */
router.get('/user/:userId', checkPermission('reviews', 'read'), reviewController.getByUser);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get review by ID
 * @access  Private
 */
router.get('/:id', checkPermission('reviews', 'read'), reviewController.getById);

// ==================== POST ROUTES ====================

/**
 * @route   POST /api/reviews/:id/reply
 * @desc    Reply to review
 * @access  Private (Admin)
 */
router.post(
  '/:id/reply',
  checkPermission('reviews', 'update'),
  reviewController.reply
);

/**
 * @route   POST /api/reviews/bulk/approve
 * @desc    Bulk approve reviews
 * @access  Private (Admin)
 */
router.post(
  '/bulk/approve',
  checkPermission('reviews', 'update'),
  reviewController.bulkApprove
);

/**
 * @route   POST /api/reviews/bulk/reject
 * @desc    Bulk reject reviews
 * @access  Private (Admin)
 */
router.post(
  '/bulk/reject',
  checkPermission('reviews', 'update'),
  reviewController.bulkReject
);

/**
 * @route   POST /api/reviews/bulk/delete
 * @desc    Bulk delete reviews
 * @access  Private (Admin)
 */
router.post(
  '/bulk/delete',
  checkPermission('reviews', 'delete'),
  reviewController.bulkDelete
);

/**
 * @route   POST /api/reviews/export
 * @desc    Export reviews to Excel
 * @access  Private (Admin)
 */
router.post(
  '/export',
  checkPermission('reviews', 'read'),
  reviewController.exportToExcel
);

// ==================== PUT/PATCH ROUTES ====================

/**
 * @route   PUT /api/reviews/:id/status
 * @desc    Update review status
 * @access  Private (Admin)
 */
router.put(
  '/:id/status',
  checkPermission('reviews', 'update'),
  reviewController.updateStatus
);

/**
 * @route   PUT /api/reviews/:id/reply
 * @desc    Update review reply
 * @access  Private (Admin)
 */
router.put(
  '/:id/reply',
  checkPermission('reviews', 'update'),
  reviewController.updateReply
);

/**
 * @route   PATCH /api/reviews/:id/approve
 * @desc    Approve review
 * @access  Private (Admin)
 */
router.patch(
  '/:id/approve',
  checkPermission('reviews', 'update'),
  reviewController.approve
);

/**
 * @route   PATCH /api/reviews/:id/reject
 * @desc    Reject review
 * @access  Private (Admin)
 */
router.patch(
  '/:id/reject',
  checkPermission('reviews', 'update'),
  reviewController.reject
);

/**
 * @route   PATCH /api/reviews/:id/flag
 * @desc    Flag review
 * @access  Private (Admin)
 */
router.patch(
  '/:id/flag',
  checkPermission('reviews', 'update'),
  reviewController.flag
);

/**
 * @route   PATCH /api/reviews/:id/unflag
 * @desc    Unflag review
 * @access  Private (Admin)
 */
router.patch(
  '/:id/unflag',
  checkPermission('reviews', 'update'),
  reviewController.unflag
);

/**
 * @route   PATCH /api/reviews/:id/verify
 * @desc    Verify purchase for review
 * @access  Private (Admin)
 */
router.patch(
  '/:id/verify',
  checkPermission('reviews', 'update'),
  reviewController.verifyPurchase
);

/**
 * @route   PATCH /api/reviews/:id/featured
 * @desc    Mark review as featured
 * @access  Private (Admin)
 */
router.patch(
  '/:id/featured',
  checkPermission('reviews', 'update'),
  reviewController.markFeatured
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  checkPermission('reviews', 'delete'),
  reviewController.remove
);

/**
 * @route   DELETE /api/reviews/:id/reply
 * @desc    Delete review reply
 * @access  Private (Admin)
 */
router.delete(
  '/:id/reply',
  checkPermission('reviews', 'update'),
  reviewController.deleteReply
);

module.exports = router;