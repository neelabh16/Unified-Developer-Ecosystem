import apiClient from './client';

const enc = (val) => encodeURIComponent(String(val));

export const usersApi = {
  getProfile(username) {
    return apiClient.get(`/users/${enc(username)}`);
  },
  updateProfile(payload) {
    return apiClient.put('/users/profile', payload);
  },
  updateUsername(newUsername) {
    return apiClient.put('/users/username', { newUsername });
  },
  toggleFollow(username) {
    return apiClient.post(`/users/${enc(username)}/follow`);
  },
  getFollowing() {
    return apiClient.get('/users/me/following');
  },
};

export const bookmarksApi = {
  get() {
    return apiClient.get('/bookmarks');
  },
  getLikes() {
    return apiClient.get('/bookmarks/likes');
  },
};
