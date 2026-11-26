import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Flame, Swords } from 'lucide-react';
import GlassCard from './GlassCard';
import Button from './Button';
import Skeleton from './Skeleton';
import { githubApi } from '../../api/github.api';
import { formatCount } from '../../utils/formatters';

function computeFighterStats(userRes, reposRes) {
  const profile = userRes?.data?.profile || userRes?.data?.user || userRes?.data || null;
  const repos = reposRes?.data?.repos || reposRes?.data || [];
  const safeRepos = Array.isArray(repos) ? repos : [];

  const stars = safeRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const forks = safeRepos.reduce((s, r) => s + (r.forks_count || 0), 0);
  const publicRepos = profile?.public_repos ?? safeRepos.length;
  const langs = new Set(safeRepos.map((r) => r.language).filter(Boolean)).size;
  const followers = profile?.followers ?? 0;

  const power = stars * 3 + forks * 4 + publicRepos * 10 + langs * 35 + followers * 2;
  return {
    handle: profile?.login || 'builder',
    name: profile?.name || profile?.login || 'Builder',
    avatar: profile?.avatar_url || '',
    stars,
    forks,
    publicRepos,
    langs,
    followers,
    power,
  };
}

export default function DevDuel() {
  const [leftInput, setLeftInput] = useState('gaearon');
  const [rightInput, setRightInput] = useState('shadcn');
  const [fighters, setFighters] = useState({ left: 'gaearon', right: 'shadcn' });

  const leftUser = useQuery({
    queryKey: ['duel', 'user', fighters.left],
    queryFn: () => githubApi.getUser(fighters.left),
    enabled: Boolean(fighters.left),
    retry: false,
  });
  const leftRepos = useQuery({
    queryKey: ['duel', 'repos', fighters.left],
    queryFn: () => githubApi.getRepos(fighters.left),
    enabled: Boolean(fighters.left),
    retry: false,
  });

  const rightUser = useQuery({
    queryKey: ['duel', 'user', fighters.right],
    queryFn: () => githubApi.getUser(fighters.right),
    enabled: Boolean(fighters.right),
    retry: false,
  });
  const rightRepos = useQuery({
    queryKey: ['duel', 'repos', fighters.right],
    queryFn: () => githubApi.getRepos(fighters.right),
    enabled: Boolean(fighters.right),
    retry: false,
  });

  const isLoading =
    leftUser.isLoading || leftRepos.isLoading || rightUser.isLoading || rightRepos.isLoading;

  const leftStats = computeFighterStats(leftUser.data, leftRepos.data);
  const rightStats = computeFighterStats(rightUser.data, rightRepos.data);
  const winner =
    leftStats.power === rightStats.power
      ? 'tie'
      : leftStats.power > rightStats.power
        ? 'left'
        : 'right';

  const handleDuel = (e) => {
    e.preventDefault();
    const l = leftInput.trim().replace(/^@/, '');
    const r = rightInput.trim().replace(/^@/, '');
    if (l && r) setFighters({ left: l, right: r });
  };

  const metrics = [
    { label: 'Stars', l: leftStats.stars, r: rightStats.stars },
    { label: 'Forks', l: leftStats.forks, r: rightStats.forks },
    { label: 'Public Repos', l: leftStats.publicRepos, r: rightStats.publicRepos },
    { label: 'Languages', l: leftStats.langs, r: rightStats.langs },
  ];

  return (
    <GlassCard className="mb-10 overflow-hidden p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="eyebrow">
            <Swords className="h-3.5 w-3.5" aria-hidden="true" />
            1v1 GitHub Arena
          </span>
          <h2 className="mb-1 text-2xl font-bold sm:text-3xl">
            Developer <span className="grad-text">Battle Mode</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Pit any two GitHub builders head-to-head across stars, forks, shipped repos, and
            polyglot range.
          </p>
        </div>

        <form onSubmit={handleDuel} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={leftInput}
            onChange={(e) => setLeftInput(e.target.value)}
            placeholder="Builder 1"
            aria-label="First GitHub username"
            className="w-36"
          />
          <span className="mono text-xs font-bold text-[var(--coral)]">VS</span>
          <input
            type="text"
            value={rightInput}
            onChange={(e) => setRightInput(e.target.value)}
            placeholder="Builder 2"
            aria-label="Second GitHub username"
            className="w-36"
          />
          <Button type="submit" variant="primary" size="sm" loading={isLoading}>
            <Flame className="h-4 w-4" aria-hidden="true" />
            Duel
          </Button>
        </form>
      </div>

      {isLoading ? (
        <Skeleton variant="rect" height="180px" />
      ) : (
        <div className="space-y-5">
          {/* Fighters Header */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { side: 'left', data: leftStats, input: fighters.left },
              { side: 'right', data: rightStats, input: fighters.right },
            ].map((f) => {
              const isWin = winner === f.side;
              return (
                <div
                  key={f.side}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                    isWin
                      ? 'border-[var(--legend)] bg-[var(--legend)]/10'
                      : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {f.data.avatar && (
                      <img
                        src={f.data.avatar}
                        alt={f.input}
                        className="h-12 w-12 rounded-full border border-[var(--border-strong)] object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="truncate">{f.data.name}</span>
                        {isWin && <Crown className="h-4 w-4 shrink-0 text-[var(--legend)]" />}
                      </div>
                      <div className="mono text-xs text-[var(--text-tertiary)]">@{f.input}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-lg font-bold text-[var(--cyan)]">
                      {formatCount(f.data.power)}
                    </div>
                    <div className="mono text-[10px] uppercase text-[var(--text-tertiary)]">
                      Power
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tug-of-War Metric Bars */}
          <div className="space-y-3">
            {metrics.map((m) => {
              const total = Math.max(1, m.l + m.r);
              const leftPct = Math.round((m.l / total) * 100);
              return (
                <div key={m.label} className="space-y-1">
                  <div className="mono flex justify-between text-xs">
                    <span className="font-semibold text-[var(--violet)]">
                      {formatCount(m.l)}
                    </span>
                    <span className="text-[var(--text-tertiary)]">{m.label}</span>
                    <span className="font-semibold text-[var(--cyan)]">
                      {formatCount(m.r)}
                    </span>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]">
                    <div
                      className="bg-[var(--violet)] transition-all duration-500"
                      style={{ width: `${leftPct}%` }}
                    />
                    <div
                      className="bg-[var(--cyan)] transition-all duration-500"
                      style={{ width: `${100 - leftPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
