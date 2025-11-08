import React from 'react';
import './MapView.css';

function MapView({ homestays, onClose }) {
  return (
    <div className="map-view-overlay">
      <div className="map-view-container">
        {/* Map Header */}
        <div className="map-header">
          <h2 className="map-title">Bản đồ kết quả</h2>
          <button className="map-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Map Content */}
        <div className="map-content">
          {/* Map Image Placeholder */}
          <div className="map-image-container">
            <img 
              src="/images/map-placeholder.png" 
              alt="Map" 
              className="map-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="map-placeholder-text">🗺️ Bản đồ sẽ hiển thị ở đây<br/><small>Tích hợp Google Maps hoặc Mapbox</small></div>';
              }}
            />
          </div>

          {/* Map Markers (Sample positions) */}
          <div className="map-markers">
            {homestays.map((homestay, index) => (
              <div 
                key={homestay.id}
                className="map-marker"
                style={{
                  left: `${20 + (index % 3) * 30}%`,
                  top: `${30 + Math.floor(index / 3) * 25}%`
                }}
              >
                <div className="marker-pin">
                  <span className="marker-price">{homestay.price}đ</span>
                </div>
                <div className="marker-popup">
                  <img src={homestay.image} alt={homestay.name} className="popup-image" />
                  <div className="popup-content">
                    <h4 className="popup-title">{homestay.name}</h4>
                    <div className="popup-info">
                      <span className="popup-price">{homestay.price}đ/đêm</span>
                      <span className="popup-rating">⭐ {homestay.rating}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Controls */}
        <div className="map-controls">
          <button className="map-control-btn" title="Zoom in">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="map-control-btn" title="Zoom out">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="map-control-btn" title="My location">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 2V4M10 16V18M2 10H4M16 10H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapView;

