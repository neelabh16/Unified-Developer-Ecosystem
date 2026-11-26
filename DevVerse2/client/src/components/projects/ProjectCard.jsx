import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Eye, Heart } from 'lucide-react';
import Badge from '../common/Badge';
import { TiltCard } from '../common/MotionPrimitives';
import { projectsApi } from '../../api/projects.api';
import { bookmarksApi } from '../../api/users.api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatCount, resolveProjectArt } from '../../utils/formatters';
import { resolveUploadUrl } from '../../utils/avatar';
import { invalidateGamification } from '../../utils/gamification';

const DIFFICULTY_COLORS = {
  Beginner: 'text-[var(--cyan)] border-[var(--cyan)]/30 bg-[var(--cyan-soft)]',
  Intermediate: 'text-[var(--accent)] border-[var(--accent)]/30 bg-[var(--accent-soft)]',
  Advanced: 'text-[var(--coral)] border-[var(--coral)]/30 bg-[var(--coral-soft)]',
};

function hasProjectKey(res, keys) {
  const payload = res?.data ?? res;
  const ids = payload?.projectIds || [];
  if (!Array.isArray(ids) || keys.length === 0) return false;
  return keys.some((k) => ids.includes(k));
}

export default function ProjectCard({ project, index = 0 }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [likedOverride, setLikedOverride] = useState(null);
  const [bookmarkedOverride, setBookmarkedOverride] = useState(null);
  const [likesCountOverride, setLikesCountOverride] = useState(null);

  const likesQuery = useQuery({
    queryKey: ['bookmarks', 'likes'],
    queryFn: () => bookmarksApi.getLikes(),
    enabled: isAuthenticated,
    retry: false,
  });

  const bookmarksQuery = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => bookmarksApi.get(),
    enabled: isAuthenticated,
    retry: false,
  });

  const projectId = project?.legacyId || project?.slug || project?.id || project?._id;
  const matchKeys = [project?._id, project?.id, project?.legacyId, project?.slug]
    .filter(Boolean)
    .map(String);

  const baseLikes = project?.likesCount ?? project?.likes ?? 0;
  const isLiked =
    likedOverride !== null
      ? likedOverride
      : Boolean(project?.liked) || hasProjectKey(likesQuery.data, matchKeys);
  const isBookmarked =
    bookmarkedOverride !== null
      ? bookmarkedOverride
      : Boolean(project?.bookmarked) || hasProjectKey(bookmarksQuery.data, matchKeys);
  const displayedLikes = likesCountOverride !== null ? likesCountOverride : baseLikes;

  const likeMutation = useMutation({
    mutationFn: () => projectsApi.toggleLike(projectId),
    onMutate: () => {
      const next = !isLiked;
      setLikedOverride(next);
      setLikesCountOverride(Math.max(0, displayedLikes + (next ? 1 : -1)));
    },
    onSuccess: (res) => {
      if (typeof res?.data?.liked === 'boolean') setLikedOverride(res.data.liked);
      if (typeof res?.data?.likesCount === 'number') setLikesCountOverride(res.data.likesCount);
      queryClient.invalidateQueries({ queryKey: ['bookmarks', 'likes'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      invalidateGamification(queryClient);
      showToast(res?.data?.liked ? 'Project liked (+2 XP)' : 'Like removed', 'success');
    },
    onError: (err) => {
      setLikedOverride(null);
      setLikesCountOverride(null);
      showToast(err.message || 'Sign in to like projects', 'error');
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => projectsApi.toggleBookmark(projectId),
    onMutate: () => {
      setBookmarkedOverride(!isBookmarked);
    },
    onSuccess: (res) => {
      if (typeof res?.data?.bookmarked === 'boolean') setBookmarkedOverride(res.data.bookmarked);
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      invalidateGamification(queryClient);
      showToast(
        res?.data?.bookmarked ? 'Saved to bookmarks (+3 XP)' : 'Removed from bookmarks',
        'success'
      );
    },
    onError: (err) => {
      setBookmarkedOverride(null);
      showToast(err.message || 'Sign in to bookmark projects', 'error');
    },
  });

  if (!project) return null;

  const title = project.title || 'Untitled Project';
  const desc = project.desc || project.tagline || 'No description provided.';
  const category = project.category || 'General';
  const difficulty = project.difficulty || 'Intermediate';
  const tags = Array.isArray(project.tags) ? project.tags.slice(0, 3) : [];
  const views = project.viewsCount ?? project.views ?? 0;

  const authorHandle =
    typeof project.author === 'string'
      ? project.author
      : project.author?.username || project.author?.name || 'devverse';

  const firstImage =
    Array.isArray(project.images) && project.images.length > 0
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
          <p className="mb-4 line-clamp-2 flex-1 text-sm text-[var(--text-secondary)]">{desc}</p>

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
              <button
                type="button"
                onClick={() => likeMutation.mutate()}
                aria-label={isLiked ? 'Unlike project' : 'Like project'}
                aria-pressed={isLiked}
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-[var(--surface-hover)] ${
                  isLiked ? 'text-[var(--coral)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                <Heart
                  className="h-3.5 w-3.5 text-[var(--coral)]"
                  fill={isLiked ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                {formatCount(displayedLikes)}
              </button>

              <button
                type="button"
                onClick={() => bookmarkMutation.mutate()}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark project'}
                aria-pressed={isBookmarked}
                className={`inline-flex items-center rounded-md p-1 transition-colors hover:bg-[var(--surface-hover)] ${
                  isBookmarked ? 'text-[var(--cyan)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                <Bookmark
                  className="h-3.5 w-3.5 text-[var(--cyan)]"
                  fill={isBookmarked ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
              </button>

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
