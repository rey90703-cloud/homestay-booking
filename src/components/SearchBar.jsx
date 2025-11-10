import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

function SearchBar({ variant = 'hero', initialData = {} }) {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    location: initialData.location || '',
    checkIn: initialData.checkIn || '',
    checkOut: initialData.checkOut || '',
    guests: initialData.guests || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchData({
      ...searchData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams();
    if (searchData.location) params.append('location', searchData.location);
    if (searchData.checkIn) params.append('checkin', searchData.checkIn);
    if (searchData.checkOut) params.append('checkout', searchData.checkOut);
    if (searchData.guests) params.append('guests', searchData.guests);
    
    // Navigate to search page with animation
    const searchBar = document.querySelector('.search-bar');
    if (searchBar && variant === 'hero') {
      searchBar.classList.add('search-bar-exit');
      setTimeout(() => {
        navigate(`/search?${params.toString()}`);
      }, 400);
    } else {
      navigate(`/search?${params.toString()}`);
    }
  };

  return (
    <form 
      className={`search-bar search-bar-${variant}`} 
      onSubmit={handleSubmit}
    >
      <div className="search-field">
        <label className="search-label">Khu vực</label>
        <input
          type="text"
          name="location"
          className="search-input"
          placeholder="Hà Nội"
          value={searchData.location}
          onChange={handleChange}
        />
        {variant === 'sticky' && (
          <img src="/images/icon-chevron-down.svg" alt="" className="field-icon" />
        )}
      </div>

      <div className="search-field">
        <label className="search-label">Nhận phòng</label>
        <input
          type="date"
          name="checkIn"
          className="search-input"
          value={searchData.checkIn}
          onChange={handleChange}
        />
        {variant === 'sticky' && (
          <img src="/images/icon-calendar.svg" alt="" className="field-icon" />
        )}
      </div>

      <div className="search-field">
        <label className="search-label">Trả phòng</label>
        <input
          type="date"
          name="checkOut"
          className="search-input"
          value={searchData.checkOut}
          onChange={handleChange}
        />
        {variant === 'sticky' && (
          <img src="/images/icon-calendar-2.svg" alt="" className="field-icon" />
        )}
      </div>

      <div className="search-field">
        <label className="search-label">Khách</label>
        <input
          type="number"
          name="guests"
          className="search-input"
          placeholder="2 người"
          min="1"
          value={searchData.guests}
          onChange={handleChange}
        />
        {variant === 'sticky' && (
          <img src="/images/icon-users.svg" alt="" className="field-icon" />
        )}
      </div>

      <button type="submit" className="search-btn">
        <img src="/images/icon-search-white.svg" alt="search" className="btn-icon" />
        <span>{variant === 'sticky' ? 'Tìm kiếm lại' : 'Tìm kiếm'}</span>
      </button>
    </form>
  );
}

export default SearchBar;

