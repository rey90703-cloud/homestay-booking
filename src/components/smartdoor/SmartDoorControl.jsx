import React from 'react';
import useSmartDoor from '../../hooks/useSmartDoor';
import DoorStatusDisplay from './DoorStatusDisplay';
import GuestPasswordDisplay from './GuestPasswordDisplay';
import DoorControlButtons from './DoorControlButtons';
import DurationAdjustment from './DurationAdjustment';
import AccessLogsTimeline from './AccessLogsTimeline';
import './SmartDoorControl.css';

// SVG Icons
const IconSmartDoor = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="M9 12h6" />
    <path d="M12 9v6" />
  </svg>
);

const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const IconBan = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
  </svg>
);

/**
 * SmartDoorControl Component
 * Component chính quản lý toàn bộ smart door access control
 */
const SmartDoorControl = ({ bookingId, onDisableAccess }) => {
  const {
    accessInfo,
    accessLogs,
    loading,
    error,
    isConnected,
    openDoor,
    closeDoor,
    setDuration,
    fetchAccessLogs,
  } = useSmartDoor(bookingId);

  // Extract data từ accessInfo
  const doorStatus = accessInfo?.mqtt || {};
  const guestPassword = accessInfo?.password || {};
  const mqttConnected = isConnected;
  const isDeviceOnline = accessInfo?.isOnline ?? false;

  if (loading) {
    return (
      <div className="smart-door-control">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải thông tin điều khiển cửa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="smart-door-control">
        <div className="error-state">
          <div className="error-icon">
            <IconWarning />
          </div>
          <h4>Không thể tải thông tin điều khiển</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-door-control">
      <div className="control-header">
        <h3>
          <IconSmartDoor />
          <span>Điều khiển cửa thông minh</span>
        </h3>
        <div className={`mqtt-status ${mqttConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {mqttConnected ? 'Đã kết nối' : 'Mất kết nối'}
          </span>
        </div>
      </div>

      <div className="control-grid">
        {/* Left Column - Status & Controls */}
        <div className="control-left">
          {/* Door Status */}
          <DoorStatusDisplay 
            status={doorStatus.status}
            lastUpdate={doorStatus.lastUpdate}
            isOnline={isDeviceOnline}
          />

          {/* Guest Password */}
          <GuestPasswordDisplay 
            password={guestPassword.password}
            expiresAt={guestPassword.expiresAt}
            isActive={guestPassword.isActive}
          />

          {/* Door Control Buttons */}
          <DoorControlButtons
            onOpenDoor={openDoor}
            onCloseDoor={closeDoor}
            loading={loading.control}
            disabled={!mqttConnected}
            isOnline={isDeviceOnline}
          />

          {/* Duration Adjustment */}
          <DurationAdjustment
            currentDuration={guestPassword.duration}
            onSetDuration={setDuration}
            loading={loading.duration}
            disabled={!mqttConnected}
          />

          {/* Disable Access Button */}
          {onDisableAccess && (
            <div className="disable-access-section">
              <button
                className="btn-disable-access"
                onClick={onDisableAccess}
                disabled={loading.control}
              >
                <IconBan />
                <span>Vô hiệu hóa mật khẩu</span>
              </button>
              <p className="disable-access-note">
                Sử dụng khi cần hủy quyền truy cập của khách (ví dụ: hủy booking)
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Access Logs */}
        <div className="control-right">
          <AccessLogsTimeline
            logs={accessLogs}
            onRefresh={fetchAccessLogs}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default SmartDoorControl;
