import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';
import QRPaymentModal from '../components/QRPaymentModal';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, upcoming, completed, cancelled
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    // Chờ auth loading xong trước khi check authentication
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchBookings();
  }, [isAuthenticated, authLoading, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      console.log('My bookings API response:', data);
      console.log('Response status:', response.status);
      if (!response.ok) {
        console.error('API Error Details:', data.error);
      }

      if (data.success) {
        // Map backend booking data to frontend format
        const formattedBookings = data.data.bookings.map(booking => ({
          _id: booking._id,
          bookingCode: booking.bookingReference || booking._id.substring(0, 8).toUpperCase(),
          homestay: {
            _id: booking.homestayId?._id,
            title: booking.homestayId?.title || 'Homestay',
            location: booking.homestayId?.location 
              ? `${booking.homestayId.location.city}, ${booking.homestayId.location.country}`
              : 'Việt Nam',
            coverImage: booking.homestayId?.coverImage || '/images/homestay-placeholder.jpg',
          },
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          guests: booking.numberOfGuests || 1,
          nights: Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)),
          totalPrice: booking.pricing?.totalAmount || 0,
          status: mapBookingStatus(booking.status, booking.payment?.status, booking.checkOutDate),
          paymentStatus: booking.payment?.status,
          createdAt: booking.createdAt,
        }));

        setBookings(formattedBookings);
      } else {
        console.error('Failed to fetch bookings:', data.message);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Map backend status to frontend status for display
  const mapBookingStatus = (bookingStatus, paymentStatus, checkOutDate) => {
    // Nếu chưa thanh toán
    if (paymentStatus === 'pending') {
      return 'pending_payment';
    }
    
    // Nếu đã hủy
    if (bookingStatus === 'cancelled') {
      return 'cancelled';
    }
    
    // Nếu backend đã đánh dấu completed hoặc checked_out
    if (bookingStatus === 'completed' || bookingStatus === 'checked_out') {
      return 'completed';
    }
    
    // Kiểm tra ngày check-out đã qua chưa
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOut = new Date(checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    
    if (checkOut < today) {
      return 'completed';
    }
    
    // confirmed, pending và chưa qua ngày check-out -> upcoming
    return 'upcoming';
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Sắp tới', className: 'status-upcoming' },
      completed: { text: 'Hoàn thành', className: 'status-completed' },
      cancelled: { text: 'Đã hủy', className: 'status-cancelled' },
      pending_payment: { text: 'Chờ thanh toán', className: 'status-pending' },
    };
    return badges[status] || badges.upcoming;
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/payment-success/${bookingId}`);
  };

  const handleViewQR = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowQRModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowQRModal(false);
    // Refresh bookings list
    fetchBookings();
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedBookingId(null);
  };

  const handleDownloadInvoice = async (bookingId, bookingCode) => {
    try {
      const token = localStorage.getItem('token');
      
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
      a.download = `invoice-${bookingCode || bookingId}.pdf`;
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

  // Show loading khi auth đang load hoặc đang fetch bookings
  if (authLoading || loading) {
    return (
      <div className="my-bookings-loading">
        <div className="spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="my-bookings">
      <div className="my-bookings-container">
        <div className="page-header">
          <h1>Lịch sử đặt phòng</h1>
          <p>Quản lý tất cả các đặt phòng của bạn</p>
        </div>

        {/* Tabs */}
        <div className="bookings-tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả ({bookings.length})
          </button>
          <button 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Sắp tới ({bookings.filter(b => b.status === 'upcoming').length})
          </button>
          <button 
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Hoàn thành ({bookings.filter(b => b.status === 'completed').length})
          </button>
          <button 
            className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Đã hủy ({bookings.filter(b => b.status === 'cancelled').length})
          </button>
        </div>

        {/* Bookings List */}
        <div className="bookings-list">
          {filteredBookings.length === 0 ? (
            <div className="empty-state">
              <p>Không có đặt phòng nào</p>
            </div>
          ) : (
            filteredBookings.map(booking => {
              const statusBadge = getStatusBadge(booking.status);
              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-image">
                    <img src={booking.homestay.coverImage} alt={booking.homestay.title} />
                    <span className={`status-badge ${statusBadge.className}`}>
                      {statusBadge.text}
                    </span>
                  </div>
                  <div className="booking-info">
                    <div className="booking-header">
                      <h3>{booking.homestay.title}</h3>
                      <p className="booking-code">Mã: {booking.bookingCode}</p>
                    </div>
                    <div className="booking-details">
                      <div className="detail-item">
                        <span className="icon">📍</span>
                        <span>{booking.homestay.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="icon">📅</span>
                        <span>{booking.checkInDate} → {booking.checkOutDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="icon">👥</span>
                        <span>{booking.guests} khách · {booking.nights} đêm</span>
                      </div>
                    </div>
                    <div className="booking-footer">
                      <div className="price">
                        <span className="price-label">Tổng tiền:</span>
                        <span className="price-value">{booking.totalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="booking-actions">
                        {booking.status === 'pending_payment' && (
                          <button
                            className="btn-view-qr"
                            onClick={() => handleViewQR(booking._id)}
                          >
                            Xem QR thanh toán
                          </button>
                        )}
                        {booking.status === 'completed' && (
                          <button
                            className="btn-download-invoice"
                            onClick={() => handleDownloadInvoice(booking._id, booking.bookingCode)}
                          >
                            📄 Tải hóa đơn
                          </button>
                        )}
                        <button
                          className="btn-view-details"
                          onClick={() => handleViewDetails(booking._id)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* QR Payment Modal */}
      {showQRModal && selectedBookingId && (
        <QRPaymentModal
          bookingId={selectedBookingId}
          onSuccess={handlePaymentSuccess}
          onClose={handleCloseQRModal}
        />
      )}
    </div>
  );
};

export default MyBookings;

