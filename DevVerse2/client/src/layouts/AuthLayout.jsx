import { useCallback, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import AuroraBackground from '../components/common/AuroraBackground';
import AmbientThreeField from '../components/common/AmbientThreeField';
import CursorGlow from '../components/common/CursorGlow';
import { ScrollProgressBar } from '../components/common/MotionPrimitives';
import CommandPalette from '../components/common/CommandPalette';
import Footer from '../components/common/Footer';
import ToastContainer from '../components/common/ToastContainer';

export default function AuthLayout({ children }) {
  const location = useLocation();
  const { theme, toggleTheme, motion: motionPref } = useTheme();
  const [cmdkOpen, setCmdkOpen] = useState(false);

  const toggleCmdk = useCallback(() => {
    setCmdkOpen((prev) => !prev);
  }, []);

  const isLogin = location.pathname.startsWith('/login');
  const reduceMotion = motionPref === 'off';

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <ScrollProgressBar />
      <AuroraBackground />
      <AmbientThreeField />
      <CursorGlow />

      <div className="dock-wrap">
        <nav className="dock justify-between" aria-label="Authentication navigation">
          <Link to="/" className="dock-brand">
            <span className="mark">DV</span>
            <span>DevVerse</span>
          </Link>

          <div className="dock-actions">
            <Link to="/" className="dock-link">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Home</span>
            </Link>

            <button
              type="button"
              className="cmdk-dock-trigger"
              onClick={() => setCmdkOpen(true)}
              aria-label="Open command palette"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="cmdk-trigger-label-text">Search</span>
            </button>

            <button
              type="button"
              className="dock-icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <Link
              to={isLogin ? `/signup${location.search}` : `/login${location.search}`}
              className="btn btn-sm btn-primary"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </Link>
          </div>
        </nav>
      </div>

      <main id="main-content" className="flex-1">
        {reduceMotion ? (
          children || <Outlet />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <Footer />
      <CommandPalette
        isOpen={cmdkOpen}
        onClose={() => setCmdkOpen(false)}
        onToggle={toggleCmdk}
      />
      <ToastContainer />
    </div>
  );
}
