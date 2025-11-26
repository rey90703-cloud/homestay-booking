import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import ConnectionBanner from './ConnectionBanner';
import './ChatWindow.css';

/**
 * ChatWindow Component
 * 
 * Container for conversation view with header, message list, and input
 * Requirements: 8.5
 */
const ChatWindow = ({ onBack }) => {
  const { user } = useAuth();
  const {
    activeChatRoom,
    messages,
    loading,
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage,
    retryMessage,
    loadMessages,
    hasMoreMessages,
    messagesPage,
    isReconnecting,
    isOnline,
    error
  } = useChat();

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Get other participant from chatroom
  const getOtherParticipant = () => {
    if (!activeChatRoom || !user) return null;
    
    const currentUserId = user._id || user.id;
    
    return activeChatRoom.participants?.find(p => {
      // userId có thể là string hoặc object (đã populate)
      const participantId = typeof p.userId === 'object' ? p.userId._id : p.userId;
      return participantId !== currentUserId;
    });
  };

  // Get participant name - hiển thị tên người còn lại (không phải current user)
  const getParticipantName = () => {
    const otherParticipant = getOtherParticipant();
    
    if (!otherParticipant) {
      return 'User';
    }
    
    // Ưu tiên lấy tên từ userId đã được populate
    if (otherParticipant.userId?.fullName) {
      return otherParticipant.userId.fullName;
    }
    
    // Lấy từ profile.firstName + profile.lastName
    if (otherParticipant.userId?.profile) {
      const { firstName, lastName } = otherParticipant.userId.profile;
      if (firstName || lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim();
      }
    }
    
    // Fallback về name/fullName trực tiếp trong participant object
    if (otherParticipant.fullName || otherParticipant.name) {
      return otherParticipant.fullName || otherParticipant.name;
    }
    
    // Fallback cuối cùng dựa vào role
    if (otherParticipant.role === 'host') {
      return activeChatRoom?.metadata?.hostName || 'Host';
    }
    
    return 'Guest';
  };

  // Check if participant is online
  const isParticipantOnline = () => {
    const otherParticipant = getOtherParticipant();
    if (!otherParticipant) return false;
    return onlineUsers?.has(otherParticipant.userId) || false;
  };

  // Format last seen time
  const formatLastSeen = (lastSeenAt) => {
    if (!lastSeenAt) return 'Offline';
    
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format message time
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!activeChatRoom) {
    return (
      <div className="chat-window-empty">
        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
      </div>
    );
  }

  const participantOnline = isParticipantOnline();
  const otherParticipant = getOtherParticipant();
  const participantName = getParticipantName();

  return (
    <div className="chat-window-container">
      {/* Connection Banner - chỉ hiển thị khi có lỗi thực sự */}
      {(error || (!isOnline && !isReconnecting)) && (
        <ConnectionBanner 
          isReconnecting={false}
          isOnline={isOnline}
          error={error}
        />
      )}

      {/* Header */}
      <div className="chat-window-header" data-testid="chat-window-header">
        <button
          className="chat-back-btn"
          onClick={onBack}
          aria-label="Quay lại danh sách"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path 
              d="M19 12H5M5 12L12 19M5 12L12 5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="chat-window-header-info">
          <div className="chat-window-participant">
            <h3 className="chat-window-participant-name" data-testid="participant-name">
              {participantName}
            </h3>
          </div>
          {activeChatRoom.metadata?.homestayName && (
            <div className="chat-window-homestay">
              <span className="homestay-name">{activeChatRoom.metadata.homestayName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area with MessageList component */}
      <div className="chat-window-messages">
        <MessageList
          messages={messages}
          currentUserId={user?.id || user?._id || ''}
          onLoadMore={async () => {
            if (activeChatRoom && hasMoreMessages) {
              await loadMessages(activeChatRoom._id, messagesPage + 1);
            }
          }}
          hasMore={hasMoreMessages}
          loading={loading}
          onRetry={retryMessage}
        />
        
        {/* Typing Indicator */}
        <TypingIndicator
          typingUsers={typingUsers}
          participants={activeChatRoom.participants || []}
          currentUserId={user?.id || user?._id || ''}
        />
      </div>

      {/* Input Area with MessageInput component */}
      <div className="chat-window-input">
        <MessageInput 
          chatroomId={activeChatRoom._id}
          disabled={!isConnected}
        />
      </div>

    </div>
  );
};

ChatWindow.propTypes = {
  onBack: PropTypes.func.isRequired
};

export default ChatWindow;
