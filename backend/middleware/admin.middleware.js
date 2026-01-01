/**
 * Admin Middleware
 * @module middleware/admin
 */

const { query } = require('../config/database');
const { verifyAccessToken } = require('../config/jwt');
const { ROLES, PERMISSIONS } = require('../config/constants');

/**
 * Check if admin has specific role
 * @param {...string} allowedRoles - Allowed roles
 */
const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error_code: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
        error_code: 'FORBIDDEN',
      });
    }

    next();
  };
};

/**
 * Check if admin has specific permission
 * @param {...string} requiredPermissions - Required permissions
 */
const hasPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error_code: 'UNAUTHORIZED',
        });
      }

      // Super admin has all permissions
      if (req.admin.role === 'super_admin') {
        return next();
      }

      // Get admin permissions from database
      const [adminData] = await query(
        'SELECT permissions FROM admin_users WHERE admin_id = ?',
        [req.admin.adminId]
      );

      if (!adminData) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found',
          error_code: 'UNAUTHORIZED',
        });
      }

      const adminPermissions = adminData.permissions ? JSON.parse(adminData.permissions) : [];

      // Check if admin has all required permissions
      const hasAllPermissions = requiredPermissions.every(
        permission => adminPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: 'You do not have the required permissions',
          error_code: 'FORBIDDEN',
          required_permissions: requiredPermissions,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if admin has any of the specified permissions
 * @param {...string} permissions - Permissions to check
 */
const hasAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error_code: 'UNAUTHORIZED',
        });
      }

      // Super admin has all permissions
      if (req.admin.role === 'super_admin') {
        return next();
      }

      // Get admin permissions from database
      const [adminData] = await query(
        'SELECT permissions FROM admin_users WHERE admin_id = ?',
        [req.admin.adminId]
      );

      if (!adminData) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found',
          error_code: 'UNAUTHORIZED',
        });
      }

      const adminPermissions = adminData.permissions ? JSON.parse(adminData.permissions) : [];

      // Check if admin has any of the required permissions
      const hasAny = permissions.some(
        permission => adminPermissions.includes(permission)
      );

      if (!hasAny) {
        return res.status(403).json({
          success: false,
          message: 'You do not have the required permissions',
          error_code: 'FORBIDDEN',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Super admin only middleware
 */
const superAdminOnly = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error_code: 'UNAUTHORIZED',
    });
  }

  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'This action requires super admin privileges',
      error_code: 'FORBIDDEN',
    });
  }

  next();
};

/**
 * Check if admin is active
 */
