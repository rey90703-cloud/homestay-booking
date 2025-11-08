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
    const homestay = await homestayService.createHomestay(req.user._id, req.body);
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
    const homestay = await homestayService.uploadImages(req.params.id, req.user._id, fileBuffers);

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
    const homestay = await homestayService.updateHomestay(req.params.id, req.user._id, req.body);
    ApiResponse.success(res, { homestay }, 'Homestay updated successfully');
  });

  /**
   * Delete homestay
   * DELETE /api/v1/homestays/:id
   */
  deleteHomestay = catchAsync(async (req, res) => {
    await homestayService.deleteHomestay(req.params.id, req.user._id);
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
    const homestay = await homestayService.submitForVerification(req.params.id, req.user._id);
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
