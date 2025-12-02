import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeSwitch from './ThemeSwitch/ThemeSwitch';
import Toast from './Toast';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle scroll to show/hide header opacity
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Cuộn xuống - mờ đi
        setHeaderVisible(false);
      } else {
        // Cuộn lên - hiển thị rõ
        setHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debug: Log user info
  useEffect(() => {
    console.log('Header - isAuthenticated:', isAuthenticated);
    console.log('Header - user:', user);
    console.log('Header - user.role:', user?.role);
    console.log('Header - showDropdown:', showDropdown);
    console.log('Header - Button should show:', !isAuthenticated || user?.role === 'owner');
  }, [isAuthenticated, user, showDropdown]);

  const handleAddHomestay = () => {
    scrollToTop();
    if (!isAuthenticated) {
      setToast({
        message: 'Bạn cần đăng nhập với tài khoản Người cho thuê để đăng homestay!',
        type: 'warning'
      });
      setTimeout(() => navigate('/login'), 2000);
    } else if (user?.role === 'owner') {
      navigate('/add-homestay');
    } else {
      setToast({
        message: 'Chỉ tài khoản Người cho thuê mới có thể đăng homestay!',
        type: 'warning'
      });
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    scrollToTop();
    navigate('/');
  };

  const handleProfile = () => {
    setShowDropdown(false);
    scrollToTop();
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
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <header className={`header ${headerVisible ? 'header-visible' : 'header-faded'}`}>
        <div className="header-container">
        <Link to="/" className="logo" onClick={scrollToTop}>
          <img src="/logo.png" alt="HomestayBooking" className="logo-image" />
          <span className="logo-text">HomestayBooking</span>
        </Link>

        {/* Hamburger Menu Button - Mobile Only */}
        <button 
          className="hamburger-menu"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav-links ${showMobileMenu ? 'mobile-open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => { setShowMobileMenu(false); scrollToTop(); }}>Trang chủ</Link>
          <Link to="/homestay-ha-noi" className={`nav-link ${location.pathname === '/homestay-ha-noi' ? 'active' : ''}`} onClick={() => { setShowMobileMenu(false); scrollToTop(); }}>Homestay Hà Nội</Link>
          <Link to="/homestay-lao-cai" className={`nav-link ${location.pathname === '/homestay-lao-cai' ? 'active' : ''}`} onClick={() => { setShowMobileMenu(false); scrollToTop(); }}>Homestay Lào Cai</Link>
          <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`} onClick={() => { setShowMobileMenu(false); scrollToTop(); }}>Liên hệ</Link>
          {!isAuthenticated && (
            <Link to="/login" className="nav-link" onClick={() => setShowMobileMenu(false)}>Đăng nhập</Link>
          )}
          {(!isAuthenticated || user?.role === 'owner') && (
            <button className="btn-primary mobile-btn" onClick={() => { handleAddHomestay(); setShowMobileMenu(false); }}>
              <span>Đăng homestay</span>
            </button>
          )}
          {isAuthenticated && (
            <div className="user-dropdown" ref={dropdownRef}>
              <span 
                className="nav-link user-name" 
                onClick={() => {
                  console.log('Dropdown clicked, current state:', showDropdown);
                  setShowDropdown(!showDropdown);
                }}
              >
                {user?.fullName || user?.name || 'User'} ▼
              </span>
              {showDropdown && (
                <div className="dropdown-menu" style={{ display: 'block' }}>
                  <button className="dropdown-item" onClick={handleProfile}>
                    Thông tin cá nhân
                  </button>
                  <button className="dropdown-item" onClick={() => { setShowDropdown(false); scrollToTop(); navigate('/wishlist'); }}>
                    Yêu thích
                  </button>
                  {user?.role !== 'admin' && (
                    <button className="dropdown-item" onClick={() => { setShowDropdown(false); scrollToTop(); navigate('/my-bookings'); }}>
                      Lịch sử đặt phòng
                    </button>
                  )}
                  {(user?.role === 'owner' || user?.role === 'host') && (
                    <button className="dropdown-item" onClick={() => { setShowDropdown(false); scrollToTop(); navigate('/host/dashboard'); }}>
                      Dashboard
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button className="dropdown-item" onClick={() => { setShowDropdown(false); scrollToTop(); navigate('/admin'); }}>
                      Admin System
                    </button>
                  )}
                  <button className="dropdown-item" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {(!isAuthenticated || user?.role === 'owner') && (
          <button className="btn-primary desktop-btn" onClick={handleAddHomestay}>
            <span>Đăng homestay</span>
          </button>
        )}

        <ThemeSwitch 
          modes={['light', 'dark', 'system']} 
          showInactiveIcons="all"
          variant="icon-click"
        />
        </div>
      </header>
    </>
  );
};

export default Header;

