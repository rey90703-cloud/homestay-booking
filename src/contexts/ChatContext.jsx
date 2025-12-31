import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config/api';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const ChatProvider = ({ children }) => {
  // State management
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Error handling and offline support
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messageQueue, setMessageQueue] = useState([]);

  // Refs for pagination and stable data access
  const chatRoomsPageRef = useRef(1);
  const messagesPageRef = useRef(1);
  const hasMoreChatRoomsRef = useRef(true);
  const hasMoreMessagesRef = useRef(true);
  const chatRoomsRef = useRef([]);
  const activeChatRoomRef = useRef(null);
  const messagesRef = useRef([]);

  // Process queued messages when connection is restored
  const processMessageQueue = useCallback(() => {
    if (messageQueue.length === 0 || !socket || !isConnected) {
      return;
    }

    console.log('Processing queued messages:', messageQueue.length);
    
    // Send all queued messages
    const queueCopy = [...messageQueue];
    setMessageQueue([]);

    queueCopy.forEach((queuedMessage) => {
      socket.emit('send_message', {
        chatroomId: queuedMessage.chatroomId,
        content: queuedMessage.content,
        type: queuedMessage.type
      });

      // Update message status in UI
      setMessages(prev => 
        prev.map(msg => 
          msg._id === queuedMessage._id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    });
  }, [messageQueue, socket, isConnected]);

  // Connect socket with JWT token
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      console.log('No authentication found, skipping socket connection');
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
      reconnectionAttempts: Infinity,
      autoConnect: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setError(null);
      
      // Process any queued messages
      setTimeout(() => {
        processMessageQueue();
      }, 100);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
      setIsReconnecting(true);
      setError('Đang kết nối lại...');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      setIsReconnecting(false);
      setError('Không thể kết nối lại. Vui lòng kiểm tra kết nối mạng.');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsReconnecting(true);
      setError('Đang kết nối lại...');
      setIsConnected(false);
    });

    // Chat event handlers
    newSocket.on('new_message', (data) => {
      console.log('Received new message:', data);
      console.log('Active chatroom (ref):', activeChatRoomRef.current);
      console.log('Chatroom ID match:', data.chatroomId, '===', activeChatRoomRef.current?._id, '?', data.chatroomId === activeChatRoomRef.current?._id);
      
      const { chatroomId, message } = data;
      
      // Update messages if in active chatroom (use ref to get latest value)
      if (activeChatRoomRef.current && chatroomId === activeChatRoomRef.current._id) {
        console.log(' Adding message to UI');
        
        // Check if this is our own message (replace optimistic update)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = user.id || user._id;
        
        setMessages(prev => {
          // If message is from current user, check for optimistic message to replace
          if (message.senderId === currentUserId) {
            // Find and replace the most recent optimistic message with same content
            const optimisticIndex = prev.findIndex(msg => 
              msg.senderId === currentUserId && 
              msg.content === message.content &&
              msg._id.startsWith('temp-')
            );
            
            if (optimisticIndex !== -1) {
              // Replace optimistic message with real one
              const updated = [...prev];
              updated[optimisticIndex] = message;
              return updated;
            }
          }
          
          // Otherwise, add new message
          return [...prev, message];
        });
      } else {
        console.log(' NOT adding message - chatroom not active or ID mismatch');
      }

      // Update chatroom's lastMessage and unreadCount
      setChatRooms(prev => {
        const updated = prev.map(room => {
          if (room._id === chatroomId) {
            const isActiveRoom = activeChatRoom && activeChatRoom._id === room._id;
            return {
              ...room,
              lastMessage: {
                content: message.content,
                senderId: message.senderId,
                type: message.type,
                createdAt: message.createdAt
              },
              unreadCount: isActiveRoom ? room.unreadCount : (room.unreadCount || 0) + 1
            };
          }
          return room;
        });

        // Sort by lastMessage.createdAt descending
        return updated.sort((a, b) => {
          const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
          const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
          return dateB - dateA;
        });
      });

      // Update total unread count
      calculateUnreadTotal();
    });

    newSocket.on('user_typing', ({ userId, chatroomId }) => {
      console.log('User typing:', userId, chatroomId);
      // Add user to typing users set
      setTypingUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user_stop_typing', ({ userId, chatroomId }) => {
      console.log('User stopped typing:', userId, chatroomId);
      // Remove user from typing users set
      setTypingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    newSocket.on('message_read', ({ chatroomId, userId, readAt: _readAt }) => {
      console.log('Message read:', chatroomId, userId);
      // Update read status
    });

    newSocket.on('user_online', ({ userId }) => {
      console.log('User online:', userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId, lastSeenAt: _lastSeenAt }) => {
      console.log('User offline:', userId);
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatRoom, processMessageQueue]);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Calculate total unread count (stable reference to avoid effect loops)
  const calculateUnreadTotal = useCallback(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user._id;
    const rooms = chatRoomsRef.current;

    const total = rooms.reduce((sum, room) => {
      const userUnread = room.unreadCount?.[userId] || room.unreadCount || 0;
      return sum + userUnread;
    }, 0);

    setUnreadTotal(total);
  }, []);

  // Load chat rooms with pagination
  const loadChatRooms = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping chat rooms load');
        setLoading(false);
        return [];
      }

      const response = await fetch(
        `${API_BASE_URL}/chat/rooms?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - please login again');
          setLoading(false);
          return [];
        }
        throw new Error('Failed to load chat rooms');
      }

      const data = await response.json();
      const rooms = data.data?.chatRooms || data.data || [];

      setChatRooms(prev => {
        const next = page === 1 ? rooms : [...prev, ...rooms];
        chatRoomsRef.current = next;
        return next;
      });

      chatRoomsPageRef.current = page;
      hasMoreChatRoomsRef.current = rooms.length === limit;

      // Calculate total unread inline to avoid dependency
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id;
      const total = rooms.reduce((sum, room) => {
        const userUnread = room.unreadCount?.[userId] || room.unreadCount || 0;
        return sum + userUnread;
      }, 0);
      setUnreadTotal(total);

      return rooms;
    } catch (err) {
      console.error('Error loading chat rooms:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Select a chat room
  const selectChatRoom = useCallback(async (chatroomId, tempChatRoom = null) => {
    try {
      setLoading(true);
      setError(null);

      // Clear messages immediately when switching chat rooms
      setMessages([]);

      // If tempChatRoom is provided, it's a new conversation
      if (tempChatRoom) {
        setActiveChatRoom(tempChatRoom);
        activeChatRoomRef.current = tempChatRoom;
        setLoading(false);
        return tempChatRoom;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/chat/rooms/${chatroomId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load chat room');
      }

      const data = await response.json();
      const room = data.data?.chatRoom || data.data;

      setActiveChatRoom(room);
      activeChatRoomRef.current = room;
      chatRoomsRef.current = chatRoomsRef.current.map(r => r._id === room._id ? room : r);

      // Join socket room
      if (socket && isConnected) {
        socket.emit('join_room', chatroomId);
      }

      // Load messages for this room
      const loadMessagesAsync = async (roomId, page) => {
        try {
          const msgToken = localStorage.getItem('token');
          const msgResponse = await fetch(
            `${API_BASE_URL}/chat/rooms/${roomId}/messages?page=${page}&limit=50`,
            {
              headers: {
                'Authorization': `Bearer ${msgToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!msgResponse.ok) {
            throw new Error('Failed to load messages');
          }

          const msgData = await msgResponse.json();
          const newMessages = msgData.data?.messages || msgData.data || [];

          if (activeChatRoomRef.current?._id === roomId) {
            setMessages(newMessages);
            messagesPageRef.current = page;
            hasMoreMessagesRef.current = newMessages.length === 50;
          }

          return newMessages;
        } catch (err) {
          console.error('Error loading messages:', err);
          return [];
        }
      };

      await loadMessagesAsync(chatroomId, 1);

      // Mark as read
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id;

      if (socket && isConnected) {
        socket.emit('mark_as_read', chatroomId);
      }

      setChatRooms(prev => {
        const next = prev.map(r => {
          if (r._id === chatroomId) {
            return {
              ...r,
              unreadCount: {
                ...r.unreadCount,
                [userId]: 0
              }
            };
          }
          return r;
        });
        chatRoomsRef.current = next;
        return next;
      });

      calculateUnreadTotal();

      return room;
    } catch (err) {
      console.error('Error selecting chat room:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [socket, isConnected, calculateUnreadTotal]);

  // Load messages with pagination
  const loadMessages = useCallback(async (chatroomId, page = 1, limit = 50) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/chat/rooms/${chatroomId}/messages?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      const newMessages = data.data?.messages || data.data || [];

      // Only update messages if this chatroom is still active
      if (activeChatRoomRef.current?._id === chatroomId) {
        if (page === 1) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...newMessages, ...prev]);
        }

        messagesPageRef.current = page;
        hasMoreMessagesRef.current = newMessages.length === limit;
      }

      return newMessages;
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Retry sending a failed message
  const retryMessage = useCallback(async (messageId) => {
    const message = messages.find(msg => msg._id === messageId);
    if (!message || message.status !== 'failed') {
      return null;
    }

    // Update status to sending
    setMessages(prev => 
      prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, status: 'sending' }
          : msg
      )
    );

    try {
      if (socket && isConnected) {
        socket.emit('send_message', {
          chatroomId: message.roomId || activeChatRoom._id,
          content: message.content,
          type: message.type || 'text'
        });

        // Update status to sent
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId 
              ? { ...msg, status: 'sent' }
              : msg
          )
        );

        return message;
      } else {
        throw new Error('Socket not connected');
      }
    } catch (err) {
      console.error('Error retrying message:', err);
      
      // Mark message as failed again
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      
      setError('Không thể gửi tin nhắn');
      return null;
    }
  }, [messages, socket, isConnected, activeChatRoom]);

  // Send message with optimistic update and offline support
  const sendMessage = useCallback(async (content) => {
    if (!activeChatRoom || !content.trim()) {
      return null;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tempId = `temp-${Date.now()}`;
    
    try {
      // Nếu là chatroom mới (chưa có _id), tạo chatroom trước
      if (!activeChatRoom._id && activeChatRoom.recipientId) {
        const token = localStorage.getItem('token');
        console.log('🔑 Creating chatroom with token:', token ? 'exists' : 'missing');
        console.log('📤 Request to:', `${API_BASE_URL}/chat/rooms`);
        console.log('👤 Participant ID:', activeChatRoom.recipientId);
        
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            participantId: activeChatRoom.recipientId,
            message: content.trim()
          })
        });

        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(' Create chatroom error:', errorData);
          throw new Error(errorData.message || 'Failed to create chatroom');
        }

        const data = await response.json();
        const newChatRoom = data.data?.chatRoom || data.data;
        
        // Update active chatroom với chatroom mới
        setActiveChatRoom(newChatRoom);
        activeChatRoomRef.current = newChatRoom;
        
        // Add to chatrooms list
        setChatRooms(prev => [newChatRoom, ...prev]);
        chatRoomsRef.current = [newChatRoom, ...chatRoomsRef.current];
        
        // Join socket room
        if (socket && isConnected) {
          socket.emit('join_room', newChatRoom._id);
        }
        
        // Load messages
        await loadMessages(newChatRoom._id, 1);
        
        return { success: true };
      }
    
      // Optimistic update
      const optimisticMessage = {
        _id: tempId,
        roomId: activeChatRoom._id,
        chatroomId: activeChatRoom._id,
        senderId: user.id || user._id,
        content: content.trim(),
        type: 'text',
        status: 'sending',
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Check if online and connected
      if (!isOnline || !socket || !isConnected) {
        // Queue message for later
        console.log('Offline or disconnected, queueing message');
        setMessageQueue(prev => [...prev, {
          ...optimisticMessage,
          status: 'queued',
          queuedAt: new Date().toISOString()
        }]);

        // Update message status to queued
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId 
              ? { ...msg, status: 'queued' }
              : msg
          )
        );

        setError('Tin nhắn sẽ được gửi khi kết nối lại');
        return optimisticMessage;
      }

      // Emit via socket
      socket.emit('send_message', {
        chatroomId: activeChatRoom._id,
        content: content.trim(),
        type: 'text'
      });

      // Update optimistic message status
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );

      return optimisticMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      
      setError('Không thể gửi tin nhắn');
      return null;
    }
  }, [activeChatRoom, socket, isConnected, isOnline, loadMessages]);

  // Mark chatroom as read
  const markAsRead = useCallback(async (chatroomId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id;

      // Emit via socket
      if (socket && isConnected) {
        socket.emit('mark_as_read', chatroomId);
      }

      // Update local state
      setChatRooms(prev => {
        const next = prev.map(room => {
          if (room._id === chatroomId) {
            return {
              ...room,
              unreadCount: {
                ...room.unreadCount,
                [userId]: 0
              }
            };
          }
          return room;
        });
        chatRoomsRef.current = next;
        return next;
      });

      // Recalculate total unread
      calculateUnreadTotal();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [socket, isConnected, calculateUnreadTotal]);

  // Delete chat room (soft delete - only hide for current user)
  const deleteChatRoom = useCallback(async (chatroomId) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id;
      
      // Call API to soft delete (hide for current user)
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${chatroomId}/hide`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete chat room');
      }

      // Remove from local state (hide from UI)
      setChatRooms(prev => {
        const next = prev.filter(room => room._id !== chatroomId);
        chatRoomsRef.current = next;
        return next;
      });

      // Clear active chat if it was deleted
      if (activeChatRoom?._id === chatroomId) {
        setActiveChatRoom(null);
        setMessages([]);
        messagesRef.current = [];
      }

      // Recalculate unread total
      calculateUnreadTotal();

      return true;
    } catch (err) {
      console.error('Error deleting chat room:', err);
      setError(err.message);
      return false;
    }
  }, [activeChatRoom, calculateUnreadTotal]);

  // Search chat rooms
  const searchChatRooms = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/chat/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search chat rooms');
      }

      const data = await response.json();
      const rooms = data.data?.chatRooms || data.data || [];

      setChatRooms(rooms);
      return rooms;
    } catch (err) {
      console.error('Error searching chat rooms:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network online');
      setIsOnline(true);
      setError(null);
      
      // Try to reconnect socket if disconnected
      if (!isConnected && socket) {
        socket.connect();
      }
    };

    const handleOffline = () => {
      console.log('Network offline');
      setIsOnline(false);
      setError('Không có kết nối mạng');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket, isConnected]);

  // Process message queue when connection is restored
  useEffect(() => {
    if (isConnected && isOnline && messageQueue.length > 0) {
      processMessageQueue();
    }
  }, [isConnected, isOnline, messageQueue.length, processMessageQueue]);

  // Auto-connect socket when user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user && !socket) {
      connectSocket();
    }

    return () => {
      if (socket) {
        disconnectSocket();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi mount

  // Recalculate unread total when chatRooms change
  useEffect(() => {
    chatRoomsRef.current = chatRooms;
    calculateUnreadTotal();
  }, [chatRooms, calculateUnreadTotal]);

  // Update activeChatRoom ref when it changes
  useEffect(() => {
    activeChatRoomRef.current = activeChatRoom;
  }, [activeChatRoom]);

  const value = {
    // State
    socket,
    isConnected,
    chatRooms,
    activeChatRoom,
    messages,
    unreadTotal,
    onlineUsers,
    typingUsers,
    loading,
    error,
    
    // Error handling and offline support
    isReconnecting,
    isOnline,
    messageQueue,
    
    // Methods
    connectSocket,
    disconnectSocket,
    loadChatRooms,
    selectChatRoom,
    loadMessages,
    sendMessage,
    retryMessage,
    markAsRead,
    deleteChatRoom,
    searchChatRooms,
    
    // Pagination helpers
    hasMoreChatRooms: hasMoreChatRoomsRef.current,
    hasMoreMessages: hasMoreMessagesRef.current,
    chatRoomsPage: chatRoomsPageRef.current,
    messagesPage: messagesPageRef.current
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
