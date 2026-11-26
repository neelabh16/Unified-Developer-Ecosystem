import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Trophy, Users } from 'lucide-react';
import Badge from '../common/Badge';
import { useCountdown } from '../../hooks/useCountdown';

export default function HackathonCard({ hackathon, index = 0 }) {
  const id = hackathon?.legacyId || hackathon?.slug || hackathon?.id || hackathon?._id;
  const countdown = useCountdown(hackathon?.endTime || hackathon?.startDate);

  if (!hackathon) return null;

  const status = hackathon.status || (countdown.isLive ? 'Live' : 'Upcoming');
  const prize = hackathon.prize || hackathon.prizePool || 'Swag & Glory';
  const participants =
    hackathon.participantsCount ?? hackathon.participants?.length ?? hackathon.registrationsCount ?? 0;
  const tags = Array.isArray(hackathon.tags) ? hackathon.tags.slice(0, 3) : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      className="glass card-lift flex flex-col p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <Badge
          variant={status.toLowerCase() === 'live' ? 'accent' : 'default'}
          className={
            status.toLowerCase() === 'live'
              ? 'bg-[var(--cyan-soft)] text-[var(--cyan)]'
              : ''
          }
        >
          {status}
        </Badge>
        <span className="mono text-xs text-[var(--amber)]">{countdown.label}</span>
      </div>

      <Link
        to={`/hackathons/${encodeURIComponent(id)}`}
        className="mb-2 text-xl font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
      >
        {hackathon.title}
      </Link>

      <p className="mb-4 line-clamp-2 flex-1 text-sm text-[var(--text-secondary)]">
        {hackathon.tagline || hackathon.description || 'Build, ship, and compete with top builders.'}
      </p>

      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-[var(--amber)]" aria-hidden="true" />
          <span className="truncate font-semibold text-[var(--text-primary)]">{prize}</span>
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Users className="h-3.5 w-3.5 text-[var(--cyan)]" aria-hidden="true" />
          <span className="font-mono">{participants} builders</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          {hackathon.duration || '48h Sprint'}
        </span>
        <Link
          to={`/hackathons/${encodeURIComponent(id)}`}
          className="font-semibold text-[var(--accent)] hover:underline"
        >
          View arena →
        </Link>
      </div>
    </motion.article>
  );
}
