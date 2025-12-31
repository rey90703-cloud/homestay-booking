import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import HostLayout from '../../components/layout/HostLayout';
import HostOverview from './HostOverview';
import HostHomestays from './HostHomestays';
import HostBookings from './HostBookings';
import AddHomestay from '../AddHomestay';
import './HostDashboard.css';

const HostDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
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
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="host-loading">
        <div className="spinner"></div>
        <p>Đang tải...</p>
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
      case 'bookings':
        return <HostBookings />;
      case 'homestays':
        return <HostHomestays onAddClick={() => setActiveTab('add-homestay')} />;
      case 'add-homestay':
        return <AddHomestay onSuccess={() => setActiveTab('homestays')} hideLayout={true} />;
      default:
        return <HostOverview />;
    }
  };

  return (
    <HostLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </HostLayout>
  );
};

export default HostDashboard;
