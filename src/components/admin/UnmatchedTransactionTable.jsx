import React, { useCallback } from 'react';
import './UnmatchedTransactionTable.css';

/**
 * UnmatchedTransactionTable Component
 * Hiển thị danh sách unmatched transactions
 * Optimized với useCallback cho event handlers
 */
const UnmatchedTransactionTable = React.memo(({ 
  transactions, 
  loading, 
  onMatch,
  onViewDetails 
}) => {
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }, []);

  const getStatusBadgeClass = useCallback((status) => {
    const classes = {
      unmatched: 'badge-warning',
      matched: 'badge-success',
      refunded: 'badge-info',
      ignored: 'badge-secondary',
    };
    return classes[status] || 'badge-warning';
  }, []);

  const getStatusText = useCallback((status) => {
    const texts = {
      unmatched: 'Chưa khớp',
      matched: 'Đã khớp',
      refunded: 'Đã hoàn tiền',
      ignored: 'Đã bỏ qua',
    };
    return texts[status] || status;
  }, []);

  if (loading) {
    return (
      <div className="table-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Không có giao dịch nào</h3>
          <p>Chưa có giao dịch chưa khớp trong hệ thống</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="data-table unmatched-table">
          <thead>
            <tr>
              <th>Mã GD</th>
              <th>Ngày GD</th>
              <th>Số tiền</th>
              <th>Nội dung</th>
              <th>Ngân hàng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td className="transaction-id">
                  {transaction.transactionId?.slice(-12) || 'N/A'}
                </td>
                <td className="transaction-date">
                  {formatDate(transaction.transactionDate)}
                </td>
                <td className="price-cell">
                  {formatPrice(transaction.amount)}
                </td>
                <td className="transaction-content">
                  <div className="content-text" title={transaction.content}>
                    {transaction.content || 'N/A'}
                  </div>
                </td>
                <td className="bank-info">
                  <div className="bank-name">
                    {transaction.bankInfo?.bankName || 'N/A'}
                  </div>
                  <div className="account-number">
                    {transaction.bankInfo?.accountNumber || ''}
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {transaction.status === 'unmatched' && (
                      <button
                        className="btn-action btn-primary"
                        onClick={() => onMatch(transaction)}
                        title="Khớp với booking"
                      >
                        Khớp
                      </button>
                    )}
                    <button
                      className="btn-action btn-info"
                      onClick={() => onViewDetails(transaction)}
                      title="Xem chi tiết"
                    >
                      Chi tiết
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

UnmatchedTransactionTable.displayName = 'UnmatchedTransactionTable';

export default UnmatchedTransactionTable;
