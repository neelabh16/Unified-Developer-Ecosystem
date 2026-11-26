import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../routes/ProtectedRoute';

function LoginProbe() {
  const loc = useLocation();
  return <div data-testid="login-probe">{`${loc.pathname}${loc.search}`}</div>;
}

function renderProtected(authState, initialEntry = '/submit-project?from=hero') {
  return render(
    <AuthContext.Provider value={authState}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/submit-project"
            element={
              <ProtectedRoute>
                <div data-testid="protected-secret">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('shows loading state while auth session is resolving', () => {
    renderProtected({ isAuthenticated: false, isLoading: true });
    expect(screen.getByTestId('protected-route-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('login-probe')).not.toBeInTheDocument();
  });

  it('redirects guest to /login with encoded ?redirect= query parameter', () => {
    renderProtected(
      { isAuthenticated: false, isLoading: false },
      '/submit-project?from=hero'
    );
    expect(screen.getByTestId('login-probe')).toHaveTextContent(
      '/login?redirect=%2Fsubmit-project%3Ffrom%3Dhero'
    );
  });

  it('renders protected children when authenticated', () => {
    renderProtected({
      isAuthenticated: true,
      isLoading: false,
      user: { username: 'ada' },
    });
    expect(screen.getByTestId('protected-secret')).toBeInTheDocument();
  });
});
