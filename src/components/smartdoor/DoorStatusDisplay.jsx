import React from 'react';
import './DoorStatusDisplay.css';

// SVG Icons
const IconDoorOpen = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4h3a2 2 0 0 1 2 2v14" />
    <path d="M2 20h3" />
    <path d="M13 20h9" />
    <path d="M10 12v.01" />
    <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" />
  </svg>
);

const IconDoorLocked = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1" />
  </svg>
);

const IconOffline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" x2="22" y1="2" y2="22" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
    <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
    <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
    <path d="M5 13a10 10 0 0 1 5.24-2.76" />
    <line x1="12" x2="12.01" y1="20" y2="20" />
  </svg>
);

const IconUnknown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

/**
 * DoorStatusDisplay Component
 * Hiển thị trạng thái cửa với SVG icon
 */
const DoorStatusDisplay = ({ status, isOnline }) => {
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <IconOffline />,
        text: 'Thiết bị offline',
        className: 'offline',
        description: 'Không thể kết nối với thiết bị'
      };
    }

    switch (status) {
      case 'OPEN':
        return {
          icon: <IconDoorOpen />,
          text: 'Cửa đang mở',
          className: 'open',
          description: 'Cửa hiện đang ở trạng thái mở'
        };
      case 'LOCKED':
        return {
          icon: <IconDoorLocked />,
          text: 'Cửa đã khóa',
          className: 'locked',
          description: 'Cửa hiện đang ở trạng thái khóa'
        };
      default:
        return {
          icon: <IconUnknown />,
          text: 'Không xác định',
          className: 'unknown',
          description: 'Không thể xác định trạng thái cửa'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`door-status-display ${statusInfo.className}`}>
      <div className="status-icon-wrapper">
        <span className="status-icon">{statusInfo.icon}</span>
        {isOnline && <span className="status-pulse"></span>}
      </div>
      <div className="status-content">
        <h4 className="status-text">{statusInfo.text}</h4>
        <p className="status-description">{statusInfo.description}</p>
      </div>
    </div>
  );
};

export default DoorStatusDisplay;
