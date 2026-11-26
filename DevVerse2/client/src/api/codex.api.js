import apiClient from './client';

const enc = (val) => encodeURIComponent(String(val));

export const codexApi = {
  list(params = {}) {
    return apiClient.get('/codex', { params });
  },
  status() {
    return apiClient.get('/codex/status');
  },
  get(id) {
    return apiClient.get(`/codex/${enc(id)}`);
  },
  create(payload) {
    return apiClient.post('/codex', payload);
  },
  update(id, payload) {
    return apiClient.put(`/codex/${enc(id)}`, payload);
  },
  delete(id) {
    return apiClient.delete(`/codex/${enc(id)}`);
  },
};
