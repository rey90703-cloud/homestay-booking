import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      const userData = JSON.parse(savedUser);
      
      // Apply role mapping for consistency (in case old data exists)
      if (userData.role === 'host') {
        userData.role = 'owner';
        localStorage.setItem('user', JSON.stringify(userData)); // Update localStorage
      } else if (userData.role === 'guest') {
        userData.role = 'renter';
        localStorage.setItem('user', JSON.stringify(userData)); // Update localStorage
      }
      
      setUser(userData);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Save user and token
      const userData = data.data.user;
      const token = data.data.tokens.accessToken;

      // Add fullName to user object if not already present
      if (!userData.fullName && userData.profile) {
        userData.fullName = `${userData.profile.firstName || ''} ${userData.profile.lastName || ''}`.trim() || 'User';
      }

      // Map backend roles to frontend roles for consistency
      // Backend: 'host' -> Frontend: 'owner', Backend: 'guest' -> Frontend: 'renter'
      if (userData.role === 'host') {
        userData.role = 'owner';
      } else if (userData.role === 'guest') {
        userData.role = 'renter';
      }

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  const register = async (registerData) => {
    try {
      // Map frontend role to backend role
      const roleMapping = {
        renter: 'guest',
        owner: 'host',
      };

      const requestData = {
        email: registerData.email,
        password: registerData.password,
        role: roleMapping[registerData.role] || 'guest',
        profile: {
          firstName: registerData.fullName.split(' ')[0],
          lastName: registerData.fullName.split(' ').slice(1).join(' ') || registerData.fullName,
          phone: registerData.phone,
        },
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Get detailed error message
        let errorMessage = 'Đăng ký thất bại';
        
        if (data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        // If there are validation details, show them
        if (data.error?.details && Array.isArray(data.error.details)) {
          errorMessage += ': ' + data.error.details.map(d => d.message).join(', ');
        }
        
        console.error('Registration error details:', data);
        throw new Error(errorMessage);
      }

      // Save user and token
      const userData = data.data.user;
      const token = data.data.tokens.accessToken;

      // Add fullName to user object if not already present
      if (!userData.fullName && userData.profile) {
        userData.fullName = `${userData.profile.firstName || ''} ${userData.profile.lastName || ''}`.trim() || 'User';
      }

      // Map backend roles to frontend roles for consistency
      // Backend: 'host' -> Frontend: 'owner', Backend: 'guest' -> Frontend: 'renter'
      if (userData.role === 'host') {
        userData.role = 'owner';
      } else if (userData.role === 'guest') {
        userData.role = 'renter';
      }

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

