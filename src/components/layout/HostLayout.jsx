import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './HostLayout.css';

/**
 * HostLayout Component
 * Layout wrapper cho các trang host với sidebar
 */
const HostLayout = ({ children, activeTab = '', onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine active tab from current path
  const getActiveTab = () => {
    if (activeTab) return activeTab;
    const path = location.pathname;
    if (path.includes('/host/bookings/')) return 'bookings';
    if (path.includes('/host/homestays')) return 'homestays';
    if (path.includes('/host/dashboard')) return 'overview';
    return 'overview';
  };

  const currentTab = getActiveTab();

  const handleNavClick = (tab, path) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <div className="host-layout">
      <aside className="host-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">Host Dashboard</h1>
          <p className="sidebar-user">
            <svg className="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {user?.fullName || user?.email}
          </p>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item nav-item-website"
            onClick={() => window.open('/', '_blank')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="nav-text">Về trang chủ</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavClick('overview', '/host/dashboard')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="nav-text">Tổng quan</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'bookings' ? 'active' : ''}`}
            onClick={() => handleNavClick('bookings', '/host/dashboard')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="nav-text">Đặt phòng</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'homestays' ? 'active' : ''}`}
            onClick={() => handleNavClick('homestays', '/host/dashboard')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="nav-text">Homestay của tôi</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'add-homestay' ? 'active' : ''}`}
            onClick={() => handleNavClick('add-homestay', '/host/dashboard')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="nav-text">Thêm homestay</span>
          </button>

          <button className="nav-item nav-item-logout" onClick={handleLogout}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="nav-text">Đăng xuất</span>
          </button>
        </nav>
      </aside>

      <main className="host-main">
        {children}
      </main>
    </div>
  );
};

export default HostLayout;
