/**
 * Data Migration Service
 * @module services/dataMigration
 *
 * Handles migration from old variant system to new options system
 */

const { query } = require('../config/database');
const crypto = require('crypto');

class DataMigrationService {
  /**
   * Run full migration
   */
  async runFullMigration() {
    const results = {
      colorsMigrated: 0,
      sizesMigrated: 0,
      variantsMigrated: 0,
      cartItemsUpdated: 0,
      orderItemsUpdated: 0,
      errors: [],
    };

    try {
      // Step 1: Create backups
      await this.createBackups();
      console.log('✅ Backups created');

      // Step 2: Migrate colors
      results.colorsMigrated = await this.migrateColors();
      console.log(`✅ Colors migrated: ${results.colorsMigrated}`);

      // Step 3: Migrate sizes
      results.sizesMigrated = await this.migrateSizes();
      console.log(`✅ Sizes migrated: ${results.sizesMigrated}`);

      // Step 4: Migrate variants
      results.variantsMigrated = await this.migrateVariants();
      console.log(`✅ Variants migrated: ${results.variantsMigrated}`);

      // Step 5: Update cart items
      results.cartItemsUpdated = await this.updateCartItems();
      console.log(`✅ Cart items updated: ${results.cartItemsUpdated}`);

      // Step 6: Update order items
      results.orderItemsUpdated = await this.updateOrderItems();
      console.log(`✅ Order items updated: ${results.orderItemsUpdated}`);

      // Step 7: Link categories to option types
      await this.linkCategoriesToOptions();
      console.log('✅ Categories linked to options');

      // Step 8: Update display types
      await this.updateDisplayTypes();
      console.log('✅ Display types updated');

    } catch (error) {
      results.errors.push(error.message);
      console.error('❌ Migration error:', error);
    }

    return results;
  }

  /**
   * Create backup tables
   */
  async createBackups() {
    await query('CREATE TABLE IF NOT EXISTS `_backup_product_colors` AS SELECT * FROM `product_colors`');
    await query('CREATE TABLE IF NOT EXISTS `_backup_product_sizes` AS SELECT * FROM `product_sizes`');
    await query('CREATE TABLE IF NOT EXISTS `_backup_product_variants` AS SELECT * FROM `product_variants`');
  }

  /**
   * Migrate colors from product_colors to product_option_values
   */
  async migrateColors() {
    // Update existing color option values with hex codes
    const hexUpdates = [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Red', hex: '#FF0000' },
      { name: 'Blue', hex: '#0000FF' },
      { name: 'Green', hex: '#008000' },
      { name: 'Gold', hex: '#FFD700' },
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Pink', hex: '#FFC0CB' },
      { name: 'Purple', hex: '#800080' },
      { name: 'Orange', hex: '#FFA500' },
    ];

    for (const update of hexUpdates) {
      await query(
        'UPDATE product_option_values SET hex_code = ? WHERE option_type_id = 5 AND value_name_en = ?',
        [update.hex, update.name]
      );
    }

    // Get all colors from product_colors
    const colors = await query('SELECT * FROM product_colors');
    let migrated = 0;

    for (const color of colors) {
      // Check if exists in option values
      const existing = await query(
        'SELECT option_value_id FROM product_option_values WHERE option_type_id = 5 AND LOWER(value_name_en) = LOWER(?)',
        [color.color_name_en]
      );

      let optionValueId;

      if (existing.length === 0) {
        // Insert new
        const result = await query(
          `INSERT INTO product_option_values
           (option_type_id, value_name_en, value_name_ar, value_name_he, hex_code, additional_price, display_order, is_active, created_at)
           VALUES (5, ?, ?, ?, ?, 0, ?, 1, NOW())`,
          [color.color_name_en, color.color_name_ar, color.color_name_he, color.color_hex_code, color.color_id + 100]
        );
        optionValueId = result.insertId;
      } else {
        optionValueId = existing[0].option_value_id;
      }

      // Create mapping
      await query(
        `INSERT INTO _migration_color_mapping (old_color_id, new_option_value_id, migrated_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE new_option_value_id = ?, migrated_at = NOW()`,
        [color.color_id, optionValueId, optionValueId]
      );

      migrated++;
    }

    return migrated;
  }

