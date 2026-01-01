-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- مضيف: localhost:3306
-- وقت الجيل: 01 يناير 2026 الساعة 20:27
-- إصدار الخادم: 8.0.33-cll-lve
-- نسخة PHP: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- قاعدة بيانات: `vinaskap_vinashop`
--

-- --------------------------------------------------------

--
-- بنية الجدول `admins`
--

CREATE TABLE `admins` (
  `admin_id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('super_admin','admin','manager','employee','support') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `is_active` tinyint(1) DEFAULT '1',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `admins`
--

INSERT INTO `admins` (`admin_id`, `email`, `password`, `first_name`, `last_name`, `role`, `is_active`, `avatar`, `phone`, `created_at`, `updated_at`) VALUES
(1, 'admin@vinashop.com', '$2b$10$41mWPLcnrfKpAfOov/Uq.udFrn48CAb3O.YhjWyBQYLIwP0uNYBRq', 'Admin', 'User', 'super_admin', 1, NULL, NULL, '2025-12-31 21:04:39', '2025-12-31 21:05:04');

-- --------------------------------------------------------

--
-- بنية الجدول `admin_activity_log`
--

CREATE TABLE `admin_activity_log` (
  `log_id` int NOT NULL,
  `admin_id` int NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `old_values` text COLLATE utf8mb4_unicode_ci,
  `new_values` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `admin_traders`
--

CREATE TABLE `admin_traders` (
  `trader_id` int NOT NULL,
  `admin_id` int DEFAULT NULL,
  `business_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `tax_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credit_limit` decimal(10,2) DEFAULT '0.00',
  `current_balance` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `admin_users`
--

CREATE TABLE `admin_users` (
  `admin_id` int NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('super_admin','admin','moderator') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `admin_users`
--

INSERT INTO `admin_users` (`admin_id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@vinashop.com', '$2b$10$41mWPLcnrfKpAfOov/Uq.udFrn48CAb3O.YhjWyBQYLIwP0uNYBRq', 'Admin User', 'super_admin', 1, '2025-12-31 21:04:52', '2025-12-31 21:05:00');

-- --------------------------------------------------------

--
-- بنية الجدول `banners`
--

CREATE TABLE `banners` (
  `banner_id` int NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtitle_en` text COLLATE utf8mb4_unicode_ci,
  `subtitle_ar` text COLLATE utf8mb4_unicode_ci,
  `media_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_type` enum('image','video') COLLATE utf8mb4_unicode_ci DEFAULT 'image',
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_type` enum('category','product','url','none') COLLATE utf8mb4_unicode_ci DEFAULT 'none',
  `link_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `banners`
--

INSERT INTO `banners` (`banner_id`, `title_en`, `title_ar`, `subtitle_en`, `subtitle_ar`, `media_path`, `media_type`, `mime_type`, `link_type`, `link_value`, `display_order`, `is_active`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, NULL, NULL, 'uploads/banners/drone003g-1767215143853-67ea69cb-601f-4fab-8c1a-d9b1434496b3.jpg', 'image', 'image/jpeg', 'none', NULL, 0, 1, NULL, NULL, '2025-12-31 21:05:43', '2025-12-31 21:05:43');

-- --------------------------------------------------------

--
-- بنية الجدول `bill_images`
--

CREATE TABLE `bill_images` (
  `bill_image_id` int NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `bill_type` enum('purchase','expense','receipt','other') COLLATE utf8mb4_unicode_ci DEFAULT 'purchase',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_processed` tinyint(1) DEFAULT '0',
  `uploaded_by` int DEFAULT NULL,
  `processed_by` int DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `bill_sequences`
--

CREATE TABLE `bill_sequences` (
  `sequence_id` int NOT NULL,
  `sequence_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_year` int NOT NULL,
  `last_number` int DEFAULT '0',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `cart_items`
--

CREATE TABLE `cart_items` (
  `cart_item_id` int NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `selected_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'JSON array of selected options: [{"option_type_id":1,"option_value_id":3}]'
) ;

-- --------------------------------------------------------

--
-- بنية الجدول `categories`
--

CREATE TABLE `categories` (
  `category_id` int NOT NULL,
  `category_name_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_description_en` text COLLATE utf8mb4_unicode_ci,
  `category_description_ar` text COLLATE utf8mb4_unicode_ci,
  `category_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `categories`
--

INSERT INTO `categories` (`category_id`, `category_name_en`, `category_name_ar`, `category_description_en`, `category_description_ar`, `category_image`, `display_order`, `is_featured`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'asd', 'asd', NULL, NULL, NULL, 0, 0, 1, '2026-01-01 16:03:41', '2026-01-01 16:03:41');

-- --------------------------------------------------------

--
-- بنية الجدول `contact_messages`
--

CREATE TABLE `contact_messages` (
  `message_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_reply` text COLLATE utf8mb4_unicode_ci,
  `replied_by` int DEFAULT NULL,
  `replied_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `customer_bills`
--

CREATE TABLE `customer_bills` (
  `bill_id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `bill_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bill_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) DEFAULT '0.00',
  `amount_due` decimal(10,2) GENERATED ALWAYS AS ((`total_amount` - `amount_paid`)) STORED,
  `payment_status` enum('unpaid','partial','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- القوادح `customer_bills`
--
DELIMITER $$
CREATE TRIGGER `after_bill_payment_update` AFTER UPDATE ON `customer_bills` FOR EACH ROW BEGIN
    IF NEW.amount_paid != OLD.amount_paid THEN
        UPDATE customer_bills
        SET payment_status = CASE
            WHEN NEW.amount_paid >= NEW.total_amount THEN 'paid'
            WHEN NEW.amount_paid > 0 THEN 'partial'
            ELSE 'unpaid'
        END
        WHERE bill_id = NEW.bill_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- بنية الجدول `customer_bill_items`
--

CREATE TABLE `customer_bill_items` (
  `item_id` int NOT NULL,
  `bill_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `total_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `customer_debts`
--

CREATE TABLE `customer_debts` (
  `debt_id` int NOT NULL,
  `user_id` int NOT NULL,
  `bill_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_debt` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) DEFAULT '0.00',
  `remaining_debt` decimal(10,2) GENERATED ALWAYS AS ((`total_debt` - `amount_paid`)) STORED,
  `status` enum('pending','partial','settled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `debt_payments`
--

CREATE TABLE `debt_payments` (
  `payment_id` int NOT NULL,
  `debt_id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','card','bank_transfer','other') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `recorded_by` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- القوادح `debt_payments`
--
DELIMITER $$
CREATE TRIGGER `after_debt_payment_insert` AFTER INSERT ON `debt_payments` FOR EACH ROW BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE total_debt DECIMAL(10,2);
    SELECT SUM(amount) INTO total_paid FROM debt_payments WHERE debt_id = NEW.debt_id;
    SELECT total_debt INTO total_debt FROM customer_debts WHERE debt_id = NEW.debt_id;
    UPDATE customer_debts SET amount_paid = total_paid, status = CASE WHEN total_paid >= total_debt THEN 'settled' WHEN total_paid > 0 THEN 'partial' ELSE 'pending' END WHERE debt_id = NEW.debt_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- بنية الجدول `guest_carts`
--

CREATE TABLE `guest_carts` (
  `cart_id` int NOT NULL,
  `session_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `color_id` int DEFAULT NULL,
  `size_id` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `selected_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- بنية الجدول `invoices`
--

CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `status` enum('draft','pending','sent','paid','cancelled','overdue') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_status` enum('pending','partial','paid','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_cost` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `due_amount` decimal(10,2) DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'ILS',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `due_date` date DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `billing_address` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `invoice_items`
--

CREATE TABLE `invoice_items` (
  `item_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `migrations`
--

CREATE TABLE `migrations` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `migrations`
--

INSERT INTO `migrations` (`id`, `name`, `executed_at`, `checksum`) VALUES
(1, '20251225_001_add_salary_indexes.sql', '2025-12-31 22:55:46', 'ab20534cb92c8c4838e29aeaa59933cf4bc7dd3d909ccd494f7380be748516c1'),
(2, '20251225_002_vinashop_guest_orders.sql', '2025-12-31 22:55:46', 'fdc244fc75815103f89565deb432a230c38e59bac42dace6fc4757860fbbb6dd'),
(3, '20251225_003_vinashop_fixes.sql', '2025-12-31 22:55:46', '207d05a9539d3000f847c5bccb697a8b6567dcd4bfafa72fb477fe3cdd17e8d1'),
(4, '20251226_001_add_color_options.sql', '2025-12-31 22:55:46', 'e5f2a5511987effc00958f6e666ab915b4952dbab4e680b81f89a174a18c4500'),
(5, '20251227_001_allow_guest_reviews.sql', '2025-12-31 22:55:46', '8467ac3dc1834ce521d8964fb98e6056604750fbb9dc10abeb96dfe0cc7c7369');

-- --------------------------------------------------------

--
-- بنية الجدول `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int NOT NULL,
  `user_id` int NOT NULL,
  `type` enum('order','promotion','account','system') COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- بنية الجدول `orders`
--

CREATE TABLE `orders` (
  `order_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `address_id` int DEFAULT NULL,
  `guest_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_address` text COLLATE utf8mb4_unicode_ci,
  `guest_area_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_method` enum('delivery','pickup') COLLATE utf8mb4_unicode_ci DEFAULT 'delivery',
  `delivery_fee` decimal(10,2) DEFAULT '0.00',
  `region` enum('west_bank','jerusalem','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','confirmed','processing','shipped','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `shipping_cost` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `selected_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'JSON array of selected options: [{"option_type_id":1,"option_value_id":3}]'
) ;

-- --------------------------------------------------------

--
-- بنية الجدول `order_status_history`
--

CREATE TABLE `order_status_history` (
  `history_id` int NOT NULL,
  `order_id` int NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `changed_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `payments`
--

CREATE TABLE `payments` (
  `payment_id` int NOT NULL,
  `invoice_id` int DEFAULT NULL,
  `bill_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'ILS',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_details` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `payment_date` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `phone_otps`
--

CREATE TABLE `phone_otps` (
  `id` int NOT NULL,
  `phone_number` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `attempts` int DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `products`
--

CREATE TABLE `products` (
  `product_id` int NOT NULL,
  `category_id` int NOT NULL,
  `subcategory_id` int DEFAULT NULL,
  `product_name_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_description_en` text COLLATE utf8mb4_unicode_ci,
  `product_description_ar` text COLLATE utf8mb4_unicode_ci,
  `base_price` decimal(10,2) NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT '0.00',
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_quantity` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `view_count` int DEFAULT '0',
  `rating_average` decimal(3,2) DEFAULT '0.00',
  `rating_count` int DEFAULT '0',
  `meta_keywords` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `average_rating` decimal(3,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `products`
--

INSERT INTO `products` (`product_id`, `category_id`, `subcategory_id`, `product_name_en`, `product_name_ar`, `product_description_en`, `product_description_ar`, `base_price`, `discount_percentage`, `sku`, `stock_quantity`, `is_active`, `is_featured`, `view_count`, `rating_average`, `rating_count`, `meta_keywords`, `created_at`, `updated_at`, `average_rating`) VALUES
(1, 1, NULL, 'asd', 'asd', '', '', 10.00, 0.00, 'ASD-MJVMXM6U-51Y', 0, 1, 0, 0, 0.00, 0, NULL, '2026-01-01 16:04:09', '2026-01-01 16:04:09', 0.00),
(2, 1, NULL, 'asd', 'asd', '', '', 9.98, 0.00, 'ASD-MJVMZ1H8', 0, 1, 0, 0, 0.00, 0, NULL, '2026-01-01 16:05:12', '2026-01-01 16:05:12', 0.00),
(3, 1, NULL, 'dfgdfg', 'dfgdfg', '', '', 32.98, 0.00, 'DFG-MJVQ0TUU', 0, 1, 0, 0, 0.00, 0, NULL, '2026-01-01 17:30:34', '2026-01-01 17:30:34', 0.00);

-- --------------------------------------------------------

--
-- بنية الجدول `product_images`
--

CREATE TABLE `product_images` (
  `image_id` int NOT NULL,
  `product_id` int NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `product_images`
--

INSERT INTO `product_images` (`image_id`, `product_id`, `image_url`, `is_primary`, `display_order`, `created_at`) VALUES
(1, 1, 'uploads/products/drone003g-1767283449722-d56234a5-060d-4f11-9794-053be5f8bf64.jpg', 1, 0, '2026-01-01 16:04:10'),
(2, 3, 'uploads/products/599689491-1172694888390181-8879928571604836770-n-1767288634858-9b01aa31-7cf5-4733-b5fc-a0bad48b51cc.jpg', 1, 0, '2026-01-01 17:30:35');

-- --------------------------------------------------------

--
-- بنية الجدول `product_options`
--

CREATE TABLE `product_options` (
  `product_option_id` int NOT NULL,
  `product_id` int NOT NULL,
  `option_type_id` int NOT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `product_option_types`
--

CREATE TABLE `product_option_types` (
  `option_type_id` int NOT NULL,
  `type_name_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name_ar` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `product_option_values`
--

CREATE TABLE `product_option_values` (
  `option_value_id` int NOT NULL,
  `option_type_id` int NOT NULL,
  `value_name_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value_name_ar` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_price` decimal(10,2) DEFAULT '0.00',
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `product_reviews`
--

CREATE TABLE `product_reviews` (
  `review_id` int NOT NULL,
  `product_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `reviewer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int NOT NULL,
  `review_text` text COLLATE utf8mb4_unicode_ci,
  `is_approved` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- بنية الجدول `settings`
--

CREATE TABLE `settings` (
  `setting_id` int NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `setting_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `is_public` tinyint(1) DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `subcategories`
--

CREATE TABLE `subcategories` (
  `subcategory_id` int NOT NULL,
  `category_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `level` int DEFAULT '1',
  `subcategory_name_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subcategory_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subcategory_description_en` text COLLATE utf8mb4_unicode_ci,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subcategory_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `supplier_bills`
--

CREATE TABLE `supplier_bills` (
  `bill_id` int NOT NULL,
  `bill_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `supplier_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_address` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','pending','approved','paid','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_status` enum('pending','partial','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `due_amount` decimal(10,2) DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'ILS',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `due_date` date DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `supplier_bill_items`
--

CREATE TABLE `supplier_bill_items` (
  `item_id` int NOT NULL,
  `bill_id` int NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `traders`
--

CREATE TABLE `traders` (
  `trader_id` int NOT NULL,
  `company_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `tax_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_terms` int DEFAULT '30',
  `credit_limit` decimal(12,2) DEFAULT '0.00',
  `current_balance` decimal(12,2) DEFAULT '0.00',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `trader_bills`
--

CREATE TABLE `trader_bills` (
  `bill_id` int NOT NULL,
  `trader_id` int NOT NULL,
  `bill_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bill_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `amount_paid` decimal(12,2) DEFAULT '0.00',
  `amount_due` decimal(12,2) GENERATED ALWAYS AS ((`total_amount` - `amount_paid`)) STORED,
  `payment_status` enum('unpaid','partial','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `bill_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- القوادح `trader_bills`
--
DELIMITER $$
CREATE TRIGGER `after_trader_bill_insert` AFTER INSERT ON `trader_bills` FOR EACH ROW BEGIN
    UPDATE traders SET current_balance = current_balance + NEW.total_amount WHERE trader_id = NEW.trader_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- بنية الجدول `trader_bill_items`
--

CREATE TABLE `trader_bill_items` (
  `item_id` int NOT NULL,
  `bill_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `total_cost` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `trader_payments`
--

CREATE TABLE `trader_payments` (
  `payment_id` int NOT NULL,
  `trader_id` int NOT NULL,
  `bill_id` int DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','check','bank_transfer','other') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_date` date NOT NULL,
  `reference_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- القوادح `trader_payments`
--
DELIMITER $$
CREATE TRIGGER `after_trader_payment_insert` AFTER INSERT ON `trader_payments` FOR EACH ROW BEGIN
    UPDATE traders SET current_balance = current_balance - NEW.amount WHERE trader_id = NEW.trader_id;
    IF NEW.bill_id IS NOT NULL THEN
        UPDATE trader_bills tb SET amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM trader_payments WHERE bill_id = NEW.bill_id) WHERE tb.bill_id = NEW.bill_id;
        UPDATE trader_bills tb SET payment_status = CASE WHEN tb.amount_paid >= tb.total_amount THEN 'paid' WHEN tb.amount_paid > 0 THEN 'partial' ELSE 'unpaid' END WHERE tb.bill_id = NEW.bill_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- بنية الجدول `transactions`
--

CREATE TABLE `transactions` (
  `transaction_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `admin_trader_id` int DEFAULT NULL,
  `invoice_id` int DEFAULT NULL,
  `payment_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `transaction_type` enum('charge','payment','refund','adjustment','credit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'ILS',
  `balance_before` decimal(10,2) DEFAULT '0.00',
  `balance_after` decimal(10,2) DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_ci,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_trader_balance_summary`
-- (See below for the actual view)
--
CREATE TABLE `v_trader_balance_summary` (
`company_name` varchar(100)
,`contact_person` varchar(100)
,`credit_limit` decimal(12,2)
,`current_balance` decimal(12,2)
,`partial_due` decimal(34,2)
,`phone` varchar(20)
,`total_bills` bigint
,`trader_id` int
,`unpaid_amount` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_wholesaler_balance_summary`
-- (See below for the actual view)
--
CREATE TABLE `v_wholesaler_balance_summary` (
`company_name` varchar(100)
,`contact_person` varchar(100)
,`credit_limit` decimal(12,2)
,`current_balance` decimal(12,2)
,`discount_percentage` decimal(5,2)
,`partial_due` decimal(34,2)
,`phone` varchar(20)
,`total_orders` bigint
,`unpaid_amount` decimal(34,2)
,`wholesaler_id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_worker_monthly_summary`
-- (See below for the actual view)
--
CREATE TABLE `v_worker_monthly_summary` (
`base_salary` decimal(10,2)
,`bonus` decimal(10,2)
,`calculated_amount` decimal(10,2)
,`days_worked` int
,`deductions` decimal(10,2)
,`full_name` varchar(100)
,`month` int
,`net_salary` decimal(10,2)
,`payment_status` enum('pending','paid')
,`position` varchar(50)
,`worker_id` int
,`year` int
);

-- --------------------------------------------------------

--
-- بنية الجدول `wholesalers`
--

CREATE TABLE `wholesalers` (
  `wholesaler_id` int NOT NULL,
  `company_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `tax_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT '0.00',
  `credit_limit` decimal(12,2) DEFAULT '0.00',
  `current_balance` decimal(12,2) DEFAULT '0.00',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `wholesaler_orders`
--

CREATE TABLE `wholesaler_orders` (
  `order_id` int NOT NULL,
  `wholesaler_id` int NOT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `subtotal` decimal(12,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `amount_paid` decimal(12,2) DEFAULT '0.00',
  `amount_due` decimal(12,2) GENERATED ALWAYS AS ((`total_amount` - `amount_paid`)) STORED,
  `payment_status` enum('unpaid','partial','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `order_status` enum('pending','confirmed','processing','shipped','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- القوادح `wholesaler_orders`
--
DELIMITER $$
CREATE TRIGGER `after_wholesaler_order_insert` AFTER INSERT ON `wholesaler_orders` FOR EACH ROW BEGIN
    UPDATE wholesalers SET current_balance = current_balance + NEW.total_amount WHERE wholesaler_id = NEW.wholesaler_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- بنية الجدول `wholesaler_order_items`
--

CREATE TABLE `wholesaler_order_items` (
  `item_id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `total_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `wholesaler_payments`
--

CREATE TABLE `wholesaler_payments` (
  `payment_id` int NOT NULL,
  `wholesaler_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','check','bank_transfer','other') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_date` date NOT NULL,
  `reference_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- القوادح `wholesaler_payments`
--
DELIMITER $$
CREATE TRIGGER `after_wholesaler_payment_insert` AFTER INSERT ON `wholesaler_payments` FOR EACH ROW BEGIN
    UPDATE wholesalers SET current_balance = current_balance - NEW.amount WHERE wholesaler_id = NEW.wholesaler_id;
    IF NEW.order_id IS NOT NULL THEN
        UPDATE wholesaler_orders wo SET amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM wholesaler_payments WHERE order_id = NEW.order_id) WHERE wo.order_id = NEW.order_id;
        UPDATE wholesaler_orders wo SET payment_status = CASE WHEN wo.amount_paid >= wo.total_amount THEN 'paid' WHEN wo.amount_paid > 0 THEN 'partial' ELSE 'unpaid' END WHERE wo.order_id = NEW.order_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- بنية الجدول `wishlist`
--

CREATE TABLE `wishlist` (
  `wishlist_id` int NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `workers`
--

CREATE TABLE `workers` (
  `worker_id` int NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `position` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hire_date` date NOT NULL,
  `base_salary` decimal(10,2) NOT NULL,
  `salary_type` enum('monthly','daily','hourly') COLLATE utf8mb4_unicode_ci DEFAULT 'monthly',
  `status` enum('active','inactive','terminated') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `worker_attendance`
--

CREATE TABLE `worker_attendance` (
  `attendance_id` int NOT NULL,
  `worker_id` int NOT NULL,
  `work_date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `hours_worked` decimal(4,2) GENERATED ALWAYS AS ((timestampdiff(MINUTE,`check_in`,`check_out`) / 60)) STORED,
  `status` enum('present','absent','late','half_day','holiday') COLLATE utf8mb4_unicode_ci DEFAULT 'present',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `recorded_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `worker_salaries`
--

CREATE TABLE `worker_salaries` (
  `salary_id` int NOT NULL,
  `worker_id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `calculation_type` enum('fixed','days_worked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fixed',
  `working_days_in_month` int DEFAULT '26',
  `days_worked` int DEFAULT '0',
  `hours_worked` decimal(6,2) DEFAULT '0.00',
  `base_salary` decimal(10,2) NOT NULL,
  `calculated_amount` decimal(10,2) NOT NULL,
  `bonus` decimal(10,2) DEFAULT '0.00',
  `deductions` decimal(10,2) DEFAULT '0.00',
  `net_salary` decimal(10,2) GENERATED ALWAYS AS (((`calculated_amount` + `bonus`) - `deductions`)) STORED,
  `payment_status` enum('pending','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_date` date DEFAULT NULL,
  `payment_method` enum('cash','bank_transfer','check') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `_backup_migration_color_mapping`
--

CREATE TABLE `_backup_migration_color_mapping` (
  `old_color_id` int NOT NULL,
  `new_option_value_id` int DEFAULT NULL,
  `migrated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `_backup_migration_size_mapping`
--

CREATE TABLE `_backup_migration_size_mapping` (
  `old_size_id` int NOT NULL,
  `new_option_value_id` int DEFAULT NULL,
  `migrated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `_backup_migration_variant_mapping`
--

CREATE TABLE `_backup_migration_variant_mapping` (
  `old_variant_id` int NOT NULL,
  `new_combination_id` int DEFAULT NULL,
  `migrated_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','migrated','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `_backup_product_colors`
--

CREATE TABLE `_backup_product_colors` (
  `color_id` int NOT NULL DEFAULT '0',
  `color_name_en` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_name_ar` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_name_he` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_hex_code` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `_backup_product_sizes`
--

CREATE TABLE `_backup_product_sizes` (
  `size_id` int NOT NULL DEFAULT '0',
  `size_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_value` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size_unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `_backup_product_variants`
--

CREATE TABLE `_backup_product_variants` (
  `variant_id` int NOT NULL DEFAULT '0',
  `product_id` int NOT NULL,
  `color_id` int DEFAULT NULL,
  `size_id` int DEFAULT NULL,
  `additional_price` decimal(10,2) DEFAULT '0.00',
  `stock_quantity` int DEFAULT '0',
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- فهارس للجدول `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- فهارس للجدول `admin_activity_log`
--
ALTER TABLE `admin_activity_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_module` (`module`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- فهارس للجدول `admin_traders`
--
ALTER TABLE `admin_traders`
  ADD PRIMARY KEY (`trader_id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_status` (`status`);

--
-- فهارس للجدول `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- فهارس للجدول `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`banner_id`),
  ADD KEY `idx_active` (`is_active`,`display_order`);

--
-- فهارس للجدول `bill_images`
--
ALTER TABLE `bill_images`
  ADD PRIMARY KEY (`bill_image_id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `idx_bill_type` (`bill_type`),
  ADD KEY `idx_is_processed` (`is_processed`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- فهارس للجدول `bill_sequences`
--
ALTER TABLE `bill_sequences`
  ADD PRIMARY KEY (`sequence_id`),
  ADD UNIQUE KEY `unique_sequence_year` (`sequence_type`,`current_year`);

--
-- فهارس للجدول `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `idx_cart_product_options` (`product_id`,`selected_options`(255));

--
-- فهارس للجدول `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- فهارس للجدول `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `replied_by` (`replied_by`);

--
-- فهارس للجدول `customer_bills`
--
ALTER TABLE `customer_bills`
  ADD PRIMARY KEY (`bill_id`),
  ADD UNIQUE KEY `bill_number` (`bill_number`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `created_by` (`created_by`);

--
-- فهارس للجدول `customer_bill_items`
--
ALTER TABLE `customer_bill_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `bill_id` (`bill_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- فهارس للجدول `customer_debts`
--
ALTER TABLE `customer_debts`
  ADD PRIMARY KEY (`debt_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `bill_id` (`bill_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `created_by` (`created_by`);

--
-- فهارس للجدول `debt_payments`
--
ALTER TABLE `debt_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `debt_id` (`debt_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- فهارس للجدول `guest_carts`
--
ALTER TABLE `guest_carts`
  ADD PRIMARY KEY (`cart_id`),
  ADD KEY `idx_session` (`session_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- فهارس للجدول `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`invoice_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_due_date` (`due_date`);

--
-- فهارس للجدول `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `idx_invoice_id` (`invoice_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- فهارس للجدول `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`);

--
-- فهارس للجدول `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- فهارس للجدول `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_order_number` (`order_number`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_guest_email` (`guest_email`),
  ADD KEY `idx_guest_phone` (`guest_phone`),
  ADD KEY `idx_delivery_method` (`delivery_method`);

--
-- فهارس للجدول `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_order_product_options` (`product_id`,`selected_options`(255));

--
-- فهارس للجدول `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- فهارس للجدول `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_invoice_id` (`invoice_id`),
  ADD KEY `idx_bill_id` (`bill_id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- فهارس للجدول `phone_otps`
--
ALTER TABLE `phone_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_phone_number` (`phone_number`),
  ADD KEY `user_id` (`user_id`);

--
-- فهارس للجدول `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `subcategory_id` (`subcategory_id`);

--
-- فهارس للجدول `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `product_id` (`product_id`);

--
-- فهارس للجدول `product_options`
--
ALTER TABLE `product_options`
  ADD PRIMARY KEY (`product_option_id`),
  ADD UNIQUE KEY `unique_product_option` (`product_id`,`option_type_id`),
  ADD KEY `idx_product` (`product_id`),
  ADD KEY `idx_option_type` (`option_type_id`);

--
-- فهارس للجدول `product_option_types`
--
ALTER TABLE `product_option_types`
  ADD PRIMARY KEY (`option_type_id`);

--
-- فهارس للجدول `product_option_values`
--
ALTER TABLE `product_option_values`
  ADD PRIMARY KEY (`option_value_id`),
  ADD KEY `idx_option_type` (`option_type_id`);

--
-- فهارس للجدول `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- فهارس للجدول `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_setting_group` (`setting_group`);

--
-- فهارس للجدول `subcategories`
--
ALTER TABLE `subcategories`
  ADD PRIMARY KEY (`subcategory_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_parent_id` (`parent_id`);

--
-- فهارس للجدول `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- فهارس للجدول `supplier_bills`
--
ALTER TABLE `supplier_bills`
  ADD PRIMARY KEY (`bill_id`),
  ADD UNIQUE KEY `bill_number` (`bill_number`),
  ADD KEY `idx_supplier_id` (`supplier_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_due_date` (`due_date`);

--
-- فهارس للجدول `supplier_bill_items`
--
ALTER TABLE `supplier_bill_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `idx_bill_id` (`bill_id`);

--
-- فهارس للجدول `traders`
--
ALTER TABLE `traders`
  ADD PRIMARY KEY (`trader_id`);

--
-- فهارس للجدول `trader_bills`
--
ALTER TABLE `trader_bills`
  ADD PRIMARY KEY (`bill_id`),
  ADD KEY `trader_id` (`trader_id`),
  ADD KEY `created_by` (`created_by`);

--
-- فهارس للجدول `trader_bill_items`
--
ALTER TABLE `trader_bill_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `bill_id` (`bill_id`),
  ADD KEY `product_id` (`product_id`);

--
-- فهارس للجدول `trader_payments`
--
ALTER TABLE `trader_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `trader_id` (`trader_id`),
  ADD KEY `bill_id` (`bill_id`),
  ADD KEY `created_by` (`created_by`);

--
-- فهارس للجدول `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_admin_trader_id` (`admin_trader_id`),
  ADD KEY `idx_invoice_id` (`invoice_id`),
  ADD KEY `idx_type` (`transaction_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- فهارس للجدول `wholesalers`
--
ALTER TABLE `wholesalers`
  ADD PRIMARY KEY (`wholesaler_id`);

--
-- فهارس للجدول `wholesaler_orders`
--
ALTER TABLE `wholesaler_orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `wholesaler_id` (`wholesaler_id`),
  ADD KEY `created_by` (`created_by`);

--
-- فهارس للجدول `wholesaler_order_items`
--
ALTER TABLE `wholesaler_order_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- فهارس للجدول `wholesaler_payments`
--
ALTER TABLE `wholesaler_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `wholesaler_id` (`wholesaler_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `created_by` (`created_by`);

--
-- فهارس للجدول `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`wishlist_id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- فهارس للجدول `workers`
--
ALTER TABLE `workers`
  ADD PRIMARY KEY (`worker_id`);

--
-- فهارس للجدول `worker_attendance`
--
ALTER TABLE `worker_attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `unique_worker_date` (`worker_id`,`work_date`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- فهارس للجدول `worker_salaries`
--
ALTER TABLE `worker_salaries`
  ADD PRIMARY KEY (`salary_id`),
  ADD UNIQUE KEY `unique_worker_month` (`worker_id`,`month`,`year`),
  ADD KEY `created_by` (`created_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `admin_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `admin_activity_log`
--
ALTER TABLE `admin_activity_log`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_traders`
--
ALTER TABLE `admin_traders`
  MODIFY `trader_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `admin_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `banner_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `bill_images`
--
ALTER TABLE `bill_images`
  MODIFY `bill_image_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bill_sequences`
--
ALTER TABLE `bill_sequences`
  MODIFY `sequence_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `cart_item_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `message_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_bills`
--
ALTER TABLE `customer_bills`
  MODIFY `bill_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_bill_items`
--
ALTER TABLE `customer_bill_items`
  MODIFY `item_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_debts`
--
ALTER TABLE `customer_debts`
  MODIFY `debt_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `debt_payments`
--
ALTER TABLE `debt_payments`
  MODIFY `payment_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guest_carts`
--
ALTER TABLE `guest_carts`
  MODIFY `cart_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `invoice_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `item_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `history_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phone_otps`
--
ALTER TABLE `phone_otps`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `image_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `product_options`
--
ALTER TABLE `product_options`
  MODIFY `product_option_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_option_types`
--
ALTER TABLE `product_option_types`
  MODIFY `option_type_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_option_values`
--
ALTER TABLE `product_option_values`
  MODIFY `option_value_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `review_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `setting_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subcategories`
--
ALTER TABLE `subcategories`
  MODIFY `subcategory_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier_bills`
--
ALTER TABLE `supplier_bills`
  MODIFY `bill_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier_bill_items`
--
ALTER TABLE `supplier_bill_items`
  MODIFY `item_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `traders`
--
ALTER TABLE `traders`
  MODIFY `trader_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trader_bills`
--
ALTER TABLE `trader_bills`
  MODIFY `bill_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trader_bill_items`
--
ALTER TABLE `trader_bill_items`
  MODIFY `item_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trader_payments`
--
ALTER TABLE `trader_payments`
  MODIFY `payment_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transaction_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wholesalers`
--
ALTER TABLE `wholesalers`
  MODIFY `wholesaler_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wholesaler_orders`
--
ALTER TABLE `wholesaler_orders`
  MODIFY `order_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wholesaler_order_items`
--
ALTER TABLE `wholesaler_order_items`
  MODIFY `item_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wholesaler_payments`
--
ALTER TABLE `wholesaler_payments`
  MODIFY `payment_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `wishlist_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workers`
--
ALTER TABLE `workers`
  MODIFY `worker_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `worker_attendance`
--
ALTER TABLE `worker_attendance`
  MODIFY `attendance_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `worker_salaries`
--
ALTER TABLE `worker_salaries`
  MODIFY `salary_id` int NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `v_trader_balance_summary`
--
DROP TABLE IF EXISTS `v_trader_balance_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cpses_viju0qxcg8`@`localhost` SQL SECURITY DEFINER VIEW `v_trader_balance_summary`  AS SELECT `t`.`trader_id` AS `trader_id`, `t`.`company_name` AS `company_name`, `t`.`contact_person` AS `contact_person`, `t`.`phone` AS `phone`, `t`.`credit_limit` AS `credit_limit`, `t`.`current_balance` AS `current_balance`, count(distinct `tb`.`bill_id`) AS `total_bills`, coalesce(sum((case when (`tb`.`payment_status` = 'unpaid') then `tb`.`total_amount` else 0 end)),0) AS `unpaid_amount`, coalesce(sum((case when (`tb`.`payment_status` = 'partial') then `tb`.`amount_due` else 0 end)),0) AS `partial_due` FROM (`traders` `t` left join `trader_bills` `tb` on((`t`.`trader_id` = `tb`.`trader_id`))) GROUP BY `t`.`trader_id`, `t`.`company_name`, `t`.`contact_person`, `t`.`phone`, `t`.`credit_limit`, `t`.`current_balance` ;

-- --------------------------------------------------------

--
-- Structure for view `v_wholesaler_balance_summary`
--
DROP TABLE IF EXISTS `v_wholesaler_balance_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cpses_viju0qxcg8`@`localhost` SQL SECURITY DEFINER VIEW `v_wholesaler_balance_summary`  AS SELECT `ws`.`wholesaler_id` AS `wholesaler_id`, `ws`.`company_name` AS `company_name`, `ws`.`contact_person` AS `contact_person`, `ws`.`phone` AS `phone`, `ws`.`discount_percentage` AS `discount_percentage`, `ws`.`credit_limit` AS `credit_limit`, `ws`.`current_balance` AS `current_balance`, count(distinct `wo`.`order_id`) AS `total_orders`, coalesce(sum((case when (`wo`.`payment_status` = 'unpaid') then `wo`.`total_amount` else 0 end)),0) AS `unpaid_amount`, coalesce(sum((case when (`wo`.`payment_status` = 'partial') then `wo`.`amount_due` else 0 end)),0) AS `partial_due` FROM (`wholesalers` `ws` left join `wholesaler_orders` `wo` on((`ws`.`wholesaler_id` = `wo`.`wholesaler_id`))) GROUP BY `ws`.`wholesaler_id`, `ws`.`company_name`, `ws`.`contact_person`, `ws`.`phone`, `ws`.`discount_percentage`, `ws`.`credit_limit`, `ws`.`current_balance` ;

-- --------------------------------------------------------

--
-- Structure for view `v_worker_monthly_summary`
--
DROP TABLE IF EXISTS `v_worker_monthly_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cpses_viju0qxcg8`@`localhost` SQL SECURITY DEFINER VIEW `v_worker_monthly_summary`  AS SELECT `w`.`worker_id` AS `worker_id`, `w`.`full_name` AS `full_name`, `w`.`position` AS `position`, `w`.`base_salary` AS `base_salary`, `ws`.`month` AS `month`, `ws`.`year` AS `year`, `ws`.`days_worked` AS `days_worked`, `ws`.`calculated_amount` AS `calculated_amount`, `ws`.`bonus` AS `bonus`, `ws`.`deductions` AS `deductions`, `ws`.`net_salary` AS `net_salary`, `ws`.`payment_status` AS `payment_status` FROM (`workers` `w` left join `worker_salaries` `ws` on((`w`.`worker_id` = `ws`.`worker_id`))) WHERE (`w`.`status` = 'active') ;

--
-- القيود المفروضة على الجداول الملقاة
--

--
-- قيود الجداول `bill_images`
--
ALTER TABLE `bill_images`
  ADD CONSTRAINT `bill_images_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `admin_users` (`admin_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `bill_images_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `admin_users` (`admin_id`) ON DELETE SET NULL;

--
-- قيود الجداول `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- قيود الجداول `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD CONSTRAINT `contact_messages_ibfk_2` FOREIGN KEY (`replied_by`) REFERENCES `admin_users` (`admin_id`) ON DELETE SET NULL;

--
-- قيود الجداول `customer_bills`
--
ALTER TABLE `customer_bills`
  ADD CONSTRAINT `customer_bills_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `customer_bills_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `admins` (`admin_id`);

--
-- قيود الجداول `customer_bill_items`
--
ALTER TABLE `customer_bill_items`
  ADD CONSTRAINT `customer_bill_items_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `customer_bills` (`bill_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_bill_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`);

--
-- قيود الجداول `customer_debts`
--
ALTER TABLE `customer_debts`
  ADD CONSTRAINT `customer_debts_ibfk_2` FOREIGN KEY (`bill_id`) REFERENCES `customer_bills` (`bill_id`),
  ADD CONSTRAINT `customer_debts_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`);

--
-- قيود الجداول `debt_payments`
--
ALTER TABLE `debt_payments`
  ADD CONSTRAINT `debt_payments_ibfk_1` FOREIGN KEY (`debt_id`) REFERENCES `customer_debts` (`debt_id`),
  ADD CONSTRAINT `debt_payments_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `admins` (`admin_id`);

--
-- قيود الجداول `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoice_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL;

--
-- قيود الجداول `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `fk_invoice_item_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_invoice_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL;

--
-- قيود الجداول `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- قيود الجداول `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `fk_order_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- قيود الجداول `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payment_bill` FOREIGN KEY (`bill_id`) REFERENCES `supplier_bills` (`bill_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payment_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL;

--
-- قيود الجداول `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`subcategory_id`) ON DELETE SET NULL;

--
-- قيود الجداول `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- قيود الجداول `product_options`
--
ALTER TABLE `product_options`
  ADD CONSTRAINT `fk_product_option_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_option_type` FOREIGN KEY (`option_type_id`) REFERENCES `product_option_types` (`option_type_id`) ON DELETE CASCADE;

--
-- قيود الجداول `product_option_values`
--
ALTER TABLE `product_option_values`
  ADD CONSTRAINT `fk_option_value_type` FOREIGN KEY (`option_type_id`) REFERENCES `product_option_types` (`option_type_id`) ON DELETE CASCADE;

--
-- قيود الجداول `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- قيود الجداول `subcategories`
--
ALTER TABLE `subcategories`
  ADD CONSTRAINT `fk_subcategory_parent` FOREIGN KEY (`parent_id`) REFERENCES `subcategories` (`subcategory_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE;

--
-- قيود الجداول `supplier_bills`
--
ALTER TABLE `supplier_bills`
  ADD CONSTRAINT `fk_supplier_bill_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE SET NULL;

--
-- قيود الجداول `supplier_bill_items`
--
ALTER TABLE `supplier_bill_items`
  ADD CONSTRAINT `fk_supplier_bill_item_bill` FOREIGN KEY (`bill_id`) REFERENCES `supplier_bills` (`bill_id`) ON DELETE CASCADE;

--
-- قيود الجداول `trader_bills`
--
ALTER TABLE `trader_bills`
  ADD CONSTRAINT `trader_bills_ibfk_1` FOREIGN KEY (`trader_id`) REFERENCES `traders` (`trader_id`),
  ADD CONSTRAINT `trader_bills_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `admins` (`admin_id`);

--
-- قيود الجداول `trader_bill_items`
--
ALTER TABLE `trader_bill_items`
  ADD CONSTRAINT `trader_bill_items_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `trader_bills` (`bill_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `trader_bill_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`);

--
-- قيود الجداول `trader_payments`
--
ALTER TABLE `trader_payments`
  ADD CONSTRAINT `trader_payments_ibfk_1` FOREIGN KEY (`trader_id`) REFERENCES `traders` (`trader_id`),
  ADD CONSTRAINT `trader_payments_ibfk_2` FOREIGN KEY (`bill_id`) REFERENCES `trader_bills` (`bill_id`),
  ADD CONSTRAINT `trader_payments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `admins` (`admin_id`);

--
-- قيود الجداول `wholesaler_orders`
--
ALTER TABLE `wholesaler_orders`
  ADD CONSTRAINT `wholesaler_orders_ibfk_1` FOREIGN KEY (`wholesaler_id`) REFERENCES `wholesalers` (`wholesaler_id`),
  ADD CONSTRAINT `wholesaler_orders_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `admins` (`admin_id`);

--
-- قيود الجداول `wholesaler_order_items`
--
ALTER TABLE `wholesaler_order_items`
  ADD CONSTRAINT `wholesaler_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `wholesaler_orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wholesaler_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`);

--
-- قيود الجداول `wholesaler_payments`
--
ALTER TABLE `wholesaler_payments`
  ADD CONSTRAINT `wholesaler_payments_ibfk_1` FOREIGN KEY (`wholesaler_id`) REFERENCES `wholesalers` (`wholesaler_id`),
  ADD CONSTRAINT `wholesaler_payments_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `wholesaler_orders` (`order_id`),
  ADD CONSTRAINT `wholesaler_payments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `admins` (`admin_id`);

--
-- قيود الجداول `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- قيود الجداول `worker_attendance`
--
ALTER TABLE `worker_attendance`
  ADD CONSTRAINT `worker_attendance_ibfk_1` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`worker_id`),
  ADD CONSTRAINT `worker_attendance_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `admins` (`admin_id`);

--
-- قيود الجداول `worker_salaries`
--
ALTER TABLE `worker_salaries`
  ADD CONSTRAINT `worker_salaries_ibfk_1` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`worker_id`),
  ADD CONSTRAINT `worker_salaries_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `admins` (`admin_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
