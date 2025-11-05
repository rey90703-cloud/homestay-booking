require('dotenv').config();
const mongoose = require('mongoose');
const Amenity = require('../src/models/amenity.model');
const logger = require('../src/utils/logger');

// Helper function to generate slug
const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const amenities = [
  // Basic Amenities
  {
    name: 'Wifi', slug: 'wifi', category: 'basic', icon: '📶', description: 'Wireless internet connection',
  },
  {
    name: 'TV', slug: 'tv', category: 'basic', icon: '📺', description: 'Television',
  },
  {
    name: 'Kitchen', slug: 'kitchen', category: 'basic', icon: '🍳', description: 'Full kitchen',
  },
  {
    name: 'Washing Machine', slug: 'washing-machine', category: 'basic', icon: '🧺', description: 'Washing machine',
  },
  {
    name: 'Air Conditioning', slug: 'air-conditioning', category: 'basic', icon: '❄️', description: 'Air conditioning',
  },
  {
    name: 'Heating', slug: 'heating', category: 'basic', icon: '🔥', description: 'Heating system',
  },
  {
    name: 'Workspace', slug: 'workspace', category: 'basic', icon: '💼', description: 'Dedicated workspace',
  },

  // Features
  {
    name: 'Pool', slug: 'pool', category: 'features', icon: '🏊', description: 'Swimming pool',
  },
  {
    name: 'Hot Tub', slug: 'hot-tub', category: 'features', icon: '🛁', description: 'Hot tub',
  },
  {
    name: 'Free Parking', slug: 'free-parking', category: 'features', icon: '🅿️', description: 'Free parking on premises',
  },
  {
    name: 'EV Charger', slug: 'ev-charger', category: 'features', icon: '🔌', description: 'Electric vehicle charger',
  },
  {
    name: 'Gym', slug: 'gym', category: 'features', icon: '🏋️', description: 'Gym or fitness center',
  },
  {
    name: 'BBQ Grill', slug: 'bbq-grill', category: 'features', icon: '🍖', description: 'BBQ grill',
  },
  {
    name: 'Outdoor Dining', slug: 'outdoor-dining', category: 'features', icon: '🍽️', description: 'Outdoor dining area',
  },
  {
    name: 'Fire Pit', slug: 'fire-pit', category: 'features', icon: '🔥', description: 'Fire pit',
  },
  {
    name: 'Piano', slug: 'piano', category: 'features', icon: '🎹', description: 'Piano',
  },
  {
    name: 'Exercise Equipment', slug: 'exercise-equipment', category: 'features', icon: '🏃', description: 'Exercise equipment',
  },

  // Location Features
  {
    name: 'Beach Access', slug: 'beach-access', category: 'location', icon: '🏖️', description: 'Beach access',
  },
  {
    name: 'Mountain View', slug: 'mountain-view', category: 'location', icon: '⛰️', description: 'Mountain view',
  },
  {
    name: 'Lake Access', slug: 'lake-access', category: 'location', icon: '🏞️', description: 'Lake access',
  },
  {
    name: 'City View', slug: 'city-view', category: 'location', icon: '🌆', description: 'City view',
  },
  {
    name: 'Waterfront', slug: 'waterfront', category: 'location', icon: '🌊', description: 'Waterfront property',
  },

  // Safety
  {
    name: 'Smoke Alarm', slug: 'smoke-alarm', category: 'safety', icon: '🚨', description: 'Smoke alarm',
  },
  {
    name: 'Carbon Monoxide Alarm', slug: 'carbon-monoxide-alarm', category: 'safety', icon: '⚠️', description: 'Carbon monoxide alarm',
  },
  {
    name: 'First Aid Kit', slug: 'first-aid-kit', category: 'safety', icon: '🩹', description: 'First aid kit',
  },
  {
    name: 'Fire Extinguisher', slug: 'fire-extinguisher', category: 'safety', icon: '🧯', description: 'Fire extinguisher',
  },
  {
    name: 'Security Cameras', slug: 'security-cameras', category: 'safety', icon: '📹', description: 'Security cameras on property',
  },
];

const seedAmenities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing amenities
    await Amenity.deleteMany({});
    logger.info('Cleared existing amenities');

    // Insert amenities
    const result = await Amenity.insertMany(amenities);
    logger.info(`✅ Seeded ${result.length} amenities`);

    // Display amenities
    console.log('\nAmenities by category:');
    const categories = ['basic', 'features', 'location', 'safety'];
    for (const category of categories) {
      const categoryAmenities = result.filter((a) => a.category === category);
      console.log(`\n${category.toUpperCase()}:`);
      categoryAmenities.forEach((a) => {
        console.log(`  ${a.icon} ${a.name} (ID: ${a._id})`);
      });
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding amenities:', error);
    process.exit(1);
  }
};

seedAmenities();
