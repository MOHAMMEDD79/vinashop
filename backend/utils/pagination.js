/**
 * Pagination Utility
 * @module utils/pagination
 */

class Pagination {
  /**
   * Default options
   */
  static defaults = {
    page: 1,
    limit: 10,
    maxLimit: 100,
    defaultLimit: 10,
  };

  /**
   * Parse pagination params from request
   */
  static parse(query = {}, options = {}) {
    const opts = { ...this.defaults, ...options };
    
    let page = parseInt(query.page, 10) || opts.page;
    let limit = parseInt(query.limit || query.per_page || query.pageSize, 10) || opts.defaultLimit;
    
    // Ensure valid values
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), opts.maxLimit);
    
    const offset = (page - 1) * limit;
    
    return {
      page,
      limit,
      offset,
    };
  }

  /**
   * Create pagination response
   */
  static paginate(data, total, params) {
    const { page, limit } = params;
    
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      data,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };
  }

  /**
   * Create pagination with links
   */
  static paginateWithLinks(data, total, params, baseUrl) {
    const result = this.paginate(data, total, params);
    const { page, limit } = params;
    const { totalPages } = result.pagination;
    
    // Build links
    const links = {
      self: this.buildUrl(baseUrl, page, limit),
      first: this.buildUrl(baseUrl, 1, limit),
      last: this.buildUrl(baseUrl, totalPages, limit),
      next: page < totalPages ? this.buildUrl(baseUrl, page + 1, limit) : null,
      prev: page > 1 ? this.buildUrl(baseUrl, page - 1, limit) : null,
    };
    
    return {
      ...result,
      links,
    };
  }

  /**
   * Build URL with pagination params
   */
  static buildUrl(baseUrl, page, limit) {
    const url = new URL(baseUrl, 'http://localhost');
    url.searchParams.set('page', page);
    url.searchParams.set('limit', limit);
    return url.pathname + url.search;
  }

  /**
   * Create cursor-based pagination response
   */
  static cursorPaginate(data, params, cursorField = 'id') {
    const { limit } = params;
    
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    
    return {
      data: items,
      pagination: {
        hasMore,
        nextCursor: hasMore && lastItem ? lastItem[cursorField] : null,
        prevCursor: firstItem ? firstItem[cursorField] : null,
        limit,
      },
    };
  }

  /**
   * Parse cursor pagination params
   */
  static parseCursor(query = {}, options = {}) {
    const opts = { ...this.defaults, ...options };
    
    let limit = parseInt(query.limit, 10) || opts.defaultLimit;
    limit = Math.min(Math.max(1, limit), opts.maxLimit);
    
    return {
      cursor: query.cursor || null,
      after: query.after || null,
      before: query.before || null,
      limit,
      // Fetch one extra to determine if there are more results
      fetchLimit: limit + 1,
    };
  }

  /**
   * Create SQL LIMIT OFFSET clause
   */
  static sql(params) {
    const { limit, offset } = params;
    return `LIMIT ${limit} OFFSET ${offset}`;
  }

  /**
   * Create SQL for cursor pagination
   */
  static cursorSql(params, cursorField = 'id', direction = 'ASC') {
    const { cursor, limit, after, before } = params;
    
    let where = '';
    const orderDirection = direction.toUpperCase();
    const compareOp = orderDirection === 'ASC' ? '>' : '<';
    
    if (cursor || after) {
      where = `WHERE ${cursorField} ${compareOp} ?`;
    } else if (before) {
      where = `WHERE ${cursorField} ${compareOp === '>' ? '<' : '>'} ?`;
    }
    
    return {
      where,
      orderBy: `ORDER BY ${cursorField} ${orderDirection}`,
      limit: `LIMIT ${limit + 1}`,
      cursorValue: cursor || after || before,
    };
  }

  /**
   * Get pagination metadata
   */
  static getMeta(total, params) {
    const { page, limit } = params;
    
    const totalPages = Math.ceil(total / limit);
    const from = total > 0 ? (page - 1) * limit + 1 : 0;
    const to = Math.min(page * limit, total);
    
    return {
      total,
      perPage: limit,
      currentPage: page,
      lastPage: totalPages,
      from,
      to,
      hasMore: page < totalPages,
    };
  }

  /**
   * Create page numbers array for UI
   */
  static getPageNumbers(currentPage, totalPages, maxVisible = 7) {
    const pages = [];
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      const sidePages = Math.floor((maxVisible - 3) / 2);
      
      // Always show first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - sidePages);
      let endPage = Math.min(totalPages - 1, currentPage + sidePages);
      
      // Adjust if near start
      if (currentPage <= sidePages + 2) {
        endPage = maxVisible - 2;
      }
      
      // Adjust if near end
      if (currentPage >= totalPages - sidePages - 1) {
        startPage = totalPages - maxVisible + 3;
      }
      
      // Add ellipsis before middle pages
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after middle pages
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  }

  /**
   * Create offset-based pagination info
   */
  static getOffsetInfo(offset, limit, total) {
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    
    return {
      offset,
      limit,
      page,
      total,
      totalPages,
      hasNext: offset + limit < total,
      hasPrev: offset > 0,
      nextOffset: offset + limit < total ? offset + limit : null,
      prevOffset: offset > 0 ? Math.max(0, offset - limit) : null,
    };
  }

  /**
   * Validate pagination params
   */
  static validate(params, options = {}) {
    const opts = { ...this.defaults, ...options };
    const errors = [];
    
    if (params.page !== undefined) {
      if (!Number.isInteger(params.page) || params.page < 1) {
        errors.push('Page must be a positive integer');
      }
    }
    
    if (params.limit !== undefined) {
      if (!Number.isInteger(params.limit) || params.limit < 1) {
        errors.push('Limit must be a positive integer');
      }
      if (params.limit > opts.maxLimit) {
        errors.push(`Limit cannot exceed ${opts.maxLimit}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create empty pagination response
   */
  static empty(params = { page: 1, limit: 10 }) {
    return this.paginate([], 0, params);
  }

  /**
   * Slice array with pagination
   */
  static sliceArray(array, params) {
    const { offset, limit } = params;
    const data = array.slice(offset, offset + limit);
    return this.paginate(data, array.length, params);
  }

  /**
   * Create infinite scroll response
   */
  static infiniteScroll(data, total, params) {
    const { page, limit } = params;
    const loaded = page * limit;
    const remaining = Math.max(0, total - loaded);
    
    return {
      data,
      pagination: {
        total,
        loaded: Math.min(loaded, total),
        remaining,
        hasMore: remaining > 0,
        nextPage: remaining > 0 ? page + 1 : null,
      },
    };
  }

  /**
   * Create load more response
   */
  static loadMore(data, total, offset, limit) {
    const hasMore = offset + data.length < total;
    const nextOffset = hasMore ? offset + limit : null;
    
    return {
      data,
      pagination: {
        total,
        offset,
        limit,
        count: data.length,
        hasMore,
        nextOffset,
      },
    };
  }

  /**
   * Combine multiple paginated results
   */
  static combine(results) {
    const combined = {
      data: [],
      totals: {},
      totalAll: 0,
    };
    
    for (const [key, result] of Object.entries(results)) {
      combined.data.push(...result.data);
      combined.totals[key] = result.pagination?.total || result.data.length;
      combined.totalAll += combined.totals[key];
    }
    
    return combined;
  }

  /**
   * Express middleware for parsing pagination
   */
  static middleware(options = {}) {
    return (req, res, next) => {
      req.pagination = this.parse(req.query, options);
      
      // Add helper method to response
      res.paginate = (data, total) => {
        const result = this.paginateWithLinks(
          data,
          total,
          req.pagination,
          req.originalUrl.split('?')[0]
        );
        return res.json(result);
      };
      
      next();
    };
  }
}

module.exports = Pagination;