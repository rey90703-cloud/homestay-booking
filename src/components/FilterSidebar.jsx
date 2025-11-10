import React, { useState } from 'react';
import './FilterSidebar.css';

function FilterSidebar({ onFilterChange }) {
  const [filters, setFilters] = useState({
    priceRange: '',
    rating: '',
    amenities: [],
    propertyType: ''
  });

  const handlePriceChange = (range) => {
    const newFilters = { ...filters, priceRange: range };
    setFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const handleRatingChange = (rating) => {
    const newFilters = { ...filters, rating };
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

  const handlePropertyTypeChange = (type) => {
    const newFilters = { ...filters, propertyType: type };
    setFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      priceRange: '',
      rating: '',
      amenities: [],
      propertyType: ''
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
            <button
              className={`filter-option with-icon ${filters.amenities.includes('wifi') ? 'active' : ''}`}
              onClick={() => handleAmenityToggle('wifi')}
            >
              <img src="/images/icon-wifi-filter.svg" alt="wifi" className="amenity-icon" />
              <span>Wifi</span>
            </button>
            <button
              className={`filter-option with-icon ${filters.amenities.includes('kitchen') ? 'active' : ''}`}
              onClick={() => handleAmenityToggle('kitchen')}
            >
              <img src="/images/icon-kitchen-filter.svg" alt="kitchen" className="amenity-icon" />
              <span>Bếp</span>
            </button>
            <button
              className={`filter-option with-icon ${filters.amenities.includes('mountain') ? 'active' : ''}`}
              onClick={() => handleAmenityToggle('mountain')}
            >
              <img src="/images/icon-mountain-filter.svg" alt="mountain" className="amenity-icon" />
              <span>View núi</span>
            </button>
            <button
              className={`filter-option with-icon ${filters.amenities.includes('parking') ? 'active' : ''}`}
              onClick={() => handleAmenityToggle('parking')}
            >
              <img src="/images/icon-parking-filter.svg" alt="parking" className="amenity-icon" />
              <span>Đỗ xe</span>
            </button>
          </div>
        </div>

        {/* Property Type */}
        <div className="filter-section">
          <h4 className="filter-section-title">Loại chỗ ở</h4>
          <div className="filter-options">
            <button
              className={`filter-option ${filters.propertyType === 'apartment' ? 'active' : ''}`}
              onClick={() => handlePropertyTypeChange('apartment')}
            >
              Căn hộ
            </button>
            <button
              className={`filter-option ${filters.propertyType === 'studio' ? 'active' : ''}`}
              onClick={() => handlePropertyTypeChange('studio')}
            >
              Studio
            </button>
            <button
              className={`filter-option ${filters.propertyType === 'bungalow' ? 'active' : ''}`}
              onClick={() => handlePropertyTypeChange('bungalow')}
            >
              Bungalow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;

