const { NotFoundError } = require('./apiError');

/**
 * Find resource by ID or throw NotFoundError
 * @param {Model} model - Mongoose model
 * @param {string} id - Resource ID
 * @param {string} resourceName - Resource name for error message
 * @param {Object} options - Query options (select, populate)
 * @returns {Promise<Document>} Found document
 */
const findByIdOrFail = async (model, id, resourceName = 'Resource', options = {}) => {
  let query = model.findById(id);

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach((p) => {
        query = query.populate(p);
      });
    } else {
      query = query.populate(options.populate);
    }
  }

  const resource = await query;

  if (!resource) {
    throw new NotFoundError(resourceName);
  }

  return resource;
};

/**
 * Find one resource or throw NotFoundError
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {string} resourceName - Resource name for error message
 * @param {Object} options - Query options (select, populate)
 * @returns {Promise<Document>} Found document
 */
const findOneOrFail = async (model, filter, resourceName = 'Resource', options = {}) => {
  let query = model.findOne(filter);

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach((p) => {
        query = query.populate(p);
      });
    } else {
      query = query.populate(options.populate);
    }
  }

  const resource = await query;

  if (!resource) {
    throw new NotFoundError(resourceName);
  }

  return resource;
};

module.exports = {
  findByIdOrFail,
  findOneOrFail,
};
