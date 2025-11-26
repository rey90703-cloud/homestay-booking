import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import '../styles/Auth.css';

const ResetPasswordOTP = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [step, setStep] = useState(1); // Step 1: Email + OTP, Step 2: New Password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For OTP, only allow numbers and limit to 6 digits
    if (name === 'otp') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    }
    if (!/[a-z]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 chữ thường';
    }
    if (!/[0-9]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 số';
    }
    if (!/[@$!%*?&]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&)';
    }
    return null;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      showToast('Vui lòng nhập email', 'error');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Email không hợp lệ', 'error');
      return;
    }

    if (formData.otp.length !== 6) {
      showToast('Mã OTP phải có 6 số', 'error');
      return;
    }

    // Move to step 2
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(formData.email, formData.otp, formData.password);

      if (result.success) {
        showToast('Đặt lại mật khẩu thành công!', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        showToast(result.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">HomestayBooking</h1>
          <h2 className="auth-title">Đặt lại mật khẩu</h2>
          {step === 1 ? (
            <p className="auth-subtitle">Nhập email và mã OTP đã gửi đến email của bạn</p>
          ) : (
            <p className="auth-subtitle">Nhập mật khẩu mới của bạn</p>
          )}
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">EMAIL</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="otp">MÃ OTP (6 SỐ)</label>
              <input
                type="text"
                id="otp"
                name="otp"
                placeholder="123456"
                value={formData.otp}
                onChange={handleChange}
                disabled={loading}
                maxLength="6"
                pattern="[0-9]*"
                inputMode="numeric"
                style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', fontFamily: 'monospace' }}
                required
              />
              <small className="form-hint">
                Nhập mã 6 số đã được gửi đến email của bạn. Mã có hiệu lực trong 5 phút.
              </small>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>

            <div className="auth-footer">
              <Link to="/forgot-password" className="auth-link">
                Gửi lại mã OTP
              </Link>
              {' | '}
              <Link to="/login" className="auth-link">
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="auth-form">
            <div className="email-info" style={{
              background: '#FFF1F7',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#666'
            }}>
              ✓ Đang đặt lại mật khẩu cho: <strong>{formData.email}</strong>
            </div>

            <div className="form-group">
              <label htmlFor="password">MẬT KHẨU MỚI</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="form-hint">
                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">XÁC NHẬN MẬT KHẨU</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>

            <div className="auth-footer">
              <button 
                type="button"
                onClick={() => setStep(1)} 
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Quay lại bước trước
              </button>
            </div>
          </form>
        )}
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

export default ResetPasswordOTP;
