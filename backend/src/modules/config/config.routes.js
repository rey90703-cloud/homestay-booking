const express = require('express');
const configController = require('./config.controller');

const router = express.Router();

/**
 * @route   GET /api/v1/config/public
 * @desc    Get public configuration
 * @access  Public
 */
router.get('/public', configController.getPublicConfig);

/**
 * @route   POST /api/v1/config/maps/embed
 * @desc    Generate Google Maps embed URL
 * @access  Public
 */
router.post('/maps/embed', configController.generateMapEmbedUrl);

/**
 * @route   POST /api/v1/config/maps/directions
 * @desc    Generate Google Maps directions URLs
 * @access  Public
 */
router.post('/maps/directions', configController.generateDirectionsUrl);

module.exports = router;
