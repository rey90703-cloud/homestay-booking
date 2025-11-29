import { useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Virtuoso } from 'react-virtuoso';
import MessageItem from './MessageItem';
import './MessageList.css';

/**
 * MessageList Component
 * 
 * Displays list of messages with virtualization, infinite scroll, and auto-scroll
 * Requirements: 5.1, 5.2, 5.3, 5.6
 */
const MessageList = ({ 
  messages, 
  currentUserId, 
  onLoadMore, 
  hasMore, 
  loading,
  onRetry,
  highlightSearchText
}) => {
  const listRef = useRef(null);
  const containerRef = useRef(null);

  // Group messages by date (messages are already sorted oldest first)
  const groupMessagesByDate = useCallback((messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    // Messages are already sorted oldest to newest, keep that order
    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      const dateKey = messageDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      if (dateKey !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = dateKey;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, []);



  // Flatten grouped messages for virtualization
  const flattenedItems = useCallback(() => {
    const groups = groupMessagesByDate(messages);
    const items = [];

    groups.forEach((group) => {
      // Add date separator
      items.push({ type: 'date', date: group.date });
      
      // Add messages
      group.messages.forEach((message) => {
        items.push({ type: 'message', message });
      });
    });

    return items;
  }, [messages, groupMessagesByDate]);

  const items = flattenedItems();

  // Auto-scroll to bottom when new messages arrive or component mounts
  useEffect(() => {
    if (listRef.current && items.length > 0) {
      // Use setTimeout to ensure Virtuoso has rendered
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollToIndex({
            index: items.length - 1,
            align: 'end',
            behavior: 'auto' // Use 'auto' for instant scroll on mount
          });
        }
      }, 100);
    }
  }, [items.length]);

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <p>Chưa có tin nhắn nào</p>
      </div>
    );
  }

  return (
    <div className="message-list-container" ref={containerRef}>
      {loading && (
        <div className="message-list-loading">
          <span>Đang tải...</span>
        </div>
      )}
      <Virtuoso
        ref={listRef}
        data={items}
        initialTopMostItemIndex={items.length > 0 ? items.length - 1 : 0}
        itemContent={(index, item) => {
          if (item.type === 'date') {
            return (
              <div className="message-date-separator">
                <span className="message-date-text">{item.date}</span>
              </div>
            );
          }

          const message = item.message;

          return (
            <MessageItem 
              message={message}
              currentUserId={currentUserId}
              onRetry={onRetry}
              highlightSearchText={highlightSearchText}
            />
          );
        }}
        startReached={() => {
          if (hasMore && !loading) {
            onLoadMore();
          }
        }}
        followOutput="smooth"
        className="message-list"
      />
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      senderId: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      createdAt: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date)
      ]).isRequired,
      type: PropTypes.string
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
  onRetry: PropTypes.func
};

MessageList.defaultProps = {
  hasMore: false,
  loading: false
};

export default MessageList;
