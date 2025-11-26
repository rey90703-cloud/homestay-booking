import React from 'react';
import './PaymentFilters.css';

/**
 * PaymentFilters Component
 * Filters cho payment list (bookings hoặc unmatched transactions)
 * Memoized với custom comparison để tránh re-render
 */
const PaymentFilters = React.memo(({ filters, onFilterChange, type = 'bookings' }) => {
  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  return (
    <div className="filters-section">
      <div className="filter-row">
        {type === 'bookings' && (
          <div className="filter-group">
            <label>Trạng thái thanh toán</label>
            <select
              value={filters.paymentStatus || ''}
              onChange={(e) => handleChange('paymentStatus', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="completed">Đã thanh toán</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>
        )}

        {type === 'unmatched' && (
          <div className="filter-group">
            <label>Trạng thái</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="unmatched">Chưa khớp</option>
              <option value="matched">Đã khớp</option>
              <option value="refunded">Đã hoàn tiền</option>
              <option value="ignored">Đã bỏ qua</option>
            </select>
          </div>
        )}

        <div className="filter-group">
          <label>Từ ngày</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Đến ngày</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="filter-input"
          />
        </div>

        {type === 'unmatched' && (
          <div className="filter-group filter-search">
            <label>Tìm kiếm</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Mã giao dịch, nội dung..."
              className="filter-input"
            />
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison để tránh re-render khi filters không thay đổi
  return (
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    prevProps.type === nextProps.type
  );
});

PaymentFilters.displayName = 'PaymentFilters';

export default PaymentFilters;
