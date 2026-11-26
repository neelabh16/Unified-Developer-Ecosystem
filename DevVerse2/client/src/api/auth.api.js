import apiClient, { setAuthToken } from './client';

export const authApi = {
  async register(payload) {
    const res = await apiClient.post('/auth/register', payload);
    if (res?.data?.token) {
      setAuthToken(res.data.token);
    }
    return res;
  },

  async signup(payload) {
    const res = await apiClient.post('/auth/signup', payload);
    if (res?.data?.token) {
      setAuthToken(res.data.token);
    }
    return res;
  },

  async login(payload) {
    const res = await apiClient.post('/auth/login', payload);
    if (res?.data?.token) {
      setAuthToken(res.data.token);
    }
    return res;
  },

  async logout() {
    try {
      return await apiClient.post('/auth/logout');
    } finally {
      setAuthToken(null);
    }
  },

  me() {
    return apiClient.get('/auth/me');
  },

  getProviders() {
    return apiClient.get('/auth/providers');
  },

  changePassword(payload) {
    return apiClient.put('/auth/change-password', payload);
  },

  forgotPassword(identifier) {
    return apiClient.post('/auth/forgot-password', { identifier });
  },

  async resetPassword(payload) {
    const res = await apiClient.post('/auth/reset-password', payload);
    if (res?.data?.token) {
      setAuthToken(res.data.token);
    }
    return res;
  },

  getOAuthUrl(provider, redirectPath = '/') {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const base = import.meta.env.VITE_API_URL || '/api/v1';
    const normalizedRedirect = String(redirectPath || '/').replace(/^\/+/, '');
    const target = normalizedRedirect || 'index.html';
    return `${base}/auth/${encodeURIComponent(provider)}?redirect=${encodeURIComponent(
      target
    )}&client_base=${encodeURIComponent(origin)}`;
  },
};
