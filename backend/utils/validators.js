/**
 * Validators Utility
 * @module utils/validators
 */

class Validators {
  // ==================== String Validators ====================

  /**
   * Check if value is empty
   */
  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Check if value is not empty
   */
  static isNotEmpty(value) {
    return !this.isEmpty(value);
  }

  /**
   * Check if value is string
   */
  static isString(value) {
    return typeof value === 'string';
  }

  /**
   * Check string length
   */
  static isLength(value, options = {}) {
    if (!this.isString(value)) return false;
    
    const { min = 0, max = Infinity } = options;
    const len = value.length;
    
    return len >= min && len <= max;
  }

  /**
   * Check min length
   */
  static minLength(value, min) {
    return this.isString(value) && value.length >= min;
  }

  /**
   * Check max length
   */
  static maxLength(value, max) {
    return this.isString(value) && value.length <= max;
  }

  /**
   * Check exact length
   */
  static exactLength(value, length) {
    return this.isString(value) && value.length === length;
  }

  /**
   * Check if alphanumeric
   */
  static isAlphanumeric(value) {
    return this.isString(value) && /^[a-zA-Z0-9]+$/.test(value);
  }

  /**
   * Check if alpha only
   */
  static isAlpha(value) {
    return this.isString(value) && /^[a-zA-Z]+$/.test(value);
  }

  /**
   * Check if contains only specified characters
   */
  static matches(value, pattern) {
    if (!this.isString(value)) return false;
    return pattern instanceof RegExp ? pattern.test(value) : new RegExp(pattern).test(value);
  }

  /**
   * Check if starts with
   */
  static startsWith(value, prefix) {
    return this.isString(value) && value.startsWith(prefix);
  }

  /**
   * Check if ends with
   */
  static endsWith(value, suffix) {
    return this.isString(value) && value.endsWith(suffix);
  }

  /**
   * Check if contains substring
   */
  static contains(value, substring) {
    return this.isString(value) && value.includes(substring);
  }

  // ==================== Number Validators ====================

  /**
   * Check if numeric
   */
  static isNumeric(value) {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') return !isNaN(parseFloat(value)) && isFinite(value);
    return false;
  }

  /**
   * Check if integer
   */
  static isInteger(value) {
    return Number.isInteger(Number(value));
  }

  /**
   * Check if positive integer
   */
  static isPositiveInteger(value) {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
  }

  /**
   * Check if non-negative integer
   */
  static isNonNegativeInteger(value) {
    const num = Number(value);
    return Number.isInteger(num) && num >= 0;
  }

  /**
   * Check if float
   */
  static isFloat(value) {
    return this.isNumeric(value) && !Number.isInteger(Number(value));
  }

  /**
   * Check if positive
   */
  static isPositive(value) {
    return this.isNumeric(value) && Number(value) > 0;
  }

  /**
   * Check if negative
   */
  static isNegative(value) {
    return this.isNumeric(value) && Number(value) < 0;
  }

  /**
   * Check number range
   */
  static inRange(value, min, max) {
    if (!this.isNumeric(value)) return false;
    const num = Number(value);
    return num >= min && num <= max;
  }

  /**
   * Check if greater than
   */
  static isGreaterThan(value, min) {
    return this.isNumeric(value) && Number(value) > min;
  }

  /**
   * Check if less than
   */
  static isLessThan(value, max) {
    return this.isNumeric(value) && Number(value) < max;
  }

  /**
   * Check if divisible by
   */
  static isDivisibleBy(value, divisor) {
    return this.isNumeric(value) && Number(value) % divisor === 0;
  }

  // ==================== Email & Contact Validators ====================

  /**
   * Validate email
   */
  static isEmail(value) {
    if (!this.isString(value)) return false;
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return regex.test(value) && value.length <= 254;
  }

  /**
   * Validate phone number
   */
  static isPhone(value, options = {}) {
    if (!this.isString(value)) return false;
    
    const { strict = false, country = null } = options;
    
    // Remove common formatting characters
    const cleaned = value.replace(/[\s\-().]/g, '');
    
    if (strict) {
      // E.164 format
      return /^\+[1-9]\d{1,14}$/.test(cleaned);
    }
    
    // General phone pattern
    return /^[\d+]{7,20}$/.test(cleaned);
  }

  /**
   * Validate mobile phone
   */
  static isMobilePhone(value) {
    return this.isPhone(value);
  }

  // ==================== URL & Network Validators ====================

