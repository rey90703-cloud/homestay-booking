require('dotenv').config();
const mongoose = require('mongoose');
const Homestay = require('../src/modules/homestays/homestay.model');
const logger = require('../src/utils/logger');

/**
 * Test script to verify rating filter logic
 * Homestays without reviews should be treated as 5 stars
 */
async function testRatingFilter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Get all active homestays
    const allHomestays = await Homestay.find({ status: 'active' })
      .select('title stats.averageRating stats.totalReviews');
    
    logger.info(`\n📊 All Active Homestays (${allHomestays.length}):`);
    allHomestays.forEach(h => {
      const rating = h.stats?.averageRating || 0;
      const reviews = h.stats?.totalReviews || 0;
      logger.info(`   - ${h.title}: ${rating} ⭐ (${reviews} reviews)`);
    });

    // Test filter: minRating = 4.5
    const minRating = 4.5;
    logger.info(`\n🔍 Testing filter: minRating >= ${minRating}`);
    
    const filteredHomestays = await Homestay.find({
      status: 'active',
      $or: [
        { 'stats.averageRating': { $gte: minRating } },
        { 'stats.averageRating': { $eq: 0 } },
        { 'stats.averageRating': { $exists: false } },
        { 'stats.totalReviews': { $eq: 0 } },
        { 'stats.totalReviews': { $exists: false } },
      ]
    }).select('title stats.averageRating stats.totalReviews');

    logger.info(`\n✅ Filtered Results (${filteredHomestays.length}):`);
    filteredHomestays.forEach(h => {
      const rating = h.stats?.averageRating || 0;
      const reviews = h.stats?.totalReviews || 0;
      const reason = rating >= minRating ? 'Has good rating' : 'No reviews (treated as 5⭐)';
      logger.info(`   - ${h.title}: ${rating} ⭐ (${reviews} reviews) - ${reason}`);
    });

    logger.info(`\n📈 Summary:`);
    logger.info(`   - Total active homestays: ${allHomestays.length}`);
    logger.info(`   - Matching filter (>= ${minRating} or no reviews): ${filteredHomestays.length}`);
    logger.info(`   - Excluded: ${allHomestays.length - filteredHomestays.length}`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  }
}

testRatingFilter();
