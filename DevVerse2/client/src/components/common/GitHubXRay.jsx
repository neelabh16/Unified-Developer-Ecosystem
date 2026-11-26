import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Cpu, ExternalLink, GitFork, Search, Sparkles, Star } from 'lucide-react';
import { GitHubIcon } from './BrandIcons';
import GlassCard from './GlassCard';
import Button from './Button';
import Badge from './Badge';
import Skeleton from './Skeleton';
import { TiltCard } from './MotionPrimitives';
import { githubApi } from '../../api/github.api';
import { formatCount, timeAgo } from '../../utils/formatters';

const PRESET_HANDLES = ['neelabh16', 'gaearon', 'shadcn', 'sindresorhus', 'torvalds'];
const LANG_COLORS = ['#7c6fff', '#4fe3c1', '#ff6b5b', '#ffb86b', '#f0c419'];

function computeArchetype(user, repos, languages) {
  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const langCount = languages.length;
  if (totalStars >= 5000) return 'Open-Source Legend';
  if (totalStars >= 200) return 'Ecosystem Maintainer';
  if (langCount >= 4) return 'Polyglot Systems Builder';
  if ((user?.public_repos || repos.length) >= 15) return 'High-Velocity Shipper';
  return 'Full-Stack Builder';
}

export default function GitHubXRay({ defaultHandle = 'neelabh16' }) {
  const [inputVal, setInputVal] = useState(defaultHandle);
  const [activeHandle, setActiveHandle] = useState(defaultHandle);

  const userQuery = useQuery({
    queryKey: ['github', 'xray', 'user', activeHandle],
    queryFn: () => githubApi.getUser(activeHandle),
    enabled: Boolean(activeHandle),
    retry: false,
  });

  const reposQuery = useQuery({
    queryKey: ['github', 'xray', 'repos', activeHandle],
    queryFn: () => githubApi.getRepos(activeHandle),
    enabled: Boolean(activeHandle),
    retry: false,
  });

  const eventsQuery = useQuery({
    queryKey: ['github', 'xray', 'events', activeHandle],
    queryFn: () => githubApi.getEvents(activeHandle),
    enabled: Boolean(activeHandle),
    retry: false,
  });

  const ghProfile =
    userQuery.data?.data?.profile ||
    userQuery.data?.data?.user ||
    userQuery.data?.data ||
    null;

  const repos = useMemo(() => {
    const raw = reposQuery.data?.data?.repos || reposQuery.data?.data || [];
    return Array.isArray(raw)
      ? [...raw].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      : [];
  }, [reposQuery.data]);

  const events = useMemo(() => {
    const raw = eventsQuery.data?.data?.events || eventsQuery.data?.data || [];
    return Array.isArray(raw) ? raw.slice(0, 4) : [];
  }, [eventsQuery.data]);

  const { languages, totalStars, totalForks, archetype } = useMemo(() => {
    const langCounts = new Map();
    let stars = 0;
    let forks = 0;
    repos.forEach((r) => {
      stars += r.stargazers_count || 0;
      forks += r.forks_count || 0;
      if (r.language) {
        langCounts.set(r.language, (langCounts.get(r.language) || 0) + 1);
      }
    });
    const total = Array.from(langCounts.values()).reduce((a, b) => a + b, 0) || 1;
    const langs = Array.from(langCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], idx) => ({
        name,
        pct: Math.round((count / total) * 100),
        color: LANG_COLORS[idx % LANG_COLORS.length],
      }));

    return {
      languages: langs,
      totalStars: stars,
      totalForks: forks,
      archetype: computeArchetype(ghProfile, repos, langs),
    };
  }, [ghProfile, repos]);

  const handleAnalyze = (e) => {
    e.preventDefault();
    const clean = inputVal.trim().replace(/^@/, '');
    if (clean) setActiveHandle(clean);
  };

  const isLoading = userQuery.isLoading || reposQuery.isLoading;
  const hasError = userQuery.isError && !ghProfile;

  return (
    <div className="glass relative overflow-hidden rounded-[var(--radius-xl)] p-6 sm:p-9">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="eyebrow">
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
            Global Engineering X-Ray
          </span>
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl">
            Analyze <span className="grad-text">any developer</span> on Earth
          </h2>
          <p className="max-w-xl text-sm text-[var(--text-secondary)]">
            Enter any GitHub username worldwide to inspect their real-time Language DNA, top
            repositories, engineering archetype, and live commit pulse.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="flex w-full max-w-md flex-col gap-2.5">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2.5 rounded-[11px] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 focus-within:border-[var(--accent)]">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="GitHub username (e.g. gaearon)"
                aria-label="GitHub username for X-Ray"
                style={{ border: 'none', background: 'transparent', padding: '10px 0' }}
              />
            </div>
            <Button type="submit" variant="primary" size="sm" loading={isLoading}>
              X-Ray
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mono text-[10.5px] text-[var(--text-tertiary)]">Try:</span>
            {PRESET_HANDLES.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setInputVal(h);
                  setActiveHandle(h);
                }}
                className={`chip cursor-pointer px-2.5 py-0.5 text-[10.5px] ${
                  activeHandle.toLowerCase() === h.toLowerCase() ? 'chip-accent' : ''
                }`}
              >
                @{h}
              </button>
            ))}
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton variant="card" count={3} />
        </div>
      ) : hasError ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Could not fetch live GitHub telemetry for <strong>@{activeHandle}</strong> right now. Try
          another handle or check GitHub rate limits.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr_1fr]">
          {/* Col 1: Identity & Archetype */}
          <TiltCard maxTilt={5}>
            <GlassCard className="flex h-full flex-col justify-between p-5">
              <div>
                <div className="mb-4 flex items-center gap-3.5">
                  {ghProfile?.avatar_url ? (
                    <img
                      src={ghProfile.avatar_url}
                      alt={activeHandle}
                      className="h-14 w-14 rounded-full border-2 border-[var(--accent)] object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                      <GitHubIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-lg font-bold">
                      {ghProfile?.name || activeHandle}
                    </div>
                    <div className="mono truncate text-xs text-[var(--text-tertiary)]">
                      @{ghProfile?.login || activeHandle}
                    </div>
                  </div>
                </div>

                <Badge variant="tier" icon={<Sparkles className="h-3 w-3" />} className="mb-3">
                  {archetype}
                </Badge>

                {ghProfile?.bio && (
                  <p className="mb-4 line-clamp-3 text-xs text-[var(--text-secondary)]">
                    {ghProfile.bio}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 text-center">
                <div>
                  <div className="mono text-base font-bold text-[var(--amber)]">
                    {formatCount(totalStars)}
                  </div>
                  <div className="text-[10.5px] text-[var(--text-tertiary)]">Stars</div>
                </div>
                <div>
                  <div className="mono text-base font-bold text-[var(--cyan)]">
                    {formatCount(totalForks)}
                  </div>
                  <div className="text-[10.5px] text-[var(--text-tertiary)]">Forks</div>
                </div>
                <div>
                  <div className="mono text-base font-bold text-[var(--accent)]">
                    {ghProfile?.public_repos ?? repos.length}
                  </div>
                  <div className="text-[10.5px] text-[var(--text-tertiary)]">Repos</div>
                </div>
              </div>
            </GlassCard>
          </TiltCard>

          {/* Col 2: Language DNA + Top Repos */}
          <GlassCard className="flex flex-col justify-between p-5">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="mono text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Language DNA
                </span>
                <span className="mono text-[11px] text-[var(--cyan)]">
                  {languages.length} primary stacks
                </span>
              </div>

              {/* Stacked Neon DNA Bar */}
              <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]">
                {languages.map((lang) => (
                  <div
                    key={lang.name}
                    style={{ width: `${lang.pct}%`, background: lang.color }}
                    title={`${lang.name}: ${lang.pct}%`}
                  />
                ))}
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang.name}
                    className="mono inline-flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: lang.color }}
                      aria-hidden="true"
                    />
                    {lang.name} {lang.pct}%
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--border)] pt-3">
              <div className="mono text-[10.5px] uppercase tracking-wider text-[var(--text-tertiary)]">
                Top Repositories
              </div>
              {repos.slice(0, 3).map((r) => (
                <a
                  key={r.id || r.name}
                  href={r.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs transition-colors hover:border-[var(--accent)]"
                >
                  <span className="truncate font-semibold text-[var(--text-primary)]">
                    {r.name}
                  </span>
                  <span className="mono flex shrink-0 items-center gap-2.5 text-[11px] text-[var(--text-tertiary)]">
                    <span className="inline-flex items-center gap-0.5 text-[var(--amber)]">
                      <Star className="h-3 w-3" /> {formatCount(r.stargazers_count || 0)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[var(--cyan)]">
                      <GitFork className="h-3 w-3" /> {formatCount(r.forks_count || 0)}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </GlassCard>

          {/* Col 3: Live Commit / Event Stream */}
          <GlassCard className="flex flex-col justify-between p-5">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--cyan)]" aria-hidden="true" />
                <span className="mono text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Live GitHub Pulse
                </span>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">
                  No recent public events for @{activeHandle}.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {events.map((ev, idx) => (
                    <li
                      key={ev.id || idx}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs"
                    >
                      <div className="line-clamp-1 font-medium text-[var(--text-primary)]">
                        {ev.description || ev.title || ev.type || 'GitHub activity'}
                      </div>
                      <div className="mono mt-1 flex justify-between text-[10.5px] text-[var(--text-tertiary)]">
                        <span className="truncate">{ev.repo || ''}</span>
                        <span>{timeAgo(ev.published || ev.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <a
              href={`https://github.com/${encodeURIComponent(activeHandle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm mt-4 w-full"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open GitHub Profile
            </a>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
