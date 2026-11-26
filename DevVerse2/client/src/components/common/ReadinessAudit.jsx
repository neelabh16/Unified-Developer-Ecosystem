import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Gauge } from 'lucide-react';
import GlassCard from './GlassCard';
import { CODEX_REQUIRED_POINTS } from '../../utils/gamification';

export default function ReadinessAudit({
  profile,
  projectsCount = 0,
  followersCount = 0,
  isOwnProfile = false,
}) {
  if (!profile) return null;

  const points = Number(profile.points) || 0;
  const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
  const hasBio = Boolean(profile.bio && profile.bio.trim().length >= 10);
  const hasGithub = Boolean(profile.github && profile.github.trim());
  const codexUnlocked = points >= CODEX_REQUIRED_POINTS || profile.role === 'admin';

  const pillars = [
    {
      label: 'Shipping Velocity',
      score: Math.min(25, projectsCount * 10 + (points >= 50 ? 5 : 0)),
      max: 25,
      color: 'var(--cyan)',
    },
    {
      label: 'Identity & GitHub Sync',
      score: (hasBio ? 8 : 0) + (hasGithub ? 10 : 0) + (skillsCount >= 3 ? 7 : skillsCount * 2),
      max: 25,
      color: 'var(--violet)',
    },
    {
      label: 'Ecosystem Impact',
      score: Math.min(25, Math.round(points / 12) + Math.min(10, followersCount * 2)),
      max: 25,
      color: 'var(--amber)',
    },
    {
      label: 'Codex & Mastery',
      score: codexUnlocked ? 25 : Math.min(20, Math.round((points / CODEX_REQUIRED_POINTS) * 20)),
      max: 25,
      color: 'var(--coral)',
    },
  ];

  const totalScore = Math.min(
    100,
    pillars.reduce((sum, p) => sum + p.score, 0)
  );

  const checklist = [
    { done: projectsCount >= 1, label: 'Ship at least 1 project to Explore', to: '/submit-project' },
    { done: hasGithub, label: 'Link your GitHub handle for live repo sync', action: 'edit' },
    { done: skillsCount >= 3, label: 'Add 3+ core technical skills', action: 'edit' },
    { done: codexUnlocked, label: `Reach ${CODEX_REQUIRED_POINTS} XP to unlock Codex`, to: '/codex' },
  ];

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Builder Readiness Index
          </h3>
        </div>
        <span className="mono text-xs text-[var(--cyan)]">{totalScore}/100</span>
      </div>

      <div className="grid items-center gap-6 sm:grid-cols-[120px_1fr]">
        {/* Animated SVG Ring Gauge */}
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="var(--surface-hover)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="url(#readinessGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="readinessGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--violet)" />
                <stop offset="100%" stopColor="var(--cyan)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute text-center">
            <div className="mono text-2xl font-bold text-[var(--text-primary)]">{totalScore}</div>
            <div className="mono text-[9px] uppercase text-[var(--text-tertiary)]">Score</div>
          </div>
        </div>

        {/* 4 Pillar Bars */}
        <div className="space-y-2.5">
          {pillars.map((p) => (
            <div key={p.label}>
              <div className="mono mb-1 flex justify-between text-[11px]">
                <span className="text-[var(--text-secondary)]">{p.label}</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {p.score}/{p.max}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((p.score / p.max) * 100)}%`,
                    background: p.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {isOwnProfile && (
        <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-4">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-2 ${
                  item.done ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cyan)]" aria-hidden="true" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />
                )}
                {item.label}
              </span>
              {!item.done && item.to && (
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline"
                >
                  Go <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
