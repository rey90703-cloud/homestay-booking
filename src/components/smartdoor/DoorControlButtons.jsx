import React, { useState } from 'react';
import './DoorControlButtons.css';

// SVG Icons
const IconDoorOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4h3a2 2 0 0 1 2 2v14" />
    <path d="M2 20h3" />
    <path d="M13 20h9" />
    <path d="M10 12v.01" />
    <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" />
  </svg>
);

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

/**
 * DoorControlButtons Component
 * Buttons điều khiển cửa với confirmation dialog
 */
const DoorControlButtons = ({ onOpenDoor, onCloseDoor, disabled, isOnline }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenClick = () => {
    setConfirmAction('open');
    setShowConfirm(true);
    setError(null);
  };

  const handleCloseClick = () => {
    setConfirmAction('close');
    setShowConfirm(true);
    setError(null);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (confirmAction === 'open') {
        result = await onOpenDoor();
      } else if (confirmAction === 'close') {
        result = await onCloseDoor();
      }

      if (result && !result.success) {
        setError(result.message || 'Có lỗi xảy ra');
      } else {
        setShowConfirm(false);
        setConfirmAction(null);
      }
    } catch (err) {
      console.error('Error controlling door:', err);
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setConfirmAction(null);
    setError(null);
  };

  const getConfirmMessage = () => {
    if (confirmAction === 'open') {
      return {
        title: 'Xác nhận mở cửa',
        message: 'Bạn có chắc chắn muốn mở cửa không?',
        icon: <IconDoorOpen />,
        confirmText: 'Mở cửa',
        confirmClass: 'btn-confirm-open'
      };
    } else if (confirmAction === 'close') {
      return {
        title: 'Xác nhận khóa cửa',
        message: 'Bạn có chắc chắn muốn khóa cửa không?',
        icon: <IconLock />,
        confirmText: 'Khóa cửa',
        confirmClass: 'btn-confirm-close'
      };
    }
    return {};
  };

  const confirmInfo = getConfirmMessage();

  return (
    <>
      <div className="door-control-buttons">
        <button
          className="btn-control btn-open"
          onClick={handleOpenClick}
          disabled={disabled || !isOnline || loading}
          title={!isOnline ? 'Thiết bị offline' : 'Mở cửa'}
        >
          <span className="btn-icon"><IconDoorOpen /></span>
          <span className="btn-text">Mở cửa</span>
        </button>

        <button
          className="btn-control btn-close"
          onClick={handleCloseClick}
          disabled={disabled || !isOnline || loading}
          title={!isOnline ? 'Thiết bị offline' : 'Khóa cửa'}
        >
          <span className="btn-icon"><IconLock /></span>
          <span className="btn-text">Khóa cửa</span>
        </button>
      </div>

      {!isOnline && (
        <div className="control-warning">
          <IconWarning />
          <span>Thiết bị đang offline. Không thể điều khiển cửa.</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={handleCancel}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">{confirmInfo.icon}</div>
            <h3 className="confirm-title">{confirmInfo.title}</h3>
            <p className="confirm-message">{confirmInfo.message}</p>

            {error && (
              <div className="confirm-error">
                <IconWarning />
                <span>{error}</span>
              </div>
            )}

            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                className={`btn-confirm ${confirmInfo.confirmClass}`}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  confirmInfo.confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoorControlButtons;
