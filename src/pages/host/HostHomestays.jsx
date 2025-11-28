import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './HostHomestays.css';

const HostHomestays = ({ onAddClick }) => {
  const navigate = useNavigate();
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomestays();
  }, []);

  const fetchHomestays = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching homestays from:', `${API_BASE_URL}/homestays/my-listings`);
      const response = await fetch(`${API_BASE_URL}/homestays/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📦 Response data:', data);
      const homestaysList = data.data?.homestays || data.data?.listings || data.data || [];
      console.log('🏠 Homestays:', homestaysList);
      setHomestays(homestaysList);
    } catch (error) {
      console.error('Error fetching homestays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa homestay này?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/homestays/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Xóa homestay thành công!');
      fetchHomestays();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa homestay');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Đang hoạt động', class: 'status-active' },
      'pending': { label: 'Chờ duyệt', class: 'status-pending' },
      'inactive': { label: 'Tạm ngưng', class: 'status-inactive' }
    };
    const statusInfo = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="host-homestays-wrapper">
      <div className="page-header">
        <h1 className="page-title">Homestay của tôi</h1>
        <button 
          className="btn-add-homestay"
          onClick={onAddClick}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm homestay
        </button>
      </div>

      {homestays.length === 0 ? (
        <div className="no-homestays">
          <p>Bạn chưa có homestay nào</p>
          <button onClick={onAddClick}>Đăng homestay đầu tiên</button>
        </div>
      ) : (
        <div className="homestays-grid">
          {homestays.map((homestay) => (
            <div key={homestay._id} className="homestay-card">
              <div className="homestay-image">
                <img src={homestay.coverImage} alt={homestay.title} />
                {getStatusBadge(homestay.status)}
              </div>
              <div className="homestay-content">
                <h3 className="homestay-title">{homestay.title}</h3>
                <p className="homestay-location">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {homestay.location.city}
                </p>
                <p className="homestay-price">{formatPrice(homestay.pricing.basePrice)}/đêm</p>
                <div className="homestay-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => navigate(`/homestay/${homestay._id}`)}
                  >
                    Xem
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(homestay._id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostHomestays;
