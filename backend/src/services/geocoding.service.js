const axios = require('axios');
const logger = require('../utils/logger');

class GeocodingService {
  constructor() {
    this.baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  }
  
  getApiKey() {
    return process.env.GOOGLE_MAPS_API_KEY;
  }

  /**
   * Geocode an address to get coordinates
   * @param {string} address - Full address to geocode
   * @param {string} city - City name to help with disambiguation
   * @returns {Promise<{lat: number, lng: number}>}
   */
  async geocodeAddress(address, city = null) {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        logger.error('Google Maps API key not configured');
        return null;
      }

      // Clean address to avoid confusion
      let cleanAddress = address;
      
      // If city is provided, add it as component to improve accuracy
      const params = {
        address: cleanAddress,
        key: apiKey,
        language: 'vi',
        region: 'vn',
      };

      // Add city component if provided to help Google understand context
      if (city) {
        // Normalize city name
        const normalizedCity = city.toLowerCase();
        
        // Map common city variations
        if (normalizedCity.includes('hồ chí minh') || normalizedCity.includes('hcm') || normalizedCity.includes('sài gòn') || normalizedCity.includes('tp.hcm')) {
          params.components = 'locality:Ho Chi Minh City|country:VN';
        } else if (normalizedCity.includes('hà nội') || normalizedCity.includes('hanoi')) {
          params.components = 'locality:Hanoi|country:VN';
        } else if (normalizedCity.includes('đà nẵng') || normalizedCity.includes('da nang')) {
          params.components = 'locality:Da Nang|country:VN';
        } else {
          params.components = `locality:${city}|country:VN`;
        }
      }

      const response = await axios.get(this.baseUrl, { params });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        
        // Verify the result is in the correct city if city was provided
        if (city) {
          const resultCity = this.extractCityFromResult(result);
          if (!this.citiesMatch(city, resultCity)) {
            logger.warn(`Geocoding result city mismatch. Expected: ${city}, Got: ${resultCity}`);
            // Try to find a better match in other results
            for (let i = 1; i < response.data.results.length; i++) {
              const altResult = response.data.results[i];
              const altCity = this.extractCityFromResult(altResult);
              if (this.citiesMatch(city, altCity)) {
                return {
                  lat: altResult.geometry.location.lat,
                  lng: altResult.geometry.location.lng,
                  formattedAddress: altResult.formatted_address,
                  placeId: altResult.place_id,
                };
              }
            }
          }
        }
        
        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
        };
      } else {
        logger.warn(`Geocoding failed for address: ${address}, status: ${response.data.status}`);
        return null;
      }
    } catch (error) {
      logger.error('Geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Extract city name from geocoding result
   */
  extractCityFromResult(result) {
    const addressComponents = result.address_components || [];
    
    // Look for locality or administrative_area_level_1
    for (const component of addressComponents) {
      if (component.types.includes('locality') || 
          component.types.includes('administrative_area_level_1')) {
        return component.long_name;
      }
    }
    
    return null;
  }

  /**
   * Check if two city names match (considering variations)
   */
  citiesMatch(city1, city2) {
    if (!city1 || !city2) return false;
    
    const normalize = (str) => str.toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '');
    
    const norm1 = normalize(city1);
    const norm2 = normalize(city2);
    
    // Direct match
    if (norm1 === norm2) return true;
    
    // Check common variations
    const hcmVariations = ['hochiminh', 'hcm', 'saigon', 'tphcm', 'hochiminhcity'];
    const hanoiVariations = ['hanoi', 'hn'];
    
    if (hcmVariations.includes(norm1) && hcmVariations.includes(norm2)) return true;
    if (hanoiVariations.includes(norm1) && hanoiVariations.includes(norm2)) return true;
    
    return false;
  }

  /**
   * Reverse geocode coordinates to get address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>}
   */
  async reverseGeocode(lat, lng) {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        logger.error('Google Maps API key not configured');
        return null;
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          latlng: `${lat},${lng}`,
          key: apiKey,
          language: 'vi',
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      } else {
        logger.warn(`Reverse geocoding failed for ${lat},${lng}, status: ${response.data.status}`);
        return null;
      }
    } catch (error) {
      logger.error('Reverse geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Build full address string from location object
   * @param {Object} location - Location object with address, city, country
   * @returns {string}
   */
  buildFullAddress(location) {
    const parts = [];
    
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ');
  }
}

module.exports = new GeocodingService();
