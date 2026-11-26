import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Code2, Compass, Rocket, Sparkles, Terminal, Users } from 'lucide-react';
import HeroCanvas from '../components/common/HeroCanvas';
import GlassCard from '../components/common/GlassCard';
import { ParallaxLayer, RevealSection } from '../components/common/MotionPrimitives';
import AnimatedCounter from '../components/common/AnimatedCounter';
import Skeleton from '../components/common/Skeleton';
import ProjectCard from '../components/projects/ProjectCard';
import DevCard from '../components/developers/DevCard';
import HackathonCard from '../components/hackathons/HackathonCard';
import { projectsApi } from '../api/projects.api';
import { leaderboardApi, activityApi } from '../api/leaderboard.api';
import { hackathonsApi } from '../api/hackathons.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { heroRobotDark, heroRobotLight } from '../utils/assets';
import { timeAgo } from '../utils/formatters';

const TERMINAL_COMMANDS = [
  'devverse init --builder',
  'devverse deploy legend.exe',
  'devverse join hackathon aurora',
];

function extractArray(res, key) {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (key && Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const [typedText, setTypedText] = useState(TERMINAL_COMMANDS[0]);

  useEffect(() => {
    let cmdIndex = 0;
    let charIndex = 0;
    let cancelled = false;
    let timer = null;

    const tick = () => {
      if (cancelled) return;
      const target = TERMINAL_COMMANDS[cmdIndex];
      if (charIndex <= target.length) {
        setTypedText(target.slice(0, charIndex));
        charIndex += 1;
        timer = setTimeout(tick, 45);
      } else {
        timer = setTimeout(() => {
          cmdIndex = (cmdIndex + 1) % TERMINAL_COMMANDS.length;
          charIndex = 0;
          tick();
        }, 1200);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const projectsQuery = useQuery({
    queryKey: ['projects', { limit: 20 }],
    queryFn: () => projectsApi.list({ limit: 20 }),
  });

  const devsQuery = useQuery({
    queryKey: ['leaderboard', { mode: 'devs', range: 'all' }],
    queryFn: () => leaderboardApi.get({ mode: 'devs', range: 'all' }),
  });

  const hackathonsQuery = useQuery({
    queryKey: ['hackathons'],
    queryFn: () => hackathonsApi.list(),
  });

  const feedQuery = useQuery({
    queryKey: ['activity', 'feed'],
    queryFn: () => activityApi.feed({ limit: 6 }),
  });

  const trendingProjects = extractArray(projectsQuery.data, 'projects')
    .slice()
    .sort((a, b) => (b.likesCount ?? b.likes ?? 0) - (a.likesCount ?? a.likes ?? 0))
    .slice(0, 6);

  const topDevs = extractArray(devsQuery.data, 'rankings')
    .filter((d) => {
      if (!user) return true;
      const handle = (d.username || d.handle || '').toLowerCase();
      return handle !== (user.username || '').toLowerCase();
    })
    .slice(0, 4);

  const featuredHackathons = extractArray(hackathonsQuery.data, 'hackathons').slice(0, 3);
  const activityFeed = extractArray(feedQuery.data, 'events').slice(0, 5);

  const categories = Array.from(
    new Set(extractArray(projectsQuery.data, 'projects').map((p) => p.category).filter(Boolean))
  ).slice(0, 8);

  return (
    <div data-testid="page-home">
      {/* Hero Section with Three.js 3D WebGL Canvas */}
      <section className="wrap pt-8 pb-12">
        <div className="glass relative overflow-hidden rounded-[var(--radius-xl)] p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 opacity-65">
            <HeroCanvas height={460} />
          </div>

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                DevVerse OS · Unified Developer Ecosystem
              </span>
              <h1 className="mb-5 text-4xl font-bold leading-[1.05] sm:text-6xl">
                Where builders become <span className="grad-text">legends.</span>
              </h1>
              <p className="lede mb-6">
                Ship open-source projects, form hackathon squads, publish post-mortems in the
                Codex, and build a verifiable engineering portfolio.
              </p>

              {/* Terminal typing bar */}
              <div className="mono mb-7 inline-flex items-center gap-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)]/80 px-4 py-2.5 text-xs text-[var(--cyan)] backdrop-blur-md">
                <Terminal className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                <span>$ {typedText}</span>
                <span className="inline-block h-4 w-1.5 animate-pulse bg-[var(--cyan)]" />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link to="/explore" className="btn btn-primary">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  Explore Projects
                </Link>
                {isAuthenticated ? (
                  <Link to="/submit-project" className="btn btn-ghost">
                    <Rocket className="h-4 w-4" aria-hidden="true" />
                    Ship a Project
                  </Link>
                ) : (
                  <Link to="/signup" className="btn btn-ghost">
                    Join DevVerse (+20 pts)
                  </Link>
                )}
              </div>
            </div>

            <ParallaxLayer speed={-28} className="hidden justify-center lg:flex">
              <motion.img
                src={theme === 'light' ? heroRobotLight : heroRobotDark}
                alt="DevVerse Mascot"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="max-h-[340px] w-auto drop-shadow-[0_24px_48px_rgba(124,111,255,0.28)]"
              />
            </ParallaxLayer>
          </div>
        </div>
      </section>

      {/* Platform Stat Strip */}
      <section className="wrap pb-16">
        <RevealSection>
          <div className="stat-strip">
          <div className="stat-cell">
            <div className="stat-num">
              <AnimatedCounter value={extractArray(projectsQuery.data, 'projects').length || 24} suffix="+" />
            </div>
            <div className="stat-label">Shipped Projects</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">
              <AnimatedCounter value={extractArray(devsQuery.data, 'rankings').length || 16} suffix="+" />
            </div>
            <div className="stat-label">Active Builders</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">
              <AnimatedCounter value={featuredHackathons.length || 4} />
            </div>
            <div className="stat-label">Live Hackathons</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">
              <AnimatedCounter value={99.9} decimals={1} suffix="%" />
            </div>
            <div className="stat-label">MERN Uptime</div>
          </div>
          </div>
        </RevealSection>
      </section>

      {/* Trending Projects */}
      <section className="wrap section-tight">
        <RevealSection>
        <div className="section-head">
          <div>
            <span className="eyebrow">Shipped by the community</span>
            <h2>Trending Projects</h2>
          </div>
          <Link to="/explore" className="btn btn-outline btn-sm">
            View all projects <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-3">
          {projectsQuery.isLoading ? (
            <Skeleton variant="card" count={3} />
          ) : (
            trendingProjects.map((project, idx) => (
              <ProjectCard
                key={project._id || project.id || project.legacyId || idx}
                project={project}
                index={idx}
              />
            ))
          )}
        </div>
        </RevealSection>
      </section>

      {/* Category Tiles */}
      {categories.length > 0 && (
        <section className="wrap section-tight">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="eyebrow">Browse by Stack</span>
              <h2 className="text-2xl font-bold">Ecosystem Domains</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/explore?cat=${encodeURIComponent(cat)}`}
                className="chip chip-link px-4 py-2 text-xs"
              >
                <Code2 className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Hackathons */}
      <section className="wrap section-tight">
        <RevealSection>
        <div className="section-head">
          <div>
            <span className="eyebrow">48-hour sprints</span>
            <h2>Active Hackathons</h2>
          </div>
          <Link to="/hackathons" className="btn btn-outline btn-sm">
            All arenas <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-3">
          {hackathonsQuery.isLoading ? (
            <Skeleton variant="card" count={3} />
          ) : (
            featuredHackathons.map((h, idx) => (
              <HackathonCard key={h._id || h.id || h.legacyId || idx} hackathon={h} index={idx} />
            ))
          )}
        </div>
        </RevealSection>
      </section>

      {/* Top Builders + Live Activity Feed */}
      <section className="wrap section-tight">
        <RevealSection>
        <div className="detail-grid detail-grid--wide">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="eyebrow">Leaderboard</span>
                <h2 className="text-2xl font-bold">Top Builders</h2>
              </div>
              <Link to="/leaderboard" className="btn btn-ghost btn-sm">
                Full rankings
              </Link>
            </div>
            <div className="grid grid-2">
              {devsQuery.isLoading ? (
                <Skeleton variant="card" count={2} />
              ) : (
                topDevs.map((dev, idx) => (
                  <DevCard key={dev._id || dev.username || idx} dev={dev} index={idx} />
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <span className="eyebrow">Pulse</span>
              <h2 className="text-2xl font-bold">Live Activity</h2>
            </div>
            <GlassCard className="p-5">
              {feedQuery.isLoading ? (
                <Skeleton variant="line" count={4} className="mb-3" />
              ) : activityFeed.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">
                  Recent builder actions will appear here.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {activityFeed.map((ev, idx) => (
                    <li key={ev._id || idx} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-[var(--text-primary)]">
                          {ev.description || ev.action || ev.reason || 'Builder activity'}
                        </span>
                        {ev.points ? (
                          <span className="mono text-xs font-semibold text-[var(--cyan)]">
                            +{ev.points} XP
                          </span>
                        ) : null}
                      </div>
                      <div className="mono mt-1 text-[11px] text-[var(--text-tertiary)]">
                        {ev.actor?.username ? `@${ev.actor.username} · ` : ''}
                        {timeAgo(ev.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>

            <GlassCard className="mt-5 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                <span>Engineering Codex</span>
              </div>
              <p className="mb-4 text-xs text-[var(--text-secondary)]">
                Unlock at 200 XP to publish post-mortems, architecture patterns, and war stories.
              </p>
              <div className="flex gap-2">
                <Link to="/codex" className="btn btn-outline btn-sm flex-1">
                  Read Codex
                </Link>
                <Link to="/squads" className="btn btn-ghost btn-sm flex-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" /> Squads
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
        </RevealSection>
      </section>
    </div>
  );
}
