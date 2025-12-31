import React, { useState, useEffect } from 'react';
import './GuestPasswordDisplay.css';

// SVG Icons
const IconKey = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const IconCopy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

/**
 * GuestPasswordDisplay Component
 * Hiển thị mật khẩu guest với show/hide toggle và countdown timer
 */
const GuestPasswordDisplay = ({ password, expiresAt, durationMinutes }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining('Không xác định');
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Đã hết hạn');
        return;
      }

      setIsExpired(false);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days} ngày ${hours} giờ`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} giờ ${minutes} phút`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes} phút ${seconds} giây`);
      } else {
        setTimeRemaining(`${seconds} giây`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      alert('Đã sao chép mật khẩu');
    }
  };

  if (!password) {
    return (
      <div className="guest-password-display empty">
        <div className="password-icon">
          <IconKey />
        </div>
        <div className="password-content">
          <h4>Chưa có mật khẩu</h4>
          <p>Mật khẩu sẽ được tạo sau khi chủ nhà xác nhận</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`guest-password-display ${isExpired ? 'expired' : ''}`}>
      <div className="password-header">
        <div className="password-icon">
          <IconKey />
        </div>
        <div className="password-info">
          <h4>Mật khẩu cửa</h4>
          <p className="password-hint">Nhập mật khẩu rồi nhấn #</p>
        </div>
      </div>

      <div className="password-display-box">
        <div className="password-value">
          {showPassword ? (
            <span className="password-text">{password}</span>
          ) : (
            <span className="password-hidden">••••</span>
          )}
        </div>
        <div className="password-actions">
          <button
            className="btn-toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </button>
          <button
            className="btn-copy-password"
            onClick={handleCopyPassword}
            title="Sao chép mật khẩu"
          >
            <IconCopy />
          </button>
        </div>
      </div>

      <div className="password-expiry">
        <div className="expiry-info">
          <span className="expiry-label">Thời gian còn lại:</span>
          <span className={`expiry-value ${isExpired ? 'expired' : ''}`}>
            {timeRemaining}
          </span>
        </div>
        {durationMinutes !== undefined && (
          <div className="duration-info">
            <span className="duration-label">Thời gian hiệu lực:</span>
            <span className="duration-value">{durationMinutes} phút</span>
          </div>
        )}
      </div>

      {isExpired && (
        <div className="expiry-warning">
          <IconWarning />
          <span>Mật khẩu đã hết hạn. Vui lòng liên hệ chủ nhà để gia hạn.</span>
        </div>
      )}
    </div>
  );
};

export default GuestPasswordDisplay;
