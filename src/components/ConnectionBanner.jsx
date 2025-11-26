import React from 'react';
import './ConnectionBanner.css';

const ConnectionBanner = ({ isReconnecting, isOnline, error }) => {
  if (!isReconnecting && isOnline && !error) {
    return null;
  }

  let message = '';
  let className = 'connection-banner';

  if (!isOnline) {
    message = 'Không có kết nối mạng';
    className += ' connection-banner--offline';
  } else if (isReconnecting) {
    message = 'Đang kết nối lại...';
    className += ' connection-banner--reconnecting';
  } else if (error) {
    message = error;
    className += ' connection-banner--error';
  }

  return (
    <div className={className}>
      <div className="connection-banner__content">
        {isReconnecting && (
          <div className="connection-banner__spinner"></div>
        )}
        <span className="connection-banner__message">{message}</span>
      </div>
    </div>
  );
};

export default ConnectionBanner;
