require('dotenv').config();
const mongoose = require('mongoose');
const Amenity = require('../src/models/amenity.model');
const logger = require('../src/utils/logger');

const amenitiesData = [
  // Basic amenities
  { name: 'WiFi', slug: 'wifi', icon: 'FaWifi', category: 'basic' },
  { name: 'TV', slug: 'tv', icon: 'FaTv', category: 'basic' },
  { name: 'Bếp', slug: 'kitchen', icon: 'FaKitchenSet', category: 'basic' },
  { name: 'Máy giặt', slug: 'washing-machine', icon: 'MdLocalLaundryService', category: 'basic' },
  
  // Features
  { name: 'Điều hòa', slug: 'air-conditioning', icon: 'FaSnowflake', category: 'features' },
  { name: 'Sưởi ấm', slug: 'heating', icon: 'FaFire', category: 'features' },
  { name: 'Không gian làm việc', slug: 'workspace', icon: 'FaBriefcase', category: 'features' },
  { name: 'Hồ bơi', slug: 'pool', icon: 'FaSwimmer', category: 'features' },
  { name: 'Phòng gym', slug: 'gym', icon: 'FaDumbbell', category: 'features' },
  { name: 'Đỗ xe miễn phí', slug: 'parking', icon: 'FaParking', category: 'features' },
  { name: 'Ban công', slug: 'balcony', icon: 'FaBuilding', category: 'features' },
  { name: 'Vườn', slug: 'garden', icon: 'FaSeedling', category: 'location' },
];

async function seedAmenities() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Clear existing amenities
    await Amenity.deleteMany({});
    logger.info('🗑️  Cleared existing amenities');

    // Insert new amenities
    const createdAmenities = await Amenity.insertMany(amenitiesData);
    logger.info(`✅ Created ${createdAmenities.length} amenities:`);
    
    createdAmenities.forEach(amenity => {
      logger.info(`   - ${amenity.name} (slug: ${amenity.slug})`);
    });

    logger.info('✅ Amenities seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding amenities:', error);
    process.exit(1);
  }
}

seedAmenities();
