import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Chờ auth loading xong trước khi check authentication
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // Fetch booking data from API
    fetchBookingData();
  }, [bookingId, isAuthenticated, authLoading, navigate]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
      
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Không thể tải thông tin đặt phòng');
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.booking) {
        throw new Error('Dữ liệu đặt phòng không hợp lệ');
      }

      const booking = data.data.booking;
      
      // Transform API data to match component structure
      setBookingData({
        bookingCode: booking.payment?.reference || booking._id?.slice(-8) || 'N/A',
        homestay: {
          title: booking.homestayId?.title || 'Homestay',
          location: booking.homestayId?.location || 'Việt Nam',
          coverImage: booking.homestayId?.coverImage || '/images/homestay-placeholder.jpg',
        },
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.numberOfGuests || booking.capacity?.guests || 1,
        nights: booking.numberOfNights || 1,
        pricing: {
          basePrice: (booking.pricing?.basePrice || 0) * (booking.numberOfNights || 1),
          cleaningFee: booking.pricing?.cleaningFee || 0,
          serviceFee: booking.pricing?.serviceFee || 0,
          total: booking.pricing?.totalAmount || 0,
        },
        guest: {
          name: booking.guestDetails?.firstName && booking.guestDetails?.lastName 
            ? `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`
            : booking.guestId?.fullName || 'Khách',
          phone: booking.guestDetails?.phone || booking.guestId?.profile?.phone || 'N/A',
          email: booking.guestDetails?.email || booking.guestId?.email || 'N/A',
          specialRequests: booking.specialRequests || 'Không',
        },
        payment: {
          method: 'VietQR',
          cardLast4: '',
          expiryDate: '',
        },
        host: {
          name: booking.hostId?.fullName || booking.hostId?.profile?.firstName || 'Chủ nhà',
          avatar: booking.hostId?.profile?.avatar || '/images/host-avatar.jpg',
          verified: true,
          responseTime: '~1h',
        },
      });
    } catch (err) {
      console.error('Error fetching booking data:', err);
      setError(err.message || 'Không thể tải thông tin đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
      
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/invoice`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Không thể tải hóa đơn');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${bookingData.bookingCode || bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert(error.message || 'Không thể tải hóa đơn. Vui lòng thử lại sau.');
    }
  };

  const handleContactHost = (method) => {
    console.log('Contact host via:', method);
    // TODO: Implement contact functionality
  };

  if (loading) {
    return (
      <div className="payment-success">
        <div className="success-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải thông tin đặt phòng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success">
        <div className="success-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Có lỗi xảy ra</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate('/bookings')}>
              Quay lại danh sách đặt phòng
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="payment-success">
        <div className="success-container">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h3>Không tìm thấy thông tin đặt phòng</h3>
            <p>Vui lòng kiểm tra lại mã đặt phòng</p>
            <button className="btn-primary" onClick={() => navigate('/bookings')}>
              Quay lại danh sách đặt phòng
            </button>
          </div>
        </div>
      </div>
    );
  }

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

