import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from '../common/Badge';
import { formatCount } from '../../utils/formatters';
import { AVATAR_FALLBACK_SVG, getAvatarUrl } from '../../utils/avatar';
import { getCurrentTier } from '../../utils/gamification';

export default function DevCard({ dev, index = 0 }) {
  if (!dev) return null;

  const handle = dev.username || dev.handle || 'builder';
  const name = dev.name || handle;
  const points = Number(dev.points) || 0;
  const projectsCount = dev.projectsCount ?? dev.projects ?? 0;
  const followersCount = dev.followersCount ?? dev.followers ?? 0;
  const avatarSrc = getAvatarUrl(dev.avatarUrl || dev.avatarSeed || handle, 96);
  const tier = getCurrentTier(points);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.24) }}
    >
      <Link
        to={`/profile/${encodeURIComponent(handle)}`}
        className="glass card-lift flex flex-col items-center p-6 text-center transition-all"
      >
        <div
          className="mb-3 h-16 w-16 overflow-hidden rounded-full p-[2px]"
          style={{
            background:
              'conic-gradient(from 180deg, var(--violet), var(--cyan), var(--coral), var(--violet))',
          }}
        >
          <img
            src={avatarSrc}
            alt={name}
            onError={(e) => {
              e.currentTarget.src = AVATAR_FALLBACK_SVG;
            }}
            className="h-full w-full rounded-full bg-[var(--bg-elevated)] object-cover"
          />
        </div>

        <div className="mb-0.5 text-base font-semibold text-[var(--text-primary)]">{name}</div>
        <div className="mono mb-2.5 text-xs text-[var(--text-tertiary)]">@{handle}</div>

        <Badge variant="tier" icon={tier.icon} className="mb-4">
          {tier.name}
        </Badge>

        <div className="grid w-full grid-cols-2 gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-tertiary)]">
          <div>
            <b className="block font-mono text-sm text-[var(--text-primary)]">
              {formatCount(projectsCount)}
            </b>
            projects
          </div>
          <div>
            <b className="block font-mono text-sm text-[var(--text-primary)]">
              {formatCount(followersCount)}
            </b>
            followers
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
