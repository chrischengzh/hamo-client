// Hamo Client API Service v1.3.7
// Integrates with Hamo-UME Backend v1.3.7
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
      const data = await response.json();
      console.log('🔵 Response data:', data);

      if (!response.ok) {
        // Handle different error formats from the API
        let errorMessage = 'Request failed';
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // FastAPI validation errors return an array - include field location
          errorMessage = data.detail.map(err => {
            const field = err.loc ? err.loc.join('.') : 'field';
            const msg = err.msg || err.message || JSON.stringify(err);
            return `${field}: ${msg}`;
          }).join('; ');
        } else if (typeof data.detail === 'object' && data.detail !== null) {
          errorMessage = data.detail.message || data.detail.msg || JSON.stringify(data.detail);
        } else if (data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('🔴 API Request Error:', error);
      throw error;
    }
  }

  // Register a new client with invitation code
  // The invitation code links the client to a Pro's avatar
  async registerClient(nickname, email, password, invitationCode) {
    try {
      console.log('🔵 Registration parameters:', {
        nickname,
        email,
        passwordLength: password ? password.length : 0,
        invitationCode
      });

      const requestBody = {
        email: email,
        password: password,
        nickname: nickname,
        invitation_code: invitationCode,
      };

      console.log('🔵 Request body (password masked):', {
        email: requestBody.email,
        password: requestBody.password ? '***' : undefined,
        nickname: requestBody.nickname,
        invitation_code: requestBody.invitation_code,
      });

      const response = await this.request('/auth/registerClient', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(requestBody),
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

      // Log connected avatars for debugging
      // v1.3.6: Backend now returns connected_avatars array (preferred) and connected_avatar (backward compat)
      if (response.connected_avatars && response.connected_avatars.length > 0) {
        console.log('✅ Connected avatars received (array):', response.connected_avatars);
      } else if (response.connected_avatar) {
        console.log('✅ Connected avatar received (single):', response.connected_avatar);
      }

      return {
        success: true,
        user: response.user,
        accessToken: response.access_token,
        // v1.3.6: Prefer connected_avatars array, fallback to single connected_avatar for backward compat
        connectedAvatars: response.connected_avatars || [],
        connectedAvatar: response.connected_avatar,
      };
    } catch (error) {
      console.error('❌ Registration failed:', error);

      return {
        success: false,
        error: error.message,
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
        error: error.message,
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
  // Uses GET /api/client/avatars endpoint (client-specific)
  // Note: The backend needs to implement this endpoint to return all avatars connected to the current client
  async getConnectedAvatars() {
    try {
      console.log('🔵 Fetching connected avatars for client...');
      const response = await this.request('/client/avatars', {
        method: 'GET',
      });

      console.log('✅ Client avatars fetched:', response);

      // Handle both array response and object with avatars property
      const avatars = Array.isArray(response) ? response : (response.avatars || []);

      return {
        success: true,
        avatars: avatars,
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

  // Get all public avatars for discovery (no auth required)
  // Uses GET /api/discover/avatars endpoint (public list)
  // v1.3.7: Fetch real Pro Avatars for Discover page
  async getAllAvatars() {
    try {
      console.log('🔵 Fetching all public avatars...');
      // Use public endpoint - no auth required
      const response = await this.request('/discover/avatars', {
        method: 'GET',
        skipAuth: true,  // No authentication needed for public discovery
      });

      console.log('✅ Public avatars fetched:', response);

      // Handle both array response and object with avatars property
      const avatars = Array.isArray(response) ? response : (response.avatars || []);

      return {
        success: true,
        avatars: avatars,
      };
    } catch (error) {
      console.error('❌ Failed to get public avatars:', error);

      return {
        success: false,
        avatars: [],
        error: error.message,
      };
    }
  }

  // Get a specific avatar by ID
  // Uses GET /api/avatars/{avatar_id} endpoint
  async getAvatarById(avatarId) {
    try {
      console.log('🔵 Fetching avatar by ID:', avatarId);
      const response = await this.request(`/avatars/${avatarId}`, {
        method: 'GET',
      });

      console.log('✅ Avatar fetched:', response);

      return {
        success: true,
        avatar: response,
      };
    } catch (error) {
      console.error('❌ Failed to get avatar:', error);

      return {
        success: false,
        avatar: null,
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

  // v1.3.7: Connect with avatar by ID (from Discover page)
  async connectWithAvatarById(avatarId) {
    try {
      console.log('🔵 Connecting with avatar by ID:', avatarId);

      const response = await this.request('/client/avatar/connect-by-id', {
        method: 'POST',
        body: JSON.stringify({
          avatar_id: avatarId,
        }),
      });

      console.log('✅ Avatar connection successful:', response);

      return {
        success: true,
        avatar: response.avatar || response,
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

  // ============================================================
  // CONVERSATION / CHAT ENDPOINTS (New in v1.4.0)
  // ============================================================

  // Start a new conversation session
  async startSession(mindId, avatarId) {
    try {
      console.log('🔵 Starting conversation session:', { mindId, avatarId });

      const response = await this.request(`/session/start?mind_id=${mindId}&avatar_id=${avatarId}`, {
        method: 'POST',
      });

      console.log('✅ Session started:', response);

      return {
        success: true,
        sessionId: response.session_id,
        psvsPosition: response.initial_psvs_position,
      };
    } catch (error) {
      console.error('❌ Failed to start session:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Send a message in a conversation session
  async sendMessage(sessionId, message, language = 'en', signal = null) {
    try {
      console.log('🔵 Sending message:', { sessionId, message, language });

      const response = await this.request(`/session/${sessionId}/message?message=${encodeURIComponent(message)}&language=${language}`, {
        method: 'POST',
        signal: signal,  // Pass abort signal to fetch
      });

      console.log('✅ Message sent, received response:', response);

      return {
        success: true,
        response: response.response,
        messages: response.messages || [],  // Split message bubbles from backend
        psvsPosition: response.psvs_position,
      };
    } catch (error) {
      // Check if error is an abort error (user cancelled)
      if (error.name === 'AbortError') {
        console.log('ℹ️ Request cancelled by user');
        throw error;  // Re-throw abort errors
      }

      console.error('❌ Failed to send message:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get all messages in a conversation session
  async getSessionMessages(sessionId) {
    try {
      console.log('🔵 Fetching session messages:', sessionId);

      const response = await this.request(`/session/${sessionId}/messages`, {
        method: 'GET',
      });

      console.log('✅ Session messages retrieved:', response);

      return {
        success: true,
        messages: Array.isArray(response) ? response : [], // Backend returns array directly
      };
    } catch (error) {
      console.error('❌ Failed to fetch session messages:', error);

      return {
        success: false,
        error: error.message,
        messages: [],
      };
    }
  }

  // End a conversation session
  async endSession(sessionId) {
    try {
      console.log('🔵 Ending session:', sessionId);

      const response = await this.request(`/session/${sessionId}/end`, {
        method: 'POST',
      });

      console.log('✅ Session ended:', response);

      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Failed to end session:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // v1.4.8: Update session visibility (whether Pro can see the conversation)
  async updateSessionVisibility(sessionId, isProVisible) {
    try {
      console.log('🔵 Updating session visibility:', { sessionId, isProVisible });

      const response = await this.request(`/session/${sessionId}/visibility`, {
        method: 'PUT',
        body: JSON.stringify({
          pro_visible: isProVisible,
        }),
      });

      console.log('✅ Session visibility updated:', response);

      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Failed to update session visibility:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Cancel the last AI response in a session (when user cancels request)
  async cancelLastResponse(sessionId) {
    try {
      console.log('🔵 Cancelling last response:', sessionId);

      const response = await this.request(`/session/${sessionId}/cancel-last-response`, {
        method: 'DELETE',
      });

      console.log('✅ Last response cancelled:', response);

      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Failed to cancel last response:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get AI Mind by user and avatar ID
  async getAIMind(userId, avatarId) {
    try {
      console.log('🔵 Fetching AI Mind:', { userId, avatarId });

      const response = await this.request(`/mind/${userId}/${avatarId}`, {
        method: 'GET',
      });

      console.log('✅ AI Mind retrieved:', response);

      return {
        success: true,
        mind: response,
      };
    } catch (error) {
      console.error('❌ Failed to fetch AI Mind:', error);

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
