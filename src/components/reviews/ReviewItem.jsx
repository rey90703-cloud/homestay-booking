import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import reviewService from '../../services/reviewService';
import './ReviewItem.css';

const ReviewItem = ({ review, onUpdate }) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleMarkHelpful = async () => {
    const result = await reviewService.markReviewHelpful(review._id);
    if (result.success) {
      onUpdate();
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const result = await reviewService.replyToReview(review._id, { comment: replyText });
    
    if (result.success) {
      setReplyText('');
      setShowReplyForm(false);
      onUpdate();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    const result = await reviewService.deleteReview(review._id);
    if (result.success) {
      onUpdate();
    }
  };

  const handleReport = async () => {
    const reason = prompt('Lý do báo cáo:');
    if (!reason) return;

    const result = await reviewService.reportReview(review._id, reason);
    if (result.success) {
      alert('Đã báo cáo đánh giá');
    }
  };

  const isOwner = user && review.guestId?._id === user._id;
  const isHost = user && review.hostId === user._id;

  return (
    <div className="review-item">
      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {review.guestId?.profile?.avatar ? (
              <img src={review.guestId.profile.avatar} alt={review.guestId.profile.name} />
            ) : (
              <div className="avatar-placeholder">
                {(review.guestId?.fullName?.charAt(0) || 
                  review.guestId?.profile?.firstName?.charAt(0) || 
                  review.guestId?.profile?.lastName?.charAt(0) || 
                  'U').toUpperCase()}
              </div>
            )}
          </div>
          <div className="reviewer-details">
            <h4>
              {review.guestId?.fullName || 
               (review.guestId?.profile?.firstName && review.guestId?.profile?.lastName 
                 ? `${review.guestId.profile.firstName} ${review.guestId.profile.lastName}`.trim()
                 : review.guestId?.profile?.firstName || review.guestId?.profile?.lastName || 'Anonymous')}
            </h4>
            <p className="review-date">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        <div className="review-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < review.rating ? 'star filled' : 'star'}>
                ⭐
              </span>
            ))}
          </div>
          <span className="rating-number">{review.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Category Ratings */}
      {review.categories && Object.keys(review.categories).length > 0 && (
        <div className="category-ratings">
          {Object.entries(review.categories).map(([category, rating]) => (
            <div key={category} className="category-rating">
              <span className="category-name">
                {category === 'cleanliness' && 'Sạch sẽ'}
                {category === 'accuracy' && 'Chính xác'}
                {category === 'checkIn' && 'Check-in'}
                {category === 'communication' && 'Giao tiếp'}
                {category === 'location' && 'Vị trí'}
                {category === 'value' && 'Giá trị'}
              </span>
              <div className="category-stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < rating ? 'mini-star filled' : 'mini-star'}>
                    ⭐
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Content */}
      <div className="review-content">
        {review.title && <h5 className="review-title">{review.title}</h5>}
        <p className="review-comment">{review.comment}</p>
      </div>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="review-images">
          {review.images.map((image, index) => (
            <img key={index} src={image.url} alt={`Review ${index + 1}`} />
          ))}
        </div>
      )}

      {/* Host Reply */}
      {review.hostReply && review.hostReply.comment && (
        <div className="host-reply">
          <div className="reply-header">
            <strong>Phản hồi từ chủ nhà</strong>
            <span className="reply-date">{formatDate(review.hostReply.repliedAt)}</span>
          </div>
          <p>{review.hostReply.comment}</p>
        </div>
      )}

      {/* Actions */}
      <div className="review-actions">
        <button 
          className="action-btn helpful-btn"
          onClick={handleMarkHelpful}
        >
          👍 Hữu ích ({review.helpfulCount || 0})
        </button>

        {isHost && !review.hostReply?.comment && (
          <button 
            className="action-btn reply-btn"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            💬 Trả lời
          </button>
        )}

        {isOwner && (
          <button 
            className="action-btn delete-btn"
            onClick={handleDelete}
          >
            🗑️ Xóa
          </button>
        )}

        {!isOwner && user && (
          <button 
            className="action-btn report-btn"
            onClick={handleReport}
          >
            ⚠️ Báo cáo
          </button>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Viết phản hồi của bạn..."
            rows="3"
            maxLength="500"
          />
          <div className="reply-form-actions">
            <button 
              className="btn-cancel"
              onClick={() => setShowReplyForm(false)}
            >
              Hủy
            </button>
            <button 
              className="btn-submit"
              onClick={handleReply}
              disabled={isSubmitting || !replyText.trim()}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewItem;
