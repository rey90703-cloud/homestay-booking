import { useRef, useEffect, useState } from 'react';
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
    error,
    deleteChatRoom
  } = useChat();

  const messagesEndRef = useRef(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const optionsMenuRef = useRef(null);
  const searchResultRefs = useRef([]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    };

    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptionsMenu]);

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

  // Search messages when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = [];
      messages.forEach((msg, msgIndex) => {
        const content = msg.content.toLowerCase();
        const query = searchQuery.toLowerCase();
        let index = content.indexOf(query);
        
        while (index !== -1) {
          results.push({
            messageIndex: msgIndex,
            messageId: msg._id,
            position: index,
            length: query.length
          });
          index = content.indexOf(query, index + 1);
        }
      });
      
      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
    }
  }, [searchQuery, messages]);

  // Scroll to current search result
  useEffect(() => {
    if (currentSearchIndex >= 0 && searchResults.length > 0) {
      // Small delay to ensure DOM is updated with highlights
      setTimeout(() => {
        // Find the highlight with matching data-search-index
        const targetHighlight = document.querySelector(`mark[data-search-index="${currentSearchIndex}"]`);
        
        if (targetHighlight) {
          // Scroll to the specific highlight
          targetHighlight.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // Add flash animation
          targetHighlight.style.animation = 'none';
          setTimeout(() => {
            targetHighlight.style.animation = 'flash-highlight 0.5s ease-in-out';
          }, 10);
        }
      }, 150);
    }
  }, [currentSearchIndex, searchResults]);

  // Handle search in chat
  const handleSearch = () => {
    setShowSearchBar(true);
    setShowOptionsMenu(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  };

  // Navigate to next search result
  const handleNextResult = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    }
  };

  // Navigate to previous search result
  const handlePrevResult = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

  // Handle delete chat
  const handleDeleteChat = async () => {
    setShowOptionsMenu(false);
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ đoạn chat này?')) {
      const success = await deleteChatRoom(activeChatRoom._id);
      if (success) {
        onBack();
      }
    }
  };

  // Highlight search text in message
  const highlightSearchText = (text, messageId) => {
    if (!searchQuery.trim() || searchResults.length === 0) {
      return text;
    }

    const parts = [];
    let lastIndex = 0;
    const query = searchQuery.toLowerCase();
    const lowerText = text.toLowerCase();
    
    let index = lowerText.indexOf(query);
    let matchIndexInMessage = 0;
    
    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      
      // Find the global index of this match
      const globalMatchIndex = searchResults.findIndex(r => 
        r.messageId === messageId && r.position === index
      );
      
      const isCurrentMatch = globalMatchIndex === currentSearchIndex;
      
      // Add highlighted match
      const matchText = text.substring(index, index + query.length);
      
      parts.push(
        <mark 
          key={`${messageId}-${index}`}
          className={isCurrentMatch ? 'search-highlight current' : 'search-highlight'}
          data-search-index={globalMatchIndex}
        >
          {matchText}
        </mark>
      );
      
      lastIndex = index + query.length;
      index = lowerText.indexOf(query, lastIndex);
      matchIndexInMessage++;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
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

        {/* Options Menu */}
        <div className="chat-options-menu" ref={optionsMenuRef}>
          <button
            className="chat-options-btn"
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            aria-label="Tùy chọn"
            title="Tùy chọn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
            </svg>
          </button>

          {showOptionsMenu && (
            <div className="chat-options-dropdown">
              <button className="chat-option-item" onClick={handleSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Tìm kiếm trong đoạn chat</span>
              </button>
              <button className="chat-option-item danger" onClick={handleDeleteChat}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Xóa đoạn chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearchBar && (
        <div className="chat-search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="search-results-info">
              <span>{currentSearchIndex + 1}/{searchResults.length}</span>
              <button 
                className="search-nav-btn"
                onClick={handlePrevResult}
                disabled={searchResults.length === 0}
                title="Kết quả trước"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className="search-nav-btn"
                onClick={handleNextResult}
                disabled={searchResults.length === 0}
                title="Kết quả tiếp theo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
          <button 
            className="chat-search-close"
            onClick={() => {
              setShowSearchBar(false);
              setSearchQuery('');
              setSearchResults([]);
              setCurrentSearchIndex(-1);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

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
          highlightSearchText={highlightSearchText}
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
          chatroomId={activeChatRoom._id || 'new'}
          disabled={false}
        />
      </div>

    </div>
  );
};

ChatWindow.propTypes = {
  onBack: PropTypes.func.isRequired
};

export default ChatWindow;
