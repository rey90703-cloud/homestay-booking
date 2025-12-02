import API_BASE_URL from '../config/api';

class SearchService {
  // Search homestays with filters
  async searchHomestays(searchParams) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add search parameters
      if (searchParams.location) {
        queryParams.append('city', searchParams.location);
      }
      if (searchParams.checkIn) {
        queryParams.append('checkIn', searchParams.checkIn);
      }
      if (searchParams.checkOut) {
        queryParams.append('checkOut', searchParams.checkOut);
      }
      if (searchParams.guests) {
        queryParams.append('guests', searchParams.guests);
      }
      if (searchParams.minPrice) {
        queryParams.append('minPrice', searchParams.minPrice);
      }
      if (searchParams.maxPrice) {
        queryParams.append('maxPrice', searchParams.maxPrice);
      }
      if (searchParams.minRating) {
        queryParams.append('minRating', searchParams.minRating);
      }
      // Add amenities filter
      if (searchParams.amenities && searchParams.amenities.length > 0) {
        // Send as comma-separated string
        queryParams.append('amenities', searchParams.amenities.join(','));
      }
      if (searchParams.sortBy) {
        queryParams.append('sortBy', searchParams.sortBy);
      }
      if (searchParams.page) {
        queryParams.append('page', searchParams.page);
      }
      if (searchParams.limit) {
        queryParams.append('limit', searchParams.limit);
      }

      // Only search active homestays
      queryParams.append('status', 'active');

      const response = await fetch(`${API_BASE_URL}/homestays?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const homestays = (data.data || []).map(homestay => this.formatHomestay(homestay));
        
        return {
          success: true,
          data: homestays,
          pagination: data.metadata?.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: homestays.length,
            itemsPerPage: homestays.length
          }
        };
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Re-throw the error instead of returning mock data
      throw error;
    }
  }

  // Get available locations (static list)
  getLocations() {
    return {
      success: true,
      data: [
        'Hà Nội',
        'Lào Cai', 
        'Sa Pa',
        'Đà Nẵng',
        'Hồ Chí Minh',
        'Hội An',
        'Nha Trang',
        'Đà Lạt',
        'Phú Quốc',
        'Hạ Long',
        'Ninh Bình',
        'Huế',
        'Cần Thơ',
        'Vũng Tàu'
      ]
    };
  }

  // Filter homestays by amenities (frontend filtering - kept for backward compatibility)
  // Note: Backend now handles amenity filtering, this is only used as fallback
  filterByAmenities(homestays, selectedAmenities) {
    if (!selectedAmenities || selectedAmenities.length === 0) {
      return homestays;
    }
    
    return homestays.filter(homestay => {
      // Get homestay amenities (both IDs and names)
      const homestayAmenities = [
        ...(homestay.amenities || []),
        ...(homestay.amenityNames || [])
      ];
      
      // Check if homestay has ALL selected amenities
      return selectedAmenities.every(selectedAmenity => {
        // Check both ID and name matching
        return homestayAmenities.some(homestayAmenity => {
          // Direct match
          if (homestayAmenity === selectedAmenity) return true;
          
          // ID to name mapping (updated with hyphen format)
          const amenityMapping = {
            'wifi': 'WiFi',
            'tv': 'TV', 
            'kitchen': 'Bếp',
            'washing-machine': 'Máy giặt',
            'air-conditioning': 'Điều hòa',
            'heating': 'Sưởi ấm',
            'workspace': 'Không gian làm việc',
            'pool': 'Hồ bơi',
            'gym': 'Phòng gym',
            'parking': 'Đỗ xe miễn phí',
            'balcony': 'Ban công',
            'garden': 'Vườn'
          };
          
          // Check if selected amenity ID matches homestay amenity name
          if (amenityMapping[selectedAmenity] === homestayAmenity) return true;
          
          // Check if selected amenity name matches homestay amenity ID
          const reverseMapping = Object.fromEntries(
            Object.entries(amenityMapping).map(([key, value]) => [value, key])
          );
          if (reverseMapping[selectedAmenity] === homestayAmenity) return true;
          
          return false;
        });
      });
    });
  }

  // Format homestay data for display
  formatHomestay(homestay) {
    return {
      id: homestay._id,
      name: homestay.title,
      price: new Intl.NumberFormat('vi-VN').format(homestay.pricing?.basePrice || 0),
      rating: homestay.averageRating || 5.0,
      reviewCount: homestay.reviewCount || 0,
      image: homestay.coverImage || '/images/default-homestay.jpg',
      images: homestay.images?.map(img => img.url || img) || [],
      badge: this.getBadge(homestay),
      tags: this.getTags(homestay),
      location: homestay.location?.city || homestay.city,
      address: homestay.location?.address || homestay.address,
      amenities: homestay.amenities || [], // IDs for filtering
      amenityNames: homestay.amenityNames || [], // Names for display
      maxGuests: homestay.capacity?.guests || homestay.capacity?.maxGuests || homestay.maxGuests || 2,
      verificationStatus: homestay.verificationStatus,
      availability: homestay.availability
    };
  }

  // Get badge based on homestay properties
  getBadge(homestay) {
    if (homestay.verificationStatus === 'approved') {
      return 'Đã xác minh';
    }
    if (homestay.isNew) {
      return 'Mới';
    }
    if (homestay.isPopular) {
      return 'Hot';
    }
    if (homestay.discount && homestay.discount > 0) {
      return `Giảm ${homestay.discount}%`;
    }
    return null;
  }

  // Get tags from homestay amenities and features
  getTags(homestay) {
    const tags = [];
    
    // Add key amenities as tags
    if (homestay.amenities) {
      const keyAmenities = ['Wifi', 'Bếp', 'Điều hòa', 'Đỗ xe', 'Hồ bơi'];
      homestay.amenities.forEach(amenity => {
        if (keyAmenities.includes(amenity) && tags.length < 3) {
          tags.push(amenity);
        }
      });
    }
    
    // Add location-based tags
    if (homestay.location?.nearbyAttractions) {
      homestay.location.nearbyAttractions.forEach(attraction => {
        if (tags.length < 3) {
          tags.push(attraction);
        }
      });
    }
    
    return tags;
  }


}

export default new SearchService();