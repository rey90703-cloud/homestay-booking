const express = require('express');
const Amenity = require('../../models/amenity.model');
const ApiResponse = require('../../utils/apiResponse');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

/**
 * Get all amenities
 * GET /api/v1/amenities
 */
router.get(
  '/',
  catchAsync(async (req, res) => {
    const { category } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;

    const amenities = await Amenity.find(query).sort({ category: 1, name: 1 });

    // Group by category
    const groupedAmenities = amenities.reduce((acc, amenity) => {
      if (!acc[amenity.category]) {
        acc[amenity.category] = [];
      }
      acc[amenity.category].push(amenity);
      return acc;
    }, {});

    ApiResponse.success(res, { amenities, groupedAmenities }, 'Amenities retrieved successfully');
  }),
);

/**
 * Get amenity by ID
 * GET /api/v1/amenities/:id
 */
router.get(
  '/:id',
  catchAsync(async (req, res) => {
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
      return ApiResponse.error(res, 'Amenity not found', 404);
    }

    ApiResponse.success(res, { amenity }, 'Amenity retrieved successfully');
  }),
);

module.exports = router;
