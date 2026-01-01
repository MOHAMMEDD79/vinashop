/**
 * Admin Controller
 * @module controllers/admin
 * 
 * FIXED: Accepts both camelCase and snake_case, responses include both formats
 */

const adminService = require('../services/admin.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const VALID_ROLES = ['super_admin', 'admin', 'employee', 'moderator'];

/**
 * Helper: Format admin for response
 */
const formatAdmin = (admin) => {
  if (!admin) return null;

  return {
    id: admin.admin_id || admin.id,
    adminId: admin.admin_id || admin.id,
    admin_id: admin.admin_id || admin.id,
    
    username: admin.username,
    email: admin.email,
    
    fullName: admin.full_name,
    full_name: admin.full_name,
    firstName: admin.first_name,
    first_name: admin.first_name,
    lastName: admin.last_name,
    last_name: admin.last_name,
    
    avatar: admin.avatar,
    avatarUrl: admin.avatar,
    avatar_url: admin.avatar,
    
    role: admin.role,
    
    isActive: admin.is_active === 1 || admin.is_active === true,
    is_active: admin.is_active === 1 || admin.is_active === true,
    isOnline: admin.is_online === 1 || admin.is_online === true,
    is_online: admin.is_online === 1 || admin.is_online === true,
    
    lastLogin: admin.last_login,
    last_login: admin.last_login,
    lastActivity: admin.last_activity,
    last_activity: admin.last_activity,
    
    createdAt: admin.created_at,
    created_at: admin.created_at,
    updatedAt: admin.updated_at,
    updated_at: admin.updated_at,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result) => {
  const items = (result.items || result.data || result.admins || []).map(formatAdmin);
  return {
    items,
    data: items,
    admins: items,
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
 * Get all admins (Super Admin only)
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search, role,
      is_active, isActive,
      sort = 'created_at', order = 'DESC',
      sortBy, sort_by, sortOrder, sort_order,
    } = req.query;

    const result = await adminService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' : undefined,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
    });

    return successResponse(res, formatPaginationResponse(result), 'Admins retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await adminService.getById(id);

    if (!admin) {
      return errorResponse(res, 'Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatAdmin(admin));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current admin profile
 */
const getProfile = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;
    const admin = await adminService.getById(adminId);

    if (!admin) {
      return errorResponse(res, 'Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, formatAdmin(admin));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new admin (Super Admin only)
 */
const create = async (req, res, next) => {
  try {
    const {
      username, email, password,
      full_name, fullName, first_name, firstName, last_name, lastName,
      role = 'admin',
      is_active, isActive,
      send_invitation, sendInvitation,
    } = req.body;

    if (!username || !email || !password) {
      return errorResponse(res, 'Username, email, and password are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const existingEmail = await adminService.findByEmail(email);
    if (existingEmail) {
      return errorResponse(res, 'Email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    const existingUsername = await adminService.findByUsername(username);
    if (existingUsername) {
      return errorResponse(res, 'Username already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    const admin = await adminService.create({
      username,
      email,
      password,
      full_name: full_name || fullName || `${first_name || firstName || ''} ${last_name || lastName || ''}`.trim(),
      role,
      is_active: (is_active ?? isActive) !== 'false' && (is_active ?? isActive) !== false,
      send_invitation: (send_invitation ?? sendInvitation) !== 'false' && (send_invitation ?? sendInvitation) !== false,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatAdmin(admin), 'Admin created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin (Super Admin only)
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      username, email,
      full_name, fullName, first_name, firstName, last_name, lastName,
      role,
      is_active, isActive,
    } = req.body;

    const existingAdmin = await adminService.getById(id);
    if (!existingAdmin) {
      return errorResponse(res, 'Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Prevent modifying own role
    if (parseInt(id) === req.admin?.adminId && role && role !== existingAdmin.role) {
      return errorResponse(res, 'Cannot modify your own role', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTH_FORBIDDEN);
    }

    if (email && email !== existingAdmin.email) {
      const existingEmail = await adminService.findByEmail(email);
      if (existingEmail) {
        return errorResponse(res, 'Email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    if (username && username !== existingAdmin.username) {
      const existingUsername = await adminService.findByUsername(username);
      if (existingUsername) {
        return errorResponse(res, 'Username already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    const fName = full_name ?? fullName;
    const computedFullName = fName !== undefined ? fName : (first_name || firstName || last_name || lastName) ? `${first_name || firstName || ''} ${last_name || lastName || ''}`.trim() : undefined;

    const admin = await adminService.update(id, {
      username,
      email,
      full_name: computedFullName,
      role,
      is_active: (is_active ?? isActive) !== undefined ? (is_active || isActive) === 'true' || (is_active || isActive) === true : undefined,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatAdmin(admin), 'Admin updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update own profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;
    const { full_name, fullName, first_name, firstName, last_name, lastName, email } = req.body;

    const existingAdmin = await adminService.getById(adminId);
    if (!existingAdmin) {
      return errorResponse(res, 'Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (email && email !== existingAdmin.email) {
      const existingEmail = await adminService.findByEmail(email);
      if (existingEmail) {
        return errorResponse(res, 'Email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    const fName = full_name ?? fullName;
    const computedFullName = fName !== undefined ? fName : (first_name || firstName || last_name || lastName) ? `${first_name || firstName || ''} ${last_name || lastName || ''}`.trim() : undefined;

    const admin = await adminService.update(adminId, {
      full_name: computedFullName,
      email,
    });

    return successResponse(res, formatAdmin(admin), 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin password
 */
const updatePassword = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;
    const {
      current_password, currentPassword,
      new_password, newPassword,
      confirm_password, confirmPassword,
    } = req.body;

    const currPass = current_password || currentPassword;
    const newPass = new_password || newPassword;
    const confPass = confirm_password || confirmPassword;

    if (!currPass || !newPass || !confPass) {
      return errorResponse(res, 'Current password, new password, and confirm password are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    if (newPass !== confPass) {
      return errorResponse(res, 'New passwords do not match', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    if (newPass.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters long', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await adminService.updatePassword(adminId, currPass, newPass);

    if (!result.success) {
      return errorResponse(res, result.message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    return successResponse(res, null, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset admin password (Super Admin only)
 */
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password, newPassword, send_email, sendEmail } = req.body;

    const existingAdmin = await adminService.getById(id);
    if (!existingAdmin) {
      return errorResponse(res, 'Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (parseInt(id) === req.admin?.adminId) {
      return errorResponse(res, 'Use the change password endpoint to update your own password', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const shouldSendEmail = (send_email ?? sendEmail) !== 'false' && (send_email ?? sendEmail) !== false;
    const result = await adminService.resetPassword(id, new_password || newPassword, shouldSendEmail);

    return successResponse(res, { temporary_password: result.temporary_password, temporaryPassword: result.temporary_password }, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete admin (Super Admin only)
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingAdmin = await adminService.getById(id);
    if (!existingAdmin) {
      return errorResponse(res, 'Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (parseInt(id) === req.admin?.adminId) {
      return errorResponse(res, 'Cannot delete your own account', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTH_FORBIDDEN);
    }

    if (existingAdmin.role === 'super_admin') {
      return errorResponse(res, 'Cannot delete a super admin account', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTH_FORBIDDEN);
    }

    await adminService.remove(id);

    return successResponse(res, null, 'Admin deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle admin active status (Super Admin only)
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingAdmin = await adminService.getById(id);
    if (!existingAdmin) {
      return errorResponse(res, 'Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (parseInt(id) === req.admin?.adminId) {
      return errorResponse(res, 'Cannot deactivate your own account', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTH_FORBIDDEN);
    }

    const admin = await adminService.toggleStatus(id);
    const status = admin.is_active ? 'activated' : 'deactivated';

    return successResponse(res, formatAdmin(admin), `Admin ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin activity log
 */
const getActivityLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const existingAdmin = await adminService.getById(id);
    if (!existingAdmin) {
      return errorResponse(res, 'Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const result = await adminService.getActivityLog(id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, result, 'Activity log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await adminService.getStatistics();

    const formattedStats = {
      total: stats.total || 0,
      totalAdmins: stats.total || 0,
      total_admins: stats.total || 0,
      active: stats.active || 0,
      activeAdmins: stats.active || 0,
      active_admins: stats.active || 0,
      inactive: stats.inactive || 0,
      online: stats.online || 0,
      onlineAdmins: stats.online || 0,
      online_admins: stats.online || 0,
      byRole: stats.by_role || stats.byRole || {},
      by_role: stats.by_role || stats.byRole || {},
    };

    return successResponse(res, formattedStats, 'Admin statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload admin avatar
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;

    if (!req.file) {
      return errorResponse(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const avatarPath = `uploads/admins/${req.file.filename}`;
    const admin = await adminService.updateAvatar(adminId, avatarPath);

    return successResponse(res, formatAdmin(admin), 'Avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove admin avatar
 */
const removeAvatar = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;
    const admin = await adminService.removeAvatar(adminId);

    return successResponse(res, formatAdmin(admin), 'Avatar removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all roles
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await adminService.getRoles();
    return successResponse(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get permissions for a role
 */
const getRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const permissions = await adminService.getRolePermissions(role);

    if (!permissions) {
      return errorResponse(res, 'Role not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return successResponse(res, permissions, 'Permissions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Check if current admin has permission
 */
const checkPermission = async (req, res, next) => {
  try {
    const { permission } = req.params;
    const hasPermission = await adminService.hasPermission(req.admin?.adminId, permission);

    return successResponse(res, { has_permission: hasPermission, hasPermission });
  } catch (error) {
    next(error);
  }
};

/**
 * Get online admins
 */
const getOnlineAdmins = async (req, res, next) => {
  try {
    const admins = await adminService.getOnlineAdmins();
    const formattedAdmins = (admins || []).map(formatAdmin);
    return successResponse(res, formattedAdmins, 'Online admins retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update last activity
 */
const updateLastActivity = async (req, res, next) => {
  try {
    const adminId = req.admin?.adminId;
    await adminService.updateLastActivity(adminId);

    return successResponse(res, null, 'Activity updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getProfile,
  create,
  update,
  updateProfile,
  updatePassword,
  resetPassword,
  remove,
  toggleStatus,
  getActivityLog,
  getStatistics,
  uploadAvatar,
  removeAvatar,
  getRoles,
  getRolePermissions,
  checkPermission,
  getOnlineAdmins,
  updateLastActivity,
  VALID_ROLES,
};