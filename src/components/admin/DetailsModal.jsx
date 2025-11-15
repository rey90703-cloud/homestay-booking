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
    <div className="details-content">
      {/* Left Column */}
      <div className="details-section">
        <h3 className="section-title">Thông tin booking</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Mã booking:</span>
            <span className="detail-value code">{data._id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Mã tham chiếu:</span>
            <span className="detail-value code">{data.payment?.reference || 'Chưa có'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Homestay:</span>
            <span className="detail-value">{data.homestayId?.title || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Khách hàng:</span>
            <span className="detail-value">{data.guestId?.email || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Check-in:</span>
            <span className="detail-value">{formatDate(data.checkInDate)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Check-out:</span>
            <span className="detail-value">{formatDate(data.checkOutDate)}</span>
          </div>
          {data.payment.transactionId && (
            <div className="detail-item">
              <span className="detail-label">Mã giao dịch:</span>
              <span className="detail-value code">{data.payment.transactionId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="details-section">
        <h3 className="section-title">Thông tin thanh toán</h3>
        <div className="details-grid">
          <div className="detail-item highlight">
            <span className="detail-label">Tổng tiền:</span>
            <span className="detail-value price-large">
              {formatPrice(data.pricing.totalAmount)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Chủ nhà (90%):</span>
            <span className="detail-value price-host">
              {formatPrice(data.pricing.hostAmount)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Nền tảng (10%):</span>
            <span className="detail-value price-commission">
              {formatPrice(data.pricing.platformCommission)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Trạng thái thanh toán:</span>
            <span className={`detail-value badge badge-${data.payment.status}`}>
              {getStatusText(data.payment.status, 'payment')}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Trạng thái chi trả:</span>
            <span className={`detail-value badge badge-${data.hostPayout?.status || 'pending'}`}>
              {getStatusText(data.hostPayout?.status || 'pending', 'payout')}
            </span>
          </div>
          {data.payment.verification?.method && (
            <>
              <div className="detail-item">
                <span className="detail-label">Phương thức xác minh:</span>
                <span className="detail-value">{data.payment.verification.method}</span>
              </div>
              {data.payment.verification.verifiedAt && (
                <div className="detail-item">
                  <span className="detail-label">Thời gian xác minh:</span>
                  <span className="detail-value">{formatDate(data.payment.verification.verifiedAt)}</span>
                </div>
              )}
            </>
          )}
        </div>
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
