import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { bootstrapToken, setAccessToken, getAccessToken } from '../lib/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Ensure token is applied to axios defaults synchronously
  bootstrapToken();
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAccessToken());
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set axios default headers when token changes
  useEffect(() => {
    if (token) {
      setAccessToken(token);
    } else {
      setAccessToken(null);
    }
  }, [token]);

  // Check if token is valid on app start
  useEffect(() => {
    const verifyToken = async () => {
      if (getAccessToken()) {
        try {
          const response = await api.get('/auth/verify');
          setUser(response.data.user);
        } catch (error) {
          console.error('Token verification failed:', error);
          setTokenState(null);
          setUser(null);
        }
      }
      setLoading(false);
      setAuthReady(true);
    };

    verifyToken();
  }, [token]);

  // Resident registration
  const registerResident = async (formData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register/resident', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Return the response data directly for the new atomic flow
      return response.data;
    } catch (error) {
      let message = 'Registration failed';
      let fieldErrors = {};
      
      if (error.response?.data) {
        const data = error.response.data;
        message = data.message || message;
        
        // Handle field-specific errors from the new atomic backend
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          fieldErrors = data.fieldErrors;
        }
        
        // Handle legacy array format errors (fallback)
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => {
            fieldErrors[err.field] = err.message;
          });
        }
        
        // Handle single field errors (like duplicate email)
        if (data.field) {
          fieldErrors[data.field] = data.details || message;
        }
      }
      
      setError(message);
      throw new Error(JSON.stringify({ message, fieldErrors }));
    }
  };

  // Admin registration
  const registerAdmin = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register/admin', userData);
      
      if (response.data.token) {
        setTokenState(response.data.token);
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Login
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.token) {
        setTokenState(response.data.token);
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setTokenState(null);
      setUser(null);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.user) {
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Update profile picture
  const updateProfilePicture = async (profilePicture) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('profile_picture', profilePicture);

      const response = await api.put('/auth/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.user) {
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile picture';
      setError(message);
      throw new Error(message);
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      setError(null);
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Get profile
  const getProfile = async () => {
    try {
      setError(null);
      const response = await api.get('/auth/profile');
      
      if (response.data.user) {
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to get profile';
      setError(message);
      throw new Error(message);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    authReady,
    error,
    registerResident,
    registerAdmin,
    login,
    logout,
    updateProfile,
    updateProfilePicture,
    changePassword,
    getProfile,
    clearError,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isResident: user?.role === 'resident',
    isVerified: user?.is_verified || user?.role === 'admin',
    isApproved: user?.status === 'approved' || user?.role === 'admin',
    isPending: user?.status === 'pending' && user?.role === 'resident'
  };

  return (
    <AuthContext.Provider value={value}>
      {authReady ? children : <div className="loading">Loading...</div>}
    </AuthContext.Provider>
  );
};
