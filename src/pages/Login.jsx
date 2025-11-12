import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import '../styles/Auth.css';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setIsLoading(false);
        setToast({
          message: 'Đăng nhập thành công! Chào mừng bạn trở lại.',
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
        setError(result.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await googleLogin();

      if (result.success) {
        setToast({
          message: 'Đăng nhập Google thành công!',
          type: 'success'
        });

        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setIsLoading(false);
        if (result.message !== 'Đã hủy đăng nhập') {
          setError(result.message);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setError('Có lỗi xảy ra khi đăng nhập với Google.');
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
              <h2 className="auth-visual-title">Chào mừng trở lại!</h2>
              <p className="auth-visual-description">
                Đăng nhập để quản lý booking và khám phá những homestay tuyệt vời
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-form-section">
            <div className="auth-card">
              <div className="auth-header">
                <h2 className="auth-title">Đăng nhập</h2>
                <p className="auth-subtitle">Nhập thông tin tài khoản của bạn</p>
              </div>

          <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
            {error && (
              <div className="error-alert" style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="btn-login" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="login-footer">
            <p className="signup-text">
              Chưa có tài khoản? <Link to="/register" className="signup-link">Đăng ký ngay</Link>
            </p>
          </div>

          <div className="divider">
            <span>Hoặc đăng nhập với</span>
          </div>

          <div className="social-login">
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

export default Login;

