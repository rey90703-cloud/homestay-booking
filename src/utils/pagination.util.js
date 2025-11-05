/**
 * Pagination utility for consistent pagination across the app
 */

/**
 * Parse pagination parameters from request query
 */
const parsePaginationParams = (query, defaults = {}) => {
  const page = parseInt(query.page, 10) || defaults.page || 1;
  const limit = parseInt(query.limit, 10) || defaults.limit || 20;

  // Enforce max limit to prevent abuse
  const maxLimit = defaults.maxLimit || 100;
  const sanitizedLimit = Math.min(limit, maxLimit);

  const skip = (page - 1) * sanitizedLimit;

  return {
    page,
    limit: sanitizedLimit,
    skip,
  };
};

/**
 * Create pagination metadata object
 */
const createPaginationMeta = (page, limit, total) => {
  const pages = Math.ceil(total / limit);

  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    pages,
    hasNextPage: page < pages,
    hasPrevPage: page > 1,
  };
};

/**
 * Parse sort parameter
 * Converts string like '-createdAt' to { createdAt: -1 }
 * or 'price' to { price: 1 }
 */
const parseSortParam = (sort = '-createdAt') => {
  const sortObj = {};
  if (sort.startsWith('-')) {
    sortObj[sort.substring(1)] = -1;
  } else {
    sortObj[sort] = 1;
  }
  return sortObj;
};

/**
 * Execute paginated query
 */
const executePaginatedQuery = async (model, query, options = {}) => {
  const {
    page = 1, limit = 20, sort = '-createdAt', populate, select,
  } = options;

  const skip = (page - 1) * limit;
  const sortObj = typeof sort === 'string' ? parseSortParam(sort) : sort;

  let queryBuilder = model.find(query)
    .limit(limit)
    .skip(skip)
    .sort(sortObj);

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach((p) => {
        queryBuilder = queryBuilder.populate(p);
      });
    } else {
      queryBuilder = queryBuilder.populate(populate);
    }
  }

  if (select) {
    queryBuilder = queryBuilder.select(select);
  }

  const [results, total] = await Promise.all([
    queryBuilder,
    model.countDocuments(query),
  ]);

  return {
    results,
    pagination: createPaginationMeta(page, limit, total),
  };
};

module.exports = {
  parsePaginationParams,
  createPaginationMeta,
  parseSortParam,
  executePaginatedQuery,
};
