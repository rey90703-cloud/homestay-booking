import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';
import GoogleMap from '../components/GoogleMap';
import { ReviewList, ReviewForm } from '../components/reviews';
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
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');
  const [mapUrls, setMapUrls] = useState({ directionsUrl: '', viewUrl: '' });
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState({
    checking: false,
    available: null,
    message: '',
  });

  useEffect(() => {
    fetchHomestayDetail();
  }, [id]);

  const handleContactHost = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để liên hệ chủ nhà');
      navigate('/login');
      return;
    }

    if (!homestay?.hostId?._id) {
      alert('Không thể liên hệ chủ nhà lúc này');
      return;
    }

    // Dispatch custom event to open chat widget with host
    const event = new CustomEvent('openChat', {
      detail: {
        recipientId: homestay.hostId._id,
        recipientName: homestay.hostId.profile?.firstName && homestay.hostId.profile?.lastName
          ? `${homestay.hostId.profile.firstName} ${homestay.hostId.profile.lastName}`
          : homestay.hostId.email || 'Chủ nhà',
        recipientAvatar: homestay.hostId.profile?.avatar,
      }
    });
    window.dispatchEvent(event);
  };

  const fetchHomestayDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/homestays/${id}`);
      const data = await response.json();
      
      if (data.success) {
        const homestayData = data.data.homestay;
        setHomestay(homestayData);
        
        // Fetch map URLs if coordinates exist
        if (homestayData.location?.coordinates?.coordinates) {
          const [lng, lat] = homestayData.location.coordinates.coordinates;
          const placeId = homestayData.location?.placeId;
          await fetchMapUrls(lat, lng, placeId);
        }
      }
    } catch (error) {
      console.error('Error fetching homestay:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMapUrls = async (lat, lng, placeId = null) => {
    try {
      // Fetch embed URL
      const embedResponse = await fetch(`${API_BASE_URL}/config/maps/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, zoom: 15 }),
      });
      const embedData = await embedResponse.json();
      if (embedData.success) {
        setMapEmbedUrl(embedData.data.embedUrl);
      }

      // Fetch directions URLs with Place ID if available
      const directionsResponse = await fetch(`${API_BASE_URL}/config/maps/directions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, placeId }),
      });
      const directionsData = await directionsResponse.json();
      if (directionsData.success) {
        setMapUrls(directionsData.data);
      }
    } catch (error) {
      console.error('Error fetching map URLs:', error);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Validate booking data
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      alert('⚠️ Vui lòng chọn ngày nhận phòng và trả phòng');
      return;
    }

    // Validate dates
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      alert('⚠️ Ngày nhận phòng không thể là ngày trong quá khứ');
      return;
    }

    if (checkOut <= checkIn) {
      alert('⚠️ Ngày trả phòng phải sau ngày nhận phòng');
      return;
    }

    // Check availability before proceeding
    setCheckingAvailability(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/check-availability/${id}?checkInDate=${bookingData.checkInDate}&checkOutDate=${bookingData.checkOutDate}`
      );
      const data = await response.json();

      if (data.success && !data.data.available) {
        let message = '❌ PHÒNG ĐÃ BỊ TRÙNG LỊCH!\n';
        
        if (data.data.overlapPeriods && data.data.overlapPeriods.length > 0) {
          message += '📅 Vào ngày :\n';
          data.data.overlapPeriods.forEach((period, index) => {
            const overlapStart = new Date(period.overlapStart).toLocaleDateString('vi-VN');
            const overlapEnd = new Date(period.overlapEnd).toLocaleDateString('vi-VN');
            message += `   ${index + 1}. ${overlapStart} - ${overlapEnd}\n`;
          });
        }
        
        message += '⚠️ Homestay này đã có người đặt trong khoảng thời gian trên.\n';
        message += '💡 Vui lòng chọn ngày khác để tránh trùng lịch.';
        
        alert(message);
        setCheckingAvailability(false);
        return;
      }

      // If available, navigate to checkout
      navigate(`/booking/${id}`, {
        state: {
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          guests: bookingData.guests,
        }
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('⚠️ Không thể kiểm tra tình trạng phòng. Vui lòng thử lại!');
    } finally {
      setCheckingAvailability(false);
    }
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
              {mapEmbedUrl && (
                <div className="map-container">
                  <iframe
                    width="100%"
                    height="450"
                    style={{ border: 0, borderRadius: '12px' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapEmbedUrl}
                  ></iframe>
                  
                  <div className="map-actions" style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    {mapUrls.directionsUrl && (
                      <a
                        href={mapUrls.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-directions"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          background: '#4285f4',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'background 0.2s'
                        }}
                      >
                        🚗 Chỉ đường đến đây
                      </a>
                    )}
                    {mapUrls.viewUrl && (
                      <a
                        href={mapUrls.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-view-map"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          background: 'white',
                          color: '#4285f4',
                          textDecoration: 'none',
                          border: '1px solid #4285f4',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        <img 
                          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQieO4YO7vglQcG7iTln_Tp5cV7klER0X-VnA&s" 
                          alt="Google Maps"
                          style={{ width: '20px', height: '20px' }}
                        />
                        Xem trên Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}
              <p className="location-text" style={{ marginTop: '16px' }}>
                📍 {homestay.location.address}, {homestay.location.city}, {homestay.location.country}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="section-card">
              <h3 className="section-title">
                Đánh giá · {homestay.stats?.averageRating?.toFixed(1) || '0.0'} · {homestay.stats?.totalReviews || 0} đánh giá
              </h3>
              
              {/* Review Form for eligible users */}
              {isAuthenticated && (
                <ReviewForm 
                  homestayId={id}
                  onSuccess={() => {
                    fetchHomestayDetail();
                    window.scrollTo({ top: document.querySelector('.reviews-list')?.offsetTop, behavior: 'smooth' });
                  }}
                />
              )}

              {/* Reviews List */}
              <ReviewList homestayId={id} />
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

                <button 
                  className="btn-book" 
                  onClick={handleBooking}
                  disabled={checkingAvailability}
                >
                  {checkingAvailability ? '🔍 Đang kiểm tra...' : 'Đặt ngay'}
                </button>

                <p className="booking-disclaimer">
                  {checkingAvailability 
                    ? 'Đang kiểm tra tình trạng phòng...' 
                    : 'Bạn sẽ không bị trừ tiền ngay lúc này'}
                </p>
              </div>
            </div>

            {/* Host Info Card */}
            <div className="host-card">
              <h3 className="section-title">Chủ nhà</h3>
              <div className="host-info">
                {homestay.hostId?.profile?.avatar ? (
                  <img 
                    src={homestay.hostId.profile.avatar} 
                    alt={`${homestay.hostId.profile.firstName} ${homestay.hostId.profile.lastName}`}
                    className="host-avatar-img"
                  />
                ) : (
                  <div className="host-avatar">
                    {homestay.hostId?.profile?.firstName?.charAt(0) || homestay.hostId?.email?.charAt(0) || 'H'}
                  </div>
                )}
                <div className="host-details">
                  <p className="host-name">
                    {homestay.hostId?.profile?.firstName && homestay.hostId?.profile?.lastName
                      ? `${homestay.hostId.profile.firstName} ${homestay.hostId.profile.lastName}`
                      : homestay.hostId?.email || 'Chủ nhà'}
                  </p>
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
              <button 
                className="btn-contact-host" 
                onClick={handleContactHost}
                disabled={!isAuthenticated}
              >
                <span>💬</span>
                <span>Liên hệ chủ nhà</span>
              </button>
              {!isAuthenticated && (
                <p className="contact-note">Vui lòng đăng nhập để liên hệ chủ nhà</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default HomestayDetail;

