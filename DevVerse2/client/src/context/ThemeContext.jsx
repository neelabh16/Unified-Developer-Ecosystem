import { createContext, useCallback, useEffect, useReducer, useRef } from 'react';
import { usersApi } from '../api/users.api';
import { useAuth } from '../hooks/useAuth';

export const ThemeContext = createContext(null);

export const ACCENT_COLORS = {
  dark: {
    violet: ['#7c6fff', 'rgba(124, 111, 255, 0.16)'],
    cyan: ['#4fe3c1', 'rgba(79, 227, 193, 0.14)'],
    coral: ['#ff6b5b', 'rgba(255, 107, 91, 0.14)'],
    amber: ['#ffb86b', 'rgba(255, 184, 107, 0.14)'],
    legend: ['#f0c419', 'rgba(240, 196, 25, 0.16)'],
  },
  light: {
    violet: ['#9c2b3c', 'rgba(156, 43, 60, 0.14)'],
    cyan: ['#b07a3e', 'rgba(176, 122, 62, 0.16)'],
    coral: ['#c1502e', 'rgba(193, 80, 46, 0.15)'],
    amber: ['#a6862a', 'rgba(166, 134, 42, 0.16)'],
    legend: ['#d48806', 'rgba(212, 136, 6, 0.16)'],
  },
};

const VALID_THEMES = ['dark', 'light'];
const VALID_ACCENTS = ['violet', 'cyan', 'coral', 'amber', 'legend'];
const VALID_MOTIONS = ['on', 'off'];

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

function readStorage(key) {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function persistPref(cookieName, storageKey, value) {
  if (typeof document !== 'undefined') {
    document.cookie = `${cookieName}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, value);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

function getInitialThemeState() {
  const rawTheme = readCookie('dv_theme') || readStorage('dv_settings_theme') || 'dark';
  const rawAccent = readCookie('dv_accent') || readStorage('dv_settings_accent') || 'violet';
  const rawMotion = readCookie('dv_motion') || readStorage('dv_settings_motion') || 'on';

  return {
    theme: VALID_THEMES.includes(rawTheme) ? rawTheme : 'dark',
    accent: VALID_ACCENTS.includes(rawAccent) ? rawAccent : 'violet',
    motion: VALID_MOTIONS.includes(rawMotion) ? rawMotion : 'on',
  };
}

function themeReducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return VALID_THEMES.includes(action.payload)
        ? { ...state, theme: action.payload }
        : state;
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'SET_ACCENT':
      return VALID_ACCENTS.includes(action.payload)
        ? { ...state, accent: action.payload }
        : state;
    case 'SET_MOTION':
      return VALID_MOTIONS.includes(action.payload)
        ? { ...state, motion: action.payload }
        : state;
    case 'SYNC_FROM_USER': {
      const s = action.payload || {};
      return {
        theme: VALID_THEMES.includes(s.theme) ? s.theme : state.theme,
        accent: VALID_ACCENTS.includes(s.accent) ? s.accent : state.accent,
        motion: VALID_MOTIONS.includes(s.motion) ? s.motion : state.motion,
      };
    }
    default:
      return state;
  }
}

export function applyThemeToDocument({ theme, accent, motion }) {
  if (typeof document === 'undefined') return;
  const palette = ACCENT_COLORS[theme] || ACCENT_COLORS.dark;
  const pair = palette[accent] || palette.violet;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-accent', accent);
  root.setAttribute('data-motion', motion);
  root.style.setProperty('--accent', pair[0]);
  root.style.setProperty('--accent-soft', pair[1]);
  root.style.setProperty('--aurora-1', pair[0]);
}

export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, undefined, getInitialThemeState);
  const { user, isAuthenticated } = useAuth();
  const syncedUserIdRef = useRef(null);

  useEffect(() => {
    applyThemeToDocument(state);
    persistPref('dv_theme', 'dv_settings_theme', state.theme);
    persistPref('dv_accent', 'dv_settings_accent', state.accent);
    persistPref('dv_motion', 'dv_settings_motion', state.motion);
  }, [state]);

  useEffect(() => {
    const userId = user?._id || user?.id || null;
    if (!isAuthenticated || !userId) {
      syncedUserIdRef.current = null;
      return;
    }
    if (syncedUserIdRef.current !== userId && user?.settings) {
      syncedUserIdRef.current = userId;
      dispatch({ type: 'SYNC_FROM_USER', payload: user.settings });
    }
  }, [isAuthenticated, user]);

  const syncSettingsToServer = useCallback(
    (patch) => {
      if (!isAuthenticated) return;
      usersApi.updateProfile({ settings: patch }).catch(() => {});
    },
    [isAuthenticated]
  );

  const setTheme = useCallback(
    (nextTheme) => {
      if (!VALID_THEMES.includes(nextTheme)) return;
      dispatch({ type: 'SET_THEME', payload: nextTheme });
      syncSettingsToServer({ theme: nextTheme });
    },
    [syncSettingsToServer]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'TOGGLE_THEME' });
    syncSettingsToServer({ theme: nextTheme });
  }, [state.theme, syncSettingsToServer]);

  const setAccent = useCallback(
    (nextAccent) => {
      if (!VALID_ACCENTS.includes(nextAccent)) return;
      dispatch({ type: 'SET_ACCENT', payload: nextAccent });
      syncSettingsToServer({ accent: nextAccent });
    },
    [syncSettingsToServer]
  );

  const setMotion = useCallback(
    (nextMotion) => {
      if (!VALID_MOTIONS.includes(nextMotion)) return;
      dispatch({ type: 'SET_MOTION', payload: nextMotion });
      syncSettingsToServer({ motion: nextMotion });
    },
    [syncSettingsToServer]
  );

  return (
    <ThemeContext.Provider
      value={{
        ...state,
        setTheme,
        toggleTheme,
        setAccent,
        setMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
