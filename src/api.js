// Hamo Client API Service v1.2.4
// Integrates with Hamo-UME Backend v1.2.4
// Production: https://api.hamo.ai/api

const API_BASE_URL = 'https://api.hamo.ai/api';

// Token Management
const TOKEN_KEY = 'hamo_client_access_token';
const REFRESH_TOKEN_KEY = 'hamo_client_refresh_token';
const USER_KEY = 'hamo_client_user';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get stored tokens
  getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Get stored user
  getStoredUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Store tokens
  setTokens(accessToken, refreshToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  // Store user
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Clear tokens and user
  clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Make HTTP request with auto token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = this.getAccessToken();

    console.log('🔵 API Request:', url);

    // Add authorization header if token exists
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      console.log('🔵 Request options:', { method: options.method, headers });

      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('🔵 Response status:', response.status);

      // Handle 401 - Token expired
      if (response.status === 401 && !options.skipAuth) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          return this.request(endpoint, options);
        } else {
          // Refresh failed, clear tokens and throw error
          this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      // Parse response
      let data;
      try {
        data = await response.json();
        console.log('🔵 Response data:', data);
      } catch (parseError) {
        console.error('🔴 Failed to parse response:', parseError);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return {};
      }

      if (!response.ok) {
        // Extract error message from various possible formats
        const errorMessage = data.detail || data.message || data.error ||
          (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('🔴 API Request Error:', error);
      // Ensure we always throw an Error with a string message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error) || 'Unknown error occurred');
    }
  }

  // Register a new client with invitation code
  // The invitation code links the client to a Pro's avatar
  async registerClient(nickname, email, password, invitationCode) {
    try {
      console.log('🔵 Registering Client:', { email, nickname, invitationCode });

      const response = await this.request('/auth/registerClient', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          nickname: nickname,
          email: email,
          password: password,
          invitation_code: invitationCode,
        }),
      });

      console.log('✅ Registration successful:', response);

      // Store tokens
      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token);
      }

      // Store user data
      if (response.user) {
        this.setUser(response.user);
      }

      return {
        success: true,
        user: response.user,
        accessToken: response.access_token,
        // The connected avatar from the invitation code
        connectedAvatar: response.connected_avatar,
      };
    } catch (error) {
      console.error('❌ Registration failed:', error);

      return {
        success: false,
        error: error.message || String(error) || 'Registration failed',
      };
    }
  }

  // Login an existing client
  async loginClient(email, password) {
    try {
      console.log('🔵 Logging in Client:', { email });

      const response = await this.request('/auth/loginClient', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      console.log('✅ Login successful:', response);

      // Store tokens
      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token);
      }

      // Store user data
      if (response.user) {
        this.setUser(response.user);
      }

      return {
        success: true,
        user: response.user,
        accessToken: response.access_token,
        // Connected avatars for this client
        connectedAvatars: response.connected_avatars || [],
      };
    } catch (error) {
      console.error('❌ Login failed:', error);

      return {
        success: false,
        error: error.message || String(error) || 'Login failed',
      };
    }
  }

  // Refresh access token
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await this.request('/auth/refreshClient', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Logout client
  async logout() {
    this.clearTokens();
    return { success: true };
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Validate invitation code (check if it's valid before registration)
  async validateInvitationCode(invitationCode) {
    try {
      console.log('🔵 Validating invitation code:', invitationCode);

      const response = await this.request('/client/invitation/validate', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          invitation_code: invitationCode,
        }),
      });

      console.log('✅ Invitation code validation:', response);

      return {
        success: true,
        valid: response.valid,
        proAvatar: response.pro_avatar,
      };
    } catch (error) {
      console.error('❌ Invitation code validation failed:', error);

      return {
        success: false,
        valid: false,
        error: error.message,
      };
    }
  }

  // Get client's connected avatars
  async getConnectedAvatars() {
    try {
      const response = await this.request('/client/avatars', {
        method: 'GET',
      });

      return {
        success: true,
        avatars: response.avatars || [],
      };
    } catch (error) {
      console.error('❌ Failed to get connected avatars:', error);

      return {
        success: false,
        avatars: [],
        error: error.message,
      };
    }
  }

  // Connect with a new avatar using invitation code
  async connectWithAvatar(invitationCode) {
    try {
      console.log('🔵 Connecting with avatar using code:', invitationCode);

      const response = await this.request('/client/avatar/connect', {
        method: 'POST',
        body: JSON.stringify({
          invitation_code: invitationCode,
        }),
      });

      console.log('✅ Avatar connection successful:', response);

      return {
        success: true,
        avatar: response.avatar,
      };
    } catch (error) {
      console.error('❌ Avatar connection failed:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update client profile
  async updateProfile(profileData) {
    try {
      const response = await this.request('/client/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      // Update stored user
      if (response.user) {
        this.setUser(response.user);
      }

      return {
        success: true,
        user: response.user,
      };
    } catch (error) {
      console.error('❌ Profile update failed:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete client account
  async deleteAccount() {
    try {
      await this.request('/client/account', {
        method: 'DELETE',
      });

      this.clearTokens();

      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Account deletion failed:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
