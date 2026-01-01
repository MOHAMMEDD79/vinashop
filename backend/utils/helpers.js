/**
 * Helpers Utility
 * @module utils/helpers
 */

class Helpers {
  // ==================== String Helpers ====================

  /**
   * Capitalize first letter
   */
  static capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Capitalize each word
   */
  static capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Convert to camelCase
   */
  static toCamelCase(str) {
    if (!str) return '';
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^./, char => char.toLowerCase());
  }

  /**
   * Convert to snake_case
   */
  static toSnakeCase(str) {
    if (!str) return '';
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-\s]+/g, '_')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Convert to kebab-case
   */
  static toKebabCase(str) {
    if (!str) return '';
    return str
      .replace(/([A-Z])/g, '-$1')
      .replace(/[_\s]+/g, '-')
      .toLowerCase()
      .replace(/^-/, '');
  }

  /**
   * Convert to PascalCase
   */
  static toPascalCase(str) {
    if (!str) return '';
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^./, char => char.toUpperCase());
  }

  /**
   * Truncate string
   */
  static truncate(str, length = 100, suffix = '...') {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length).trim() + suffix;
  }

  /**
   * Truncate words
   */
  static truncateWords(str, wordCount = 10, suffix = '...') {
    if (!str) return '';
    const words = str.split(/\s+/);
    if (words.length <= wordCount) return str;
    return words.slice(0, wordCount).join(' ') + suffix;
  }

  /**
   * Slugify string
   */
  static slugify(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Strip HTML tags
   */
  static stripHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  }

  /**
   * Escape HTML
   */
  static escapeHtml(str) {
    if (!str) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * Unescape HTML
   */
  static unescapeHtml(str) {
    if (!str) return '';
    const map = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, entity => map[entity]);
  }

  /**
   * Generate random string
   */
  static randomString(length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random alphanumeric
   */
  static randomAlphanumeric(length = 10) {
    return this.randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }

  /**
   * Generate random hex
   */
  static randomHex(length = 16) {
    return this.randomString(length, '0123456789abcdef');
  }

  /**
   * Pad string
   */
  static pad(str, length, char = '0', position = 'start') {
    str = String(str);
    if (position === 'start') {
      return str.padStart(length, char);
    }
    return str.padEnd(length, char);
  }

  /**
   * Remove extra whitespace
   */
  static normalizeWhitespace(str) {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * Count words
   */
  static wordCount(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
  }

  /**
   * Check if string contains
   */
  static contains(str, search, caseSensitive = false) {
    if (!str || !search) return false;
    if (!caseSensitive) {
      return str.toLowerCase().includes(search.toLowerCase());
    }
    return str.includes(search);
  }

  // ==================== Number Helpers ====================

  /**
   * Format number with commas
   */
  static formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Format currency
   */
  static formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format percentage
   */
  static formatPercent(value, decimals = 0) {
    if (value === null || value === undefined) return '0%';
    return `${Number(value).toFixed(decimals)}%`;
  }

  /**
   * Round to decimal places
   */
  static round(num, decimals = 2) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Clamp number between min and max
   */
  static clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Check if number is between
   */
  static between(num, min, max, inclusive = true) {
    if (inclusive) {
      return num >= min && num <= max;
    }
    return num > min && num < max;
  }

  /**
   * Generate random number
   */
  static randomNumber(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random float
   */
  static randomFloat(min = 0, max = 1, decimals = 2) {
    return this.round(Math.random() * (max - min) + min, decimals);
  }

  /**
   * Calculate percentage
   */
  static percentage(value, total) {
    if (!total) return 0;
    return this.round((value / total) * 100, 2);
  }

  /**
   * Calculate percentage change
   */
  static percentageChange(oldValue, newValue) {
    if (!oldValue) return newValue > 0 ? 100 : 0;
    return this.round(((newValue - oldValue) / oldValue) * 100, 2);
  }

  /**
   * Sum array of numbers
   */
  static sum(arr) {
    return arr.reduce((acc, val) => acc + (Number(val) || 0), 0);
  }

  /**
   * Average of array
   */
  static average(arr) {
    if (!arr.length) return 0;
    return this.sum(arr) / arr.length;
  }

  /**
   * Ordinal suffix (1st, 2nd, 3rd, etc.)
   */
  static ordinal(num) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  // ==================== Array Helpers ====================

  /**
   * Chunk array
   */
  static chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Flatten array
   */
  static flatten(arr, depth = Infinity) {
    return arr.flat(depth);
  }

  /**
   * Unique values
   */
  static unique(arr) {
    return [...new Set(arr)];
  }

  /**
   * Unique by key
   */
  static uniqueBy(arr, key) {
    const seen = new Set();
    return arr.filter(item => {
      const value = typeof key === 'function' ? key(item) : item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  /**
   * Group by key
   */
  static groupBy(arr, key) {
    return arr.reduce((groups, item) => {
      const value = typeof key === 'function' ? key(item) : item[key];
      (groups[value] = groups[value] || []).push(item);
      return groups;
    }, {});
  }

  /**
   * Sort by key
   */
  static sortBy(arr, key, order = 'asc') {
    return [...arr].sort((a, b) => {
      const aVal = typeof key === 'function' ? key(a) : a[key];
      const bVal = typeof key === 'function' ? key(b) : b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Shuffle array
   */
  static shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Pick random item from array
   */
  static sample(arr, count = 1) {
    if (count === 1) {
      return arr[Math.floor(Math.random() * arr.length)];
    }
    return this.shuffle(arr).slice(0, count);
  }

  /**
   * First item
   */
  static first(arr) {
    return arr[0];
  }

  /**
   * Last item
   */
  static last(arr) {
    return arr[arr.length - 1];
  }

  /**
   * Compact (remove falsy values)
   */
  static compact(arr) {
    return arr.filter(Boolean);
  }

  /**
   * Intersection of arrays
   */
  static intersection(...arrays) {
    return arrays.reduce((a, b) => a.filter(c => b.includes(c)));
  }

  /**
   * Difference of arrays
   */
  static difference(arr1, arr2) {
    return arr1.filter(x => !arr2.includes(x));
  }

  /**
   * Pluck values by key
   */
  static pluck(arr, key) {
    return arr.map(item => item[key]);
  }

  /**
   * Key by
   */
  static keyBy(arr, key) {
    return arr.reduce((obj, item) => {
      const value = typeof key === 'function' ? key(item) : item[key];
      obj[value] = item;
      return obj;
    }, {});
  }

  // ==================== Object Helpers ====================

  /**
   * Deep clone
   */
  static clone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.clone(item));
    
    if (obj instanceof Object) {
      const copy = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = this.clone(obj[key]);
        }
      }
      return copy;
    }
    
    return obj;
  }

  /**
   * Deep merge
   */
  static merge(target, ...sources) {
    if (!sources.length) return target;
    
    const source = sources.shift();
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.merge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return this.merge(target, ...sources);
  }

  /**
   * Pick keys from object
   */
  static pick(obj, keys) {
    return keys.reduce((result, key) => {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  }

  /**
   * Omit keys from object
   */
  static omit(obj, keys) {
    return Object.keys(obj).reduce((result, key) => {
      if (!keys.includes(key)) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  }

  /**
   * Get nested value
   */
  static get(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  }

  /**
   * Set nested value
   */
  static set(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
  }

  /**
   * Check if object has key
   */
  static has(obj, path) {
    return this.get(obj, path) !== undefined;
  }

  /**
   * Is plain object
   */
  static isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Is empty
   */
  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (this.isObject(value)) return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Object to query string
   */
  static toQueryString(obj) {
    return Object.keys(obj)
      .filter(key => obj[key] !== undefined && obj[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
      .join('&');
  }

  /**
   * Query string to object
   */
  static fromQueryString(str) {
    if (!str) return {};
    return str
      .replace(/^\?/, '')
      .split('&')
      .reduce((obj, pair) => {
        const [key, value] = pair.split('=').map(decodeURIComponent);
        obj[key] = value;
        return obj;
      }, {});
  }

  // ==================== Validation Helpers ====================

  /**
   * Is valid email
   */
  static isEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Is valid phone
   */
  static isPhone(phone) {
    const regex = /^[\d\s\-+()]{7,20}$/;
    return regex.test(phone);
  }

  /**
   * Is valid URL
   */
  static isUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Is valid JSON
   */
  static isJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Is numeric
   */
  static isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Is integer
   */
  static isInteger(value) {
    return Number.isInteger(Number(value));
  }

  /**
   * Is UUID
   */
  static isUuid(str) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(str);
  }

  /**
   * Is hex color
   */
  static isHexColor(str) {
    const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return regex.test(str);
  }

  // ==================== Async Helpers ====================

  /**
   * Sleep/delay
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function
   */
  static async retry(fn, retries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Debounce
   */
  static debounce(fn, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * Throttle
   */
  static throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Memoize
   */
  static memoize(fn) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }

  // ==================== Misc Helpers ====================

  /**
   * Generate UUID v4
   */
  static uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Hash string (simple)
   */
  static hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Safe JSON parse
   */
  static parseJson(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Safe JSON stringify
   */
  static stringify(obj, pretty = false) {
    try {
      return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    } catch {
      return '';
    }
  }

  /**
   * Get type
   */
  static getType(value) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  }

  /**
   * Compare values (deep equality)
   */
  static equals(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.equals(item, b[index]));
    }
    
    if (this.isObject(a) && this.isObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.equals(a[key], b[key]));
    }
    
    return false;
  }

  /**
   * Mask sensitive data
   */
  static mask(str, visibleStart = 4, visibleEnd = 4, maskChar = '*') {
    if (!str || str.length <= visibleStart + visibleEnd) return str;
    
    const start = str.slice(0, visibleStart);
    const end = str.slice(-visibleEnd);
    const masked = maskChar.repeat(str.length - visibleStart - visibleEnd);
    
    return start + masked + end;
  }

  /**
   * Mask email
   */
  static maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local;
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone
   */
  static maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return this.mask(phone.replace(/\D/g, ''), 3, 2);
  }
}

module.exports = Helpers;