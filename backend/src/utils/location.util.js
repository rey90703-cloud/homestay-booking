/**
 * Location utilities for normalizing and matching city names
 */

// City name variations mapping
const CITY_VARIATIONS = {
  'hanoi': ['hà nội', 'ha noi', 'hanoi', 'hn', 'thủ đô'],
  'laocai': ['lào cai', 'lao cai', 'laocai', 'sapa', 'sa pa'],
  'hochiminh': ['hồ chí minh', 'ho chi minh', 'hcm', 'sài gòn', 'saigon', 'tp hcm', 'tphcm'],
  'danang': ['đà nẵng', 'da nang', 'danang', 'đn'],
  'halong': ['hạ long', 'ha long', 'halong', 'quảng ninh', 'quang ninh'],
  'ninhbinh': ['ninh bình', 'ninh binh', 'ninhbinh'],
  'dalat': ['đà lạt', 'da lat', 'dalat', 'lâm đồng', 'lam dong'],
  'nhatrang': ['nha trang', 'nhatrang', 'khánh hòa', 'khanh hoa'],
  'phuquoc': ['phú quốc', 'phu quoc', 'phuquoc'],
  'hoian': ['hội an', 'hoi an', 'hoian'],
  'hue': ['huế', 'hue'],
  'cantho': ['cần thơ', 'can tho', 'cantho'],
  'vungtau': ['vũng tàu', 'vung tau', 'vungtau', 'bà rịa', 'ba ria'],
};

// Reverse mapping: variation -> canonical name
const VARIATION_TO_CANONICAL = {};
Object.keys(CITY_VARIATIONS).forEach(canonical => {
  CITY_VARIATIONS[canonical].forEach(variation => {
    VARIATION_TO_CANONICAL[variation.toLowerCase()] = canonical;
  });
});

/**
 * Normalize Vietnamese text by removing diacritics
 */
function removeDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Normalize location string for comparison
 */
function normalizeLocation(location) {
  if (!location) return '';
  
  return removeDiacritics(location)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // normalize spaces
}

/**
 * Get canonical city name from any variation
 */
function getCanonicalCity(cityInput) {
  if (!cityInput) return null;
  
  const normalized = normalizeLocation(cityInput);
  
  // Check if it's already a canonical name
  if (CITY_VARIATIONS[normalized]) {
    return normalized;
  }
  
  // Check variations
  return VARIATION_TO_CANONICAL[normalized] || null;
}

/**
 * Get all variations for a city
 */
function getCityVariations(cityInput) {
  const canonical = getCanonicalCity(cityInput);
  if (!canonical) return [cityInput];
  
  return CITY_VARIATIONS[canonical] || [cityInput];
}

/**
 * Check if two location strings match (considering variations)
 */
function locationsMatch(location1, location2) {
  if (!location1 || !location2) return false;
  
  const canonical1 = getCanonicalCity(location1);
  const canonical2 = getCanonicalCity(location2);
  
  if (canonical1 && canonical2) {
    return canonical1 === canonical2;
  }
  
  // Fallback to normalized comparison
  return normalizeLocation(location1) === normalizeLocation(location2);
}

/**
 * Create regex pattern for flexible city matching
 */
function createCityRegex(cityInput) {
  const variations = getCityVariations(cityInput);
  
  // Escape special regex characters and create pattern
  const patterns = variations.map(v => {
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return `(${escaped})`;
  });
  
  return new RegExp(patterns.join('|'), 'i');
}

/**
 * Get display name for a city (prefer Vietnamese with diacritics)
 */
function getCityDisplayName(cityInput) {
  const canonical = getCanonicalCity(cityInput);
  if (!canonical) return cityInput;
  
  const variations = CITY_VARIATIONS[canonical];
  // Return the first variation (usually the proper Vietnamese name)
  return variations[0] || cityInput;
}

module.exports = {
  CITY_VARIATIONS,
  normalizeLocation,
  getCanonicalCity,
  getCityVariations,
  locationsMatch,
  createCityRegex,
  getCityDisplayName,
  removeDiacritics,
};
