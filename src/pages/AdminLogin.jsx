import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import '../styles/Auth.css';
import './AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

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
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Check if user is admin
        if (result.user.role !== 'admin') {
          setIsLoading(false);
          setError('Bạn không có quyền truy cập vào trang quản trị.');
          return;
        }

        setIsLoading(false);
        setToast({
          message: 'Đăng nhập thành công! Chào mừng Admin.',
          type: 'success'
        });
        
        // Redirect to admin dashboard
        setTimeout(() => {
          navigate('/admin');
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
        <div className="auth-visual admin-visual">
          <div className="auth-visual-content">
            <div className="auth-visual-logo">
              <img src="/logo.png" alt="Logo" />
              <h1>Admin Panel</h1>
            </div>
            <h2 className="auth-visual-title">Quản trị viên</h2>
            <p className="auth-visual-description">
              Đăng nhập để quản lý hệ thống, người dùng và homestay
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-section">
          <div className="auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Đăng nhập Admin</h2>
              <p className="auth-subtitle">Nhập thông tin tài khoản quản trị viên</p>
            </div>

            <form className="admin-login-form" onSubmit={handleSubmit} autoComplete="off">
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
                  placeholder="admin@homestay.com"
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
              </div>

              <button type="submit" className="btn-admin-login" disabled={isLoading}>
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="admin-login-footer">
              <p className="back-to-site">
                <Link to="/" className="back-link">← Quay về trang chủ</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminLogin;
