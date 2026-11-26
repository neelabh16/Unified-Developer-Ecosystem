import apiClient from './client';

const enc = (val) => encodeURIComponent(String(val));

export const projectsApi = {
  list(params = {}) {
    return apiClient.get('/projects', { params });
  },
  get(id) {
    return apiClient.get(`/projects/${enc(id)}`);
  },
  create(payload) {
    return apiClient.post('/projects', payload);
  },
  update(id, payload) {
    return apiClient.put(`/projects/${enc(id)}`, payload);
  },
  delete(id) {
    return apiClient.delete(`/projects/${enc(id)}`);
  },
  toggleLike(id) {
    return apiClient.post(`/projects/${enc(id)}/like`);
  },
  toggleBookmark(id) {
    return apiClient.post(`/projects/${enc(id)}/bookmark`);
  },
  trackView(id) {
    return apiClient.post(`/projects/${enc(id)}/view`);
  },
  getComments(id) {
    return apiClient.get(`/projects/${enc(id)}/comments`);
  },
  addComment(id, text) {
    return apiClient.post(`/projects/${enc(id)}/comments`, { text });
  },
  deleteComment(id, commentId) {
    return apiClient.delete(`/projects/${enc(id)}/comments/${enc(commentId)}`);
  },
  uploadImage(id, file) {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post(`/projects/${enc(id)}/images`, formData);
  },
};
