import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

/**
 * Custom hook để quản lý Socket.IO connection lifecycle
 * 
 * Features:
 * - Automatic connection/disconnection
 * - Exponential backoff reconnection strategy
 * - Event listener management
 * - Connection error handling
 * - Cleanup on unmount
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.token - JWT token for authentication
 * @param {Function} options.onConnect - Callback when connected
 * @param {Function} options.onDisconnect - Callback when disconnected
 * @param {Function} options.onError - Callback on connection error
 * @param {Object} options.eventHandlers - Map of event names to handler functions
 * @returns {Object} Socket instance and connection state
 */
export const useSocket = ({
  token,
  onConnect,
  onDisconnect,
  onError,
  eventHandlers = {}
} = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const eventHandlersRef = useRef(eventHandlers);

  // Update event handlers ref when they change
  useEffect(() => {
    eventHandlersRef.current = eventHandlers;
  }, [eventHandlers]);

  /**
   * Calculate exponential backoff delay
   * Formula: min(1000 * 2^attempts, 16000)
   */
  const getReconnectDelay = useCallback((attempts) => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 16000; // 16 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
    return delay;
  }, []);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (!token) return;

    const delay = getReconnectDelay(reconnectAttemptsRef.current);
    
    console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      
      // Try to reconnect
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }, delay);
  }, [token, getReconnectDelay]);

  /**
   * Connect to socket server
   */
  const connect = useCallback(() => {
    if (!token) {
      console.error('No token provided for socket connection');
      return;
    }

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Create new socket connection
    const socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection manually with exponential backoff
      autoConnect: true
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      
      if (onConnect) {
        onConnect(socket);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      if (onDisconnect) {
        onDisconnect(reason);
      }

      // Attempt reconnection if disconnect was not intentional
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, try to reconnect
        attemptReconnect();
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Network issue, try to reconnect
        attemptReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      const errorMessage = error.message || 'Không thể kết nối đến server';
      setConnectionError(errorMessage);
      setIsConnected(false);
      
      if (onError) {
        onError(error);
      }

      // Attempt reconnection on connection error
      attemptReconnect();
    });

    // Register custom event handlers
    Object.entries(eventHandlersRef.current).forEach(([eventName, handler]) => {
      socket.on(eventName, handler);
    });

    socketRef.current = socket;
  }, [token, onConnect, onDisconnect, onError, attemptReconnect]);

  /**
   * Disconnect from socket server
   */
  const disconnect = useCallback(() => {
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close socket connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  /**
   * Emit an event to the server
   */
  const emit = useCallback((eventName, data, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(eventName, data, callback);
    } else {
      console.warn(`Cannot emit ${eventName}: socket not connected`);
    }
  }, [isConnected]);

  /**
   * Add event listener
   */
  const on = useCallback((eventName, handler) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, handler);
    }
  }, []);

  /**
   * Remove event listener
   */
  const off = useCallback((eventName, handler) => {
    if (socketRef.current) {
      socketRef.current.off(eventName, handler);
    }
  }, []);

  // Auto-connect when token is available
  useEffect(() => {
    if (token) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [token]); // Only reconnect when token changes

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    connect,
    disconnect,
    emit,
    on,
    off
  };
};

export default useSocket;
