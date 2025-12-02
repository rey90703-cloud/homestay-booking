import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import ExpandableCards from './animations/ExpandableCards/ExpandableCards';
import ScrollReveal from './animations/ScrollReveal/ScrollReveal';
import './HomestaySection.css';

/**
 * HomestaySection Component
 * 
 * Displays homestay listings with optional expandable cards view.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {Array} props.homestays - Array of homestay objects
 * @param {boolean} [props.useExpandableView=false] - Use expandable cards layout
 * @param {number} [props.defaultExpandedId] - ID of initially expanded card (for expandable view)
 * 
 * Requirements: 4.1, 4.4
 */
const HomestaySection = ({ 
  title, 
  homestays, 
  useExpandableView = false,
  defaultExpandedId 
}) => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const handleViewAll = () => {
    if (title.includes('Hà Nội')) {
      navigate('/homestay-ha-noi');
    } else if (title.includes('Lào Cai')) {
      navigate('/homestay-lao-cai');
    }
  };

  // Convert homestays to expandable cards format
  const expandableCards = homestays.map((homestay, index) => ({
    id: homestay.id || index + 1,
    content: (
      <Link 
        to={`/homestay/${homestay.id}`}
        className="expandable-homestay-link"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={homestay.image} 
          alt={homestay.name} 
          className="expandable-homestay-image"
        />
        <div className="expandable-homestay-overlay">
          <div className="expandable-homestay-badge">{homestay.badge}</div>
          <div className="expandable-homestay-info">
            <h3 className="expandable-homestay-title">{homestay.name}</h3>
            <div className="expandable-homestay-meta">
              <span className="expandable-homestay-price">{homestay.price}</span>
              <span className="expandable-homestay-rating">{homestay.rating}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }));

  // Determine animation direction based on title
  const animationDirection = title.includes('Hà Nội') ? 'fade-left' : 'fade-right';

  return (
    <section className="homestay-section">
      <ScrollReveal animation="fade-up" duration={0.5}>
        <h2 className="section-title">{title}</h2>
      </ScrollReveal>
      
      <ScrollReveal animation={animationDirection} duration={0.6} delay={0.1}>
      {useExpandableView ? (
        <div className="homestay-expandable-wrapper">
          <ExpandableCards 
            cards={expandableCards}
            defaultExpanded={defaultExpandedId || expandableCards[0]?.id}
            expandDuration={300}
          />
        </div>
      ) : (
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
                    className={`card-favorite ${isInWishlist(homestay.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(homestay.id);
                    }}
                  >
                    <svg className="heart-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path 
                        d="M9 15.75L8.0625 14.8875C4.5 11.6625 2.25 9.6375 2.25 7.125C2.25 5.1 3.825 3.525 5.85 3.525C6.975 3.525 8.0625 4.05 8.775 4.875C9.4875 4.05 10.575 3.525 11.7 3.525C13.725 3.525 15.3 5.1 15.3 7.125C15.3 9.6375 13.05 11.6625 9.4875 14.8875L9 15.75Z" 
                        fill={isInWishlist(homestay.id) ? '#E11D48' : 'none'}
                        stroke="currentColor" 
                        strokeWidth="1.5"
                      />
                    </svg>
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
      )}
      </ScrollReveal>
      
      <div className="section-action">
        <button className="btn-view-all" onClick={handleViewAll}>
          Xem tất cả tại {title.includes('Hà Nội') ? 'Hà Nội' : 'Lào Cai'}
        </button>
      </div>
    </section>
  );
};

export default HomestaySection;

