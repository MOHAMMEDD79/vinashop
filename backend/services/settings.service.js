/**
 * Settings Service
 * Business logic for application settings
 */

const db = require('../config/database');

/**
 * Get all settings
 */
const getAllSettings = async () => {
  const [settings] = await db.query('SELECT * FROM settings ORDER BY setting_key');
  return settings;
};

/**
 * Get settings by group
 */
const getSettingsByGroup = async (group) => {
  const [settings] = await db.query(
    'SELECT * FROM settings WHERE setting_group = ? ORDER BY setting_key',
    [group]
  );
  return settings;
};

/**
 * Get single setting by key
 */
const getSetting = async (key) => {
  const [settings] = await db.query(
    'SELECT * FROM settings WHERE setting_key = ?',
    [key]
  );
  return settings[0] || null;
};

/**
 * Get setting value by key
 */
const getSettingValue = async (key, defaultValue = null) => {
  const setting = await getSetting(key);
  return setting ? setting.setting_value : defaultValue;
};

/**
 * Update setting
 */
const updateSetting = async (key, value, group = 'general') => {
  const [existing] = await db.query(
    'SELECT * FROM settings WHERE setting_key = ?',
    [key]
  );

  if (existing.length > 0) {
    await db.query(
      'UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
      [value, key]
    );
  } else {
    await db.query(
      'INSERT INTO settings (setting_key, setting_value, setting_group, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [key, value, group]
    );
  }

  return getSetting(key);
};

/**
 * Update multiple settings
 */
const updateMultipleSettings = async (settings) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    for (const setting of settings) {
      const [existing] = await connection.query(
        'SELECT * FROM settings WHERE setting_key = ?',
        [setting.key]
      );

      if (existing.length > 0) {
        await connection.query(
          'UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
          [setting.value, setting.key]
        );
      } else {
        await connection.query(
          'INSERT INTO settings (setting_key, setting_value, setting_group, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [setting.key, setting.value, setting.group || 'general']
        );
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Delete setting
 */
const deleteSetting = async (key) => {
  const [result] = await db.query(
    'DELETE FROM settings WHERE setting_key = ?',
    [key]
  );
  return result.affectedRows > 0;
};

/**
 * Get general settings
 */
const getGeneralSettings = async () => {
  return getSettingsByGroup('general');
};

/**
 * Get email settings
 */
const getEmailSettings = async () => {
  return getSettingsByGroup('email');
};

/**
 * Get payment settings
 */
const getPaymentSettings = async () => {
  return getSettingsByGroup('payment');
};

/**
 * Get shipping settings
 */
const getShippingSettings = async () => {
  return getSettingsByGroup('shipping');
};

/**
 * Get tax settings
 */
const getTaxSettings = async () => {
  return getSettingsByGroup('tax');
};

/**
 * Get notification settings
 */
const getNotificationSettings = async () => {
  return getSettingsByGroup('notification');
};

/**
 * Get store settings
 */
const getStoreSettings = async () => {
  return getSettingsByGroup('store');
};

/**
 * Get SEO settings
 */
const getSeoSettings = async () => {
  return getSettingsByGroup('seo');
};

/**
 * Get social media settings
 */
const getSocialSettings = async () => {
  return getSettingsByGroup('social');
};

/**
 * Get currency settings
 */
const getCurrencySettings = async () => {
  return getSettingsByGroup('currency');
};

/**
 * Get language settings
 */
const getLanguageSettings = async () => {
  return getSettingsByGroup('language');
};

/**
 * Reset settings to defaults
 */
const resetToDefaults = async (group = null) => {
  if (group) {
    await db.query('DELETE FROM settings WHERE setting_group = ?', [group]);
  } else {
    await db.query('DELETE FROM settings');
  }
  return true;
};

/**
 * Export settings
 */
const exportSettings = async () => {
  const [settings] = await db.query('SELECT * FROM settings');
  return settings;
};

/**
 * Import settings
 */
const importSettings = async (settings) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    for (const setting of settings) {
      const [existing] = await connection.query(
        'SELECT * FROM settings WHERE setting_key = ?',
        [setting.setting_key]
      );

      if (existing.length > 0) {
        await connection.query(
          'UPDATE settings SET setting_value = ?, setting_group = ?, updated_at = NOW() WHERE setting_key = ?',
          [setting.setting_value, setting.setting_group, setting.setting_key]
        );
      } else {
        await connection.query(
          'INSERT INTO settings (setting_key, setting_value, setting_group, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [setting.setting_key, setting.setting_value, setting.setting_group]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllSettings,
  getSettingsByGroup,
  getSetting,
  getSettingValue,
  updateSetting,
  updateMultipleSettings,
  deleteSetting,
  getGeneralSettings,
  getEmailSettings,
  getPaymentSettings,
  getShippingSettings,
  getTaxSettings,
  getNotificationSettings,
  getStoreSettings,
  getSeoSettings,
  getSocialSettings,
  getCurrencySettings,
  getLanguageSettings,
  resetToDefaults,
  exportSettings,
  importSettings
};