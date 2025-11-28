import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';
import './HostOverview.css';

const HostOverview = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalHomestays: 0,
    pendingBookings: 0,
    recentPayments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch host homestays
      const homestaysRes = await fetch(`${API_BASE_URL}/homestays/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const homestaysData = await homestaysRes.json();
      const homestays = homestaysData.data?.homestays || homestaysData.data?.listings || homestaysData.data || [];

      // Fetch bookings for current user
      const bookingsRes = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bookingsData = await bookingsRes.json();
      const bookings = bookingsData.data?.bookings || [];

      // Calculate stats
      const totalRevenue = bookings
        .filter(b => b.status === 'paid' || b.status === 'completed')
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

      const pendingBookings = bookings.filter(b => b.status === 'pending').length;

      // Get recent payments
      const recentPayments = bookings
        .filter(b => b.payment && (b.status === 'paid' || b.status === 'completed'))
        .sort((a, b) => new Date(b.payment.paidAt) - new Date(a.payment.paidAt))
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalBookings: bookings.length,
        totalHomestays: homestays.length,
        pendingBookings,
        recentPayments
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="host-overview">
      <h1 className="page-title">Tổng quan</h1>

      <div className="stats-grid">
        <div className="stat-card stat-revenue">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Tổng doanh thu</p>
            <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="stat-card stat-bookings">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Tổng đặt phòng</p>
            <p className="stat-value">{stats.totalBookings}</p>
          </div>
        </div>

        <div className="stat-card stat-homestays">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Homestay</p>
            <p className="stat-value">{stats.totalHomestays}</p>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Chờ xác nhận</p>
            <p className="stat-value">{stats.pendingBookings}</p>
          </div>
        </div>
      </div>

      <div className="recent-payments">
        <h2 className="section-title">Thanh toán gần đây</h2>
        {stats.recentPayments.length === 0 ? (
          <p className="no-data">Chưa có thanh toán nào</p>
        ) : (
          <div className="payments-table">
            <table>
              <thead>
                <tr>
                  <th>Mã đặt phòng</th>
                  <th>Homestay</th>
                  <th>Số tiền</th>
                  <th>Ngày thanh toán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((booking) => (
                  <tr key={booking._id}>
                    <td>#{booking._id.slice(-8)}</td>
                    <td>{booking.homestayId?.title || 'N/A'}</td>
                    <td className="amount">{formatCurrency(booking.payment.amount)}</td>
                    <td>{formatDate(booking.payment.paidAt)}</td>
                    <td>
                      <span className="status-badge status-paid">Đã thanh toán</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostOverview;
