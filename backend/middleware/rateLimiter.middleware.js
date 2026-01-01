/**
 * Rate Limiter Middleware
 * @module middleware/rateLimiter
 */

const { RATE_LIMIT } = require('../config/constants');

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed rate limiting
 */
class MemoryStore {
  constructor() {
    this.hits = new Map();
    this.resetTime = new Map();
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Increment hit count for key
   */
  increment(key, windowMs) {
    const now = Date.now();
    const resetAt = this.resetTime.get(key);

    // Reset if window expired
    if (!resetAt || now > resetAt) {
      this.hits.set(key, 1);
      this.resetTime.set(key, now + windowMs);
      return { count: 1, resetTime: now + windowMs };
    }

    const count = (this.hits.get(key) || 0) + 1;
    this.hits.set(key, count);
    return { count, resetTime: resetAt };
  }

  /**
   * Get current hit count for key
   */
  get(key) {
    return {
      count: this.hits.get(key) || 0,
      resetTime: this.resetTime.get(key) || 0,
    };
  }

  /**
   * Reset key
   */
  reset(key) {
    this.hits.delete(key);
    this.resetTime.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, resetTime] of this.resetTime.entries()) {
      if (now > resetTime) {
        this.hits.delete(key);
        this.resetTime.delete(key);
      }
    }
  }
}

// Global store instance
const store = new MemoryStore();

/**
 * Create rate limiter middleware
 * @param {Object} options - Rate limiter options
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = RATE_LIMIT?.WINDOW_MS || 15 * 60 * 1000,
    max = RATE_LIMIT?.MAX_REQUESTS || 100,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    keyGenerator = (req) => req.ip || req.connection?.remoteAddress || 'unknown',
    skip = () => false,
    onLimitReached = null,
    headers = true,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    // NEW: Skip in development mode option
    skipInDevelopment = false,
  } = options;

  return (req, res, next) => {
    // NEW: Skip rate limiting in development if enabled
    if (skipInDevelopment && process.env.NODE_ENV === 'development') {
      return next();
    }

    // Skip if condition met
    if (skip(req)) {
      return next();
    }

    // Generate key for this request
    const key = keyGenerator(req);

    // Increment hit count
    const { count, resetTime } = store.increment(key, windowMs);

    // Set rate limit headers
    if (headers) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
    }

    // Check if limit exceeded
    if (count > max) {
      // Call onLimitReached callback if provided
      if (onLimitReached) {
        onLimitReached(req, res, options);
      }

      // Set Retry-After header
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);

      return res.status(statusCode).json({
        success: false,
        message,
        error_code: 'RATE_LIMIT_EXCEEDED',
        retry_after: retryAfter,
      });
    }

    // Handle skip based on response status
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        const isSuccess = res.statusCode < 400;
        
        if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && !isSuccess)) {
          // Decrement the counter
          const currentCount = store.hits.get(key) || 0;
          store.hits.set(key, Math.max(0, currentCount - 1));
        }
        
        return originalJson(data);
      };
    }

    next();
  };
};

/**
 * Default rate limiter - RELAXED for development
 * Increased from 100 to 1000 requests per 15 minutes
 */
const defaultLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // INCREASED: 1000 requests per window (was 100)
  message: 'Too many requests from this IP, please try again later',
  skipInDevelopment: true, // NEW: Skip in development
});

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many attempts, please try again later',
});

/**
 * Auth rate limiter for login/register
 * KEPT YOUR CHANGES: No limit on failed attempts
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // INCREASED: Allow many login attempts (your request)
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: false, // Don't skip - allow unlimited attempts as you wanted
  skipFailedRequests: false, // Don't skip failed requests
  onLimitReached: (req) => {
    console.warn(`Rate limit reached for auth: ${req.ip}`);
  },
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // INCREASED: 10 attempts per hour (was 3)
  message: 'Too many password reset attempts, please try again later',
});

/**
 * API rate limiter (higher limits) - RELAXED
 */
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // INCREASED: 300 requests per minute (was 60)
  message: 'API rate limit exceeded',
  skipInDevelopment: true, // NEW: Skip in development
  keyGenerator: (req) => {
    // Use API key if available, otherwise IP
    return req.headers['x-api-key'] || req.ip;
  },
});

/**
 * Upload rate limiter
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // INCREASED: 100 uploads per hour (was 50)
  message: 'Too many uploads, please try again later',
});

/**
 * Search rate limiter
 */
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // INCREASED: 100 searches per minute (was 30)
  message: 'Too many search requests, please slow down',
  skipInDevelopment: true,
});

/**
 * Export rate limiter
 */
