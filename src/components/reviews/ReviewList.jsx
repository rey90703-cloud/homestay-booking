import { useState, useEffect } from 'react';
import reviewService from '../../services/reviewService';
import ReviewItem from './ReviewItem';
import ReviewStats from './ReviewStats';
import './ReviewList.css';

const ReviewList = ({ homestayId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    sort: 'newest',
    rating: 'all',
    page: 1,
  });

  useEffect(() => {
    loadReviews();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homestayId, filters]);

  const loadReviews = async () => {
    setLoading(true);
    const result = await reviewService.getHomestayReviews(homestayId, filters);
    
    if (result.success) {
      setReviews(result.reviews);
      setPagination(result.pagination);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await reviewService.getReviewStats(homestayId);
    if (result.success) {
      setStats(result.stats);
    }
  };

  const handleSortChange = (sort) => {
    setFilters({ ...filters, sort, page: 1 });
  };

  const handleRatingFilter = (rating) => {
    setFilters({ ...filters, rating, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewUpdate = () => {
    loadReviews();
    loadStats();
  };

  if (loading && !reviews.length) {
    return (
      <div className="review-list-loading">
        <div className="spinner"></div>
        <p>Đang tải đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="review-list-container">
      {/* Review Statistics */}
      {stats && <ReviewStats stats={stats} />}

      {/* Filters */}
      <div className="review-filters">
        <div className="filter-group">
          <label>Sắp xếp:</label>
          <select 
            value={filters.sort} 
            onChange={(e) => handleSortChange(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="highest">Điểm cao nhất</option>
            <option value="lowest">Điểm thấp nhất</option>
            <option value="helpful">Hữu ích nhất</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Lọc theo điểm:</label>
          <div className="rating-filters">
            <button
              className={`rating-filter-btn ${filters.rating === 'all' ? 'active' : ''}`}
              onClick={() => handleRatingFilter('all')}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                className={`rating-filter-btn ${filters.rating === rating.toString() ? 'active' : ''}`}
                onClick={() => handleRatingFilter(rating.toString())}
              >
                {rating} ⭐
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>Chưa có đánh giá nào</p>
          </div>
        ) : (
          reviews.map(review => (
            <ReviewItem 
              key={review._id} 
              review={review}
              onUpdate={handleReviewUpdate}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="review-pagination">
          <button
            className="pagination-btn"
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            ← Trước
          </button>
          
          <span className="pagination-info">
            Trang {pagination.currentPage} / {pagination.totalPages}
          </span>
          
          <button
            className="pagination-btn"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
