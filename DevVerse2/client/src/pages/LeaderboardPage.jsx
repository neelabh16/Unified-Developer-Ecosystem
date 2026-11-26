import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Crown, Flame, Trophy } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import DevDuel from '../components/common/DevDuel';
import { ParallaxLayer, RevealSection, TiltCard } from '../components/common/MotionPrimitives';
import { leaderboardApi } from '../api/leaderboard.api';
import { AVATAR_FALLBACK_SVG, getAvatarUrl } from '../utils/avatar';
import { formatCount } from '../utils/formatters';
import { getCurrentTier, POINT_ACTIONS_REFERENCE, TIERS } from '../utils/gamification';
import { robotPodium } from '../utils/assets';

export default function LeaderboardPage() {
  const [mode, setMode] = useState('devs');
  const [range, setRange] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', { mode, range }],
    queryFn: () => leaderboardApi.get({ mode, range }),
  });

  const rankings = data?.data?.rankings || data?.rankings || [];
  const topThree = rankings.slice(0, 3);

  return (
    <div className="wrap page-header" data-testid="page-leaderboard">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="eyebrow">Rankings &amp; XP</span>
          <h1 className="mb-3">
            Builder <span className="grad-text">Leaderboard</span>
          </h1>
          <p className="lede">
            Earn XP by shipping projects, helping in forums, forming squads, and writing Codex
            post-mortems.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="pill-toggle" role="group" aria-label="Leaderboard mode">
            <button
              type="button"
              onClick={() => setMode('devs')}
              className={mode === 'devs' ? 'active' : ''}
            >
              Builders
            </button>
            <button
              type="button"
              onClick={() => setMode('projects')}
              className={mode === 'projects' ? 'active' : ''}
            >
              Projects
            </button>
          </div>

          <div className="pill-toggle" role="group" aria-label="Time range">
            <button
              type="button"
              onClick={() => setRange('all')}
              className={range === 'all' ? 'active' : ''}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setRange('weekly')}
              className={range === 'weekly' ? 'active' : ''}
            >
              This Week
            </button>
          </div>
        </div>
      </div>

      {/* 1v1 GitHub Battle Mode */}
      <DevDuel />

      {/* Top 3 Podium */}
      {!isLoading && mode === 'devs' && topThree.length > 0 && (
        <ParallaxLayer speed={-14} className="mb-10">
          <div className="grid gap-5 md:grid-cols-3">
            {topThree.map((entry, idx) => {
              const handle = entry.username || entry.handle || 'builder';
              const tier = getCurrentTier(entry.points);
              const rankColors = ['var(--legend)', '#c0c7d6', 'var(--amber)'];
              return (
                <TiltCard key={handle + idx}>
                  <GlassCard
                    lift
                    className="relative flex h-full flex-col items-center p-6 text-center"
                    style={{ borderColor: idx === 0 ? 'var(--legend)' : undefined }}
                  >
                    <div
                      className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold text-black"
                      style={{ background: rankColors[idx] }}
                    >
                      #{idx + 1}
                    </div>
                    <img
                      src={getAvatarUrl(entry.avatarUrl || entry.avatarSeed || handle, 96)}
                      alt={entry.name || handle}
                      onError={(e) => {
                        e.currentTarget.src = AVATAR_FALLBACK_SVG;
                      }}
                      className="mb-3 h-16 w-16 rounded-full border-2 object-cover"
                      style={{ borderColor: rankColors[idx] }}
                    />
                    <Link
                      to={`/profile/${encodeURIComponent(handle)}`}
                      className="text-lg font-bold hover:text-[var(--accent)]"
                    >
                      {entry.name || handle}
                    </Link>
                    <div className="mono mb-2 text-xs text-[var(--text-tertiary)]">@{handle}</div>
                    <Badge variant="tier" icon={tier.icon} className="mb-3">
                      {tier.name}
                    </Badge>
                    <div className="mono mt-auto text-xl font-bold text-[var(--cyan)]">
                      {Number(entry.points || 0).toLocaleString()} XP
                    </div>
                  </GlassCard>
                </TiltCard>
              );
            })}
          </div>
        </ParallaxLayer>
      )}

      <RevealSection>
        <div className="detail-grid detail-grid--wide">
        {/* Full Rankings List */}
        <GlassCard className="overflow-hidden p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--amber)]" aria-hidden="true" />
            <h2 className="text-xl font-bold">
              {mode === 'devs' ? 'Global Builder Rankings' : 'Top Projects'}
            </h2>
          </div>

          {isLoading ? (
            <Skeleton variant="line" count={6} className="mb-3" />
          ) : rankings.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No rankings available yet.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {rankings.map((item, idx) => {
                if (mode === 'projects') {
                  const pId = item.legacyId || item.slug || item._id || item.id;
                  return (
                    <div
                      key={pId || idx}
                      className="flex items-center justify-between gap-4 py-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="mono w-7 text-sm font-bold text-[var(--text-tertiary)]">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <Link
                            to={`/projects/${encodeURIComponent(pId)}`}
                            className="block truncate font-semibold hover:text-[var(--accent)]"
                          >
                            {item.title}
                          </Link>
                          <div className="mono text-xs text-[var(--text-tertiary)]">
                            @{item.author?.username || item.author || 'builder'} ·{' '}
                            {item.category || 'General'}
                          </div>
                        </div>
                      </div>
                      <div className="mono text-sm font-bold text-[var(--coral)]">
                        {formatCount(item.likesCount ?? item.likes ?? 0)} likes
                      </div>
                    </div>
                  );
                }

                const handle = item.username || item.handle || 'builder';
                const tier = getCurrentTier(item.points);
                return (
                  <div
                    key={handle + idx}
                    className="flex items-center justify-between gap-4 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="mono w-7 text-sm font-bold text-[var(--text-tertiary)]">
                        #{idx + 1}
                      </span>
                      <img
                        src={getAvatarUrl(item.avatarUrl || handle, 48)}
                        alt={item.name || handle}
                        onError={(e) => {
                          e.currentTarget.src = AVATAR_FALLBACK_SVG;
                        }}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/profile/${encodeURIComponent(handle)}`}
                          className="block truncate font-semibold hover:text-[var(--accent)]"
                        >
                          {item.name || handle}
                        </Link>
                        <div className="mono text-xs text-[var(--text-tertiary)]">
                          @{handle} · {tier.icon} {tier.name}
                        </div>
                      </div>
                    </div>
                    <div className="mono text-sm font-bold text-[var(--cyan)]">
                      {Number(item.points || 0).toLocaleString()} XP
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* XP Guide & Tiers */}
        <div className="sticky-panel space-y-5">
          <GlassCard className="p-6 text-center">
            <img
              src={robotPodium}
              alt="DevVerse Podium"
              className="mx-auto mb-3 max-h-36 w-auto"
            />
            <div className="mb-1 flex items-center justify-center gap-1.5 font-semibold">
              <Crown className="h-4 w-4 text-[var(--legend)]" aria-hidden="true" />
              <span>Tier Progression</span>
            </div>
            <div className="mt-4 space-y-2 text-left text-xs">
              {TIERS.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg bg-[var(--surface)] px-3 py-2"
                >
                  <span>
                    {t.icon} <strong>{t.name}</strong>
                  </span>
                  <span className="mono text-[var(--text-tertiary)]">{t.min}+ XP</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Flame className="h-4 w-4 text-[var(--coral)]" aria-hidden="true" />
              <span>How to Earn XP</span>
            </div>
            <ul className="space-y-2 text-xs">
              {POINT_ACTIONS_REFERENCE.map((act) => (
                <li
                  key={act.id}
                  className="flex items-center justify-between text-[var(--text-secondary)]"
                >
                  <span>{act.label}</span>
                  <span className="mono font-semibold text-[var(--cyan)]">{act.points}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
      </RevealSection>
    </div>
  );
}
