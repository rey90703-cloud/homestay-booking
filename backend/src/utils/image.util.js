const sharp = require('sharp');
const logger = require('./logger');

/**
 * Resize and compress image buffer
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Resize options
 * @returns {Promise<Buffer>} Resized image buffer
 */
const resizeImage = async (buffer, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 80,
    format = 'jpeg',
  } = options;

  try {
    const resized = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    const originalSize = (buffer.length / 1024).toFixed(2);
    const resizedSize = (resized.length / 1024).toFixed(2);
    logger.info(`Image resized: ${originalSize}KB → ${resizedSize}KB`);

    return resized;
  } catch (error) {
    logger.error(`Image resize error: ${error.message}`);
    throw error;
  }
};

/**
 * Convert image buffer to base64 data URL
 * @param {Buffer} buffer - Image buffer
 * @param {String} mimeType - MIME type (default: image/jpeg)
 * @returns {String} Base64 data URL
 */
const bufferToBase64 = (buffer, mimeType = 'image/jpeg') => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

/**
 * Resize and convert image to base64
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Resize options
 * @returns {Promise<String>} Base64 data URL
 */
const resizeAndConvertToBase64 = async (buffer, options = {}) => {
  const resized = await resizeImage(buffer, options);
  return bufferToBase64(resized);
};

module.exports = {
  resizeImage,
  bufferToBase64,
  resizeAndConvertToBase64,
};

