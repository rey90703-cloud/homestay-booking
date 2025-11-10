const multer = require('multer');
const { BadRequestError } = require('../utils/apiError');
const { FILE_UPLOAD } = require('../config/constants');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestError(
        `Invalid file type. Only ${FILE_UPLOAD.ALLOWED_IMAGE_TYPES.join(', ')} are allowed`,
      ),
      false,
    );
  }
  cb(null, true);
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
  },
  fileFilter: fileFilter,
});

// Single image upload
const uploadSingle = upload.single('avatar');

// Multiple images upload
const uploadMultiple = upload.array('images', FILE_UPLOAD.MAX_IMAGES_PER_HOMESTAY);

// Upload homestay images (cover + multiple images)
const uploadHomestayImages = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: FILE_UPLOAD.MAX_IMAGES_PER_HOMESTAY },
]);

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new BadRequestError(
          `File size too large. Maximum size is ${FILE_UPLOAD.MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        ),
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(
        new BadRequestError(`Too many files. Maximum is ${FILE_UPLOAD.MAX_IMAGES_PER_HOMESTAY}`),
      );
    }
    return next(new BadRequestError(err.message));
  }
  next(err);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadHomestayImages,
  handleMulterError,
};
