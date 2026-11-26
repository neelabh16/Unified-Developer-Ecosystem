import apiClient from './client';

const enc = (val) => encodeURIComponent(String(val));

export const squadsApi = {
  mine() {
    return apiClient.get('/squads/mine');
  },
  create(payload) {
    return apiClient.post('/squads', payload);
  },
  leave(id) {
    return apiClient.delete(`/squads/${enc(id)}/leave`);
  },
  addMember(id, username) {
    return apiClient.post(`/squads/${enc(id)}/members`, { username });
  },
  registerHackathon(id, hackathonId) {
    return apiClient.post(`/squads/${enc(id)}/hackathons/${enc(hackathonId)}`);
  },
  matches() {
    return apiClient.get('/squads/matches');
  },
};

export const messagesApi = {
  get(handle) {
    return apiClient.get(`/messages/${enc(handle)}`);
  },
  send(handle, text) {
    return apiClient.post(`/messages/${enc(handle)}`, { text });
  },
  delete(handle, messageId) {
    return apiClient.delete(`/messages/${enc(handle)}/${enc(messageId)}`);
  },
};
