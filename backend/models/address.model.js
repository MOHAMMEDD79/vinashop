/**
 * Address Model
 * @module models/address
 */

const { query } = require('../config/database');

/**
 * Address Model
 */
class Address {
  /**
   * Get all addresses for a user
   */
  static async getByUserId(userId) {
    const sql = `
      SELECT 
        address_id,
        user_id,
        address_type,
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_billing_default,
        is_shipping_default,
        created_at,
        updated_at
      FROM user_addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `;

    return await query(sql, [userId]);
  }

  /**
   * Get address by ID
   */
  static async getById(addressId) {
    const sql = `
      SELECT 
        address_id,
        user_id,
        address_type,
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_billing_default,
        is_shipping_default,
        created_at,
        updated_at
      FROM user_addresses
      WHERE address_id = ?
    `;

    const results = await query(sql, [addressId]);
    return results[0] || null;
  }

  /**
   * Get address by ID and user ID (for ownership check)
   */
  static async getByIdAndUserId(addressId, userId) {
    const sql = `
      SELECT 
        address_id,
        user_id,
        address_type,
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_billing_default,
        is_shipping_default,
        created_at,
        updated_at
      FROM user_addresses
      WHERE address_id = ? AND user_id = ?
    `;

    const results = await query(sql, [addressId, userId]);
    return results[0] || null;
  }