  /**
   * Migrate sizes from product_sizes to product_option_values
   */
  async migrateSizes() {
    // Create Clothing Size type if not exists
    const existingType = await query(
      'SELECT option_type_id FROM product_option_types WHERE type_name_en = ?',
      ['Clothing Size']
    );

    let clothingSizeTypeId;

    if (existingType.length === 0) {
      const result = await query(
        `INSERT INTO product_option_types
         (type_name_en, type_name_ar, type_name_he, display_order, is_active, display_type, created_at)
         VALUES ('Clothing Size', 'مقاس الملابس', 'מידת בגדים', 4, 1, 'buttons', NOW())`
      );
      clothingSizeTypeId = result.insertId;
    } else {
      clothingSizeTypeId = existingType[0].option_type_id;
    }

    // Get all sizes from product_sizes
    const sizes = await query('SELECT * FROM product_sizes');
    let migrated = 0;

    for (const size of sizes) {
      const valueName = `${size.size_name} (${size.size_value}${size.size_unit})`;

      // Check if exists
      const existing = await query(
        'SELECT option_value_id FROM product_option_values WHERE option_type_id = ? AND value_name_en LIKE ?',
        [clothingSizeTypeId, `${size.size_name}%`]
      );

      let optionValueId;

      if (existing.length === 0) {
        const result = await query(
          `INSERT INTO product_option_values
           (option_type_id, value_name_en, value_name_ar, value_name_he, additional_price, display_order, is_active, created_at)
           VALUES (?, ?, ?, ?, 0, ?, 1, NOW())`,
          [clothingSizeTypeId, valueName, valueName, valueName, size.size_id]
        );
        optionValueId = result.insertId;
      } else {
        optionValueId = existing[0].option_value_id;
      }

      // Create mapping
      await query(
        `INSERT INTO _migration_size_mapping (old_size_id, new_option_value_id, migrated_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE new_option_value_id = ?, migrated_at = NOW()`,
        [size.size_id, optionValueId, optionValueId]
      );

      migrated++;
    }

    return migrated;
  }

  /**
   * Migrate variants to combinations
   */
  async migrateVariants() {
    const variants = await query('SELECT * FROM product_variants');
    let migrated = 0;

    // Get the clothing size type id
    const sizeType = await query(
      'SELECT option_type_id FROM product_option_types WHERE type_name_en = ?',
      ['Clothing Size']
    );
    const sizeTypeId = sizeType.length > 0 ? sizeType[0].option_type_id : 3;

    for (const variant of variants) {
      try {
        // Get mapped color and size
        let colorValueId = null;
        let sizeValueId = null;

        if (variant.color_id) {
          const colorMapping = await query(
            'SELECT new_option_value_id FROM _migration_color_mapping WHERE old_color_id = ?',
            [variant.color_id]
          );
          colorValueId = colorMapping[0]?.new_option_value_id;
        }

        if (variant.size_id) {
          const sizeMapping = await query(
            'SELECT new_option_value_id FROM _migration_size_mapping WHERE old_size_id = ?',
            [variant.size_id]
          );
          sizeValueId = sizeMapping[0]?.new_option_value_id;
        }

        // Generate hash
        const hashInput = `${colorValueId || 0},${sizeValueId || 0}`;
        const optionValuesHash = variant.color_id || variant.size_id
          ? crypto.createHash('md5').update(hashInput).digest('hex')
          : crypto.createHash('md5').update(`no_options_${variant.variant_id}`).digest('hex');

        // Build option values JSON
        const optionValues = [];
        if (colorValueId) {
          optionValues.push({ option_type_id: 5, option_value_id: colorValueId });
        }
        if (sizeValueId) {
          optionValues.push({ option_type_id: sizeTypeId, option_value_id: sizeValueId });
        }

        // Get option names for summary
        let colorName = 'N/A';
        let sizeName = 'N/A';

        if (colorValueId) {
          const colorResult = await query(
            'SELECT value_name_en FROM product_option_values WHERE option_value_id = ?',
            [colorValueId]
          );
          colorName = colorResult[0]?.value_name_en || 'N/A';
        }

        if (sizeValueId) {
          const sizeResult = await query(
            'SELECT value_name_en FROM product_option_values WHERE option_value_id = ?',
            [sizeValueId]
          );
          sizeName = sizeResult[0]?.value_name_en || 'N/A';
        }

        const optionSummary = variant.color_id || variant.size_id
          ? `${colorName} / ${sizeName}`
          : variant.sku || `Variant #${variant.variant_id}`;

        // Insert combination
        const result = await query(
          `INSERT INTO product_option_combinations
           (product_id, option_values_hash, option_values_json, option_summary, sku, additional_price, stock_quantity, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())
           ON DUPLICATE KEY UPDATE stock_quantity = ?, additional_price = ?, updated_at = NOW()`,
          [
            variant.product_id,
            optionValuesHash,
            JSON.stringify(optionValues),
            optionSummary,
            variant.sku,
            variant.additional_price,
            variant.stock_quantity,
            variant.created_at,
            variant.stock_quantity,
            variant.additional_price,
          ]
        );

        const combinationId = result.insertId || (await query(
          'SELECT combination_id FROM product_option_combinations WHERE product_id = ? AND sku = ?',
          [variant.product_id, variant.sku]
        ))[0]?.combination_id;

        // Create mapping
        await query(
          `INSERT INTO _migration_variant_mapping (old_variant_id, new_combination_id, migrated_at, status)
           VALUES (?, ?, NOW(), 'migrated')
           ON DUPLICATE KEY UPDATE new_combination_id = ?, migrated_at = NOW(), status = 'migrated'`,
          [variant.variant_id, combinationId, combinationId]
        );

        migrated++;
      } catch (error) {
        console.error(`Error migrating variant ${variant.variant_id}:`, error);
      }
    }

    return migrated;
  }

