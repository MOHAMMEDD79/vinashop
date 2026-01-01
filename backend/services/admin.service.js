/**
 * Admin Service
 * @module services/admin
 */

const Admin = require('../models/admin.model');
const Auth = require('../models/auth.model');
const ImageService = require('./image.service');
const EmailService = require('./email.service');

class AdminService {
  /**
   * Get all admins with pagination
   */
  static async getAll(options = {}) {
    return await Admin.getAll(options);
  }

  /**
   * Get all admins for dropdown
   */
  static async getAllList(options = {}) {
    return await Admin.getAllList(options);
  }

  /**
   * Get admin by ID
   */
  static async getById(adminId) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }
    return admin;
  }

  /**
   * Create new admin
   */
  static async create(data, createdBy) {
    // Check if email exists
    const existingEmail = await Admin.emailExists(data.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Check if username exists
    if (data.username) {
      const existingUsername = await Admin.usernameExists(data.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    // Generate temporary password if not provided
    const tempPassword = data.password || this.generateTempPassword();

    // Create admin
    const admin = await Admin.create({
      ...data,
      password: tempPassword,
      created_by: createdBy,
    });

    // Send welcome email with credentials
    await EmailService.sendAdminWelcomeEmail(
      admin.email,
      admin.first_name,
      admin.username,
      tempPassword
    );

    // Log action
    await Admin.logAction(createdBy, 'create_admin', {
      admin_id: admin.admin_id,
      email: admin.email,
    });

    return admin;
  }

  /**
   * Update admin
   */
  static async update(adminId, data, updatedBy) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Check email uniqueness
    if (data.email && data.email !== admin.email) {
      const existingEmail = await Admin.emailExists(data.email, adminId);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Check username uniqueness
    if (data.username && data.username !== admin.username) {
      const existingUsername = await Admin.usernameExists(data.username, adminId);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    const updatedAdmin = await Admin.update(adminId, data);

    // Log action
    await Admin.logAction(updatedBy, 'update_admin', {
      admin_id: adminId,
      changes: data,
    });

    return updatedAdmin;
  }

  /**
   * Delete admin
   */
  static async delete(adminId, deletedBy) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Cannot delete yourself
    if (adminId === deletedBy) {
      throw new Error('Cannot delete your own account');
    }

    // Cannot delete super admin
    if (admin.role === 'super_admin') {
      throw new Error('Cannot delete super admin account');
    }

    // Delete avatar if exists
    if (admin.avatar) {
      await ImageService.deleteFile(admin.avatar);
    }

    // Revoke all sessions
    await Auth.revokeAllSessions(adminId);

    // Delete admin
    await Admin.delete(adminId);

    // Log action
    await Admin.logAction(deletedBy, 'delete_admin', {
      admin_id: adminId,
      email: admin.email,
    });

    return true;
  }

  /**
   * Toggle admin status
   */
  static async toggleStatus(adminId, updatedBy) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Cannot deactivate yourself
    if (adminId === updatedBy) {
      throw new Error('Cannot change your own status');
    }

    // Cannot deactivate super admin
    if (admin.role === 'super_admin') {
      throw new Error('Cannot change super admin status');
    }

    const updatedAdmin = await Admin.toggleStatus(adminId);

    // If deactivated, revoke all sessions
    if (updatedAdmin.status !== 'active') {
      await Auth.revokeAllSessions(adminId);
    }

    // Log action
    await Admin.logAction(updatedBy, 'toggle_admin_status', {
      admin_id: adminId,
      new_status: updatedAdmin.status,
    });

    return updatedAdmin;
  }

  /**
   * Reset admin password
   */
  static async resetPassword(adminId, newPassword, resetBy) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Generate password if not provided
    const password = newPassword || this.generateTempPassword();

    await Admin.updatePassword(adminId, password);

    // Revoke all sessions
    await Auth.revokeAllSessions(adminId);

    // Send email with new password
    await EmailService.sendPasswordResetByAdminEmail(
      admin.email,
      admin.first_name,
      password
    );

    // Log action
    await Admin.logAction(resetBy, 'reset_admin_password', {
      admin_id: adminId,
    });

    return true;
  }

  /**
   * Update admin permissions
   */
  static async updatePermissions(adminId, permissions, updatedBy) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Cannot change super admin permissions
    if (admin.role === 'super_admin') {
      throw new Error('Cannot change super admin permissions');
    }

    const updatedAdmin = await Admin.updatePermissions(adminId, permissions);

    // Log action
    await Admin.logAction(updatedBy, 'update_admin_permissions', {
      admin_id: adminId,
      permissions,
    });

    return updatedAdmin;
  }

  /**
   * Upload admin avatar
   */
  static async uploadAvatar(adminId, file, uploadedBy) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Can only update own avatar or if super admin
    // (this check should be done in controller)

    // Delete old avatar
    if (admin.avatar) {
      await ImageService.deleteFile(admin.avatar);
    }

    // Save new avatar
    const avatarUrl = await ImageService.saveAdminAvatar(file, adminId);
    const updatedAdmin = await Admin.updateAvatar(adminId, avatarUrl);

    // Log action
    await Admin.logAction(uploadedBy, 'update_admin_avatar', {
      admin_id: adminId,
    });

    return updatedAdmin;
  }

  /**
   * Delete admin avatar
   */
  static async deleteAvatar(adminId, deletedBy) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    if (admin.avatar) {
      await ImageService.deleteFile(admin.avatar);
      await Admin.updateAvatar(adminId, null);
    }

    // Log action
    await Admin.logAction(deletedBy, 'delete_admin_avatar', {
      admin_id: adminId,
    });

    return true;
  }

  /**
   * Get admin activity log
   */
  static async getActivityLog(options = {}) {
    return await Admin.getActivityLog(options);
  }

  /**
   * Get specific admin's activity
   */
  static async getAdminActivity(adminId, options = {}) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }
    return await Admin.getAdminActivityLog(adminId, options);
  }

  /**
   * Get admin statistics
   */
  static async getStatistics() {
    return await Admin.getStatistics();
  }

  /**
   * Bulk update admins
   */
  static async bulkUpdate(adminIds, data, updatedBy) {
    // Filter out super admins and self
    const admins = await Promise.all(
      adminIds.map(id => Admin.getById(id))
    );

    const validIds = admins
      .filter(admin => admin && admin.role !== 'super_admin' && admin.admin_id !== updatedBy)
      .map(admin => admin.admin_id);

    if (validIds.length === 0) {
      throw new Error('No valid admins to update');
    }

    const result = await Admin.bulkUpdate(validIds, data);

    // Log action
    await Admin.logAction(updatedBy, 'bulk_update_admins', {
      admin_ids: validIds,
      changes: data,
    });

    return result;
  }

  /**
   * Bulk delete admins
   */
  static async bulkDelete(adminIds, deletedBy) {
    // Filter out super admins and self
    const admins = await Promise.all(
      adminIds.map(id => Admin.getById(id))
    );

    const validAdmins = admins.filter(
      admin => admin && admin.role !== 'super_admin' && admin.admin_id !== deletedBy
    );

    if (validAdmins.length === 0) {
      throw new Error('No valid admins to delete');
    }

    // Delete avatars
    for (const admin of validAdmins) {
      if (admin.avatar) {
        await ImageService.deleteFile(admin.avatar);
      }
      // Revoke sessions
      await Auth.revokeAllSessions(admin.admin_id);
    }

    const validIds = validAdmins.map(admin => admin.admin_id);
    const result = await Admin.bulkDelete(validIds);

    // Log action
    await Admin.logAction(deletedBy, 'bulk_delete_admins', {
      admin_ids: validIds,
    });

    return result;
  }

  /**
   * Search admins
   */
  static async search(searchTerm, options = {}) {
    return await Admin.search(searchTerm, options);
  }

  /**
   * Get admin by role
   */
  static async getByRole(role) {
    return await Admin.getByRole(role);
  }

  /**
   * Generate temporary password
   */
  static generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Check permission
   */
  static async checkPermission(adminId, resource, action) {
    const admin = await Admin.getById(adminId);
    if (!admin) {
      return false;
    }

    // Super admin has all permissions
    if (admin.role === 'super_admin') {
      return true;
    }

    // Check specific permission
    if (!admin.permissions || !admin.permissions[resource]) {
      return false;
    }

    return admin.permissions[resource][action] === true;
  }
}

module.exports = AdminService;