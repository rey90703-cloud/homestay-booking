import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    accountStatus: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'guest',
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.role && { role: filters.role }),
        ...(filters.accountStatus && { accountStatus: filters.accountStatus }),
        ...(filters.search && { search: filters.search }),
      });

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
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
        setUsers(data.data || []);
        if (data.metadata?.pagination) {
          setPagination({
            currentPage: data.metadata.pagination.page,
            totalPages: data.metadata.pagination.pages,
            totalUsers: data.metadata.pagination.total,
            limit: data.metadata.pagination.limit,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      email: '',
      password: '',
      role: 'guest',
      firstName: '',
      lastName: '',
      phone: '',
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      phone: user.profile?.phone || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      email: '',
      password: '',
      role: 'guest',
      firstName: '',
      lastName: '',
      phone: '',
    });
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      email: formData.email,
      role: formData.role,
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      },
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (modalMode === 'create') {
        const response = await fetch('${API_BASE_URL}/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
          alert('Tạo người dùng thành công!');
          fetchUsers();
          closeModal();
        } else {
          alert(data.error?.message || 'Có lỗi xảy ra');
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/users/${selectedUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
          alert('Cập nhật người dùng thành công!');
          fetchUsers();
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

  const handleDelete = async (userId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Xóa người dùng thành công!');
        fetchUsers();
      } else {
        alert(data.error?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Có lỗi xảy ra khi xóa người dùng');
    }
  };

  const sortUsers = (usersToSort) => {
    return [...usersToSort].sort((a, b) => {
      let aVal, bVal;

      switch (filters.sortBy) {
        case 'createdAt':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'role':
          aVal = a.role;
          bVal = b.role;
          break;
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  };

  const sortedUsers = sortUsers(users);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: 'badge-admin',
      host: 'badge-host',
      guest: 'badge-guest',
    };
    return classes[role] || 'badge-guest';
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      active: 'badge-success',
      suspended: 'badge-warning',
      deleted: 'badge-danger',
    };
    return classes[status] || 'badge-success';
  };

  return (
    <div className="admin-users">
      <div className="admin-header">
        <div className="header-top">
          <h1>Quản lý người dùng</h1>
          <button className="btn-add" onClick={openCreateModal}>
            + Thêm người dùng mới
          </button>
        </div>
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-label">Tổng số người dùng</span>
            <span className="stat-value">{pagination.totalUsers}</span>
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
              placeholder="Email hoặc tên..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Vai trò</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="guest">Khách</option>
              <option value="host">Chủ nhà</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trạng thái</label>
            <select
              value={filters.accountStatus}
              onChange={(e) => handleFilterChange('accountStatus', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Tạm khóa</option>
              <option value="deleted">Đã xóa</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sắp xếp theo</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="createdAt">Ngày đăng ký</option>
              <option value="email">Email</option>
              <option value="role">Vai trò</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Thứ tự</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="filter-select"
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Họ tên</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>{user.fullName || user.profile?.firstName || 'N/A'}</td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'host' ? 'Chủ nhà' : 'Khách'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(user.accountStatus)}`}>
                      {user.accountStatus === 'active'
                        ? 'Hoạt động'
                        : user.accountStatus === 'suspended'
                        ? 'Tạm khóa'
                        : 'Đã xóa'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-primary"
                        onClick={() => openEditModal(user)}
                      >
                        Sửa
                      </button>
                      {user.accountStatus === 'active' ? (
                        <button
                          className="btn-action btn-warning"
                          onClick={() => handleStatusChange(user._id, 'suspended')}
                        >
                          Khóa
                        </button>
                      ) : (
                        <button
                          className="btn-action btn-success"
                          onClick={() => handleStatusChange(user._id, 'active')}
                        >
                          Mở khóa
                        </button>
                      )}
                      <button
                        className="btn-action btn-danger"
                        onClick={() => handleDelete(user._id)}
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
              <h2>{modalMode === 'create' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    disabled={modalMode === 'edit'}
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label>Vai trò *</label>
                  <select name="role" value={formData.role} onChange={handleFormChange} required>
                    <option value="guest">Khách</option>
                    <option value="host">Chủ nhà</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Họ *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label>Tên *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu {modalMode === 'create' ? '*' : '(để trống nếu không đổi)'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required={modalMode === 'create'}
                  minLength={8}
                  autoComplete="new-password"
                />
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

export default AdminUsers;
