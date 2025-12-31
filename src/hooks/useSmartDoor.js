import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { apiCall } from '../utils/apiClient';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

/**
 * Custom hook để quản lý Smart Door Control
 * 
 * Features:
 * - Fetch access info (password, duration, door status)
 * - Control door (open/close)
 * - Adjust duration
 * - Fetch access logs
 * - WebSocket realtime updates
 * 
 * @param {string} bookingId - ID của booking
 * @returns {Object} Smart door state và methods
 */
export const useSmartDoor = (bookingId) => {
  // State
  const [accessInfo, setAccessInfo] = useState(null);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs
  const socketRef = useRef(null);
  const bookingIdRef = useRef(bookingId);

  // Update bookingId ref when it changes
  useEffect(() => {
    bookingIdRef.current = bookingId;
  }, [bookingId]);

  /**
   * Fetch access info từ API
   */
  const fetchAccessInfo = useCallback(async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(`/bookings/${bookingId}/access-info`);
      const data = await response.json();

      if (data.success) {
        setAccessInfo(data.data);
      } else {
        throw new Error(data.message || 'Không thể tải thông tin truy cập');
      }
    } catch (err) {
      console.error('Error fetching access info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  /**
   * Fetch access logs từ API
   */
  const fetchAccessLogs = useCallback(async (filters = {}) => {
    if (!bookingId) return;

    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `/bookings/${bookingId}/access-logs${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await apiCall(url);
      const data = await response.json();

      if (data.success) {
        setAccessLogs(data.data.logs || []);
      } else {
        throw new Error(data.message || 'Không thể tải lịch sử truy cập');
      }
    } catch (err) {
      console.error('Error fetching access logs:', err);
      setError(err.message);
    }
  }, [bookingId]);

  /**
   * Mở cửa
   */
  const openDoor = useCallback(async () => {
    if (!bookingId) return { success: false, message: 'Booking ID không hợp lệ' };

    try {
      const response = await apiCall(`/bookings/${bookingId}/door/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: 'Đã gửi lệnh mở cửa' };
      } else {
        return { success: false, message: data.message || 'Không thể mở cửa' };
      }
    } catch (err) {
      console.error('Error opening door:', err);
      return { success: false, message: err.message };
    }
  }, [bookingId]);

  /**
   * Đóng cửa
   */
  const closeDoor = useCallback(async () => {
    if (!bookingId) return { success: false, message: 'Booking ID không hợp lệ' };

    try {
      const response = await apiCall(`/bookings/${bookingId}/door/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: 'Đã gửi lệnh đóng cửa' };
      } else {
        return { success: false, message: data.message || 'Không thể đóng cửa' };
      }
    } catch (err) {
      console.error('Error closing door:', err);
      return { success: false, message: err.message };
    }
  }, [bookingId]);

  /**
   * Điều chỉnh thời gian hiệu lực
   */
  const setDuration = useCallback(async (minutes) => {
    if (!bookingId) return { success: false, message: 'Booking ID không hợp lệ' };

    try {
      const response = await apiCall(`/bookings/${bookingId}/set-duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: minutes }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh access info
        await fetchAccessInfo();
        return { success: true, message: 'Đã cập nhật thời gian hiệu lực' };
      } else {
        return { success: false, message: data.message || 'Không thể cập nhật thời gian' };
      }
    } catch (err) {
      console.error('Error setting duration:', err);
      return { success: false, message: err.message };
    }
  }, [bookingId, fetchAccessInfo]);

  /**
   * Setup WebSocket connection
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !bookingId) return;

    // Create socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Smart Door WebSocket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Smart Door WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Smart Door WebSocket connection error:', err);
      setIsConnected(false);
    });

    // Smart Door event handlers
    socket.on('door:status:update', (data) => {
      console.log('Door status update:', data);
      if (data.bookingId === bookingIdRef.current) {
        setAccessInfo(prev => prev ? { ...prev, doorStatus: data.status } : null);
      }
    });

    socket.on('door:access:log', (data) => {
      console.log('New access log:', data);
      if (data.bookingId === bookingIdRef.current) {
        setAccessLogs(prev => [data, ...prev]);
      }
    });

    socket.on('door:password:update', (data) => {
      console.log('Password update:', data);
      if (data.bookingId === bookingIdRef.current) {
        setAccessInfo(prev => prev ? { ...prev, expiresAt: data.expiresAt } : null);
      }
    });

    socket.on('door:device:status', (data) => {
      console.log('Device status:', data);
      if (data.bookingId === bookingIdRef.current) {
        setAccessInfo(prev => prev ? { ...prev, isOnline: data.isOnline } : null);
      }
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [bookingId]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    if (bookingId) {
      fetchAccessInfo();
      fetchAccessLogs();
    }
  }, [bookingId, fetchAccessInfo, fetchAccessLogs]);

  return {
    // State
    accessInfo,
    accessLogs,
    loading,
    error,
    isConnected,

    // Methods
    openDoor,
    closeDoor,
    setDuration,
    fetchAccessInfo,
    fetchAccessLogs,
    refresh: fetchAccessInfo,
  };
};

// Default export
export default useSmartDoor;
