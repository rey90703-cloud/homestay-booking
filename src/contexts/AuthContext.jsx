import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import API_BASE_URL from '../config/api';

const AuthContext = createContext();

const API_URL = API_BASE_URL;

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
      // Skip mapping for admin role
      if (userData.role === 'host') {
        userData.role = 'owner';
        localStorage.setItem('user', JSON.stringify(userData)); // Update localStorage
      } else if (userData.role === 'guest') {
        userData.role = 'renter';
        localStorage.setItem('user', JSON.stringify(userData)); // Update localStorage
      }
      // Keep 'admin' role as is

      // Ensure fullName is set from profile if missing
      if (!userData.fullName && userData.profile) {
        userData.fullName = `${userData.profile.firstName || ''} ${userData.profile.lastName || ''}`.trim() || 'User';
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
      // Keep 'admin' role unchanged
      if (userData.role === 'host') {
        userData.role = 'owner';
      } else if (userData.role === 'guest') {
        userData.role = 'renter';
      }
      // admin role stays as 'admin'

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

      // Split fullName into firstName and lastName properly
      const nameParts = registerData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const requestData = {
        email: registerData.email,
        password: registerData.password,
        role: roleMapping[registerData.role] || 'guest',
        profile: {
          firstName: firstName,
          lastName: lastName,
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
      // Keep 'admin' role unchanged
      if (userData.role === 'host') {
        userData.role = 'owner';
      } else if (userData.role === 'guest') {
        userData.role = 'renter';
      }
      // admin role stays as 'admin'

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

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gửi email thất bại');
      }

      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: error.message };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          otp,
          password: newPassword,
          confirmPassword: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Get detailed error message from validation
        let errorMessage = 'Đặt lại mật khẩu thất bại';
        
        if (data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        // If there are validation details, show them
        if (data.error?.details && Array.isArray(data.error.details)) {
          errorMessage += ': ' + data.error.details.map(d => d.message).join(', ');
        }
        
        throw new Error(errorMessage);
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: error.message };
    }
  };

  const googleLogin = async (role = 'renter') => {
    try {
      // Open Google login popup
      const result = await signInWithPopup(auth, googleProvider);

      // Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // Map frontend role to backend role
      const roleMapping = {
        renter: 'guest',
        owner: 'host',
      };

      // Send token to backend for verification with selected role
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          role: roleMapping[role] || 'guest'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }

      // Save user and token
      const userData = data.data.user;
      const token = data.data.accessToken;

      // Add fullName to user object if not already present
      if (!userData.fullName && userData.profile) {
        userData.fullName = `${userData.profile.firstName || ''} ${userData.profile.lastName || ''}`.trim() || 'User';
      }

      // Map backend roles to frontend roles for consistency
      if (userData.role === 'host') {
        userData.role = 'owner';
      } else if (userData.role === 'guest') {
        userData.role = 'renter';
      }

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      
      // Handle popup closed by user
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'Đã hủy đăng nhập' };
      }
      
      return { success: false, message: error.message || 'Đăng nhập Google thất bại' };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

