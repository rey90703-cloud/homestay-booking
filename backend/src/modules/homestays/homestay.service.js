const Homestay = require('./homestay.model');
const User = require('../users/user.model');
const Amenity = require('../../models/amenity.model');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../utils/apiError');
const { uploadMultipleImages, deleteMultipleImages } = require('../../utils/cloudinary.util');
const logger = require('../../utils/logger');
const { HOMESTAY_STATUS, ROLES } = require('../../config/constants');
const { createSafeRegex } = require('../../utils/regex.util');
const { verifyHomestayOwnership } = require('../../utils/ownership.util');
const { createPaginationMeta, parseSortParam } = require('../../utils/pagination.util');
const { findByIdOrFail } = require('../../utils/resource.util');

class HomestayService {
  /**
   * Create new homestay
   */
  async createHomestay(hostId, homestayData) {
    // Verify user is a host
    const user = await User.findById(hostId);
    if (!user || (user.role !== ROLES.HOST && user.role !== ROLES.ADMIN)) {
      throw new ForbiddenError('Only hosts can create homestays');
    }

    // Verify amenities exist
    if (homestayData.amenities && homestayData.amenities.length > 0) {
      const amenities = await Amenity.find({ _id: { $in: homestayData.amenities } });
      if (amenities.length !== homestayData.amenities.length) {
        throw new BadRequestError('Some amenities do not exist');
      }
    }

    const homestay = await Homestay.create({
      ...homestayData,
      hostId,
      status: HOMESTAY_STATUS.DRAFT,
    });

    logger.info(`Homestay created: ${homestay._id} by host: ${hostId}`);

    return homestay;
  }

  /**
   * Upload images for homestay
   */
  async uploadImages(homestayId, hostId, fileBuffers) {
    const homestay = await findByIdOrFail(Homestay, homestayId, 'Homestay');

    // Check ownership
    verifyHomestayOwnership(homestay, hostId);

    try {
      // Upload images to Cloudinary
      const uploadResults = await uploadMultipleImages(fileBuffers, `homestays/${homestayId}`);

      // Add images to homestay
      const newImages = uploadResults.map((result, index) => ({
        url: result.url,
        publicId: result.publicId,
        order: homestay.images.length + index,
      }));

      homestay.images.push(...newImages);
      await homestay.save();

      logger.info(`${uploadResults.length} images uploaded for homestay: ${homestayId}`);

      return homestay;
    } catch (error) {
      logger.error(`Image upload failed for homestay ${homestayId}: ${error.message}`);
      throw new BadRequestError('Failed to upload images');
    }
  }

  /**
   * Delete image from homestay
   */
  async deleteImage(homestayId, hostId, imageIndex) {
    const homestay = await findByIdOrFail(Homestay, homestayId, 'Homestay');

    verifyHomestayOwnership(homestay, hostId);

    if (!homestay.images[imageIndex]) {
      throw new BadRequestError('Image not found');
    }

    const image = homestay.images[imageIndex];

    try {
      // Delete from Cloudinary
      if (image.publicId) {
        await deleteMultipleImages([image.publicId]);
      }

      // Remove from array
      homestay.images.splice(imageIndex, 1);
      await homestay.save();

      logger.info(`Image deleted from homestay: ${homestayId}`);

      return homestay;
    } catch (error) {
      logger.error(`Image deletion failed: ${error.message}`);
      throw new BadRequestError('Failed to delete image');
    }
  }

  /**
   * Get homestay by ID
   */
  async getHomestayById(homestayId, userId = null) {
    const homestay = await findByIdOrFail(Homestay, homestayId, 'Homestay', {
      populate: [
        { path: 'hostId', select: 'profile.firstName profile.lastName profile.avatar hostProfile email' },
        { path: 'amenities', select: 'name slug icon category' },
      ],
    });

    // Only show active homestays to guests, or owner/admin can see all
    if (homestay.status !== HOMESTAY_STATUS.ACTIVE) {
      if (!userId || homestay.hostId._id.toString() !== userId.toString()) {
        throw new NotFoundError('Homestay');
      }
    }

    // Increment view count (don't await)
    homestay.incrementViewCount().catch((err) => logger.error('Failed to increment view count:', err));

    return homestay;
  }

  /**
   * Update homestay
   */
  async updateHomestay(homestayId, hostId, updateData) {
    const homestay = await findByIdOrFail(Homestay, homestayId, 'Homestay');

    verifyHomestayOwnership(homestay, hostId);

    // Verify amenities if updated
    if (updateData.amenities && updateData.amenities.length > 0) {
      const amenities = await Amenity.find({ _id: { $in: updateData.amenities } });
      if (amenities.length !== updateData.amenities.length) {
        throw new BadRequestError('Some amenities do not exist');
      }
    }

    Object.assign(homestay, updateData);
    await homestay.save();

    logger.info(`Homestay updated: ${homestayId}`);

    return homestay;
  }

