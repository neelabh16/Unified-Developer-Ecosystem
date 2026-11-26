import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import AppRouter from '../routes/AppRouter';

function LocationReadout() {
  const loc = useLocation();
  return <div data-testid="location-readout">{`${loc.pathname}${loc.search}`}</div>;
}

function renderRouterAt(
  initialEntry,
  authValue = { isAuthenticated: false, isLoading: false, user: null, logout: vi.fn() }
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={authValue}>
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
              <LocationReadout />
              <AppRouter />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe('AppRouter & Legacy Redirects', () => {
  it('renders Home lazy route at / and keeps closed mobile-menu non-focusable', async () => {
    renderRouterAt('/');
    expect(await screen.findByTestId('page-home')).toBeInTheDocument();
    const mobileMenu = document.querySelector('.mobile-menu');
    expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
    expect(mobileMenu).toHaveAttribute('inert');
    const mobileItems = mobileMenu.querySelectorAll('a, button');
    expect(mobileItems.length).toBeGreaterThan(0);
    mobileItems.forEach((el) => {
      expect(el).toHaveAttribute('tabindex', '-1');
    });
  });

  it('redirects /login.html preserving ?oauth_error= query parameter', async () => {
    renderRouterAt('/login.html?oauth_error=github_not_configured');
    expect(await screen.findByTestId('page-login')).toBeInTheDocument();
    expect(screen.getByTestId('location-readout')).toHaveTextContent(
      '/login?oauth_error=github_not_configured'
    );
  });

  it('redirects /index.html preserving ?oauth=success query parameter', async () => {
    renderRouterAt('/index.html?oauth=success&provider=github');
    expect(await screen.findByTestId('page-home')).toBeInTheDocument();
    expect(screen.getByTestId('location-readout')).toHaveTextContent(
      '/?oauth=success&provider=github'
    );
  });

  it('redirects legacy /project?id=7 to /projects/7', async () => {
    renderRouterAt('/project?id=7');
    expect(await screen.findByTestId('page-project-detail')).toBeInTheDocument();
    expect(screen.getByTestId('location-readout')).toHaveTextContent('/projects/7');
  });

  it('redirects legacy /portfolio.html?u=aisha&view=1 to /portfolio/aisha?view=1', async () => {
    renderRouterAt('/portfolio.html?u=aisha&view=1');
    expect(await screen.findByTestId('page-portfolio')).toBeInTheDocument();
    expect(screen.getByTestId('location-readout')).toHaveTextContent(
      '/portfolio/aisha?view=1'
    );
  });

  it('renders 404 fallback for unknown routes', async () => {
    renderRouterAt('/does-not-exist-anywhere');
    expect(await screen.findByTestId('not-found-page')).toBeInTheDocument();
  });
});
