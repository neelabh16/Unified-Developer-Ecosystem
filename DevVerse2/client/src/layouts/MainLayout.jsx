import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Menu, Moon, Search, Settings, Sparkles, Sun, User, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { getInitialGradient } from '../utils/avatar';
import { isCodexUnlocked } from '../utils/gamification';
import AuroraBackground from '../components/common/AuroraBackground';
import CommandPalette from '../components/common/CommandPalette';
import Footer from '../components/common/Footer';
import BackToTop from '../components/common/BackToTop';
import ToastContainer from '../components/common/ToastContainer';

const BASE_NAV_ITEMS = [
  { id: 'home', label: 'Home', to: '/', end: true },
  { id: 'explore', label: 'Explore', to: '/explore' },
  { id: 'communities', label: 'Communities', to: '/communities' },
  { id: 'hackathons', label: 'Hackathons', to: '/hackathons' },
  { id: 'squads', label: 'Squads', to: '/squads' },
  { id: 'leaderboard', label: 'Leaderboard', to: '/leaderboard' },
  { id: 'portfolio', label: 'Portfolio Builder', to: '/portfolio' },
];

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, motion: motionPref } = useTheme();
  const { showToast } = useToast();

  const routeKey = `${location.pathname}${location.search}`;
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [mobileOpenRoute, setMobileOpenRoute] = useState(null);
  const [avatarOpenRoute, setAvatarOpenRoute] = useState(null);
  const avatarWrapRef = useRef(null);

  const mobileMenuOpen = mobileOpenRoute === routeKey;
  const avatarMenuOpen = avatarOpenRoute === routeKey;

  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || '');

  const visibleNavItems = isAuthenticated
    ? [...BASE_NAV_ITEMS, { id: 'codex', label: 'Codex', to: '/codex' }]
    : BASE_NAV_ITEMS;

  const codexUnlocked = isCodexUnlocked(user?.points, user?.role);
  const avatarVisual = getInitialGradient(user?.name || user?.username || 'D');

  const toggleCmdk = useCallback(() => {
    setCmdkOpen((prev) => !prev);
  }, []);

  // Close avatar dropdown & mobile menu on outside click / Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setAvatarOpenRoute(null);
        setMobileOpenRoute(null);
      }
    };
    const handleClickOutside = (e) => {
      if (avatarWrapRef.current && !avatarWrapRef.current.contains(e.target)) {
        setAvatarOpenRoute(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setAvatarOpenRoute(null);
    setMobileOpenRoute(null);
    await logout();
    showToast('Signed out');
    navigate('/');
  };

  const reduceMotion = motionPref === 'off';

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <AuroraBackground />

      <div className="dock-wrap">
        <nav className="dock" aria-label="Primary navigation">
          <Link to="/" className="dock-brand">
            <span className="mark">DV</span>
            <span>DevVerse</span>
          </Link>

          <div className="dock-links">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `dock-link ${isActive ? 'active' : ''}`.trim()
                }
              >
                <span>{item.label}</span>
                {item.id === 'codex' && (
                  <span
                    className="inline-flex items-center"
                    title={
                      codexUnlocked
                        ? 'Codex unlocked (200+ pts)'
                        : 'Unlock Codex contributions at 200 pts'
                    }
                    aria-label={codexUnlocked ? 'Codex unlocked' : 'Codex locked under 200 points'}
                  >
                    {codexUnlocked ? (
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 opacity-75" aria-hidden="true" />
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="dock-actions">
            <button
              type="button"
              className="cmdk-dock-trigger"
              onClick={() => setCmdkOpen(true)}
              aria-label="Open command palette"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="cmdk-trigger-label-text">Search</span>
              <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
            </button>

            <button
              type="button"
              className="dock-icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="dock-avatar-wrap" ref={avatarWrapRef}>
                <button
                  type="button"
                  className="dock-icon-btn dock-avatar-btn"
                  onClick={() =>
                    setAvatarOpenRoute((prev) => (prev === routeKey ? null : routeKey))
                  }
                  aria-expanded={avatarMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                >
                  <span
                    className="dock-avatar-initial"
                    style={{ background: avatarVisual.background }}
                  >
                    {avatarVisual.initial}
                  </span>
                </button>

                <div
                  className={`dock-avatar-menu ${avatarMenuOpen ? 'open' : ''}`}
                  role="menu"
                  aria-hidden={!avatarMenuOpen}
                  inert={avatarMenuOpen ? undefined : ''}
                >
                  <div className="dock-avatar-menu-header">
                    <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {user?.name || user?.username}
                    </div>
                    <div className="truncate font-mono text-xs text-[var(--text-tertiary)]">
                      @{user?.username} · {user?.points ?? 0} pts
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    role="menuitem"
                    tabIndex={avatarMenuOpen ? undefined : -1}
                    className="dock-avatar-menu-item"
                    onClick={() => setAvatarOpenRoute(null)}
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>Profile</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={avatarMenuOpen ? undefined : -1}
                    onClick={handleLogout}
                    className="dock-avatar-menu-item dock-avatar-menu-item-danger"
                  >
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-primary">
                  Sign In
                </Link>
                <Link
                  to="/profile"
                  className="dock-icon-btn"
                  aria-label="Profile"
                  title="Profile"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            )}

            <NavLink
              to="/settings"
              className="dock-icon-btn"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </NavLink>

            <button
              type="button"
              className="dock-icon-btn dock-mobile-toggle"
              onClick={() =>
                setMobileOpenRoute((prev) => (prev === routeKey ? null : routeKey))
              }
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Fullscreen Drawer */}
      <div
        className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
        inert={mobileMenuOpen ? undefined : ''}
      >
        <button
          type="button"
          className="mobile-menu-link"
          tabIndex={mobileMenuOpen ? undefined : -1}
          onClick={() => {
            setMobileOpenRoute(null);
            setCmdkOpen(true);
          }}
        >
          <Search className="h-5 w-5" aria-hidden="true" />
          <span>Search everything</span>
        </button>

        {visibleNavItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            tabIndex={mobileMenuOpen ? undefined : -1}
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={() => setMobileOpenRoute(null)}
          >
            {item.label}
          </NavLink>
        ))}

        <NavLink
          to="/profile"
          tabIndex={mobileMenuOpen ? undefined : -1}
          onClick={() => setMobileOpenRoute(null)}
        >
          Profile
        </NavLink>
        <NavLink
          to="/settings"
          tabIndex={mobileMenuOpen ? undefined : -1}
          onClick={() => setMobileOpenRoute(null)}
        >
          Settings
        </NavLink>

        {isAuthenticated ? (
          <button
            type="button"
            tabIndex={mobileMenuOpen ? undefined : -1}
            className="mobile-menu-link text-[var(--coral)]"
            onClick={handleLogout}
          >
            Sign out
          </button>
        ) : (
          <NavLink
            to="/login"
            tabIndex={mobileMenuOpen ? undefined : -1}
            onClick={() => setMobileOpenRoute(null)}
          >
            Sign in
          </NavLink>
        )}
      </div>

      <main id="main-content" className="flex-1">
        {reduceMotion ? (
          children || <Outlet />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <Footer />
      <BackToTop />
      <CommandPalette
        isOpen={cmdkOpen}
        onClose={() => setCmdkOpen(false)}
        onToggle={toggleCmdk}
      />
      <ToastContainer />
    </div>
  );
}
