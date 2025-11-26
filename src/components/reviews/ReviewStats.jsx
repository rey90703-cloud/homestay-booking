import './ReviewStats.css';

const ReviewStats = ({ stats }) => {
  if (!stats || stats.totalReviews === 0) {
    return null;
  }

  const { totalReviews, averageRating, ratingDistribution, categoryAverages } = stats;

  const getPercentage = (count) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <div className="review-stats">
      <div className="stats-summary">
        <div className="average-rating">
          <h2>{averageRating.toFixed(1)}</h2>
          <div className="stars-large">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.round(averageRating) ? 'star filled' : 'star'}>
                ⭐
              </span>
            ))}
          </div>
          <p>{totalReviews} đánh giá</p>
        </div>

        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className="rating-bar">
              <span className="rating-label">{rating} ⭐</span>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ width: `${getPercentage(ratingDistribution[rating])}%` }}
                />
              </div>
              <span className="rating-count">{ratingDistribution[rating]}</span>
            </div>
          ))}
        </div>
      </div>

      {categoryAverages && Object.keys(categoryAverages).length > 0 && (
        <div className="category-averages">
          <h3>Đánh giá chi tiết</h3>
          <div className="category-grid">
            {Object.entries(categoryAverages).map(([category, rating]) => (
              <div key={category} className="category-stat">
                <span className="category-label">
                  {category === 'cleanliness' && '🧹 Sạch sẽ'}
                  {category === 'accuracy' && '✓ Chính xác'}
                  {category === 'checkIn' && '🔑 Check-in'}
                  {category === 'communication' && '💬 Giao tiếp'}
                  {category === 'location' && '📍 Vị trí'}
                  {category === 'value' && '💰 Giá trị'}
                </span>
                <div className="category-rating-value">
                  <span className="rating-number">{rating.toFixed(1)}</span>
                  <div className="mini-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.round(rating) ? 'mini-star filled' : 'mini-star'}>
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewStats;
