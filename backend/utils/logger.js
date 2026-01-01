/**
 * Logger Utility
 * @module utils/logger
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

class Logger {
  static instance = null;
  
  constructor(options = {}) {
    this.options = {
      level: options.level || process.env.LOG_LEVEL || 'info',
      timestamp: options.timestamp !== false,
      colorize: options.colorize !== false && process.env.NODE_ENV !== 'production',
      prefix: options.prefix || '',
      logDir: options.logDir || path.join(process.cwd(), 'logs'),
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles || 5,
      console: options.console !== false,
      file: options.file || false,
      json: options.json || false,
    };

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4,
      trace: 5,
    };

    this.colors = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[36m',    // Cyan
      http: '\x1b[35m',    // Magenta
      debug: '\x1b[32m',   // Green
      trace: '\x1b[90m',   // Gray
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
    };

    this.levelEmoji = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      http: '🌐',
      debug: '🐛',
      trace: '📝',
    };

    if (this.options.file) {
      this.ensureLogDir();
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(options = {}) {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }

  /**
   * Configure logger
   */
  static configure(options) {
    Logger.instance = new Logger(options);
    return Logger.instance;
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDir() {
    if (!fs.existsSync(this.options.logDir)) {
      fs.mkdirSync(this.options.logDir, { recursive: true });
    }
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.options.level];
  }

  /**
   * Format timestamp
   */
  formatTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * Format message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.options.timestamp ? this.formatTimestamp() : '';
    const prefix = this.options.prefix ? `[${this.options.prefix}]` : '';
    
    if (this.options.json) {
      return JSON.stringify({
        timestamp,
        level,
        prefix: this.options.prefix || undefined,
        message,
        ...meta,
      });
    }

    let formatted = '';
    
    if (timestamp) {
      formatted += `${timestamp} `;
    }
    
    formatted += `[${level.toUpperCase()}]`;
    
    if (prefix) {
      formatted += ` ${prefix}`;
    }
    
    formatted += ` ${message}`;
    
    if (Object.keys(meta).length > 0) {
      formatted += ` ${util.inspect(meta, { colors: this.options.colorize, depth: 3 })}`;
    }
    
    return formatted;
  }

  /**
   * Colorize message
   */
  colorize(level, message) {
    if (!this.options.colorize) return message;
    
    const color = this.colors[level] || '';
    return `${color}${message}${this.colors.reset}`;
  }

  /**
   * Write to console
   */
  writeToConsole(level, message) {
    if (!this.options.console) return;
    
    const colorized = this.colorize(level, message);
    
    switch (level) {
      case 'error':
        console.error(colorized);
        break;
      case 'warn':
        console.warn(colorized);
        break;
      default:
        console.log(colorized);
    }
  }

  /**
   * Write to file
   */
  writeToFile(level, message) {
    if (!this.options.file) return;
    
    const filename = this.getLogFilename(level);
    const filePath = path.join(this.options.logDir, filename);
    
    // Check file size and rotate if needed
    this.rotateIfNeeded(filePath);
    
    fs.appendFileSync(filePath, message + '\n');
    
    // Also write errors to combined log
    if (level !== 'error') {
      const combinedPath = path.join(this.options.logDir, 'combined.log');
      this.rotateIfNeeded(combinedPath);
      fs.appendFileSync(combinedPath, message + '\n');
    }
  }

  /**
   * Get log filename
   */
  getLogFilename(level) {
    const date = new Date().toISOString().split('T')[0];
    
    if (level === 'error') {
      return `error-${date}.log`;
    }
    
    return `combined-${date}.log`;
  }

  /**
   * Rotate log file if needed
   */
  rotateIfNeeded(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      
      const stats = fs.statSync(filePath);
      
      if (stats.size >= this.options.maxFileSize) {
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
        const dir = path.dirname(filePath);
        
        // Rotate existing files
        for (let i = this.options.maxFiles - 1; i >= 1; i--) {
          const oldPath = path.join(dir, `${base}.${i}${ext}`);
          const newPath = path.join(dir, `${base}.${i + 1}${ext}`);
          
          if (fs.existsSync(oldPath)) {
            if (i === this.options.maxFiles - 1) {
              fs.unlinkSync(oldPath);
            } else {
              fs.renameSync(oldPath, newPath);
            }
          }
        }
        
        // Rename current file
        fs.renameSync(filePath, path.join(dir, `${base}.1${ext}`));
      }
    } catch (error) {
      console.error('Log rotation error:', error.message);
    }
  }

  /**
   * Core log method
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    
    // Handle Error objects
    if (message instanceof Error) {
      meta.stack = message.stack;
      message = message.message;
    }
    
    // Handle objects as message
    if (typeof message === 'object') {
      meta = { ...meta, ...message };
      message = meta.message || 'Log entry';
      delete meta.message;
    }
    
    const formatted = this.formatMessage(level, message, meta);
    
    this.writeToConsole(level, formatted);
    this.writeToFile(level, formatted);
  }

  // ==================== Log Level Methods ====================

  /**
   * Error level
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Warn level
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Info level
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * HTTP level
   */
  http(message, meta = {}) {
    this.log('http', message, meta);
  }

  /**
   * Debug level
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Trace level
   */
  trace(message, meta = {}) {
    this.log('trace', message, meta);
  }

  // ==================== Specialized Loggers ====================

  /**
   * Log HTTP request
   */
  request(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    };
    
    if (req.user) {
      meta.userId = req.user.id;
    }
    
    const statusColor = res.statusCode >= 500 ? 'error' :
                       res.statusCode >= 400 ? 'warn' : 'http';
    
    this.log(statusColor, `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`, meta);
  }

  /**
   * Log database query
   */
  query(sql, params = [], duration) {
    this.debug('Database query', {
      sql: sql.substring(0, 200),
      params: params.length > 0 ? params : undefined,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Log API call
   */
  api(method, url, status, duration) {
    this.http(`API ${method} ${url}`, {
      status,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log authentication event
   */
  auth(event, userId, meta = {}) {
    this.info(`Auth: ${event}`, {
      userId,
      ...meta,
    });
  }

  /**
   * Log security event
   */
  security(event, meta = {}) {
    this.warn(`Security: ${event}`, meta);
  }

  /**
   * Log performance metric
   */
  performance(operation, duration, meta = {}) {
    this.debug(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...meta,
    });
  }

  /**
   * Log email event
   */
  email(event, to, meta = {}) {
    this.info(`Email: ${event}`, {
      to,
      ...meta,
    });
  }

  /**
   * Log job/task event
   */
  job(name, event, meta = {}) {
    this.info(`Job [${name}]: ${event}`, meta);
  }

  // ==================== Utility Methods ====================

  /**
   * Start timer
   */
  startTimer(label) {
    return {
      label,
      start: Date.now(),
      end: () => {
        const duration = Date.now() - this.start;
        this.performance(label, duration);
        return duration;
      },
    };
  }

  /**
   * Create child logger with prefix
   */
  child(prefix) {
    return new Logger({
      ...this.options,
      prefix: this.options.prefix ? `${this.options.prefix}:${prefix}` : prefix,
    });
  }

  /**
   * Group logs
   */
  group(label) {
    if (this.options.console && console.group) {
      console.group(label);
    }
  }

  /**
   * End group
   */
  groupEnd() {
    if (this.options.console && console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * Log table
   */
  table(data) {
    if (this.options.console && console.table) {
      console.table(data);
    } else {
      this.info('Table data', { data });
    }
  }

  /**
   * Clear console
   */
  clear() {
    if (this.options.console) {
      console.clear();
    }
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.options.level = level;
    }
  }

  /**
   * Get log level
   */
  getLevel() {
    return this.options.level;
  }

  /**
   * Enable/disable console output
   */
  setConsole(enabled) {
    this.options.console = enabled;
  }

  /**
   * Enable/disable file output
   */
  setFile(enabled) {
    this.options.file = enabled;
    if (enabled) {
      this.ensureLogDir();
    }
  }

  /**
   * Get log files
   */
  getLogFiles() {
    if (!fs.existsSync(this.options.logDir)) {
      return [];
    }
    
    return fs.readdirSync(this.options.logDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(this.options.logDir, file),
        size: fs.statSync(path.join(this.options.logDir, file)).size,
      }));
  }

  /**
   * Read log file
   */
  readLogFile(filename, lines = 100) {
    const filePath = path.join(this.options.logDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const allLines = content.split('\n').filter(Boolean);
    
    return allLines.slice(-lines);
  }

  /**
   * Clear log files
   */
  clearLogs() {
    if (!fs.existsSync(this.options.logDir)) {
      return;
    }
    
    const files = fs.readdirSync(this.options.logDir);
    
    for (const file of files) {
      if (file.endsWith('.log')) {
        fs.unlinkSync(path.join(this.options.logDir, file));
      }
    }
  }
}

// ==================== Express Middleware ====================

/**
 * Express request logger middleware
 */
Logger.middleware = (options = {}) => {
  const logger = Logger.getInstance(options);
  
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.request(req, res, duration);
    });
    
    next();
  };
};

/**
 * Express error logger middleware
 */
Logger.errorMiddleware = (options = {}) => {
  const logger = Logger.getInstance(options);
  
  return (err, req, res, next) => {
    logger.error(err.message, {
      stack: err.stack,
      method: req.method,
      url: req.originalUrl || req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
    });
    
    next(err);
  };
};

// ==================== Stream for Morgan ====================

/**
 * Morgan stream
 */
Logger.stream = {
  write: (message) => {
    const logger = Logger.getInstance();
    logger.http(message.trim());
  },
};

// ==================== Static Methods ====================

// Proxy static methods to singleton
['error', 'warn', 'info', 'http', 'debug', 'trace'].forEach(level => {
  Logger[level] = (message, meta) => {
    Logger.getInstance()[level](message, meta);
  };
});

module.exports = Logger;