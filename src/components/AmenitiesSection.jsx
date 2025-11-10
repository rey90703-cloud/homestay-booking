import React from 'react';
import './AmenitiesSection.css';

function AmenitiesSection() {
  const amenities = [
    {
      name: 'Wifi miễn phí',
      icon: '/images/icon-wifi.svg'
    },
    {
      name: 'Bếp riêng',
      icon: '/images/icon-kitchen.svg'
    },
    {
      name: 'View núi',
      icon: '/images/icon-mountain.svg'
    },
    {
      name: 'Điều hoà',
      icon: '/images/icon-ac.svg'
    },
    {
      name: 'Bãi đỗ xe',
      icon: '/images/icon-parking.svg'
    },
    {
      name: 'Khu vườn',
      icon: '/images/icon-garden.svg'
    }
  ];

  return (
    <section className="amenities-section">
      <h2 className="section-title">Tiện nghi phổ biến</h2>
      <div className="amenities-grid">
        {amenities.map((amenity, index) => (
          <div key={index} className="amenity-card">
            <div className="amenity-icon-wrapper">
              <img src={amenity.icon} alt={amenity.name} className="amenity-icon" />
            </div>
            <span className="amenity-name">{amenity.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AmenitiesSection;

