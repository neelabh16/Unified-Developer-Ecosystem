import apiClient from './client';

const enc = (val) => encodeURIComponent(String(val));

function assertValidUsername(username) {
  const trimmed = String(username || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'you') {
    throw new Error('A valid GitHub or DevVerse username is required.');
  }
  return trimmed;
}

export const githubApi = {
  getUser(username) {
    const clean = assertValidUsername(username);
    return apiClient.get(`/github/user/${enc(clean)}`);
  },
  getContributions(username) {
    const clean = assertValidUsername(username);
    return apiClient.get(`/github/user/${enc(clean)}/contributions`);
  },
  getEvents(username) {
    const clean = assertValidUsername(username);
    return apiClient.get(`/github/user/${enc(clean)}/events`);
  },
  getRepos(username) {
    const clean = assertValidUsername(username);
    return apiClient.get(`/github/user/${enc(clean)}/repos`);
  },
  getRepo(owner, repo) {
    const cleanOwner = assertValidUsername(owner);
    const cleanRepo = String(repo || '').trim();
    if (!cleanRepo) {
      throw new Error('Repository name is required.');
    }
    return apiClient.get(`/github/repo/${enc(cleanOwner)}/${enc(cleanRepo)}`);
  },
};
