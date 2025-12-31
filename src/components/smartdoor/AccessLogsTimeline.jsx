import React, { useState } from 'react';
import './AccessLogsTimeline.css';

// SVG Icons
const IconRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconKey = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/**
 * AccessLogsTimeline Component
 * Hiển thị lịch sử truy cập dạng timeline với filter và pagination
 */
const AccessLogsTimeline = ({ logs, onRefresh, loading }) => {
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Filter logs by date
  const filteredLogs = filterDate
    ? logs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === filterDate;
      })
    : logs;

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (e) => {
    setFilterDate(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterDate('');
    setCurrentPage(1);
  };

  const getUserIcon = (user) => {
    switch (user) {
      case 'Admin':
        return <IconUser />;
      case 'Guest':
        return <IconKey />;
      case 'Chủ nhà':
        return <IconHome />;
      default:
        return <IconUser />;
    }
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'KEYPAD':
        return { text: 'Bàn phím', className: 'method-keypad' };
      case 'WEB':
        return { text: 'Web', className: 'method-web' };
      default:
        return { text: method, className: 'method-default' };
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Vừa xong';
    } else if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="access-logs-timeline">
        <div className="timeline-header">
          <h4>Lịch sử truy cập</h4>
        </div>
        <div className="timeline-loading">
          <div className="spinner"></div>
          <p>Đang tải lịch sử...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="access-logs-timeline">
      <div className="timeline-header">
        <h4>Lịch sử truy cập</h4>
        <button className="btn-refresh" onClick={onRefresh} title="Làm mới">
          <IconRefresh />
        </button>
      </div>

      <div className="timeline-filter">
        <div className="filter-input-group">
          <input
            type="date"
            className="filter-date-input"
            value={filterDate}
            onChange={handleFilterChange}
            placeholder="Lọc theo ngày"
          />
          {filterDate && (
            <button className="btn-clear-filter" onClick={handleClearFilter}>
              <IconClose />
            </button>
          )}
        </div>
        <div className="filter-info">
          {filteredLogs.length} kết quả
        </div>
      </div>

      {currentLogs.length === 0 ? (
        <div className="timeline-empty">
          <div className="empty-icon">
            <IconEmpty />
          </div>
          <p>Chưa có lịch sử truy cập</p>
        </div>
      ) : (
        <>
          <div className="timeline-list">
            {currentLogs.map((log, index) => {
              const methodBadge = getMethodBadge(log.method);
              return (
                <div key={log._id || index} className="timeline-item">
                  <div className="timeline-marker">
                    <span className="marker-icon">{getUserIcon(log.user)}</span>
                  </div>
                  <div className="timeline-content">
                    <div className="log-header">
                      <div className="log-user">
                        <span className="user-name">{log.user}</span>
                        <span className={`method-badge ${methodBadge.className}`}>
                          {methodBadge.text}
                        </span>
                      </div>
                      <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <div className="log-details">
                      <span className="log-action">Đã mở cửa</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="timeline-pagination">
              <button
                className="btn-page"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹ Trước
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`btn-page-number ${page === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="btn-page"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccessLogsTimeline;
