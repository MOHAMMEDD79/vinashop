-- Migration: Fix user_id columns to be nullable
-- Date: 2026-01-01
-- Description: Make user_id nullable in customer_bills, customer_debts, and debt_payments
--              since users table does not exist in this database

-- Fix customer_bills table - make user_id nullable
ALTER TABLE `customer_bills` MODIFY COLUMN `user_id` int NULL;

-- Fix customer_debts table - make user_id nullable
ALTER TABLE `customer_debts` MODIFY COLUMN `user_id` int NULL;

-- Fix debt_payments table - make user_id nullable
ALTER TABLE `debt_payments` MODIFY COLUMN `user_id` int NULL;

-- Also make recorded_by nullable in debt_payments (references admin, not user)
ALTER TABLE `debt_payments` MODIFY COLUMN `recorded_by` int NULL;
