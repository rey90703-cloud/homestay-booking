import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import reviewService from '../../services/reviewService';
import './ReviewForm.css';

const ReviewForm = ({ homestayId, bookingId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bookingId: bookingId || '',
    rating: 5,
    categories: {
      cleanliness: 5,
      accuracy: 5,
      checkIn: 5,
      communication: 5,
      location: 5,
      value: 5,
    },
    title: '',
    comment: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(null);

  useEffect(() => {
    checkReviewEligibility();
  }, [homestayId]);

  const checkReviewEligibility = async () => {
    if (!user) {
      setCanReview({ success: false, error: 'Please login to review' });
      return;
    }
    
    try {
      const result = await reviewService.canUserReview(homestayId);
      setCanReview(result);
      
      if (result.success && result.data.canReview && result.data.bookingId) {
        setFormData(prev => ({ ...prev, bookingId: result.data.bookingId }));
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview({ success: false, error: 'Failed to check eligibility' });
    }
  };

  const handleRatingChange = (field, value) => {
    if (field === 'rating') {
      setFormData({ ...formData, rating: value });
    } else {
      setFormData({
        ...formData,
        categories: { ...formData.categories, [field]: value }
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Vui lòng chọn điểm đánh giá';
    }

    if (!formData.comment || formData.comment.trim().length < 10) {
      newErrors.comment = 'Nhận xét phải có ít nhất 10 ký tự';
    }

    if (formData.comment && formData.comment.length > 1000) {
      newErrors.comment = 'Nhận xét không được quá 1000 ký tự';
    }

    if (formData.title && formData.title.length > 100) {
      newErrors.title = 'Tiêu đề không được quá 100 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const result = await reviewService.createReview(homestayId, formData);

    if (result.success) {
      alert('Đánh giá của bạn đã được gửi thành công!');
      if (onSuccess) onSuccess();
    } else {
      alert(result.error || 'Có lỗi xảy ra. Vui lòng thử lại!');
    }

    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="review-form-message">
        <p>Vui lòng đăng nhập để đánh giá</p>
      </div>
    );
  }

  if (canReview && !canReview.data?.canReview) {
    return (
      <div className="review-form-message">
        <p>{canReview.data?.reason || 'Bạn không thể đánh giá homestay này'}</p>
      </div>
    );
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Viết đánh giá của bạn</h3>

      {/* Overall Rating */}
      <div className="form-group">
        <label>Đánh giá tổng thể *</label>
        <div className="star-rating-input">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= formData.rating ? 'active' : ''}`}
              onClick={() => handleRatingChange('rating', star)}
            >
              ⭐
            </button>
          ))}
          <span className="rating-text">{formData.rating}/5</span>
        </div>
        {errors.rating && <span className="error-text">{errors.rating}</span>}
      </div>

      {/* Category Ratings */}
      <div className="form-group">
        <label>Đánh giá chi tiết</label>
        <div className="category-ratings-input">
          {[
            { key: 'cleanliness', label: '🧹 Sạch sẽ' },
            { key: 'accuracy', label: '✓ Chính xác' },
            { key: 'checkIn', label: '🔑 Check-in' },
            { key: 'communication', label: '💬 Giao tiếp' },
            { key: 'location', label: '📍 Vị trí' },
            { key: 'value', label: '💰 Giá trị' },
          ].map(({ key, label }) => (
            <div key={key} className="category-rating-input">
              <span className="category-label">{label}</span>
              <div className="star-rating-mini">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn-mini ${star <= formData.categories[key] ? 'active' : ''}`}
                    onClick={() => handleRatingChange(key, star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="form-group">
        <label>Tiêu đề (tùy chọn)</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Tóm tắt trải nghiệm của bạn"
          maxLength="100"
        />
        {errors.title && <span className="error-text">{errors.title}</span>}
      </div>

      {/* Comment */}
      <div className="form-group">
        <label>Nhận xét *</label>
        <textarea
          name="comment"
          value={formData.comment}
          onChange={handleInputChange}
          placeholder="Chia sẻ trải nghiệm của bạn về homestay này..."
          rows="5"
          maxLength="1000"
        />
        <div className="char-count">
          {formData.comment.length}/1000 ký tự
        </div>
        {errors.comment && <span className="error-text">{errors.comment}</span>}
      </div>

      {/* Actions */}
      <div className="form-actions">
        {onCancel && (
          <button 
            type="button" 
            className="btn-cancel"
            onClick={onCancel}
          >
            Hủy
          </button>
        )}
        <button 
          type="submit" 
          className="btn-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
