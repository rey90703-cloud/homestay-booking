import React, { useState, useEffect } from 'react';
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

      const response = await fetch(`http://localhost:5000/api/v1/homestays?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

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
        `http://localhost:5000/api/v1/admin/homestays/${homestayId}/approve`,
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
        `http://localhost:5000/api/v1/admin/homestays/${homestayId}/reject`,
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
        <h1>Quản lý Homestay</h1>
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
                      <button className="btn-action btn-info">Xem</button>
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
    </div>
  );
};

export default AdminHomestays;
