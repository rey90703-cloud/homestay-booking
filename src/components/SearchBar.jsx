import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import searchService from '../services/searchService';
import './SearchBar.css';

function SearchBar({ variant = 'hero', initialData = {} }) {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    location: initialData.location || '',
    checkIn: initialData.checkIn || '',
    checkOut: initialData.checkOut || '',
    guests: initialData.guests || ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get tomorrow's date for default checkout
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    setSearchData({
      ...searchData,
      [name]: value
    });
  };



  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!searchData.location) {
      newErrors.location = 'Vui lòng chọn khu vực';
    }

    if (searchData.checkIn && searchData.checkOut) {
      const checkInDate = new Date(searchData.checkIn);
      const checkOutDate = new Date(searchData.checkOut);
      
      if (checkInDate >= checkOutDate) {
        newErrors.checkOut = 'Ngày trả phòng phải sau ngày nhận phòng';
      }
    }

    if (searchData.guests && (parseInt(searchData.guests) < 1 || parseInt(searchData.guests) > 20)) {
      newErrors.guests = 'Số khách phải từ 1 đến 20 người';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // Build query params
    const params = new URLSearchParams();
    if (searchData.location) params.append('location', searchData.location);
    if (searchData.checkIn) params.append('checkIn', searchData.checkIn);
    if (searchData.checkOut) params.append('checkOut', searchData.checkOut);
    if (searchData.guests) params.append('guests', searchData.guests);
    
    // Navigate to search page with animation
    const searchBar = document.querySelector('.search-bar');
    if (searchBar && variant === 'hero') {
      searchBar.classList.add('search-bar-exit');
      setTimeout(() => {
        navigate(`/search?${params.toString()}`);
        setIsLoading(false);
      }, 400);
    } else {
      navigate(`/search?${params.toString()}`);
      setIsLoading(false);
    }
  };



  // Set default dates if not provided
  useEffect(() => {
    if (!searchData.checkIn && !initialData.checkIn) {
      setSearchData(prev => ({ ...prev, checkIn: today }));
    }
    if (!searchData.checkOut && !initialData.checkOut) {
      setSearchData(prev => ({ ...prev, checkOut: tomorrowStr }));
    }
  }, [today, tomorrowStr, initialData]);

  return (
    <form 
      className={`search-bar search-bar-${variant}`} 
      onSubmit={handleSubmit}
    >
      <div className="search-field">
        <label className="search-label">Khu vực</label>
        <select
          name="location"
          className={`search-input search-select ${errors.location ? 'error' : ''}`}
          value={searchData.location}
          onChange={handleChange}
        >
          <option value="">Chọn khu vực</option>
          <option value="Hà Nội">Hà Nội</option>
          <option value="Lào Cai">Lào Cai</option>
          <option value="Sa Pa">Sa Pa</option>
          <option value="Đà Nẵng">Đà Nẵng</option>
          <option value="Hồ Chí Minh">Hồ Chí Minh</option>
          <option value="Hội An">Hội An</option>
          <option value="Nha Trang">Nha Trang</option>
          <option value="Đà Lạt">Đà Lạt</option>
          <option value="Phú Quốc">Phú Quốc</option>
          <option value="Hạ Long">Hạ Long</option>
          <option value="Ninh Bình">Ninh Bình</option>
          <option value="Huế">Huế</option>
          <option value="Cần Thơ">Cần Thơ</option>
          <option value="Vũng Tàu">Vũng Tàu</option>
        </select>
        
        {errors.location && (
          <div className="field-error">{errors.location}</div>
        )}
      </div>

      <div className="search-field">
        <label className="search-label">Nhận phòng</label>
        <input
          type="date"
          name="checkIn"
          className={`search-input ${errors.checkIn ? 'error' : ''}`}
          value={searchData.checkIn}
          onChange={handleChange}
          min={today}
        />
        {errors.checkIn && (
          <div className="field-error">{errors.checkIn}</div>
        )}
      </div>

      <div className="search-field">
        <label className="search-label">Trả phòng</label>
        <input
          type="date"
          name="checkOut"
          className={`search-input ${errors.checkOut ? 'error' : ''}`}
          value={searchData.checkOut}
          onChange={handleChange}
          min={searchData.checkIn || today}
        />
        {errors.checkOut && (
          <div className="field-error">{errors.checkOut}</div>
        )}
      </div>

      <div className="search-field">
        <label className="search-label">Khách</label>
        <input
          type="number"
          name="guests"
          className={`search-input ${errors.guests ? 'error' : ''}`}
          placeholder="2"
          min="1"
          max="20"
          value={searchData.guests}
          onChange={handleChange}
        />
        {variant === 'sticky' && (
          <img src="/images/icon-users.svg" alt="" className="field-icon" />
        )}
        {errors.guests && (
          <div className="field-error">{errors.guests}</div>
        )}
      </div>

      <button type="submit" className="search-btn" disabled={isLoading}>
        {isLoading ? (
          <div className="btn-spinner"></div>
        ) : (
          <img src="/images/icon-search-white.svg" alt="search" className="btn-icon" />
        )}
        <span>
          {isLoading 
            ? 'Đang tìm...' 
            : variant === 'sticky' 
              ? 'Tìm kiếm lại' 
              : 'Tìm kiếm'
          }
        </span>
      </button>
    </form>
  );
}

export default SearchBar;