  /**
   * Update cart items with combination_id
   */
  async updateCartItems() {
    const result = await query(`
      UPDATE cart_items ci
      JOIN _migration_variant_mapping mvm ON ci.variant_id = mvm.old_variant_id
      SET ci.combination_id = mvm.new_combination_id
      WHERE ci.variant_id IS NOT NULL AND ci.combination_id IS NULL
    `);

    return result.affectedRows;
  }

  /**
   * Update order items with combination_id
   */
  async updateOrderItems() {
    const result = await query(`
      UPDATE order_items oi
      JOIN _migration_variant_mapping mvm ON oi.variant_id = mvm.old_variant_id
      SET oi.combination_id = mvm.new_combination_id
      WHERE oi.variant_id IS NOT NULL AND oi.combination_id IS NULL
    `);

    return result.affectedRows;
  }

  /**
   * Link categories to option types
   */
  async linkCategoriesToOptions() {
    const categories = await query('SELECT category_id FROM categories');

    for (const cat of categories) {
      // Link Color (type 5)
      await query(
        `INSERT INTO category_option_types (category_id, option_type_id, is_filterable, display_order)
         VALUES (?, 5, 1, 1)
         ON DUPLICATE KEY UPDATE is_filterable = 1`,
        [cat.category_id]
      );

      // Link Size (type 3)
      await query(
        `INSERT INTO category_option_types (category_id, option_type_id, is_filterable, display_order)
         VALUES (?, 3, 1, 2)
         ON DUPLICATE KEY UPDATE is_filterable = 1`,
        [cat.category_id]
      );
    }
  }

  /**
   * Update display types for option types
   */
  async updateDisplayTypes() {
    await query("UPDATE product_option_types SET display_type = 'color_swatch' WHERE type_name_en = 'Color'");
    await query("UPDATE product_option_types SET display_type = 'buttons' WHERE type_name_en IN ('Size', 'Clothing Size')");
    await query("UPDATE product_option_types SET display_type = 'dropdown' WHERE type_name_en = 'Flavor'");
    await query("UPDATE product_option_types SET display_type = 'buttons' WHERE type_name_en = 'Strength'");
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    const status = {
      colorsMapped: 0,
      sizesMapped: 0,
      variantsMapped: 0,
      combinationsCreated: 0,
      cartItemsWithCombination: 0,
      orderItemsWithCombination: 0,
    };

    const colorCount = await query('SELECT COUNT(*) as count FROM _migration_color_mapping');
    status.colorsMapped = colorCount[0]?.count || 0;

    const sizeCount = await query('SELECT COUNT(*) as count FROM _migration_size_mapping');
    status.sizesMapped = sizeCount[0]?.count || 0;

    const variantCount = await query("SELECT COUNT(*) as count FROM _migration_variant_mapping WHERE status = 'migrated'");
    status.variantsMapped = variantCount[0]?.count || 0;

    const comboCount = await query('SELECT COUNT(*) as count FROM product_option_combinations');
    status.combinationsCreated = comboCount[0]?.count || 0;

    const cartCount = await query('SELECT COUNT(*) as count FROM cart_items WHERE combination_id IS NOT NULL');
    status.cartItemsWithCombination = cartCount[0]?.count || 0;

    const orderCount = await query('SELECT COUNT(*) as count FROM order_items WHERE combination_id IS NOT NULL');
    status.orderItemsWithCombination = orderCount[0]?.count || 0;

    return status;
  }

  /**
   * Rollback migration
   */
  async rollback() {
    try {
      // Clear combinations
      await query('TRUNCATE TABLE product_option_combinations');

      // Clear mappings
      await query('TRUNCATE TABLE _migration_color_mapping');
      await query('TRUNCATE TABLE _migration_size_mapping');
      await query('TRUNCATE TABLE _migration_variant_mapping');

      // Reset cart/order items
      await query('UPDATE cart_items SET combination_id = NULL');
      await query('UPDATE order_items SET combination_id = NULL');

      // Clear category links
      await query('TRUNCATE TABLE category_option_types');

      return { success: true, message: 'Rollback completed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new DataMigrationService();
