import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { useTheme } from '../hooks/useTheme';
import { usersApi } from '../api/users.api';

vi.mock('../api/users.api', () => ({
  usersApi: {
    updateProfile: vi.fn().mockResolvedValue({ success: true }),
  },
}));

function ThemeProbe() {
  const { theme, accent, motion, toggleTheme, setAccent, setMotion } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="accent">{accent}</span>
      <span data-testid="motion">{motion}</span>
      <button type="button" onClick={toggleTheme}>
        ToggleTheme
      </button>
      <button type="button" onClick={() => setAccent('legend')}>
        SetLegend
      </button>
      <button type="button" onClick={() => setMotion('off')}>
        MotionOff
      </button>
    </div>
  );
}

function renderTheme({ isAuthenticated = false, user = null } = {}) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        token: null,
        isAuthenticated,
        isLoading: false,
        error: null,
      }}
    >
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = 'dv_theme=; path=/; max-age=0';
    document.cookie = 'dv_accent=; path=/; max-age=0';
    document.cookie = 'dv_motion=; path=/; max-age=0';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-accent');
    document.documentElement.removeAttribute('data-motion');
  });

  it('defaults to dark/violet/on and updates DOM attributes & CSS vars on toggle', async () => {
    renderTheme({ isAuthenticated: false });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#7c6fff');

    await act(async () => {
      screen.getByText('ToggleTheme').click();
      screen.getByText('SetLegend').click();
      screen.getByText('MotionOff').click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('accent')).toHaveTextContent('legend');
    expect(screen.getByTestId('motion')).toHaveTextContent('off');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-accent')).toBe('legend');
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#d48806');
    expect(usersApi.updateProfile).not.toHaveBeenCalled();
  });

  it('syncs theme updates to backend when user is signed in', async () => {
    renderTheme({
      isAuthenticated: true,
      user: { _id: 'u1', settings: { theme: 'dark', accent: 'cyan', motion: 'on' } },
    });

    expect(screen.getByTestId('accent')).toHaveTextContent('cyan');

    await act(async () => {
      screen.getByText('ToggleTheme').click();
    });

    expect(usersApi.updateProfile).toHaveBeenCalledWith({
      settings: { theme: 'light' },
    });
  });

  it('survives malformed dv_* cookies without throwing URIError', () => {
    document.cookie = 'dv_accent=%E0%A4%A; path=/';
    document.cookie = 'dv_theme=%E0%A4%A; path=/';

    expect(() => renderTheme({ isAuthenticated: false })).not.toThrow();
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('accent')).toHaveTextContent('violet');
  });
});
