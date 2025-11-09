import React, { useState, useEffect } from 'react';
import './AdminPayments.css';

const AdminPayments = () => {
  const [bookings, setBookings] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalHostPayouts: 0,
    totalPlatformCommission: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    paymentStatus: '',
    payoutStatus: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    limit: 20,
  });

  useEffect(() => {
    fetchBookings();
    fetchStatistics();
  }, [filters, pagination.currentPage]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        'http://localhost:5001/api/v1/bookings/statistics/payments',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setStatistics(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`http://localhost:5001/api/v1/bookings?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setBookings(data.data || []);
        if (data.meta?.pagination) {
          setPagination(data.meta.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleProcessPayout = async (bookingId) => {
    if (!confirm('Xác nhận thanh toán cho chủ nhà?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/v1/bookings/${bookingId}/payout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Đã thanh toán cho chủ nhà thành công!');
        fetchBookings();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Có lỗi xảy ra khi thanh toán!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getPaymentStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-danger',
      refunded: 'badge-info',
    };
    return classes[status] || 'badge-warning';
  };

  const getPayoutStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      processing: 'badge-info',
      completed: 'badge-success',
      failed: 'badge-danger',
    };
    return classes[status] || 'badge-warning';
  };

  return (
    <div className="admin-payments">
      <div className="admin-header">
        <h1>Quản lý Thanh toán</h1>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-label">Tổng doanh thu</span>
            <span className="stat-value">{formatPrice(statistics.totalRevenue)}</span>
          </div>
        </div>

        <div className="stat-card stat-host">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <span className="stat-label">
              Thanh toán cho chủ nhà (90%)
            </span>
            <span className="stat-value">{formatPrice(statistics.totalHostPayouts)}</span>
          </div>
        </div>

        <div className="stat-card stat-commission">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">Hoa hồng nền tảng (10%)</span>
            <span className="stat-value">{formatPrice(statistics.totalPlatformCommission)}</span>
          </div>
        </div>

        <div className="stat-card stat-bookings">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <span className="stat-label">Tổng số booking</span>
            <span className="stat-value">{statistics.totalBookings}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Trạng thái thanh toán</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="completed">Đã thanh toán</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã booking</th>
                <th>Homestay</th>
                <th>Khách hàng</th>
                <th>Ngày check-in</th>
                <th>Tổng tiền</th>
                <th>Chủ nhà (90%)</th>
                <th>Nền tảng (10%)</th>
                <th>TT thanh toán</th>
                <th>TT chi trả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="booking-id">{booking._id.slice(-8)}</td>
                  <td>{booking.homestayId?.title || 'N/A'}</td>
                  <td>{booking.guestId?.email || 'N/A'}</td>
                  <td>{formatDate(booking.checkInDate)}</td>
                  <td className="price-cell">
                    {formatPrice(booking.pricing.totalAmount)}
                  </td>
                  <td className="price-cell host-amount">
                    {formatPrice(booking.pricing.hostAmount)}
                  </td>
                  <td className="price-cell commission-amount">
                    {formatPrice(booking.pricing.platformCommission)}
                  </td>
                  <td>
                    <span
                      className={`badge ${getPaymentStatusBadgeClass(
                        booking.payment.status,
                      )}`}
                    >
                      {booking.payment.status === 'pending'
                        ? 'Chờ TT'
                        : booking.payment.status === 'completed'
                        ? 'Đã TT'
                        : booking.payment.status === 'failed'
                        ? 'Thất bại'
                        : 'Hoàn tiền'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${getPayoutStatusBadgeClass(
                        booking.hostPayout?.status || 'pending',
                      )}`}
                    >
                      {booking.hostPayout?.status === 'completed'
                        ? 'Đã chi trả'
                        : booking.hostPayout?.status === 'processing'
                        ? 'Đang xử lý'
                        : booking.hostPayout?.status === 'failed'
                        ? 'Thất bại'
                        : 'Chờ chi trả'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {booking.payment.status === 'completed' &&
                        booking.hostPayout?.status === 'pending' && (
                          <button
                            className="btn-action btn-success"
                            onClick={() => handleProcessPayout(booking._id)}
                          >
                            Chi trả
                          </button>
                        )}
                      <button className="btn-action btn-info">Chi tiết</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="pagination-btn"
          disabled={pagination.currentPage === 1}
          onClick={() =>
            setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
          }
        >
          Trước
        </button>
        <span className="pagination-info">
          Trang {pagination.currentPage} / {pagination.totalPages}
        </span>
        <button
          className="pagination-btn"
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() =>
            setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
          }
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default AdminPayments;
