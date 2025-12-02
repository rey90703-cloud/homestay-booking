import React, { useState } from 'react';
import './FilterSidebar.css';
// React Icons for amenities
import { 
  FaWifi, 
  FaTv, 
  FaSnowflake, 
  FaFire, 
  FaBriefcase, 
  FaSwimmer, 
  FaDumbbell, 
  FaParking, 
  FaBuilding, 
  FaSeedling 
} from "react-icons/fa";
import { FaKitchenSet } from "react-icons/fa6";
import { MdLocalLaundryService } from "react-icons/md";

function FilterSidebar({ onFilterChange }) {
  const [filters, setFilters] = useState({
    minPrice: null,
    maxPrice: null,
    minRating: null,
    amenities: []
  });

  // Danh sách tiện nghi với icons (slug phải khớp với database)
  const AMENITIES = [
    { id: 'wifi', name: 'WiFi', icon: FaWifi, color: '#4285F4' },
    { id: 'tv', name: 'TV', icon: FaTv, color: '#FF6B6B' },
    { id: 'kitchen', name: 'Bếp', icon: FaKitchenSet, color: '#4ECDC4' },
    { id: 'washing-machine', name: 'Máy giặt', icon: MdLocalLaundryService, color: '#45B7D1' },
    { id: 'air-conditioning', name: 'Điều hòa', icon: FaSnowflake, color: '#74C0FC' },
    { id: 'heating', name: 'Sưởi ấm', icon: FaFire, color: '#FF8E53' },
    { id: 'workspace', name: 'Không gian làm việc', icon: FaBriefcase, color: '#6C5CE7' },
    { id: 'pool', name: 'Hồ bơi', icon: FaSwimmer, color: '#00B894' },
    { id: 'gym', name: 'Phòng gym', icon: FaDumbbell, color: '#E17055' },
    { id: 'parking', name: 'Đỗ xe miễn phí', icon: FaParking, color: '#636E72' },
    { id: 'balcony', name: 'Ban công', icon: FaBuilding, color: '#A29BFE' },
    { id: 'garden', name: 'Vườn', icon: FaSeedling, color: '#00B894' },
  ];

  const handlePriceChange = (range) => {
    let minPrice = null;
    let maxPrice = null;
    
    switch (range) {
      case '≤500k':
        maxPrice = 500000;
        break;
      case '500k-800k':
        minPrice = 500000;
        maxPrice = 800000;
        break;
      case '≥800k':
        minPrice = 800000;
        break;
      default:
        break;
    }
    
    const newFilters = { 
      ...filters, 
      minPrice, 
      maxPrice,
      priceRange: range 
    };
    setFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const handleRatingChange = (rating) => {
    let minRating = null;
    
    switch (rating) {
      case '4.0+':
        minRating = 4.0;
        break;
      case '4.5+':
        minRating = 4.5;
        break;
      case '4.8+':
        minRating = 4.8;
        break;
      default:
        break;
    }
    
    const newFilters = { 
      ...filters, 
      minRating,
      rating 
    };
    setFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const handleAmenityToggle = (amenity) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    const newFilters = { ...filters, amenities: newAmenities };
    setFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };



  const handleReset = () => {
    const resetFilters = {
      minPrice: null,
      maxPrice: null,
      minRating: null,
      amenities: [],
      priceRange: '',
      rating: ''
    };
    setFilters(resetFilters);
    onFilterChange && onFilterChange(resetFilters);
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3 className="filter-title">Lọc nâng cao</h3>
        <button className="filter-reset" onClick={handleReset}>
          <img src="/images/icon-refresh.svg" alt="reset" className="reset-icon" />
          <span>Đặt lại</span>
        </button>
      </div>

      <div className="filter-sections">
        {/* Price Range */}
        <div className="filter-section">
          <h4 className="filter-section-title">Giá mỗi đêm</h4>
          <div className="filter-options">
            <button
              className={`filter-option ${filters.priceRange === '≤500k' ? 'active' : ''}`}
              onClick={() => handlePriceChange('≤500k')}
            >
              ≤ 500k
            </button>
            <button
              className={`filter-option ${filters.priceRange === '500k-800k' ? 'active' : ''}`}
              onClick={() => handlePriceChange('500k-800k')}
            >
              500k–800k
            </button>
            <button
              className={`filter-option ${filters.priceRange === '≥800k' ? 'active' : ''}`}
              onClick={() => handlePriceChange('≥800k')}
            >
              ≥ 800k
            </button>
          </div>
        </div>

        {/* Rating */}
        <div className="filter-section">
          <h4 className="filter-section-title">Đánh giá</h4>
          <div className="filter-options">
            <button
              className={`filter-option ${filters.rating === '4.0+' ? 'active' : ''}`}
              onClick={() => handleRatingChange('4.0+')}
            >
              ⭐ 4.0+
            </button>
            <button
              className={`filter-option ${filters.rating === '4.5+' ? 'active' : ''}`}
              onClick={() => handleRatingChange('4.5+')}
            >
              ⭐ 4.5+
            </button>
            <button
              className={`filter-option ${filters.rating === '4.8+' ? 'active' : ''}`}
              onClick={() => handleRatingChange('4.8+')}
            >
              ⭐ 4.8+
            </button>
          </div>
        </div>

        {/* Amenities */}
        <div className="filter-section">
          <h4 className="filter-section-title">Tiện nghi</h4>
          <div className="filter-options amenities-grid">
            {AMENITIES.map((amenity) => {
              const IconComponent = amenity.icon;
              return (
                <button
                  key={amenity.id}
                  className={`filter-option with-icon ${filters.amenities.includes(amenity.id) ? 'active' : ''}`}
                  onClick={() => handleAmenityToggle(amenity.id)}
                >
                  <IconComponent 
                    className="amenity-icon" 
                    style={{ color: amenity.color }}
                  />
                  <span>{amenity.name}</span>
                </button>
              );
            })}
          </div>
        </div>


      </div>
    </div>
  );
}

export default FilterSidebar;

