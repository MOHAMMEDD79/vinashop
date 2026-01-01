/**
 * User Controller
 * @module controllers/user
 * 
 * FIXED ISSUES:
 * 1. Accepts both camelCase and snake_case field names
 * 2. Response includes both naming conventions
 * 3. Profile image field naming consistent (avatar/profileImage/profile_image)
 */

const userService = require('../services/user.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const VALID_STATUSES = ['active', 'inactive', 'suspended', 'banned'];

/**
 * Helper: Format user for response
 */
const formatUser = (user) => {
  if (!user) return null;

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  return {
    id: user.user_id || user.id,
    userId: user.user_id || user.id,
    user_id: user.user_id || user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    first_name: user.first_name,
    lastName: user.last_name,
    last_name: user.last_name,
    fullName: fullName || user.username,
    full_name: fullName || user.username,
    phone: user.phone,
    address: user.address,
    city: user.city,
    country: user.country,
    postalCode: user.postal_code,
    postal_code: user.postal_code,
    avatar: user.profile_image || user.avatar,
    profileImage: user.profile_image || user.avatar,
    profile_image: user.profile_image || user.avatar,
    status: user.status || 'active',
    isVerified: user.is_verified === 1 || user.is_verified === true,
    is_verified: user.is_verified === 1 || user.is_verified === true,
    orderCount: user.order_count || 0,
    order_count: user.order_count || 0,
    totalSpent: parseFloat(user.total_spent) || 0,
    total_spent: parseFloat(user.total_spent) || 0,
    lastOrderAt: user.last_order_at,
    last_order_at: user.last_order_at,
    createdAt: user.created_at,
    created_at: user.created_at,
    updatedAt: user.updated_at,
    updated_at: user.updated_at,
    lastLogin: user.last_login,
    last_login: user.last_login,
  };
};

/**
 * Helper: Format pagination
 */
const formatPaginationResponse = (result) => {
  const items = (result.items || result.data || result.users || []).map(formatUser);
  return {
    items,
    data: items,
    users: items,
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
 * Get all users
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search, status,
      is_verified, isVerified,
      date_from, dateFrom, date_to, dateTo,
      sort = 'created_at', order = 'DESC',
      sortBy, sort_by, sortOrder, sort_order,
    } = req.query;

    const result = await userService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      is_verified: (is_verified ?? isVerified) !== undefined ? (is_verified || isVerified) === 'true' : undefined,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
    });

    return successResponse(res, formatPaginationResponse(result), 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getById(id);

    if (!user) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatUser(user));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by email
 */
const getByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    const user = await userService.getByEmail(email);

    if (!user) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatUser(user));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 */
