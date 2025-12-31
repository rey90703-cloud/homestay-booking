import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import ChatRoomList from './ChatRoomList';
import ChatWindow from './ChatWindow';
import './ChatWidget.css';

const ChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    chatRooms,
    unreadTotal,
    loadChatRooms,
    selectChatRoom
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'chat'
  const chatWidgetRef = useRef(null);

  // Load chat rooms when widget opens
  useEffect(() => {
    if (isOpen && isAuthenticated && user && chatRooms.length === 0) {
      loadChatRooms();
    }
  }, [isOpen, isAuthenticated, user, chatRooms.length, loadChatRooms]);

  // Listen for openChatWidget event from other components
  useEffect(() => {
    const handleOpenChatWidget = async (event) => {
      const { chatroomId } = event.detail || {};
      
      if (chatroomId) {
        // Mở widget
        setIsOpen(true);
        
        // Load chatrooms nếu chưa có
        if (chatRooms.length === 0) {
          await loadChatRooms();
        }
        
        // Tìm chatroom và select
        const chatRoom = chatRooms.find(room => room._id === chatroomId);
        if (chatRoom) {
          handleSelectConversation(chatRoom);
        } else {
          // Nếu chưa có trong list, select trực tiếp bằng ID
          setView('chat');
          await selectChatRoom(chatroomId);
        }
      }
    };

    window.addEventListener('openChatWidget', handleOpenChatWidget);
    
    return () => {
      window.removeEventListener('openChatWidget', handleOpenChatWidget);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRooms, loadChatRooms, selectChatRoom]);

  // Listen for openChat event to start new conversation
  useEffect(() => {
    const handleOpenChat = async (event) => {
      const { recipientId, recipientName, recipientAvatar } = event.detail || {};
      
      if (!recipientId || !isAuthenticated || !user) {
        console.log('Cannot open chat: not authenticated');
        return;
      }

      // Mở widget
      setIsOpen(true);
      
      // Load chatrooms nếu chưa có
      if (chatRooms.length === 0) {
        await loadChatRooms();
      }
      
      // Tìm xem đã có chatroom với người này chưa
      const existingRoom = chatRooms.find(room => 
        room.participants?.some(p => p._id === recipientId)
      );
      
      if (existingRoom) {
        // Nếu đã có, mở chatroom đó
        handleSelectConversation(existingRoom);
      } else {
        // Nếu chưa có, tạo chatroom mới bằng cách chuyển sang view chat với thông tin recipient
        setView('chat');
        // Tạo một chatroom tạm để hiển thị với format đúng
        const tempChatRoom = {
          _id: null, // null để biết là chatroom mới
          participants: [{
            userId: {
              _id: recipientId,
              fullName: recipientName || 'User',
              profile: {
                firstName: recipientName?.split(' ')[0] || 'User',
                lastName: recipientName?.split(' ').slice(1).join(' ') || '',
                avatar: recipientAvatar
              }
            },
            role: 'host' // Giả định là host vì đang liên hệ chủ nhà
          }],
          recipientId: recipientId, // Thêm recipientId để dễ tạo chatroom mới
          recipientName: recipientName,
          recipientAvatar: recipientAvatar
        };
        await selectChatRoom(null, tempChatRoom);
      }
    };

    window.addEventListener('openChat', handleOpenChat);
    
    return () => {
      window.removeEventListener('openChat', handleOpenChat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRooms, loadChatRooms, selectChatRoom, isAuthenticated, user]);

  // Toggle widget open/close
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setView('list');
    }
  };

  // Select a conversation
  const handleSelectConversation = async (chatRoom) => {
    // Chuyển ngay sang view chat để tránh cảm giác trống
    setView('chat');
    try {
      await selectChatRoom(chatRoom._id);
    } catch (err) {
      console.error('Không thể mở cuộc trò chuyện:', err);
      // Quay lại danh sách nếu mở thất bại
      setView('list');
    }
  };

  // Back to conversation list
  const handleBackToList = () => {
    setView('list');
  };

  // Handle click outside to close chat widget
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatWidgetRef.current && !chatWidgetRef.current.contains(event.target) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="chat-widget" ref={chatWidgetRef}>
      {/* Chat Window */}
      <div className={`chat-window ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="chat-icon">
              <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="chat-title">Tin nhắn</h3>
          </div>
          <button
            className="chat-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Conversation List View */}
        {view === 'list' && (
          <ChatRoomList onSelectChatRoom={handleSelectConversation} />
        )}

        {/* Chat View */}
        {view === 'chat' && (
          <ChatWindow onBack={handleBackToList} />
        )}
      </div>

      {/* Chat Button with Unread Badge */}
      <button
        className={`chat-button ${isOpen ? 'hidden' : ''}`}
        onClick={handleToggle}
        aria-label="Chat với chúng tôi"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadTotal > 0 && (
          <span className="chat-button-badge">{unreadTotal > 99 ? '99+' : unreadTotal}</span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
