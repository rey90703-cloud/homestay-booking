require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Test script to verify filter functionality
 */
async function testFilters() {
  console.log('🧪 Testing Filter API...\n');

  try {
    // Test 1: Get all amenities
    console.log('1️⃣ Testing GET /amenities');
    const amenitiesRes = await axios.get(`${API_BASE_URL}/amenities`);
    console.log(`✅ Found ${amenitiesRes.data.data.amenities.length} amenities`);
    amenitiesRes.data.data.amenities.forEach(a => {
      console.log(`   - ${a.name} (slug: ${a.slug})`);
    });
    console.log('');

    // Test 2: Search without filters
    console.log('2️⃣ Testing GET /homestays (no filters)');
    const allHomestaysRes = await axios.get(`${API_BASE_URL}/homestays?status=active`);
    console.log(`✅ Found ${allHomestaysRes.data.data.length} active homestays`);
    console.log('');

    // Test 3: Filter by rating
    console.log('3️⃣ Testing GET /homestays?minRating=4.5');
    const ratingFilterRes = await axios.get(`${API_BASE_URL}/homestays?status=active&minRating=4.5`);
    console.log(`✅ Found ${ratingFilterRes.data.data.length} homestays with rating >= 4.5`);
    ratingFilterRes.data.data.forEach(h => {
      console.log(`   - ${h.title}: ${h.stats?.averageRating || 0} ⭐`);
    });
    console.log('');

    // Test 4: Filter by amenities
    console.log('4️⃣ Testing GET /homestays?amenities=wifi,tv');
    const amenityFilterRes = await axios.get(`${API_BASE_URL}/homestays?status=active&amenities=wifi,tv`);
    console.log(`✅ Found ${amenityFilterRes.data.data.length} homestays with WiFi and TV`);
    amenityFilterRes.data.data.forEach(h => {
      const amenityNames = h.amenityNames || [];
      console.log(`   - ${h.title}: [${amenityNames.join(', ')}]`);
    });
    console.log('');

    // Test 5: Combine filters
    console.log('5️⃣ Testing GET /homestays?minRating=4.0&amenities=wifi');
    const combinedFilterRes = await axios.get(`${API_BASE_URL}/homestays?status=active&minRating=4.0&amenities=wifi`);
    console.log(`✅ Found ${combinedFilterRes.data.data.length} homestays with rating >= 4.0 and WiFi`);
    combinedFilterRes.data.data.forEach(h => {
      const amenityNames = h.amenityNames || [];
      console.log(`   - ${h.title}: ${h.stats?.averageRating || 0} ⭐, [${amenityNames.join(', ')}]`);
    });
    console.log('');

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testFilters();
