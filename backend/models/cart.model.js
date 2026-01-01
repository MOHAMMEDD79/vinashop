/**
 * Cart Model
 * @module models/cart
 */

const { query } = require('../config/database');

/**
 * Cart Model - Handles shopping cart operations
 */
class Cart {
  // ==================== Cart Operations ====================

  /**
   * Get cart by user ID
   * Uses the new product_option_combinations system
   */
  static async getByUserId(userId, lang = 'en') {
    const nameField = `product_name_${lang}`;
    const descField = `product_description_${lang}`;

    const sql = `
      SELECT
        c.cart_id,
        c.user_id,
        c.product_id,
        c.combination_id,
        c.selected_options,
        c.quantity,
        c.created_at,
        c.updated_at,
        p.${nameField} as product_name,
        p.${descField} as product_description,
        p.base_price as price,
        p.discount_percentage,
        p.stock_quantity,
        p.is_active as product_active,
        pi.image_url,
        -- Combination support
        poc.sku as combination_sku,
        poc.price as combination_price,
        poc.stock_quantity as combination_stock,
        poc.option_values_json,
        poc.option_summary,
        poc.is_active as combination_active,
        -- Final price/stock (prioritize combination > product)
        COALESCE(poc.price, p.base_price) as final_price,
        COALESCE(poc.stock_quantity, p.stock_quantity) as available_stock
      FROM cart_items c
      JOIN products p ON c.product_id = p.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_option_combinations poc ON c.combination_id = poc.combination_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `;

    const items = await query(sql, [userId]);

    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      const price = parseFloat(item.final_price) || 0;
      const discount = parseFloat(item.discount_percentage) || 0;
      const discountedPrice = price * (1 - discount / 100);
      
      item.discounted_price = discountedPrice;
      item.item_total = discountedPrice * item.quantity;
      item.discount_amount = (price - discountedPrice) * item.quantity;
      
      subtotal += item.item_total;
      totalItems += item.quantity;
      totalDiscount += item.discount_amount;

      // Check stock availability
      item.in_stock = item.quantity <= item.available_stock;
      item.is_available = item.product_active && item.available_stock > 0;
    });

    return {
      items,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        total_items: totalItems,
        total_discount: parseFloat(totalDiscount.toFixed(2)),
        item_count: items.length,
      },
    };
  }

  /**
   * Get cart item by ID
   */
  static async getById(cartId) {
    const sql = `
      SELECT 
        c.*,
        p.product_name_en,
        p.price,
        p.discount_percentage,
        p.stock_quantity
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.cart_id = ?
    `;

    const results = await query(sql, [cartId]);
    return results[0] || null;
  }

  /**
   * Get cart item by user, product, and variant/combination
   * Supports both legacy (variant_id/color_id/size_id) and new (combination_id) systems
   */
  static async getItem(userId, productId, variantId = null, colorId = null, sizeId = null, combinationId = null) {
    let sql = `
      SELECT * FROM cart_items
      WHERE user_id = ? AND product_id = ?
    `;
    const params = [userId, productId];

    // New system: combination_id takes priority
    if (combinationId) {
      sql += ' AND combination_id = ?';
      params.push(combinationId);
      const results = await query(sql, params);
      return results[0] || null;
    }

    // Legacy system: variant_id, color_id, size_id
    if (variantId) {
      sql += ' AND variant_id = ?';
      params.push(variantId);
    } else {
      sql += ' AND variant_id IS NULL';
    }

    if (colorId) {
      sql += ' AND color_id = ?';
      params.push(colorId);
    } else {
      sql += ' AND color_id IS NULL';
    }

    if (sizeId) {
      sql += ' AND size_id = ?';
      params.push(sizeId);
    } else {
      sql += ' AND size_id IS NULL';
    }

    // Also ensure combination_id is null for legacy items
    sql += ' AND combination_id IS NULL';

    const results = await query(sql, params);
    return results[0] || null;
  }

  /**
   * Get cart item by combination_id only (new system)
   */
  static async getItemByCombination(userId, productId, combinationId) {
    const sql = `
      SELECT * FROM cart_items
      WHERE user_id = ? AND product_id = ? AND combination_id = ?
    `;
    const results = await query(sql, [userId, productId, combinationId]);
    return results[0] || null;
  }

  /**
   * Add item to cart
   * Supports both legacy (variant_id/color_id/size_id) and new (combination_id) systems
   */
  static async addItem(data) {
    const {
      user_id,
      product_id,
      variant_id,
      color_id,
      size_id,
      combination_id,
      selected_options,
      quantity = 1,
    } = data;

    // Check if item already exists in cart
    const existingItem = await this.getItem(user_id, product_id, variant_id, color_id, size_id, combination_id);

    if (existingItem) {
      // Update quantity
      return await this.updateQuantity(existingItem.cart_id, existingItem.quantity + quantity);
    }

    // Insert new item with combination support
    const sql = `
      INSERT INTO cart_items (
        user_id,
        product_id,
        variant_id,
        color_id,
        size_id,
        combination_id,
        selected_options,
        quantity,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      user_id,
      product_id,
      variant_id || null,
      color_id || null,
      size_id || null,
      combination_id || null,
      selected_options ? JSON.stringify(selected_options) : null,
      quantity,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Add item to cart using combination (new system)
   */
  static async addItemWithCombination(userId, productId, combinationId, quantity = 1) {
    // Check if item already exists
    const existingItem = await this.getItemByCombination(userId, productId, combinationId);

    if (existingItem) {
      return await this.updateQuantity(existingItem.cart_id, existingItem.quantity + quantity);
    }

    // Get combination details for selected_options
    const combinationSql = `SELECT option_values_json FROM product_option_combinations WHERE combination_id = ?`;
    const [combination] = await query(combinationSql, [combinationId]);

    const sql = `
      INSERT INTO cart_items (
        user_id,
        product_id,
        combination_id,
        selected_options,
        quantity,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(sql, [
      userId,
      productId,
      combinationId,
      combination ? combination.option_values_json : null,
      quantity,
    ]);

    return await this.getById(result.insertId);
  }

  /**
   * Update cart item quantity
   */
  static async updateQuantity(cartId, quantity) {
    if (quantity <= 0) {
      return await this.removeItem(cartId);
    }

    const sql = `
      UPDATE cart 
      SET quantity = ?, updated_at = NOW()
      WHERE cart_id = ?
    `;

    await query(sql, [quantity, cartId]);
    return await this.getById(cartId);
  }

  /**
   * Increment quantity
   */
  static async incrementQuantity(cartId, amount = 1) {
    const item = await this.getById(cartId);
    if (!item) return null;

    return await this.updateQuantity(cartId, item.quantity + amount);
  }

  /**
   * Decrement quantity
   */
  static async decrementQuantity(cartId, amount = 1) {
    const item = await this.getById(cartId);
    if (!item) return null;

    const newQuantity = item.quantity - amount;
    
    if (newQuantity <= 0) {
      await this.removeItem(cartId);
      return null;
    }

    return await this.updateQuantity(cartId, newQuantity);
  }

  /**
   * Remove item from cart
   */
  static async removeItem(cartId) {
    const sql = 'DELETE FROM cart WHERE cart_id = ?';
    const result = await query(sql, [cartId]);
    return result.affectedRows > 0;
  }

  /**
   * Remove item by user and product
   */
  static async removeByProduct(userId, productId, variantId = null) {
    let sql = 'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
    const params = [userId, productId];

    if (variantId) {
      sql += ' AND variant_id = ?';
      params.push(variantId);
    }

    const result = await query(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * Clear user's cart
   */
  static async clearCart(userId) {
    const sql = 'DELETE FROM cart WHERE user_id = ?';
    const result = await query(sql, [userId]);
    return result.affectedRows;
  }

  /**
   * Get cart count for user
   */
  static async getCount(userId) {
    const sql = 'SELECT COALESCE(SUM(quantity), 0) as count FROM cart WHERE user_id = ?';
    const results = await query(sql, [userId]);
    return results[0].count;
  }

  /**
   * Get cart items count (number of unique items)
   */
  static async getItemsCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM cart WHERE user_id = ?';
    const results = await query(sql, [userId]);
    return results[0].count;
  }

  /**
   * Check if cart is empty
   */
  static async isEmpty(userId) {
    const count = await this.getItemsCount(userId);
    return count === 0;
  }

  /**
   * Get cart subtotal
   */
  static async getSubtotal(userId) {
    const sql = `
      SELECT 
        SUM(
          c.quantity * 
          COALESCE(v.price, p.price) * 
          (1 - COALESCE(p.discount_percentage, 0) / 100)
        ) as subtotal
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      LEFT JOIN product_option_combinations poc ON c.combination_id = poc.combination_id
      WHERE c.user_id = ?
    `;

    const results = await query(sql, [userId]);
    return parseFloat(results[0].subtotal) || 0;
  }

  /**
   * Validate cart (check stock availability)
   * Uses the new product_option_combinations system
   */
  static async validateCart(userId) {
    const sql = `
      SELECT
        c.cart_id,
        c.product_id,
        c.combination_id,
        c.quantity,
        p.product_name_en as product_name,
        p.is_active as product_active,
        -- Stock: prioritize combination > product
        COALESCE(poc.stock_quantity, p.stock_quantity) as available_stock,
        -- Active status
        COALESCE(poc.is_active, 1) as combination_active,
        poc.option_summary
      FROM cart_items c
      JOIN products p ON c.product_id = p.product_id
      LEFT JOIN product_option_combinations poc ON c.combination_id = poc.combination_id
      WHERE c.user_id = ?
    `;

    const items = await query(sql, [userId]);
    const issues = [];

    for (const item of items) {
      if (!item.product_active) {
        issues.push({
          cart_id: item.cart_id,
          product_id: item.product_id,
          issue: 'product_inactive',
          message: `${item.product_name} is no longer available`,
        });
      } else if (item.combination_id && !item.combination_active) {
        // Combination inactive
        issues.push({
          cart_id: item.cart_id,
          product_id: item.product_id,
          combination_id: item.combination_id,
          issue: 'combination_inactive',
          message: `Selected option (${item.option_summary || 'combination'}) of ${item.product_name} is no longer available`,
        });
      } else if (item.available_stock <= 0) {
        issues.push({
          cart_id: item.cart_id,
          product_id: item.product_id,
          issue: 'out_of_stock',
          message: `${item.product_name} is out of stock`,
        });
      } else if (item.quantity > item.available_stock) {
        issues.push({
          cart_id: item.cart_id,
          product_id: item.product_id,
          issue: 'insufficient_stock',
          message: `Only ${item.available_stock} units of ${item.product_name} available`,
          available: item.available_stock,
          requested: item.quantity,
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Auto-fix cart issues (remove unavailable items, adjust quantities)
   */
  static async autoFixCart(userId) {
    const validation = await this.validateCart(userId);
    const fixed = [];

    for (const issue of validation.issues) {
      if (issue.issue === 'product_inactive' || issue.issue === 'variant_inactive' || issue.issue === 'out_of_stock') {
        await this.removeItem(issue.cart_id);
        fixed.push({
          action: 'removed',
          ...issue,
        });
      } else if (issue.issue === 'insufficient_stock') {
        await this.updateQuantity(issue.cart_id, issue.available);
        fixed.push({
          action: 'quantity_adjusted',
          new_quantity: issue.available,
          ...issue,
        });
      }
    }

    return {
      fixed_count: fixed.length,
      fixed_items: fixed,
    };
  }

  /**
   * Transfer cart from guest to user (after login)
   * Supports both legacy and new combination systems
   */
  static async transferCart(guestId, userId) {
    // Get guest cart items
    const guestCart = await this.getByUserId(guestId);

    if (!guestCart.items || guestCart.items.length === 0) {
      return { transferred: 0 };
    }

    let transferred = 0;

    for (const item of guestCart.items) {
      // Check if item already exists in user's cart
      const existingItem = await this.getItem(
        userId,
        item.product_id,
        item.variant_id,
        item.color_id,
        item.size_id,
        item.combination_id
      );

      if (existingItem) {
        // Merge quantities
        await this.updateQuantity(existingItem.cart_id, existingItem.quantity + item.quantity);
      } else {
        // Add new item to user's cart
        await this.addItem({
          user_id: userId,
          product_id: item.product_id,
          variant_id: item.variant_id,
          color_id: item.color_id,
          size_id: item.size_id,
          combination_id: item.combination_id,
          selected_options: item.selected_options,
          quantity: item.quantity,
        });
      }
      transferred++;
    }

    // Clear guest cart
    await this.clearCart(guestId);

    return { transferred };
  }

  /**
   * Merge carts
   */
  static async mergeCarts(sourceUserId, targetUserId) {
    return await this.transferCart(sourceUserId, targetUserId);
  }

  /**
   * Update cart item (variant/color/size/combination)
   * Supports both legacy and new systems
   */
  static async updateItem(cartId, data) {
    const allowedFields = ['variant_id', 'color_id', 'size_id', 'combination_id', 'selected_options', 'quantity'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'selected_options' && typeof value === 'object') {
          updates.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return await this.getById(cartId);
    }

    updates.push('updated_at = NOW()');
    values.push(cartId);

    const sql = `UPDATE cart_items SET ${updates.join(', ')} WHERE cart_id = ?`;
    await query(sql, values);

    return await this.getById(cartId);
  }

  /**
   * Update cart item to use combination (migrate from legacy)
   */
  static async updateItemToCombination(cartId, combinationId) {
    // Get combination details
    const combinationSql = `SELECT option_values_json FROM product_option_combinations WHERE combination_id = ?`;
    const [combination] = await query(combinationSql, [combinationId]);

    const sql = `
      UPDATE cart_items
      SET
        combination_id = ?,
        selected_options = ?,
        variant_id = NULL,
        color_id = NULL,
        size_id = NULL,
        updated_at = NOW()
      WHERE cart_id = ?
    `;

    await query(sql, [
      combinationId,
      combination ? combination.option_values_json : null,
      cartId
    ]);

    return await this.getById(cartId);
  }

  /**
   * Check if product is in cart
   * Supports both legacy (variant_id) and new (combination_id) systems
   */
  static async isInCart(userId, productId, variantId = null, combinationId = null) {
    let sql = 'SELECT cart_id FROM cart_items WHERE user_id = ? AND product_id = ?';
    const params = [userId, productId];

    if (combinationId) {
      sql += ' AND combination_id = ?';
      params.push(combinationId);
    } else if (variantId) {
      sql += ' AND variant_id = ?';
      params.push(variantId);
    }

    const results = await query(sql, params);
    return results.length > 0;
  }

  /**
   * Get cart for checkout (with full product details)
   */
  static async getForCheckout(userId, lang = 'en') {
    const cart = await this.getByUserId(userId, lang);
    const validation = await this.validateCart(userId);

    if (!validation.isValid) {
      return {
        ...cart,
        validation,
        can_checkout: false,
      };
    }

    return {
      ...cart,
      validation,
      can_checkout: cart.items.length > 0,
    };
  }

  /**
   * Reserve stock for cart items (during checkout)
   * Uses the new product_option_combinations system
   */
  static async reserveStock(userId) {
    const cart = await this.getByUserId(userId);
    const reserved = [];

    for (const item of cart.items) {
      if (item.combination_id) {
        // Reserve from combination
        await query(
          'UPDATE product_option_combinations SET reserved_quantity = reserved_quantity + ? WHERE combination_id = ?',
          [item.quantity, item.combination_id]
        );
        reserved.push({
          product_id: item.product_id,
          combination_id: item.combination_id,
          quantity: item.quantity,
        });
      } else {
        // No combination: reserve from product
        await query(
          'UPDATE products SET reserved_quantity = reserved_quantity + ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
        reserved.push({
          product_id: item.product_id,
          quantity: item.quantity,
        });
      }
    }

    return reserved;
  }

  /**
   * Release reserved stock (if checkout fails)
   * Uses the new product_option_combinations system
   */
  static async releaseStock(reservedItems) {
    for (const item of reservedItems) {
      if (item.combination_id) {
        // Release from combination
        await query(
          'UPDATE product_option_combinations SET reserved_quantity = GREATEST(0, reserved_quantity - ?) WHERE combination_id = ?',
          [item.quantity, item.combination_id]
        );
      } else {
        // No combination: release from product
        await query(
          'UPDATE products SET reserved_quantity = GREATEST(0, reserved_quantity - ?) WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }
    }
  }

  // ==================== Cart Statistics ====================

  /**
   * Get cart statistics (for admin)
   */
  static async getStatistics() {
    const sql = `
      SELECT
        COUNT(DISTINCT user_id) as total_carts,
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        AVG(quantity) as avg_items_per_cart,
        (
          SELECT SUM(c.quantity * COALESCE(poc.price, p.base_price))
          FROM cart_items c
          JOIN products p ON c.product_id = p.product_id
          LEFT JOIN product_option_combinations poc ON c.combination_id = poc.combination_id
        ) as total_cart_value
      FROM cart_items
    `;

    const results = await query(sql);
    return results[0];
  }

  /**
   * Get abandoned carts (carts older than specified hours)
   */
  static async getAbandonedCarts(hoursOld = 24, limit = 50) {
    const sql = `
      SELECT
        c.user_id,
        u.username,
        u.email,
        MAX(c.updated_at) as last_activity,
        COUNT(*) as item_count,
        SUM(c.quantity) as total_quantity,
        SUM(c.quantity * COALESCE(poc.price, p.base_price)) as cart_value
      FROM cart_items c
      JOIN users u ON c.user_id = u.user_id
      JOIN products p ON c.product_id = p.product_id
      LEFT JOIN product_option_combinations poc ON c.combination_id = poc.combination_id
      WHERE c.updated_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
      GROUP BY c.user_id, u.username, u.email
      ORDER BY cart_value DESC
      LIMIT ?
    `;

    return await query(sql, [hoursOld, limit]);
  }

  /**
   * Get popular cart items
   */
  static async getPopularCartItems(limit = 10, lang = 'en') {
    const nameField = `product_name_${lang}`;

    const sql = `
      SELECT 
        c.product_id,
        p.${nameField} as product_name,
        p.price,
        COUNT(DISTINCT c.user_id) as cart_count,
        SUM(c.quantity) as total_quantity
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      GROUP BY c.product_id, p.${nameField}, p.price
      ORDER BY cart_count DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  /**
   * Clean up old carts
   */
  static async cleanupOldCarts(daysOld = 30) {
    const sql = `
      DELETE FROM cart 
      WHERE updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const result = await query(sql, [daysOld]);
    return result.affectedRows;
  }

  /**
   * Get cart by user for admin view
   */
  static async getCartByUserForAdmin(userId) {
    const cart = await this.getByUserId(userId, 'en');
    const validation = await this.validateCart(userId);

    return {
      ...cart,
      validation,
      user_id: userId,
    };
  }

  /**
   * Bulk add items to cart
   * Supports both legacy and new combination systems
   */
  static async bulkAddItems(userId, items) {
    const added = [];

    for (const item of items) {
      const result = await this.addItem({
        user_id: userId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        color_id: item.color_id,
        size_id: item.size_id,
        combination_id: item.combination_id,
        selected_options: item.selected_options,
        quantity: item.quantity || 1,
      });

      if (result) {
        added.push(result);
      }
    }

    return {
      added_count: added.length,
      items: added,
    };
  }

  /**
   * Bulk remove items from cart
   */
  static async bulkRemoveItems(cartIds) {
    if (!cartIds || cartIds.length === 0) {
      return { removed: 0 };
    }

    const placeholders = cartIds.map(() => '?').join(',');
    const sql = `DELETE FROM cart WHERE cart_id IN (${placeholders})`;
    const result = await query(sql, cartIds);

    return { removed: result.affectedRows };
  }
}

module.exports = Cart;