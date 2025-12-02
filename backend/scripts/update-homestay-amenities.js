require('dotenv').config();
const mongoose = require('mongoose');
const Homestay = require('../src/modules/homestays/homestay.model');
const Amenity = require('../src/models/amenity.model');
const logger = require('../src/utils/logger');

/**
 * Script to update existing homestays with amenities based on their amenityNames
 * This ensures the amenities field (ObjectId references) is populated correctly
 */
async function updateHomestayAmenities() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Get all amenities for mapping
    const allAmenities = await Amenity.find({});
    logger.info(`📋 Found ${allAmenities.length} amenities in database`);

    // Create mapping from name to ID
    const amenityNameToId = {};
    allAmenities.forEach(amenity => {
      amenityNameToId[amenity.name] = amenity._id;
    });

    // Get all homestays
    const homestays = await Homestay.find({});
    logger.info(`🏠 Found ${homestays.length} homestays to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const homestay of homestays) {
      // Skip if already has amenities
      if (homestay.amenities && homestay.amenities.length > 0) {
        logger.info(`⏭️  Skipping ${homestay.title} - already has ${homestay.amenities.length} amenities`);
        skippedCount++;
        continue;
      }

      // Map amenityNames to amenity IDs
      if (homestay.amenityNames && homestay.amenityNames.length > 0) {
        const amenityIds = homestay.amenityNames
          .map(name => amenityNameToId[name])
          .filter(id => id !== undefined);

        if (amenityIds.length > 0) {
          homestay.amenities = amenityIds;
          await homestay.save();
          logger.info(`✅ Updated ${homestay.title} with ${amenityIds.length} amenities`);
          updatedCount++;
        } else {
          logger.warn(`⚠️  No matching amenities found for ${homestay.title}`);
        }
      } else {
        logger.warn(`⚠️  ${homestay.title} has no amenityNames`);
      }
    }

    logger.info(`\n📊 Summary:`);
    logger.info(`   - Total homestays: ${homestays.length}`);
    logger.info(`   - Updated: ${updatedCount}`);
    logger.info(`   - Skipped (already has amenities): ${skippedCount}`);
    logger.info(`   - No amenities: ${homestays.length - updatedCount - skippedCount}`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error updating homestay amenities:', error);
    process.exit(1);
  }
}

updateHomestayAmenities();
