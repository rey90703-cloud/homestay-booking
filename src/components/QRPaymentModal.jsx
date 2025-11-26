import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../config/api';
import './QRPaymentModal.css';

const QRPaymentModal = ({ bookingId, onSuccess, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const pollingIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    if (bookingId) {
      fetchQRCode();
    }

    return () => {
      clearPolling();
      clearCountdown();
    };
  }, [bookingId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment/qrcode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setQrData(data.data);
        calculateTimeRemaining(data.data.qrCode.expiresAt);
        startPolling();
        startCountdown(data.data.qrCode.expiresAt);
      } else {
        setError(data.message || 'Không thể tạo mã QR');
      }
    } catch (err) {
      console.error('Error fetching QR code:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStatus(data.data.status);

        if (data.data.status === 'completed') {
          clearPolling();
          clearCountdown();
          setTimeout(() => {
            onSuccess(data.data);
          }, 1500);
        } else if (data.data.status === 'expired') {
          clearPolling();
          clearCountdown();
        }
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
    }
  };

  const startPolling = () => {
    clearPolling();
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatus();
    }, 10000); // Poll every 10 seconds
  };

  const clearPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const calculateTimeRemaining = (expiresAt) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
    setTimeRemaining(remaining);
  };

  const startCountdown = (expiresAt) => {
    clearCountdown();
    countdownIntervalRef.current = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearCountdown();
        setPaymentStatus('expired');
      }
    }, 1000);
  };

  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleRegenerateQR = () => {
    fetchQRCode();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép!');
  };

  if (loading) {
    return (
      <div className="qr-modal-overlay">
        <div className="qr-modal">
          <div className="qr-loading">
            <div className="spinner"></div>
            <p>Đang tạo mã QR thanh toán...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-modal-overlay">
        <div className="qr-modal">
          <div className="qr-error">
            <div className="error-icon">⚠️</div>
            <h3>Có lỗi xảy ra</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button className="btn-retry" onClick={fetchQRCode}>
                Thử lại
              </button>
              <button className="btn-cancel" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'completed') {
    return (
      <div className="qr-modal-overlay">
        <div className="qr-modal">
          <div className="qr-success">
            <div className="success-icon">✓</div>
            <h3>Thanh toán thành công!</h3>
            <p>Đang chuyển hướng...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h2>Quét mã QR để thanh toán</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="qr-modal-body">
          {paymentStatus === 'expired' ? (
            <div className="qr-expired">
              <div className="expired-icon">⏱️</div>
              <h3>Mã QR đã hết hạn</h3>
              <p>Vui lòng tạo mã QR mới để tiếp tục thanh toán</p>
              <button className="btn-regenerate" onClick={handleRegenerateQR}>
                Tạo lại mã QR
              </button>
            </div>
          ) : (
            <>
              <div className="qr-code-container">
                <img 
                  src={qrData?.qrCode?.data || qrData?.qrCode?.url} 
                  alt="QR Code" 
                  className="qr-code-image"
                />
                <div className="qr-timer">
                  <span className="timer-icon">⏰</span>
                  <span className="timer-text">
                    Còn lại: <strong>{formatTime(timeRemaining)}</strong>
                  </span>
                </div>
              </div>

              <div className="payment-info-section">
                <div className="payment-info">
                <h3>Thông tin chuyển khoản</h3>
                <div className="info-row">
                  <span className="info-label">Ngân hàng:</span>
                  <span className="info-value">{qrData?.bankInfo?.bankName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số tài khoản:</span>
                  <span className="info-value">
                    {qrData?.bankInfo?.accountNumber}
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(qrData?.bankInfo?.accountNumber)}
                      title="Sao chép"
                    >
                      ⎘
                    </button>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Chủ tài khoản:</span>
                  <span className="info-value">{qrData?.bankInfo?.accountName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số tiền:</span>
                  <span className="info-value amount">
                    {qrData?.payment?.amount?.toLocaleString('vi-VN')}đ
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(qrData?.payment?.amount)}
                      title="Sao chép"
                    >
                      ⎘
                    </button>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Nội dung:</span>
                  <span className="info-value reference">
                    {qrData?.payment?.reference}
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(qrData?.payment?.reference)}
                      title="Sao chép"
                    >
                      ⎘
                    </button>
                  </span>
                </div>
                </div>

                <div className="payment-instructions">
                  <h4>Hướng dẫn thanh toán</h4>
                  <ol>
                    <li>Mở ứng dụng ngân hàng của bạn</li>
                    <li>Chọn chức năng quét mã QR</li>
                    <li>Quét mã QR bên trái</li>
                    <li>Kiểm tra thông tin và xác nhận thanh toán</li>
                  </ol>
                  <p className="note">
                    💡 Hệ thống sẽ tự động xác nhận thanh toán sau khi bạn chuyển khoản thành công
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRPaymentModal;
