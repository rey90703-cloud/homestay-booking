import React, { useState } from 'react';
import './CancelBookingModal.css';

const CancelBookingModal = ({ booking, onClose, onConfirm, refundPreview }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do hủy phòng');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPolicyBadge = () => {
    if (!refundPreview) return null;

    const { refundPolicy, refundPercentage } = refundPreview;
    
    if (refundPolicy === 'full') {
      return { text: `Hoàn ${refundPercentage}%`, className: 'policy-full' };
    } else if (refundPolicy === 'partial') {
      return { text: `Hoàn ${refundPercentage}%`, className: 'policy-partial' };
    } else {
      return { text: 'Không hoàn tiền', className: 'policy-none' };
    }
  };

  const badge = getPolicyBadge();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cancel-modal-header">
          <h2>Hủy đặt phòng</h2>
          <button className="close-btn" onClick={onClose}>
            <span>&times;</span>
          </button>
        </div>

        <div className="cancel-modal-body">
          {/* Booking Info */}
          <div className="booking-info-section">
            <h3>Thông tin đặt phòng</h3>
            <div className="booking-info-card">
              <div className="info-row">
                <span className="label">Homestay:</span>
                <span className="value">{booking.homestay.title}</span>
              </div>
              <div className="info-row">
                <span className="label">Ngày nhận phòng:</span>
                <span className="value">{formatDate(booking.checkInDate)}</span>
              </div>
              <div className="info-row">
                <span className="label">Ngày trả phòng:</span>
                <span className="value">{formatDate(booking.checkOutDate)}</span>
              </div>
              <div className="info-row">
                <span className="label">Tổng tiền:</span>
                <span className="value highlight">{formatCurrency(booking.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          {refundPreview && (
            <div className="policy-section">
              <h3>Chính sách hoàn tiền</h3>
              <div className="policy-card">
                <div className="policy-badge-wrapper">
                  {badge && (
                    <span className={`policy-badge ${badge.className}`}>
                      {badge.text}
                    </span>
                  )}
                </div>
                
                <div className="refund-details">
                  <div className="refund-row">
                    <span className="label">Số tiền được hoàn:</span>
                    <span className="value highlight-green">
                      {formatCurrency(refundPreview.refundAmount)}
                    </span>
                  </div>
                  
                  {refundPreview.serviceFeeDeducted > 0 && (
                    <div className="refund-row">
                      <span className="label">Phí dịch vụ (không hoàn):</span>
                      <span className="value">
                        {formatCurrency(refundPreview.serviceFeeDeducted)}
                      </span>
                    </div>
                  )}
                  
                  <div className="refund-row">
                    <span className="label">Thời gian xử lý:</span>
                    <span className="value">{refundPreview.processTime}</span>
                  </div>
                </div>

                <div className="policy-message">
                  <p>{refundPreview.message}</p>
                </div>

                {/* Policy Rules */}
                <div className="policy-rules">
                  <h4>Quy định hủy phòng:</h4>
                  <ul>
                    <li>
                      <span className="rule-icon">✓</span>
                      <span><strong>&gt; 7 ngày</strong> trước check-in: Hoàn 100% (trừ phí dịch vụ)</span>
                    </li>
                    <li>
                      <span className="rule-icon">✓</span>
                      <span><strong>3-7 ngày</strong> trước check-in: Hoàn 50%</span>
                    </li>
                    <li>
                      <span className="rule-icon">✗</span>
                      <span><strong>&lt; 3 ngày</strong> trước check-in: Không hoàn tiền</span>
                    </li>
                    <li>
                      <span className="rule-icon">✗</span>
                      <span><strong>&lt; 24 giờ</strong> trước check-in: Không thể hủy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="reason-section">
            <h3>Lý do hủy phòng</h3>
            <textarea
              className="reason-textarea"
              placeholder="Vui lòng cho chúng tôi biết lý do bạn hủy đặt phòng..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <div className="char-count">{reason.length}/500 ký tự</div>
          </div>

          {/* Warning */}
          <div className="warning-box">
            <span className="warning-icon">⚠️</span>
            <p>
              <strong>Lưu ý:</strong> Sau khi xác nhận hủy, bạn không thể hoàn tác thao tác này. 
              {refundPreview && refundPreview.refundAmount > 0 && (
                <> Số tiền hoàn sẽ được chuyển về tài khoản trong vòng {refundPreview.processTime}.</>
              )}
            </p>
          </div>
        </div>

        <div className="cancel-modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Quay lại
          </button>
          <button
            className="btn-danger"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;
