import { Copy, Printer, ShieldCheck } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';
import { TiltCard } from './MotionPrimitives';
import { useToast } from '../../hooks/useToast';
import { AVATAR_FALLBACK_SVG, getAvatarUrl } from '../../utils/avatar';
import { getCurrentTier } from '../../utils/gamification';

export default function EngineeringPassport({ profile, projectsCount = 0, followersCount = 0 }) {
  const { showToast } = useToast();
  if (!profile) return null;

  const points = Number(profile.points) || 0;
  const tier = getCurrentTier(points);
  const skills = Array.isArray(profile.skills) ? profile.skills.slice(0, 6) : [];
  const verifyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/profile/${encodeURIComponent(profile.username)}`
      : '';

  const handleCopy = () => {
    if (verifyUrl) navigator.clipboard?.writeText(verifyUrl);
    showToast('Verification link copied to clipboard', 'success');
  };

  return (
    <TiltCard maxTilt={5}>
      <div className="glass relative overflow-hidden rounded-[var(--radius-xl)] border-[var(--border-strong)] p-6 sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--accent)]/15 blur-3xl"
        />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--cyan)]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Verified Engineering Passport
          </div>
          <span className="mono text-[11px] text-[var(--text-tertiary)]">
            ID · DV-{String(profile._id || profile.username).slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-4">
          <img
            src={getAvatarUrl(profile.avatarUrl || profile.avatarSeed || profile.username, 96)}
            alt={profile.name || profile.username}
            onError={(e) => {
              e.currentTarget.src = AVATAR_FALLBACK_SVG;
            }}
            className="h-16 w-16 rounded-full border-2 border-[var(--cyan)] object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold">{profile.name || profile.username}</h3>
              <Badge variant="tier" icon={tier.icon}>
                {tier.name}
              </Badge>
            </div>
            <div className="mono text-xs text-[var(--text-tertiary)]">
              @{profile.username}
              {profile.roleTitle ? ` · ${profile.roleTitle}` : ''}
            </div>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        )}

        <div className="mb-5 grid grid-cols-3 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-center">
          <div>
            <div className="mono text-base font-bold text-[var(--cyan)]">
              {points.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-[var(--text-tertiary)]">Verified XP</div>
          </div>
          <div>
            <div className="mono text-base font-bold">{projectsCount}</div>
            <div className="text-[10.5px] text-[var(--text-tertiary)]">Shipped</div>
          </div>
          <div>
            <div className="mono text-base font-bold text-[var(--accent)]">{followersCount}</div>
            <div className="text-[10.5px] text-[var(--text-tertiary)]">Followers</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy Passport Link
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print / Save PDF
          </Button>
        </div>
      </div>
    </TiltCard>
  );
}