  /**
   * Get default address for a user
   */
  static async getDefault(userId) {
    const sql = `
      SELECT 
        address_id,
        user_id,
        address_type,
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_billing_default,
        is_shipping_default,
        created_at,
        updated_at
      FROM user_addresses
      WHERE user_id = ? AND is_default = 1
      LIMIT 1
    `;

    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  /**
   * Get default billing address for a user
   */
  static async getDefaultBilling(userId) {
    const sql = `
      SELECT 
        address_id,
        user_id,
        address_type,
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_billing_default,
        is_shipping_default,
        created_at,
        updated_at
      FROM user_addresses
      WHERE user_id = ? AND is_billing_default = 1
      LIMIT 1
    `;

    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  /**
   * Get default shipping address for a user
   */
  static async getDefaultShipping(userId) {
    const sql = `
      SELECT 
        address_id,
        user_id,
        address_type,
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_billing_default,
        is_shipping_default,
        created_at,
        updated_at
      FROM user_addresses
      WHERE user_id = ? AND is_shipping_default = 1
      LIMIT 1
    `;

    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  /**
   * Get addresses by type
   */
  static async getByType(userId, addressType) {
    const sql = `
      SELECT 
        address_id,
        user_id,
        address_type,
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_billing_default,
        is_shipping_default,
        created_at,
        updated_at
      FROM user_addresses
      WHERE user_id = ? AND address_type = ?
      ORDER BY is_default DESC, created_at DESC
    `;

    return await query(sql, [userId, addressType]);
  }

  /**
   * Create a new address
   */
  static async create(data) {
    const {
      user_id,
      address_type = 'shipping',
      first_name,
      last_name,
      company,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      phone,
      is_default = false,
      is_billing_default = false,
      is_shipping_default = false,
    } = data;

    // If this is set as default, unset other defaults first
    if (is_default) {
      await query(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [user_id]
      );
    }

    if (is_billing_default) {
      await query(
        'UPDATE user_addresses SET is_billing_default = 0 WHERE user_id = ?',
        [user_id]
      );
    }

    if (is_shipping_default) {
      await query(
        'UPDATE user_addresses SET is_shipping_default = 0 WHERE user_id = ?',
        [user_id]
      );
    }

    const sql = `
      INSERT INTO user_addresses (
        user_id,
        address_type,
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
        is_billing_default,
        is_shipping_default,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      user_id,
      address_type,
      first_name,
      last_name,
      company || null,
      address_line_1,
      address_line_2 || null,
      city,
      state || null,
      postal_code || null,
      country,
      phone || null,
      is_default ? 1 : 0,
      is_billing_default ? 1 : 0,
      is_shipping_default ? 1 : 0,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update an address
   */
  static async update(addressId, data) {
    const allowedFields = [
      'address_type',
      'first_name',
      'last_name',
      'company',
      'address_line_1',
      'address_line_2',
      'city',
      'state',
      'postal_code',
      'country',
      'phone',
      'is_default',
      'is_billing_default',
      'is_shipping_default',
    ];

    const updates = [];
    const values = [];

    // Get the address to find user_id
    const address = await this.getById(addressId);
    if (!address) {
      return null;
    }

    // Handle default flags
    if (data.is_default === true) {
      await query(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND address_id != ?',
        [address.user_id, addressId]
      );
    }

    if (data.is_billing_default === true) {
      await query(
        'UPDATE user_addresses SET is_billing_default = 0 WHERE user_id = ? AND address_id != ?',
        [address.user_id, addressId]
      );
    }

    if (data.is_shipping_default === true) {
      await query(
        'UPDATE user_addresses SET is_shipping_default = 0 WHERE user_id = ? AND address_id != ?',
        [address.user_id, addressId]
      );
    }

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getById(addressId);
    }

    updates.push('updated_at = NOW()');
    values.push(addressId);

    const sql = `
      UPDATE user_addresses 
      SET ${updates.join(', ')}
      WHERE address_id = ?
    `;

    await query(sql, values);
    return await this.getById(addressId);
  }

  /**
   * Delete an address
   */
  static async delete(addressId) {
    const address = await this.getById(addressId);
    if (!address) {
      return false;
    }

    const sql = 'DELETE FROM user_addresses WHERE address_id = ?';
    const result = await query(sql, [addressId]);

    // If deleted address was default, set another as default
    if (address.is_default && result.affectedRows > 0) {
      await query(
        `UPDATE user_addresses 
         SET is_default = 1 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [address.user_id]
      );
    }

    return result.affectedRows > 0;
  }

  /**
   * Delete all addresses for a user
   */
  static async deleteByUserId(userId) {
    const sql = 'DELETE FROM user_addresses WHERE user_id = ?';
    const result = await query(sql, [userId]);
    return result.affectedRows;
  }

  /**
   * Set as default address
   */
  static async setDefault(addressId) {
    const address = await this.getById(addressId);
    if (!address) {
      return null;
    }

    // Unset current default
    await query(
      'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
      [address.user_id]
    );

    // Set new default
    await query(
      'UPDATE user_addresses SET is_default = 1, updated_at = NOW() WHERE address_id = ?',
      [addressId]
    );

    return await this.getById(addressId);
  }

  /**
   * Set as default billing address
   */
  static async setDefaultBilling(addressId) {
    const address = await this.getById(addressId);
    if (!address) {
      return null;
    }

    // Unset current default
    await query(
      'UPDATE user_addresses SET is_billing_default = 0 WHERE user_id = ?',
      [address.user_id]
    );

    // Set new default
    await query(
      'UPDATE user_addresses SET is_billing_default = 1, updated_at = NOW() WHERE address_id = ?',
      [addressId]
    );

    return await this.getById(addressId);
  }

  /**
   * Set as default shipping address
   */
  static async setDefaultShipping(addressId) {
    const address = await this.getById(addressId);
    if (!address) {
      return null;
    }

    // Unset current default
    await query(
      'UPDATE user_addresses SET is_shipping_default = 0 WHERE user_id = ?',
      [address.user_id]
    );

    // Set new default
    await query(
      'UPDATE user_addresses SET is_shipping_default = 1, updated_at = NOW() WHERE address_id = ?',
      [addressId]
    );

    return await this.getById(addressId);
  }

  /**
   * Count addresses for a user
   */
  static async countByUserId(userId) {
    const sql = 'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?';
    const results = await query(sql, [userId]);
    return results[0].count;
  }

  /**
   * Check if user has any addresses
   */
  static async hasAddresses(userId) {
    const count = await this.countByUserId(userId);
    return count > 0;
  }

  /**
   * Format address as string
   */
  static formatAddress(address) {
    if (!address) return '';

    const parts = [];

    if (address.first_name || address.last_name) {
      parts.push(`${address.first_name || ''} ${address.last_name || ''}`.trim());
    }

    if (address.company) {
      parts.push(address.company);
    }

    if (address.address_line_1) {
      parts.push(address.address_line_1);
    }

    if (address.address_line_2) {
      parts.push(address.address_line_2);
    }

    const cityLine = [
      address.city,
      address.state,
      address.postal_code,
    ].filter(Boolean).join(', ');

    if (cityLine) {
      parts.push(cityLine);
    }

    if (address.country) {
      parts.push(address.country);
    }

    return parts.join('\n');
  }

  /**
   * Format address as single line
   */
  static formatAddressSingleLine(address) {
    if (!address) return '';

    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Validate address data
   */
  static validate(data) {
    const errors = {};

    if (!data.first_name || data.first_name.trim() === '') {
      errors.first_name = 'First name is required';
    }

    if (!data.last_name || data.last_name.trim() === '') {
      errors.last_name = 'Last name is required';
    }

    if (!data.address_line_1 || data.address_line_1.trim() === '') {
      errors.address_line_1 = 'Address line 1 is required';
    }

    if (!data.city || data.city.trim() === '') {
      errors.city = 'City is required';
    }

    if (!data.country || data.country.trim() === '') {
      errors.country = 'Country is required';
    }

    if (data.address_type && !['billing', 'shipping', 'both'].includes(data.address_type)) {
      errors.address_type = 'Invalid address type';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Copy address (for order shipping address)
   */
  static async copyToOrder(addressId) {
    const address = await this.getById(addressId);
    if (!address) {
      return null;
    }

    return {
      shipping_first_name: address.first_name,
      shipping_last_name: address.last_name,
      shipping_company: address.company,
      shipping_address_1: address.address_line_1,
      shipping_address_2: address.address_line_2,
      shipping_city: address.city,
      shipping_state: address.state,
      shipping_postal_code: address.postal_code,
      shipping_country: address.country,
      shipping_phone: address.phone,
    };
  }

  /**
   * Get address statistics for admin
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_addresses,
        COUNT(DISTINCT user_id) as users_with_addresses,
        SUM(CASE WHEN is_default = 1 THEN 1 ELSE 0 END) as default_addresses,
        SUM(CASE WHEN address_type = 'billing' THEN 1 ELSE 0 END) as billing_addresses,
        SUM(CASE WHEN address_type = 'shipping' THEN 1 ELSE 0 END) as shipping_addresses,
        COUNT(DISTINCT country) as unique_countries,
        COUNT(DISTINCT city) as unique_cities
      FROM user_addresses
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get addresses by country (for analytics)
   */
  static async getByCountry() {
    const sql = `
      SELECT 
        country,
        COUNT(*) as count
      FROM user_addresses
      GROUP BY country
      ORDER BY count DESC
    `;

    return await query(sql);
  }

  /**
   * Get addresses by city (for analytics)
   */
  static async getByCity(country = null) {
    let sql = `
      SELECT 
        city,
        country,
        COUNT(*) as count
      FROM user_addresses
    `;

    const params = [];

    if (country) {
      sql += ' WHERE country = ?';
      params.push(country);
    }

    sql += ' GROUP BY city, country ORDER BY count DESC LIMIT 50';

    return await query(sql, params);
  }

  /**
   * Search addresses
   */
  static async search(searchTerm, limit = 10) {
    const sql = `
      SELECT 
        a.*,
        u.username,
        u.email
      FROM user_addresses a
      JOIN users u ON a.user_id = u.user_id
      WHERE 
        a.first_name LIKE ? OR
        a.last_name LIKE ? OR
        a.city LIKE ? OR
        a.postal_code LIKE ? OR
        a.country LIKE ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    return await query(sql, [term, term, term, term, term, limit]);
  }

  /**
   * Bulk delete addresses
   */
  static async bulkDelete(addressIds) {
    if (!addressIds || addressIds.length === 0) {
      return 0;
    }

    const placeholders = addressIds.map(() => '?').join(',');
    const sql = `DELETE FROM user_addresses WHERE address_id IN (${placeholders})`;
    const result = await query(sql, addressIds);
    return result.affectedRows;
  }
}

module.exports = Address;