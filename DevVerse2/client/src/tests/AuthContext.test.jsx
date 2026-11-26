import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { getAuthToken, setAuthToken } from '../api/client';

vi.mock('../api/auth.api', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

function AuthProbe() {
  const { user, isAuthenticated, isLoading, login, register, logout, handleOAuthCallback } =
    useAuth();
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authed">{String(isAuthenticated)}</div>
      <div data-testid="username">{user?.username || 'none'}</div>
      <button
        type="button"
        onClick={() => login({ identifier: 'ada@dev.io', password: 'Password1!' })}
      >
        DoLogin
      </button>
      <button
        type="button"
        onClick={() =>
          register({
            name: 'Ada',
            username: 'ada_new',
            email: 'ada@dev.io',
            password: 'Password1!',
          })
        }
      >
        DoRegister
      </button>
      <button type="button" onClick={() => logout()}>
        DoLogout
      </button>
      <button
        type="button"
        onClick={() => handleOAuthCallback({ token: 'oauth-jwt-123' })}
      >
        DoOAuth
      </button>
    </div>
  );
}

function RouterLocationProbe() {
  const loc = useLocation();
  return <div data-testid="router-search">{loc.search}</div>;
}

function renderWithAuth(qcArg) {
  const qc =
    qcArg ||
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  return {
    qc,
    ...render(
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </QueryClientProvider>
    ),
  };
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthToken(null);
    window.history.replaceState({}, '', '/');
  });

  it('hydrates authenticated user from /auth/me on mount', async () => {
    authApi.me.mockResolvedValue({
      data: { user: { _id: 'u1', username: 'adalovelace', points: 220 } },
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authed')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('adalovelace');
  });

  it('falls back cleanly to guest state when /auth/me rejects', async () => {
    authApi.me.mockRejectedValue(new Error('Unauthorized'));

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
  });

  it('handles login, OAuth callback, and logout transitions', async () => {
    authApi.me.mockRejectedValueOnce(new Error('Not logged in'));
    authApi.login.mockResolvedValue({
      data: { user: { _id: 'u2', username: 'linus' }, token: 'jwt-linus' },
    });
    authApi.logout.mockResolvedValue({ success: true });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('DoLogin').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authed')).toHaveTextContent('true');
      expect(screen.getByTestId('username')).toHaveTextContent('linus');
    });

    authApi.me.mockResolvedValueOnce({
      data: { user: { _id: 'u3', username: 'gracehopper' } },
    });

    await act(async () => {
      screen.getByText('DoOAuth').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('gracehopper');
    });

    await act(async () => {
      screen.getByText('DoLogout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authed')).toHaveTextContent('false');
      expect(screen.getByTestId('username')).toHaveTextContent('none');
    });
  });

  it('clears ["auth"] and ["activity", "me"] caches on register', async () => {
    authApi.me.mockRejectedValueOnce(new Error('Guest'));
    authApi.register.mockResolvedValue({
      data: { user: { _id: 'u4', username: 'ada_new' }, token: 'jwt-new' },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const removeSpy = vi.spyOn(qc, 'removeQueries');
    renderWithAuth(qc);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('DoRegister').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('ada_new');
    });
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['auth'] });
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['activity', 'me'] });
  });

  it('scrubs OAuth params from both window.location and React Router useLocation()', async () => {
    window.history.replaceState({}, '', '/?oauth=success&provider=github&token=oauth-abc&keep=1');
    authApi.me.mockResolvedValue({
      data: { user: { _id: 'u5', username: 'oauth_dev' } },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <AuthProvider>
            <RouterLocationProbe />
            <AuthProbe />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('oauth_dev');
    });
    expect(getAuthToken()).toBe('oauth-abc');
    expect(window.location.search).toBe('?keep=1');
    await waitFor(() => {
      expect(screen.getByTestId('router-search')).toHaveTextContent('?keep=1');
    });
  });
});
