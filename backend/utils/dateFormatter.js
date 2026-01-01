/**
 * Date Formatter Utility
 * @module utils/dateFormatter
 */

class DateFormatter {
  /**
   * Format date to string
   * @param {Date|string|number} date - Date to format
   * @param {string} format - Format string
   * @param {string} locale - Locale (default: 'en-US')
   * @returns {string} Formatted date string
   */
  static format(date, format = 'YYYY-MM-DD', locale = 'en-US') {
    const d = this.toDate(date);
    if (!d) return '';

    const tokens = {
      'YYYY': d.getFullYear(),
      'YY': String(d.getFullYear()).slice(-2),
      'MM': String(d.getMonth() + 1).padStart(2, '0'),
      'M': d.getMonth() + 1,
      'DD': String(d.getDate()).padStart(2, '0'),
      'D': d.getDate(),
      'HH': String(d.getHours()).padStart(2, '0'),
      'H': d.getHours(),
      'hh': String(d.getHours() % 12 || 12).padStart(2, '0'),
      'h': d.getHours() % 12 || 12,
      'mm': String(d.getMinutes()).padStart(2, '0'),
      'm': d.getMinutes(),
      'ss': String(d.getSeconds()).padStart(2, '0'),
      's': d.getSeconds(),
      'SSS': String(d.getMilliseconds()).padStart(3, '0'),
      'A': d.getHours() >= 12 ? 'PM' : 'AM',
      'a': d.getHours() >= 12 ? 'pm' : 'am',
      'dddd': d.toLocaleDateString(locale, { weekday: 'long' }),
      'ddd': d.toLocaleDateString(locale, { weekday: 'short' }),
      'dd': d.toLocaleDateString(locale, { weekday: 'narrow' }),
      'MMMM': d.toLocaleDateString(locale, { month: 'long' }),
      'MMM': d.toLocaleDateString(locale, { month: 'short' }),
    };

    let result = format;
    // Sort tokens by length (longest first) to avoid partial replacements
    const sortedTokens = Object.keys(tokens).sort((a, b) => b.length - a.length);
    
    for (const token of sortedTokens) {
      result = result.replace(new RegExp(token, 'g'), tokens[token]);
    }

    return result;
  }

  /**
   * Convert various inputs to Date object
   * @param {Date|string|number} input - Input to convert
   * @returns {Date|null} Date object or null if invalid
   */
  static toDate(input) {
    if (!input) return null;
    
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input;
    }
    
    if (typeof input === 'number') {
      return new Date(input);
    }
    
    if (typeof input === 'string') {
      // Handle ISO format
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      
      // Handle common formats
      const formats = [
        /^(\d{4})-(\d{2})-(\d{2})$/,  // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
        /^(\d{2})-(\d{2})-(\d{4})$/,   // DD-MM-YYYY
      ];
      
      for (const regex of formats) {
        const match = input.match(regex);
        if (match) {
          return new Date(input);
        }
      }
    }
    
