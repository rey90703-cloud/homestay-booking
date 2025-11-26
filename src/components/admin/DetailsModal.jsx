import React from 'react';
import './DetailsModal.css';

/**
 * DetailsModal Component
 * Modal hiển thị chi tiết booking hoặc transaction
 */
const DetailsModal = ({ isOpen, onClose, title, data, type = 'booking' }) => {
  if (!isOpen || !data) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status, type) => {
    if (type === 'payment') {
      const texts = {
        pending: 'Chờ thanh toán',
        completed: 'Đã thanh toán',
        failed: 'Thất bại',
        refunded: 'Đã hoàn tiền',
      };
      return texts[status] || status;
    } else if (type === 'payout') {
      const texts = {
        pending: 'Chờ chi trả',
        processing: 'Đang xử lý',
        completed: 'Đã chi trả',
        failed: 'Thất bại',
      };
      return texts[status] || status;
    }
    return status;
  };

  const renderBookingDetails = () => (
    <div className="bill-container">
      {/* Bill Header */}
      <div className="bill-header">
        <div className="bill-logo">
          <h2>🏠 HomestayBooking</h2>
          <p>Hóa đơn thanh toán</p>
        </div>
        <div className="bill-info">
          <div className="bill-number">#{data._id.slice(-8).toUpperCase()}</div>
          <div className="bill-date">{formatDate(data.createdAt || data.checkInDate)}</div>
        </div>
      </div>

      {/* Customer & Booking Info */}
      <div className="bill-section">
        <div className="bill-info-row">
          <span className="info-label">Khách hàng:</span>
          <span className="info-value">{data.guestId?.fullName || data.guestId?.email || 'N/A'}</span>
        </div>
        <div className="bill-info-row">
          <span className="info-label">Email:</span>
          <span className="info-value">{data.guestId?.email || 'N/A'}</span>
        </div>
        {data.guestId?.phone && (
          <div className="bill-info-row">
            <span className="info-label">Số điện thoại:</span>
            <span className="info-value">{data.guestId.phone}</span>
          </div>
        )}
        <div className="bill-divider"></div>
        <div className="bill-info-row">
          <span className="info-label">Homestay:</span>
          <span className="info-value"><strong>{data.homestayId?.title || 'N/A'}</strong></span>
        </div>
        <div className="bill-info-row">
          <span className="info-label">Check-in:</span>
          <span className="info-value">{new Date(data.checkInDate).toLocaleDateString('vi-VN')}</span>
        </div>
        <div className="bill-info-row">
          <span className="info-label">Check-out:</span>
          <span className="info-value">{new Date(data.checkOutDate).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Payment Details Table */}
      <div className="bill-section">
        <table className="bill-table">
          <thead>
            <tr>
              <th>Mô tả</th>
              <th className="text-right">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Tổng tiền booking</strong>
                <br/>
                <small style={{color: '#666'}}>
                  {Math.ceil((new Date(data.checkOutDate) - new Date(data.checkInDate)) / (1000 * 60 * 60 * 24))} đêm
                </small>
              </td>
              <td className="text-right">{formatPrice(data.pricing.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Breakdown */}
      <div className="bill-section">
        <h4>Phân bổ thanh toán</h4>
        <div className="bill-breakdown">
          <div className="breakdown-item">
            <span>Chủ nhà (90%)</span>
            <span className="amount-host">{formatPrice(data.pricing.hostAmount)}</span>
          </div>
          <div className="breakdown-item">
            <span>Nền tảng (10%)</span>
            <span className="amount-commission">{formatPrice(data.pricing.platformCommission)}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bill-total">
        <div className="total-row">
          <span>Tổng cộng</span>
          <span className="total-amount">{formatPrice(data.pricing.totalAmount)}</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bill-footer">
        <div className="bill-footer-item">
          <small>Mã tham chiếu: <strong>{data.payment?.reference || 'N/A'}</strong></small>
        </div>
        {data.payment.transactionId && (
          <div className="bill-footer-item">
            <small>Mã giao dịch: <strong>{data.payment.transactionId}</strong></small>
          </div>
        )}
      </div>
    </div>
  );

  const renderTransactionDetails = () => (
    <div className="details-content">
      {/* Left Column */}
      <div className="details-section">
        <h3 className="section-title">Thông tin giao dịch</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Mã giao dịch:</span>
            <span className="detail-value code">{data.transactionId}</span>
          </div>
          <div className="detail-item highlight">
            <span className="detail-label">Số tiền:</span>
            <span className="detail-value price-large">
              {formatPrice(data.amount)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Ngày giao dịch:</span>
            <span className="detail-value">{formatDate(data.transactionDate)}</span>
          </div>
          <div className="detail-item full-width">
            <span className="detail-label">Nội dung:</span>
            <span className="detail-value">{data.content || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Trạng thái:</span>
            <span className={`detail-value badge badge-${data.status}`}>
              {data.status === 'unmatched' ? 'Chưa khớp' : 
               data.status === 'matched' ? 'Đã khớp' :
               data.status === 'refunded' ? 'Đã hoàn tiền' : 'Đã bỏ qua'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="details-section">
        <h3 className="section-title">Thông tin ngân hàng</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Ngân hàng:</span>
            <span className="detail-value">{data.bankInfo?.bankName || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Số tài khoản:</span>
            <span className="detail-value code">{data.bankInfo?.accountNumber || 'N/A'}</span>
          </div>
          
          {data.matchedBookingId && (
            <>
              <div className="detail-item">
                <span className="detail-label">Booking ID:</span>
                <span className="detail-value code">{data.matchedBookingId._id || data.matchedBookingId}</span>
              </div>
              {data.matchedAt && (
                <div className="detail-item">
                  <span className="detail-label">Thời gian khớp:</span>
                  <span className="detail-value">{formatDate(data.matchedAt)}</span>
                </div>
              )}
              {data.matchedBy && (
                <div className="detail-item">
                  <span className="detail-label">Người khớp:</span>
                  <span className="detail-value">{data.matchedBy.email || data.matchedBy}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {type === 'booking' ? renderBookingDetails() : renderTransactionDetails()}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
