/**
 * Bill Image Controller
 * @module controllers/billImage
 *
 * Handles bill image uploads and management
 * Accepts both camelCase and snake_case, responses include both formats
 */

const billImageService = require('../services/billImage.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const VALID_BILL_TYPES = ['purchase', 'expense', 'receipt', 'other'];

/**
 * Helper: Format bill image for response
 */
const formatBillImage = (image) => {
  if (!image) return null;

  return {
    id: image.image_id,
    imageId: image.image_id,
    image_id: image.image_id,

    title: image.title,
    description: image.description,

    imagePath: image.image_path,
    image_path: image.image_path,
    originalFilename: image.original_filename,
    original_filename: image.original_filename,
    fileSize: image.file_size,
    file_size: image.file_size,
    mimeType: image.mime_type,
    mime_type: image.mime_type,

    billType: image.bill_type,
    bill_type: image.bill_type,
    billDate: image.bill_date,
    bill_date: image.bill_date,
    amount: parseFloat(image.amount) || null,

    supplierName: image.supplier_name,
    supplier_name: image.supplier_name,
    referenceNumber: image.reference_number,
    reference_number: image.reference_number,

    notes: image.notes,

    isProcessed: image.is_processed === 1 || image.is_processed === true,
    is_processed: image.is_processed === 1 || image.is_processed === true,

    uploadedBy: image.uploaded_by,
    uploaded_by: image.uploaded_by,
    uploaderName: image.uploader_name,
    uploader_name: image.uploader_name,

    createdAt: image.created_at,
    created_at: image.created_at,
    updatedAt: image.updated_at,
    updated_at: image.updated_at,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result) => {
  const items = (result.data || []).map(formatBillImage);
  return {
    items,
    data: items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  };
};

/**
 * Get all bill images
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search,
      bill_type, billType,
      is_processed, isProcessed,
      date_from, dateFrom, date_to, dateTo,
      uploaded_by, uploadedBy,
      sort = 'created_at', order = 'DESC',
    } = req.query;

    const result = await billImageService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      bill_type: bill_type || billType,
      is_processed: (is_processed ?? isProcessed) !== undefined ? (is_processed || isProcessed) === 'true' : undefined,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      uploaded_by: parseInt(uploaded_by || uploadedBy) || undefined,
      sort,
      order,
    });

    return successResponse(res, formatPaginationResponse(result), 'Bill images retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get bill image by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = await billImageService.getById(id);

    if (!image) {
      return errorResponse(res, 'Bill image not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatBillImage(image));
  } catch (error) {
    next(error);
  }
};

/**
 * Upload bill image
 */
const upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Image file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const {
      title,
      description,
      bill_type, billType,
      bill_date, billDate,
      amount,
      supplier_name, supplierName,
      reference_number, referenceNumber,
      notes,
    } = req.body;

    const bType = bill_type || billType || 'other';
    if (!VALID_BILL_TYPES.includes(bType)) {
      return errorResponse(
        res,
        `Invalid bill type. Valid types are: ${VALID_BILL_TYPES.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const image = await billImageService.create({
      title: title || req.file.originalname,
      description,
      image_path: `uploads/bills/${req.file.filename}`,
      original_filename: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      bill_type: bType,
      bill_date: bill_date || billDate,
      amount: amount ? parseFloat(amount) : null,
      supplier_name: supplier_name || supplierName,
      reference_number: reference_number || referenceNumber,
      notes,
      uploaded_by: req.admin?.adminId,
    });

    return successResponse(res, formatBillImage(image), 'Bill image uploaded successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple bill images
 */
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'At least one image file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const { bill_type, billType, bill_date, billDate } = req.body;
    const bType = bill_type || billType || 'other';

    const uploadedImages = [];
    for (const file of req.files) {
      const image = await billImageService.create({
        title: file.originalname,
        image_path: `uploads/bills/${file.filename}`,
        original_filename: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        bill_type: bType,
        bill_date: bill_date || billDate,
        uploaded_by: req.admin?.adminId,
      });
      uploadedImages.push(formatBillImage(image));
    }

    return successResponse(res, uploadedImages, `${uploadedImages.length} bill images uploaded successfully`, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update bill image
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      bill_type, billType,
      bill_date, billDate,
      amount,
      supplier_name, supplierName,
      reference_number, referenceNumber,
      notes,
      is_processed, isProcessed,
    } = req.body;

    const existingImage = await billImageService.getById(id);
    if (!existingImage) {
      return errorResponse(res, 'Bill image not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const bType = bill_type ?? billType;
    if (bType !== undefined && !VALID_BILL_TYPES.includes(bType)) {
      return errorResponse(
        res,
        `Invalid bill type. Valid types are: ${VALID_BILL_TYPES.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (bType !== undefined) updateData.bill_type = bType;

    const bDate = bill_date ?? billDate;
    if (bDate !== undefined) updateData.bill_date = bDate;

    if (amount !== undefined) updateData.amount = amount ? parseFloat(amount) : null;

    const sName = supplier_name ?? supplierName;
    if (sName !== undefined) updateData.supplier_name = sName;

    const refNum = reference_number ?? referenceNumber;
    if (refNum !== undefined) updateData.reference_number = refNum;

    if (notes !== undefined) updateData.notes = notes;

    const processed = is_processed ?? isProcessed;
    if (processed !== undefined) updateData.is_processed = processed === 'true' || processed === true;

    const image = await billImageService.update(id, updateData);

    return successResponse(res, formatBillImage(image), 'Bill image updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bill image
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingImage = await billImageService.getById(id);
    if (!existingImage) {
      return errorResponse(res, 'Bill image not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await billImageService.delete(id);

    return successResponse(res, null, 'Bill image deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete bill images
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { image_ids, imageIds, ids } = req.body;
    const imageIdList = image_ids || imageIds || ids;

    if (!imageIdList || !Array.isArray(imageIdList) || imageIdList.length === 0) {
      return errorResponse(res, 'Image IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const deletedCount = await billImageService.bulkDelete(imageIdList);

    return successResponse(res, { deleted: deletedCount, deletedCount }, `${deletedCount} bill images deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark as processed
 */
const markAsProcessed = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingImage = await billImageService.getById(id);
    if (!existingImage) {
      return errorResponse(res, 'Bill image not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const image = await billImageService.markAsProcessed(id);

    return successResponse(res, formatBillImage(image), 'Bill image marked as processed');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark as unprocessed
 */
const markAsUnprocessed = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingImage = await billImageService.getById(id);
    if (!existingImage) {
      return errorResponse(res, 'Bill image not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const image = await billImageService.markAsUnprocessed(id);

    return successResponse(res, formatBillImage(image), 'Bill image marked as unprocessed');
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const { date_from, dateFrom, date_to, dateTo } = req.query;

    const stats = await billImageService.getStatistics({
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    const formattedStats = {
      totalImages: stats.total_images,
      total_images: stats.total_images,
      processedImages: stats.processed_images,
      processed_images: stats.processed_images,
      unprocessedImages: stats.unprocessed_images,
      unprocessed_images: stats.unprocessed_images,
      purchaseBills: stats.purchase_bills,
      purchase_bills: stats.purchase_bills,
      expenseBills: stats.expense_bills,
      expense_bills: stats.expense_bills,
      receipts: stats.receipts,
      otherBills: stats.other_bills,
      other_bills: stats.other_bills,
      totalAmount: parseFloat(stats.total_amount) || 0,
      total_amount: parseFloat(stats.total_amount) || 0,
      purchaseAmount: parseFloat(stats.purchase_amount) || 0,
      purchase_amount: parseFloat(stats.purchase_amount) || 0,
      expenseAmount: parseFloat(stats.expense_amount) || 0,
      expense_amount: parseFloat(stats.expense_amount) || 0,
    };

    return successResponse(res, formattedStats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get by bill type
 */
const getByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!VALID_BILL_TYPES.includes(type)) {
      return errorResponse(
        res,
        `Invalid bill type. Valid types are: ${VALID_BILL_TYPES.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await billImageService.getByType(type, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), `${type} bills retrieved successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get unprocessed bills
 */
const getUnprocessed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await billImageService.getUnprocessed({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Unprocessed bills retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get monthly summary
 */
const getMonthlySummary = async (req, res, next) => {
  try {
    const { year, month } = req.params;

    const summary = await billImageService.getMonthlySummary(
      parseInt(year),
      parseInt(month)
    );

    return successResponse(res, summary, 'Monthly summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search bill images
 */
const search = async (req, res, next) => {
  try {
    const { q, query, page = 1, limit = 10 } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return errorResponse(res, 'Search query is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await billImageService.search(searchQuery, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Search results retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  upload,
  uploadMultiple,
  update,
  remove,
  bulkDelete,
  markAsProcessed,
  markAsUnprocessed,
  getStatistics,
  getByType,
  getUnprocessed,
  getMonthlySummary,
  search,
  VALID_BILL_TYPES,
};
