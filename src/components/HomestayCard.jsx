import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomestayCard.css';

function HomestayCard({ homestay }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Support both old and new data structure
  const id = homestay._id || homestay.id;
  const title = homestay.title || homestay.name;
  const image = homestay.coverImage || homestay.images?.[0]?.url || homestay.image || '/placeholder.jpg';
  const price = homestay.pricing?.basePrice || homestay.price;
  const rating = homestay.stats?.averageRating || homestay.rating || 0;
  const location = homestay.location?.city || '';
  const tags = homestay.amenityNames || homestay.tags || [];

  return (
    <Link to={`/homestay/${id}`} className="homestay-card-link">
      <div className="homestay-card">
        <div className="card-image-container">
          <img 
            src={image} 
            alt={title} 
            className="card-image" 
          />
          {homestay.badge && (
            <div className="card-badge">{homestay.badge}</div>
          )}
          <button 
            className={`card-favorite ${isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
          >
            <svg className="heart-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M9 15.75L8.0625 14.8875C4.5 11.6625 2.25 9.6375 2.25 7.125C2.25 5.1 3.825 3.525 5.85 3.525C6.975 3.525 8.0625 4.05 8.775 4.875C9.4875 4.05 10.575 3.525 11.7 3.525C13.725 3.525 15.3 5.1 15.3 7.125C15.3 9.6375 13.05 11.6625 9.4875 14.8875L9 15.75Z" 
                fill={isFavorite ? '#E11D48' : 'none'}
                stroke="currentColor" 
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        <div className="card-content">
          <h3 className="card-title">{title}</h3>
          
          {location && (
            <div className="card-location">📍 {location}</div>
          )}
          
          <div className="card-info">
            <div className="card-price">
              {typeof price === 'number' 
                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
                : price}
              /đêm
            </div>
            <div className="card-rating">⭐ {rating.toFixed(1)}/5</div>
          </div>

          {tags && tags.length > 0 && (
            <div className="card-tags">
              {tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="card-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default HomestayCard;

