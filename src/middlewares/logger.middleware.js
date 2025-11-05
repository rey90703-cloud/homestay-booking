const morgan = require('morgan');
const logger = require('../utils/logger');

// Create a stream object with a 'write' function that will be used by Morgan
const stream = {
  write: (message) => logger.info(message.trim()),
};

// Skip logging during tests
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Build the morgan middleware
const morganMiddleware = morgan(
  // Define message format string (this is the default one).
  ':method :url :status :res[content-length] - :response-time ms',
  // Options: override the stream and skip function
  { stream, skip },
);

module.exports = morganMiddleware;
