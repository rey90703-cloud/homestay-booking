import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';
import './HostBookings.css';

const HostBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/host`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBookings(data.data?.bookings || []);
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
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Chờ thanh toán', class: 'status-pending' },
      'paid': { label: 'Đã thanh toán', class: 'status-paid' },
      'confirmed': { label: 'Đã xác nhận', class: 'status-confirmed' },
      'completed': { label: 'Hoàn thành', class: 'status-completed' },
      'cancelled': { label: 'Đã hủy', class: 'status-cancelled' }
    };
    const statusInfo = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="host-bookings-wrapper">
      <h1 className="page-title">Đặt phòng</h1>

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>Chưa có đặt phòng nào</p>
        </div>
      ) : (
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Mã đặt phòng</th>
                <th>Homestay</th>
                <th>Khách</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>#{booking._id.slice(-8)}</td>
                  <td>{booking.homestayId?.title || 'N/A'}</td>
                  <td>{booking.guestId?.fullName || booking.guestId?.email || 'N/A'}</td>
                  <td>{formatDate(booking.checkInDate)}</td>
                  <td>{formatDate(booking.checkOutDate)}</td>
                  <td className="amount">{formatCurrency(booking.totalPrice)}</td>
                  <td>{getStatusBadge(booking.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HostBookings;
