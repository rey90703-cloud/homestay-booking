import React, { useState } from 'react';
import { FaUser, FaThumbsUp, FaReply, FaFlag, FaHeart } from 'react-icons/fa';
import { FiMoreVertical } from 'react-icons/fi';
import RatingStars from './RatingStars';
import './ReviewCard.css';

function ReviewCard({ review, onHelpful, onReply, onReport }) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful || 0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleHelpful = () => {
    if (!isHelpful) {
      setIsHelpful(true);
      setHelpfulCount(prev => prev + 1);
      if (onHelpful) onHelpful(review.id);
    }
  };

  const handleReply = () => {
    if (replyText.trim()) {
      if (onReply) onReply(review.id, replyText);
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  const getCategoryLabel = (key) => {
    const labels = {
      cleanliness: 'Sạch sẽ',
      accuracy: 'Chính xác',
      checkIn: 'Nhận phòng',
      communication: 'Giao tiếp',
      location: 'Vị trí',
      value: 'Giá trị'
    };
    return labels[key] || key;
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="user-info">
          <div className="user-avatar">
            {review.user.avatar ? (
              <img src={review.user.avatar} alt={review.user.name} />
            ) : (
              <FaUser />
            )}
          </div>
          <div className="user-details">
            <h4>{review.user.name}</h4>
            <p>Tham gia từ {formatDate(review.user.joinDate)}</p>
            {review.user.totalReviews && (
              <span className="user-stats">{review.user.totalReviews} đánh giá</span>
            )}
          </div>
        </div>
        
        <div className="review-meta">
          <div className="review-rating">
            <RatingStars rating={review.rating} size="small" />
          </div>
          <span className="review-date">{formatDate(review.date)}</span>
          <button className="more-options">
            <FiMoreVertical />
          </button>
        </div>
      </div>
      
      <div className="review-content">
        {review.title && <h5 className="review-title">{review.title}</h5>}
        <p className="review-text">{review.comment}</p>
        
        {review.images && review.images.length > 0 && (
          <div className="review-images">
            {review.images.map((image, index) => (
              <img key={index} src={image} alt={`Review ${index + 1}`} />
            ))}
          </div>
        )}
        
        {review.categories && (
          <div className="review-categories">
            <h6>Đánh giá chi tiết:</h6>
            <div className="categories-grid">
              {Object.entries(review.categories).map(([key, rating]) => (
                <div key={key} className="category-item">
                  <span className="category-label">{getCategoryLabel(key)}</span>
                  <RatingStars rating={rating} size="small" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="review-actions">
        <button 
          className={`action-btn helpful-btn ${isHelpful ? 'active' : ''}`}
          onClick={handleHelpful}
          disabled={isHelpful}
        >
          <FaThumbsUp />
          Hữu ích ({helpfulCount})
        </button>
        
        <button 
          className="action-btn reply-btn"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <FaReply />
          Trả lời
        </button>
        
        <button 
          className="action-btn report-btn"
          onClick={() => onReport && onReport(review.id)}
        >
          <FaFlag />
          Báo cáo
        </button>
        
        {review.replies && review.replies.length > 0 && (
          <button 
            className="action-btn show-replies-btn"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? 'Ẩn' : 'Xem'} {review.replies.length} phản hồi
          </button>
        )}
      </div>
      
      {showReplyForm && (
        <div className="reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Viết phản hồi của bạn..."
            rows={3}
          />
          <div className="reply-form-actions">
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText('');
              }}
            >
              Hủy
            </button>
            <button 
              className="submit-btn"
              onClick={handleReply}
              disabled={!replyText.trim()}
            >
              Gửi phản hồi
            </button>
          </div>
        </div>
      )}
      
      {showReplies && review.replies && review.replies.length > 0 && (
        <div className="replies-section">
          {review.replies.map(reply => (
            <div key={reply.id} className="reply-item">
              <div className="reply-header">
                <div className="reply-user">
                  <div className="reply-avatar">
                    {reply.user.avatar ? (
                      <img src={reply.user.avatar} alt={reply.user.name} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div className="reply-user-info">
                    <strong>{reply.user.name || reply.user}</strong>
                    {reply.user.isHost && <span className="host-badge">Chủ nhà</span>}
                  </div>
                </div>
                <span className="reply-date">{formatDate(reply.date)}</span>
              </div>
              <p className="reply-text">{reply.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewCard;