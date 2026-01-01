/**
 * Email Service
 * @module services/email
 */

const nodemailer = require('nodemailer');
const { emailConfig } = require('../config/email');

class EmailService {
  static transporter = null;

  /**
   * Initialize email transporter
   */
  static async init() {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });

    return this.transporter;
  }

  /**
   * Send email
   */
  static async send(options) {
    await this.init();

    const mailOptions = {
      from: options.from || `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test email configuration
   */
  static async testConnection() {
    await this.init();
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== User Emails ====================

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(email, firstName) {
    const html = this.getTemplate('welcome', {
      firstName,
      loginUrl: `${emailConfig.appUrl}/login`,
    });

    return await this.send({
      to: email,
      subject: 'Welcome to VinaShop!',
      html,
    });
  }

  /**
   * Send email verification
   */
  static async sendVerificationEmail(email, firstName, verificationToken) {
    const verificationUrl = `${emailConfig.appUrl}/verify-email?token=${verificationToken}`;

    const html = this.getTemplate('verification', {
      firstName,
      verificationUrl,
    });

    return await this.send({
      to: email,
      subject: 'Verify Your Email Address',
      html,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email, firstName, resetToken) {
    const resetUrl = `${emailConfig.appUrl}/reset-password?token=${resetToken}`;

    const html = this.getTemplate('passwordReset', {
      firstName,
      resetUrl,
    });

    return await this.send({
      to: email,
      subject: 'Reset Your Password',
      html,
    });
  }

  /**
   * Send password changed confirmation
   */
  static async sendPasswordChangedEmail(email, firstName) {
    const html = this.getTemplate('passwordChanged', {
      firstName,
    });

    return await this.send({
      to: email,
      subject: 'Your Password Has Been Changed',
      html,
    });
  }

  /**
   * Send password reset by admin
   */
  static async sendPasswordResetByAdminEmail(email, firstName, newPassword) {
    const html = this.getTemplate('passwordResetByAdmin', {
      firstName,
      newPassword,
      loginUrl: `${emailConfig.appUrl}/login`,
    });

    return await this.send({
      to: email,
      subject: 'Your Password Has Been Reset',
      html,
    });
  }

  /**
   * Send account suspended email
   */
  static async sendAccountSuspendedEmail(email, firstName, reason) {
    const html = this.getTemplate('accountSuspended', {
      firstName,
      reason: reason || 'Violation of terms of service',
      supportEmail: emailConfig.supportEmail,
    });

    return await this.send({
      to: email,
      subject: 'Your Account Has Been Suspended',
      html,
    });
  }

  /**
   * Send account reactivated email
   */
  static async sendAccountReactivatedEmail(email, firstName) {
    const html = this.getTemplate('accountReactivated', {
      firstName,
      loginUrl: `${emailConfig.appUrl}/login`,
    });

    return await this.send({
      to: email,
      subject: 'Your Account Has Been Reactivated',
      html,
    });
  }

  // ==================== Order Emails ====================

  /**
   * Send order confirmation
   */
  static async sendOrderConfirmationEmail(email, firstName, order, items) {
    const html = this.getTemplate('orderConfirmation', {
      firstName,
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at).toLocaleDateString(),
      items,
      subtotal: order.subtotal,
      shipping: order.shipping_cost,
      tax: order.tax_amount,
      total: order.total_amount,
      shippingAddress: order.shipping_address,
      orderUrl: `${emailConfig.appUrl}/orders/${order.order_id}`,
    });

    return await this.send({
      to: email,
      subject: `Order Confirmation #${order.order_number}`,
      html,
    });
  }

  /**
   * Send order status update
   */
  static async sendOrderStatusEmail(email, firstName, orderNumber, status) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being processed.',
      processing: 'Your order is being prepared for shipment.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered.',
      cancelled: 'Your order has been cancelled.',
    };

    const html = this.getTemplate('orderStatus', {
      firstName,
      orderNumber,
      status,
      statusMessage: statusMessages[status] || 'Your order status has been updated.',
      orderUrl: `${emailConfig.appUrl}/orders`,
    });

    return await this.send({
      to: email,
      subject: `Order #${orderNumber} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html,
    });
  }

  /**
   * Send tracking information
   */
  static async sendTrackingEmail(email, firstName, orderNumber, trackingData) {
    const html = this.getTemplate('tracking', {
      firstName,
      orderNumber,
      carrier: trackingData.carrier,
      trackingNumber: trackingData.tracking_number,
      trackingUrl: trackingData.tracking_url,
    });

    return await this.send({
      to: email,
      subject: `Your Order #${orderNumber} Has Shipped`,
      html,
    });
  }

  /**
   * Send order cancellation email
   */
  static async sendOrderCancellationEmail(email, firstName, orderNumber, reason) {
    const html = this.getTemplate('orderCancellation', {
      firstName,
      orderNumber,
      reason: reason || 'Requested by customer',
      supportEmail: emailConfig.supportEmail,
    });

    return await this.send({
      to: email,
      subject: `Order #${orderNumber} Has Been Cancelled`,
      html,
    });
  }

  /**
   * Send refund confirmation
   */
  static async sendRefundEmail(email, firstName, orderNumber, refundAmount) {
    const html = this.getTemplate('refund', {
      firstName,
      orderNumber,
      refundAmount: refundAmount.toFixed(2),
    });

    return await this.send({
      to: email,
      subject: `Refund Processed for Order #${orderNumber}`,
      html,
    });
  }

  // ==================== Admin Emails ====================

  /**
   * Send admin welcome email
   */
  static async sendAdminWelcomeEmail(email, firstName, username, password) {
    const html = this.getTemplate('adminWelcome', {
      firstName,
      username,
      password,
      loginUrl: `${emailConfig.adminUrl}/login`,
    });

    return await this.send({
      to: email,
      subject: 'Welcome to VinaShop Admin Panel',
      html,
    });
  }

  // ==================== Message Emails ====================

  /**
   * Send message reply email
   */
  static async sendMessageReplyEmail(email, name, replyMessage, originalSubject) {
    const html = this.getTemplate('messageReply', {
      name,
      replyMessage,
      originalSubject,
    });

    return await this.send({
      to: email,
      subject: `Re: ${originalSubject}`,
      html,
    });
  }

  // ==================== Invoice Emails ====================

  /**
   * Send invoice email
   */
  static async sendInvoiceEmail(email, firstName, invoice, pdfBuffer) {
    const html = this.getTemplate('invoice', {
      firstName,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.total_amount.toFixed(2),
      dueDate: new Date(invoice.due_date).toLocaleDateString(),
    });

    return await this.send({
      to: email,
      subject: `Invoice #${invoice.invoice_number}`,
      html,
      attachments: [
        {
          filename: `invoice_${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  // ==================== Custom Email ====================

  /**
   * Send custom email
   */
  static async sendCustomEmail(email, subject, message) {
    const html = this.getTemplate('custom', { message });

    return await this.send({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send bulk email
   */
  static async sendBulkEmail(emails, subject, message) {
    const results = [];
    for (const email of emails) {
      const result = await this.sendCustomEmail(email, subject, message);
      results.push({ email, ...result });
    }
    return results;
  }

  // ==================== Email Templates ====================

  /**
   * Get email template
   */
  static getTemplate(templateName, data) {
    const templates = {
      welcome: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to VinaShop!</h1>
          <p>Hi ${d.firstName},</p>
          <p>Thank you for joining VinaShop! We're excited to have you as a member.</p>
          <p>Start exploring our wide range of products and enjoy exclusive deals.</p>
          <p><a href="${d.loginUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Shopping</a></p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      verification: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify Your Email</h1>
          <p>Hi ${d.firstName},</p>
          <p>Please click the button below to verify your email address:</p>
          <p><a href="${d.verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      passwordReset: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Reset Your Password</h1>
          <p>Hi ${d.firstName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p><a href="${d.resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      passwordChanged: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Changed</h1>
          <p>Hi ${d.firstName},</p>
          <p>Your password has been successfully changed.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      passwordResetByAdmin: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your Password Has Been Reset</h1>
          <p>Hi ${d.firstName},</p>
          <p>Your password has been reset by an administrator. Here are your new credentials:</p>
          <p><strong>New Password:</strong> ${d.newPassword}</p>
          <p>Please change your password after logging in.</p>
          <p><a href="${d.loginUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      accountSuspended: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc3545;">Account Suspended</h1>
          <p>Hi ${d.firstName},</p>
          <p>Your account has been suspended.</p>
          <p><strong>Reason:</strong> ${d.reason}</p>
          <p>If you believe this is a mistake, please contact us at ${d.supportEmail}</p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      accountReactivated: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">Account Reactivated</h1>
          <p>Hi ${d.firstName},</p>
          <p>Good news! Your account has been reactivated.</p>
          <p>You can now log in and continue using VinaShop.</p>
          <p><a href="${d.loginUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      orderConfirmation: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Confirmation</h1>
          <p>Hi ${d.firstName},</p>
          <p>Thank you for your order! Here are the details:</p>
          <p><strong>Order Number:</strong> ${d.orderNumber}</p>
          <p><strong>Order Date:</strong> ${d.orderDate}</p>
          <hr>
          <p><strong>Subtotal:</strong> $${d.subtotal}</p>
          <p><strong>Shipping:</strong> $${d.shipping}</p>
          <p><strong>Tax:</strong> $${d.tax}</p>
          <p><strong>Total:</strong> $${d.total}</p>
          <hr>
          <p><a href="${d.orderUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      orderStatus: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Update</h1>
          <p>Hi ${d.firstName},</p>
          <p><strong>Order #${d.orderNumber}</strong></p>
          <p>${d.statusMessage}</p>
          <p><a href="${d.orderUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      tracking: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your Order Has Shipped!</h1>
          <p>Hi ${d.firstName},</p>
          <p>Great news! Your order #${d.orderNumber} has been shipped.</p>
          <p><strong>Carrier:</strong> ${d.carrier}</p>
          <p><strong>Tracking Number:</strong> ${d.trackingNumber}</p>
          ${d.trackingUrl ? `<p><a href="${d.trackingUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Package</a></p>` : ''}
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      orderCancellation: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc3545;">Order Cancelled</h1>
          <p>Hi ${d.firstName},</p>
          <p>Your order #${d.orderNumber} has been cancelled.</p>
          <p><strong>Reason:</strong> ${d.reason}</p>
          <p>If you have any questions, please contact us at ${d.supportEmail}</p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      refund: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">Refund Processed</h1>
          <p>Hi ${d.firstName},</p>
          <p>A refund of <strong>$${d.refundAmount}</strong> has been processed for your order #${d.orderNumber}.</p>
          <p>Please allow 5-10 business days for the refund to appear in your account.</p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      adminWelcome: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to VinaShop Admin</h1>
          <p>Hi ${d.firstName},</p>
          <p>Your admin account has been created. Here are your credentials:</p>
          <p><strong>Username:</strong> ${d.username}</p>
          <p><strong>Password:</strong> ${d.password}</p>
          <p>Please change your password after your first login.</p>
          <p><a href="${d.loginUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Admin Panel</a></p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      messageReply: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Response to Your Message</h1>
          <p>Hi ${d.name},</p>
          <p>Thank you for contacting us. Here is our response:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${d.replyMessage}
          </div>
          <p>If you have any further questions, feel free to reply to this email.</p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      invoice: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Invoice #${d.invoiceNumber}</h1>
          <p>Hi ${d.firstName},</p>
          <p>Please find your invoice attached to this email.</p>
          <p><strong>Amount Due:</strong> $${d.amount}</p>
          <p><strong>Due Date:</strong> ${d.dueDate}</p>
          <p>Best regards,<br>The VinaShop Team</p>
        </div>
      `,

      custom: (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px;">
            ${d.message}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Best regards,<br>The VinaShop Team
          </p>
        </div>
      `,
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    return this.wrapTemplate(template(data));
  }

  /**
   * Wrap template with base HTML
   */
  static wrapTemplate(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">VinaShop</h2>
          </div>
          <div style="padding: 30px;">
            ${content}
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} VinaShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailService;