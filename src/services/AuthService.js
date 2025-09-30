// Enhanced Auth Service for Laravel backend integration
class AuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    this.apiURL = `${this.baseURL}/api`;
    this.token = localStorage.getItem('auth_token');
    this.user = null;
    
    // Initialize user from token if exists
    if (this.token) {
      this.loadUserFromToken();
    }
  }

  // Set authorization headers
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : '',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  // Login with email and password
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiURL}/auth/login`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return this.handleAuthSuccess(data.data);
      } else {
        return {
          success: false,
          error: data.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }

  // Register new user
  async register(name, email, password, passwordConfirmation) {
    try {
      const response = await fetch(`${this.apiURL}/auth/register`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return this.handleAuthSuccess(data.data);
      } else {
        return {
          success: false,
          error: data.message || 'Registration failed',
          errors: data.errors || {}
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }

  // Google OAuth login
  async loginWithGoogle(idToken) {
    try {
      const response = await fetch(`${this.apiURL}/auth/google`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          id_token: idToken
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return this.handleAuthSuccess(data.data);
      } else {
        return {
          success: false,
          error: data.message || 'Google authentication failed'
        };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        error: 'Network error during Google authentication.'
      };
    }
  }

  // Get Google OAuth URL for redirect
  async getGoogleAuthUrl() {
    try {
      const response = await fetch(`${this.apiURL}/auth/google/url`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          url: data.url
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to get Google auth URL'
        };
      }
    } catch (error) {
      console.error('Google auth URL error:', error);
      return {
        success: false,
        error: 'Failed to get Google authentication URL'
      };
    }
  }

  // Handle Google OAuth callback
  async handleGoogleCallback(code, state) {
    try {
      const response = await fetch(`${this.apiURL}/auth/google/callback`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          code,
          state
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return this.handleAuthSuccess(data);
      } else {
        return {
          success: false,
          error: data.message || 'Google callback failed'
        };
      }
    } catch (error) {
      console.error('Google callback error:', error);
      return {
        success: false,
        error: 'Failed to process Google authentication'
      };
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.token) {
        await fetch(`${this.apiURL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      return { success: true };
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await fetch(`${this.apiURL}/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        localStorage.setItem('auth_token', this.token);
        return {
          success: true,
          token: this.token
        };
      } else {
        this.clearAuthData();
        return {
          success: false,
          error: 'Token refresh failed'
        };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      return {
        success: false,
        error: 'Network error during token refresh'
      };
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.apiURL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.user = data.data.user;
        return {
          success: true,
          user: this.user
        };
      } else {
        if (response.status === 401) {
          this.clearAuthData();
        }
        return {
          success: false,
          error: data.message || 'Failed to get user profile'
        };
      }
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: 'Network error while fetching user profile'
      };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      const response = await fetch(`${this.apiURL}/auth/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.user = { ...this.user, ...data.user };
        return {
          success: true,
          user: this.user
        };
      } else {
        return {
          success: false,
          error: data.message || 'Profile update failed',
          errors: data.errors || {}
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Network error during profile update'
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword, newPasswordConfirmation) {
    try {
      const response = await fetch(`${this.apiURL}/auth/password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPasswordConfirmation
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.message || 'Password change failed',
          errors: data.errors || {}
        };
      }
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'Network error during password change'
      };
    }
  }

  // Link Google account to existing user
  async linkGoogleAccount(googleToken) {
    try {
      const response = await fetch(`${this.apiURL}/auth/link-google`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          google_token: googleToken
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.user = data.user;
        return {
          success: true,
          user: this.user,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to link Google account'
        };
      }
    } catch (error) {
      console.error('Link Google account error:', error);
      return {
        success: false,
        error: 'Network error while linking Google account'
      };
    }
  }

  // Unlink Google account
  async unlinkGoogleAccount() {
    try {
      const response = await fetch(`${this.apiURL}/auth/unlink-google`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.user = data.user;
        return {
          success: true,
          user: this.user,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to unlink Google account'
        };
      }
    } catch (error) {
      console.error('Unlink Google account error:', error);
      return {
        success: false,
        error: 'Network error while unlinking Google account'
      };
    }
  }

  // Password reset request
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${this.apiURL}/auth/password/reset`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      return {
        success: response.ok && data.success,
        message: data.message,
        error: data.success ? null : (data.message || 'Password reset request failed')
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: 'Network error during password reset request'
      };
    }
  }

  // Reset password with token
  async resetPassword(token, email, password, passwordConfirmation) {
    try {
      const response = await fetch(`${this.apiURL}/auth/password/reset/confirm`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation
        })
      });

      const data = await response.json();

      return {
        success: response.ok && data.success,
        message: data.message,
        error: data.success ? null : (data.message || 'Password reset failed')
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Network error during password reset'
      };
    }
  }

  // Handle successful authentication
  handleAuthSuccess(data) {
    this.token = data.token;
    this.user = data.user;
    
    // Store token in localStorage
    localStorage.setItem('auth_token', this.token);
    
    return {
      success: true,
      user: this.user,
      token: this.token
    };
  }

  // Load user from stored token
  async loadUserFromToken() {
    if (this.token) {
      const result = await this.getCurrentUser();
      return result.success;
    }
    return false;
  }

  // Clear authentication data
  clearAuthData() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Get auth token
  getToken() {
    return this.token;
  }

  // Auto-refresh token before expiration
  startTokenRefreshTimer() {
    // Refresh token every 50 minutes (assuming 60min expiry)
    setInterval(async () => {
      if (this.token) {
        await this.refreshToken();
      }
    }, 50 * 60 * 1000);
  }
}

// Create singleton instance
const authService = new AuthService();

// Start token refresh timer
authService.startTokenRefreshTimer();

export default authService;