import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Debug: Log user info
  useEffect(() => {
    console.log('Header - isAuthenticated:', isAuthenticated);
    console.log('Header - user:', user);
    console.log('Header - user.role:', user?.role);
    console.log('Header - Button should show:', !isAuthenticated || user?.role === 'owner');
  }, [isAuthenticated, user]);

  const handleAddHomestay = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'owner') {
      navigate('/add-homestay');
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const handleProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text">HomestayBooking</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className="nav-link active">Trang chủ</Link>
          <Link to="/homestay-ha-noi" className="nav-link">Homestay Hà Nội</Link>
          <Link to="/homestay-lao-cai" className="nav-link">Homestay Lào Cai</Link>
          <Link to="/contact" className="nav-link">Liên hệ</Link>
          {!isAuthenticated && (
            <Link to="/login" className="nav-link">Đăng nhập</Link>
          )}
          {isAuthenticated && (
            <div className="user-dropdown" ref={dropdownRef}>
              <span 
                className="nav-link user-name" 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {user?.fullName} ▼
              </span>
              {showDropdown && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleProfile}>
                    <span>👤</span> Sửa thông tin cá nhân
                  </button>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <span>🚪</span> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {(!isAuthenticated || user?.role === 'owner') && (
          <button className="btn-primary" onClick={handleAddHomestay}>
            <img src="/images/icon-plus.svg" alt="plus" className="btn-icon" />
            <span>Đăng homestay</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

