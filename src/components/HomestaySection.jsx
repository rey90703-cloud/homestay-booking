import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomestaySection.css';

const HomestaySection = ({ title, homestays }) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    if (title.includes('Hà Nội')) {
      navigate('/homestay-ha-noi');
    } else if (title.includes('Lào Cai')) {
      navigate('/homestay-lao-cai');
    }
  };

  return (
    <section className="homestay-section">
      <h2 className="section-title">{title}</h2>
      <div className="homestay-grid">
        {homestays.map((homestay, index) => (
          <Link 
            to={`/homestay/${homestay.id}`} 
            key={homestay.id || index} 
            className="homestay-card-link"
          >
            <div className="homestay-card">
              <div className="card-image-wrapper">
                <img src={homestay.image} alt={homestay.name} className="card-image" />
                <div className="card-badge">{homestay.badge}</div>
                <button 
                  className="card-favorite"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
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
          </Link>
        ))}
      </div>
      <div className="section-action">
        <button className="btn-view-all" onClick={handleViewAll}>
          Xem tất cả tại {title.includes('Hà Nội') ? 'Hà Nội' : 'Lào Cai'}
        </button>
      </div>
    </section>
  );
};

export default HomestaySection;

