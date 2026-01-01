/**
 * Bill Image Routes
 * @module routes/billImage
 */

const express = require('express');
const router = express.Router();
const billImageController = require('../controllers/billImage.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { hasRole } = require('../middleware/admin.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/bills';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for bill image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `bill-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// All routes require authentication
router.use(authenticate);

// Statistics
router.get('/statistics', billImageController.getStatistics);

// Get unprocessed bills
router.get('/unprocessed', billImageController.getUnprocessed);

// Search
router.get('/search', billImageController.search);

// Monthly summary
router.get('/summary/:year/:month', billImageController.getMonthlySummary);

// Get by type
router.get('/type/:type', billImageController.getByType);

// CRUD operations
router.get('/', billImageController.getAll);
router.get('/:id', billImageController.getById);

router.post('/', hasRole('super_admin', 'admin'), upload.single('image'), billImageController.upload);
router.post('/multiple', hasRole('super_admin', 'admin'), upload.array('images', 10), billImageController.uploadMultiple);

router.put('/:id', hasRole('super_admin', 'admin'), billImageController.update);
router.delete('/:id', hasRole('super_admin', 'admin'), billImageController.remove);

// Bulk operations
router.post('/bulk/delete', hasRole('super_admin', 'admin'), billImageController.bulkDelete);

// Mark as processed/unprocessed
router.patch('/:id/processed', hasRole('super_admin', 'admin'), billImageController.markAsProcessed);
router.patch('/:id/unprocessed', hasRole('super_admin', 'admin'), billImageController.markAsUnprocessed);

module.exports = router;
