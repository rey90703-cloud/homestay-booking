import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Default booking data
  const defaultData = {
    bookingCode: 'HS-9X72K',
    homestay: {
      title: 'The Chill House – Tây Hồ',
      location: 'Hà Nội, Việt Nam',
      coverImage: '/images/homestay-placeholder.jpg',
    },
    checkInDate: '2025-11-10',
    checkOutDate: '2025-11-12',
    guests: 2,
    nights: 2,
    pricing: {
      basePrice: 650000,
      discount: 130000,
      cleaningFee: 0,
      serviceFee: 0,
      total: 1170000,
    },
    guest: {
      name: 'Nguyễn Văn A',
      phone: '+84 912 345 678',
      email: 'email@domain.com',
      specialRequests: 'Không',
    },
    payment: {
      method: 'MoMo',
      cardLast4: '',
      expiryDate: '',
    },
    host: {
      name: 'Lan Trần',
      avatar: '/images/host-avatar.jpg',
      verified: true,
      responseTime: '~1h',
    },
  };

  const [bookingData, setBookingData] = useState(defaultData);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Get booking data from location state or use default
    if (location.state) {
      setBookingData({
        ...defaultData,
        ...location.state,
        homestay: { ...defaultData.homestay, ...(location.state.homestay || {}) },
        pricing: { ...defaultData.pricing, ...(location.state.pricing || {}) },
        guest: { ...defaultData.guest, ...(location.state.guest || {}) },
        payment: { ...defaultData.payment, ...(location.state.payment || {}) },
        host: { ...defaultData.host, ...(location.state.host || {}) },
      });
    }
  }, [bookingId, isAuthenticated, location.state, navigate]);

  const handleDownloadInvoice = () => {
    console.log('Download invoice');
    // TODO: Implement PDF download
  };

  const handleDownloadTicket = () => {
    console.log('Download ticket');
    // TODO: Implement ticket download
  };

  const handleContactHost = (method) => {
    console.log('Contact host via:', method);
    // TODO: Implement contact functionality
  };



  return (
    <div className="payment-success">
      <div className="success-container">
        {/* Left Column */}
        <div className="success-left">
          {/* Booking Details Card */}
          <div className="success-card">
            <div className="card-header">
              <h3>Chi tiết đặt chỗ</h3>
              <div className="booking-dates">
                <span>📅</span>
                <span>{new Date(bookingData.checkInDate).toLocaleDateString('vi-VN')}–{new Date(bookingData.checkOutDate).toLocaleDateString('vi-VN')} · {bookingData.nights} đêm</span>
              </div>
            </div>

            <div className="card-content">
              {/* Homestay Info */}
              <div className="homestay-info">
                <div className="homestay-thumb">
                  <img src={bookingData.homestay.coverImage} alt={bookingData.homestay.title} />
                </div>
                <div>
                  <h4>{bookingData.homestay.title}</h4>
                  <p>
                    {typeof bookingData.homestay.location === 'string'
                      ? bookingData.homestay.location
                      : `${bookingData.homestay.location?.city || ''}, ${bookingData.homestay.location?.country || 'Việt Nam'}`
                    } · {bookingData.guests} khách · Nhận phòng 14:00
                  </p>
                </div>
              </div>

              <div className="divider"></div>

              {/* Guest Info */}
              <div className="info-grid">
                <div className="info-row">
                  <div>
                    <label>Khách hàng</label>
                    <p>{bookingData.guest.name}</p>
                  </div>
                  <div>
                    <label>Số điện thoại</label>
                    <p>{bookingData.guest.phone}</p>
                  </div>
                </div>
                <div className="info-row">
                  <div>
                    <label>Email</label>
                    <p>{bookingData.guest.email}</p>
                  </div>
                  <div>
                    <label>Yêu cầu đặc biệt</label>
                    <p>{bookingData.guest.specialRequests}</p>
                  </div>
                </div>
              </div>

              <div className="divider"></div>

              {/* Location & Access */}
              <div className="info-grid">
                <div className="info-box">
                  <span className="icon">📍</span>
                  <div>
                    <label>Địa chỉ</label>
                    <p>Tây Hồ, Hà Nội</p>
                  </div>
                </div>
                <div className="info-box">
                  <span className="icon">🔑</span>
                  <div>
                    <label>Mã cửa (sẽ gửi trước check-in)</label>
                    <p>Sẽ được gửi 24h trước nhận phòng</p>
                  </div>
                </div>
              </div>

              <p className="note">
                Lưu ý: Mang theo CCCD/Hộ chiếu khi nhận phòng. Liên hệ chủ nhà để sắp xếp thời gian đến.
              </p>
            </div>
          </div>

          {/* Invoice Card */}
          <div className="success-card">
            <div className="card-header">
              <h3>Hóa đơn & thanh toán</h3>
            </div>

            <div className="card-content">
              <div className="pricing-breakdown">
                <div className="pricing-row">
                  <span>Giá gốc ({bookingData.nights} đêm)</span>
                  <span>{bookingData.pricing.basePrice.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="pricing-row discount">
                  <span>Ưu đãi 10%</span>
                  <span>-{bookingData.pricing.discount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="pricing-row">
                  <span>Phí dọn phòng</span>
                  <span>{bookingData.pricing.cleaningFee.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="pricing-row">
                  <span>Thuế & phí</span>
                  <span>{bookingData.pricing.serviceFee.toLocaleString('vi-VN')}đ</span>
                </div>

                <div className="divider"></div>

                <div className="pricing-row total">
                  <span>Tổng đã thanh toán</span>
                  <span>{bookingData.pricing.total.toLocaleString('vi-VN')}đ</span>
                </div>

                <p className="payment-method">
                  Phương thức: Ví điện tử {bookingData.payment.method}
                </p>
              </div>
            </div>
          </div>

          {/* Policy Card */}
          <div className="success-card">
            <div className="card-header">
              <h3>Chính sách & hỗ trợ</h3>
            </div>

            <div className="card-content">
              <div className="policy-item">
                <span className="icon">✓</span>
                <div>
                  <h4>Miễn phí hủy trong 48 giờ</h4>
                  <p>Sau đó áp dụng chính sách của chủ nhà</p>
                </div>
              </div>

              <div className="policy-item">
                <span className="icon">🎧</span>
                <div>
                  <h4>Hỗ trợ 24/7</h4>
                  <p>Gọi 1900-0000 hoặc chat với chúng tôi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="success-right">
          {/* Success Badge */}
          <div className="success-badge-card">
            <div className="success-badge">
              <div className="check-icon">✓</div>
              <div>
                <h3>Thanh toán thành công</h3>
                <p>Mã đặt chỗ: {bookingData.bookingCode}</p>
              </div>
            </div>

            <div className="divider"></div>

            <div className="download-section">
              <div className="download-info">
                <span className="icon">📄</span>
                <div>
                  <h4>Tải hóa đơn PDF</h4>
                  <p>Lưu về thiết bị của bạn</p>
                </div>
              </div>
              <button className="btn-download" onClick={handleDownloadInvoice}>
                Tải xuống
              </button>
            </div>
          </div>

          {/* Host Contact Card */}
          <div className="host-contact-card">
            <h3>Liên hệ chủ nhà</h3>

            <div className="host-info">
              <div className="host-avatar">
                {bookingData.host.name.charAt(0)}
              </div>
              <div>
                <h4>{bookingData.host.name}</h4>
                <p>Đã xác minh · Phản hồi {bookingData.host.responseTime}</p>
              </div>
            </div>

            <div className="divider"></div>

            <div className="contact-buttons">
              <button className="btn-contact" onClick={() => handleContactHost('message')}>
                <span>💬</span>
                <span>Nhắn tin</span>
              </button>
              <button className="btn-contact" onClick={() => handleContactHost('call')}>
                <span>📞</span>
                <span>Gọi</span>
              </button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

