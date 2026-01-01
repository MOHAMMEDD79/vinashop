/**
 * Multer Configuration
 * @module config/multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload directories
 */
const UPLOAD_DIRS = {
  products: 'uploads/products',
  categories: 'uploads/categories',
  subcategories: 'uploads/subcategories',
  users: 'uploads/users',
  admins: 'uploads/admins',
  banners: 'uploads/banners',
  temp: 'uploads/temp',
};

/**
 * Allowed file types
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXCEL_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

/**
 * File size limits (in bytes)
 */
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  video: 50 * 1024 * 1024, // 50MB
  document: 10 * 1024 * 1024, // 10MB
  excel: 10 * 1024 * 1024, // 10MB
};

/**
 * Ensure upload directory exists
 * @param {string} dir - Directory path
 */
const ensureDirectoryExists = (dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

// Create all upload directories on startup
Object.values(UPLOAD_DIRS).forEach(ensureDirectoryExists);

/**
 * Generate unique filename
 * @param {Object} file - Multer file object
 * @returns {string} Unique filename
 */
const generateFilename = (file) => {
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  const ext = path.extname(file.originalname).toLowerCase();
  const cleanName = path.basename(file.originalname, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  
  return `${cleanName}-${timestamp}-${uniqueId}${ext}`;
};

/**
 * Create storage configuration for a specific directory
 * @param {string} uploadDir - Upload directory key
 * @returns {multer.StorageEngine} Multer storage engine
 */
const createStorage = (uploadDir) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = UPLOAD_DIRS[uploadDir] || UPLOAD_DIRS.temp;
      const fullPath = ensureDirectoryExists(dir);
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file));
    },
  });
};

/**
 * Image file filter
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
  }
};

/**
 * Document file filter
 */
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

/**
 * Excel file filter
 */
const excelFileFilter = (req, file, cb) => {
  if (ALLOWED_EXCEL_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_EXCEL_TYPES.join(', ')}`), false);
  }
};

/**
 * Media file filter (images and videos)
 */
const mediaFileFilter = (req, file, cb) => {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: images and videos`), false);
  }
};

/**
 * Any file filter (with size limit)
 */
const anyFileFilter = (req, file, cb) => {
  cb(null, true);
};

/**
 * Product image upload configuration
 */
const productImageUpload = multer({
  storage: createStorage('products'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 10, // Max 10 files at once
  },
});

/**
 * Category image upload configuration
 */
const categoryImageUpload = multer({
  storage: createStorage('categories'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 1,
  },
});

/**
 * Subcategory image upload configuration
 */
const subcategoryImageUpload = multer({
  storage: createStorage('subcategories'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 1,
  },
});

/**
 * User avatar upload configuration
 */
const userAvatarUpload = multer({
  storage: createStorage('users'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 1,
  },
});

/**
 * Admin avatar upload configuration
 */
const adminAvatarUpload = multer({
  storage: createStorage('admins'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 1,
  },
});

/**
 * Banner media upload configuration (images and videos)
 */
const bannerMediaUpload = multer({
  storage: createStorage('banners'),
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.video, // 50MB for videos
    files: 1,
  },
});

/**
 * Excel file upload configuration (for imports)
 */
const excelUpload = multer({
  storage: createStorage('temp'),
  fileFilter: excelFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.excel,
    files: 1,
  },
});

/**
 * Generic file upload configuration
 */
const genericUpload = multer({
  storage: createStorage('temp'),
  fileFilter: anyFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 5,
  },
});

/**
 * Memory storage for processing files without saving
 */
const memoryStorage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 10,
  },
});

/**
 * Banner memory storage for BLOB storage (images and videos)
 */
const bannerMemoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.video, // 50MB for videos
    files: 1,
  },
});

/**
 * Delete file from disk
 * @param {string} filePath - File path relative to uploads directory
 * @returns {Promise<boolean>} Success status
 */
const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error.message);
    return false;
  }
};

/**
 * Delete multiple files
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {Promise<Object>} Results
 */
const deleteFiles = async (filePaths) => {
  const results = {
    success: [],
    failed: [],
  };

  for (const filePath of filePaths) {
    const deleted = await deleteFile(filePath);
    if (deleted) {
      results.success.push(filePath);
    } else {
      results.failed.push(filePath);
    }
  }

  return results;
};

