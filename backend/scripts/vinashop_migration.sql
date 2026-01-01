-- =====================================================
-- VinaShop Database Migration Script
-- =====================================================
-- This script modifies the orders table to support guest checkout
-- Run this AFTER importing the main vinashop.sql database
-- =====================================================

-- Use vinashop database (create it first in phpMyAdmin)
USE vinashop;

-- =====================================================
-- Add Guest Order Fields to orders table
-- =====================================================

-- Make user_id and address_id nullable (for guest orders)
ALTER TABLE `orders` MODIFY COLUMN `user_id` int(11) NULL;
ALTER TABLE `orders` MODIFY COLUMN `address_id` int(11) NULL;

-- Add guest information fields
ALTER TABLE `orders` ADD COLUMN `guest_name` VARCHAR(255) NULL AFTER `address_id`;
ALTER TABLE `orders` ADD COLUMN `guest_email` VARCHAR(255) NULL AFTER `guest_name`;
ALTER TABLE `orders` ADD COLUMN `guest_phone` VARCHAR(50) NULL AFTER `guest_email`;
ALTER TABLE `orders` ADD COLUMN `guest_city` VARCHAR(100) NULL AFTER `guest_phone`;
ALTER TABLE `orders` ADD COLUMN `guest_address` TEXT NULL AFTER `guest_city`;
ALTER TABLE `orders` ADD COLUMN `guest_area_code` VARCHAR(20) NULL AFTER `guest_address`;

-- Add delivery method and fee fields
ALTER TABLE `orders` ADD COLUMN `delivery_method` ENUM('delivery', 'pickup') DEFAULT 'delivery' AFTER `guest_area_code`;
ALTER TABLE `orders` ADD COLUMN `delivery_fee` DECIMAL(10,2) DEFAULT 0.00 AFTER `delivery_method`;
ALTER TABLE `orders` ADD COLUMN `region` ENUM('west_bank', 'jerusalem', 'other') NULL AFTER `delivery_fee`;

-- =====================================================
-- Update order number prefix from TS to VS (VinaShop)
-- =====================================================

-- Update the order prefix in any existing data
UPDATE `orders` SET `order_number` = REPLACE(`order_number`, 'TS-', 'VS-') WHERE `order_number` LIKE 'TS-%';

-- =====================================================
-- Add index for guest orders
-- =====================================================

ALTER TABLE `orders` ADD INDEX `idx_guest_email` (`guest_email`);
ALTER TABLE `orders` ADD INDEX `idx_guest_phone` (`guest_phone`);
ALTER TABLE `orders` ADD INDEX `idx_delivery_method` (`delivery_method`);

-- =====================================================
-- Update settings table with VinaShop defaults
-- =====================================================

-- Update store name
UPDATE `settings` SET `value` = 'VinaShop' WHERE `key` = 'store_name';
INSERT INTO `settings` (`key`, `value`, `group`, `type`, `label`, `is_public`) VALUES
('store_name', 'VinaShop', 'general', 'text', 'Store Name', 1)
ON DUPLICATE KEY UPDATE `value` = 'VinaShop';

-- Add delivery fee settings
INSERT INTO `settings` (`key`, `value`, `group`, `type`, `label`, `is_public`) VALUES
('delivery_fee_west_bank', '20', 'shipping', 'number', 'Delivery Fee - West Bank (NIS)', 0),
('delivery_fee_jerusalem', '40', 'shipping', 'number', 'Delivery Fee - Jerusalem (NIS)', 0),
('delivery_fee_other', '70', 'shipping', 'number', 'Delivery Fee - Other Areas (NIS)', 0),
('store_pickup_enabled', 'true', 'shipping', 'boolean', 'Enable Store Pickup', 0)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- =====================================================
-- Create public_orders table for guest cart (optional)
-- =====================================================

CREATE TABLE IF NOT EXISTS `guest_carts` (
  `cart_id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(255) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variant_id` int(11) NULL,
  `color_id` int(11) NULL,
  `size_id` int(11) NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `selected_options` JSON NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`cart_id`),
  INDEX `idx_session` (`session_id`),
  INDEX `idx_product` (`product_id`),
  CONSTRAINT `fk_guest_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Verify migration
-- =====================================================

-- Check that all new columns exist
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'vinashop'
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME IN ('guest_name', 'guest_email', 'guest_phone', 'guest_city', 'guest_address', 'guest_area_code', 'delivery_method', 'delivery_fee', 'region');

-- Show success message
SELECT 'VinaShop migration completed successfully!' AS status;
