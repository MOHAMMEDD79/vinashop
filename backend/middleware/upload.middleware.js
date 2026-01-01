/**
 * Upload Middleware
 * @module middleware/upload
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { UPLOAD: FILE_UPLOAD } = require('../config/constants');

/**
 * Ensure upload directory exists
 */
const ensureDir = (dirPath) => {
  const fullPath = path.join(process.cwd(), 'uploads', dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

/**
 * Generate unique filename
 */
const generateFilename = (originalname) => {
  const ext = path.extname(originalname);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

/**
 * Create disk storage configuration
 */
const createDiskStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = ensureDir(destination);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    },
  });
};

/**
 * File filter for images
 */
const imageFilter = (req, file, cb) => {
  const allowedMimes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES;
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

/**
 * File filter for documents
 */
const documentFilter = (req, file, cb) => {
  const allowedMimes = FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES;
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

/**
 * File filter for Excel files
 */
const excelFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel and CSV files are allowed'), false);
  }
};

/**
 * File filter for any file type (with blacklist)
 */
const anyFileFilter = (req, file, cb) => {
  const blacklistedMimes = [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-sh',
    'application/x-php',
  ];
  
  const blacklistedExtensions = ['.exe', '.sh', '.bat', '.cmd', '.php', '.js'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (blacklistedMimes.includes(file.mimetype) || blacklistedExtensions.includes(ext)) {
    cb(new Error('This file type is not allowed for security reasons'), false);
  } else {
    cb(null, true);
  }
};

/**
 * Product image upload configuration
 */
const productImageUpload = multer({
  storage: createDiskStorage('products'),
  limits: {
    fileSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
    files: 10,
  },
  fileFilter: imageFilter,
});

/**
 * Category image upload configuration
 */
const categoryImageUpload = multer({
  storage: createDiskStorage('categories'),
  limits: {
    fileSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Subcategory image upload configuration
 */
const subcategoryImageUpload = multer({
  storage: createDiskStorage('subcategories'),
  limits: {
    fileSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * User avatar upload configuration
 */
const userAvatarUpload = multer({
  storage: createDiskStorage('users'),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Admin avatar upload configuration
 */
const adminAvatarUpload = multer({
  storage: createDiskStorage('admins'),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Banner image upload configuration
 */
const bannerImageUpload = multer({
  storage: createDiskStorage('banners'),
  limits: {
    fileSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Variant image upload configuration
 */
const variantImageUpload = multer({
  storage: createDiskStorage('variants'),
  limits: {
    fileSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Settings logo/favicon upload configuration
 */
const settingsUpload = multer({
  storage: createDiskStorage('settings'),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Excel file upload configuration
 */
const excelUpload = multer({
  storage: createDiskStorage('temp'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: excelFilter,
});

/**
 * Document upload configuration
 */
const documentUpload = multer({
  storage: createDiskStorage('documents'),
  limits: {
    fileSize: FILE_UPLOAD.MAX_DOCUMENT_SIZE,
    files: 5,
  },
  fileFilter: documentFilter,
});

/**
 * Temp file upload configuration
 */
const tempUpload = multer({
  storage: createDiskStorage('temp'),
  limits: {
    fileSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
    files: 10,
  },
  fileFilter: imageFilter,
});

/**
 * Generic upload configuration
 */
const genericUpload = multer({
  storage: createDiskStorage('uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
  fileFilter: anyFileFilter,
});

/**
 * Memory storage for processing without saving
 */
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Handle Multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    let errorCode = 'UPLOAD_ERROR';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the allowed limit';
        errorCode = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        errorCode = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        errorCode = 'UNEXPECTED_FILE';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in upload';
        errorCode = 'TOO_MANY_PARTS';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        errorCode = 'FIELD_NAME_TOO_LONG';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        errorCode = 'FIELD_VALUE_TOO_LONG';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        errorCode = 'TOO_MANY_FIELDS';
        break;
    }

    return res.status(400).json({
      success: false,
      message,
      error_code: errorCode,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
      error_code: 'UPLOAD_ERROR',
    });
  }

  next();
};

/**
 * Validate uploaded files
 */
const validateUploadedFiles = (options = {}) => {
  const {
    minFiles = 0,
    maxFiles = 10,
    minSize = 0,
    maxSize = FILE_UPLOAD.MAX_IMAGE_SIZE,
    required = false,
  } = options;

  return (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);

    if (required && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one file is required',
        error_code: 'FILE_REQUIRED',
      });
    }

    if (files.length < minFiles) {
      return res.status(400).json({
        success: false,
        message: `At least ${minFiles} file(s) required`,
        error_code: 'NOT_ENOUGH_FILES',
      });
    }

    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} file(s) allowed`,
        error_code: 'TOO_MANY_FILES',
      });
    }

    for (const file of files) {
      if (file.size < minSize) {
        return res.status(400).json({
          success: false,
          message: 'File is too small',
          error_code: 'FILE_TOO_SMALL',
        });
      }

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'File is too large',
          error_code: 'FILE_TOO_LARGE',
        });
      }
    }

    next();
  };
};

/**
 * Delete uploaded file on error
 */
const deleteOnError = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    if (!data.success && res.statusCode >= 400) {
      // Delete uploaded files on error
      const files = req.files || (req.file ? [req.file] : []);
      files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Failed to delete uploaded file:', err);
          });
        }
      });
    }
    return originalJson(data);
  };

  next();
};

/**
 * Process uploaded image (resize, compress, etc.)
 */
const processImage = (options = {}) => {
  return async (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      return next();
    }

    try {
      // Note: In a real implementation, you would use sharp or jimp here
      // to resize/compress images
      // const sharp = require('sharp');
      // 
      // for (const file of files) {
      //   await sharp(file.path)
      //     .resize(options.width, options.height, { fit: 'inside' })
      //     .jpeg({ quality: options.quality || 80 })
      //     .toFile(file.path.replace(/\.\w+$/, '-processed.jpg'));
      // }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Add file info to request body
 */
const addFileInfo = (fieldName = 'image') => {
  return (req, res, next) => {
    if (req.file) {
      req.body[fieldName] = `uploads/${req.file.destination.split('uploads/')[1]}/${req.file.filename}`;
    }

    if (req.files && Array.isArray(req.files)) {
      req.body[`${fieldName}s`] = req.files.map(file => 
        `uploads/${file.destination.split('uploads/')[1]}/${file.filename}`
      );
    }

    next();
  };
};

/**
 * Clean up old temp files
 */
const cleanupTempFiles = async () => {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  
  if (!fs.existsSync(tempDir)) {
    return;
  }

  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const file of files) {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
    }
  }
};

/**
 * Create upload middleware with custom configuration
 */
const createUploadMiddleware = (options = {}) => {
  const {
    destination = 'uploads',
    maxSize = FILE_UPLOAD.MAX_IMAGE_SIZE,
    maxFiles = 1,
    fileTypes = 'image',
  } = options;

  let fileFilter;
  switch (fileTypes) {
    case 'image':
      fileFilter = imageFilter;
      break;
    case 'document':
      fileFilter = documentFilter;
      break;
    case 'excel':
      fileFilter = excelFilter;
      break;
    default:
      fileFilter = anyFileFilter;
  }

  return multer({
    storage: createDiskStorage(destination),
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
    fileFilter,
  });
};

/**
 * Single file upload helper
 * @param {string} fieldName - Form field name
 * @param {string} destination - Upload destination folder
 * @param {string} type - File type filter ('image', 'document', 'excel', 'any')
 */
const uploadSingle = (fieldName = 'file', destination = 'temp', type = 'image') => {
  const upload = createUploadMiddleware({
    destination,
    maxFiles: 1,
    type,
  });
  return upload.single(fieldName);
};

/**
 * Multiple files upload helper
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 * @param {string} destination - Upload destination folder
 * @param {string} type - File type filter
 */
const uploadMultiple = (fieldName = 'files', maxCount = 10, destination = 'temp', type = 'image') => {
  const upload = createUploadMiddleware({
    destination,
    maxFiles: maxCount,
    type,
  });
  return upload.array(fieldName, maxCount);
};

/**
 * Fields upload helper
 * @param {Array} fields - Array of field configs [{name: 'field1', maxCount: 1}]
 * @param {string} destination - Upload destination folder
 * @param {string} type - File type filter
 */
const uploadFields = (fields, destination = 'temp', type = 'image') => {
  const upload = createUploadMiddleware({
    destination,
    type,
  });
  return upload.fields(fields);
};

module.exports = {
  // Pre-configured upload middlewares
  productImageUpload,
  categoryImageUpload,
  subcategoryImageUpload,
  userAvatarUpload,
  adminAvatarUpload,
  bannerImageUpload,
  variantImageUpload,
  settingsUpload,
  excelUpload,
  documentUpload,
  tempUpload,
  genericUpload,
  memoryUpload,

  // Helper functions
  uploadSingle,
  uploadMultiple,
  uploadFields,

  // Utility middlewares
  handleUploadError,
  validateUploadedFiles,
  deleteOnError,
  processImage,
  addFileInfo,
  cleanupTempFiles,

  // Factory function
  createUploadMiddleware,

  // Utilities
  ensureDir,
  generateFilename,
  
  // File filters for custom use
  imageFilter,
  documentFilter,
  excelFilter,
  anyFileFilter,
};