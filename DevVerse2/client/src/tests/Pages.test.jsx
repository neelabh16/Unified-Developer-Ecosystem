import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import HomePage from '../pages/HomePage';
import ExplorePage from '../pages/ExplorePage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import LeaderboardPage from '../pages/LeaderboardPage';
import CodexPage from '../pages/CodexPage';
import SettingsPage from '../pages/SettingsPage';

vi.mock('../api/projects.api', () => ({
  projectsApi: {
    list: vi.fn(() =>
      Promise.resolve({
        data: {
          projects: [
            {
              _id: 'p1',
              legacyId: 'prism-cli',
              title: 'Prism CLI',
              desc: 'Fast terminal colorizer and log formatter',
              category: 'Developer Tools',
              difficulty: 'Intermediate',
              tags: ['rust', 'cli'],
              likesCount: 42,
              viewsCount: 310,
              author: { username: 'kmori' },
            },
            {
              _id: 'p2',
              legacyId: 'neural-mesh',
              title: 'Neural Mesh',
              desc: 'Distributed inference router for edge nodes',
              category: 'AI & ML',
              difficulty: 'Advanced',
              tags: ['python', 'ai'],
              likesCount: 88,
              viewsCount: 640,
              author: { username: 'noa.ml' },
            },
          ],
        },
      })
    ),
  },
}));

vi.mock('../api/leaderboard.api', () => ({
  leaderboardApi: {
    get: vi.fn(() =>
      Promise.resolve({
        data: {
          rankings: [
            { _id: 'u1', name: 'Kenji Mori', username: 'kmori', points: 720, projectsCount: 5 },
            { _id: 'u2', name: 'Sena', username: 'sena.codes', points: 450, projectsCount: 3 },
          ],
        },
      })
    ),
  },
  activityApi: {
    mine: vi.fn(() => Promise.resolve({ data: { events: [] } })),
    feed: vi.fn(() => Promise.resolve({ data: { events: [] } })),
  },
}));

vi.mock('../api/hackathons.api', () => ({
  hackathonsApi: {
    list: vi.fn(() =>
      Promise.resolve({
        data: {
          hackathons: [
            {
              _id: 'h1',
              legacyId: 'aurora-sprint',
              title: 'Aurora 48h Sprint',
              tagline: 'Build next-gen developer workflows',
              status: 'Live',
              prize: '₹50,000',
              tags: ['AI', 'Web'],
            },
          ],
        },
      })
    ),
  },
}));

vi.mock('../api/codex.api', () => ({
  codexApi: {
    status: vi.fn(() => Promise.resolve({ data: { unlocked: false } })),
    list: vi.fn(() => Promise.resolve({ data: { entries: [] } })),
  },
}));

function renderWithProviders(ui, { authValue = {}, route = '/' } = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const defaultAuth = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...authValue,
  };

  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={defaultAuth}>
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe('DevVerse Core Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HomePage with trending projects and active hackathons', async () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
    expect(await screen.findByText('Prism CLI')).toBeInTheDocument();
    expect(await screen.findByText('Aurora 48h Sprint')).toBeInTheDocument();
  });

  it('filters projects on ExplorePage by search and difficulty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExplorePage />);
    expect(await screen.findByText('Prism CLI')).toBeInTheDocument();
    expect(screen.getByText('Neural Mesh')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search projects/i);
    await user.type(searchInput, 'Neural');

    await waitFor(() => {
      expect(screen.queryByText('Prism CLI')).not.toBeInTheDocument();
      expect(screen.getByText('Neural Mesh')).toBeInTheDocument();
    });
  });

  it('validates LoginPage fields and submits credentials', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue({ name: 'Ada', username: 'ada' });
    renderWithProviders(<LoginPage />, { authValue: { login: loginMock } });

    await user.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(await screen.findByText(/Email or username is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Email or username/i), 'ada@devverse.dev');
    await user.type(screen.getByLabelText(/^Password$/i), 'StrongPass1!');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'ada@devverse.dev',
        username: 'ada@devverse.dev',
        password: 'StrongPass1!',
      });
    });
  });

  it('validates SignupPage strong password rules', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />);

    await user.type(screen.getByLabelText(/Full name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/Username/i), 'ada.codes');
    await user.type(screen.getByLabelText(/Email address/i), 'ada@devverse.dev');
    await user.type(screen.getByLabelText(/^Password$/i), 'weak');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/Password must be at least 7 characters/i)).toBeInTheDocument();
  });

  it('renders LeaderboardPage rankings and switches modes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LeaderboardPage />);
    const kenjiItems = await screen.findAllByText('Kenji Mori');
    expect(kenjiItems.length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Projects/i }));
    expect(screen.getByText('Top Projects')).toBeInTheDocument();
  });

  it('shows sealed state on CodexPage when user has < 200 XP', () => {
    renderWithProviders(<CodexPage />, {
      authValue: {
        isAuthenticated: true,
        user: { _id: 'u1', username: 'newbie', points: 45, role: 'user' },
      },
    });
    expect(screen.getByText(/The Codex is sealed/i)).toBeInTheDocument();
    expect(screen.getByText(/45 \/ 200 pts/i)).toBeInTheDocument();
  });

  it('switches theme on SettingsPage', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /Light/i }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
