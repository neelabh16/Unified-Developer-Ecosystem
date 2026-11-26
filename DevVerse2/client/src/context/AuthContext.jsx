import { createContext, useCallback, useEffect, useReducer, useState } from 'react';
import { useInRouterContext, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import {
  getAuthToken,
  setAuthToken,
  setUnauthorizedHandler,
} from '../api/client';

export const AuthContext = createContext(null);

function RouterOAuthScrubSync({ targetUrl, onSynced }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!targetUrl) return;
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (current !== targetUrl) {
      navigate(targetUrl, { replace: true });
    }
    onSynced();
  }, [targetUrl, location.pathname, location.search, location.hash, navigate, onSynced]);

  return null;
}

const initialState = {
  user: null,
  token: getAuthToken(),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token ?? state.token,
        isAuthenticated: Boolean(action.payload.user),
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload || 'Authentication failed',
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: Boolean(action.payload),
      };
    default:
      return state;
  }
}

function extractUser(res) {
  return res?.data?.user || res?.user || null;
}

function extractToken(res) {
  return res?.data?.token || res?.token || getAuthToken();
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [scrubbedUrl, setScrubbedUrl] = useState(null);
  const inRouter = useInRouterContext();
  const queryClient = useQueryClient();

  const clearScrubbedUrl = useCallback(() => {
    setScrubbedUrl(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch({ type: 'AUTH_LOGOUT' });
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      try {
        if (typeof window !== 'undefined' && window.location.search) {
          const params = new URLSearchParams(window.location.search);
          const oauthStatus = params.get('oauth');
          const oauthToken = params.get('token');
          if (oauthStatus === 'success' && oauthToken) {
            setAuthToken(oauthToken);
            params.delete('oauth');
            params.delete('token');
            params.delete('provider');
            const qs = params.toString();
            const cleanUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
            window.history.replaceState(window.history.state, document.title, cleanUrl);
            if (active) {
              setScrubbedUrl(cleanUrl);
            }
          }
        }

        const res = await authApi.me();
        const user = extractUser(res);
        if (!active) return;
        if (user) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token: getAuthToken() },
          });
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch {
        if (!active) return;
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    }

    bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (credentials) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const res = await authApi.login(credentials);
        const user = extractUser(res);
        const token = extractToken(res);
        if (token) setAuthToken(token);
        queryClient.removeQueries({ queryKey: ['auth'] });
        queryClient.removeQueries({ queryKey: ['activity', 'me'] });
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        return user;
      } catch (err) {
        dispatch({ type: 'AUTH_FAILURE', payload: err.message });
        throw err;
      }
    },
    [queryClient]
  );

  const register = useCallback(
    async (payload) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const res = await authApi.register(payload);
        const user = extractUser(res);
        const token = extractToken(res);
        if (token) setAuthToken(token);
        queryClient.removeQueries({ queryKey: ['auth'] });
        queryClient.removeQueries({ queryKey: ['activity', 'me'] });
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        return user;
      } catch (err) {
        dispatch({ type: 'AUTH_FAILURE', payload: err.message });
        throw err;
      }
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session regardless of network outcome
    } finally {
      setAuthToken(null);
      queryClient.clear();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, [queryClient]);

  const handleOAuthCallback = useCallback(
    async ({ token }) => {
      dispatch({ type: 'AUTH_START' });
      try {
        if (token) {
          setAuthToken(token);
        }
        const res = await authApi.me();
        const user = extractUser(res);
        if (!user) {
          throw new Error('Could not load authenticated profile after OAuth.');
        }
        queryClient.clear();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token: getAuthToken() },
        });
        return user;
      } catch (err) {
        setAuthToken(null);
        dispatch({ type: 'AUTH_FAILURE', payload: err.message });
        throw err;
      }
    },
    [queryClient]
  );

  const refreshUser = useCallback(async () => {
    const res = await authApi.me();
    const user = extractUser(res);
    if (user) {
      dispatch({ type: 'AUTH_UPDATE_USER', payload: user });
    }
    return user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        handleOAuthCallback,
        refreshUser,
      }}
    >
      {inRouter && scrubbedUrl ? (
        <RouterOAuthScrubSync targetUrl={scrubbedUrl} onSynced={clearScrubbedUrl} />
      ) : null}
      {children}
    </AuthContext.Provider>
  );
}