  /**
   * Validate URL
   */
  static isURL(value, options = {}) {
    if (!this.isString(value)) return false;
    
    const {
      protocols = ['http', 'https'],
      requireProtocol = true,
      requireHost = true,
    } = options;
    
    try {
      const url = new URL(value);
      
      if (requireProtocol && !protocols.includes(url.protocol.replace(':', ''))) {
        return false;
      }
      
      if (requireHost && !url.host) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate IP address
   */
  static isIP(value, version = null) {
    if (!this.isString(value)) return false;
    
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (version === 4) {
      return ipv4Regex.test(value) && value.split('.').every(n => parseInt(n) <= 255);
    }
    
    if (version === 6) {
      return ipv6Regex.test(value);
    }
    
    return (ipv4Regex.test(value) && value.split('.').every(n => parseInt(n) <= 255)) || ipv6Regex.test(value);
  }

  /**
   * Validate MAC address
   */
  static isMACAddress(value) {
    if (!this.isString(value)) return false;
    return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value);
  }

  /**
   * Validate domain
   */
  static isDomain(value) {
    if (!this.isString(value)) return false;
    return /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(value);
  }

  // ==================== Date & Time Validators ====================

  /**
   * Validate date
   */
  static isDate(value) {
    if (value instanceof Date) return !isNaN(value.getTime());
    if (!this.isString(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * Validate ISO date
   */
  static isISODate(value) {
    if (!this.isString(value)) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && this.isDate(value);
  }

  /**
   * Validate ISO datetime
   */
  static isISODateTime(value) {
    if (!this.isString(value)) return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/.test(value);
  }

  /**
   * Check if date is before
   */
  static isBefore(value, date) {
    const d1 = new Date(value);
    const d2 = new Date(date);
    return !isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d1 < d2;
  }

  /**
   * Check if date is after
   */
  static isAfter(value, date) {
    const d1 = new Date(value);
    const d2 = new Date(date);
    return !isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d1 > d2;
  }

  /**
   * Check if date is in past
   */
  static isPast(value) {
    return this.isBefore(value, new Date());
  }

  /**
   * Check if date is in future
   */
  static isFuture(value) {
    return this.isAfter(value, new Date());
  }

  /**
   * Validate time (HH:MM or HH:MM:SS)
   */
  static isTime(value) {
    if (!this.isString(value)) return false;
    return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(value);
  }

  // ==================== ID & Code Validators ====================

  /**
   * Validate UUID
   */
  static isUUID(value, version = null) {
    if (!this.isString(value)) return false;
    
    const patterns = {
      1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      2: /^[0-9a-f]{8}-[0-9a-f]{4}-2[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      all: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    };
    
    const pattern = version ? patterns[version] : patterns.all;
    return pattern ? pattern.test(value) : false;
  }

  /**
   * Validate MongoDB ObjectId
   */
  static isMongoId(value) {
    if (!this.isString(value)) return false;
    return /^[0-9a-fA-F]{24}$/.test(value);
  }

  /**
   * Validate slug
   */
  static isSlug(value) {
    if (!this.isString(value)) return false;
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  }

  /**
   * Validate hex string
   */
  static isHex(value) {
    if (!this.isString(value)) return false;
    return /^[0-9a-fA-F]+$/.test(value);
  }

  /**
   * Validate hex color
   */
  static isHexColor(value) {
    if (!this.isString(value)) return false;
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
  }

  /**
   * Validate RGB color
   */
  static isRGBColor(value) {
    if (!this.isString(value)) return false;
    return /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.test(value);
  }

  // ==================== Security Validators ====================

  /**
   * Validate password strength
   */
  static isStrongPassword(value, options = {}) {
    if (!this.isString(value)) return false;
    
    const {
      minLength = 8,
      minLowercase = 1,
      minUppercase = 1,
      minNumbers = 1,
      minSymbols = 1,
    } = options;
    
    if (value.length < minLength) return false;
    
    const lowercase = (value.match(/[a-z]/g) || []).length;
    const uppercase = (value.match(/[A-Z]/g) || []).length;
    const numbers = (value.match(/[0-9]/g) || []).length;
    const symbols = (value.match(/[^a-zA-Z0-9]/g) || []).length;
    
    return lowercase >= minLowercase &&
           uppercase >= minUppercase &&
           numbers >= minNumbers &&
           symbols >= minSymbols;
  }

  /**
   * Get password strength score
   */
  static getPasswordStrength(value) {
    if (!this.isString(value)) return { score: 0, label: 'invalid' };
    
    let score = 0;
    
    // Length
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (value.length >= 16) score += 1;
    
    // Character types
    if (/[a-z]/.test(value)) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^a-zA-Z0-9]/.test(value)) score += 1;
    
    // Variety
    if (/(.)\1{2,}/.test(value)) score -= 1; // Repeated characters
    
    const labels = ['very weak', 'weak', 'fair', 'good', 'strong', 'very strong'];
    const normalizedScore = Math.max(0, Math.min(5, Math.floor(score * 5 / 7)));
    
    return {
      score: normalizedScore,
      label: labels[normalizedScore],
    };
  }

  /**
   * Validate JWT token format
   */
  static isJWT(value) {
    if (!this.isString(value)) return false;
    const parts = value.split('.');
    if (parts.length !== 3) return false;
    
    try {
      parts.forEach(part => {
        Buffer.from(part, 'base64');
      });
      return true;
    } catch {
      return false;
    }
  }

  // ==================== JSON & Data Validators ====================

  /**
   * Validate JSON string
   */
  static isJSON(value) {
    if (!this.isString(value)) return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate Base64
   */
  static isBase64(value) {
    if (!this.isString(value)) return false;
    return /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length % 4 === 0;
  }

  /**
   * Check if array
   */
  static isArray(value) {
    return Array.isArray(value);
  }

  /**
   * Check if array of type
   */
  static isArrayOf(value, validator) {
    if (!Array.isArray(value)) return false;
    return value.every(item => validator(item));
  }

  /**
   * Check array length
   */
  static isArrayLength(value, options = {}) {
    if (!Array.isArray(value)) return false;
    const { min = 0, max = Infinity } = options;
    return value.length >= min && value.length <= max;
  }

  /**
   * Check if object
   */
  static isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Check if value is in enum
   */
  static isEnum(value, enumValues) {
    return enumValues.includes(value);
  }

  /**
   * Check if value is in list (alias for isEnum)
   */
  static isIn(value, list) {
    return this.isEnum(value, list);
  }

  /**
   * Check if value is not in list
   */
  static isNotIn(value, list) {
    return !list.includes(value);
  }

  // ==================== File Validators ====================

  /**
   * Validate file extension
   */
  static isFileExtension(value, allowedExtensions) {
    if (!this.isString(value)) return false;
    const ext = value.toLowerCase().replace(/^\./, '');
    return allowedExtensions.map(e => e.toLowerCase().replace(/^\./, '')).includes(ext);
  }

  /**
   * Validate MIME type
   */
  static isMimeType(value, allowedTypes) {
    if (!this.isString(value)) return false;
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -1);
        return value.startsWith(prefix);
      }
      return value === type;
    });
  }

