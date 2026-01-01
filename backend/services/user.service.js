/**
 * User Service
 * @module services/user
 */

const User = require('../models/user.model');
const Address = require('../models/address.model');
const Order = require('../models/order.model');
const Review = require('../models/review.model');
const Wishlist = require('../models/wishlist.model');
const Auth = require('../models/auth.model');
const ImageService = require('./image.service');
const EmailService = require('./email.service');
const NotificationService = require('./notification.service');

class UserService {
  /**
   * Get all users with pagination
   */
  static async getAll(options = {}) {
    return await User.getAll(options);
  }

  /**
   * Get all users for dropdown
   */
  static async getAllList(options = {}) {
    return await User.getAllList(options);
  }

  /**
   * Get user by ID
   */
  static async getById(userId) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Get user by email
   */
  static async getByEmail(email) {
    return await User.getByEmail(email);
  }

  /**
   * Get user with orders summary
   */
  static async getWithOrdersSummary(userId) {
    const user = await User.getWithOrdersSummary(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Create new user
   */
  static async create(data) {
    // Check if email exists
    const existingEmail = await User.emailExists(data.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Check if username exists
    if (data.username) {
      const existingUsername = await User.usernameExists(data.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    // Create user
    const user = await User.create(data);

    // Send welcome email
    await EmailService.sendWelcomeEmail(user.email, user.first_name);

    return user;
  }

  /**
   * Update user
   */
  static async update(userId, data) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check email uniqueness
    if (data.email && data.email !== user.email) {
      const existingEmail = await User.emailExists(data.email, userId);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Check username uniqueness
    if (data.username && data.username !== user.username) {
      const existingUsername = await User.usernameExists(data.username, userId);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    return await User.update(userId, data);
  }

  /**
   * Delete user
   */
  static async delete(userId) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete avatar if exists
    if (user.profile_image) {
      await ImageService.deleteFile(user.profile_image);
    }

    return await User.delete(userId);
  }

  /**
   * Update user status
   */
  static async updateStatus(userId, status) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await User.updateStatus(userId, status);
  }

  /**
   * Toggle user status
   */
  static async toggleStatus(userId) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await User.toggleStatus(userId);
  }

  /**
   * Suspend user
   */
  static async suspend(userId, reason = null) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const suspendedUser = await User.suspend(userId, reason);

    // Send suspension email
    await EmailService.sendAccountSuspendedEmail(user.email, user.first_name, reason);

    return suspendedUser;
  }

  /**
   * Unsuspend user
   */
  static async unsuspend(userId) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const unsuspendedUser = await User.unsuspend(userId);

    // Send reactivation email
    await EmailService.sendAccountReactivatedEmail(user.email, user.first_name);

    return unsuspendedUser;
  }

  /**
   * Reset user password
   */
  static async resetPassword(userId, newPassword) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate password if not provided
    const password = newPassword || this.generatePassword();

    await User.updatePassword(userId, password);

    // Send email with new password
    await EmailService.sendPasswordResetByAdminEmail(user.email, user.first_name, password);

    return true;
  }

  /**
   * Verify user email manually
   */
  static async verifyEmail(userId) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.is_email_verified) {
      throw new Error('Email is already verified');
    }

    return await User.verifyEmail(userId);
  }

  /**
   * Upload user avatar
   */
  static async uploadAvatar(userId, file) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete old avatar
    if (user.profile_image) {
      await ImageService.deleteFile(user.profile_image);
    }

    // Save new avatar
    const avatarUrl = await ImageService.saveUserAvatar(file, userId);
    return await User.updateProfileImage(userId, avatarUrl);
  }

  /**
   * Delete user avatar
   */
  static async deleteAvatar(userId) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.profile_image) {
      await ImageService.deleteFile(user.profile_image);
      await User.updateProfileImage(userId, null);
    }

    return true;
  }

  /**
   * Get user orders
   */
  static async getOrders(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await Order.getByUserId(userId, options);
  }

  /**
   * Get user addresses
   */
  static async getAddresses(userId) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await Address.getByUserId(userId);
  }

  /**
   * Get user wishlist
   */
  static async getWishlist(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await Wishlist.getByUserId(userId, options);
  }

  /**
   * Get user reviews
   */
  static async getReviews(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await Review.getByUserId(userId, options);
  }

  /**
   * Get user activity log
   */
  static async getActivityLog(userId, options = {}) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await User.getActivityLog(userId, options);
  }

  /**
   * Send notification to user
   */
  static async sendNotification(userId, notificationData) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await NotificationService.sendToUser(userId, notificationData);
  }

  /**
   * Send email to user
   */
  static async sendEmail(userId, emailData) {
    const user = await User.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await EmailService.sendCustomEmail(
      user.email,
      emailData.subject,
      emailData.message
    );
  }

  /**
   * Get user statistics
   */
  static async getStatistics(options = {}) {
    return await User.getStatistics(options);
  }

  /**
   * Get recent users
   */
  static async getRecent(limit = 10) {
    return await User.getRecent(limit);
  }

  /**
   * Get top customers
   */
  static async getTopCustomers(options = {}) {
    return await User.getTopCustomers(options);
  }

  /**
   * Get users count by status
   */
  static async getCountByStatus() {
    return await User.getCountByStatus();
  }

  /**
   * Get registration trend
   */
  static async getRegistrationTrend(options = {}) {
    return await User.getRegistrationTrend(options);
  }

  /**
   * Search users
   */
  static async search(searchTerm, options = {}) {
    return await User.search(searchTerm, options);
  }

  /**
   * Bulk update users
   */
  static async bulkUpdate(userIds, data) {
    return await User.bulkUpdate(userIds, data);
  }

  /**
   * Bulk delete users
   */
  static async bulkDelete(userIds) {
    // Delete avatars
    for (const userId of userIds) {
      try {
        const user = await User.getById(userId);
        if (user && user.profile_image) {
          await ImageService.deleteFile(user.profile_image);
        }
      } catch (e) {
        // Continue
      }
    }

    return await User.bulkDelete(userIds);
  }

  /**
   * Bulk send notification
   */
  static async bulkSendNotification(userIds, notificationData) {
    return await NotificationService.sendToMultipleUsers(userIds, notificationData);
  }

  /**
   * Export users
   */
  static async export(options = {}) {
    return await User.getAllForExport(options);
  }

  /**
   * Get marketing list
   */
  static async getMarketingList(options = {}) {
    return await User.getMarketingOptIn(options);
  }

  /**
   * Generate password
   */
  static generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get user count
   */
  static async getCount(options = {}) {
    return await User.getCount(options);
  }
}

module.exports = UserService;