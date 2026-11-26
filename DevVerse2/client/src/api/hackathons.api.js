import apiClient from './client';

const enc = (val) => encodeURIComponent(String(val));

export const hackathonsApi = {
  list() {
    return apiClient.get('/hackathons');
  },
  get(id) {
    return apiClient.get(`/hackathons/${enc(id)}`);
  },
  toggleRegister(id) {
    return apiClient.post(`/hackathons/${enc(id)}/register`);
  },
  toggleBookmark(id) {
    return apiClient.post(`/hackathons/${enc(id)}/bookmark`);
  },
};
