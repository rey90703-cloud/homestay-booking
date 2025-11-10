import React from 'react';
import './HomestaySection.css';

const HomestaySection = ({ title, homestays }) => {
  return (
    <section className="homestay-section">
      <h2 className="section-title">{title}</h2>
      <div className="homestay-grid">
        {homestays.map((homestay, index) => (
          <div key={index} className="homestay-card">
            <div className="card-image-wrapper">
              <img src={homestay.image} alt={homestay.name} className="card-image" />
              <div className="card-badge">{homestay.badge}</div>
              <button className="card-favorite">
                <img src={homestay.heartIcon} alt="favorite" />
              </button>
            </div>
            <div className="card-content">
              <h3 className="card-title">{homestay.name}</h3>
              <div className="card-footer">
                <div className="card-price">{homestay.price}</div>
                <div className="card-rating">{homestay.rating}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="section-action">
        <button className="btn-view-all">Xem tất cả tại {title.includes('Hà Nội') ? 'Hà Nội' : 'Lào Cai'}</button>
      </div>
    </section>
  );
};

export default HomestaySection;

