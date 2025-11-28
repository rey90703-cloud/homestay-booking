import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import HostOverview from './HostOverview';
import HostHomestays from './HostHomestays';

import AddHomestay from '../AddHomestay';
import './HostDashboard.css';

const HostDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if coming from /add-homestay route
  useEffect(() => {
    if (location.state?.openAddHomestay) {
      setActiveTab('add-homestay');
    }
  }, [location]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
    // Allow all authenticated users to access (guest can also be host)
  }, [loading, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Đang tải...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <HostOverview />;
      case 'homestays':
        return <HostHomestays onAddClick={() => setActiveTab('add-homestay')} />;
      case 'add-homestay':
        return <AddHomestay onSuccess={() => setActiveTab('homestays')} hideLayout={true} />;
      default:
        return <HostOverview />;
    }
  };

  return (
    <div className="host-dashboard">
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
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="nav-text">Tổng quan</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'homestays' ? 'active' : ''}`}
            onClick={() => setActiveTab('homestays')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="nav-text">Homestay của tôi</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'add-homestay' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-homestay')}
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
        {renderContent()}
      </main>
    </div>
  );
};

export default HostDashboard;
