import apiClient from './client';

export const leaderboardApi = {
  get(params = {}) {
    return apiClient.get('/leaderboard', { params });
  },
};

export const activityApi = {
  mine() {
    return apiClient.get('/activity/me');
  },
  feed(params = {}) {
    return apiClient.get('/activity/feed', { params });
  },
};

export const healthApi = {
  check() {
    return apiClient.get('/health');
  },
};
