import apiClient from './client';

const enc = (val) => encodeURIComponent(String(val));

export const portfoliosApi = {
  get(handle) {
    return apiClient.get(`/portfolios/${enc(handle)}`);
  },
  save(payload) {
    return apiClient.put('/portfolios/me', payload);
  },
};
