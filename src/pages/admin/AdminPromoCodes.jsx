import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API_BASE_URL from '../../config/api';
import './AdminPromoCodes.css';

function AdminPromoCodes() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [promoCodes, setPromoCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    conditions: '',
    isActive: true,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchPromoCodes();
  }, [isAuthenticated, user, navigate]);

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/promo-codes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch promo codes');
      }
      
      const data = await response.json();
      setPromoCodes(data.data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      alert('Không thể tải danh sách mã giảm giá');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate
      if (!formData.code || !formData.name || !formData.discountValue) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      const token = localStorage.getItem('token');
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxDiscount: parseFloat(formData.maxDiscount) || 0,
        usageLimit: parseInt(formData.usageLimit) || 0,
        validFrom: formData.validFrom || undefined,
        validUntil: formData.validUntil || undefined,
        conditions: formData.conditions,
        isActive: formData.isActive,
      };

      let response;
      if (editingPromo) {
        // Update
        response = await fetch(`${API_BASE_URL}/promo-codes/${editingPromo._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        response = await fetch(`${API_BASE_URL}/promo-codes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save promo code');
      }

      handleCloseModal();
      alert(editingPromo ? 'Cập nhật mã thành công!' : 'Tạo mã thành công!');
      fetchPromoCodes(); // Refresh list
    } catch (error) {
      console.error('Error saving promo code:', error);
      alert(error.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    
    // Format dates for input[type="date"]
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      minOrderAmount: promo.minOrderAmount?.toString() || '',
      maxDiscount: promo.maxDiscount?.toString() || '',
      usageLimit: promo.usageLimit?.toString() || '',
      validFrom: formatDate(promo.validFrom),
      validUntil: formatDate(promo.validUntil),
      conditions: promo.conditions || '',
      isActive: promo.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mã này?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/promo-codes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete promo code');
      }

      alert('Xóa mã thành công!');
      fetchPromoCodes(); // Refresh list
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/promo-codes/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle promo code');
      }

      fetchPromoCodes(); // Refresh list
    } catch (error) {
      console.error('Error toggling promo code:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromo(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxDiscount: '',
      usageLimit: '',
      validFrom: '',
      validUntil: '',
      conditions: '',
      isActive: true,
    });
  };

  return (
    <div className="admin-promo-codes">
      <div className="admin-promo-header">
        <div>
          <h1 className="admin-promo-title">Quản lý mã giảm giá</h1>
          <p className="admin-promo-subtitle">Tạo và quản lý các mã ưu đãi cho khách hàng</p>
        </div>
        <button className="btn-create-promo" onClick={() => setShowModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Tạo mã mới
        </button>
      </div>

      {isLoading ? (
        <div className="promo-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : (
        <div className="promo-codes-grid">
          {promoCodes.map((promo) => (
            <div key={promo._id} className={`promo-code-card ${!promo.isActive ? 'inactive' : ''}`}>
              <div className="promo-card-header">
                <div className="promo-card-code">
                  <span className="code-text">{promo.code}</span>
                </div>
                <span className={`status-badge ${promo.isActive ? 'active' : 'inactive'}`}>
                  {promo.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
              </div>

              <h3 className="promo-card-name">{promo.name}</h3>
              <p className="promo-card-description">{promo.description}</p>

              <div className="promo-card-details">
                <div className="detail-item">
                  <span className="detail-label">Giảm giá:</span>
                  <span className="detail-value discount">
                    {promo.discountType === 'percentage' 
                      ? `-${promo.discountValue}%` 
                      : `-${promo.discountValue.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Đơn tối thiểu:</span>
                  <span className="detail-value">
                    {promo.minOrderAmount?.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Đã dùng:</span>
                  <span className="detail-value">
                    {promo.usedCount}/{promo.usageLimit || '∞'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Hết hạn:</span>
                  <span className="detail-value">
                    {promo.validUntil ? new Date(promo.validUntil).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                  </span>
                </div>
              </div>

              <div className="promo-card-actions">
                <button 
                  className="btn-action edit" 
                  onClick={() => handleEdit(promo)}
                  title="Chỉnh sửa"
                >
                  <span>✏️</span>
                  <span>Sửa</span>
                </button>
                <button 
                  className="btn-action toggle" 
                  onClick={() => handleToggleActive(promo._id)}
                  title={promo.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                >
                  <span>{promo.isActive ? '⏸️' : '▶️'}</span>
                  <span>{promo.isActive ? 'Tạm dừng' : 'Kích hoạt'}</span>
                </button>
                <button 
                  className="btn-action delete" 
                  onClick={() => handleDelete(promo._id)}
                  title="Xóa"
                >
                  <span>🗑️</span>
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="promo-modal-overlay" onClick={(e) => {
          if (e.target.classList.contains('promo-modal-overlay')) handleCloseModal();
        }}>
          <div className="promo-modal">
            <div className="promo-modal-header">
              <h2>{editingPromo ? 'Chỉnh sửa mã' : 'Tạo mã mới'}</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="promo-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Mã giảm giá <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="VD: SUMMER2025"
                    required
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="form-group">
                  <label>Tên mã <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="VD: Ưu đãi mùa hè"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả ngắn về mã giảm giá"
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loại giảm giá <span className="required">*</span></label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Giá trị giảm <span className="required">*</span></label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    placeholder={formData.discountType === 'percentage' ? 'VD: 20' : 'VD: 50000'}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Đơn hàng tối thiểu (đ)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    placeholder="VD: 500000"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Giảm tối đa (đ)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    placeholder="VD: 200000"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số lần sử dụng tối đa</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="Để trống = không giới hạn"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Hết hạn</label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Điều kiện áp dụng</label>
                <textarea
                  name="conditions"
                  value={formData.conditions}
                  onChange={handleInputChange}
                  placeholder="VD: Áp dụng cho khách hàng mới, Đặt trước 5 ngày..."
                  rows="3"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>Kích hoạt ngay</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {editingPromo ? 'Cập nhật' : 'Tạo mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPromoCodes;
