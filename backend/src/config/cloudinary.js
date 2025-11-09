const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection
const testConnection = async () => {
  const isPlaceholder = process.env.CLOUDINARY_CLOUD_NAME?.includes('your-') ||
                        process.env.CLOUDINARY_API_KEY?.includes('your-') ||
                        process.env.CLOUDINARY_API_SECRET?.includes('your-');
  
  if (isPlaceholder) {
    logger.info('Cloudinary not configured (using placeholder values). Image uploads will be disabled.');
    return;
  }

  try {
    await cloudinary.api.ping();
    logger.info('Cloudinary connected successfully');
  } catch (error) {
    logger.warn('Cloudinary connection failed. Image uploads will not work.');
  }
};

if (process.env.CLOUDINARY_CLOUD_NAME) {
  testConnection();
}

module.exports = cloudinary;
