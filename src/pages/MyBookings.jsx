import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, upcoming, completed, cancelled

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // TODO: Fetch bookings from API
    // Mock data for now
    const mockBookings = [
      {
        _id: '1',
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
        totalPrice: 1170000,
        status: 'upcoming', // upcoming, completed, cancelled
        createdAt: '2025-11-05',
      },
      {
        _id: '2',
        bookingCode: 'HS-8K3LM',
        homestay: {
          title: 'Cozy Mountain View',
          location: 'Lào Cai, Việt Nam',
          coverImage: '/images/homestay-placeholder.jpg',
        },
        checkInDate: '2025-10-15',
        checkOutDate: '2025-10-17',
        guests: 3,
        nights: 2,
        totalPrice: 980000,
        status: 'completed',
        createdAt: '2025-10-10',
      },
    ];

    setBookings(mockBookings);
    setLoading(false);
  }, [isAuthenticated, navigate]);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Sắp tới', className: 'status-upcoming' },
      completed: { text: 'Hoàn thành', className: 'status-completed' },
      cancelled: { text: 'Đã hủy', className: 'status-cancelled' },
    };
    return badges[status] || badges.upcoming;
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/payment-success/${bookingId}`);
  };

  if (loading) {
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
                      <button
                        className="btn-view-details"
                        onClick={() => handleViewDetails(booking._id)}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;

