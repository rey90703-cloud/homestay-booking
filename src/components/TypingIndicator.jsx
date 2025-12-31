import React, { useState, useEffect } from 'react';
import './TypingIndicator.css';

/**
 * TypingIndicator Component
 * 
 * Hiển thị "đang gõ..." khi nhận typing event
 * Tự động ẩn sau 3 giây nếu không nhận thêm typing event
 * 
 * Props:
 * - typingUsers: Set<string> - Set of user IDs currently typing
 * - participants: Array - Array of participant objects with userId and name
 * - currentUserId: string - Current user's ID (to exclude from display)
 */
const TypingIndicator = ({ typingUsers = new Set(), participants = [], currentUserId }) => {
  const [visibleTypingUsers, setVisibleTypingUsers] = useState(new Set());
  const [timeouts, setTimeouts] = useState(new Map());

  useEffect(() => {
    // Update visible typing users and set timeouts
    const newTimeouts = new Map(timeouts);

    // Add new typing users
    typingUsers.forEach(userId => {
      if (userId !== currentUserId) {
        setVisibleTypingUsers(prev => new Set([...prev, userId]));

        // Clear existing timeout for this user
        if (newTimeouts.has(userId)) {
          clearTimeout(newTimeouts.get(userId));
        }

        // Set new timeout to hide after 3 seconds
        const timeoutId = setTimeout(() => {
          setVisibleTypingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(userId);
            return updated;
          });
          setTimeouts(prev => {
            const updated = new Map(prev);
            updated.delete(userId);
            return updated;
          });
        }, 3000);

        newTimeouts.set(userId, timeoutId);
      }
    });

    // Remove users who stopped typing
    visibleTypingUsers.forEach(userId => {
      if (!typingUsers.has(userId)) {
        setVisibleTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
        if (newTimeouts.has(userId)) {
          clearTimeout(newTimeouts.get(userId));
          newTimeouts.delete(userId);
        }
      }
    });

    setTimeouts(newTimeouts);

    // Cleanup on unmount
    return () => {
      newTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingUsers, currentUserId]);

  // Get names of typing users
  const getTypingUserNames = () => {
    const names = [];
    visibleTypingUsers.forEach(userId => {
      const participant = participants.find(p => p.userId === userId);
      if (participant) {
        names.push(participant.name);
      }
    });
    return names;
  };

  const typingUserNames = getTypingUserNames();

  if (typingUserNames.length === 0) {
    return null;
  }

  // Format display text
  let displayText;
  if (typingUserNames.length === 1) {
    displayText = `${typingUserNames[0]} đang gõ...`;
  } else if (typingUserNames.length === 2) {
    displayText = `${typingUserNames[0]} và ${typingUserNames[1]} đang gõ...`;
  } else {
    displayText = `${typingUserNames[0]} và ${typingUserNames.length - 1} người khác đang gõ...`;
  }

  return (
    <div 
      className="typing-indicator" 
      data-testid="typing-indicator"
      data-typing-count={typingUserNames.length}
    >
      <div className="typing-indicator-content">
        <div className="typing-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
        <span className="typing-text">{displayText}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
