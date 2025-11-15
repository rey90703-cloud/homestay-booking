import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../../config/api';
import './MatchTransactionModal.css';

/**
 * MatchTransactionModal Component
 * Modal để khớp unmatched transaction với booking
 * Có search và filter bookings
 */
const MatchTransactionModal = ({ transaction, isOpen, onClose, onSuccess }) => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch pending bookings khi modal mở
  useEffect(() => {
    if (isOpen && transaction) {
      fetchPendingBookings();
    }
  }, [isOpen, transaction]);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_BASE_URL}/bookings?paymentStatus=pending&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedBooking) {
      alert('Vui lòng chọn booking để khớp');
      return;
    }

    if (!confirm('Xác nhận khớp giao dịch này với booking đã chọn?')) {
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/payments/unmatched/${transaction._id}/match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId: selectedBooking._id,
            notes: notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Khớp giao dịch thành công!');
        onSuccess();
        handleClose();
      } else {
        alert(data.message || 'Có lỗi xảy ra khi khớp giao dịch');
      }
    } catch (error) {
      console.error('Error matching transaction:', error);
      alert('Có lỗi xảy ra khi khớp giao dịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    setSelectedBooking(null);
    setNotes('');
    setSearchTerm('');
    onClose();
  }, [onClose]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, []);

  // Filter bookings theo search term
  const filteredBookings = bookings.filter((booking) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      booking._id.toLowerCase().includes(search) ||
      booking.payment?.reference?.toLowerCase().includes(search) ||
      booking.guestId?.email?.toLowerCase().includes(search) ||
      booking.homestayId?.title?.toLowerCase().includes(search)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content match-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Khớp giao dịch với Booking</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Transaction Info */}
          <div className="transaction-info-box">
            <h3>Thông tin giao dịch</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Mã GD:</span>
                <span className="info-value">{transaction?.transactionId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Số tiền:</span>
                <span className="info-value highlight">
                  {formatPrice(transaction?.amount)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Nội dung:</span>
                <span className="info-value">{transaction?.content}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngân hàng:</span>
                <span className="info-value">
                  {transaction?.bankInfo?.bankName}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bookings */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Tìm kiếm booking (mã, email, homestay...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Bookings List */}
          <div className="bookings-list">
            <h3>Chọn booking để khớp ({filteredBookings.length})</h3>
            
            {loading ? (
              <div className="loading-state">Đang tải bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="empty-state-small">
                Không tìm thấy booking nào
              </div>
            ) : (
              <div className="bookings-scroll">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className={`booking-item ${
                      selectedBooking?._id === booking._id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="booking-header">
                      <span className="booking-code">
                        {booking.payment?.reference || booking._id.slice(-8)}
                      </span>
                      <span className="booking-amount">
                        {formatPrice(booking.pricing.totalAmount)}
                      </span>
                    </div>
                    <div className="booking-details">
                      <div className="booking-detail-item">
                        <strong>Homestay:</strong> {booking.homestayId?.title || 'N/A'}
                      </div>
                      <div className="booking-detail-item">
                        <strong>Khách:</strong> {booking.guestId?.email || 'N/A'}
                      </div>
                      <div className="booking-detail-item">
                        <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
                      </div>
                    </div>
                    
                    {/* Amount comparison */}
                    {Math.abs(booking.pricing.totalAmount - transaction?.amount) > 1000 && (
                      <div className="amount-warning">
                        ⚠️ Số tiền chênh lệch:{' '}
                        {formatPrice(
                          Math.abs(booking.pricing.totalAmount - transaction?.amount)
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="notes-section">
            <label>Ghi chú (tùy chọn)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lý do khớp thủ công, thông tin bổ sung..."
              rows={3}
              className="notes-textarea"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose} disabled={submitting}>
            Hủy
          </button>
          <button
            className="btn-primary"
            onClick={handleMatch}
            disabled={!selectedBooking || submitting}
          >
            {submitting ? 'Đang xử lý...' : 'Xác nhận khớp'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchTransactionModal;
