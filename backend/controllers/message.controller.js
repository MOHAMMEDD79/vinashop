/**
 * Message Controller
 * @module controllers/message
 * 
 * FIXED: Accepts both camelCase and snake_case, responses include both formats
 */

const messageService = require('../services/message.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const VALID_STATUSES = ['pending', 'in_progress', 'resolved', 'closed'];

/**
 * Helper: Format message for response
 */
const formatMessage = (message) => {
  if (!message) return null;

  return {
    id: message.message_id || message.id,
    messageId: message.message_id || message.id,
    message_id: message.message_id || message.id,
    
    name: message.name,
    senderName: message.name,
    sender_name: message.name,
    email: message.email,
    senderEmail: message.email,
    sender_email: message.email,
    phone: message.phone,
    
    subject: message.subject,
    message: message.message,
    content: message.message,
    
    status: message.status || 'pending',
    isRead: message.is_read === 1 || message.is_read === true,
    is_read: message.is_read === 1 || message.is_read === true,
    isArchived: message.is_archived === 1 || message.is_archived === true,
    is_archived: message.is_archived === 1 || message.is_archived === true,
    
    assignedTo: message.assigned_to,
    assigned_to: message.assigned_to,
    assignedToName: message.assigned_to_name,
    assigned_to_name: message.assigned_to_name,
    
    replyCount: message.reply_count || 0,
    reply_count: message.reply_count || 0,
    
    lastReplyAt: message.last_reply_at,
    last_reply_at: message.last_reply_at,
    lastReplyBy: message.last_reply_by,
    last_reply_by: message.last_reply_by,
    
    ipAddress: message.ip_address,
    ip_address: message.ip_address,
    userAgent: message.user_agent,
    user_agent: message.user_agent,
    
    createdAt: message.created_at,
    created_at: message.created_at,
    updatedAt: message.updated_at,
    updated_at: message.updated_at,
    readAt: message.read_at,
    read_at: message.read_at,
    resolvedAt: message.resolved_at,
    resolved_at: message.resolved_at,
    closedAt: message.closed_at,
    closed_at: message.closed_at,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result) => {
  const items = (result.items || result.data || result.messages || []).map(formatMessage);
  return {
    items,
    data: items,
    messages: items,
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
 * Get all messages
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search, status,
      is_read, isRead,
      date_from, dateFrom, date_to, dateTo,
      sort = 'created_at', order = 'DESC',
      sortBy, sort_by, sortOrder, sort_order,
    } = req.query;

    const result = await messageService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      is_read: (is_read ?? isRead) !== undefined ? (is_read || isRead) === 'true' : undefined,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
    });

    return successResponse(res, formatPaginationResponse(result), 'Messages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await messageService.getById(id);

    if (!message) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Mark as read when viewed
    if (!message.is_read) {
      await messageService.markAsRead(id);
    }

    return successResponse(res, formatMessage(message));
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread messages count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await messageService.getUnreadCount();
    return successResponse(res, { count, unreadCount: count, unread_count: count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages by status
 */
const getByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await messageService.getByStatus(status, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Messages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update message status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const message = await messageService.updateStatus(id, status, req.admin?.adminId);

    return successResponse(res, formatMessage(message), 'Message status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const message = await messageService.markAsRead(id);

    return successResponse(res, formatMessage(message), 'Message marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as unread
 */
const markAsUnread = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const message = await messageService.markAsUnread(id);

    return successResponse(res, formatMessage(message), 'Message marked as unread');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark multiple messages as read
 */
const markMultipleAsRead = async (req, res, next) => {
  try {
    const { message_ids, messageIds, ids } = req.body;
    const idList = message_ids || messageIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Message IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await messageService.markMultipleAsRead(idList);

    return successResponse(res, result, `${result.updated} messages marked as read`);
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to message
 */
const reply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply_message, replyMessage, reply, send_email, sendEmail } = req.body;
    const replyText = reply_message || replyMessage || reply;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!replyText || replyText.trim() === '') {
      return errorResponse(res, 'Reply message is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const shouldSendEmail = (send_email ?? sendEmail) !== 'false' && (send_email ?? sendEmail) !== false;

    const message = await messageService.reply(id, {
      reply_message: replyText,
      send_email: shouldSendEmail,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, formatMessage(message), 'Reply sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message replies
 */
const getReplies = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const replies = await messageService.getReplies(id);

    return successResponse(res, replies, 'Replies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete message
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await messageService.remove(id);

    return successResponse(res, null, 'Message deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete messages
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { message_ids, messageIds, ids } = req.body;
    const idList = message_ids || messageIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Message IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await messageService.bulkDelete(idList);

    return successResponse(res, result, `${result.deleted} messages deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update status
 */
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { message_ids, messageIds, ids, status } = req.body;
    const idList = message_ids || messageIds || ids;

    if (!idList || !Array.isArray(idList) || idList.length === 0) {
      return errorResponse(res, 'Message IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await messageService.bulkUpdateStatus(idList, status, req.admin?.adminId);

    return successResponse(res, result, `${result.updated} messages updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign message to admin
 */
const assignToAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_id, adminId, assigned_to, assignedTo } = req.body;
    const targetAdminId = admin_id || adminId || assigned_to || assignedTo;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const message = await messageService.assignToAdmin(id, targetAdminId);

    return successResponse(res, formatMessage(message), 'Message assigned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages assigned to current admin
 */
const getAssignedToMe = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const result = await messageService.getAssignedToAdmin(req.admin?.adminId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });

    return successResponse(res, formatPaginationResponse(result), 'Assigned messages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add internal note to message
 */
const addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, content } = req.body;
    const noteText = note || content;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!noteText || noteText.trim() === '') {
      return errorResponse(res, 'Note content is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await messageService.addNote(id, {
      note: noteText,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, result, 'Note added successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message notes
 */
const getNotes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const notes = await messageService.getNotes(id);

    return successResponse(res, notes, 'Notes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const stats = await messageService.getStatistics({ period });

    const formattedStats = {
      total: stats.total || 0,
      totalMessages: stats.total || 0,
      total_messages: stats.total || 0,
      unread: stats.unread || 0,
      unreadMessages: stats.unread || 0,
      unread_messages: stats.unread || 0,
      pending: stats.pending || 0,
      pendingMessages: stats.pending || 0,
      pending_messages: stats.pending || 0,
      inProgress: stats.in_progress || stats.inProgress || 0,
      in_progress: stats.in_progress || stats.inProgress || 0,
      resolved: stats.resolved || 0,
      resolvedMessages: stats.resolved || 0,
      resolved_messages: stats.resolved || 0,
      closed: stats.closed || 0,
      averageResponseTime: stats.average_response_time || stats.averageResponseTime || 0,
      average_response_time: stats.average_response_time || stats.averageResponseTime || 0,
    };

    return successResponse(res, formattedStats, 'Message statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Export messages to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { status, date_from, dateFrom, date_to, dateTo, is_read, isRead } = req.query;

    const excelBuffer = await messageService.exportToExcel({
      status,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      is_read: (is_read ?? isRead) !== undefined ? (is_read || isRead) === 'true' : undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=messages.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Search messages
 */
const search = async (req, res, next) => {
  try {
    const { q, query, page = 1, limit = 10 } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return errorResponse(res, 'Search query is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await messageService.search({
      query: searchQuery,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Search results retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages by email
 */
const getByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await messageService.getByEmail(email, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Messages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent messages
 */
const getRecent = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const messages = await messageService.getRecent({
      limit: parseInt(limit),
    });

    const formattedMessages = (messages || []).map(formatMessage);
    return successResponse(res, formattedMessages, 'Recent messages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await messageService.markAllAsRead();

    return successResponse(res, result, `${result.updated} messages marked as read`);
  } catch (error) {
    next(error);
  }
};

/**
 * Archive message
 */
const archive = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const message = await messageService.archive(id);

    return successResponse(res, formatMessage(message), 'Message archived successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get archived messages
 */
const getArchived = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await messageService.getArchived({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Archived messages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore archived message
 */
const restore = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const message = await messageService.restore(id);

    return successResponse(res, formatMessage(message), 'Message restored successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get message thread
 */
const getThread = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageService.getById(id);
    if (!existingMessage) {
      return errorResponse(res, 'Message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const thread = await messageService.getThread(id);

    return successResponse(res, thread, 'Message thread retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getUnreadCount,
  getByStatus,
  updateStatus,
  markAsRead,
  markAsUnread,
  markMultipleAsRead,
  reply,
  getReplies,
  remove,
  bulkDelete,
  bulkUpdateStatus,
  assignToAdmin,
  getAssignedToMe,
  addNote,
  getNotes,
  getStatistics,
  exportToExcel,
  search,
  getByEmail,
  getRecent,
  markAllAsRead,
  archive,
  getArchived,
  restore,
  getThread,
  VALID_STATUSES,
};