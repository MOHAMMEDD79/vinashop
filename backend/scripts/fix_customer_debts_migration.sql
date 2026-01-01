-- =====================================================
-- MIGRATION: Fix customer_debts table
-- Run this if you already have the database and need to add the created_by column
-- =====================================================

-- Add created_by column to customer_debts table
ALTER TABLE `customer_debts`
ADD COLUMN `created_by` INT(11) DEFAULT NULL AFTER `notes`;

-- Add index for created_by
ALTER TABLE `customer_debts`
ADD KEY `created_by` (`created_by`);

-- Add foreign key constraint (references admin_users table)
ALTER TABLE `customer_debts`
ADD CONSTRAINT `customer_debts_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`admin_id`);

-- Update debt_payments foreign key to reference admin_users instead of admins
-- First drop the old constraint if it exists
ALTER TABLE `debt_payments` DROP FOREIGN KEY IF EXISTS `debt_payments_ibfk_3`;

-- Add the new constraint referencing admin_users
ALTER TABLE `debt_payments`
ADD CONSTRAINT `debt_payments_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `admin_users` (`admin_id`);

-- Success message
SELECT 'Migration completed successfully' AS status;