const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // INCREASED: 50 exports per hour (was 10)
  message: 'Too many export requests, please try again later',
});

/**
 * Email rate limiter
 */
const emailLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // INCREASED: 50 emails per hour (was 20)
  message: 'Too many email requests, please try again later',
});

/**
 * NEW: Dashboard rate limiter - Very relaxed for admin panel
 */
const dashboardLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute
  message: 'Dashboard rate limit exceeded',
  skipInDevelopment: true, // Always skip in development
});

/**
 * Create custom rate limiter based on user/admin
 */
const createUserBasedLimiter = (options = {}) => {
  return createRateLimiter({
    ...options,
    keyGenerator: (req) => {
      // Use admin ID if authenticated, otherwise IP
      if (req.admin) {
        return `admin:${req.admin.adminId}`;
      }
      if (req.user) {
        return `user:${req.user.userId}`;
      }
      return req.ip;
    },
  });
};

/**
 * Dynamic rate limiter based on user role
 */
const roleBasedLimiter = (limits = {}) => {
  const defaultLimits = {
    super_admin: { windowMs: 60000, max: 2000 }, // INCREASED
    admin: { windowMs: 60000, max: 500 }, // INCREASED
    moderator: { windowMs: 60000, max: 200 }, // INCREASED
    default: { windowMs: 60000, max: 100 }, // INCREASED
  };

  const mergedLimits = { ...defaultLimits, ...limits };

  return (req, res, next) => {
    // Skip in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    const role = req.admin?.role || 'default';
    const limit = mergedLimits[role] || mergedLimits.default;

    const limiter = createRateLimiter({
      ...limit,
      keyGenerator: (req) => {
        return req.admin 
          ? `role:${role}:${req.admin.adminId}` 
          : `ip:${req.ip}`;
      },
    });

    return limiter(req, res, next);
  };
};

/**
 * Sliding window rate limiter
 */
class SlidingWindowStore {
  constructor() {
    this.requests = new Map();
    setInterval(() => this.cleanup(), 60000);
  }

  add(key, timestamp, windowMs) {
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key);
    const windowStart = timestamp - windowMs;
    
    // Remove old timestamps
    const filtered = timestamps.filter(t => t > windowStart);
    filtered.push(timestamp);
    
    this.requests.set(key, filtered);
    return filtered.length;
  }

  get(key, windowMs) {
    const timestamps = this.requests.get(key) || [];
    const windowStart = Date.now() - windowMs;
    return timestamps.filter(t => t > windowStart).length;
  }

  cleanup() {
    const now = Date.now();
    const maxWindow = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(t => t > now - maxWindow);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

const slidingStore = new SlidingWindowStore();

/**
 * Create sliding window rate limiter
 */
const createSlidingWindowLimiter = (options = {}) => {
  const {
    windowMs = 60000,
    max = 100,
    message = 'Rate limit exceeded',
    keyGenerator = (req) => req.ip,
    skipInDevelopment = false,
  } = options;

  return (req, res, next) => {
    // Skip in development if enabled
    if (skipInDevelopment && process.env.NODE_ENV === 'development') {
      return next();
    }

    const key = keyGenerator(req);
    const count = slidingStore.add(key, Date.now(), windowMs);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));

    if (count > max) {
      return res.status(429).json({
        success: false,
        message,
        error_code: 'RATE_LIMIT_EXCEEDED',
      });
    }

    next();
  };
};

/**
 * Skip rate limiting for whitelisted IPs
 */
const skipWhitelisted = (whitelistedIps = []) => {
  return (req) => {
    const ip = (req.ip || req.connection?.remoteAddress || '').replace(/^::ffff:/, '');
    return whitelistedIps.includes(ip);
  };
};

/**
 * Reset rate limit for a key
 */
const resetRateLimit = (key) => {
  store.reset(key);
};

/**
 * Get rate limit status for a key
 */
const getRateLimitStatus = (key) => {
  return store.get(key);
};

/**
 * NEW: No-op limiter that does nothing (for development/testing)
 */
const noLimiter = (req, res, next) => next();

module.exports = {
  createRateLimiter,
  defaultLimiter,
  strictLimiter,
  authLimiter,
  loginRateLimiter: authLimiter, // Alias for routes
  passwordResetLimiter,
  apiLimiter,
  uploadLimiter,
  searchLimiter,
  exportLimiter,
  emailLimiter,
  dashboardLimiter, // NEW
  createUserBasedLimiter,
  roleBasedLimiter,
  createSlidingWindowLimiter,
  skipWhitelisted,
  resetRateLimit,
  getRateLimitStatus,
  MemoryStore,
  noLimiter, // NEW
  // General limiter alias
  general: defaultLimiter,
};