import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated by validating token
      const result = await authService.getCurrentUser();
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      } else {
        // Clear invalid auth data
        authService.clearAuthData();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      authService.clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, passwordConfirmation) => {
    try {
      setLoading(true);
      const result = await authService.register(name, email, password, passwordConfirmation);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken = null) => {
    try {
      setLoading(true);
      
      let result;
      if (googleToken) {
        result = await authService.loginWithGoogle(googleToken);
      } else {
        // Handle Google OAuth flow
        result = await authService.getGoogleAuthUrl();
        if (result.success) {
          // Store auth mode and redirect
          sessionStorage.setItem('google_auth_mode', 'login');
          window.location.href = result.url;
          return { success: true, redirected: true };
        }
      }
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
    return { success: true };
  };

  const updateProfile = async (updates) => {
    try {
      const result = await authService.updateProfile(updates);
      
      if (result.success) {
        setUser(result.user);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword, newPasswordConfirmation) => {
    try {
      return await authService.changePassword(currentPassword, newPassword, newPasswordConfirmation);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const linkGoogleAccount = async (googleToken) => {
    try {
      const result = await authService.linkGoogleAccount(googleToken);
      
      if (result.success) {
        setUser(result.user);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const unlinkGoogleAccount = async () => {
    try {
      const result = await authService.unlinkGoogleAccount();
      
      if (result.success) {
        setUser(result.user);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      return await authService.requestPasswordReset(email);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (token, email, password, passwordConfirmation) => {
    try {
      return await authService.resetPassword(token, email, password, passwordConfirmation);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Handle Google OAuth callback
  const handleGoogleCallback = async (code, state) => {
    try {
      setLoading(true);
      const result = await authService.handleGoogleCallback(code, state);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    changePassword,
    linkGoogleAccount,
    unlinkGoogleAccount,
    requestPasswordReset,
    resetPassword,
    handleGoogleCallback,
    refreshAuth: initializeAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};