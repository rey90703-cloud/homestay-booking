import PropTypes from 'prop-types';
import './ChatRoomItem.css';

/**
 * ChatRoomItem Component
 * 
 * Displays a single chatroom item in the chatroom list
 * Shows homestay name, participant info, last message, timestamp, unread badge, and online status
 * 
 * Requirements: 4.2, 4.3, 8.4
 */
const ChatRoomItem = ({ chatRoom, currentUserId, onlineUsers, onClick }) => {
  // Get the other participant (not current user) - SAME LOGIC AS ChatWindow
  const getOtherParticipant = () => {
    return chatRoom.participants?.find(p => {
      const participantId = typeof p.userId === 'object' ? p.userId._id : p.userId;
      return participantId?.toString() !== currentUserId?.toString();
    });
  };
  
  // Get participant name - SAME LOGIC AS ChatWindow
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
      return chatRoom?.metadata?.hostName || 'Host';
    }
    
    return 'Guest';
  };
  
  const otherParticipant = getOtherParticipant();
  const participantName = getParticipantName();
  
  // Debug: Log để kiểm tra
  if (chatRoom._id) {
    console.log('=== ChatRoomItem Debug ===');
    console.log('ChatRoom ID:', chatRoom._id);
    console.log('Current User ID:', currentUserId);
    console.log('Participants:', chatRoom.participants?.map(p => ({
      userId: typeof p.userId === 'object' ? p.userId._id : p.userId,
      name: typeof p.userId === 'object' ? (p.userId.fullName || `${p.userId.profile?.firstName} ${p.userId.profile?.lastName}`) : 'N/A'
    })));
    console.log('Other Participant:', otherParticipant);
    console.log('Display Name:', participantName);
    console.log('========================');
  }
  
  // Get unread count for current user
  const unreadCount = chatRoom.unreadCount?.[currentUserId] || 0;
  
  // Check if other participant is online
  const isOnline = onlineUsers?.has(otherParticipant?.userId);
  
  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    if (messageDay.getTime() === today.getTime()) {
      // Same day: show HH:mm
      return messageDate.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Different day: show DD/MM/YYYY HH:mm
      return messageDate.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div
      className={`chat-room-item ${unreadCount > 0 ? 'has-unread' : ''}`}
      onClick={onClick}
      data-testid="chat-room-item"
      data-chatroom-id={chatRoom._id}
      data-has-unread={unreadCount > 0}
      data-is-online={isOnline}
    >
      {/* Avatar with online indicator */}
      <div className="chat-room-avatar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        {isOnline && (
          <div 
            className="online-indicator" 
            data-testid="online-indicator"
            aria-label="Đang trực tuyến"
          />
        )}
      </div>

      {/* Chat room info */}
      <div className="chat-room-info">
        <div className="chat-room-header">
          <h4 className="chat-room-name" data-testid="homestay-name">
            {participantName}
          </h4>
          <span className="chat-room-time" data-testid="timestamp">
            {formatTime(chatRoom.lastMessage?.createdAt)}
          </span>
        </div>
        
        {chatRoom.metadata?.homestayName && (
          <div className="chat-room-participant" data-testid="participant-name">
            {chatRoom.metadata.homestayName}
          </div>
        )}
        
        <div className="chat-room-last-message-container">
          <p className="chat-room-last-message" data-testid="last-message">
            {chatRoom.lastMessage?.content || 'Chưa có tin nhắn'}
          </p>
          {unreadCount > 0 && (
            <div className="chat-room-unread-badge" data-testid="unread-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ChatRoomItem.propTypes = {
  chatRoom: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    bookingId: PropTypes.string,
    participants: PropTypes.arrayOf(
      PropTypes.shape({
        userId: PropTypes.string.isRequired,
        name: PropTypes.string,
        role: PropTypes.oneOf(['guest', 'host'])
      })
    ),
    metadata: PropTypes.shape({
      homestayName: PropTypes.string,
      homestayId: PropTypes.string,
      hostName: PropTypes.string
    }),
    lastMessage: PropTypes.shape({
      content: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      senderId: PropTypes.string,
      type: PropTypes.string
    }),
    unreadCount: PropTypes.object
  }).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onlineUsers: PropTypes.instanceOf(Set),
  onClick: PropTypes.func
};

ChatRoomItem.defaultProps = {
  onlineUsers: new Set(),
  onClick: () => {}
};

export default ChatRoomItem;
