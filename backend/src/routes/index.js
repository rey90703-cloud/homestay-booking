const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const homestayRoutes = require('../modules/homestays/homestay.routes');
const amenityRoutes = require('../modules/homestays/amenity.routes');
const bookingRoutes = require('../modules/bookings/booking.routes');
const contactRoutes = require('../modules/contacts/contact.routes');

const router = express.Router();

/**
 * API Version 1 Routes
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/homestays', homestayRoutes);
router.use('/amenities', amenityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/contacts', contactRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
