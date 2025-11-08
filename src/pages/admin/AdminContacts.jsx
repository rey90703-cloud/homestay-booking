import React, { useState, useEffect } from 'react';
import './AdminContacts.css';

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalContacts: 0,
    limit: 20,
  });

  useEffect(() => {
    fetchContacts();
  }, [filters, pagination.currentPage]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`http://localhost:5000/api/v1/contacts?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setContacts(data.data || []);
        if (data.meta?.pagination) {
          setPagination(data.meta.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleViewContact = async (contact) => {
    setSelectedContact(contact);
    if (contact.status === 'new') {
      await markAsRead(contact._id);
    }
  };

  const markAsRead = async (contactId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/contacts/${contactId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      alert('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/contacts/${selectedContact._id}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ message: replyMessage }),
        },
      );

      const data = await response.json();
      if (data.success) {
        alert('Đã gửi phản hồi thành công!');
        setReplyMessage('');
        setSelectedContact(null);
        fetchContacts();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Có lỗi xảy ra khi gửi phản hồi!');
    }
  };

  const handleStatusChange = async (contactId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/contacts/${contactId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchContacts();
        if (selectedContact && selectedContact._id === contactId) {
          setSelectedContact(null);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      new: 'badge-primary',
      read: 'badge-info',
      replied: 'badge-success',
      closed: 'badge-secondary',
    };
    return classes[status] || 'badge-primary';
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      low: 'badge-secondary',
      medium: 'badge-info',
      high: 'badge-warning',
      urgent: 'badge-danger',
    };
    return classes[priority] || 'badge-info';
  };

  return (
    <div className="admin-contacts">
      <div className="admin-header">
        <h1>Quản lý Liên hệ</h1>
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-label">Tổng số liên hệ</span>
            <span className="stat-value">{pagination.totalContacts}</span>
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
              placeholder="Tên, email hoặc chủ đề..."
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
              <option value="new">Mới</option>
              <option value="read">Đã đọc</option>
              <option value="replied">Đã phản hồi</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Độ ưu tiên</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Danh mục</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="general">Chung</option>
              <option value="booking">Đặt phòng</option>
              <option value="payment">Thanh toán</option>
              <option value="technical">Kỹ thuật</option>
              <option value="feedback">Góp ý</option>
              <option value="complaint">Khiếu nại</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts Layout */}
      <div className="contacts-layout">
        {/* Contacts List */}
        <div className="contacts-list">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="contacts-table">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className={`contact-item ${
                    selectedContact?._id === contact._id ? 'active' : ''
                  } ${contact.status === 'new' ? 'unread' : ''}`}
                  onClick={() => handleViewContact(contact)}
                >
                  <div className="contact-header">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-date">{formatDate(contact.createdAt)}</span>
                  </div>
                  <div className="contact-subject">{contact.subject}</div>
                  <div className="contact-badges">
                    <span className={`badge ${getStatusBadgeClass(contact.status)}`}>
                      {contact.status === 'new'
                        ? 'Mới'
                        : contact.status === 'read'
                        ? 'Đã đọc'
                        : contact.status === 'replied'
                        ? 'Đã phản hồi'
                        : 'Đã đóng'}
                    </span>
                    <span className={`badge ${getPriorityBadgeClass(contact.priority)}`}>
                      {contact.priority === 'low'
                        ? 'Thấp'
                        : contact.priority === 'medium'
                        ? 'TB'
                        : contact.priority === 'high'
                        ? 'Cao'
                        : 'Khẩn'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

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

        {/* Contact Detail */}
        <div className="contact-detail">
          {selectedContact ? (
            <>
              <div className="detail-header">
                <h2>{selectedContact.subject}</h2>
                <div className="detail-actions">
                  <button
                    className="btn-action btn-success"
                    onClick={() => handleStatusChange(selectedContact._id, 'closed')}
                  >
                    Đóng
                  </button>
                </div>
              </div>

              <div className="detail-info">
                <div className="info-row">
                  <span className="info-label">Từ:</span>
                  <span className="info-value">
                    {selectedContact.name} ({selectedContact.email})
                  </span>
                </div>
                {selectedContact.phone && (
                  <div className="info-row">
                    <span className="info-label">Điện thoại:</span>
                    <span className="info-value">{selectedContact.phone}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Ngày gửi:</span>
                  <span className="info-value">{formatDate(selectedContact.createdAt)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Trạng thái:</span>
                  <span className={`badge ${getStatusBadgeClass(selectedContact.status)}`}>
                    {selectedContact.status === 'new'
                      ? 'Mới'
                      : selectedContact.status === 'read'
                      ? 'Đã đọc'
                      : selectedContact.status === 'replied'
                      ? 'Đã phản hồi'
                      : 'Đã đóng'}
                  </span>
                </div>
              </div>

              <div className="detail-message">
                <h3>Nội dung tin nhắn:</h3>
                <p>{selectedContact.message}</p>
              </div>

              {selectedContact.reply && (
                <div className="detail-reply">
                  <h3>Phản hồi đã gửi:</h3>
                  <p>{selectedContact.reply.message}</p>
                  <span className="reply-info">
                    Phản hồi lúc: {formatDate(selectedContact.reply.repliedAt)}
                  </span>
                </div>
              )}

              {!selectedContact.reply && selectedContact.status !== 'closed' && (
                <div className="reply-section">
                  <h3>Gửi phản hồi:</h3>
                  <textarea
                    className="reply-textarea"
                    placeholder="Nhập nội dung phản hồi..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows="6"
                  />
                  <button className="btn-submit" onClick={handleReply}>
                    Gửi phản hồi
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>Chọn một liên hệ để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContacts;