  /**
   * Delete homestay
   */
  async deleteHomestay(homestayId, hostId) {
    const homestay = await findByIdOrFail(Homestay, homestayId, 'Homestay');

    verifyHomestayOwnership(homestay, hostId);

    // Soft delete by changing status
    homestay.status = HOMESTAY_STATUS.DELETED;
    await homestay.save();

    logger.info(`Homestay deleted: ${homestayId}`);

    return true;
  }

  /**
   * Get host's homestays
   */
  async getHostHomestays(hostId, filters = {}) {
    const { page = 1, limit = 20, status } = filters;

    const query = { hostId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [homestays, total] = await Promise.all([
      Homestay.find(query)
        .populate('amenities', 'name icon')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 }),
      Homestay.countDocuments(query),
    ]);

    return {
      homestays,
      pagination: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Submit homestay for verification
   */
  async submitForVerification(homestayId, hostId) {
    const homestay = await findByIdOrFail(Homestay, homestayId, 'Homestay');

    verifyHomestayOwnership(homestay, hostId);

    // Validate homestay has minimum requirements
    if (!homestay.images || homestay.images.length < 3) {
      throw new BadRequestError('Homestay must have at least 3 images');
    }

    homestay.status = HOMESTAY_STATUS.PENDING;
    homestay.verificationStatus = 'pending';
    await homestay.save();

    logger.info(`Homestay submitted for verification: ${homestayId}`);

    return homestay;
  }

  /**
   * Search and filter homestays
   */
  async searchHomestays(searchParams) {
    const {
      location,
      city,
      country,
      checkIn,
      checkOut,
      guests,
      minPrice,
      maxPrice,
      propertyType,
      amenities,
      minRating,
      instantBook,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = searchParams;

    const query = { status: HOMESTAY_STATUS.ACTIVE };

    // Location search (using safe regex to prevent ReDoS)
    if (city) query['location.city'] = createSafeRegex(city);
    if (country) query['location.country'] = createSafeRegex(country);
    if (location) {
      query.$or = [
        { 'location.city': createSafeRegex(location) },
        { 'location.country': createSafeRegex(location) },
        { 'location.address': createSafeRegex(location) },
      ];
    }

    // Capacity
    if (guests) query['capacity.guests'] = { $gte: parseInt(guests, 10) };

    // Price range
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }

    // Property type
    if (propertyType) query.propertyType = propertyType;

    // Amenities
    if (amenities) {
      const amenityArray = Array.isArray(amenities) ? amenities : amenities.split(',');
      query.amenities = { $all: amenityArray };
    }

    // Rating
    if (minRating) query['stats.averageRating'] = { $gte: parseFloat(minRating) };

    // Instant book
    if (instantBook === 'true' || instantBook === true) {
      query['availability.instantBook'] = true;
    }

    // Date availability (if provided)
    if (checkIn && checkOut) {
      // TODO: Add booking conflict check
      // For now, just filter by unavailable dates
      query['availability.unavailableDates'] = {
        $not: {
          $elemMatch: {
            $gte: new Date(checkIn),
            $lte: new Date(checkOut),
          },
        },
      };
    }

    const skip = (page - 1) * limit;
    const sortObj = parseSortParam(sort);

    const [homestays, total] = await Promise.all([
      Homestay.find(query)
        .populate('hostId', 'profile.firstName profile.lastName profile.avatar hostProfile')
        .populate('amenities', 'name slug icon')
        .select('-availability.unavailableDates')
        .limit(limit)
        .skip(skip)
        .sort(sortObj),
      Homestay.countDocuments(query),
    ]);

    return {
      homestays,
      pagination: createPaginationMeta(page, limit, total),
      filters: searchParams,
    };
  }

  /**
   * Admin: Get pending homestays
   */
  async getPendingHomestays(pagination = {}) {
    const { page = 1, limit = 20 } = pagination;

    const query = { status: HOMESTAY_STATUS.PENDING, verificationStatus: 'pending' };
    const skip = (page - 1) * limit;

    const [homestays, total] = await Promise.all([
      Homestay.find(query)
        .populate('hostId', 'profile.firstName profile.lastName email')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 }),
      Homestay.countDocuments(query),
    ]);

    return {
      homestays,
      pagination: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Admin: Approve homestay
   */
  async approveHomestay(homestayId) {
    const homestay = await findByIdOrFail(Homestay, homestayId, 'Homestay');

    homestay.status = HOMESTAY_STATUS.ACTIVE;
    homestay.verificationStatus = 'approved';
    homestay.publishedAt = new Date();
    homestay.rejectionReason = undefined;
    await homestay.save();

    logger.info(`Homestay approved: ${homestayId}`);

    return homestay;
  }

  /**
   * Admin: Reject homestay
   */
  async rejectHomestay(homestayId, reason) {
    const homestay = await findByIdOrFail(Homestay, homestayId, 'Homestay');

    homestay.status = HOMESTAY_STATUS.DRAFT;
    homestay.verificationStatus = 'rejected';
    homestay.rejectionReason = reason;
    await homestay.save();

    logger.info(`Homestay rejected: ${homestayId}`);

    return homestay;
  }
}

module.exports = new HomestayService();
