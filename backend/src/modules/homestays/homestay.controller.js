const homestayService = require('./homestay.service');
const ApiResponse = require('../../utils/apiResponse');
const catchAsync = require('../../utils/catchAsync');
const { BadRequestError } = require('../../utils/apiError');

class HomestayController {
  /**
   * Create new homestay
   * POST /api/v1/homestays
   */
  createHomestay = catchAsync(async (req, res) => {
    const homestayData = req.body;
    console.log('📥 Received homestayData:', Object.keys(homestayData));

    // Transform FormData flat structure to nested objects
    if (homestayData['location[city]']) {
      homestayData.location = {
        city: homestayData['location[city]'],
        address: homestayData['location[address]'],
        country: homestayData['location[country]'] || 'Vietnam',
        coordinates: {
          type: 'Point',
          coordinates: [105.8342, 21.0278], // Default to Hanoi
        },
      };
      if (homestayData['location[district]']) {
        homestayData.location.district = homestayData['location[district]'];
        delete homestayData['location[district]'];
      }
      delete homestayData['location[city]'];
      delete homestayData['location[address]'];
      delete homestayData['location[country]'];
    }

    // Handle capacity - support both flat structure (capacity[maxGuests]) and nested object (capacity.maxGuests)
    if (homestayData['capacity[guests]'] || homestayData['capacity[maxGuests]']) {
      // Flat structure from FormData
      const guests = parseInt(homestayData['capacity[guests]'] || homestayData['capacity[maxGuests]']) || 1;
      const bedrooms = parseInt(homestayData['capacity[bedrooms]']) || 1;
      const bathrooms = parseFloat(homestayData['capacity[bathrooms]']) || 1;
      const beds = parseInt(homestayData['capacity[beds]']) || bedrooms;

      console.log('🔧 Capacity transform (flat):', { guests, bedrooms, bathrooms, beds });

      homestayData.capacity = {
        guests: guests,
        bedrooms: bedrooms,
        beds: beds,
        bathrooms: bathrooms,
      };
      delete homestayData['capacity[maxGuests]'];
      delete homestayData['capacity[guests]'];
      delete homestayData['capacity[bedrooms]'];
      delete homestayData['capacity[beds]'];
      delete homestayData['capacity[bathrooms]'];
    } else if (homestayData.capacity && typeof homestayData.capacity === 'object') {
      // Nested object from express.urlencoded({ extended: true })
      const guests = parseInt(homestayData.capacity.maxGuests || homestayData.capacity.guests) || 1;
      const bedrooms = parseInt(homestayData.capacity.bedrooms) || 1;
      const bathrooms = parseFloat(homestayData.capacity.bathrooms) || 1;
      const beds = parseInt(homestayData.capacity.beds) || bedrooms;

      console.log('🔧 Capacity transform (nested):', { guests, bedrooms, bathrooms, beds });

      homestayData.capacity = {
        guests: guests,
        bedrooms: bedrooms,
        beds: beds,
        bathrooms: bathrooms,
      };
    }

    console.log('✅ Final homestayData.capacity:', homestayData.capacity);

    // Handle pricing - support both flat structure and nested object
    if (homestayData['pricing[basePrice]']) {
      // Flat structure
      homestayData.pricing = {
        basePrice: parseFloat(homestayData['pricing[basePrice]']),
        currency: homestayData['pricing[currency]'] || 'VND',
      };
      delete homestayData['pricing[basePrice]'];
      delete homestayData['pricing[currency]'];
    } else if (homestayData.pricing && typeof homestayData.pricing === 'object') {
      // Nested object - ensure basePrice is a number
      homestayData.pricing = {
        basePrice: parseFloat(homestayData.pricing.basePrice),
        currency: homestayData.pricing.currency || 'VND',
      };
    }

    // Handle location - support both flat structure and nested object
    if (!homestayData.location || !homestayData.location.coordinates) {
      // Ensure coordinates exist
      if (!homestayData.location) {
        homestayData.location = {};
      }
      if (!homestayData.location.coordinates) {
        homestayData.location.coordinates = {
          type: 'Point',
          coordinates: [105.8342, 21.0278], // Default to Hanoi
        };
      }
      if (!homestayData.location.country) {
        homestayData.location.country = 'Vietnam';
      }
    }

    // Set default propertyType if not provided
    if (!homestayData.propertyType) {
      homestayData.propertyType = 'entire_place';
    }

    // Handle amenities - convert from array of strings to amenityNames
    if (homestayData.amenities) {
      if (Array.isArray(homestayData.amenities)) {
        homestayData.amenityNames = homestayData.amenities;
      } else if (typeof homestayData.amenities === 'string') {
        // If sent as comma-separated string
        homestayData.amenityNames = homestayData.amenities.split(',').map(a => a.trim()).filter(Boolean);
      }
      delete homestayData.amenities; // Remove amenities, use amenityNames instead
    }

    console.log('✅ Final amenityNames:', homestayData.amenityNames);

    // Handle file uploads
    if (req.files) {
      if (req.files.coverImage && req.files.coverImage[0]) {
        homestayData.coverImageBuffer = req.files.coverImage[0].buffer;
      }
      if (req.files.images && req.files.images.length > 0) {
        homestayData.imagesBuffers = req.files.images.map(file => file.buffer);
      }
    }

    const homestay = await homestayService.createHomestay(req.user._id, homestayData);
    ApiResponse.created(res, { homestay }, 'Homestay created successfully');
  });

