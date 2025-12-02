const PromoCode = require('../models/promoCode.model');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// Get active promo codes (Public - for display on website)
exports.getActivePromoCodes = catchAsync(async (req, res) => {
  const promoCodes = await PromoCode.find({ 
    isActive: true,
    $or: [
      { validUntil: { $gte: new Date() } },
      { validUntil: null }
    ]
  })
    .sort('-createdAt')
    .select('-createdBy -__v'); // Don't expose creator info
  
  return ApiResponse.success(res, promoCodes, 'Lấy danh sách mã giảm giá thành công');
});

// Get all promo codes (Admin)
exports.getAllPromoCodes = catchAsync(async (req, res) => {
  const { isActive, sortBy = '-createdAt' } = req.query;
  
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  const promoCodes = await PromoCode.find(filter)
    .sort(sortBy)
    .populate('createdBy', 'name email');
  
  return ApiResponse.success(res, promoCodes, 'Lấy danh sách mã giảm giá thành công');
});

// Get single promo code
exports.getPromoCode = catchAsync(async (req, res) => {
  const promoCode = await PromoCode.findById(req.params.id);
  
  if (!promoCode) {
    throw new ApiError(404, 'Không tìm thấy mã giảm giá');
  }
  
  return ApiResponse.success(res, promoCode, 'Lấy thông tin mã giảm giá thành công');
});

// Create promo code (Admin)
exports.createPromoCode = catchAsync(async (req, res) => {
  const {
    code,
    name,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    validFrom,
    validUntil,
    conditions,
    isActive,
  } = req.body;
  
  // Check if code already exists
  const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
  if (existingCode) {
    throw new ApiError(400, 'Mã giảm giá đã tồn tại');
  }
  
  const promoCode = await PromoCode.create({
    code: code.toUpperCase(),
    name,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    validFrom,
    validUntil,
    conditions,
    isActive,
    createdBy: req.user._id,
  });
  
  return ApiResponse.created(res, promoCode, 'Tạo mã giảm giá thành công');
});

// Update promo code (Admin)
exports.updatePromoCode = catchAsync(async (req, res) => {
  const promoCode = await PromoCode.findById(req.params.id);
  
  if (!promoCode) {
    throw new ApiError(404, 'Không tìm thấy mã giảm giá');
  }
  
  // Check if updating code and it already exists
  if (req.body.code && req.body.code.toUpperCase() !== promoCode.code) {
    const existingCode = await PromoCode.findOne({ code: req.body.code.toUpperCase() });
    if (existingCode) {
      throw new ApiError(400, 'Mã giảm giá đã tồn tại');
    }
  }
  
  const allowedUpdates = [
    'code',
    'name',
    'description',
    'discountType',
    'discountValue',
    'minOrderAmount',
    'maxDiscount',
    'usageLimit',
    'validFrom',
    'validUntil',
    'conditions',
    'isActive',
  ];
  
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'code') {
        promoCode[field] = req.body[field].toUpperCase();
      } else {
        promoCode[field] = req.body[field];
      }
    }
  });
  
  await promoCode.save();
  
  return ApiResponse.success(res, promoCode, 'Cập nhật mã giảm giá thành công');
});

// Delete promo code (Admin)
exports.deletePromoCode = catchAsync(async (req, res) => {
  const promoCode = await PromoCode.findById(req.params.id);
  
  if (!promoCode) {
    throw new ApiError(404, 'Không tìm thấy mã giảm giá');
  }
  
  await promoCode.deleteOne();
  
  return ApiResponse.success(res, null, 'Xóa mã giảm giá thành công');
});

// Toggle active status (Admin)
exports.togglePromoCodeStatus = catchAsync(async (req, res) => {
  const promoCode = await PromoCode.findById(req.params.id);
  
  if (!promoCode) {
    throw new ApiError(404, 'Không tìm thấy mã giảm giá');
  }
  
  promoCode.isActive = !promoCode.isActive;
  await promoCode.save();
  
  return ApiResponse.success(res, promoCode, 'Cập nhật trạng thái thành công');
});

// Validate promo code (Public - for checkout)
exports.validatePromoCode = catchAsync(async (req, res) => {
  const { code, orderAmount } = req.body;
  
  if (!code || !orderAmount) {
    throw new ApiError(400, 'Thiếu thông tin mã giảm giá hoặc giá trị đơn hàng');
  }
  
  const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });
  
  if (!promoCode) {
    throw new ApiError(404, 'Mã giảm giá không tồn tại');
  }
  
  if (!promoCode.isValid()) {
    throw new ApiError(400, 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
  }
  
  if (orderAmount < promoCode.minOrderAmount) {
    throw new ApiError(400, `Đơn hàng tối thiểu ${promoCode.minOrderAmount.toLocaleString('vi-VN')}đ`);
  }
  
  const discount = promoCode.calculateDiscount(orderAmount);
  
  return ApiResponse.success(
    res,
    {
      code: promoCode.code,
      name: promoCode.name,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      discount,
      finalAmount: orderAmount - discount,
    },
    'Mã giảm giá hợp lệ'
  );
});

// Apply promo code (called when booking is confirmed)
exports.applyPromoCode = catchAsync(async (req, res) => {
  const { code } = req.body;
  
  const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });
  
  if (!promoCode) {
    throw new ApiError(404, 'Mã giảm giá không tồn tại');
  }
  
  if (!promoCode.isValid()) {
    throw new ApiError(400, 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
  }
  
  promoCode.usedCount += 1;
  await promoCode.save();
  
  return ApiResponse.success(res, promoCode, 'Áp dụng mã giảm giá thành công');
});
