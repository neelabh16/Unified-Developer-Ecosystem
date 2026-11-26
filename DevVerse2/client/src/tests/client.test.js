import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient, {
  getAuthToken,
  setAuthToken,
  setUnauthorizedHandler,
} from '../api/client';
import { githubApi } from '../api/github.api';
import { usersApi } from '../api/users.api';

describe('API client & Axios interceptors', () => {
  beforeEach(() => {
    setAuthToken(null);
    setUnauthorizedHandler(null);
    document.cookie = 'dv_jwt=; path=/; max-age=0';
  });

  it('stores and retrieves auth token in memory and cookie', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('jwt-test-123');
    expect(getAuthToken()).toBe('jwt-test-123');
    expect(document.cookie).toContain('dv_jwt=jwt-test-123');
  });

  it('attaches Bearer token and strips Content-Type for FormData in request interceptor', async () => {
    setAuthToken('abc-token');
    const reqHandlers = apiClient.interceptors.request.handlers;
    const handler = reqHandlers[reqHandlers.length - 1].fulfilled;

    const jsonConfig = await handler({ headers: {}, data: { hello: 'world' } });
    expect(jsonConfig.headers.Authorization).toBe('Bearer abc-token');

    const fd = new FormData();
    fd.append('file', 'blob');
    const fdConfig = await handler({
      headers: { 'Content-Type': 'application/json' },
      data: fd,
    });
    expect(fdConfig.headers.Authorization).toBe('Bearer abc-token');
    expect(fdConfig.headers['Content-Type']).toBeUndefined();
  });

  it('unwraps response.data on success', async () => {
    const resHandlers = apiClient.interceptors.response.handlers;
    const fulfilled = resHandlers[resHandlers.length - 1].fulfilled;

    const payload = { success: true, data: { ok: 1 } };
    expect(fulfilled({ data: payload })).toEqual(payload);
  });

  it('normalizes offline network errors', async () => {
    const resHandlers = apiClient.interceptors.response.handlers;
    const rejected = resHandlers[resHandlers.length - 1].rejected;

    await expect(rejected({ message: 'Network Error' })).rejects.toMatchObject({
      status: 0,
      isOffline: true,
    });
  });

  it('fires unauthorizedHandler on 401 for protected endpoints but skips auth endpoints', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    const resHandlers = apiClient.interceptors.response.handlers;
    const rejected = resHandlers[resHandlers.length - 1].rejected;

    const skippedUrls = [
      '/auth/me',
      '/auth/login',
      '/auth/register',
      '/auth/signup',
      '/auth/logout',
    ];

    for (const url of skippedUrls) {
      setAuthToken('temp-token');
      await expect(
        rejected({
          config: { url },
          response: { status: 401, data: { message: 'Unauthorized' } },
        })
      ).rejects.toMatchObject({ status: 401 });
      expect(getAuthToken()).toBeNull();
    }
    expect(onUnauthorized).not.toHaveBeenCalled();

    setAuthToken('temp-token');
    await expect(
      rejected({
        config: { url: '/projects' },
        response: { status: 401, data: { message: 'Session expired' } },
      })
    ).rejects.toMatchObject({ status: 401, message: 'Session expired' });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('preserves active token and skips unauthorizedHandler on 401 from /auth/change-password', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    setAuthToken('active-user-jwt');

    const resHandlers = apiClient.interceptors.response.handlers;
    const rejected = resHandlers[resHandlers.length - 1].rejected;

    await expect(
      rejected({
        config: { url: '/auth/change-password' },
        response: {
          status: 401,
          data: { message: 'Current password does not match.' },
        },
      })
    ).rejects.toMatchObject({
      status: 401,
      message: 'Current password does not match.',
    });

    expect(getAuthToken()).toBe('active-user-jwt');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('calls exact backend GitHub routes matching githubRoutes.js', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ success: true });

    await githubApi.getUser('octocat');
    await githubApi.getContributions('octocat');
    await githubApi.getEvents('octocat');
    await githubApi.getRepos('octocat');
    await githubApi.getRepo('octocat', 'hello-world');

    expect(getSpy).toHaveBeenNthCalledWith(1, '/github/user/octocat');
    expect(getSpy).toHaveBeenNthCalledWith(2, '/github/user/octocat/contributions');
    expect(getSpy).toHaveBeenNthCalledWith(3, '/github/user/octocat/events');
    expect(getSpy).toHaveBeenNthCalledWith(4, '/github/user/octocat/repos');
    expect(getSpy).toHaveBeenNthCalledWith(5, '/github/repo/octocat/hello-world');
  });

  it('sends { newUsername } payload in usersApi.updateUsername', async () => {
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue({ success: true });

    await usersApi.updateUsername('legend_dev');

    expect(putSpy).toHaveBeenCalledWith('/users/username', {
      newUsername: 'legend_dev',
    });
  });

  it('blocks invalid "you" fallback in githubApi', () => {
    expect(() => githubApi.getUser('you')).toThrow();
    expect(() => githubApi.getUser('')).toThrow();
    expect(() => githubApi.getContributions('YOU')).toThrow();
  });
});
