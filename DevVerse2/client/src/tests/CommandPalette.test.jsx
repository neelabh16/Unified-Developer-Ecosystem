import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import CommandPalette from '../components/common/CommandPalette';
import { projectsApi } from '../api/projects.api';
import { communitiesApi } from '../api/communities.api';
import { hackathonsApi } from '../api/hackathons.api';
import { leaderboardApi } from '../api/leaderboard.api';
import { useState } from 'react';

vi.mock('../api/projects.api', () => ({
  projectsApi: { list: vi.fn() },
}));
vi.mock('../api/communities.api', () => ({
  communitiesApi: { list: vi.fn() },
}));
vi.mock('../api/hackathons.api', () => ({
  hackathonsApi: { list: vi.fn() },
}));
vi.mock('../api/leaderboard.api', () => ({
  leaderboardApi: { get: vi.fn() },
}));

function PaletteHarness() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  return (
    <div>
      <div data-testid="path">{loc.pathname}</div>
      <div data-testid="palette-state">{open ? 'open' : 'closed'}</div>
      <CommandPalette
        isOpen={open}
        onClose={() => setOpen(false)}
        onToggle={() => setOpen((p) => !p)}
      />
    </div>
  );
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    projectsApi.list.mockResolvedValue({
      data: {
        projects: [
          {
            _id: 'p1',
            legacyId: 'neural-grid',
            title: 'Neural Grid Engine',
            tags: ['Rust', 'WebGPU'],
          },
        ],
      },
    });
    communitiesApi.list.mockResolvedValue({ data: { communities: [] } });
    hackathonsApi.list.mockResolvedValue({ data: { hackathons: [] } });
    leaderboardApi.get.mockResolvedValue({ data: { rankings: [] } });
  });

  it('toggles on Ctrl+K, filters live API results, navigates on Enter, and closes on Escape', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={qc}>
        <AuthContext.Provider
          value={{ isAuthenticated: true, isLoading: false, user: { username: 'ada' }, logout: vi.fn() }}
        >
          <ThemeProvider>
            <ToastProvider>
              <MemoryRouter initialEntries={['/']}>
                <PaletteHarness />
              </MemoryRouter>
            </ToastProvider>
          </ThemeProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('palette-state')).toHaveTextContent('closed');

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('palette-state')).toHaveTextContent('open');

    await waitFor(() => {
      expect(projectsApi.list).toHaveBeenCalled();
    });

    const input = screen.getByPlaceholderText(/Search projects/i);
    fireEvent.change(input, { target: { value: 'Neural Grid' } });

    await waitFor(() => {
      expect(screen.getByText('Neural Grid Engine')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByTestId('path')).toHaveTextContent('/projects/neural-grid');
      expect(screen.getByTestId('palette-state')).toHaveTextContent('closed');
    });

    // Reopen and close with Escape while ESC button or option is focused
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('palette-state')).toHaveTextContent('open');
    const escButton = screen.getByRole('button', { name: 'ESC' });
    escButton.focus();
    fireEvent.keyDown(escButton, { key: 'Escape' });
    expect(screen.getByTestId('palette-state')).toHaveTextContent('closed');

    // Closed overlay must not expose interactive controls to Tab order
    const dialog = document.querySelector('.cmdk-overlay');
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(dialog).toHaveAttribute('inert');
    expect(input).toHaveAttribute('tabindex', '-1');
    expect(escButton).toHaveAttribute('tabindex', '-1');
  });
});