/**
 * Move file from temp to destination
 * @param {string} tempPath - Temporary file path
 * @param {string} destination - Destination directory key
 * @returns {Promise<string>} New file path
 */
const moveFile = async (tempPath, destination) => {
  try {
    const destDir = UPLOAD_DIRS[destination] || UPLOAD_DIRS.temp;
    ensureDirectoryExists(destDir);
    
    const filename = path.basename(tempPath);
    const newPath = path.join(destDir, filename);
    const fullTempPath = path.join(process.cwd(), tempPath);
    const fullNewPath = path.join(process.cwd(), newPath);
    
    fs.renameSync(fullTempPath, fullNewPath);
    
    return newPath;
  } catch (error) {
    console.error('Error moving file:', error.message);
    throw error;
  }
};

/**
 * Copy file to destination
 * @param {string} sourcePath - Source file path
 * @param {string} destination - Destination directory key
 * @returns {Promise<string>} New file path
 */
const copyFile = async (sourcePath, destination) => {
  try {
    const destDir = UPLOAD_DIRS[destination] || UPLOAD_DIRS.temp;
    ensureDirectoryExists(destDir);
    
    const filename = path.basename(sourcePath);
    const newPath = path.join(destDir, filename);
    const fullSourcePath = path.join(process.cwd(), sourcePath);
    const fullNewPath = path.join(process.cwd(), newPath);
    
    fs.copyFileSync(fullSourcePath, fullNewPath);
    
    return newPath;
  } catch (error) {
    console.error('Error copying file:', error.message);
    throw error;
  }
};

/**
 * Get file info
 * @param {string} filePath - File path
 * @returns {Object|null} File info or null
 */
const getFileInfo = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const stats = fs.statSync(fullPath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      path: filePath,
      filename: path.basename(filePath),
      extension: ext,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isImage: ALLOWED_IMAGE_TYPES.some(type => type.includes(ext.replace('.', ''))),
    };
  } catch (error) {
    console.error('Error getting file info:', error.message);
    return null;
  }
};

/**
 * Format file size to human readable
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Clean up temp files older than specified hours
 * @param {number} hours - Hours threshold
 * @returns {Promise<number>} Number of deleted files
 */
const cleanupTempFiles = async (hours = 24) => {
  try {
    const tempDir = path.join(process.cwd(), UPLOAD_DIRS.temp);
    if (!fs.existsSync(tempDir)) {
      return 0;
    }
    
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const threshold = hours * 60 * 60 * 1000;
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > threshold) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    console.log(`Cleaned up ${deletedCount} temp files`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up temp files:', error.message);
    return 0;
  }
};

/**
 * Get file URL path
 * @param {string} filePath - File path
 * @returns {string} URL path
 */
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // If already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Remove leading slash if present
  const cleanPath = filePath.replace(/^\//, '');
  
  // Return relative path that can be served by Express static
  return `/${cleanPath}`;
};

/**
 * Validate file exists
 * @param {string} filePath - File path
 * @returns {boolean} True if exists
 */
const fileExists = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
};

/**
 * Multer error handler middleware
 */
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size allowed is 5MB.',
          error: { code: 'FILE_TOO_LARGE' },
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum allowed is 10.',
          error: { code: 'TOO_MANY_FILES' },
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name for file upload.',
          error: { code: 'UNEXPECTED_FIELD' },
        });
      default:
        return res.status(400).json({
          success: false,
          message: error.message,
          error: { code: error.code },
        });
    }
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: { code: 'INVALID_FILE_TYPE' },
    });
  }
  
  next(error);
};

module.exports = {
  // Upload configurations
  productImageUpload,
  categoryImageUpload,
  subcategoryImageUpload,
  userAvatarUpload,
  adminAvatarUpload,
  bannerMediaUpload,
  bannerMemoryUpload,
  excelUpload,
  genericUpload,
  memoryStorage,
  
  // Utility functions
  deleteFile,
  deleteFiles,
  moveFile,
  copyFile,
  getFileInfo,
  formatFileSize,
  cleanupTempFiles,
  getFileUrl,
  fileExists,
  generateFilename,
  ensureDirectoryExists,
  
  // Error handler
  handleMulterError,
  
  // Constants
  UPLOAD_DIRS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_EXCEL_TYPES,
  FILE_SIZE_LIMITS,
};