/**
 * City name variations for search suggestions
 */

export const CITY_SUGGESTIONS = [
  { display: 'Hà Nội', variations: ['Hà Nội', 'Ha Noi', 'Hanoi', 'HN'] },
  { display: 'Lào Cai', variations: ['Lào Cai', 'Lao Cai', 'Sapa', 'Sa Pa'] },
  { display: 'TP. Hồ Chí Minh', variations: ['Hồ Chí Minh', 'HCM', 'Sài Gòn', 'Saigon'] },
  { display: 'Đà Nẵng', variations: ['Đà Nẵng', 'Da Nang', 'Danang', 'ĐN'] },
  { display: 'Hạ Long', variations: ['Hạ Long', 'Ha Long', 'Quảng Ninh'] },
  { display: 'Ninh Bình', variations: ['Ninh Bình', 'Ninh Binh'] },
  { display: 'Đà Lạt', variations: ['Đà Lạt', 'Da Lat', 'Dalat', 'Lâm Đồng'] },
  { display: 'Nha Trang', variations: ['Nha Trang', 'Khánh Hòa'] },
  { display: 'Phú Quốc', variations: ['Phú Quốc', 'Phu Quoc'] },
  { display: 'Hội An', variations: ['Hội An', 'Hoi An'] },
  { display: 'Huế', variations: ['Huế', 'Hue'] },
  { display: 'Cần Thơ', variations: ['Cần Thơ', 'Can Tho'] },
  { display: 'Vũng Tàu', variations: ['Vũng Tàu', 'Vung Tau', 'Bà Rịa'] },
];

/**
 * Normalize Vietnamese text by removing diacritics
 */
export function removeDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Filter cities based on search input
 */
export function filterCities(searchInput) {
  if (!searchInput || searchInput.length < 2) {
    return CITY_SUGGESTIONS;
  }

  const normalized = removeDiacritics(searchInput.toLowerCase());

  return CITY_SUGGESTIONS.filter(city => {
    // Check if any variation matches
    return city.variations.some(variation => {
      const normalizedVariation = removeDiacritics(variation.toLowerCase());
      return normalizedVariation.includes(normalized);
    });
  });
}

/**
 * Get display name for a city input
 */
export function getCityDisplayName(input) {
  if (!input) return '';

  const normalized = removeDiacritics(input.toLowerCase());

  for (const city of CITY_SUGGESTIONS) {
    const match = city.variations.find(v => {
      const normalizedVariation = removeDiacritics(v.toLowerCase());
      return normalizedVariation === normalized;
    });

    if (match) {
      return city.display;
    }
  }

  return input;
}
