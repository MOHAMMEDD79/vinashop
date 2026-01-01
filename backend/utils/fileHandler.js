/**
 * File Handler Utility
 * @module utils/fileHandler
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileHandler {
  /**
   * Check if file exists
   */
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if file exists (sync)
   */
  static existsSync(filePath) {
    return fsSync.existsSync(filePath);
  }

  /**
   * Read file content
   */
  static async read(filePath, encoding = 'utf8') {
    try {
      return await fs.readFile(filePath, encoding);
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Read file as JSON
   */
  static async readJSON(filePath) {
    const content = await this.read(filePath);
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  /**
   * Read file as buffer
   */
  static async readBuffer(filePath) {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Write content to file
   */
  static async write(filePath, content, encoding = 'utf8') {
    try {
      await this.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, encoding);
      return true;
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  /**
   * Write JSON to file
   */
  static async writeJSON(filePath, data, pretty = true) {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    return await this.write(filePath, content);
  }

  /**
   * Append content to file
   */
  static async append(filePath, content, encoding = 'utf8') {
    try {
      await this.ensureDir(path.dirname(filePath));
      await fs.appendFile(filePath, content, encoding);
      return true;
    } catch (error) {
      throw new Error(`Failed to append to file: ${error.message}`);
    }
  }

  /**
   * Delete file
   */
  static async delete(filePath) {
    try {
      if (await this.exists(filePath)) {
        await fs.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteMultiple(filePaths) {
    const results = [];
    for (const filePath of filePaths) {
      try {
        const deleted = await this.delete(filePath);
        results.push({ path: filePath, deleted, error: null });
      } catch (error) {
        results.push({ path: filePath, deleted: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Copy file
   */
  static async copy(source, destination) {
    try {
      await this.ensureDir(path.dirname(destination));
      await fs.copyFile(source, destination);
      return true;
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Move file
   */
  static async move(source, destination) {
    try {
      await this.ensureDir(path.dirname(destination));
      await fs.rename(source, destination);
      return true;
    } catch (error) {
      // If rename fails (cross-device), use copy + delete
      await this.copy(source, destination);
      await this.delete(source);
      return true;
    }
  }

  /**
   * Rename file
   */
  static async rename(oldPath, newPath) {
    return await this.move(oldPath, newPath);
  }

  /**
   * Get file stats
   */
  static async getStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        sizeFormatted: this.formatSize(stats.size),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isSymbolicLink: stats.isSymbolicLink(),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        mode: stats.mode,
      };
    } catch (error) {
      throw new Error(`Failed to get file stats: ${error.message}`);
    }
  }

  /**
   * Get file size
   */
  static async getSize(filePath) {
    const stats = await this.getStats(filePath);
    return stats.size;
  }

  /**
   * Get file extension
   */
  static getExtension(filePath) {
    return path.extname(filePath).toLowerCase().slice(1);
  }

  /**
   * Get file name without extension
   */
  static getBaseName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Get file name with extension
   */
  static getFileName(filePath) {
    return path.basename(filePath);
  }

  /**
   * Get directory name
   */
  static getDirName(filePath) {
    return path.dirname(filePath);
  }

  /**
   * Get MIME type
   */
  static getMimeType(filePath) {
    const ext = this.getExtension(filePath);
    const mimeTypes = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'txt': 'text/plain',
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv',
      'md': 'text/markdown',
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      '7z': 'application/x-7z-compressed',
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',
      // Video
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
      // Fonts
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'eot': 'application/vnd.ms-fontobject',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check if file is image
   */
  static isImage(filePath) {
    const ext = this.getExtension(filePath);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'].includes(ext);
  }

  /**
   * Check if file is video
   */
  static isVideo(filePath) {
    const ext = this.getExtension(filePath);
    return ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'flv', 'm4v'].includes(ext);
  }

  /**
   * Check if file is audio
   */
  static isAudio(filePath) {
    const ext = this.getExtension(filePath);
    return ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'].includes(ext);
  }

  /**
   * Check if file is document
   */
  static isDocument(filePath) {
    const ext = this.getExtension(filePath);
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'].includes(ext);
  }

  /**
   * Check if file is archive
   */
  static isArchive(filePath) {
    const ext = this.getExtension(filePath);
    return ['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz'].includes(ext);
  }

  // ==================== Directory Operations ====================

  /**
   * Ensure directory exists
   */
  static async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to create directory: ${error.message}`);
      }
      return true;
    }
  }

  /**
   * Create directory
   */
  static async createDir(dirPath) {
    return await this.ensureDir(dirPath);
  }

  /**
   * Delete directory
   */
  static async deleteDir(dirPath, recursive = true) {
    try {
      if (await this.exists(dirPath)) {
        await fs.rm(dirPath, { recursive, force: true });
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(`Failed to delete directory: ${error.message}`);
    }
  }

  /**
   * Read directory contents
   */
  static async readDir(dirPath, options = {}) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      let items = entries.map(entry => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isFile: entry.isFile(),
        isDirectory: entry.isDirectory(),
        isSymbolicLink: entry.isSymbolicLink(),
      }));

      // Filter by type
      if (options.filesOnly) {
        items = items.filter(item => item.isFile);
      } else if (options.dirsOnly) {
        items = items.filter(item => item.isDirectory);
      }

      // Filter by extension
      if (options.extensions && options.extensions.length > 0) {
        items = items.filter(item => {
          if (!item.isFile) return true;
          const ext = this.getExtension(item.name);
          return options.extensions.includes(ext);
        });
      }

      // Filter hidden files
      if (options.excludeHidden) {
        items = items.filter(item => !item.name.startsWith('.'));
      }

      return items;
    } catch (error) {
      throw new Error(`Failed to read directory: ${error.message}`);
    }
  }

  /**
   * Read directory recursively
   */
  static async readDirRecursive(dirPath, options = {}) {
    const results = [];
    
    const traverse = async (currentPath) => {
      const items = await this.readDir(currentPath, options);
      
      for (const item of items) {
        results.push(item);
        if (item.isDirectory && !options.filesOnly) {
          await traverse(item.path);
        }
      }
    };

    await traverse(dirPath);
    return results;
  }

  /**
   * Get directory size
   */
  static async getDirSize(dirPath) {
    let totalSize = 0;
    
    const traverse = async (currentPath) => {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);
        if (item.isFile()) {
          const stats = await fs.stat(itemPath);
          totalSize += stats.size;
        } else if (item.isDirectory()) {
          await traverse(itemPath);
        }
      }
    };

    await traverse(dirPath);
    return totalSize;
  }

  /**
   * Empty directory (delete contents but keep directory)
   */
  static async emptyDir(dirPath) {
    const items = await this.readDir(dirPath);
    
    for (const item of items) {
      if (item.isDirectory) {
        await this.deleteDir(item.path);
      } else {
        await this.delete(item.path);
      }
    }
    
    return true;
  }

  /**
   * Copy directory
   */
  static async copyDir(source, destination) {
    await this.ensureDir(destination);
    const items = await this.readDir(source);
    
    for (const item of items) {
      const destPath = path.join(destination, item.name);
      if (item.isDirectory) {
        await this.copyDir(item.path, destPath);
      } else {
        await this.copy(item.path, destPath);
      }
    }
    
    return true;
  }

  // ==================== File Generation ====================

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName, prefix = '') {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `${prefix}${prefix ? '_' : ''}${timestamp}_${hash}${ext}`;
  }

  /**
   * Generate safe filename (remove special characters)
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  /**
   * Get unique path (add number if exists)
   */
  static async getUniquePath(filePath) {
    if (!(await this.exists(filePath))) {
      return filePath;
    }

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);

    let counter = 1;
    let newPath = filePath;

    while (await this.exists(newPath)) {
      newPath = path.join(dir, `${base}_${counter}${ext}`);
      counter++;
    }

    return newPath;
  }

  // ==================== File Hash ====================

  /**
   * Get file hash (MD5)
   */
  static async getMD5(filePath) {
    const buffer = await this.readBuffer(filePath);
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Get file hash (SHA256)
   */
  static async getSHA256(filePath) {
    const buffer = await this.readBuffer(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Compare files by hash
   */
  static async compareFiles(file1, file2) {
    const hash1 = await this.getMD5(file1);
    const hash2 = await this.getMD5(file2);
    return hash1 === hash2;
  }

  // ==================== Utilities ====================

  /**
   * Format file size
   */
  static formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Parse file size string to bytes
   */
  static parseSize(sizeStr) {
    const units = {
      'b': 1,
      'bytes': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024,
      'tb': 1024 * 1024 * 1024 * 1024,
    };

    const match = sizeStr.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    return Math.floor(value * (units[unit] || 1));
  }

  /**
   * Join paths
   */
  static join(...paths) {
    return path.join(...paths);
  }

  /**
   * Resolve path
   */
  static resolve(...paths) {
    return path.resolve(...paths);
  }

  /**
   * Normalize path
   */
  static normalize(filePath) {
    return path.normalize(filePath);
  }

  /**
   * Check if path is absolute
   */
  static isAbsolute(filePath) {
    return path.isAbsolute(filePath);
  }

  /**
   * Get relative path
   */
  static relative(from, to) {
    return path.relative(from, to);
  }

  /**
   * Create temp file
   */
  static async createTempFile(content = '', ext = '.tmp') {
    const tempDir = require('os').tmpdir();
    const filename = `temp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const filePath = path.join(tempDir, filename);
    
    await this.write(filePath, content);
    return filePath;
  }

  /**
   * Create read stream
   */
  static createReadStream(filePath, options = {}) {
    return fsSync.createReadStream(filePath, options);
  }

  /**
   * Create write stream
   */
  static createWriteStream(filePath, options = {}) {
    return fsSync.createWriteStream(filePath, options);
  }

  /**
   * Watch file for changes
   */
  static watch(filePath, callback) {
    return fsSync.watch(filePath, callback);
  }

  /**
   * Watch directory for changes
   */
  static watchDir(dirPath, callback, options = {}) {
    return fsSync.watch(dirPath, { recursive: options.recursive || false }, callback);
  }
}

module.exports = FileHandler;