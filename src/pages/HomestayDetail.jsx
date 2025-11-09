import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './HomestayDetail.css';

const HomestayDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [homestay, setHomestay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
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
      const response = await fetch(`http://localhost:5001/api/v1/homestays/${id}`);
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
    // Handle booking logic
    console.log('Booking:', bookingData);
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
      const basePrice = homestay.pricing.basePrice * nights;
      const cleaningFee = homestay.pricing.cleaningFee || 0;
      const serviceFee = homestay.pricing.serviceFee || 0;
      return basePrice + cleaningFee + serviceFee;
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
        <button onClick={() => navigate('/search')}>Quay lại tìm kiếm</button>
      </div>
    );
  }

  return (
    <div className="homestay-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="header-content">
          <h1 className="homestay-title">{homestay.title}</h1>
          <div className="header-info">
            <span className="rating">
              ⭐ {homestay.stats.averageRating.toFixed(1)} ({homestay.stats.totalReviews} đánh giá)
            </span>
            <span className="location">
              📍 {homestay.location.city}, {homestay.location.country}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-share">
            <span>🔗</span> Chia sẻ
          </button>
          <button className="btn-save">
            <span>❤️</span> Lưu
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="image-gallery">
        <div className="main-image">
          <img 
            src={homestay.images[selectedImage]?.url || '/placeholder.jpg'} 
            alt={homestay.title}
          />
        </div>
        <div className="thumbnail-grid">
          {homestay.images.slice(0, 5).map((image, index) => (
            <div 
              key={index}
              className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
              onClick={() => setSelectedImage(index)}
            >
              <img src={image.url} alt={`View ${index + 1}`} />
              {index === 4 && homestay.images.length > 5 && (
                <div className="more-images">
                  +{homestay.images.length - 5} ảnh
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Left Column */}
        <div className="content-left">
          {/* Host Info */}
          <section className="host-section">
            <div className="host-info">
              <div className="host-avatar">
                <img src={homestay.hostId?.profile?.avatar || '/default-avatar.png'} alt="Host" />
              </div>
              <div className="host-details">
                <h3>Chủ nhà: {homestay.hostId?.fullName || 'Host'}</h3>
                <p>{homestay.hostId?.profile?.bio || 'Chào mừng bạn đến với homestay của tôi!'}</p>
              </div>
            </div>
            {homestay.hostId?.hostProfile?.superhost && (
              <div className="superhost-badge">⭐ Superhost</div>
            )}
          </section>

          {/* Basic Info */}
          <section className="info-section">
            <h2>Thông tin cơ bản</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-icon">👥</span>
                <div>
                  <strong>{homestay.capacity.guests} khách</strong>
                  <p>Tối đa</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">🛏️</span>
                <div>
                  <strong>{homestay.capacity.bedrooms} phòng ngủ</strong>
                  <p>{homestay.capacity.beds} giường</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">🚿</span>
                <div>
                  <strong>{homestay.capacity.bathrooms} phòng tắm</strong>
                  <p>Riêng biệt</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">🏠</span>
                <div>
                  <strong>
                    {homestay.propertyType === 'entire_place' ? 'Toàn bộ nhà' :
                     homestay.propertyType === 'private_room' ? 'Phòng riêng' : 'Phòng chung'}
                  </strong>
                  <p>Loại phòng</p>
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="description-section">
            <h2>Mô tả</h2>
            <p className="description-text">{homestay.description}</p>
          </section>

          {/* Amenities */}
          <section className="amenities-section">
            <h2>Tiện nghi</h2>
            <div className="amenities-grid">
              {homestay.amenityNames.map((amenity, index) => (
                <div key={index} className="amenity-item">
                  <span className="amenity-icon">✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </section>

          {/* House Rules */}
          <section className="rules-section">
            <h2>Nội quy nhà</h2>
            <div className="rules-list">
              <div className="rule-item">
                <span className="rule-icon">🕐</span>
                <div>
                  <strong>Nhận phòng:</strong> {homestay.houseRules.checkInTime}
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-icon">🕐</span>
                <div>
                  <strong>Trả phòng:</strong> {homestay.houseRules.checkOutTime}
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-icon">{homestay.houseRules.smokingAllowed ? '✓' : '❌'}</span>
                <div>
                  <strong>Hút thuốc:</strong> {homestay.houseRules.smokingAllowed ? 'Được phép' : 'Không được phép'}
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-icon">{homestay.houseRules.petsAllowed ? '✓' : '❌'}</span>
                <div>
                  <strong>Thú cưng:</strong> {homestay.houseRules.petsAllowed ? 'Được phép' : 'Không được phép'}
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-icon">{homestay.houseRules.partiesAllowed ? '✓' : '❌'}</span>
                <div>
                  <strong>Tiệc tùng:</strong> {homestay.houseRules.partiesAllowed ? 'Được phép' : 'Không được phép'}
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-icon">🌙</span>
                <div>
                  <strong>Số đêm tối thiểu:</strong> {homestay.houseRules.minNights} đêm
                </div>
              </div>
            </div>
            {homestay.houseRules.additionalRules && homestay.houseRules.additionalRules.length > 0 && (
              <div className="additional-rules">
                <h3>Quy định bổ sung:</h3>
                <ul>
                  {homestay.houseRules.additionalRules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Location */}
          <section className="location-section">
            <h2>Vị trí</h2>
            <div className="location-info">
              <p className="address">
                <strong>📍 Địa chỉ:</strong> {homestay.location.address}
              </p>
              <p className="city">
                {homestay.location.city}, {homestay.location.country}
              </p>
            </div>
            <div className="map-placeholder">
              <p>🗺️ Bản đồ sẽ hiển thị tại đây</p>
            </div>
          </section>
        </div>

        {/* Right Column - Booking Card */}
        <div className="content-right">
          <div className="booking-card">
            <div className="booking-header">
              <div className="price">
                <span className="price-amount">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(homestay.pricing.basePrice)}
                </span>
                <span className="price-unit">/đêm</span>
              </div>
              <div className="rating-small">
                ⭐ {homestay.stats.averageRating.toFixed(1)} ({homestay.stats.totalReviews})
              </div>
            </div>

            <div className="booking-form">
              <div className="form-group">
                <label>Nhận phòng</label>
                <input
                  type="date"
                  value={bookingData.checkInDate}
                  onChange={(e) => setBookingData({ ...bookingData, checkInDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Trả phòng</label>
                <input
                  type="date"
                  value={bookingData.checkOutDate}
                  onChange={(e) => setBookingData({ ...bookingData, checkOutDate: e.target.value })}
                  min={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Số khách</label>
                <select
                  value={bookingData.guests}
                  onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) })}
                >
                  {[...Array(homestay.capacity.guests)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} khách
                    </option>
                  ))}
                </select>
              </div>

              {calculateNights() > 0 && (
                <div className="price-breakdown">
                  <div className="breakdown-item">
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(homestay.pricing.basePrice)} x {calculateNights()} đêm</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(homestay.pricing.basePrice * calculateNights())}</span>
                  </div>
                  {homestay.pricing.cleaningFee > 0 && (
                    <div className="breakdown-item">
                      <span>Phí vệ sinh</span>
                      <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(homestay.pricing.cleaningFee)}</span>
                    </div>
                  )}
                  {homestay.pricing.serviceFee > 0 && (
                    <div className="breakdown-item">
                      <span>Phí dịch vụ</span>
                      <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(homestay.pricing.serviceFee)}</span>
                    </div>
                  )}
                  <div className="breakdown-total">
                    <strong>Tổng cộng</strong>
                    <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}</strong>
                  </div>
                </div>
              )}

              <button className="btn-booking" onClick={handleBooking}>
                {isAuthenticated ? 'Đặt phòng' : 'Đăng nhập để đặt phòng'}
              </button>

              <p className="booking-note">Bạn sẽ chưa bị trừ tiền</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomestayDetail;
