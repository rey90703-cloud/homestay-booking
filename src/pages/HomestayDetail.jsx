import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';
import './HomestayDetail.css';

const HomestayDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [homestay, setHomestay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
  });

  useEffect(() => {
    fetchHomestayDetail();
  }, [id]);

  const fetchHomestayDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/homestays/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setHomestay(data.data.homestay);
      }
    } catch (error) {
      console.error('Error fetching homestay:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Validate booking data
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      alert('Vui lòng chọn ngày nhận phòng và trả phòng');
      return;
    }

    // Navigate to checkout page with booking data
    navigate(`/booking/${id}`, {
      state: {
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        guests: bookingData.guests,
      }
    });
  };

  const calculateNights = () => {
    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkIn = new Date(bookingData.checkInDate);
      const checkOut = new Date(bookingData.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 0;
    }
    return 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    if (nights > 0 && homestay) {
      const subtotal = homestay.pricing.basePrice * nights;
      return subtotal;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="homestay-detail-loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="homestay-not-found">
        <h2>Không tìm thấy homestay</h2>
        <button onClick={() => navigate('/')}>Quay lại trang chủ</button>
      </div>
    );
  }

  const nights = calculateNights();
  const subtotal = nights > 0 ? homestay.pricing.basePrice * nights : 0;
  const total = subtotal;

  const amenityLabels = {
    'wifi': 'WiFi tốc độ cao',
    'kitchen': 'Bếp riêng',
    'balcony': 'View hồ',
    'parking': 'Chỗ đỗ xe',
    'tv': 'TV',
    'washing_machine': 'Máy giặt',
    'air_conditioning': 'Điều hòa',
    'heating': 'Sưởi ấm',
    'workspace': 'Không gian làm việc',
    'pool': 'Hồ bơi',
    'gym': 'Phòng gym',
    'garden': 'Vườn',
  };

  return (
    <div className="listing-detail">
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Kết quả</span>
          <span className="separator">/</span>
          <span className="current">{homestay.title}</span>
        </div>

        <div className="detail-header">
          <h1>{homestay.title}</h1>
          <div className="header-badge">
            <span className="badge-text">Homestay tại {homestay.location.city}</span>
          </div>
        </div>

        <div className="detail-meta">
          <span>{homestay.capacity.guests} khách</span>
          <span>·</span>
          <span>{homestay.capacity.bedrooms} phòng ngủ</span>
          <span>·</span>
          <span>{homestay.capacity.bathrooms} phòng tắm</span>
        </div>

        <div className="detail-container">
          <div className="detail-left">
            {/* Images Gallery */}
            <div className="images-gallery">
              <div className="main-image">
                <img src={homestay.coverImage} alt={homestay.title} />
              </div>
              <div className="gallery-grid">
                {homestay.images?.slice(0, 4).map((img, index) => (
                  <div key={index} className="gallery-item">
                    <img src={img.url} alt={`${homestay.title} ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Introduction Section */}
            <div className="section-card">
              <h3 className="section-title">Giới thiệu</h3>
              <p className="description-text">{homestay.description}</p>
              <div className="amenities-pills">
                {homestay.amenityNames?.slice(0, 4).map((amenity, index) => (
                  <div key={index} className="amenity-pill">
                    <span>{amenityLabels[amenity] || amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Section */}
            <div className="section-card">
              <h3 className="section-title">Vị trí</h3>
              <div className="map-placeholder">
                <div className="map-icon">📍</div>
                <p>Bản đồ</p>
              </div>
              <p className="location-text">
                {homestay.location.address}, {homestay.location.city}, {homestay.location.country}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="section-card">
              <h3 className="section-title">
                Đánh giá · {homestay.stats?.averageRating?.toFixed(1) || '5.0'} · {homestay.stats?.totalReviews || 0} đánh giá
              </h3>
              <div className="reviews-list">
                {homestay.reviews?.slice(0, 3).map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-avatar">
                        {review.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="reviewer-info">
                        <p className="reviewer-name">{review.user?.name || 'Người dùng'}</p>
                        <p className="review-date">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="detail-right">
            {/* Booking Card */}
            <div className="booking-card">
              <div className="booking-price">
                <span className="price-amount">{homestay.pricing.basePrice.toLocaleString('vi-VN')}đ</span>
                <span className="price-unit">/ đêm</span>
              </div>

              <div className="booking-form">
                <div className="date-inputs">
                  <div className="date-input-group">
                    <label>Nhận phòng</label>
                    <input
                      type="date"
                      value={bookingData.checkInDate}
                      onChange={(e) => setBookingData({ ...bookingData, checkInDate: e.target.value })}
                    />
                  </div>
                  <div className="date-input-group">
                    <label>Trả phòng</label>
                    <input
                      type="date"
                      value={bookingData.checkOutDate}
                      onChange={(e) => setBookingData({ ...bookingData, checkOutDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="guest-input-group">
                  <label>Khách</label>
                  <select
                    value={bookingData.guests}
                    onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) })}
                  >
                    {[...Array(homestay.capacity.guests)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} người
                      </option>
                    ))}
                  </select>
                </div>

                {nights > 0 && (
                  <div className="pricing-breakdown">
                    <div className="pricing-row">
                      <span>Tạm tính ({nights} đêm)</span>
                      <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="pricing-divider"></div>
                    <div className="pricing-row total">
                      <span>Tổng</span>
                      <span>{total.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                )}

                <button className="btn-book" onClick={handleBooking}>
                  Đặt ngay
                </button>

                <p className="booking-disclaimer">
                  Bạn sẽ không bị trừ tiền ngay lúc này
                </p>
              </div>
            </div>

            {/* Host Info Card */}
            <div className="host-card">
              <h3 className="section-title">Chủ nhà</h3>
              <div className="host-info">
                <div className="host-avatar">
                  {homestay.owner?.name?.charAt(0) || 'H'}
                </div>
                <div className="host-details">
                  <p className="host-name">{homestay.owner?.name || 'Chủ nhà'}</p>
                  <p className="host-status">Đã xác minh · Phản hồi trong 1 giờ</p>
                </div>
              </div>
              <div className="host-rules">
                <div className="rule-item">
                  <span className="rule-icon">🕐</span>
                  <span>Check-in sau 14:00 · Check-out trước 11:00</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🚭</span>
                  <span>Không hút thuốc</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🐾</span>
                  <span>Không thú cưng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default HomestayDetail;

