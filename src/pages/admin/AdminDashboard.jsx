import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminUsers from './AdminUsers';
import AdminHomestays from './AdminHomestays';
import AdminPayments from './AdminPayments';
import AdminContacts from './AdminContacts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <AdminUsers />;
      case 'homestays':
        return <AdminHomestays />;
      case 'payments':
        return <AdminPayments />;
      case 'contacts':
        return <AdminContacts />;
      default:
        return <AdminUsers />;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">🏠 Admin Panel</h1>
          <p className="sidebar-user">👤 {user?.fullName || 'Admin'}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Quản lý người dùng</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'homestays' ? 'active' : ''}`}
            onClick={() => setActiveTab('homestays')}
          >
            <span className="nav-icon">🏡</span>
            <span className="nav-text">Quản lý homestay</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-text">Quản lý thanh toán</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <span className="nav-icon">📧</span>
            <span className="nav-text">Quản lý liên hệ</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;