  /**
   * Upload images
   * POST /api/v1/homestays/:id/images
   */
  uploadImages = catchAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new BadRequestError('Please upload at least one image');
    }

    const fileBuffers = req.files.map((file) => file.buffer);
    const homestay = await homestayService.uploadImages(req.params.id, req.user._id, req.user.role, fileBuffers);

    ApiResponse.success(res, { homestay }, 'Images uploaded successfully');
  });

  /**
   * Delete image
   * DELETE /api/v1/homestays/:id/images/:imageIndex
   */
  deleteImage = catchAsync(async (req, res) => {
    const { imageIndex } = req.params;
    const homestay = await homestayService.deleteImage(
      req.params.id,
      req.user._id,
      req.user.role,
      parseInt(imageIndex, 10),
    );

    ApiResponse.success(res, { homestay }, 'Image deleted successfully');
  });

  /**
   * Get homestay by ID
   * GET /api/v1/homestays/:id
   */
  getHomestayById = catchAsync(async (req, res) => {
    const homestay = await homestayService.getHomestayById(req.params.id, req.user?._id);
    ApiResponse.success(res, { homestay }, 'Homestay retrieved successfully');
  });

  /**
   * Update homestay
   * PUT /api/v1/homestays/:id
   */
  updateHomestay = catchAsync(async (req, res) => {
    const homestayData = req.body;

    // Transform FormData flat structure to nested objects
    if (homestayData['location[city]']) {
      homestayData.location = {
        city: homestayData['location[city]'],
        address: homestayData['location[address]'],
        country: homestayData['location[country]'] || 'Vietnam',
      };
      delete homestayData['location[city]'];
      delete homestayData['location[address]'];
      delete homestayData['location[country]'];
    }

    if (homestayData['capacity[maxGuests]']) {
      const maxGuests = parseInt(homestayData['capacity[maxGuests]']);
      const bedrooms = parseInt(homestayData['capacity[bedrooms]']);
      const bathrooms = parseFloat(homestayData['capacity[bathrooms]']);
      const beds = parseInt(homestayData['capacity[beds]']) || bedrooms || 1;

      homestayData.capacity = {
        guests: maxGuests,
        bedrooms: bedrooms,
        beds: beds,
        bathrooms: bathrooms,
      };
      delete homestayData['capacity[maxGuests]'];
      delete homestayData['capacity[guests]'];
      delete homestayData['capacity[bedrooms]'];
      delete homestayData['capacity[beds]'];
      delete homestayData['capacity[bathrooms]'];
    }

    if (homestayData['pricing[basePrice]']) {
      homestayData.pricing = {
        basePrice: parseFloat(homestayData['pricing[basePrice]']),
        currency: homestayData['pricing[currency]'] || 'VND',
      };
      delete homestayData['pricing[basePrice]'];
      delete homestayData['pricing[currency]'];
    }

    // Handle amenities - convert from array of strings to amenityNames
    if (homestayData.amenities) {
      if (Array.isArray(homestayData.amenities)) {
        homestayData.amenityNames = homestayData.amenities;
      } else if (typeof homestayData.amenities === 'string') {
        homestayData.amenityNames = homestayData.amenities.split(',').map(a => a.trim()).filter(Boolean);
      }
      delete homestayData.amenities;
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.coverImage && req.files.coverImage[0]) {
        homestayData.coverImageBuffer = req.files.coverImage[0].buffer;
      }
      if (req.files.images && req.files.images.length > 0) {
        homestayData.imagesBuffers = req.files.images.map(file => file.buffer);
      }
    }

    const homestay = await homestayService.updateHomestay(req.params.id, req.user._id, req.user.role, homestayData);
    ApiResponse.success(res, { homestay }, 'Homestay updated successfully');
  });

  /**
   * Delete homestay
   * DELETE /api/v1/homestays/:id
   */
  deleteHomestay = catchAsync(async (req, res) => {
    await homestayService.deleteHomestay(req.params.id, req.user._id, req.user.role);
    ApiResponse.success(res, null, 'Homestay deleted successfully');
  });

  /**
   * Get host's homestays
   * GET /api/v1/homestays/my-listings
   */
  getMyListings = catchAsync(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await homestayService.getHostHomestays(req.user._id, { page, limit, status });

    ApiResponse.success(
      res,
      result.homestays,
      'Homestays retrieved successfully',
      200,
      { pagination: result.pagination },
    );
  });

  /**
   * Submit for verification
   * POST /api/v1/homestays/:id/submit
   */
  submitForVerification = catchAsync(async (req, res) => {
    const homestay = await homestayService.submitForVerification(req.params.id, req.user._id, req.user.role);
    ApiResponse.success(res, { homestay }, 'Homestay submitted for verification');
  });

  /**
   * Search homestays
   * GET /api/v1/homestays
   */
  searchHomestays = catchAsync(async (req, res) => {
    const result = await homestayService.searchHomestays(req.query);

    ApiResponse.success(
      res,
      result.homestays,
      'Homestays retrieved successfully',
      200,
      {
        pagination: result.pagination,
        filters: result.filters,
      },
    );
  });

  /**
   * Get pending homestays (Admin)
   * GET /api/v1/admin/homestays/pending
   */
  getPendingHomestays = catchAsync(async (req, res) => {
    const { page, limit } = req.query;
    const result = await homestayService.getPendingHomestays({ page, limit });

    ApiResponse.success(
      res,
      result.homestays,
      'Pending homestays retrieved successfully',
      200,
      { pagination: result.pagination },
    );
  });

  /**
   * Approve homestay (Admin)
   * PATCH /api/v1/admin/homestays/:id/approve
   */
  approveHomestay = catchAsync(async (req, res) => {
    const homestay = await homestayService.approveHomestay(req.params.id);
    ApiResponse.success(res, { homestay }, 'Homestay approved successfully');
  });

  /**
   * Reject homestay (Admin)
   * PATCH /api/v1/admin/homestays/:id/reject
   */
  rejectHomestay = catchAsync(async (req, res) => {
    const { rejectionReason } = req.body;
    const homestay = await homestayService.rejectHomestay(req.params.id, rejectionReason);
    ApiResponse.success(res, { homestay }, 'Homestay rejected');
  });
}

module.exports = new HomestayController();
