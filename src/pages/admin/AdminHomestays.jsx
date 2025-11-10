import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';
import './AdminHomestays.css';

const AdminHomestays = () => {
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    verificationStatus: '',
    search: '',
    city: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalHomestays: 0,
    limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedHomestay, setSelectedHomestay] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    address: '',
    basePrice: '',
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    coverImage: null,
    images: [],
  });
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [imagesPreview, setImagesPreview] = useState([]);

  useEffect(() => {
    fetchHomestays();
  }, [filters, pagination.currentPage]);

  const fetchHomestays = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.verificationStatus && {
          verificationStatus: filters.verificationStatus,
        }),
        ...(filters.search && { search: filters.search }),
        ...(filters.city && { city: filters.city }),
      });

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/homestays?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setHomestays(data.data || []);
        if (data.meta?.pagination) {
          setPagination(data.meta.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching homestays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleApprove = async (homestayId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/homestays/${homestayId}/approve`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        fetchHomestays();
      }
    } catch (error) {
      console.error('Error approving homestay:', error);
    }
  };

  const handleReject = async (homestayId) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/homestays/${homestayId}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ rejectionReason: reason }),
        },
      );

      const data = await response.json();
      if (data.success) {
        fetchHomestays();
      }
    } catch (error) {
      console.error('Error rejecting homestay:', error);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      title: '',
      description: '',
      city: '',
      address: '',
      basePrice: '',
      maxGuests: '',
      bedrooms: '',
      bathrooms: '',
      coverImage: null,
      images: [],
    });
    setCoverImagePreview('');
    setImagesPreview([]);
    setShowModal(true);
  };

  const openEditModal = (homestay) => {
    setModalMode('edit');
    setSelectedHomestay(homestay);
    setFormData({
      title: homestay.title || '',
      description: homestay.description || '',
      city: homestay.location?.city || '',
      address: homestay.location?.address || '',
      basePrice: homestay.pricing?.basePrice || '',
      maxGuests: homestay.capacity?.maxGuests || '',
      bedrooms: homestay.capacity?.bedrooms || '',
      bathrooms: homestay.capacity?.bathrooms || '',
      coverImage: null,
      images: [],
    });
    setCoverImagePreview(homestay.coverImage || '');
    setImagesPreview(homestay.images || []);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedHomestay(null);
    setFormData({
      title: '',
      description: '',
      city: '',
      address: '',
      basePrice: '',
      maxGuests: '',
      bedrooms: '',
      bathrooms: '',
      coverImage: null,
      images: [],
    });
    setCoverImagePreview('');
    setImagesPreview([]);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, coverImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData({ ...formData, images: files });
      const previews = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result);
          if (previews.length === files.length) {
            setImagesPreview(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('location[city]', formData.city);
    formDataToSend.append('location[address]', formData.address);
    formDataToSend.append('location[country]', 'Vietnam');
    formDataToSend.append('pricing[basePrice]', formData.basePrice);
    formDataToSend.append('capacity[maxGuests]', formData.maxGuests);
    formDataToSend.append('capacity[bedrooms]', formData.bedrooms);
    formDataToSend.append('capacity[bathrooms]', formData.bathrooms);

    if (formData.coverImage) {
      formDataToSend.append('coverImage', formData.coverImage);
    }

    if (formData.images && formData.images.length > 0) {
      formData.images.forEach((image) => {
        formDataToSend.append('images', image);
      });
    }

    try {
      if (modalMode === 'create') {
        const response = await fetch('${API_BASE_URL}/homestays', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formDataToSend,
        });

        const data = await response.json();
        if (data.success) {
          alert('Tạo homestay thành công!');
          fetchHomestays();
          closeModal();
        } else {
          alert(data.error?.message || 'Có lỗi xảy ra');
        }
      } else {
        const response = await fetch(
          `${API_BASE_URL}/homestays/${selectedHomestay._id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: formDataToSend,
          },
        );

        const data = await response.json();
        if (data.success) {
          alert('Cập nhật homestay thành công!');
          fetchHomestays();
          closeModal();
        } else {
          alert(data.error?.message || 'Có lỗi xảy ra');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleDelete = async (homestayId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa homestay này?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/homestays/${homestayId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Xóa homestay thành công!');
        fetchHomestays();
      } else {
        alert(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting homestay:', error);
      alert('Có lỗi xảy ra khi xóa homestay');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      draft: 'badge-secondary',
      pending: 'badge-warning',
      active: 'badge-success',
      suspended: 'badge-danger',
      deleted: 'badge-dark',
    };
    return classes[status] || 'badge-secondary';
  };

  const getVerificationBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return classes[status] || 'badge-warning';
  };

  return (
    <div className="admin-homestays">
      <div className="admin-header">
        <div className="header-top">
          <h1>Quản lý Homestay</h1>
          <button className="btn-add" onClick={openCreateModal}>
            + Thêm homestay mới
          </button>
        </div>
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-label">Tổng số homestay</span>
            <span className="stat-value">{pagination.totalHomestays}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tiêu đề hoặc địa điểm..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="pending">Chờ duyệt</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Tạm ngừng</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Xác minh</label>
            <select
              value={filters.verificationStatus}
              onChange={(e) => handleFilterChange('verificationStatus', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ xác minh</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>
      </div>

      {/* Homestays Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Tiêu đề</th>
                <th>Địa điểm</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Xác minh</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {homestays.map((homestay) => (
                <tr key={homestay._id}>
                  <td>
                    <img
                      src={homestay.coverImage || '/placeholder.jpg'}
                      alt={homestay.title}
                      className="homestay-thumbnail"
                    />
                  </td>
                  <td className="homestay-title">{homestay.title}</td>
                  <td>
                    {homestay.location.city}, {homestay.location.country}
                  </td>
                  <td>{formatPrice(homestay.pricing.basePrice)}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(homestay.status)}`}>
                      {homestay.status === 'draft'
                        ? 'Nháp'
                        : homestay.status === 'pending'
                        ? 'Chờ duyệt'
                        : homestay.status === 'active'
                        ? 'Hoạt động'
                        : homestay.status === 'suspended'
                        ? 'Tạm ngừng'
                        : 'Đã xóa'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${getVerificationBadgeClass(
                        homestay.verificationStatus,
                      )}`}
                    >
                      {homestay.verificationStatus === 'pending'
                        ? 'Chờ xác minh'
                        : homestay.verificationStatus === 'approved'
                        ? 'Đã duyệt'
                        : 'Từ chối'}
                    </span>
                  </td>
                  <td>{formatDate(homestay.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      {homestay.verificationStatus === 'pending' && (
                        <>
                          <button
                            className="btn-action btn-success"
                            onClick={() => handleApprove(homestay._id)}
                          >
                            Duyệt
                          </button>
                          <button
                            className="btn-action btn-danger"
                            onClick={() => handleReject(homestay._id)}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      <button
                        className="btn-action btn-primary"
                        onClick={() => openEditModal(homestay)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-action btn-danger"
                        onClick={() => handleDelete(homestay._id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="pagination-btn"
          disabled={pagination.currentPage === 1}
          onClick={() =>
            setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
          }
        >
          Trước
        </button>
        <span className="pagination-info">
          Trang {pagination.currentPage} / {pagination.totalPages}
        </span>
        <button
          className="pagination-btn"
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() =>
            setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
          }
        >
          Sau
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Thêm homestay mới' : 'Chỉnh sửa homestay'}</h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thành phố *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Chọn thành phố</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Lào Cai">Lào Cai</option>
                    <option value="Hạ Long">Hạ Long</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Nha Trang">Nha Trang</option>
                    <option value="Đà Lạt">Đà Lạt</option>
                    <option value="TP.HCM">TP.HCM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Giá (VNĐ/đêm) *</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleFormChange}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Địa chỉ *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số khách *</label>
                  <input
                    type="number"
                    name="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleFormChange}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Phòng ngủ *</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleFormChange}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Phòng tắm *</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleFormChange}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Ảnh bìa *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  required={modalMode === 'create'}
                />
                {coverImagePreview && (
                  <div className="image-preview">
                    <img src={coverImagePreview} alt="Cover preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Ảnh phụ (có thể chọn nhiều ảnh)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                />
                {imagesPreview.length > 0 && (
                  <div className="images-preview-grid">
                    {imagesPreview.map((preview, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomestays;