  /**
   * Validate image MIME type
   */
  static isImageMimeType(value) {
    return this.isMimeType(value, ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);
  }

  // ==================== Custom Validators ====================

  /**
   * Validate username
   */
  static isUsername(value, options = {}) {
    if (!this.isString(value)) return false;
    
    const { minLength = 3, maxLength = 30 } = options;
    
    if (value.length < minLength || value.length > maxLength) return false;
    
    // Alphanumeric, underscore, hyphen, must start with letter
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value);
  }

  /**
   * Validate SKU
   */
  static isSKU(value) {
    if (!this.isString(value)) return false;
    return /^[A-Z0-9][A-Z0-9_-]{2,49}$/i.test(value);
  }

  /**
   * Validate credit card (Luhn algorithm)
   */
  static isCreditCard(value) {
    if (!this.isString(value)) return false;
    
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Validate postal code
   */
  static isPostalCode(value, country = 'US') {
    if (!this.isString(value)) return false;
    
    const patterns = {
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
      CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
      DE: /^\d{5}$/,
      FR: /^\d{5}$/,
      AU: /^\d{4}$/,
      IL: /^\d{7}$/,
    };
    
    const pattern = patterns[country.toUpperCase()];
    return pattern ? pattern.test(value) : true;
  }

  // ==================== Sanitizers ====================

  /**
   * Sanitize string (trim and normalize)
   */
  static sanitize(value) {
    if (!this.isString(value)) return value;
    return value.trim().replace(/\s+/g, ' ');
  }

  /**
   * Escape HTML
   */
  static escapeHtml(value) {
    if (!this.isString(value)) return value;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return value.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * Strip HTML tags
   */
  static stripHtml(value) {
    if (!this.isString(value)) return value;
    return value.replace(/<[^>]*>/g, '');
  }

  /**
   * Normalize email
   */
  static normalizeEmail(value) {
    if (!this.isString(value)) return value;
    return value.toLowerCase().trim();
  }

  /**
   * Normalize phone
   */
  static normalizePhone(value) {
    if (!this.isString(value)) return value;
    return value.replace(/\D/g, '');
  }
}

module.exports = Validators;