const create = async (req, res, next) => {
  try {
    const {
      username, email, password,
      first_name, firstName, last_name, lastName,
      phone, address, city, country,
      postal_code, postalCode,
      is_verified, isVerified, status,
      send_welcome_email, sendWelcomeEmail,
    } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (!password || password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const existingEmail = await userService.findByEmail(email);
    if (existingEmail) {
      return errorResponse(res, 'User with this email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    if (username) {
      const existingUsername = await userService.findByUsername(username);
      if (existingUsername) {
        return errorResponse(res, 'User with this username already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    let avatarPath = null;
    if (req.file) {
      avatarPath = `uploads/users/${req.file.filename}`;
    }

    const user = await userService.create({
      username,
      email,
      password,
      first_name: first_name || firstName,
      last_name: last_name || lastName,
      phone,
      address,
      city,
      country,
      postal_code: postal_code || postalCode,
      profile_image: avatarPath,
      is_verified: (is_verified ?? isVerified) === 'true' || (is_verified ?? isVerified) === true,
      status: status || 'active',
      send_welcome_email: (send_welcome_email ?? sendWelcomeEmail) !== 'false' && (send_welcome_email ?? sendWelcomeEmail) !== false,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatUser(user), 'User created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      username, email,
      first_name, firstName, last_name, lastName,
      phone, address, city, country,
      postal_code, postalCode,
      is_verified, isVerified, status,
    } = req.body;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (email && email !== existingUser.email) {
      const existingEmail = await userService.findByEmail(email);
      if (existingEmail && existingEmail.user_id !== parseInt(id)) {
        return errorResponse(res, 'User with this email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    if (username && username !== existingUser.username) {
      const existingUsername = await userService.findByUsername(username);
      if (existingUsername && existingUsername.user_id !== parseInt(id)) {
        return errorResponse(res, 'User with this username already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    
    const fName = first_name ?? firstName;
    const lName = last_name ?? lastName;
    const pCode = postal_code ?? postalCode;
    const verified = is_verified ?? isVerified;
    
    if (fName !== undefined) updateData.first_name = fName;
    if (lName !== undefined) updateData.last_name = lName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (pCode !== undefined) updateData.postal_code = pCode;
    if (verified !== undefined) updateData.is_verified = verified === 'true' || verified === true;
    if (status !== undefined) updateData.status = status;

    const user = await userService.update(id, updateData);

    return successResponse(res, formatUser(user), 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const orderCount = await userService.getOrderCount(id);
    if (orderCount > 0) {
      return errorResponse(res, `Cannot delete user. They have ${orderCount} order(s). Consider deactivating instead.`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    if (existingUser.profile_image) {
      await userService.deleteAvatar(existingUser.profile_image);
    }

    await userService.remove(id);

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const user = await userService.updateStatus(id, {
      status,
      reason,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatUser(user), `User status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user active status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const newStatus = existingUser.status === 'active' ? 'inactive' : 'active';
    const user = await userService.updateStatus(id, {
      status: newStatus,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatUser(user), `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingUser.is_verified) {
      return errorResponse(res, 'User email is already verified', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const user = await userService.verifyEmail(id);

    return successResponse(res, formatUser(user), 'User email verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password, newPassword, send_email, sendEmail } = req.body;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const password = new_password || newPassword;
    if (!password || password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const shouldSendEmail = (send_email ?? sendEmail) !== 'false' && (send_email ?? sendEmail) !== false;

    await userService.resetPassword(id, {
      password,
      send_email: shouldSendEmail,
      reset_by: req.admin?.adminId,
    });

    return successResponse(res, null, 'User password reset successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!req.file) {
      return errorResponse(res, 'Image file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (existingUser.profile_image) {
      await userService.deleteAvatar(existingUser.profile_image);
    }

    const avatarPath = `uploads/users/${req.file.filename}`;
    const user = await userService.update(id, { profile_image: avatarPath });

    return successResponse(res, formatUser(user), 'Avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove user avatar
 */
const removeAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingUser.profile_image) {
      await userService.deleteAvatar(existingUser.profile_image);
    }

    const user = await userService.update(id, { profile_image: null });

    return successResponse(res, formatUser(user), 'Avatar removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user orders
 */
const getUserOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const result = await userService.getOrders(id, { page: parseInt(page), limit: parseInt(limit) });

    return successResponse(res, result, 'User orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user reviews
 */
const getUserReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const result = await userService.getReviews(id, { page: parseInt(page), limit: parseInt(limit) });

    return successResponse(res, result, 'User reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user wishlist
 */
const getUserWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const wishlist = await userService.getWishlist(id);

    return successResponse(res, wishlist, 'User wishlist retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user cart
 */
const getUserCart = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const cart = await userService.getCart(id);

    return successResponse(res, cart, 'User cart retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user addresses
 */
const getUserAddresses = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const addresses = await userService.getAddresses(id);

    return successResponse(res, addresses, 'User addresses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user activity
 */
const getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const result = await userService.getActivity(id, { page: parseInt(page), limit: parseInt(limit) });

    return successResponse(res, result, 'User activity retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 */
const getUserStatistics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const stats = await userService.getUserStatistics(id);

    return successResponse(res, stats, 'User statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get overall user statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await userService.getStatistics();

    const formattedStats = {
      total: stats.total || 0,
      totalUsers: stats.total || 0,
      total_users: stats.total || 0,
      active: stats.active || 0,
      activeUsers: stats.active || 0,
      active_users: stats.active || 0,
      inactive: stats.inactive || 0,
      suspended: stats.suspended || 0,
      verified: stats.verified || 0,
      verifiedUsers: stats.verified || 0,
      verified_users: stats.verified || 0,
      unverified: stats.unverified || 0,
      newToday: stats.new_today || stats.newToday || 0,
      new_today: stats.new_today || stats.newToday || 0,
      newThisWeek: stats.new_this_week || stats.newThisWeek || 0,
      new_this_week: stats.new_this_week || stats.newThisWeek || 0,
      newThisMonth: stats.new_this_month || stats.newThisMonth || 0,
      new_this_month: stats.new_this_month || stats.newThisMonth || 0,
    };

    return successResponse(res, formattedStats, 'User statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update users
 */
const bulkUpdate = async (req, res, next) => {
  try {
    const { user_ids, userIds, ids, updates } = req.body;
    const userIdList = user_ids || userIds || ids;

    if (!userIdList || !Array.isArray(userIdList) || userIdList.length === 0) {
      return errorResponse(res, 'User IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (!updates || Object.keys(updates).length === 0) {
      return errorResponse(res, 'Updates object is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await userService.bulkUpdate(userIdList, updates, req.admin?.adminId);

    return successResponse(res, result, `${result.updated} users updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete users
 */
const bulkDelete = async (req, res, next) => {
  try {
    const { user_ids, userIds, ids } = req.body;
    const userIdList = user_ids || userIds || ids;

    if (!userIdList || !Array.isArray(userIdList) || userIdList.length === 0) {
      return errorResponse(res, 'User IDs array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await userService.bulkDelete(userIdList);

    return successResponse(res, result, `${result.deleted} users deleted successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Export users to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { status, is_verified, isVerified, date_from, dateFrom, date_to, dateTo } = req.query;

    const excelBuffer = await userService.exportToExcel({
      status,
      is_verified: (is_verified ?? isVerified) !== undefined ? (is_verified || isVerified) === 'true' : undefined,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Import users from Excel
 */
const importFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Excel file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await userService.importFromExcel(req.file.path, req.admin?.adminId);

    return successResponse(res, result, `Import completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    next(error);
  }
};

/**
 * Search users
 */
const search = async (req, res, next) => {
  try {
    const { q, query, page = 1, limit = 10 } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return errorResponse(res, 'Search query is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await userService.search({ query: searchQuery, page: parseInt(page), limit: parseInt(limit) });

    return successResponse(res, formatPaginationResponse(result), 'Search results retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent users
 */
const getRecent = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const users = await userService.getRecent({ limit: parseInt(limit) });

    const formattedUsers = (users || []).map(formatUser);
    return successResponse(res, formattedUsers, 'Recent users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top customers
 */
const getTopCustomers = async (req, res, next) => {
  try {
    const { limit = 10, period = 'all', sort_by, sortBy } = req.query;

    const customers = await userService.getTopCustomers({
      limit: parseInt(limit),
      period,
      sort_by: sort_by || sortBy || 'total_spent',
    });

    const formattedCustomers = (customers || []).map(formatUser);
    return successResponse(res, formattedCustomers, 'Top customers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send notification to user
 */
const sendNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, message, type = 'system' } = req.body;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await userService.sendNotification(id, { title, message, type, sent_by: req.admin?.adminId });

    return successResponse(res, result, 'Notification sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send email to user
 */
const sendEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, body, template } = req.body;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!subject || !body) {
      return errorResponse(res, 'Subject and body are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await userService.sendEmail(id, { subject, body, template, sent_by: req.admin?.adminId });

    return successResponse(res, result, 'Email sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user login history
 */
const getLoginHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const result = await userService.getLoginHistory(id, { page: parseInt(page), limit: parseInt(limit) });

    return successResponse(res, result, 'Login history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Impersonate user
 */
const impersonate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingUser.status !== 'active') {
      return errorResponse(res, 'Cannot impersonate inactive user', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await userService.impersonate(id, req.admin?.adminId);

    return successResponse(res, result, 'Impersonation token generated');
  } catch (error) {
    next(error);
  }
};

/**
 * Add note to user
 */
const addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!note || note.trim() === '') {
      return errorResponse(res, 'Note content is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const result = await userService.addNote(id, { note, admin_id: req.admin?.adminId });

    return successResponse(res, result, 'Note added successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user notes
 */
const getNotes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const notes = await userService.getNotes(id);

    return successResponse(res, notes, 'User notes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user note
 */
const deleteNote = async (req, res, next) => {
  try {
    const { id, note_id, noteId } = req.params;
    const nId = note_id || noteId;

    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return errorResponse(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await userService.deleteNote(nId);

    return successResponse(res, null, 'Note deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByEmail,
  create,
  update,
  remove,
  updateStatus,
  toggleStatus,
  verifyEmail,
  resetPassword,
  uploadAvatar,
  removeAvatar,
  getUserOrders,
  getUserReviews,
  getUserWishlist,
  getUserCart,
  getUserAddresses,
  getUserActivity,
  getUserStatistics,
  getStatistics,
  bulkUpdate,
  bulkDelete,
  exportToExcel,
  importFromExcel,
  search,
  getRecent,
  getTopCustomers,
  sendNotification,
  sendEmail,
  getLoginHistory,
  impersonate,
  addNote,
  getNotes,
  deleteNote,
  VALID_STATUSES,
};