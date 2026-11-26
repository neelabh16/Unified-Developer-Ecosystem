import apiClient from './client';

export const uploadsApi = {
  avatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/uploads/avatar', formData);
  },
  image(file) {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/uploads/image', formData);
  },
};
