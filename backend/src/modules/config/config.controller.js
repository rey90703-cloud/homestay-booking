const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/apiResponse');

class ConfigController {
  /**
   * Get public configuration (NO sensitive data)
   * GET /api/v1/config/public
   */
  getPublicConfig = catchAsync(async (req, res) => {
    const config = {
      // Only return non-sensitive config
      appName: 'Homestay Booking',
      version: '1.0.0',
    };

    ApiResponse.success(res, config, 'Public configuration retrieved successfully');
  });

  /**
   * Generate Google Maps embed URL
   * POST /api/v1/config/maps/embed
   */
  generateMapEmbedUrl = catchAsync(async (req, res) => {
    const { lat, lng, zoom = 15 } = req.body;

    if (!lat || !lng) {
      return ApiResponse.error(res, 'Latitude and longitude are required', 400);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return ApiResponse.error(res, 'Maps service not configured', 500);
    }

    const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=${zoom}&language=vi`;

    ApiResponse.success(res, { embedUrl }, 'Map embed URL generated successfully');
  });

  /**
   * Generate Google Maps directions URL
   * POST /api/v1/config/maps/directions
   */
  generateDirectionsUrl = catchAsync(async (req, res) => {
    const { lat, lng, placeId } = req.body;

    if (!lat || !lng) {
      return ApiResponse.error(res, 'Latitude and longitude are required', 400);
    }

    // Use Place ID for viewing (works for all place types)
    // But use coordinates for directions (more reliable)
    let directionsUrl, viewUrl;
    
    if (placeId) {
      // Place ID for viewing provides direct link to place with full info
      viewUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
      // Coordinates for directions (more reliable than Place ID)
      directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      // Fallback to coordinates for both
      directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      viewUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    ApiResponse.success(
      res,
      {
        directionsUrl,
        viewUrl,
        usedPlaceId: !!placeId,
      },
      'Directions URLs generated successfully'
    );
  });
}

module.exports = new ConfigController();
