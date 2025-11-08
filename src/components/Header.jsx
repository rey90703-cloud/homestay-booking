import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleAddHomestay = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'owner') {
      navigate('/add-homestay');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text">HomestayBooking</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className="nav-link active">Trang chủ</Link>
          <a href="#" className="nav-link">Homestay Hà Nội</a>
          <a href="#" className="nav-link">Homestay Lào Cai</a>
          <Link to="/contact" className="nav-link">Liên hệ</Link>
          {!isAuthenticated && (
            <Link to="/login" className="nav-link">Đăng nhập</Link>
          )}
          {isAuthenticated && (
            <span className="nav-link user-name">👤 {user?.fullName || 'User'}</span>
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