    return null;
  }

  /**
   * Format to ISO date string (YYYY-MM-DD)
   */
  static toISODate(date) {
    return this.format(date, 'YYYY-MM-DD');
  }

  /**
   * Format to ISO datetime string
   */
  static toISODateTime(date) {
    const d = this.toDate(date);
    return d ? d.toISOString() : '';
  }

  /**
   * Format to localized date string
   */
  static toLocalDate(date, locale = 'en-US', options = {}) {
    const d = this.toDate(date);
    if (!d) return '';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return d.toLocaleDateString(locale, { ...defaultOptions, ...options });
  }

  /**
   * Format to localized time string
   */
  static toLocalTime(date, locale = 'en-US', options = {}) {
    const d = this.toDate(date);
    if (!d) return '';
    
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };
    
    return d.toLocaleTimeString(locale, { ...defaultOptions, ...options });
  }

  /**
   * Format to localized datetime string
   */
  static toLocalDateTime(date, locale = 'en-US', options = {}) {
    const d = this.toDate(date);
    if (!d) return '';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    return d.toLocaleString(locale, { ...defaultOptions, ...options });
  }

  /**
   * Format to relative time (e.g., "2 hours ago")
   */
  static toRelative(date, locale = 'en-US') {
    const d = this.toDate(date);
    if (!d) return '';
    
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    // Use Intl.RelativeTimeFormat if available
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      
      if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second');
      if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute');
      if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, 'hour');
      if (Math.abs(diffDay) < 7) return rtf.format(-diffDay, 'day');
      if (Math.abs(diffWeek) < 4) return rtf.format(-diffWeek, 'week');
      if (Math.abs(diffMonth) < 12) return rtf.format(-diffMonth, 'month');
      return rtf.format(-diffYear, 'year');
    }

    // Fallback for older environments
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  }

  /**
   * Format to short relative time (e.g., "2h ago")
   */
  static toShortRelative(date) {
    const d = this.toDate(date);
    if (!d) return '';
    
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    if (diffWeek < 4) return `${diffWeek}w`;
    if (diffMonth < 12) return `${diffMonth}mo`;
    return `${diffYear}y`;
  }

  /**
   * Format date for database (MySQL format)
   */
  static toMySQL(date) {
    return this.format(date, 'YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Format date for display (common formats)
   */
  static toDisplay(date, type = 'full') {
    const d = this.toDate(date);
    if (!d) return '';

    switch (type) {
      case 'date':
        return this.format(d, 'MMM DD, YYYY');
      case 'time':
        return this.format(d, 'hh:mm A');
      case 'datetime':
        return this.format(d, 'MMM DD, YYYY hh:mm A');
      case 'short':
        return this.format(d, 'MM/DD/YY');
      case 'full':
      default:
        return this.format(d, 'dddd, MMMM DD, YYYY');
    }
  }

  // ==================== Date Calculations ====================

  /**
   * Add time to date
   */
  static add(date, amount, unit) {
    const d = this.toDate(date);
    if (!d) return null;

    const result = new Date(d);
    
    switch (unit) {
      case 'years':
      case 'year':
      case 'y':
        result.setFullYear(result.getFullYear() + amount);
        break;
      case 'months':
      case 'month':
      case 'M':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'weeks':
      case 'week':
      case 'w':
        result.setDate(result.getDate() + (amount * 7));
        break;
      case 'days':
      case 'day':
      case 'd':
        result.setDate(result.getDate() + amount);
        break;
      case 'hours':
      case 'hour':
      case 'h':
        result.setHours(result.getHours() + amount);
        break;
      case 'minutes':
      case 'minute':
      case 'm':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'seconds':
      case 'second':
      case 's':
        result.setSeconds(result.getSeconds() + amount);
        break;
    }
    
    return result;
  }

  /**
   * Subtract time from date
   */
  static subtract(date, amount, unit) {
    return this.add(date, -amount, unit);
  }

  /**
   * Get difference between two dates
   */
  static diff(date1, date2, unit = 'days') {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    if (!d1 || !d2) return null;

    const diffMs = d1 - d2;
    
    switch (unit) {
      case 'years':
      case 'year':
      case 'y':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
      case 'months':
      case 'month':
      case 'M':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      case 'weeks':
      case 'week':
      case 'w':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      case 'days':
      case 'day':
      case 'd':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'hours':
      case 'hour':
      case 'h':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'minutes':
      case 'minute':
      case 'm':
        return Math.floor(diffMs / (1000 * 60));
      case 'seconds':
      case 'second':
      case 's':
        return Math.floor(diffMs / 1000);
      case 'milliseconds':
      case 'ms':
      default:
        return diffMs;
    }
  }

  // ==================== Date Parts ====================

  /**
   * Get start of time unit
   */
  static startOf(date, unit) {
    const d = this.toDate(date);
    if (!d) return null;

    const result = new Date(d);
    
    switch (unit) {
      case 'year':
        result.setMonth(0, 1);
        result.setHours(0, 0, 0, 0);
        break;
      case 'month':
        result.setDate(1);
        result.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = result.getDay();
        result.setDate(result.getDate() - day);
        result.setHours(0, 0, 0, 0);
        break;
      case 'day':
        result.setHours(0, 0, 0, 0);
        break;
      case 'hour':
        result.setMinutes(0, 0, 0);
        break;
      case 'minute':
        result.setSeconds(0, 0);
        break;
    }
    
    return result;
  }

  /**
   * Get end of time unit
   */
  static endOf(date, unit) {
    const d = this.toDate(date);
    if (!d) return null;

    const result = new Date(d);
    
    switch (unit) {
      case 'year':
        result.setMonth(11, 31);
        result.setHours(23, 59, 59, 999);
        break;
      case 'month':
        result.setMonth(result.getMonth() + 1, 0);
        result.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const day = result.getDay();
        result.setDate(result.getDate() + (6 - day));
        result.setHours(23, 59, 59, 999);
        break;
      case 'day':
        result.setHours(23, 59, 59, 999);
        break;
      case 'hour':
        result.setMinutes(59, 59, 999);
        break;
      case 'minute':
        result.setSeconds(59, 999);
        break;
    }
    
    return result;
  }

  // ==================== Validation & Comparison ====================

  /**
   * Check if date is valid
   */
  static isValid(date) {
    return this.toDate(date) !== null;
  }

  /**
   * Check if date is before another
   */
  static isBefore(date1, date2) {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    if (!d1 || !d2) return false;
    return d1 < d2;
  }

  /**
   * Check if date is after another
   */
  static isAfter(date1, date2) {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    if (!d1 || !d2) return false;
    return d1 > d2;
  }

  /**
   * Check if date is same as another (by unit)
   */
  static isSame(date1, date2, unit = 'day') {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    if (!d1 || !d2) return false;

    switch (unit) {
      case 'year':
        return d1.getFullYear() === d2.getFullYear();
      case 'month':
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth();
      case 'day':
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
      case 'hour':
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate() &&
               d1.getHours() === d2.getHours();
      default:
        return d1.getTime() === d2.getTime();
    }
  }

  /**
   * Check if date is between two dates
   */
  static isBetween(date, start, end, inclusive = true) {
    const d = this.toDate(date);
    const s = this.toDate(start);
    const e = this.toDate(end);
    if (!d || !s || !e) return false;

    if (inclusive) {
      return d >= s && d <= e;
    }
    return d > s && d < e;
  }

  /**
   * Check if date is today
   */
  static isToday(date) {
    return this.isSame(date, new Date(), 'day');
  }

  /**
   * Check if date is yesterday
   */
  static isYesterday(date) {
    const yesterday = this.subtract(new Date(), 1, 'day');
    return this.isSame(date, yesterday, 'day');
  }

  /**
   * Check if date is tomorrow
   */
  static isTomorrow(date) {
    const tomorrow = this.add(new Date(), 1, 'day');
    return this.isSame(date, tomorrow, 'day');
  }

  /**
   * Check if date is in the past
   */
  static isPast(date) {
    return this.isBefore(date, new Date());
  }

  /**
   * Check if date is in the future
   */
  static isFuture(date) {
    return this.isAfter(date, new Date());
  }

  // ==================== Date Ranges ====================

  /**
   * Get date range
   */
  static getRange(startDate, endDate, unit = 'day') {
    const start = this.toDate(startDate);
    const end = this.toDate(endDate);
    if (!start || !end) return [];

    const dates = [];
    let current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current = this.add(current, 1, unit);
    }

    return dates;
  }

  /**
   * Get predefined date range
   */
  static getPredefinedRange(range) {
    const now = new Date();
    
    switch (range) {
      case 'today':
        return {
          start: this.startOf(now, 'day'),
          end: this.endOf(now, 'day'),
        };
      case 'yesterday':
        const yesterday = this.subtract(now, 1, 'day');
        return {
          start: this.startOf(yesterday, 'day'),
          end: this.endOf(yesterday, 'day'),
        };
      case 'this_week':
        return {
          start: this.startOf(now, 'week'),
          end: this.endOf(now, 'week'),
        };
      case 'last_week':
        const lastWeek = this.subtract(now, 1, 'week');
        return {
          start: this.startOf(lastWeek, 'week'),
          end: this.endOf(lastWeek, 'week'),
        };
      case 'this_month':
        return {
          start: this.startOf(now, 'month'),
          end: this.endOf(now, 'month'),
        };
      case 'last_month':
        const lastMonth = this.subtract(now, 1, 'month');
        return {
          start: this.startOf(lastMonth, 'month'),
          end: this.endOf(lastMonth, 'month'),
        };
      case 'this_year':
        return {
          start: this.startOf(now, 'year'),
          end: this.endOf(now, 'year'),
        };
      case 'last_year':
        const lastYear = this.subtract(now, 1, 'year');
        return {
          start: this.startOf(lastYear, 'year'),
          end: this.endOf(lastYear, 'year'),
        };
      case 'last_7_days':
        return {
          start: this.startOf(this.subtract(now, 7, 'day'), 'day'),
          end: this.endOf(now, 'day'),
        };
      case 'last_30_days':
        return {
          start: this.startOf(this.subtract(now, 30, 'day'), 'day'),
          end: this.endOf(now, 'day'),
        };
      case 'last_90_days':
        return {
          start: this.startOf(this.subtract(now, 90, 'day'), 'day'),
          end: this.endOf(now, 'day'),
        };
      default:
        return null;
    }
  }

  // ==================== Timezone ====================

  /**
   * Convert to UTC
   */
  static toUTC(date) {
    const d = this.toDate(date);
    if (!d) return null;
    
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  }

  /**
   * Convert from UTC to local
   */
  static fromUTC(date) {
    const d = this.toDate(date);
    if (!d) return null;
    
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  }

  /**
   * Get timezone offset string
   */
  static getTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const sign = offset <= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
    return `${sign}${hours}:${minutes}`;
  }
}

module.exports = DateFormatter;