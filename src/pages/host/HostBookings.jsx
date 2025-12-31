import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './HostBookings.css';

/**
 * HostBookings Component
 * Hiển thị danh sách đặt phòng của host
 */
const HostBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      // Sử dụng my-bookings endpoint - sẽ trả về bookings của user hiện tại
      // Nếu user là host, sẽ trả về bookings của các homestay họ sở hữu
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data?.bookings || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status) => {
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

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <div className="host-bookings-wrapper">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="host-bookings-wrapper">
      <div className="page-header">
        <h1 className="page-title">Đặt phòng</h1>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({bookings.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Chờ xác nhận
          </button>
          <button 
            className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => setFilter('paid')}
          >
            Đã thanh toán
          </button>
          <button 
            className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Đã xác nhận
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="no-bookings">
          <div className="no-bookings-icon">📋</div>
          <h3>Chưa có đặt phòng nào</h3>
          <p>Các đặt phòng sẽ xuất hiện ở đây khi khách đặt homestay của bạn</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking) => (
            <div 
              key={booking._id} 
              className="booking-card"
              onClick={() => navigate(`/host/bookings/${booking._id}`)}
            >
              <div className="booking-image">
                <img 
                  src={booking.homestayId?.coverImage || '/placeholder.jpg'} 
                  alt={booking.homestayId?.title} 
                />
              </div>
              <div className="booking-info">
                <div className="booking-header">
                  <h3 className="booking-title">{booking.homestayId?.title || 'N/A'}</h3>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="booking-details">
                  <div className="detail-item">
                    <span className="detail-label">Mã đặt phòng</span>
                    <span className="detail-value code">#{booking._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Khách hàng</span>
                    <span className="detail-value">{booking.guestId?.profile?.fullName || booking.guestId?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày nhận phòng</span>
                    <span className="detail-value">{formatDate(booking.checkInDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày trả phòng</span>
                    <span className="detail-value">{formatDate(booking.checkOutDate)}</span>
                  </div>
                </div>
                <div className="booking-footer">
                  <span className="booking-price">{formatCurrency(booking.pricing?.totalAmount || booking.totalPrice)}</span>
                  <button className="btn-view-detail">
                    Xem chi tiết
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostBookings;
