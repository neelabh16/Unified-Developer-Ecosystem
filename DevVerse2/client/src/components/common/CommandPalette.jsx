import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { projectsApi } from '../../api/projects.api';
import { communitiesApi } from '../../api/communities.api';
import { hackathonsApi } from '../../api/hackathons.api';
import { leaderboardApi } from '../../api/leaderboard.api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';

const RECENT_STORAGE_KEY = 'dv_cmdk_recent';
const MAX_RECENT_IDS = 5;
const MAX_RESULTS = 8;

function readRecentIds() {
  try {
    const raw = sessionStorage.getItem(RECENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentId(itemId) {
  try {
    const current = readRecentIds().filter((id) => id !== itemId);
    const next = [itemId, ...current].slice(0, MAX_RECENT_IDS);
    sessionStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
}

export default function CommandPalette({ isOpen, onClose, onToggle }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    onClose?.();
  }, [onClose]);

  // Global Ctrl/Cmd+K and Escape shortcuts
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          setQuery('');
          setSelectedIndex(0);
          onToggle?.();
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onToggle, handleClose]);

  // Focus input when opened
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const recentIds = useMemo(() => (isOpen ? readRecentIds() : []), [isOpen]);

  const { data: projectsRes } = useQuery({
    queryKey: ['cmdk', 'projects'],
    queryFn: () => projectsApi.list({ limit: 50 }),
    enabled: isOpen,
    staleTime: 60_000,
    retry: false,
  });

  const { data: communitiesRes } = useQuery({
    queryKey: ['cmdk', 'communities'],
    queryFn: () => communitiesApi.list(),
    enabled: isOpen,
    staleTime: 60_000,
    retry: false,
  });

  const { data: hackathonsRes } = useQuery({
    queryKey: ['cmdk', 'hackathons'],
    queryFn: () => hackathonsApi.list(),
    enabled: isOpen,
    staleTime: 60_000,
    retry: false,
  });

  const { data: devsRes } = useQuery({
    queryKey: ['cmdk', 'devs'],
    queryFn: () => leaderboardApi.get({ mode: 'devs', range: 'all' }),
    enabled: isOpen,
    staleTime: 60_000,
    retry: false,
  });

  const allItems = useMemo(() => {
    const projects = projectsRes?.data?.projects || projectsRes?.projects || [];
    const communities =
      communitiesRes?.data?.communities || communitiesRes?.communities || [];
    const hackathons =
      hackathonsRes?.data?.hackathons || hackathonsRes?.hackathons || [];
    const devs = devsRes?.data?.rankings || devsRes?.rankings || [];

    const items = [];

    projects.forEach((p) => {
      const id = p.legacyId || p._id || p.id;
      if (!id) return;
      items.push({
        id: `project:${id}`,
        type: 'Project',
        icon: '⬡',
        label: p.title || 'Untitled Project',
        sublabel: Array.isArray(p.tags) ? p.tags.join(', ') : p.category || '',
        to: `/projects/${encodeURIComponent(id)}`,
        trackRecent: true,
      });
    });

    devs.forEach((d) => {
      const handle = d.username || d.handle;
      if (!handle) return;
      items.push({
        id: `dev:${handle}`,
        type: 'Developer',
        icon: '◆',
        label: d.name || handle,
        sublabel: `@${handle}`,
        to: `/profile/${encodeURIComponent(handle)}`,
        trackRecent: true,
      });
    });

    communities.forEach((c) => {
      const id = c.slug || c.legacyId || c._id || c.id;
      if (!id) return;
      const count = c.membersCount ?? c.members ?? 0;
      items.push({
        id: `community:${id}`,
        type: 'Community',
        icon: '●',
        label: c.name || 'Community',
        sublabel: `${Number(count).toLocaleString()} members`,
        to: `/communities/${encodeURIComponent(id)}`,
        trackRecent: true,
      });
    });

    hackathons.forEach((h) => {
      const id = h.legacyId || h._id || h.id;
      if (!id) return;
      items.push({
        id: `hackathon:${id}`,
        type: 'Hackathon',
        icon: '◈',
        label: h.title || 'Hackathon',
        sublabel: h.prize ? `${h.prize} prize pool` : 'Active hackathon',
        to: `/hackathons/${encodeURIComponent(id)}`,
        trackRecent: true,
      });
    });

    const pages = [
      { label: 'Home', to: '/' },
      { label: 'Explore', to: '/explore' },
      { label: 'Communities', to: '/communities' },
      { label: 'Hackathons', to: '/hackathons' },
      { label: 'Squads', to: '/squads' },
      { label: 'Leaderboard', to: '/leaderboard' },
      { label: 'Portfolio Builder', to: '/portfolio' },
      ...(isAuthenticated ? [{ label: 'Codex', to: '/codex' }] : []),
    ];

    pages.forEach((pg) => {
      items.push({
        id: `page:${pg.to}`,
        type: 'Page',
        icon: '▲',
        label: pg.label,
        sublabel: 'Go to page',
        to: pg.to,
      });
    });

    items.push(
      {
        id: 'action:theme',
        type: 'Action',
        icon: '☾',
        label: 'Toggle dark / light theme',
        sublabel: 'Switch appearance',
        run: () => {
          toggleTheme();
          showToast('Theme updated');
        },
      },
      {
        id: 'action:points',
        type: 'Action',
        icon: '★',
        label: 'View your points',
        sublabel: 'Open Leaderboard & activity ledger',
        to: '/leaderboard',
      },
      {
        id: 'action:profile',
        type: 'Action',
        icon: '✎',
        label: 'Edit your profile',
        sublabel: 'Update bio, skills & avatar',
        to: '/profile',
      },
      {
        id: 'action:settings',
        type: 'Action',
        icon: '⚙',
        label: 'Settings',
        sublabel: 'Accent, motion & account settings',
        to: '/settings',
      },
      {
        id: 'action:submit',
        type: 'Action',
        icon: '⬡',
        label: 'Submit a project',
        sublabel: 'Publish a new build to DevVerse',
        to: '/submit-project',
      }
    );

    if (isAuthenticated) {
      items.push({
        id: 'action:logout',
        type: 'Action',
        icon: '⎋',
        label: 'Sign out',
        sublabel: 'End your current session',
        run: async () => {
          await logout();
          showToast('Signed out');
          navigate('/');
        },
      });
    } else {
      items.push(
        {
          id: 'action:login',
          type: 'Action',
          icon: '⎆',
          label: 'Sign in',
          sublabel: 'Access your builder account',
          to: '/login',
        },
        {
          id: 'action:signup',
          type: 'Action',
          icon: '＋',
          label: 'Create an account',
          sublabel: 'Join DevVerse',
          to: '/signup',
        }
      );
    }

    return items;
  }, [
    projectsRes,
    communitiesRes,
    hackathonsRes,
    devsRes,
    isAuthenticated,
    toggleTheme,
    showToast,
    logout,
    navigate,
  ]);

  const displayedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recentItems = recentIds
        .map((id) => allItems.find((item) => item.id === id))
        .filter(Boolean)
        .map((item) => ({ ...item, groupName: 'Recently viewed' }));

      const defaults = allItems
        .filter((item) => item.type === 'Page' || item.type === 'Action')
        .filter((item) => !recentIds.includes(item.id))
        .map((item) => ({ ...item, groupName: item.type }));

      return [...recentItems, ...defaults].slice(0, MAX_RESULTS);
    }

    return allItems
      .filter((item) => {
        const hay = `${item.label} ${item.sublabel} ${item.type}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, MAX_RESULTS)
      .map((item) => ({ ...item, groupName: item.type }));
  }, [query, recentIds, allItems]);

  const safeSelectedIndex =
    selectedIndex >= displayedItems.length ? 0 : selectedIndex;

  const groupedSections = useMemo(() => {
    const groups = [];
    const byName = new Map();
    displayedItems.forEach((item, flatIndex) => {
      const groupName = item.groupName || item.type;
      if (!byName.has(groupName)) {
        const group = { name: groupName, items: [] };
        byName.set(groupName, group);
        groups.push(group);
      }
      byName.get(groupName).items.push({ ...item, flatIndex });
    });
    return groups;
  }, [displayedItems]);

  const activateItem = useCallback(
    async (item) => {
      if (!item) return;
      if (item.trackRecent) {
        saveRecentId(item.id);
      }
      handleClose();
      if (typeof item.run === 'function') {
        await item.run();
      } else if (item.to) {
        navigate(item.to);
      }
    },
    [navigate, handleClose]
  );

  useEffect(() => {
    const el = itemRefs.current[safeSelectedIndex];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [safeSelectedIndex]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (displayedItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % displayedItems.length);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (displayedItems.length > 0) {
        setSelectedIndex(
          (prev) => (prev - 1 + displayedItems.length) % displayedItems.length
        );
      }
      return;
    }
    if (e.key === 'Enter' && displayedItems[safeSelectedIndex]) {
      e.preventDefault();
      activateItem(displayedItems[safeSelectedIndex]);
    }
  };

  return (
    <div
      className={`cmdk-overlay ${isOpen ? 'open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      aria-hidden={!isOpen}
      inert={isOpen ? undefined : ''}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="cmdk-panel">
        <div className="cmdk-input-row">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input
            ref={inputRef}
            id="cmdk-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search projects, developers, communities, or jump anywhere..."
            autoComplete="off"
            tabIndex={isOpen ? undefined : -1}
          />
          <button
            type="button"
            className="cmdk-esc"
            onClick={handleClose}
            tabIndex={isOpen ? undefined : -1}
          >
            ESC
          </button>
        </div>

        <div className="cmdk-results" role="listbox" aria-label="Command results">
          {displayedItems.length === 0 ? (
            <div className="cmdk-empty">No matches found for &ldquo;{query}&rdquo;</div>
          ) : (
            groupedSections.map((group) => (
              <div key={group.name}>
                <div className="cmdk-group-label">{group.name}</div>
                {group.items.map((item) => {
                  const isActive = item.flatIndex === safeSelectedIndex;
                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        itemRefs.current[item.flatIndex] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      tabIndex={isOpen ? undefined : -1}
                      className={`cmdk-item ${isActive ? 'cmdk-active' : ''}`}
                      onMouseEnter={() => setSelectedIndex(item.flatIndex)}
                      onClick={() => activateItem(item)}
                    >
                      <span className="cmdk-item-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="cmdk-item-text">
                        <span className="cmdk-item-label">{item.label}</span>
                        <span className="cmdk-item-sublabel">{item.sublabel}</span>
                      </span>
                      <span className="cmdk-item-type">{item.type}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
