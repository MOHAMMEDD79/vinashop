/**
 * Centralized image/media URL utility
 * Handles converting relative paths from database to full URLs
 *
 * Uses environment variables for easy configuration:
 * - Production: VITE_UPLOADS_URL=https://api.vinashop.ps
 * - Development: VITE_UPLOADS_URL=http://localhost:5000
 */

// Get uploads base URL from environment variable
// Falls back to VinaShop backend (port 5000) where images are stored
const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_URL || 'https://api.vinashop.ps';

/**
 * Get the full URL for an image/media path
 * @param {string} path - The image path from database (e.g., "uploads/products/image.jpg")
 * @returns {string|null} - Full URL or null if no path
 *
 * @example
 * getImageUrl('uploads/products/image.jpg')
 * // Returns: 'http://localhost:5000/uploads/products/image.jpg' (dev)
 * // Returns: 'https://api.yourdomain.com/uploads/products/image.jpg' (prod)
 */
export const getImageUrl = (path) => {
  if (!path) return null;

  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a data URL (base64), return as is
  if (path.startsWith('data:')) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Prepend uploads base URL
  return `${UPLOADS_BASE_URL}/${cleanPath}`;
};

/**
 * Get the full URL for a media file (images or videos)
 * Same as getImageUrl but with a more descriptive name for media files
 */
export const getMediaUrl = getImageUrl;

/**
 * Get the uploads base URL (useful for debugging)
 */
export const getUploadsBaseUrl = () => UPLOADS_BASE_URL;

export default getImageUrl;
