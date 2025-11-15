import React from 'react';
import './PaymentStatistics.css';

/**
 * PaymentStatistics Component
 * Hiển thị các thống kê payment dạng cards
 * Memoized để tránh re-render không cần thiết
 */
const PaymentStatistics = React.memo(({ statistics, loading }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card stat-loading">
            <div className="stat-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
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
          <span className="stat-label">Thanh toán cho chủ nhà (90%)</span>
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
          <span className="stat-value">{statistics.totalBookings || 0}</span>
        </div>
      </div>
    </div>
  );
});

PaymentStatistics.displayName = 'PaymentStatistics';

export default PaymentStatistics;
