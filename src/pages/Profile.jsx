import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [errors, setErrors] = useState({});

  // Update formData when user changes (e.g., after refresh)
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    setApiError('');
    setSuccessMessage('');
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

    // Validate password change if any password field is filled
    if (formData.currentPassword || formData.newPassword || formData.confirmNewPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      }

      if (!formData.newPassword) {
        newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
      } else if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.newPassword)) {
        newErrors.newPassword = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt';
      }

      if (!formData.confirmNewPassword) {
        newErrors.confirmNewPassword = 'Vui lòng xác nhận mật khẩu mới';
      } else if (formData.newPassword !== formData.confirmNewPassword) {
        newErrors.confirmNewPassword = 'Mật khẩu không khớp';
      }
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
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || '${API_BASE_URL}';

      // Debug: Check token
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');

      if (!token) {
        throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      // Update profile information
      // Split fullName into firstName and lastName properly
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const profileData = {
        firstName: firstName,
        lastName: lastName,
        phone: formData.phone
      };

      const profileResponse = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.message || 'Cập nhật thông tin thất bại');
      }

      // Get updated user data from response
      const profileResult = await profileResponse.json();
      const updatedUserFromServer = profileResult.data.user;

      // Update password if provided
      if (formData.currentPassword && formData.newPassword) {
        const passwordData = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        };

        const passwordResponse = await fetch(`${API_URL}/auth/change-password`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(passwordData)
        });

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          throw new Error(errorData.message || 'Cập nhật mật khẩu thất bại');
        }

        // Clear password fields
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }

      // Update user in context and localStorage with data from server
      const updatedUser = {
        ...updatedUserFromServer,
        fullName: `${updatedUserFromServer.profile.firstName || ''} ${updatedUserFromServer.profile.lastName || ''}`.trim() || 'User',
        role: updatedUserFromServer.role === 'host' ? 'owner' : updatedUserFromServer.role === 'guest' ? 'renter' : updatedUserFromServer.role
      };
      updateUser(updatedUser);

      setSuccessMessage('Cập nhật thông tin thành công!');

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      setApiError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <h2 className="profile-title">Thông tin cá nhân</h2>
            <p className="profile-subtitle">Cập nhật thông tin của bạn</p>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            {apiError && (
              <div className="error-alert">
                {apiError}
              </div>
            )}

            {successMessage && (
              <div className="success-alert">
                {successMessage}
              </div>
            )}

            <div className="form-section">
              <h3 className="section-title">Thông tin cơ bản</h3>
              
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
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="example@email.com"
                  value={formData.email}
                  disabled
                  title="Email không thể thay đổi"
                />
                <small className="help-text">Email không thể thay đổi</small>
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
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Đổi mật khẩu</h3>
              <p className="section-subtitle">Để trống nếu không muốn đổi mật khẩu</p>

              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
                {errors.currentPassword && <span className="error-message">{errors.currentPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">Mật khẩu mới</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className={`form-input ${errors.newPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                <small className="help-text">
                  Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmNewPassword" className="form-label">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  className={`form-input ${errors.confirmNewPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                />
                {errors.confirmNewPassword && <span className="error-message">{errors.confirmNewPassword}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => navigate('/')}
                disabled={isLoading}
              >
                Hủy
              </button>
              <button type="submit" className="btn-save" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
