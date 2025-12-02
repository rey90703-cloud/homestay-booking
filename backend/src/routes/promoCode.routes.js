const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCode.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

// Public routes
router.get('/active', promoCodeController.getActivePromoCodes);
router.post('/validate', promoCodeController.validatePromoCode);

// Protected routes (require authentication)
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), promoCodeController.getAllPromoCodes);
router.post('/', authorize('admin'), promoCodeController.createPromoCode);
router.get('/:id', authorize('admin'), promoCodeController.getPromoCode);
router.put('/:id', authorize('admin'), promoCodeController.updatePromoCode);
router.delete('/:id', authorize('admin'), promoCodeController.deletePromoCode);
router.patch('/:id/toggle', authorize('admin'), promoCodeController.togglePromoCodeStatus);
router.post('/apply', promoCodeController.applyPromoCode);

module.exports = router;
