import { useMemo } from 'react';
import PropTypes from 'prop-types';
import './MessageItem.css';

/**
 * MessageItem Component
 * 
 * Displays individual message with content, timestamp, and read status
 * Requirements: 5.3, 5.4, 5.5, 10.1
 * 
 * Properties validated:
 * - Property 23: Message hiển thị đầy đủ thông tin
 * - Property 24: Same-day message time format
 * - Property 25: Older message time format
 */
const MessageItem = ({ 
  message, 
  currentUserId, 
  showSenderName = false,
  senderName = null,
  onRetry = null
}) => {
  // Handle senderId being either string or object (populated)
  const messageSenderId = typeof message.senderId === 'object' && message.senderId !== null
    ? (message.senderId._id || message.senderId.id)
    : message.senderId;
    
  const isOwnMessage = messageSenderId === currentUserId;
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';
  const isQueued = message.status === 'queued';

  // Format message time based on date
  // Property 24 & 25: Time formatting
  const formattedTime = useMemo(() => {
    if (!message.createdAt) return '';
    
    const messageDate = new Date(message.createdAt);
    const today = new Date();
    const isToday = messageDate.toDateString() === today.toDateString();

    if (isToday) {
      // Same-day format: HH:mm (Property 24)
      return messageDate.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Older format: DD/MM/YYYY HH:mm (Property 25)
      return messageDate.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, [message.createdAt]);

  // Check if message has been read
  const isRead = useMemo(() => {
    if (!isOwnMessage || !message.readBy) return false;
    return message.readBy.some(read => read.userId !== currentUserId);
  }, [message.readBy, currentUserId, isOwnMessage]);

  return (
    <div 
      className={`message-item ${isOwnMessage ? 'message-own' : 'message-other'}`}
      data-testid="message-item"
      data-message-id={message._id}
      data-sender-id={message.senderId}
    >
      {/* Sender name for group chats (future feature) */}
      {showSenderName && !isOwnMessage && senderName && (
        <div className="message-sender-name" data-testid="message-sender-name">
          {senderName}
        </div>
      )}

      <div className={`message-bubble ${isFailed ? 'message-failed' : ''} ${isSending ? 'message-sending' : ''} ${isQueued ? 'message-queued' : ''}`}>
        {/* Message content - Property 23 */}
        <p className="message-content" data-testid="message-content">
          {message.content}
        </p>

        {/* Message metadata */}
        <div className="message-meta">
          {/* Timestamp - Property 24 & 25 */}
          <span className="message-time" data-testid="message-time">
            {formattedTime}
          </span>

          {/* Status indicators */}
          {isSending && (
            <span className="message-status" data-testid="message-status">
              Đang gửi...
            </span>
          )}
          
          {isQueued && (
            <span className="message-status" data-testid="message-status">
              Đang chờ
            </span>
          )}

          {/* Failed status with retry button - Requirement 10.1 */}
          {isFailed && isOwnMessage && (
            <div className="message-failed-actions">
              <span className="message-status message-status--error" data-testid="message-status">
                Gửi thất bại
              </span>
              {onRetry && (
                <button 
                  className="message-retry-btn"
                  onClick={() => onRetry(message._id)}
                  data-testid="message-retry-btn"
                  aria-label="Thử lại"
                >
                  Thử lại
                </button>
              )}
            </div>
          )}

          {/* Read status for own messages */}
          {isOwnMessage && !isFailed && !isSending && !isQueued && (
            <span 
              className={`message-read-status ${isRead ? 'read' : 'unread'}`}
              data-testid="message-read-status"
            >
              {isRead ? 'Đã xem' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    senderId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ]).isRequired,
    type: PropTypes.string,
    status: PropTypes.oneOf(['sending', 'sent', 'failed', 'queued']),
    readBy: PropTypes.arrayOf(
      PropTypes.shape({
        userId: PropTypes.string,
        readAt: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.instanceOf(Date)
        ])
      })
    )
  }).isRequired,
  currentUserId: PropTypes.string.isRequired,
  showSenderName: PropTypes.bool,
  senderName: PropTypes.string,
  onRetry: PropTypes.func
};

export default MessageItem;
