import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import '../styles/Auth.css';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'guest', // Tự động set là guest (người thuê)
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Bạn phải đồng ý với điều khoản';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const result = await register(formData);

      if (result.success) {
        setIsLoading(false);
        setToast({
          message: 'Đăng ký thành công! Chào mừng bạn đến với HomestayBooking.',
          type: 'success'
        });
        
        // Redirect based on role after showing toast
        setTimeout(() => {
          if (result.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 2000);
      } else {
        setIsLoading(false);
        setApiError(result.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      setIsLoading(false);
      setApiError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setApiError('');

    try {
      // Pass the selected role to googleLogin
      const result = await googleLogin(formData.role);

      if (result.success) {
        setToast({
          message: 'Đăng nhập thành công!',
          type: 'success'
        });

        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setIsLoading(false);
        if (result.message !== 'Đã hủy đăng nhập') {
          setApiError(result.message);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setApiError('Có lỗi xảy ra khi đăng nhập với Google.');
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="auth-container">
        {/* Left Side - Visual */}
        <div className="auth-visual">
            <div className="auth-visual-content">
              <div className="auth-visual-logo">
                <img src="/logo.png" alt="Logo" />
                <h1>HomestayBooking</h1>
              </div>
              <h2 className="auth-visual-title">Bắt đầu hành trình</h2>
              <p className="auth-visual-description">
                Tạo tài khoản để khám phá và đặt những homestay tuyệt vời nhất
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-form-section">
            <div className="auth-card">
              <div className="auth-header">
                <h2 className="auth-title">Đăng ký tài khoản</h2>
                <p className="auth-subtitle">Điền thông tin để tạo tài khoản mới</p>
              </div>

          <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
            {apiError && (
              <div className="error-alert" style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                {apiError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Họ và tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`form-input ${errors.fullName ? 'error' : ''}`}
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="new-name"
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="new-email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Số điện thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="0123456789"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="new-tel"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            {/* Role selection removed - auto set to guest */}
            {/* Người cho thuê cần liên hệ admin để được cấp tài khoản */}

            <div className="form-group">
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
              <small style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
                Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  className="checkbox-input"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <span> 
                  Tôi đồng ý với <a href="#" className="link-text">Điều khoản dịch vụ</a> và <a href="#" className="link-text">Chính sách bảo mật</a>
                </span>
              </label>
              {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
            </div>

            <button type="submit" className="btn-register" disabled={isLoading}>
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div className="register-footer">
            <p className="login-text">
              Đã có tài khoản? <Link to="/login" className="login-link">Đăng nhập ngay</Link>
            </p>
            <p className="host-info-text" style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#0369a1',
              textAlign: 'center'
            }}>
              💼 Muốn trở thành chủ nhà? Vui lòng liên hệ admin để được cấp tài khoản host.
            </p>
          </div>

          <div className="divider">
            <span>Hoặc đăng ký với</span>
          </div>

          <div className="social-register">
            <button 
              type="button"
              className="btn-social btn-google"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="social-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isLoading ? 'Đang đăng nhập...' : 'Google'}
            </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;

