const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');
const logger = require('./logger');

/**
 * Upload image to Cloudinary from buffer
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} folder - Cloudinary folder
 * @param {String} filename - Optional filename
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = (fileBuffer, folder = 'homestay', filename = null) => new Promise((resolve, reject) => {
  const uploadOptions = {
    folder: folder,
    resource_type: 'image',
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  };

  if (filename) {
    uploadOptions.public_id = filename;
  }

  const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
    if (error) {
      logger.error('Cloudinary upload error:', error);
      reject(error);
    } else {
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    }
  });

  // Convert buffer to stream and pipe to Cloudinary
  const readableStream = Readable.from(fileBuffer);
  readableStream.pipe(uploadStream);
});

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Delete result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<Buffer>} fileBuffers - Array of file buffers
 * @param {String} folder - Cloudinary folder
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleImages = async (fileBuffers, folder = 'homestay') => {
  try {
    const uploadPromises = fileBuffers.map((buffer) => uploadImage(buffer, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Multiple images upload error:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<String>} publicIds - Array of public IDs
 * @returns {Promise<Array>} Array of delete results
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    const deletePromises = publicIds.map((id) => deleteImage(id));
    return await Promise.all(deletePromises);
  } catch (error) {
    logger.error('Multiple images delete error:', error);
    throw error;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  deleteMultipleImages,
};
