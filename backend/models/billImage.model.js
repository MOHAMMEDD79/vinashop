/**
 * Bill Image Model
 * @module models/billImage
 *
 * Handles storage and management of uploaded bill images
 * (separate from order-based invoices)
 */

const { query } = require('../config/database');

class BillImage {
  /**
   * Get all bill images with pagination
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      bill_type,
      is_processed,
      date_from,
      date_to,
      uploaded_by,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (bi.title LIKE ? OR bi.description LIKE ? OR bi.supplier_name LIKE ? OR bi.reference_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (bill_type) {
      whereClause += ' AND bi.bill_type = ?';
      params.push(bill_type);
    }

    if (is_processed !== undefined) {
      whereClause += ' AND bi.is_processed = ?';
      params.push(is_processed ? 1 : 0);
    }

    if (date_from) {
      whereClause += ' AND DATE(bi.bill_date) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(bi.bill_date) <= ?';
      params.push(date_to);
    }

    if (uploaded_by) {
      whereClause += ' AND bi.uploaded_by = ?';
      params.push(uploaded_by);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM bill_images bi ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get paginated results
    const allowedSorts = ['image_id', 'title', 'bill_type', 'bill_date', 'amount', 'created_at'];
    const sortColumn = allowedSorts.includes(sort) ? `bi.${sort}` : 'bi.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        bi.*,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as uploader_name,
        a.email as uploader_email
      FROM bill_images bi
      LEFT JOIN admins a ON bi.uploaded_by = a.admin_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const images = await query(sql, params);

    return {
      data: images,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get bill image by ID
   */
  static async getById(imageId) {
    const sql = `
      SELECT
        bi.*,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as uploader_name,
        a.email as uploader_email
      FROM bill_images bi
      LEFT JOIN admins a ON bi.uploaded_by = a.admin_id
      WHERE bi.image_id = ?
    `;
    const results = await query(sql, [imageId]);
    return results[0] || null;
  }

  /**
   * Create bill image
   */
  static async create(data) {
    const {
      title,
      description,
      image_path,
      original_filename,
      file_size,
      mime_type,
      bill_type = 'other',
      bill_date,
      amount,
      supplier_name,
      reference_number,
      notes,
      is_processed = false,
      uploaded_by,
    } = data;

    const sql = `
      INSERT INTO bill_images (
        title, description, image_path, original_filename,
        file_size, mime_type, bill_type, bill_date, amount,
        supplier_name, reference_number, notes, is_processed,
        uploaded_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      title || null,
      description || null,
      image_path,
      original_filename || null,
      file_size || null,
      mime_type || null,
      bill_type,
      bill_date || null,
      amount || null,
      supplier_name || null,
      reference_number || null,
      notes || null,
      is_processed ? 1 : 0,
      uploaded_by || null,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update bill image
   */
  static async update(imageId, data) {
    const allowedFields = [
      'title', 'description', 'bill_type', 'bill_date',
      'amount', 'supplier_name', 'reference_number', 'notes', 'is_processed',
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        if (key === 'is_processed') {
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

    const sql = `UPDATE bill_images SET ${updates.join(', ')} WHERE image_id = ?`;
    await query(sql, values);

    return await this.getById(imageId);
  }

  /**
   * Delete bill image
   */
  static async delete(imageId) {
    const sql = 'DELETE FROM bill_images WHERE image_id = ?';
    const result = await query(sql, [imageId]);
    return result.affectedRows > 0;
  }

  /**
   * Bulk delete bill images
   */
  static async bulkDelete(imageIds) {
    if (!imageIds || imageIds.length === 0) return 0;

    const placeholders = imageIds.map(() => '?').join(',');
    const sql = `DELETE FROM bill_images WHERE image_id IN (${placeholders})`;
    const result = await query(sql, imageIds);
    return result.affectedRows;
  }

  /**
   * Mark as processed
   */
  static async markAsProcessed(imageId) {
    const sql = 'UPDATE bill_images SET is_processed = 1, updated_at = NOW() WHERE image_id = ?';
    await query(sql, [imageId]);
    return await this.getById(imageId);
  }

  /**
   * Mark as unprocessed
   */
  static async markAsUnprocessed(imageId) {
    const sql = 'UPDATE bill_images SET is_processed = 0, updated_at = NOW() WHERE image_id = ?';
    await query(sql, [imageId]);
    return await this.getById(imageId);
  }

  /**
   * Get statistics
   */
  static async getStatistics(options = {}) {
    const { date_from, date_to } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date_from) {
      whereClause += ' AND DATE(bill_date) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(bill_date) <= ?';
      params.push(date_to);
    }

    const sql = `
      SELECT
        COUNT(*) as total_images,
        SUM(CASE WHEN is_processed = 1 THEN 1 ELSE 0 END) as processed_images,
        SUM(CASE WHEN is_processed = 0 THEN 1 ELSE 0 END) as unprocessed_images,
        SUM(CASE WHEN bill_type = 'purchase' THEN 1 ELSE 0 END) as purchase_bills,
        SUM(CASE WHEN bill_type = 'expense' THEN 1 ELSE 0 END) as expense_bills,
        SUM(CASE WHEN bill_type = 'receipt' THEN 1 ELSE 0 END) as receipts,
        SUM(CASE WHEN bill_type = 'other' THEN 1 ELSE 0 END) as other_bills,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN bill_type = 'purchase' THEN amount ELSE 0 END), 0) as purchase_amount,
        COALESCE(SUM(CASE WHEN bill_type = 'expense' THEN amount ELSE 0 END), 0) as expense_amount
      FROM bill_images
      ${whereClause}
    `;

    const result = await query(sql, params);
    return result[0];
  }

  /**
   * Get by bill type
   */
  static async getByType(billType, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM bill_images WHERE bill_type = ?';
    const countResult = await query(countSql, [billType]);
    const total = countResult[0].total;

    const sql = `
      SELECT * FROM bill_images
      WHERE bill_type = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const images = await query(sql, [billType, limit, offset]);

    return {
      data: images,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get unprocessed bills
   */
  static async getUnprocessed(options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const countSql = 'SELECT COUNT(*) as total FROM bill_images WHERE is_processed = 0';
    const countResult = await query(countSql);
    const total = countResult[0].total;

    const sql = `
      SELECT * FROM bill_images
      WHERE is_processed = 0
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const images = await query(sql, [limit, offset]);

    return {
      data: images,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get monthly summary
   */
  static async getMonthlySummary(year, month) {
    const sql = `
      SELECT
        bill_type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM bill_images
      WHERE YEAR(bill_date) = ? AND MONTH(bill_date) = ?
      GROUP BY bill_type
    `;

    return await query(sql, [year, month]);
  }

  /**
   * Search bill images
   */
  static async search(searchQuery, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    const searchTerm = `%${searchQuery}%`;

    const countSql = `
      SELECT COUNT(*) as total FROM bill_images
      WHERE title LIKE ? OR description LIKE ? OR supplier_name LIKE ? OR reference_number LIKE ?
    `;
    const countResult = await query(countSql, [searchTerm, searchTerm, searchTerm, searchTerm]);
    const total = countResult[0].total;

    const sql = `
      SELECT * FROM bill_images
      WHERE title LIKE ? OR description LIKE ? OR supplier_name LIKE ? OR reference_number LIKE ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const images = await query(sql, [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]);

    return {
      data: images,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = BillImage;
