import apiClient from './client';

const enc = (val) => encodeURIComponent(String(val));

export const communitiesApi = {
  list() {
    return apiClient.get('/communities');
  },
  get(id) {
    return apiClient.get(`/communities/${enc(id)}`);
  },
  toggleJoin(id) {
    return apiClient.post(`/communities/${enc(id)}/join`);
  },
  getDiscussions(id) {
    return apiClient.get(`/communities/${enc(id)}/discussions`);
  },
  createDiscussion(id, payload) {
    return apiClient.post(`/communities/${enc(id)}/discussions`, payload);
  },
};

export const discussionsApi = {
  list(params = {}) {
    return apiClient.get('/discussions', { params });
  },
  get(id) {
    return apiClient.get(`/discussions/${enc(id)}`);
  },
  update(id, payload) {
    return apiClient.put(`/discussions/${enc(id)}`, payload);
  },
  delete(id) {
    return apiClient.delete(`/discussions/${enc(id)}`);
  },
  addReply(id, text) {
    return apiClient.post(`/discussions/${enc(id)}/replies`, { text });
  },
  deleteReply(id, replyId) {
    return apiClient.delete(`/discussions/${enc(id)}/replies/${enc(replyId)}`);
  },
};
