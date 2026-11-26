import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { githubApi } from '../../api/github.api';
import { getCurrentTier } from '../../utils/gamification';

const WELCOME_LINES = [
  'DevVerse OS Terminal v2.0 — type "help" for commands.',
];

export default function InteractiveTerminal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { setTheme, setAccent } = useTheme();

  const [lines, setLines] = useState(WELCOME_LINES);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (!isOpen) return null;

  const pushLines = (...newLines) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const runCommand = async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    pushLines(`$ ${trimmed}`);

    const [cmd, ...args] = trimmed.split(/\s+/);
    const lower = cmd.toLowerCase();

    if (lower === 'clear') {
      setLines([]);
      return;
    }

    if (lower === 'help') {
      pushLines(
        'Available commands:',
        '  whoami               Show your DevVerse handle, XP, and tier',
        '  xray <gh-handle>     Live GitHub X-Ray summary for any developer',
        '  goto <page>          Navigate (home, explore, hackathons, squads, codex, leaderboard, portfolio, profile, settings)',
        '  theme <dark|light>   Switch color theme',
        '  accent <color>       Set accent (violet, cyan, coral, amber)',
        '  clear                Clear terminal output'
      );
      return;
    }

    if (lower === 'whoami') {
      if (!isAuthenticated || !user) {
        pushLines('Guest session. Run "goto login" to sign in.');
      } else {
        const tier = getCurrentTier(user.points);
        pushLines(
          `@${user.username} (${user.name || 'Builder'}) — ${user.points ?? 0} XP · ${tier.icon} ${tier.name}`
        );
      }
      return;
    }

    if (lower === 'theme') {
      const mode = args[0]?.toLowerCase();
      if (mode === 'dark' || mode === 'light') {
        setTheme(mode);
        pushLines(`Theme switched to ${mode}.`);
      } else {
        pushLines('Usage: theme <dark|light>');
      }
      return;
    }

    if (lower === 'accent') {
      const col = args[0]?.toLowerCase();
      if (['violet', 'cyan', 'coral', 'amber'].includes(col)) {
        setAccent(col);
        pushLines(`Accent glow set to ${col}.`);
      } else {
        pushLines('Usage: accent <violet|cyan|coral|amber>');
      }
      return;
    }

    if (lower === 'goto') {
      const dest = (args[0] || '').toLowerCase().replace(/^\/+/, '');
      const routeMap = {
        home: '/',
        explore: '/explore',
        hackathons: '/hackathons',
        squads: '/squads',
        communities: '/communities',
        codex: '/codex',
        leaderboard: '/leaderboard',
        portfolio: '/portfolio',
        profile: '/profile',
        settings: '/settings',
        login: '/login',
        signup: '/signup',
      };
      if (routeMap[dest]) {
        navigate(routeMap[dest]);
        pushLines(`Navigating to ${routeMap[dest]}...`);
        onClose();
      } else {
        pushLines(`Unknown destination "${dest}". Try: explore, hackathons, leaderboard, profile.`);
      }
      return;
    }

    if (lower === 'xray') {
      const target = (args[0] || '').replace(/^@/, '');
      if (!target) {
        pushLines('Usage: xray <github-username>');
        return;
      }
      pushLines(`Scanning GitHub telemetry for @${target}...`);
      try {
        const [uRes, rRes] = await Promise.all([
          githubApi.getUser(target),
          githubApi.getRepos(target),
        ]);
        const prof = uRes?.data?.profile || uRes?.data?.user || uRes?.data;
        const repos = rRes?.data?.repos || rRes?.data || [];
        const stars = Array.isArray(repos)
          ? repos.reduce((s, r) => s + (r.stargazers_count || 0), 0)
          : 0;
        const langs = Array.isArray(repos)
          ? Array.from(new Set(repos.map((r) => r.language).filter(Boolean))).slice(0, 4)
          : [];
        pushLines(
          `✔ ${prof?.name || target} (@${prof?.login || target})`,
          `  Repos: ${prof?.public_repos ?? repos.length} · Stars: ${stars} · Followers: ${prof?.followers ?? 0}`,
          `  Stack: ${langs.join(', ') || 'Polyglot'}`
        );
      } catch (err) {
        pushLines(`✖ Error: ${err.message || 'Could not fetch GitHub data'}`);
      }
      return;
    }

    pushLines(`Command not found: ${cmd}. Type "help" for available commands.`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DevVerse Interactive Terminal"
      className="fixed inset-0 z-[10065] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass w-full max-w-2xl overflow-hidden rounded-2xl border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="mono flex items-center gap-2 text-xs font-semibold text-[var(--cyan)]">
            <Terminal className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            <span>devverse-os ~ interactive shell</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terminal"
            className="dock-icon-btn h-7 w-7 rounded-lg"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mono h-72 space-y-1.5 overflow-y-auto p-4 text-xs leading-relaxed">
          {lines.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('$')
                  ? 'font-semibold text-[var(--accent)]'
                  : line.startsWith('✔')
                    ? 'text-[var(--cyan)]'
                    : line.startsWith('✖')
                      ? 'text-[var(--coral)]'
                      : 'text-[var(--text-secondary)]'
              }
            >
              {line}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = input;
            setInput('');
            runCommand(val);
          }}
          className="mono flex items-center gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs"
        >
          <span className="font-bold text-[var(--cyan)]">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type help, xray gaearon, goto explore, theme light…"
            style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
          />
        </form>
      </div>
    </div>
  );
}
