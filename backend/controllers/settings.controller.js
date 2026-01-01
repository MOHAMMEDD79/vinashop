/**
 * Settings Controller
 * @module controllers/settings
 * 
 * FIXED: Accepts both camelCase and snake_case, responses include both formats
 */

const settingsService = require('../services/settings.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Helper: Format settings for response (dual naming)
 */
const formatSettings = (settings) => {
  if (!settings) return null;
  if (Array.isArray(settings)) {
    return settings.map(s => formatSetting(s));
  }
  return formatSetting(settings);
};

const formatSetting = (setting) => {
  if (!setting) return null;
  
  const result = { ...setting };
  
  for (const [key, value] of Object.entries(setting)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (camelKey !== key) {
      result[camelKey] = value;
    }
  }
  
  return result;
};

const getAll = async (req, res, next) => {
  try {
    const { group } = req.query;
    const settings = await settingsService.getAll({ group });
    return successResponse(res, formatSettings(settings), 'Settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const setting = await settingsService.getByKey(key);
    if (!setting) {
      return errorResponse(res, 'Setting not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return successResponse(res, formatSetting(setting));
  } catch (error) {
    next(error);
  }
};

const getByGroup = async (req, res, next) => {
  try {
    const { group } = req.params;
    const settings = await settingsService.getByGroup(group);
    return successResponse(res, formatSettings(settings), 'Settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      return errorResponse(res, 'Value is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }
    const setting = await settingsService.update(key, value, req.admin?.adminId);
    if (!setting) {
      return errorResponse(res, 'Setting not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return successResponse(res, formatSetting(setting), 'Setting updated successfully');
  } catch (error) {
    next(error);
  }
};

const updateMultiple = async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return errorResponse(res, 'Settings array is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }
    const result = await settingsService.updateMultiple(settings, req.admin?.adminId);
    return successResponse(res, result, `${result.updated} settings updated successfully`);
  } catch (error) {
    next(error);
  }
};

const getGeneralSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getGeneralSettings();
    return successResponse(res, formatSettings(settings), 'General settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateGeneralSettings = async (req, res, next) => {
  try {
    const {
      site_name, siteName, site_description, siteDescription, site_email, siteEmail,
      site_phone, sitePhone, site_address, siteAddress, timezone,
      date_format, dateFormat, time_format, timeFormat, currency,
      currency_symbol, currencySymbol, currency_position, currencyPosition,
      default_language, defaultLanguage, supported_languages, supportedLanguages,
    } = req.body;

    const settings = await settingsService.updateGeneralSettings({
      site_name: site_name || siteName,
      site_description: site_description || siteDescription,
      site_email: site_email || siteEmail,
      site_phone: site_phone || sitePhone,
      site_address: site_address || siteAddress,
      timezone,
      date_format: date_format || dateFormat,
      time_format: time_format || timeFormat,
      currency,
      currency_symbol: currency_symbol || currencySymbol,
      currency_position: currency_position || currencyPosition,
      default_language: default_language || defaultLanguage,
      supported_languages: supported_languages || supportedLanguages,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'General settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getStoreSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getStoreSettings();
    return successResponse(res, formatSettings(settings), 'Store settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateStoreSettings = async (req, res, next) => {
  try {
    const {
      store_name, storeName, store_tagline, storeTagline, store_email, storeEmail,
      store_phone, storePhone, store_address, storeAddress, store_city, storeCity,
      store_country, storeCountry, store_postal_code, storePostalCode,
      business_registration_number, businessRegistrationNumber, tax_id, taxId,
      vat_number, vatNumber, opening_hours, openingHours,
    } = req.body;

    const settings = await settingsService.updateStoreSettings({
      store_name: store_name || storeName,
      store_tagline: store_tagline || storeTagline,
      store_email: store_email || storeEmail,
      store_phone: store_phone || storePhone,
      store_address: store_address || storeAddress,
      store_city: store_city || storeCity,
      store_country: store_country || storeCountry,
      store_postal_code: store_postal_code || storePostalCode,
      business_registration_number: business_registration_number || businessRegistrationNumber,
      tax_id: tax_id || taxId,
      vat_number: vat_number || vatNumber,
      opening_hours: opening_hours || openingHours,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Store settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getPaymentSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getPaymentSettings();
    return successResponse(res, formatSettings(settings), 'Payment settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updatePaymentSettings = async (req, res, next) => {
  try {
    const {
      payment_methods, paymentMethods, cash_on_delivery_enabled, cashOnDeliveryEnabled,
      visa_enabled, visaEnabled, paypal_enabled, paypalEnabled,
      paypal_client_id, paypalClientId, paypal_client_secret, paypalClientSecret,
      paypal_mode, paypalMode, bank_transfer_enabled, bankTransferEnabled,
      bank_details, bankDetails, minimum_order_amount, minimumOrderAmount,
      maximum_order_amount, maximumOrderAmount,
    } = req.body;

    const settings = await settingsService.updatePaymentSettings({
      payment_methods: payment_methods || paymentMethods,
      cash_on_delivery_enabled: cash_on_delivery_enabled ?? cashOnDeliveryEnabled,
      visa_enabled: visa_enabled ?? visaEnabled,
      paypal_enabled: paypal_enabled ?? paypalEnabled,
      paypal_client_id: paypal_client_id || paypalClientId,
      paypal_client_secret: paypal_client_secret || paypalClientSecret,
      paypal_mode: paypal_mode || paypalMode,
      bank_transfer_enabled: bank_transfer_enabled ?? bankTransferEnabled,
      bank_details: bank_details || bankDetails,
      minimum_order_amount: minimum_order_amount ?? minimumOrderAmount,
      maximum_order_amount: maximum_order_amount ?? maximumOrderAmount,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Payment settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getShippingSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getShippingSettings();
    return successResponse(res, formatSettings(settings), 'Shipping settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateShippingSettings = async (req, res, next) => {
  try {
    const {
      shipping_enabled, shippingEnabled, free_shipping_enabled, freeShippingEnabled,
      free_shipping_threshold, freeShippingThreshold, flat_rate_enabled, flatRateEnabled,
      flat_rate_amount, flatRateAmount, shipping_zones, shippingZones,
      shipping_carriers, shippingCarriers, estimated_delivery_days, estimatedDeliveryDays,
      allow_pickup, allowPickup, pickup_locations, pickupLocations,
    } = req.body;

    const settings = await settingsService.updateShippingSettings({
      shipping_enabled: shipping_enabled ?? shippingEnabled,
      free_shipping_enabled: free_shipping_enabled ?? freeShippingEnabled,
      free_shipping_threshold: free_shipping_threshold ?? freeShippingThreshold,
      flat_rate_enabled: flat_rate_enabled ?? flatRateEnabled,
      flat_rate_amount: flat_rate_amount ?? flatRateAmount,
      shipping_zones: shipping_zones || shippingZones,
      shipping_carriers: shipping_carriers || shippingCarriers,
      estimated_delivery_days: estimated_delivery_days ?? estimatedDeliveryDays,
      allow_pickup: allow_pickup ?? allowPickup,
      pickup_locations: pickup_locations || pickupLocations,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Shipping settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getTaxSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getTaxSettings();
    return successResponse(res, formatSettings(settings), 'Tax settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateTaxSettings = async (req, res, next) => {
  try {
    const {
      tax_enabled, taxEnabled, tax_rate, taxRate, tax_inclusive, taxInclusive,
      tax_label, taxLabel, tax_registration_number, taxRegistrationNumber,
      tax_classes, taxClasses, tax_rules, taxRules,
    } = req.body;

    const settings = await settingsService.updateTaxSettings({
      tax_enabled: tax_enabled ?? taxEnabled,
      tax_rate: tax_rate ?? taxRate,
      tax_inclusive: tax_inclusive ?? taxInclusive,
      tax_label: tax_label || taxLabel,
      tax_registration_number: tax_registration_number || taxRegistrationNumber,
      tax_classes: tax_classes || taxClasses,
      tax_rules: tax_rules || taxRules,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Tax settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getEmailSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getEmailSettings();
    return successResponse(res, formatSettings(settings), 'Email settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateEmailSettings = async (req, res, next) => {
  try {
    const {
      smtp_host, smtpHost, smtp_port, smtpPort, smtp_user, smtpUser,
      smtp_password, smtpPassword, smtp_secure, smtpSecure,
      from_email, fromEmail, from_name, fromName, email_templates, emailTemplates,
    } = req.body;

    const settings = await settingsService.updateEmailSettings({
      smtp_host: smtp_host || smtpHost,
      smtp_port: smtp_port ?? smtpPort,
      smtp_user: smtp_user || smtpUser,
      smtp_password: smtp_password || smtpPassword,
      smtp_secure: smtp_secure ?? smtpSecure,
      from_email: from_email || fromEmail,
      from_name: from_name || fromName,
      email_templates: email_templates || emailTemplates,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Email settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const testEmailSettings = async (req, res, next) => {
  try {
    const { test_email, testEmail } = req.body;
    const email = test_email || testEmail;
    if (!email) {
      return errorResponse(res, 'Test email address is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }
    const result = await settingsService.testEmailSettings(email);
    return successResponse(res, result, 'Test email sent successfully');
  } catch (error) {
    next(error);
  }
};

const getNotificationSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getNotificationSettings();
    return successResponse(res, formatSettings(settings), 'Notification settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateNotificationSettings = async (req, res, next) => {
  try {
    const {
      new_order_notification, newOrderNotification, low_stock_notification, lowStockNotification,
      low_stock_threshold, lowStockThreshold, new_user_notification, newUserNotification,
      new_review_notification, newReviewNotification, new_message_notification, newMessageNotification,
    } = req.body;

    const settings = await settingsService.updateNotificationSettings({
      new_order_notification: new_order_notification ?? newOrderNotification,
      low_stock_notification: low_stock_notification ?? lowStockNotification,
      low_stock_threshold: low_stock_threshold ?? lowStockThreshold,
      new_user_notification: new_user_notification ?? newUserNotification,
      new_review_notification: new_review_notification ?? newReviewNotification,
      new_message_notification: new_message_notification ?? newMessageNotification,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Notification settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getSecuritySettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSecuritySettings();
    return successResponse(res, formatSettings(settings), 'Security settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateSecuritySettings = async (req, res, next) => {
  try {
    const {
      two_factor_enabled, twoFactorEnabled, password_min_length, passwordMinLength,
      password_require_uppercase, passwordRequireUppercase, password_require_number, passwordRequireNumber,
      password_require_special, passwordRequireSpecial, session_timeout, sessionTimeout,
      max_login_attempts, maxLoginAttempts, lockout_duration, lockoutDuration,
    } = req.body;

    const settings = await settingsService.updateSecuritySettings({
      two_factor_enabled: two_factor_enabled ?? twoFactorEnabled,
      password_min_length: password_min_length ?? passwordMinLength,
      password_require_uppercase: password_require_uppercase ?? passwordRequireUppercase,
      password_require_number: password_require_number ?? passwordRequireNumber,
      password_require_special: password_require_special ?? passwordRequireSpecial,
      session_timeout: session_timeout ?? sessionTimeout,
      max_login_attempts: max_login_attempts ?? maxLoginAttempts,
      lockout_duration: lockout_duration ?? lockoutDuration,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Security settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getAppearanceSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getAppearanceSettings();
    return successResponse(res, formatSettings(settings), 'Appearance settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateAppearanceSettings = async (req, res, next) => {
  try {
    const {
      primary_color, primaryColor, secondary_color, secondaryColor, accent_color, accentColor,
      theme_mode, themeMode, font_family, fontFamily, header_style, headerStyle, footer_style, footerStyle,
    } = req.body;

    const settings = await settingsService.updateAppearanceSettings({
      primary_color: primary_color || primaryColor,
      secondary_color: secondary_color || secondaryColor,
      accent_color: accent_color || accentColor,
      theme_mode: theme_mode || themeMode,
      font_family: font_family || fontFamily,
      header_style: header_style || headerStyle,
      footer_style: footer_style || footerStyle,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Appearance settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Logo file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }
    const logoPath = `uploads/settings/${req.file.filename}`;
    const result = await settingsService.updateLogo(logoPath, req.admin?.adminId);
    return successResponse(res, result, 'Logo uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const uploadFavicon = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Favicon file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }
    const faviconPath = `uploads/settings/${req.file.filename}`;
    const result = await settingsService.updateFavicon(faviconPath, req.admin?.adminId);
    return successResponse(res, result, 'Favicon uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const getSocialSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSocialSettings();
    return successResponse(res, formatSettings(settings), 'Social settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateSocialSettings = async (req, res, next) => {
  try {
    const {
      facebook_url, facebookUrl, twitter_url, twitterUrl, instagram_url, instagramUrl,
      youtube_url, youtubeUrl, linkedin_url, linkedinUrl, tiktok_url, tiktokUrl, whatsapp_number, whatsappNumber,
    } = req.body;

    const settings = await settingsService.updateSocialSettings({
      facebook_url: facebook_url || facebookUrl,
      twitter_url: twitter_url || twitterUrl,
      instagram_url: instagram_url || instagramUrl,
      youtube_url: youtube_url || youtubeUrl,
      linkedin_url: linkedin_url || linkedinUrl,
      tiktok_url: tiktok_url || tiktokUrl,
      whatsapp_number: whatsapp_number || whatsappNumber,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Social settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getSeoSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSeoSettings();
    return successResponse(res, formatSettings(settings), 'SEO settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateSeoSettings = async (req, res, next) => {
  try {
    const {
      meta_title, metaTitle, meta_description, metaDescription, meta_keywords, metaKeywords,
      og_image, ogImage, google_analytics_id, googleAnalyticsId, google_tag_manager_id, googleTagManagerId,
      facebook_pixel_id, facebookPixelId, robots_txt, robotsTxt, sitemap_enabled, sitemapEnabled,
    } = req.body;

    const settings = await settingsService.updateSeoSettings({
      meta_title: meta_title || metaTitle,
      meta_description: meta_description || metaDescription,
      meta_keywords: meta_keywords || metaKeywords,
      og_image: og_image || ogImage,
      google_analytics_id: google_analytics_id || googleAnalyticsId,
      google_tag_manager_id: google_tag_manager_id || googleTagManagerId,
      facebook_pixel_id: facebook_pixel_id || facebookPixelId,
      robots_txt: robots_txt || robotsTxt,
      sitemap_enabled: sitemap_enabled ?? sitemapEnabled,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'SEO settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getMaintenanceSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getMaintenanceSettings();
    return successResponse(res, formatSettings(settings), 'Maintenance settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateMaintenanceSettings = async (req, res, next) => {
  try {
    const {
      maintenance_mode, maintenanceMode, maintenance_message, maintenanceMessage,
      maintenance_end_date, maintenanceEndDate, allowed_ips, allowedIps,
    } = req.body;

    const settings = await settingsService.updateMaintenanceSettings({
      maintenance_mode: maintenance_mode ?? maintenanceMode,
      maintenance_message: maintenance_message || maintenanceMessage,
      maintenance_end_date: maintenance_end_date || maintenanceEndDate,
      allowed_ips: allowed_ips || allowedIps,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Maintenance settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getBackupSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getBackupSettings();
    return successResponse(res, formatSettings(settings), 'Backup settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateBackupSettings = async (req, res, next) => {
  try {
    const {
      auto_backup_enabled, autoBackupEnabled, backup_frequency, backupFrequency,
      backup_retention_days, backupRetentionDays, backup_storage, backupStorage,
      backup_include_uploads, backupIncludeUploads,
    } = req.body;

    const settings = await settingsService.updateBackupSettings({
      auto_backup_enabled: auto_backup_enabled ?? autoBackupEnabled,
      backup_frequency: backup_frequency || backupFrequency,
      backup_retention_days: backup_retention_days ?? backupRetentionDays,
      backup_storage: backup_storage || backupStorage,
      backup_include_uploads: backup_include_uploads ?? backupIncludeUploads,
    }, req.admin?.adminId);

    return successResponse(res, formatSettings(settings), 'Backup settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const createBackup = async (req, res, next) => {
  try {
    const { include_uploads, includeUploads } = req.body;
    const result = await settingsService.createBackup({
      include_uploads: (include_uploads ?? includeUploads) === true || (include_uploads ?? includeUploads) === 'true',
      created_by: req.admin?.adminId,
    });
    return successResponse(res, result, 'Backup created successfully');
  } catch (error) {
    next(error);
  }
};

const getBackups = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await settingsService.getBackups({ page: parseInt(page), limit: parseInt(limit) });
    return successResponse(res, result, 'Backups retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const downloadBackup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const backup = await settingsService.getBackupById(id);
    if (!backup) {
      return errorResponse(res, 'Backup not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    const backupFile = await settingsService.downloadBackup(id);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename=${backup.filename}`);
    res.send(backupFile);
  } catch (error) {
    next(error);
  }
};

const restoreBackup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const backup = await settingsService.getBackupById(id);
    if (!backup) {
      return errorResponse(res, 'Backup not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    const result = await settingsService.restoreBackup(id, req.admin?.adminId);
    return successResponse(res, result, 'Backup restored successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBackup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const backup = await settingsService.getBackupById(id);
    if (!backup) {
      return errorResponse(res, 'Backup not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    await settingsService.deleteBackup(id);
    return successResponse(res, null, 'Backup deleted successfully');
  } catch (error) {
    next(error);
  }
};

const resetToDefaults = async (req, res, next) => {
  try {
    const { group } = req.params;
    const result = await settingsService.resetToDefaults(group, req.admin?.adminId);
    return successResponse(res, result, 'Settings reset to defaults successfully');
  } catch (error) {
    next(error);
  }
};

const exportSettings = async (req, res, next) => {
  try {
    const settingsJson = await settingsService.exportSettings();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=settings.json');
    res.send(settingsJson);
  } catch (error) {
    next(error);
  }
};

const importSettings = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Settings file is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.MISSING_REQUIRED_FIELD);
    }
    const result = await settingsService.importSettings(req.file.path, req.admin?.adminId);
    return successResponse(res, result, 'Settings imported successfully');
  } catch (error) {
    next(error);
  }
};

const getChangeLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, key } = req.query;
    const result = await settingsService.getChangeLog({ page: parseInt(page), limit: parseInt(limit), key });
    return successResponse(res, result, 'Settings change log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const clearCache = async (req, res, next) => {
  try {
    const result = await settingsService.clearCache();
    return successResponse(res, result, 'Cache cleared successfully');
  } catch (error) {
    next(error);
  }
};

const getSystemInfo = async (req, res, next) => {
  try {
    const info = await settingsService.getSystemInfo();
    return successResponse(res, formatSettings(info), 'System info retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll, getByKey, getByGroup, update, updateMultiple,
  getGeneralSettings, updateGeneralSettings, getStoreSettings, updateStoreSettings,
  getPaymentSettings, updatePaymentSettings, getShippingSettings, updateShippingSettings,
  getTaxSettings, updateTaxSettings, getEmailSettings, updateEmailSettings, testEmailSettings,
  getNotificationSettings, updateNotificationSettings, getSecuritySettings, updateSecuritySettings,
  getAppearanceSettings, updateAppearanceSettings, uploadLogo, uploadFavicon,
  getSocialSettings, updateSocialSettings, getSeoSettings, updateSeoSettings,
  getMaintenanceSettings, updateMaintenanceSettings, getBackupSettings, updateBackupSettings,
  createBackup, getBackups, downloadBackup, restoreBackup, deleteBackup,
  resetToDefaults, exportSettings, importSettings, getChangeLog, clearCache, getSystemInfo,
};