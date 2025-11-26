import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import ChatRoomItem from './ChatRoomItem';
import './ChatRoomList.css';

const ChatRoomList = ({ onSelectChatRoom }) => {
  const { user } = useAuth();
  const {
    chatRooms,
    loading,
    loadChatRooms,
    searchChatRooms,
    hasMoreChatRooms,
    chatRoomsPage,
    onlineUsers
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const listRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        await searchChatRooms(searchQuery);
        setIsSearching(false);
      }, 300); // 300ms debounce
    } else {
      // Reset to full list when search is cleared
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        await loadChatRooms(1);
        setIsSearching(false);
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchChatRooms, loadChatRooms]);

  // Infinite scroll with Intersection Observer
  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMoreChatRooms || searchQuery.trim()) {
      return;
    }

    await loadChatRooms(chatRoomsPage + 1);
  }, [loading, hasMoreChatRooms, chatRoomsPage, loadChatRooms, searchQuery]);

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: listRef.current,
        threshold: 0.1
      }
    );

    observerRef.current.observe(trigger);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore]);





  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle chatroom selection
  const handleSelectChatRoom = (chatRoom) => {
    if (onSelectChatRoom) {
      onSelectChatRoom(chatRoom);
    }
  };

  return (
    <div className="chat-room-list">
      {/* Search Input */}
      <div className="chat-room-search">
        <svg 
          className="search-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path 
            d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm cuộc trò chuyện..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Xóa tìm kiếm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Chat Room List */}
      <div className="chat-room-list-container" ref={listRef}>
        {(loading && chatRooms.length === 0) || isSearching ? (
          <div className="chat-room-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="chat-room-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path 
                d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <p>
              {searchQuery 
                ? 'Không tìm thấy cuộc trò chuyện nào' 
                : 'Chưa có cuộc trò chuyện nào'}
            </p>
          </div>
        ) : (
          <>
            {chatRooms.map((chatRoom) => (
              <ChatRoomItem
                key={chatRoom._id}
                chatRoom={chatRoom}
                currentUserId={user?._id}
                onlineUsers={onlineUsers}
                onClick={() => handleSelectChatRoom(chatRoom)}
              />
            ))}
            
            {/* Load More Trigger for Infinite Scroll */}
            {!searchQuery && hasMoreChatRooms && (
              <div ref={loadMoreTriggerRef} className="load-more-trigger">
                {loading && (
                  <div className="loading-more">
                    <div className="loading-spinner-small"></div>
                    <span>Đang tải thêm...</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatRoomList;
