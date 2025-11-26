import React from 'react';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import './RatingStars.css';

function RatingStars({ 
  rating = 0, 
  maxStars = 5, 
  size = 'medium', 
  interactive = false, 
  onRatingChange = null,
  showNumber = false,
  className = ''
}) {
  const handleStarClick = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const renderStar = (starIndex) => {
    const starValue = starIndex + 1;
    const filled = rating >= starValue;
    const halfFilled = rating >= starValue - 0.5 && rating < starValue;

    return (
      <span
        key={starIndex}
        className={`star-wrapper ${interactive ? 'interactive' : ''}`}
        onClick={() => handleStarClick(starValue)}
      >
        {halfFilled ? (
          <FaStarHalfAlt className={`star half-filled ${size}`} />
        ) : (
          <FaStar className={`star ${filled ? 'filled' : 'empty'} ${size}`} />
        )}
      </span>
    );
  };

  return (
    <div className={`rating-stars ${className}`}>
      <div className="stars-container">
        {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
      </div>
      {showNumber && (
        <span className="rating-number">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

export default RatingStars;