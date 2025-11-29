import API_BASE_URL from '../config/api';

/**
 * Enhanced fetch wrapper that handles 401 errors automatically
 */
export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Add authorization header if token exists
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Check for 401 Unauthorized
  if (response.status === 401) {
    console.warn('🔒 Token expired or invalid. Logging out...');
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Show alert to user
    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    
    // Redirect to login page
    window.location.href = '/login';
    
    // Throw error to stop further processing
    throw new Error('Unauthorized - Session expired');
  }
  
  return response;
};

/**
 * Helper function to make API calls with automatic 401 handling
 */
export const apiCall = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return apiFetch(url, options);
};
