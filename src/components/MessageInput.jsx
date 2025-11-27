import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useChat } from '../contexts/ChatContext';
import './MessageInput.css';

/**
 * MessageInput Component
 * 
 * Input field for composing and sending messages with:
 * - Auto-resize textarea
 * - Send on Enter (Shift+Enter for new line)
 * - Typing indicator with debouncing
 * - Message validation (not empty, max 2000 chars)
 * - Draft persistence to localStorage
 * 
 * Requirements: 3.4, 3.5, 6.1, 10.5
 */
const MessageInput = ({ chatroomId, disabled }) => {
  const { sendMessage, socket, isConnected } = useChat();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const DRAFT_KEY = `chat_draft_${chatroomId}`;
  const MAX_LENGTH = 2000;
  const TYPING_DEBOUNCE_MS = 500;

  // Restore draft from localStorage on mount or when chatroomId changes
  useEffect(() => {
    if (chatroomId && chatroomId !== 'new') {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        setContent(draft);
        // Auto-resize after restoring draft
        setTimeout(() => {
          if (textareaRef.current) {
            autoResize();
          }
        }, 0);
      } else {
        setContent('');
      }
    }
  }, [chatroomId, DRAFT_KEY]);

  // Save draft to localStorage whenever content changes
  useEffect(() => {
    if (chatroomId && chatroomId !== 'new') {
      if (content.trim()) {
        localStorage.setItem(DRAFT_KEY, content);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, [content, chatroomId, DRAFT_KEY]);

  // Auto-resize textarea based on content
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, []);

  // Emit typing indicator with debouncing
  const emitTypingIndicator = useCallback(() => {
    if (!socket || !isConnected || !chatroomId || chatroomId === 'new') return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing_start if not already typing
    if (!isTypingRef.current) {
      socket.emit('typing_start', chatroomId);
      isTypingRef.current = true;
    }

    // Set timeout to emit typing_stop after debounce period
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit('typing_stop', chatroomId);
        isTypingRef.current = false;
      }
    }, TYPING_DEBOUNCE_MS);
  }, [socket, isConnected, chatroomId, TYPING_DEBOUNCE_MS]);

  // Handle content change
  const handleChange = (e) => {
    const newContent = e.target.value;
    
    // Validate length
    if (newContent.length > MAX_LENGTH) {
      setError(`Tin nhắn không được vượt quá ${MAX_LENGTH} ký tự`);
      return;
    }

    setContent(newContent);
    setError('');
    autoResize();

    // Emit typing indicator
    if (newContent.trim()) {
      emitTypingIndicator();
    }
  };

  // Handle key down for Enter to send
  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Allow Shift+Enter for new line (default behavior)
  };

  // Validate message content
  const validateMessage = (message) => {
    const trimmed = message.trim();
    
    if (!trimmed) {
      setError('Tin nhắn không được để trống');
      return false;
    }

    if (trimmed.length > MAX_LENGTH) {
      setError(`Tin nhắn không được vượt quá ${MAX_LENGTH} ký tự`);
      return false;
    }

    return true;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateMessage(content)) {
      return;
    }

    try {
      // Stop typing indicator immediately
      if (isTypingRef.current && socket && isConnected) {
        socket.emit('typing_stop', chatroomId);
        isTypingRef.current = false;
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send message
      await sendMessage(content.trim());

      // Clear input and draft
      setContent('');
      setError('');
      localStorage.removeItem(DRAFT_KEY);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Focus back to textarea
      textareaRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing indicator on unmount
      if (isTypingRef.current && socket && isConnected && chatroomId && chatroomId !== 'new') {
        socket.emit('typing_stop', chatroomId);
      }
    };
  }, [socket, isConnected, chatroomId]);

  const isDisabled = disabled;
  const remainingChars = MAX_LENGTH - content.length;
  const showCharCount = content.length > MAX_LENGTH * 0.8; // Show when 80% full

  return (
    <div className="message-input-container">
      {error && (
        <div className="message-input-error" role="alert">
          {error}
        </div>
      )}
      
      <form className="message-input-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="message-input-textarea"
          placeholder="Nhập tin nhắn..."
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          rows={1}
          aria-label="Nhập tin nhắn"
          aria-invalid={!!error}
          aria-describedby={error ? 'message-input-error' : undefined}
        />

        <button
          type="submit"
          className="message-input-send-btn"
          disabled={isDisabled || !content.trim()}
          aria-label="Gửi tin nhắn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      
      {showCharCount && (
        <div className="message-input-footer">
          <span 
            className={`message-input-char-count ${remainingChars < 100 ? 'warning' : ''}`}
            aria-live="polite"
          >
            {remainingChars} ký tự còn lại
          </span>
        </div>
      )}
    </div>
  );
};

MessageInput.propTypes = {
  chatroomId: PropTypes.string,
  disabled: PropTypes.bool
};

MessageInput.defaultProps = {
  chatroomId: null,
  disabled: false
};

export default MessageInput;
