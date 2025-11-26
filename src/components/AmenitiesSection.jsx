import React from 'react';
import './AmenitiesSection.css';
// React Icons for amenities
import { 
  FaWifi, 
  FaTv, 
  FaSnowflake, 
  FaSwimmer, 
  FaParking, 
  FaSeedling 
} from "react-icons/fa";
import { FaKitchenSet } from "react-icons/fa6";
import { MdLocalLaundryService } from "react-icons/md";

function AmenitiesSection() {
  const amenities = [
    {
      name: 'WiFi miễn phí',
      icon: FaWifi,
      color: '#4285F4'
    },
    {
      name: 'Bếp riêng',
      icon: FaKitchenSet,
      color: '#4ECDC4'
    },
    {
      name: 'Điều hòa',
      icon: FaSnowflake,
      color: '#74C0FC'
    },
    {
      name: 'Máy giặt',
      icon: MdLocalLaundryService,
      color: '#45B7D1'
    },
    {
      name: 'Bãi đỗ xe',
      icon: FaParking,
      color: '#636E72'
    },
    {
      name: 'Khu vườn',
      icon: FaSeedling,
      color: '#00B894'
    }
  ];

  return (
    <section className="amenities-section">
      <h2 className="section-title">Các loại tiện nghi phổ biến</h2>
      <div className="amenities-grid">
        {amenities.map((amenity, index) => {
          const IconComponent = amenity.icon;
          return (
            <div key={index} className="amenity-card">
              <div className="amenity-icon-wrapper">
                <IconComponent 
                  className="amenity-icon" 
                  style={{ color: amenity.color }}
                />
              </div>
              <span className="amenity-name">{amenity.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AmenitiesSection;

