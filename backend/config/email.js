/**
 * Email Configuration
 * @module config/email
 */

const nodemailer = require('nodemailer');

/**
 * SMTP Configuration
 */
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
};

/**
 * Create transporter
 */
const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Default email options
 */
const defaultOptions = {
  from: process.env.EMAIL_FROM || 'VinaShop Admin <noreply@vinashop.com>',
};

/**
 * Verify transporter connection
 */
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      ...defaultOptions,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    throw error;
  }
};

/**
 * Email Templates
 */
const templates = {
  /**
   * Admin Invitation Email
   */
  adminInvitation: (data) => ({
    subject: 'You have been invited to VinaShop Admin Panel',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Invitation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-top: 0; }
          .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .credentials { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .credentials p { margin: 10px 0; }
          .credentials strong { color: #667eea; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to VinaShop Admin</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.fullName || 'Admin'},</h2>
            <p>You have been invited to join the VinaShop Admin Panel as <strong>${data.role}</strong>.</p>
            
            <div class="credentials">
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
              <p><strong>Role:</strong> ${data.role}</p>
            </div>
            
            <p>Click the button below to access the admin panel:</p>
            
            <a href="${data.loginUrl || process.env.FRONTEND_URL}/login" class="button">Access Admin Panel</a>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p>Please change your password immediately after your first login.</p>
            </div>
            
            <p>If you did not expect this invitation, please ignore this email or contact your administrator.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VinaShop. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to VinaShop Admin Panel!
      
      Hello ${data.fullName || 'Admin'},
      
      You have been invited to join the VinaShop Admin Panel as ${data.role}.
      
      Your credentials:
      Email: ${data.email}
      Temporary Password: ${data.temporaryPassword}
      
      Login URL: ${data.loginUrl || process.env.FRONTEND_URL}/login
      
      Please change your password immediately after your first login.
      
      If you did not expect this invitation, please ignore this email.
    `,
  }),

  /**
   * Password Reset Email
   */
  passwordReset: (data) => ({
    subject: 'Password Reset Request - VinaShop Admin',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-top: 0; }
          .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .code { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .code span { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { color: #dc3545; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.fullName || 'Admin'},</h2>
            <p>We received a request to reset your password for your VinaShop Admin account.</p>
            
            <p>Use the following code to reset your password:</p>
            
            <div class="code">
              <span>${data.resetCode}</span>
            </div>
            
            <p>Or click the button below:</p>
            
            <a href="${data.resetUrl || process.env.FRONTEND_URL}/reset-password?code=${data.resetCode}&email=${data.email}" class="button">Reset Password</a>
            
            <p class="warning">⏰ This code will expire in ${data.expiryMinutes || 30} minutes.</p>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VinaShop. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello ${data.fullName || 'Admin'},
      
      We received a request to reset your password for your VinaShop Admin account.
      
      Your reset code: ${data.resetCode}
      
      This code will expire in ${data.expiryMinutes || 30} minutes.
      
      Reset URL: ${data.resetUrl || process.env.FRONTEND_URL}/reset-password?code=${data.resetCode}&email=${data.email}
      
      If you did not request this, please ignore this email.
    `,
  }),

  /**
   * Order Status Update Email
   */
  orderStatusUpdate: (data) => ({
    subject: `Order #${data.orderNumber} - Status Updated to ${data.status}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: #fff; background-color: ${data.statusColor || '#667eea'}; }
          .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-details p { margin: 10px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Order Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>Your order status has been updated!</p>
            
            <p>New Status: <span class="status-badge">${data.status}</span></p>
            
            <div class="order-details">
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Order Date:</strong> ${data.orderDate}</p>
              <p><strong>Total Amount:</strong> ₪${data.totalAmount}</p>
              ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
            </div>
            
            ${data.message ? `<p>${data.message}</p>` : ''}
            
            <p>Thank you for shopping with VinaShop!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VinaShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Order Status Update
      
      Hello ${data.customerName},
      
      Your order status has been updated!
      
      New Status: ${data.status}
      
      Order Number: ${data.orderNumber}
      Order Date: ${data.orderDate}
      Total Amount: ₪${data.totalAmount}
      ${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ''}
      
      ${data.message || ''}
      
      Thank you for shopping with VinaShop!
    `,
  }),

  /**
   * Contact Message Reply Email
   */
  contactReply: (data) => ({
    subject: `Re: ${data.subject} - VinaShop Support`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Reply</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .original-message { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .reply-message { background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 Support Response</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>Thank you for contacting VinaShop Support. Here is our response to your inquiry:</p>
            
            <div class="original-message">
              <p><strong>Your Original Message:</strong></p>
              <p>${data.originalMessage}</p>
            </div>
            
            <div class="reply-message">
              <p><strong>Our Response:</strong></p>
              <p>${data.replyMessage}</p>
            </div>
            
            <p>If you have any further questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>VinaShop Support Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VinaShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Support Response
      
      Hello ${data.customerName},
      
      Thank you for contacting VinaShop Support. Here is our response to your inquiry:
      
      Your Original Message:
      ${data.originalMessage}
      
      Our Response:
      ${data.replyMessage}
      
      If you have any further questions, please don't hesitate to contact us.
      
      Best regards,
      VinaShop Support Team
    `,
  }),

  /**
   * New Order Notification (for admins)
   */
  newOrderNotification: (data) => ({
    subject: `🛒 New Order #${data.orderNumber} - ₪${data.totalAmount}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .order-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-info table { width: 100%; border-collapse: collapse; }
          .order-info td { padding: 8px 0; border-bottom: 1px solid #eee; }
          .order-info td:first-child { font-weight: bold; width: 40%; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          .items-table th { background-color: #f8f9fa; }
          .total { font-size: 24px; font-weight: bold; color: #22c55e; }
          .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 New Order Received!</h1>
          </div>
          <div class="content">
            <p class="total">Total: ₪${data.totalAmount}</p>
            
            <div class="order-info">
              <table>
                <tr><td>Order Number:</td><td>${data.orderNumber}</td></tr>
                <tr><td>Customer:</td><td>${data.customerName}</td></tr>
                <tr><td>Email:</td><td>${data.customerEmail}</td></tr>
                <tr><td>Phone:</td><td>${data.customerPhone}</td></tr>
                <tr><td>Payment Method:</td><td>${data.paymentMethod}</td></tr>
                <tr><td>Order Date:</td><td>${data.orderDate}</td></tr>
              </table>
            </div>
            
            <h3>Shipping Address:</h3>
            <p>${data.shippingAddress}</p>
            
            <h3>Order Items:</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₪${item.price}</td>
                    <td>₪${item.total}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}" class="button">View Order Details</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VinaShop Admin Panel</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Order Received!
      
      Order Number: ${data.orderNumber}
      Total: ₪${data.totalAmount}
      
      Customer: ${data.customerName}
      Email: ${data.customerEmail}
      Phone: ${data.customerPhone}
      Payment Method: ${data.paymentMethod}
      
      Shipping Address:
      ${data.shippingAddress}
      
      Order Items:
      ${data.items.map(item => `- ${item.name} x${item.quantity} = ₪${item.total}`).join('\n')}
      
      View order: ${process.env.FRONTEND_URL}/orders/${data.orderId}
    `,
  }),

  /**
   * Low Stock Alert
   */
  lowStockAlert: (data) => ({
    subject: `⚠️ Low Stock Alert - ${data.products.length} Products`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Low Stock Alert</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .products-table th, .products-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          .products-table th { background-color: #f8f9fa; }
          .stock-low { color: #f59e0b; font-weight: bold; }
          .stock-critical { color: #ef4444; font-weight: bold; }
          .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div class="content">
            <p>The following products are running low on stock:</p>
            
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                </tr>
              </thead>
              <tbody>
                ${data.products.map(product => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.sku}</td>
                    <td class="${product.stock <= 5 ? 'stock-critical' : 'stock-low'}">${product.stock}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <a href="${process.env.FRONTEND_URL}/products" class="button">Manage Products</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VinaShop Admin Panel</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Low Stock Alert
      
      The following products are running low on stock:
      
      ${data.products.map(p => `- ${p.name} (SKU: ${p.sku}) - Stock: ${p.stock}`).join('\n')}
      
      Manage products: ${process.env.FRONTEND_URL}/products
    `,
  }),
};

/**
 * Send templated email
 * @param {string} templateName - Template name
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Promise<Object>} Send result
 */
const sendTemplateEmail = async (templateName, to, data) => {
  const template = templates[templateName];
  
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }
  
  const { subject, html, text } = template(data);
  
  return await sendEmail({
    to,
    subject,
    html,
    text,
  });
};

/**
 * Send email to multiple recipients
 * @param {Array<string>} recipients - Array of email addresses
 * @param {Object} options - Email options
 * @returns {Promise<Array>} Send results
 */
const sendBulkEmail = async (recipients, options) => {
  const results = [];
  
  for (const to of recipients) {
    try {
      const result = await sendEmail({ ...options, to });
      results.push({ to, success: true, ...result });
    } catch (error) {
      results.push({ to, success: false, error: error.message });
    }
  }
  
  return results;
};

module.exports = {
  transporter,
  sendEmail,
  sendTemplateEmail,
  sendBulkEmail,
  verifyConnection,
  templates,
};