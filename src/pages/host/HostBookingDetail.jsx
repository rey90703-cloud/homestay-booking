import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import HostLayout from '../../components/layout/HostLayout';
import SmartDoorControl from '../../components/smartdoor/SmartDoorControl';
import './HostBookingDetail.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

/**
 * Host Booking Detail Page
 * Hiển thị chi tiết booking và Smart Door Control
 * Requirements: 3.1, 14.1, 14.2, 14.3
 */
const HostBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Vui lòng đăng nhập');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const bookingData = data.data.booking || data.data;
        
        // Kiểm tra user có quyền xem booking không (host hoặc guest)
        const currentUserId = user?._id || user?.id;
        const hostId = bookingData.hostId?._id || bookingData.hostId;
        const guestId = bookingData.guestId?._id || bookingData.guestId;
        
        // Cho phép xem nếu user là host hoặc guest của booking
        const isHost = currentUserId && hostId && String(hostId) === String(currentUserId);
        const isGuest = currentUserId && guestId && String(guestId) === String(currentUserId);
        
        if (currentUserId && !isHost && !isGuest) {
          setError('Bạn không có quyền xem booking này');
          return;
        }
        
        setBooking(bookingData);
      } else {
        setError(data.message || 'Không thể tải thông tin booking');
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Không thể tải thông tin booking');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAccess = async () => {
    try {
      setConfirming(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/bookings/${id}/confirm-access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Đã xác nhận khách thuê và gửi mật khẩu qua email!');
        await fetchBookingDetails();
      } else {
        alert(data.message || 'Không thể xác nhận khách thuê');
      }
    } catch (err) {
      console.error('Error confirming access:', err);
      alert('Không thể xác nhận khách thuê');
    } finally {
      setConfirming(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      completed: { text: 'Đã thanh toán', className: 'status-success' },
      pending: { text: 'Chờ thanh toán', className: 'status-warning' },
      failed: { text: 'Thất bại', className: 'status-error' }
    };
    const statusInfo = statusMap[status] || { text: status, className: 'status-default' };
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</span>;
  };

  const getBookingStatusBadge = (status) => {
    const statusMap = {
      confirmed: { text: 'Đã xác nhận', className: 'status-success' },
      paid: { text: 'Đã thanh toán', className: 'status-info' },
      pending: { text: 'Chờ xác nhận', className: 'status-warning' },
      cancelled: { text: 'Đã hủy', className: 'status-error' },
      checked_in: { text: 'Đã nhận phòng', className: 'status-success' },
      checked_out: { text: 'Đã trả phòng', className: 'status-default' }
    };
    const statusInfo = statusMap[status] || { text: status, className: 'status-default' };
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</span>;
  };

  if (loading) {
    return (
      <div className="host-booking-detail-wrapper">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="host-booking-detail-wrapper">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Đã xảy ra lỗi</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/host/dashboard')} className="btn-primary">
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="host-booking-detail-wrapper">
        <div className="error-container">
          <div className="error-icon">📋</div>
          <h3>Không tìm thấy</h3>
          <p>Booking không tồn tại hoặc đã bị xóa</p>
          <button onClick={() => navigate('/host/dashboard')} className="btn-primary">
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPaymentCompleted = booking.payment?.status === 'completed';
  const isAccessConfirmed = booking.smartDoorAccess?.enabled === true;
  const canConfirmAccess = isPaymentCompleted && !isAccessConfirmed;

  return (
    <HostLayout activeTab="bookings">
      <div className="host-booking-detail-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/host/dashboard')} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <h1 className="page-title">Chi tiết đặt phòng</h1>
        </div>
        <div className="header-right">
          {getBookingStatusBadge(booking.status)}
        </div>
      </div>

      <div className="booking-detail-content">
        {/* Booking Info Card */}
        <div className="detail-card">
          <div className="card-header">
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Thông tin đặt phòng
            </h2>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Mã đặt phòng</span>
                <span className="info-value code">#{booking._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Homestay</span>
                <span className="info-value">{booking.homestayId?.title || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Khách hàng</span>
                <span className="info-value">{booking.guestId?.profile?.fullName || booking.guestId?.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{booking.guestId?.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngày nhận phòng</span>
                <span className="info-value highlight">{formatDate(booking.checkInDate)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngày trả phòng</span>
                <span className="info-value highlight">{formatDate(booking.checkOutDate)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Số khách</span>
                <span className="info-value">{booking.numberOfGuests} người</span>
              </div>
              <div className="info-item">
                <span className="info-label">Số đêm</span>
                <span className="info-value">{booking.pricing?.numberOfNights || 1} đêm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info Card */}
        <div className="detail-card">
          <div className="card-header">
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Thông tin thanh toán
            </h2>
          </div>
          <div className="card-body">
            <div className="payment-summary">
              <div className="payment-row">
                <span>Giá phòng</span>
                <span>{formatCurrency(booking.pricing?.basePrice)}</span>
              </div>
              {booking.pricing?.cleaningFee > 0 && (
                <div className="payment-row">
                  <span>Phí dọn dẹp</span>
                  <span>{formatCurrency(booking.pricing?.cleaningFee)}</span>
                </div>
              )}
              {booking.pricing?.serviceFee > 0 && (
                <div className="payment-row">
                  <span>Phí dịch vụ</span>
                  <span>{formatCurrency(booking.pricing?.serviceFee)}</span>
                </div>
              )}
              {booking.pricing?.discount > 0 && (
                <div className="payment-row discount">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(booking.pricing?.discount)}</span>
                </div>
              )}
              <div className="payment-row total">
                <span>Tổng cộng</span>
                <span>{formatCurrency(booking.pricing?.totalAmount || booking.totalPrice)}</span>
              </div>
              <div className="payment-status">
                <span>Trạng thái:</span>
                {getPaymentStatusBadge(booking.payment?.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Access Section */}
        {canConfirmAccess && (
          <div className="detail-card confirm-card">
            <div className="card-body">
              <div className="confirm-content">
                <div className="confirm-icon">✉️</div>
                <div className="confirm-text">
                  <h3>Xác nhận khách thuê</h3>
                  <p>
                    Khách đã thanh toán thành công. Nhấn nút bên dưới để xác nhận và gửi mật khẩu 
                    cửa thông minh qua email cho khách.
                  </p>
                </div>
                <button 
                  onClick={handleConfirmAccess}
                  disabled={confirming}
                  className="btn-confirm"
                >
                  {confirming ? (
                    <>
                      <span className="btn-spinner"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Xác nhận & Gửi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Waiting Payment */}
        {!isPaymentCompleted && (
          <div className="detail-card waiting-card">
            <div className="card-body">
              <div className="waiting-content">
                <div className="waiting-icon">⏳</div>
                <h3>Đang chờ thanh toán</h3>
                <p>Khách hàng chưa hoàn tất thanh toán. Vui lòng đợi...</p>
              </div>
            </div>
          </div>
        )}

        {/* Smart Door Control */}
        {isAccessConfirmed && (
          <div className="detail-card smart-door-card">
            <SmartDoorControl bookingId={id} />
          </div>
        )}
      </div>
    </div>
    </HostLayout>
  );
};

export default HostBookingDetail;
