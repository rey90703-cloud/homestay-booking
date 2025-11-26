import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Auto resend if coming from reset password page
    if (location.state?.autoResend && location.state?.email && email) {
      // Call API directly without form submit
      sendOTPEmail();
    }
  }, [location.state]);

  const sendOTPEmail = async () => {
    if (loading) return; // Prevent double submission
    
    setLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setEmailSent(true);
        showToast('Mã OTP đã được gửi đến email của bạn! Mã có hiệu lực trong 5 phút.', 'success');
        
        // If auto resend, redirect back to reset password
        if (location.state?.autoResend) {
          setTimeout(() => {
            navigate('/reset-password', { state: { email }, replace: true });
          }, 1500);
        }
      } else {
        showToast(result.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('Vui lòng nhập email', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      showToast('Email không hợp lệ', 'error');
      return;
    }

    await sendOTPEmail();
  };

  return (
    <div className="auth-container">
      {/* Left Side - Visual */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-logo">
            <img src="/logo.png" alt="Logo" />
            <h1>HomestayBooking</h1>
          </div>
          <h2 className="auth-visual-title">Đặt lại mật khẩu</h2>
          <p className="auth-visual-description">
            Chúng tôi sẽ gửi mã OTP đến email của bạn để xác nhận và đặt lại mật khẩu mới
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Quên mật khẩu?</h2>
            {!emailSent ? (
              <p className="auth-subtitle">Nhập email của bạn để nhận mã OTP</p>
            ) : (
              <p className="auth-subtitle">Mã OTP đã được gửi! Kiểm tra hộp thư của bạn.</p>
            )}
          </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">EMAIL</label>
              <input
                type="email"
                id="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>

            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        ) : (
          <div className="email-sent-message">
            <div className="success-icon">✓</div>
            <p>Chúng tôi đã gửi mã OTP (6 số) tới <strong>{email}</strong></p>
            <p className="info-text">Vui lòng kiểm tra hộp thư (bao gồm cả thư mục spam). Mã có hiệu lực trong 5 phút.</p>
            
            <div className="action-links">
              <Link to="/reset-password" state={{ email }} className="btn-primary">
                Nhập mã OTP
              </Link>
              <button 
                onClick={handleSubmit} 
                className="btn-secondary"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
              </button>
              <Link to="/login" className="btn-link">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        )}
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default ForgotPassword;
