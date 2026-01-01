-- Migration: Drop external_url from banners table
-- Date: December 22, 2025
-- Purpose: Banners now use BLOB storage only (media_data column)

-- First, copy any external_url data to media_data if needed
-- (Only if there are banners with external_url but no media_data)
-- This step is optional and depends on your data

-- Drop the external_url column
ALTER TABLE `banners` DROP COLUMN IF EXISTS `external_url`;

-- Verify the change
DESCRIBE `banners`;