const isActiveAdmin = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error_code: 'UNAUTHORIZED',
      });
    }

    const [adminData] = await query(
      'SELECT status FROM admin_users WHERE admin_id = ?',
      [req.admin.adminId]
    );

    if (!adminData) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found',
        error_code: 'UNAUTHORIZED',
      });
    }

    if (adminData.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active',
        error_code: 'ACCOUNT_INACTIVE',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin last activity
 */
const updateLastActivity = async (req, res, next) => {
  try {
    if (req.admin) {
      // Update in background, don't wait
      query(
        'UPDATE admin_users SET last_activity = NOW() WHERE admin_id = ?',
        [req.admin.adminId]
      ).catch(err => console.error('Failed to update last activity:', err));
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Log admin action
 */
const logAction = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = (data) => {
      // Log the action in background
      if (req.admin && data.success !== false) {
        const logData = {
          admin_id: req.admin.adminId,
          action,
          resource_type: resourceType,
          resource_id: req.params.id || null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          request_data: JSON.stringify({
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
          }),
          created_at: new Date(),
        };

        query(
          `INSERT INTO admin_activity_logs 
           (admin_id, action, resource_type, resource_id, ip_address, user_agent, request_data, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            logData.admin_id,
            logData.action,
            logData.resource_type,
            logData.resource_id,
            logData.ip_address,
            logData.user_agent,
            logData.request_data,
            logData.created_at,
          ]
        ).catch(err => console.error('Failed to log admin action:', err));
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Check resource ownership
 * @param {string} resourceType - Type of resource
 * @param {string} ownerField - Field containing owner ID
 */
const checkOwnership = (resourceType, ownerField = 'admin_id') => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error_code: 'UNAUTHORIZED',
        });
      }

      // Super admin can access all resources
      if (req.admin.role === 'super_admin') {
        return next();
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return next();
      }

      const tableMap = {
        admin: 'admin_users',
        product: 'products',
        category: 'categories',
        order: 'orders',
        message: 'contact_messages',
      };

      const tableName = tableMap[resourceType];
      if (!tableName) {
        return next();
      }

      const idField = resourceType === 'admin' ? 'admin_id' : `${resourceType}_id`;
      
      const [resource] = await query(
        `SELECT ${ownerField} FROM ${tableName} WHERE ${idField} = ?`,
        [resourceId]
      );

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          error_code: 'RESOURCE_NOT_FOUND',
        });
      }

      if (resource[ownerField] !== req.admin.adminId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          error_code: 'FORBIDDEN',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Restrict to own profile
 */
const ownProfileOnly = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error_code: 'UNAUTHORIZED',
    });
  }

  const targetId = parseInt(req.params.id);
  
  // Super admin can access any profile
  if (req.admin.role === 'super_admin') {
    return next();
  }

  if (targetId !== req.admin.adminId) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own profile',
      error_code: 'FORBIDDEN',
    });
  }

  next();
};

/**
 * Check if can modify target admin
 */
const canModifyAdmin = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error_code: 'UNAUTHORIZED',
      });
    }

    const targetId = parseInt(req.params.id);

    // Cannot modify self for certain actions
    if (targetId === req.admin.adminId) {
      const restrictedActions = ['delete', 'toggle-status', 'reset-password'];
      const action = req.path.split('/').pop();
      
      if (restrictedActions.includes(action)) {
        return res.status(403).json({
          success: false,
          message: 'You cannot perform this action on your own account',
          error_code: 'FORBIDDEN',
        });
      }
    }

    // Get target admin
    const [targetAdmin] = await query(
      'SELECT role FROM admin_users WHERE admin_id = ?',
      [targetId]
    );

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
        error_code: 'RESOURCE_NOT_FOUND',
      });
    }

    // Only super admin can modify other super admins
    if (targetAdmin.role === 'super_admin' && req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You cannot modify a super admin account',
        error_code: 'FORBIDDEN',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * IP whitelist check
 */
const checkIpWhitelist = async (req, res, next) => {
  try {
    // Get IP whitelist settings
    const [settings] = await query(
      "SELECT value FROM settings WHERE `key` = 'ip_whitelist_enabled'"
    );

    if (!settings || settings.value !== 'true') {
      return next();
    }

    const [whitelistSettings] = await query(
      "SELECT value FROM settings WHERE `key` = 'ip_whitelist'"
    );

    if (!whitelistSettings) {
      return next();
    }

    const whitelist = JSON.parse(whitelistSettings.value || '[]');
    const clientIp = req.ip || req.connection.remoteAddress;

    // Remove IPv6 prefix if present
    const cleanIp = clientIp.replace(/^::ffff:/, '');

    if (!whitelist.includes(cleanIp) && !whitelist.includes('*')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from your IP address',
        error_code: 'IP_NOT_WHITELISTED',
      });
    }

    next();
  } catch (error) {
    // If there's an error checking whitelist, allow access
    next();
  }
};

/**
 * Maintenance mode check
 */
const checkMaintenanceMode = async (req, res, next) => {
  try {
    const [settings] = await query(
      "SELECT value FROM settings WHERE `key` = 'maintenance_mode'"
    );

    if (!settings || settings.value !== 'true') {
      return next();
    }

    // Super admins can bypass maintenance mode
    if (req.admin && req.admin.role === 'super_admin') {
      return next();
    }

    // Check allowed IPs
    const [allowedIps] = await query(
      "SELECT value FROM settings WHERE `key` = 'maintenance_allowed_ips'"
    );

    if (allowedIps) {
      const ips = JSON.parse(allowedIps.value || '[]');
      const clientIp = (req.ip || req.connection.remoteAddress).replace(/^::ffff:/, '');
      
      if (ips.includes(clientIp)) {
        return next();
      }
    }

    return res.status(503).json({
      success: false,
      message: 'System is under maintenance. Please try again later.',
      error_code: 'MAINTENANCE_MODE',
    });
  } catch (error) {
    next();
  }
};

/**
 * Check permission for resource and action
 * @param {string} resource - Resource type (e.g., 'admins', 'products')
 * @param {string} action - Action type (e.g., 'read', 'create', 'update', 'delete')
 */
const checkPermission = (resource, action) => {
  // Map resource and action to permission string
  const permissionMap = {
    admins: { read: 'view_admins', create: 'create_admin', update: 'edit_admin', delete: 'delete_admin' },
    products: { read: 'view_products', create: 'create_product', update: 'edit_product', delete: 'delete_product' },
    categories: { read: 'view_categories', create: 'create_category', update: 'edit_category', delete: 'delete_category' },
    subcategories: { read: 'view_subcategories', create: 'create_subcategory', update: 'edit_subcategory', delete: 'delete_subcategory' },
    orders: { read: 'view_orders', update: 'update_order_status', cancel: 'cancel_order' },
    users: { read: 'view_users', create: 'create_user', update: 'edit_user', delete: 'delete_user', block: 'block_user' },
    messages: { read: 'view_messages', reply: 'reply_message', delete: 'delete_message' },
    reviews: { read: 'view_reviews', approve: 'approve_review', delete: 'delete_review' },
    notifications: { read: 'view_notifications', send: 'send_notification' },
    billing: { read: 'view_billing', create: 'create_invoice', manage: 'manage_billing' },
    reports: { read: 'view_reports', export: 'export_reports' },
    settings: { read: 'view_settings', update: 'edit_settings' },
    dashboard: { read: 'view_dashboard', statistics: 'view_statistics' },
    colors: { read: 'manage_colors', create: 'manage_colors', update: 'manage_colors', delete: 'manage_colors' },
    sizes: { read: 'manage_sizes', create: 'manage_sizes', update: 'manage_sizes', delete: 'manage_sizes' },
  };

  const permission = permissionMap[resource]?.[action];
  
  if (!permission) {
    // If no specific permission found, allow access
    return (req, res, next) => next();
  }

  return hasPermission(permission);
};

module.exports = {
  hasRole,
  hasPermission,
  hasAnyPermission,
  superAdminOnly,
  isActiveAdmin,
  updateLastActivity,
  logAction,
  checkOwnership,
  ownProfileOnly,
  canModifyAdmin,
  checkIpWhitelist,
  checkMaintenanceMode,
  checkPermission,
};