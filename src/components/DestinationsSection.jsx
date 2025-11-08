import React from 'react';
import './DestinationsSection.css';

function DestinationsSection() {
  const destinations = [
    {
      name: 'Hà Nội',
      image: '/images/dest-hn-28e1f0.png',
      icon: '/images/icon-location-hn.svg'
    },
    {
      name: 'Sa Pa',
      image: '/images/dest-sp-331ab8.png',
      icon: '/images/icon-location-sp.svg'
    },
    {
      name: 'Hạ Long',
      image: '/images/dest-hl-2b6399.png',
      icon: '/images/icon-location-hl.svg'
    }
  ];

  return (
    <section className="destinations-section">
      <h2 className="section-title">Điểm đến phổ biến</h2>
      <div className="destinations-grid">
        {destinations.map((destination, index) => (
          <div key={index} className="destination-card">
            <div className="destination-image-wrapper">
              <img src={destination.image} alt={destination.name} className="destination-image" />
              <div className="destination-gradient"></div>
              <div className="destination-badge">
                <img src={destination.icon} alt="" className="destination-icon" />
                <span>{destination.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DestinationsSection;

