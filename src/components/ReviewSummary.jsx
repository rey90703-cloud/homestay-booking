import React from 'react';
import { useNavigate } from 'react-router-dom';
import RatingStars from './RatingStars';
import './ReviewSummary.css';

function ReviewSummary({ 
  homestayId, 
  averageRating = 0, 
  totalReviews = 0, 
  recentReviews = [], 
  showViewAllButton = true,
  maxReviews = 3 
}) {
  const navigate = useNavigate();

  const handleViewAllReviews = () => {
    navigate(`/homestay/${homestayId}/reviews`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (totalReviews === 0) {
    return (
      <div className="review-summary">
        <div className="no-reviews">
          <h3>Chưa có đánh giá</h3>
          <p>Hãy là người đầu tiên đánh giá homestay này!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-summary">
      <div className="review-summary-header">
        <h3 className="section-title">
          <RatingStars rating={averageRating} size="medium" showNumber={true} />
          <span className="review-count">· {totalReviews} đánh giá</span>
        </h3>
      </div>

      <div className="recent-reviews">
        {recentReviews.slice(0, maxReviews).map((review, index) => (
          <div key={review.id || index} className="review-preview">
            <div className="review-preview-header">
              <div className="reviewer-avatar">
                {review.user?.avatar ? (
                  <img src={review.user.avatar} alt={review.user.name} />
                ) : (
                  <span>{review.user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="reviewer-info">
                <h4 className="reviewer-name">{review.user?.name || 'Người dùng'}</h4>
                <div className="review-meta">
                  <RatingStars rating={review.rating} size="small" />
                  <span className="review-date">{formatDate(review.createdAt || review.date)}</span>
                </div>
              </div>
            </div>
            
            <div className="review-preview-content">
              {review.title && <h5 className="review-title">{review.title}</h5>}
              <p className="review-excerpt">
                {review.comment.length > 150 
                  ? `${review.comment.substring(0, 150)}...` 
                  : review.comment
                }
              </p>
            </div>
          </div>
        ))}
      </div>

      {showViewAllButton && totalReviews > maxReviews && (
        <button 
          className="view-all-reviews-btn"
          onClick={handleViewAllReviews}
        >
          Xem tất cả {totalReviews} đánh giá
        </button>
      )}
    </div>
  );
}

export default ReviewSummary;