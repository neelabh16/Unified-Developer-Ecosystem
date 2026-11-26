import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Heart } from 'lucide-react';
import Badge from '../common/Badge';
import { TiltCard } from '../common/MotionPrimitives';
import { formatCount, resolveProjectArt } from '../../utils/formatters';
import { resolveUploadUrl } from '../../utils/avatar';

const DIFFICULTY_COLORS = {
  Beginner: 'text-[var(--cyan)] border-[var(--cyan)]/30 bg-[var(--cyan-soft)]',
  Intermediate: 'text-[var(--accent)] border-[var(--accent)]/30 bg-[var(--accent-soft)]',
  Advanced: 'text-[var(--coral)] border-[var(--coral)]/30 bg-[var(--coral-soft)]',
};

export default function ProjectCard({ project, index = 0 }) {
  if (!project) return null;

  const projectId = project.legacyId || project.slug || project.id || project._id;
  const title = project.title || 'Untitled Project';
  const desc = project.desc || project.tagline || 'No description provided.';
  const category = project.category || 'General';
  const difficulty = project.difficulty || 'Intermediate';
  const tags = Array.isArray(project.tags) ? project.tags.slice(0, 3) : [];
  const likes = project.likesCount ?? project.likes ?? 0;
  const views = project.viewsCount ?? project.views ?? 0;

  const authorHandle =
    typeof project.author === 'string'
      ? project.author
      : project.author?.username || project.author?.name || 'devverse';

  const firstImage = Array.isArray(project.images) && project.images.length > 0
    ? resolveUploadUrl(project.images[0])
    : null;
  const coverSrc = firstImage || resolveProjectArt(project);

  return (
    <TiltCard className="h-full">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.28) }}
        className="glass card-lift group flex h-full flex-col overflow-hidden"
      >
      <Link to={`/projects/${encodeURIComponent(projectId)}`} className="block overflow-hidden">
        <div className="relative h-44 w-full overflow-hidden bg-[var(--bg-elevated)]">
          <img
            src={coverSrc}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg)]/80 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="chip backdrop-blur-md">{category}</span>
            <span
              className={`chip border backdrop-blur-md ${
                DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Intermediate
              }`}
            >
              {difficulty}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link
          to={`/projects/${encodeURIComponent(projectId)}`}
          className="mb-2 block text-lg font-semibold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]"
        >
          {title}
        </Link>
        <p className="mb-4 line-clamp-2 flex-1 text-sm text-[var(--text-secondary)]">
          {desc}
        </p>

        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} className="text-[11px]">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--text-tertiary)]">
          <Link
            to={`/profile/${encodeURIComponent(authorHandle)}`}
            className="mono truncate font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            @{authorHandle}
          </Link>
          <div className="flex items-center gap-3 font-mono">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-[var(--coral)]" aria-hidden="true" />
              {formatCount(likes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-[var(--cyan)]" aria-hidden="true" />
              {formatCount(views)}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
    </TiltCard>
  );
}
