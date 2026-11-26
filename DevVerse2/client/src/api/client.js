import axios from 'axios';

const TOKEN_COOKIE_NAME = 'dv_jwt';
const TOKEN_MAX_AGE_SECONDS = 604800; // 7 days

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function writeCookie(name, value, maxAgeSeconds) {
  if (typeof document === 'undefined') return;
  if (value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  } else {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

let memoryToken = readCookie(TOKEN_COOKIE_NAME);
let unauthorizedHandler = null;

export function getAuthToken() {
  if (!memoryToken) {
    memoryToken = readCookie(TOKEN_COOKIE_NAME);
  }
  return memoryToken;
}

export function setAuthToken(token) {
  memoryToken = token || null;
  writeCookie(TOKEN_COOKIE_NAME, memoryToken, TOKEN_MAX_AGE_SECONDS);
}

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null;
}

const SKIP_401_PATHS = [
  '/auth/me',
  '/auth/login',
  '/auth/register',
  '/auth/signup',
  '/auth/logout',
  '/auth/change-password',
];

const PRESERVE_TOKEN_401_PATHS = ['/auth/change-password'];

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const nextConfig = { ...config };
    nextConfig.headers = nextConfig.headers || {};

    const token = getAuthToken();
    if (token) {
      nextConfig.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof FormData !== 'undefined' && nextConfig.data instanceof FormData) {
      delete nextConfig.headers['Content-Type'];
    }

    return nextConfig;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      const offlineError = new Error(
        'Backend server is unreachable. Please verify the API server is running.'
      );
      offlineError.status = 0;
      offlineError.isOffline = true;
      offlineError.errors = null;
      offlineError.data = null;
      return Promise.reject(offlineError);
    }

    const { status, data } = error.response;
    const message =
      data?.message || error.message || `Request failed with status ${status}`;

    if (status === 401) {
      const reqUrl = String(error.config?.url || '');
      const shouldPreserveToken = PRESERVE_TOKEN_401_PATHS.some((path) =>
        reqUrl.includes(path)
      );
      if (!shouldPreserveToken) {
        setAuthToken(null);
      }
      const shouldSkipLogoutHandler = SKIP_401_PATHS.some((path) =>
        reqUrl.includes(path)
      );
      if (!shouldSkipLogoutHandler && unauthorizedHandler) {
        unauthorizedHandler();
      }
    }

    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.errors = data?.errors || null;
    normalizedError.data = data || null;
    normalizedError.isOffline = false;
    return Promise.reject(normalizedError);
  }
);

export default apiClient;
