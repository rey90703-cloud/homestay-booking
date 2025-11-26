import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Reviews.css';
import { FaStar, FaUser, FaThumbsUp, FaReply, FaFlag } from 'react-icons/fa';
import { FiMoreVertical } from 'react-icons/fi';
import RatingStars from '../components/RatingStars';
import ReviewCard from '../components/ReviewCard';

function Reviews() {
  const { id: homestayId } = useParams();
  const navigate = useNavigate();
  const [homestay, setHomestay] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    categories: {
      cleanliness: 5,
      accuracy: 5,
      checkIn: 5,
      communication: 5,
      location: 5,
      value: 5
    }
  });
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');

  useEffect(() => {
    fetchHomestayAndReviews();
  }, [homestayId, sortBy, filterRating]);

  const fetchHomestayAndReviews = async () => {
    try {
      setLoading(true);
      // Fetch homestay details
      const homestayResponse = await fetch(`http://localhost:5001/api/v1/homestays/${homestayId}`);
      const homestayData = await homestayResponse.json();
      
      if (homestayData.success) {
        setHomestay(homestayData.data);
      }

      // Fetch reviews
      const reviewsResponse = await fetch(`http://localhost:5001/api/v1/homestays/${homestayId}/reviews?sort=${sortBy}&rating=${filterRating}`);
      const reviewsData = await reviewsResponse.json();
      
      if (reviewsData.success) {
        setReviews(reviewsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Mock data for development
      setHomestay({
        title: 'Villa sang trọng phố cổ Hà Nội',
        stats: {
          averageRating: 4.7,
          totalReviews: 89
        }
      });
      setReviews(mockReviews);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5001/api/v1/homestays/${homestayId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newReview)
      });

      if (response.ok) {
        setShowReviewForm(false);
        setNewReview({
          rating: 5,
          title: '',
          comment: '',
          categories: {
            cleanliness: 5,
            accuracy: 5,
            checkIn: 5,
            communication: 5,
            location: 5,
            value: 5
          }
        });
        fetchHomestayAndReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleRatingChange = (category, rating) => {
    if (category === 'overall') {
      setNewReview(prev => ({ ...prev, rating }));
    } else {
      setNewReview(prev => ({
        ...prev,
        categories: { ...prev.categories, [category]: rating }
      }));
    }
  };

  const handleHelpful = (reviewId) => {
    console.log('Helpful clicked for review:', reviewId);
  };

  const handleReply = (reviewId, replyText) => {
    console.log('Reply to review:', reviewId, replyText);
  };

  const handleReport = (reviewId) => {
    console.log('Report review:', reviewId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const mockReviews = [
    {
      id: '1',
      user: {
        name: 'Nguyễn Văn A',
        avatar: '/images/avatar1.jpg',
        joinDate: '2023-01-15',
        totalReviews: 12
      },
      rating: 5,
      title: 'Trải nghiệm tuyệt vời!',
      comment: 'Homestay rất đẹp và sạch sẽ. Chủ nhà thân thiện, nhiệt tình. Vị trí thuận lợi, gần các điểm tham quan. Chắc chắn sẽ quay lại!',
      date: '2024-11-10',
      categories: {
        cleanliness: 5,
        accuracy: 5,
        checkIn: 5,
        communication: 5,
        location: 5,
        value: 5
      },
      helpful: 12,
      replies: []
    },
    {
      id: '2',
      user: {
        name: 'Trần Thị B',
        avatar: '/images/avatar2.jpg',
        joinDate: '2022-08-20',
        totalReviews: 8
      },
      rating: 4,
      title: 'Tốt nhưng có thể cải thiện',
      comment: 'Nhà đẹp, vị trí tốt. Tuy nhiên wifi hơi chậm và thiếu một số tiện nghi nhỏ. Nhìn chung vẫn hài lòng.',
      date: '2024-11-08',
      categories: {
        cleanliness: 4,
        accuracy: 4,
        checkIn: 5,
        communication: 4,
        location: 5,
        value: 4
      },
      helpful: 8,
      replies: [
        {
          id: 'r1',
          user: {
            name: 'Chủ nhà',
            isHost: true
          },
          comment: 'Cảm ơn bạn đã góp ý. Chúng tôi đã nâng cấp wifi và bổ sung thêm tiện nghi.',
          date: '2024-11-09'
        }
      ]
    },
    {
      id: '3',
      user: {
        name: 'Lê Minh C',
        avatar: null,
        joinDate: '2024-01-10',
        totalReviews: 3
      },
      rating: 5,
      title: 'Hoàn hảo cho kỳ nghỉ',
      comment: 'Không gian yên tĩnh, thoáng mát. Phòng ốc sạch sẽ, đầy đủ tiện nghi. Chủ nhà rất chu đáo và hỗ trợ nhiệt tình.',
      date: '2024-11-05',
      categories: {
        cleanliness: 5,
        accuracy: 5,
        checkIn: 5,
        communication: 5,
        location: 4,
        value: 5
      },
      helpful: 15,
      replies: []
    }
  ];

  if (loading) {
    return (
      <div className="reviews-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="reviews-page">
      <div className="reviews-container">
        {/* Header */}
        <div className="reviews-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          <div className="homestay-info">
            <h1>{homestay?.title}</h1>
            <div className="rating-summary">
              <div className="overall-rating">
                <RatingStars 
                  rating={homestay?.stats?.averageRating || 4.7} 
                  size="large" 
                  showNumber={true}
                />
                <span className="review-count">({homestay?.stats?.totalReviews || 89} đánh giá)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="rating-breakdown">
          <div className="rating-bars">
            <h3>Phân bố đánh giá</h3>
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="rating-bar">
                <span className="rating-label">{rating} sao</span>
                <div className="bar">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${Math.random() * 80 + 10}%` }}
                  ></div>
                </div>
                <span className="rating-count">{Math.floor(Math.random() * 20)}</span>
              </div>
            ))}
          </div>
          
          <div className="category-ratings">
            <h3>Đánh giá theo danh mục</h3>
            <div className="categories">
              {[
                { key: 'cleanliness', label: 'Độ sạch sẽ', rating: 4.8 },
                { key: 'accuracy', label: 'Độ chính xác', rating: 4.7 },
                { key: 'checkIn', label: 'Nhận phòng', rating: 4.9 },
                { key: 'communication', label: 'Giao tiếp', rating: 4.6 },
                { key: 'location', label: 'Vị trí', rating: 4.8 },
                { key: 'value', label: 'Giá trị', rating: 4.5 }
              ].map(category => (
                <div key={category.key} className="category-item">
                  <span className="category-label">{category.label}</span>
                  <div className="category-rating">
                    <RatingStars rating={category.rating} size="small" />
                    <span className="category-score">{category.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="reviews-controls">
          <div className="filters">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Điểm cao nhất</option>
              <option value="lowest">Điểm thấp nhất</option>
              <option value="helpful">Hữu ích nhất</option>
            </select>
            
            <select 
              value={filterRating} 
              onChange={(e) => setFilterRating(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
          
          <button 
            className="write-review-btn"
            onClick={() => setShowReviewForm(true)}
          >
            Viết đánh giá
          </button>
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="review-form-overlay">
            <div className="review-form">
              <div className="form-header">
                <h3>Viết đánh giá</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowReviewForm(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitReview}>
                <div className="rating-section">
                  <h4>Đánh giá tổng thể</h4>
                  <RatingStars 
                    rating={newReview.rating} 
                    interactive={true} 
                    onRatingChange={(rating) => handleRatingChange('overall', rating)}
                    size="large"
                  />
                </div>
                
                <div className="category-ratings-form">
                  <h4>Đánh giá chi tiết</h4>
                  {[
                    { key: 'cleanliness', label: 'Độ sạch sẽ' },
                    { key: 'accuracy', label: 'Độ chính xác' },
                    { key: 'checkIn', label: 'Nhận phòng' },
                    { key: 'communication', label: 'Giao tiếp' },
                    { key: 'location', label: 'Vị trí' },
                    { key: 'value', label: 'Giá trị' }
                  ].map(category => (
                    <div key={category.key} className="category-rating-input">
                      <label>{category.label}</label>
                      <RatingStars 
                        rating={newReview.categories[category.key]} 
                        interactive={true} 
                        onRatingChange={(rating) => handleRatingChange(category.key, rating)}
                        size="medium"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="form-group">
                  <label>Tiêu đề đánh giá</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Tóm tắt trải nghiệm của bạn"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Bình luận chi tiết</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Chia sẻ trải nghiệm chi tiết của bạn..."
                    rows={5}
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => setShowReviewForm(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="submit-btn">
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
              onReply={handleReply}
              onReport={handleReport}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reviews;