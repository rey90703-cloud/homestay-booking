import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';
import QRPaymentModal from '../components/QRPaymentModal';
import PromoCodeModal from '../components/PromoCodeModal';
import './BookingCheckout.css';

const BookingCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [homestay, setHomestay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Get booking data from location state
  const bookingInfo = location.state || {
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
  };

  const [appliedPromo, setAppliedPromo] = useState(null);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    note: '',
    specialRequests: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    // Chờ auth loading xong trước khi check authentication
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    fetchHomestayDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated, authLoading]);

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

  const calculateNights = () => {
    if (bookingInfo.checkInDate && bookingInfo.checkOutDate) {
      const checkIn = new Date(bookingInfo.checkInDate);
      const checkOut = new Date(bookingInfo.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 0;
    }
    return 0;
  };

  const calculatePricing = () => {
    const nights = calculateNights();
    if (nights > 0 && homestay) {
      const subtotal = homestay.pricing.basePrice * nights;
      const cleaningFee = homestay.pricing.cleaningFee || 0;
      const serviceFee = homestay.pricing.serviceFee || 0;
      let discount = 0;
      
      // Apply promo code discount
      if (appliedPromo) {
        discount = Math.round(subtotal * (appliedPromo.discount / 100));
      }
      
      const total = subtotal + cleaningFee + serviceFee - discount;
      return { nights, subtotal, cleaningFee, serviceFee, discount, total };
    }
    return { nights: 0, subtotal: 0, cleaningFee: 0, serviceFee: 0, discount: 0, total: 0 };
  };

  const handleSelectPromo = (promo) => {
    setAppliedPromo(promo);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.fullName || !formData.email || !formData.phone) {
      alert('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    try {
      setSubmitting(true);

      // Check availability first
      const availabilityResponse = await fetch(
        `${API_BASE_URL}/bookings/check-availability/${id}?checkInDate=${bookingInfo.checkInDate}&checkOutDate=${bookingInfo.checkOutDate}`
      );
      const availabilityData = await availabilityResponse.json();

      if (availabilityData.success && !availabilityData.data.available) {
        alert(' Phòng đã được đặt cho ngày bạn chọn!\n\n' +
              'Homestay này đã có người đặt trong khoảng thời gian bạn chọn.\n' +
              'Vui lòng quay lại và chọn ngày khác.');
        setSubmitting(false);
        return;
      }

      // Call API to create booking
      const token = localStorage.getItem('token');
      const pricing = calculatePricing();
      const bookingData = {
        homestayId: id,
        checkInDate: bookingInfo.checkInDate,
        checkOutDate: bookingInfo.checkOutDate,
        numberOfGuests: bookingInfo.guests,
        guestDetails: {
          firstName: formData.fullName.split(' ')[0] || formData.fullName,
          lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone,
        },
        specialRequests: formData.specialRequests,
        promoCode: appliedPromo?.code || null,
        totalAmount: pricing.total,
      };

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (data.success) {
        // Save booking ID and show QR modal
        setCreatedBookingId(data.data.booking._id);
        setShowQRModal(true);
      } else {
        // Handle specific error cases
        const errorMessage = data.message || 'Không thể tạo booking. Vui lòng thử lại.';
        
        if (errorMessage.includes('not available') || errorMessage.includes('Another booking exists')) {
          alert(' Phòng đã được đặt cho ngày bạn chọn!\n\n' +
                'Homestay này đã có người đặt trong khoảng thời gian bạn chọn.\n' +
                'Vui lòng chọn ngày khác hoặc tìm homestay khác.');
        } else {
          alert(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    // Navigate to success page
    navigate(`/payment-success/${createdBookingId}`, {
      state: {
        bookingCode: createdBookingId,
        homestay: homestay,
        checkInDate: bookingInfo.checkInDate,
        checkOutDate: bookingInfo.checkOutDate,
        guests: bookingInfo.guests,
        nights: calculateNights(),
        pricing: calculatePricing(),
        guest: {
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          specialRequests: formData.specialRequests || 'Không',
        },
        payment: paymentData,
        host: homestay.owner,
      }
    });
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
  };

  // Show loading khi auth đang load hoặc đang fetch homestay
  if (authLoading || loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="checkout-not-found">
        <h2>Không tìm thấy homestay</h2>
        <button onClick={() => navigate('/')}>Quay lại trang chủ</button>
      </div>
    );
  }

  const pricing = calculatePricing();

  return (
    <div className="booking-checkout">
      {/* Breadcrumb */}
      <div className="checkout-breadcrumb">
        <div className="breadcrumb-container">
          <a href={`/homestay/${id}`}>{homestay.title}</a>
          <span className="separator">/</span>
          <strong>Thanh toán</strong>
        </div>

        <div className="checkout-title-section">
          <h1>Hoàn tất đặt chỗ</h1>
          <div className="discount-badge">Giữ giá -10%</div>
        </div>

        <div className="security-info">
          <span>🔒 Thanh toán an toàn</span>
          <span>·</span>
          <span>Miễn phí hủy trong 48 giờ</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="checkout-container">
        <div className="checkout-left">
          {/* Guest Information */}
          <div className="checkout-card">
            <h3>Thông tin khách</h3>
            <div className="form-grid">
              <div className="form-row-2">
                <div className="input-field">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="input-field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@domain.com"
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="input-field">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+84 912 345 678"
                  />
                </div>
                <div className="input-field">
                  <label>Ghi chú cho chủ nhà (tuỳ chọn)</label>
                  <input
                    type="text"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: đến trễ sau 22:00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="checkout-card">
            <h3>Chi tiết lưu trú</h3>
            <div className="form-grid">
              <div className="form-row-2">
                <div className="input-field">
                  <label>Nhận phòng</label>
                  <input
                    type="text"
                    value={new Date(bookingInfo.checkInDate).toLocaleDateString('vi-VN')}
                    readOnly
                  />
                </div>
                <div className="input-field">
                  <label>Trả phòng</label>
                  <input
                    type="text"
                    value={new Date(bookingInfo.checkOutDate).toLocaleDateString('vi-VN')}
                    readOnly
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="input-field">
                  <label>Khách</label>
                  <input
                    type="text"
                    value={`${bookingInfo.guests} người`}
                    readOnly
                  />
                </div>
                <div className="input-field">
                  <label>Yêu cầu đặc biệt</label>
                  <input
                    type="text"
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    placeholder="Không"
                  />
                </div>
              </div>
              <p className="info-text">
                Bạn có thể thay đổi số khách trước khi nhận phòng. Chủ nhà sẽ liên hệ để xác nhận thời gian check-in.
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-card">
            <h3>Phương thức thanh toán</h3>
            <div className="form-grid">
              <div className="payment-method-vietqr">
                <div className="vietqr-logo">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/68/VietQR_Logo.svg" alt="VietQR" />
                </div>
                <div>
                  <label>Chuyển khoản VietQR</label>
                  <p>Thanh toán nhanh chóng & an toàn qua mã QR</p>
                </div>
              </div>

              <div className="vietqr-info">
                <p className="info-text">
                  💡 Bạn sẽ nhận được mã QR để quét và thanh toán qua ứng dụng ngân hàng sau khi nhấn "Xác nhận đặt phòng"
                </p>
              </div>

              <p className="info-text">
                Bằng cách tiếp tục, bạn đồng ý với Điều khoản & Chính sách quyền riêng tư.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="checkout-right">
          <div className="summary-card">
            <div className="homestay-summary">
              <img src={homestay.coverImage} alt={homestay.title} />
              <div className="summary-info">
                <h4>{homestay.title}</h4>
                <p>{homestay.location.city}, {homestay.location.country}</p>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="promo-code-section">
              <h4 className="promo-title">Mã giảm giá</h4>
              {!appliedPromo ? (
                <button 
                  className="btn-select-promo" 
                  onClick={() => setShowPromoModal(true)}
                  type="button"
                >
                  <span className="promo-btn-icon">🎁</span>
                  <span>Chọn mã ưu đãi</span>
                  <svg className="promo-btn-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <div className="promo-applied">
                  <div className="promo-applied-info">
                    <span className="promo-applied-icon">{appliedPromo.icon || '🎉'}</span>
                    <div>
                      <p className="promo-applied-name">{appliedPromo.name}</p>
                      <p className="promo-applied-code">Mã: {appliedPromo.code} (-{appliedPromo.discount}%)</p>
                    </div>
                  </div>
                  <button 
                    className="btn-remove-promo" 
                    onClick={handleRemovePromo}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <PromoCodeModal 
              isOpen={showPromoModal}
              onClose={() => setShowPromoModal(false)}
              onSelectPromo={handleSelectPromo}
              bookingInfo={bookingInfo}
            />

            <div className="pricing-summary">
              <div className="pricing-row">
                <span>Giá phòng ({pricing.nights} đêm)</span>
                <span>{pricing.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="pricing-row">
                <span>Phí vệ sinh</span>
                <span>{pricing.cleaningFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="pricing-row">
                <span>Phí dịch vụ</span>
                <span>{pricing.serviceFee.toLocaleString('vi-VN')}đ</span>
              </div>
              {pricing.discount > 0 && (
                <div className="pricing-row discount">
                  <span>Giảm giá ({appliedPromo?.discount}%)</span>
                  <span className="discount-amount">-{pricing.discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="pricing-divider"></div>
              <div className="pricing-row total">
                <span>Tổng cộng</span>
                <span>{pricing.total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <button 
              className="btn-confirm" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
            </button>

            <p className="disclaimer">
              Chủ nhà sẽ xác nhận đặt phòng trong vòng 24 giờ.
            </p>
          </div>

          <div className="host-info-card">
            <h4>Chủ nhà</h4>
            <div className="host-profile">
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
              <div>
                <p className="host-name">
                  {homestay.hostId?.profile?.firstName && homestay.hostId?.profile?.lastName
                    ? `${homestay.hostId.profile.firstName} ${homestay.hostId.profile.lastName}`
                    : homestay.hostId?.email || 'Chủ nhà'}
                </p>
                <p className="host-status">Đã xác minh · Phản hồi trong 1 giờ</p>
              </div>
            </div>
            <button className="btn-contact">
              <span>💬</span>
              <span>Liên hệ chủ nhà</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Payment Modal */}
      {showQRModal && createdBookingId && (
        <QRPaymentModal
          bookingId={createdBookingId}
          onSuccess={handlePaymentSuccess}
          onClose={handleCloseQRModal}
        />
      )}
    </div>
  );
};

export default BookingCheckout;


