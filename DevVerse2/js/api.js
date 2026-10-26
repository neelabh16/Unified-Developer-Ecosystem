/* =========================================================
   DEVVERSE — CLIENT API HELPER
   Vanilla JavaScript client for backend REST API (/api/v1).
   Handles HttpOnly cookie credentials, JSON parsing, error
   states, network degradation, and unified responses.
   ========================================================= */

const DV_API_BASE = window.DV_API_URL || 'http://localhost:5000/api/v1';

const DVApi = {
  baseURL: DV_API_BASE,

  /**
   * Core HTTP request handler.
   * @param {string} endpoint
   * @param {object} [options]
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const config = {
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...options.headers },
      credentials: 'include', // Essential for HttpOnly JWT cookies
      ...options,
    };

    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = { success: response.ok, message: response.statusText };
      }

      if (!response.ok) {
        const errorMsg = data && data.message ? data.message : `Request failed with status ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const offlineError = new Error('Backend server is unreachable. Please check if the API server is running on port 5000.');
        offlineError.isOffline = true;
        throw offlineError;
      }
      throw err;
    }
  },

  // ---------------------------------------------------------
  // Auth API
  // ---------------------------------------------------------
  auth: {
    register: (payload) => DVApi.request('/auth/register', { method: 'POST', body: payload }),
    login: (payload) => DVApi.request('/auth/login', { method: 'POST', body: payload }),
    logout: () => DVApi.request('/auth/logout', { method: 'POST' }),
    me: () => DVApi.request('/auth/me'),
    changePassword: (payload) => DVApi.request('/auth/change-password', { method: 'PUT', body: payload }),
  },

  // ---------------------------------------------------------
  // Users & Profiles API
  // ---------------------------------------------------------
  users: {
    getProfile: (username) => DVApi.request(`/users/${encodeURIComponent(username)}`),
    updateProfile: (payload) => DVApi.request('/users/profile', { method: 'PUT', body: payload }),
    updateUsername: (newUsername) => DVApi.request('/users/username', { method: 'PUT', body: { newUsername } }),
    toggleFollow: (username) => DVApi.request(`/users/${encodeURIComponent(username)}/follow`, { method: 'POST' }),
    getFollowing: () => DVApi.request('/users/me/following'),
  },

  // ---------------------------------------------------------
  // Projects API
  // ---------------------------------------------------------
  projects: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return DVApi.request(`/projects${qs ? '?' + qs : ''}`);
    },
    get: (id) => DVApi.request(`/projects/${encodeURIComponent(id)}`),
    create: (payload) => DVApi.request('/projects', { method: 'POST', body: payload }),
    update: (id, payload) => DVApi.request(`/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
    delete: (id) => DVApi.request(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    toggleLike: (id) => DVApi.request(`/projects/${encodeURIComponent(id)}/like`, { method: 'POST' }),
    toggleBookmark: (id) => DVApi.request(`/projects/${encodeURIComponent(id)}/bookmark`, { method: 'POST' }),
    trackView: (id) => DVApi.request(`/projects/${encodeURIComponent(id)}/view`, { method: 'POST' }),
    getComments: (id) => DVApi.request(`/projects/${encodeURIComponent(id)}/comments`),
    addComment: (id, text) => DVApi.request(`/projects/${encodeURIComponent(id)}/comments`, { method: 'POST', body: { text } }),
    deleteComment: (id, commentId) => DVApi.request(`/projects/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' }),
  },

  // ---------------------------------------------------------
  // Communities & Forums API
  // ---------------------------------------------------------
  communities: {
    list: () => DVApi.request('/communities'),
    get: (id) => DVApi.request(`/communities/${encodeURIComponent(id)}`),
    toggleJoin: (id) => DVApi.request(`/communities/${encodeURIComponent(id)}/join`, { method: 'POST' }),
    getDiscussions: (id) => DVApi.request(`/communities/${encodeURIComponent(id)}/discussions`),
    createDiscussion: (id, payload) => DVApi.request(`/communities/${encodeURIComponent(id)}/discussions`, { method: 'POST', body: payload }),
  },

  // ---------------------------------------------------------
  // Discussions API
  // ---------------------------------------------------------
  discussions: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return DVApi.request(`/discussions${qs ? '?' + qs : ''}`);
    },
    get: (id) => DVApi.request(`/discussions/${encodeURIComponent(id)}`),
    update: (id, payload) => DVApi.request(`/discussions/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
    delete: (id) => DVApi.request(`/discussions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    addReply: (id, text) => DVApi.request(`/discussions/${encodeURIComponent(id)}/replies`, { method: 'POST', body: { text } }),
    deleteReply: (id, replyId) => DVApi.request(`/discussions/${encodeURIComponent(id)}/replies/${encodeURIComponent(replyId)}`, { method: 'DELETE' }),
  },

  // ---------------------------------------------------------
  // Codex API
  // ---------------------------------------------------------
  codex: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return DVApi.request(`/codex${qs ? '?' + qs : ''}`);
    },
    status: () => DVApi.request('/codex/status'),
    get: (id) => DVApi.request(`/codex/${encodeURIComponent(id)}`),
    create: (payload) => DVApi.request('/codex', { method: 'POST', body: payload }),
    update: (id, payload) => DVApi.request(`/codex/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
    delete: (id) => DVApi.request(`/codex/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },

  // ---------------------------------------------------------
  // Hackathons API
  // ---------------------------------------------------------
  hackathons: {
    list: () => DVApi.request('/hackathons'),
    get: (id) => DVApi.request(`/hackathons/${encodeURIComponent(id)}`),
    toggleRegister: (id) => DVApi.request(`/hackathons/${encodeURIComponent(id)}/register`, { method: 'POST' }),
    toggleBookmark: (id) => DVApi.request(`/hackathons/${encodeURIComponent(id)}/bookmark`, { method: 'POST' }),
  },

  // ---------------------------------------------------------
  // Portfolio API
  // ---------------------------------------------------------
  portfolios: {
    get: (handle) => DVApi.request(`/portfolios/${encodeURIComponent(handle)}`),
    save: (payload) => DVApi.request('/portfolios/me', { method: 'PUT', body: payload }),
  },

  // ---------------------------------------------------------
  // Squads API
  // ---------------------------------------------------------
  squads: {
    mine: () => DVApi.request('/squads/mine'),
    create: (payload) => DVApi.request('/squads', { method: 'POST', body: payload }),
    leave: (id) => DVApi.request(`/squads/${encodeURIComponent(id)}/leave`, { method: 'DELETE' }),
    addMember: (id, username) => DVApi.request(`/squads/${encodeURIComponent(id)}/members`, { method: 'POST', body: { username } }),
    registerHackathon: (id, hackathonId) => DVApi.request(`/squads/${encodeURIComponent(id)}/hackathons/${encodeURIComponent(hackathonId)}`, { method: 'POST' }),
    matches: () => DVApi.request('/squads/matches'),
  },

  // ---------------------------------------------------------
  // Messages API
  // ---------------------------------------------------------
  messages: {
    get: (handle) => DVApi.request(`/messages/${encodeURIComponent(handle)}`),
    send: (handle, text) => DVApi.request(`/messages/${encodeURIComponent(handle)}`, { method: 'POST', body: { text } }),
    delete: (handle, messageId) => DVApi.request(`/messages/${encodeURIComponent(handle)}/${encodeURIComponent(messageId)}`, { method: 'DELETE' }),
  },

  // ---------------------------------------------------------
  // Bookmarks API
  // ---------------------------------------------------------
  bookmarks: {
    get: () => DVApi.request('/bookmarks'),
  },

  // ---------------------------------------------------------
  // Activity & Points API
  // ---------------------------------------------------------
  activity: {
    mine: () => DVApi.request('/activity/me'),
    feed: () => DVApi.request('/activity/feed'),
  },

  // ---------------------------------------------------------
  // Leaderboard API
  // ---------------------------------------------------------
  leaderboard: {
    get: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return DVApi.request(`/leaderboard${qs ? '?' + qs : ''}`);
    },
  },

  // ---------------------------------------------------------
  // Health API
  // ---------------------------------------------------------
  health: {
    check: () => DVApi.request('/health'),
  },

  // ---------------------------------------------------------
  // Uploads API
  // ---------------------------------------------------------
  uploads: {
    avatar: (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return DVApi.request('/uploads/avatar', {
        method: 'POST',
        body: formData,
      });
    },
  },
};

// Expose globally
window.DVApi = DVApi;
