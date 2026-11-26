import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Bookmark,
  Check,
  ExternalLink,
  Eye,
  GitFork,
  Heart,
  MessageSquare,
  Star,
  Trash2,
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import LightboxModal from '../components/common/LightboxModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ParallaxLayer, RevealSection, TiltCard } from '../components/common/MotionPrimitives';
import { projectsApi } from '../api/projects.api';
import { bookmarksApi } from '../api/users.api';
import { githubApi } from '../api/github.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  formatCount,
  parseGithubRepoUrl,
  resolveProjectArt,
  TECH_GRADIENTS,
  timeAgo,
} from '../utils/formatters';
import { AVATAR_FALLBACK_SVG, getAvatarUrl, resolveUploadUrl } from '../utils/avatar';
import { invalidateGamification } from '../utils/gamification';
import { commentSchema } from '../utils/validation';

function extractIdSet(res, key) {
  const payload = res?.data ?? res;
  const list = payload?.[key] || payload?.projects || (Array.isArray(payload) ? payload : []);
  const set = new Set();
  if (Array.isArray(list)) {
    list.forEach((item) => {
      if (typeof item === 'string') set.add(item);
      else if (item) {
        if (item._id) set.add(String(item._id));
        if (item.id) set.add(String(item.id));
        if (item.legacyId) set.add(String(item.legacyId));
        if (item.targetId) set.add(String(item.targetId));
      }
    });
  }
  return set;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [likedOverride, setLikedOverride] = useState(null);
  const [bookmarkedOverride, setBookmarkedOverride] = useState(null);
  const [likesCountOverride, setLikesCountOverride] = useState(null);

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
    enabled: Boolean(id),
  });

  const project =
    projectQuery.data?.data?.project || projectQuery.data?.data || projectQuery.data?.project;

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

  const commentsQuery = useQuery({
    queryKey: ['project', id, 'comments'],
    queryFn: () => projectsApi.getComments(id),
    enabled: Boolean(id),
  });

  const ghCoords = parseGithubRepoUrl(project?.githubUrl);
  const ghRepoQuery = useQuery({
    queryKey: ['github', 'repo', ghCoords?.owner, ghCoords?.repo],
    queryFn: () => githubApi.getRepo(ghCoords.owner, ghCoords.repo),
    enabled: Boolean(ghCoords?.owner && ghCoords?.repo),
    retry: false,
  });

  useEffect(() => {
    if (!id) return;
    projectsApi.trackView(id).catch(() => {});
  }, [id]);

  const likedIds = extractIdSet(likesQuery.data, 'likes');
  const bookmarkedIds = extractIdSet(bookmarksQuery.data, 'bookmarks');
  const matchKeys = [project?._id, project?.id, project?.legacyId, id]
    .filter(Boolean)
    .map(String);

  const isLiked =
    likedOverride !== null
      ? likedOverride
      : Boolean(project?.liked) || matchKeys.some((k) => likedIds.has(k));

  const isBookmarked =
    bookmarkedOverride !== null
      ? bookmarkedOverride
      : Boolean(project?.bookmarked) || matchKeys.some((k) => bookmarkedIds.has(k));

  const displayedLikes =
    likesCountOverride !== null
      ? likesCountOverride
      : (project?.likesCount ?? project?.likes ?? 0);

  const likeMutation = useMutation({
    mutationFn: () => projectsApi.toggleLike(id),
    onMutate: () => {
      const nextLiked = !isLiked;
      setLikedOverride(nextLiked);
      setLikesCountOverride(Math.max(0, displayedLikes + (nextLiked ? 1 : -1)));
    },
    onSuccess: (res) => {
      if (typeof res?.data?.liked === 'boolean') setLikedOverride(res.data.liked);
      if (typeof res?.data?.likesCount === 'number') setLikesCountOverride(res.data.likesCount);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks', 'likes'] });
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
    mutationFn: () => projectsApi.toggleBookmark(id),
    onMutate: () => {
      setBookmarkedOverride(!isBookmarked);
    },
    onSuccess: (res) => {
      if (typeof res?.data?.bookmarked === 'boolean') setBookmarkedOverride(res.data.bookmarked);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
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

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project deleted', 'success');
      navigate('/explore', { replace: true });
    },
    onError: (err) => showToast(err.message || 'Could not delete project', 'error'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: isCommentSubmitting },
  } = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '' },
  });

  const onAddComment = async (values) => {
    if (!isAuthenticated) {
      showToast('Sign in to post a comment', 'error');
      return;
    }
    try {
      await projectsApi.addComment(id, values.text.trim());
      reset();
      queryClient.invalidateQueries({ queryKey: ['project', id, 'comments'] });
      invalidateGamification(queryClient);
      showToast('Comment posted (+15 XP)', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to post comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await projectsApi.deleteComment(id, commentId);
      queryClient.invalidateQueries({ queryKey: ['project', id, 'comments'] });
      showToast('Comment removed', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  if (projectQuery.isLoading) {
    return (
      <div className="wrap page-header" data-testid="page-project-detail">
        <Skeleton variant="rect" height="320px" className="mb-6" />
        <Skeleton variant="line" count={4} className="mb-3" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="wrap page-header" data-testid="page-project-detail">
        <GlassCard className="mx-auto max-w-lg p-10 text-center">
          <h1 className="mb-3 text-2xl font-bold">Project not found</h1>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            This project may have been removed or moved.
          </p>
          <Link to="/explore" className="btn btn-primary btn-sm">
            Back to Explore
          </Link>
        </GlassCard>
      </div>
    );
  }

  const authorHandle =
    typeof project.author === 'string'
      ? project.author
      : project.author?.username || project.author?.name || 'devverse';
  const authorId = String(project.author?._id || project.author?.id || '');
  const isOwner =
    Boolean(user) &&
    (user.role === 'admin' ||
      String(user._id || user.id) === authorId ||
      (user.username && user.username.toLowerCase() === authorHandle.toLowerCase()));

  const comments =
    commentsQuery.data?.data?.comments ||
    commentsQuery.data?.data ||
    commentsQuery.data?.comments ||
    [];
  const images = Array.isArray(project.images) ? project.images.map(resolveUploadUrl) : [];
  const heroArt = images[0] || resolveProjectArt(project);
  const ghRepo = ghRepoQuery.data?.data?.repo || ghRepoQuery.data?.data;
  const gradIdx = (Number(project.gradient) || 0) % TECH_GRADIENTS.length;

  const features =
    Array.isArray(project.features) && project.features.length > 0
      ? project.features
      : [
          'Production-ready modular architecture',
          'Real-time data & low-latency state sync',
          'Clean developer experience & responsive UI',
          'Accessible keyboard-first navigation',
        ];

  const timeline =
    Array.isArray(project.timeline) && project.timeline.length > 0
      ? project.timeline
      : [
          { label: 'Architecture & core prototype shipped', when: 'Initial release' },
          {
            label: `Built with ${(project.tags && project.tags[0]) || project.category || 'modern stack'}`,
            when: 'Core milestone',
          },
          { label: 'Published to DevVerse Explore', when: timeAgo(project.createdAt) },
        ];

  return (
    <div className="wrap page-header" data-testid="page-project-detail">
      <Link
        to="/explore"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Explore
      </Link>

      {/* Grand Banner */}
      <RevealSection className="mb-10">
        <div className="glass relative overflow-hidden rounded-[var(--radius-xl)]">
          <div className="relative h-64 w-full sm:h-80">
            <img
              src={heroArt}
              alt={project.title}
              onClick={() => setLightboxSrc(heroArt)}
              className="h-full w-full cursor-zoom-in object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/55 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="accent">{project.category || 'General'}</Badge>
                <Badge>{project.difficulty || 'Intermediate'}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-5xl">{project.title}</h1>
            </div>
          </div>
        </div>
      </RevealSection>

      <div className="detail-grid detail-grid--wide">
        {/* Left Main Editorial Content */}
        <div className="space-y-10">
          {/* Overview */}
          <RevealSection>
            <span className="eyebrow">Overview</span>
            <p className="text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              {project.desc || project.tagline}
            </p>
            {Array.isArray(project.tags) && project.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag}>#{tag}</Badge>
                ))}
              </div>
            )}
          </RevealSection>

          {/* Features */}
          <RevealSection>
            <span className="eyebrow">Key Features</span>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {features.map((feat, idx) => (
                <TiltCard key={feat + idx} maxTilt={4}>
                  <div className="glass flex items-center gap-3 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">{feat}</span>
                  </div>
                </TiltCard>
              ))}
            </div>
          </RevealSection>

          {/* Timeline */}
          <RevealSection>
            <span className="eyebrow">Build Timeline</span>
            <GlassCard className="divide-y divide-[var(--border)] px-6 py-2">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <span className="text-[var(--text-primary)]">{item.label}</span>
                  <span className="mono shrink-0 text-xs text-[var(--text-tertiary)]">
                    {item.when}
                  </span>
                </div>
              ))}
            </GlassCard>
          </RevealSection>

          {/* Gallery */}
          <RevealSection>
            <span className="eyebrow">Gallery</span>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {images.map((src, idx) => (
                  <TiltCard key={src + idx}>
                    <button
                      type="button"
                      onClick={() => setLightboxSrc(src)}
                      className="glass block h-36 w-full overflow-hidden rounded-xl"
                    >
                      <img
                        src={src}
                        alt={`${project.title} screenshot ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </button>
                  </TiltCard>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="glass h-32 rounded-xl"
                    style={{
                      background: TECH_GRADIENTS[(gradIdx + i) % TECH_GRADIENTS.length],
                      opacity: 0.85 - i * 0.12,
                    }}
                  />
                ))}
              </div>
            )}
          </RevealSection>

          {/* Comments */}
          <RevealSection>
            <GlassCard className="p-7">
              <div className="mb-5 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                <h2 className="text-xl font-bold">Builder Feedback ({comments.length})</h2>
              </div>

              {isAuthenticated ? (
                <form onSubmit={handleSubmit(onAddComment)} className="mb-6">
                  <div className="field">
                    <textarea
                      rows={3}
                      placeholder="Share architecture feedback or ask how it was built… (+15 XP)"
                      className={errors.text ? 'field-error' : ''}
                      {...register('text')}
                    />
                    {errors.text && (
                      <span className="field-error-msg show">{errors.text.message}</span>
                    )}
                  </div>
                  <Button type="submit" variant="primary" size="sm" loading={isCommentSubmitting}>
                    Post Comment
                  </Button>
                </form>
              ) : (
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                  <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
                    Sign in
                  </Link>{' '}
                  to leave feedback and earn +15 XP.
                </p>
              )}

              <div className="space-y-4">
                {Array.isArray(comments) && comments.length > 0 ? (
                  comments.map((c) => {
                    const cAuthor = c.author?.username || c.author?.name || 'builder';
                    const canDelete =
                      isOwner ||
                      (user &&
                        (String(c.author?._id || c.author) === String(user._id) ||
                          user.role === 'admin'));
                    return (
                      <div
                        key={c._id || c.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <Link
                            to={`/profile/${encodeURIComponent(cAuthor)}`}
                            className="mono text-xs font-semibold text-[var(--accent)] hover:underline"
                          >
                            @{cAuthor}
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="mono text-[11px] text-[var(--text-tertiary)]">
                              {timeAgo(c.createdAt)}
                            </span>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c._id || c.id)}
                                className="text-xs text-[var(--coral)] hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-[var(--text-primary)]">{c.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-[var(--text-tertiary)]">No comments yet.</p>
                )}
              </div>
            </GlassCard>
          </RevealSection>
        </div>

        {/* Parallax Sticky Sidebar */}
        <ParallaxLayer speed={-18} className="sticky-panel space-y-5">
          <GlassCard className="p-6">
            <span className="eyebrow">Engagement</span>
            <div className="mb-4 flex flex-wrap gap-2.5">
              <Button
                type="button"
                variant={isLiked ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => likeMutation.mutate()}
                loading={likeMutation.isPending}
                aria-pressed={isLiked}
                className={isLiked ? '!bg-[var(--coral)] !text-white' : ''}
              >
                <Heart
                  className={`h-4 w-4 ${isLiked ? 'text-white' : 'text-[var(--coral)]'}`}
                  fill={isLiked ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                <span>{formatCount(displayedLikes)}</span>
              </Button>

              <Button
                type="button"
                variant={isBookmarked ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => bookmarkMutation.mutate()}
                loading={bookmarkMutation.isPending}
                aria-pressed={isBookmarked}
                className={isBookmarked ? '!bg-[var(--cyan)] !text-black' : ''}
              >
                <Bookmark
                  className={`h-4 w-4 ${isBookmarked ? 'text-black' : 'text-[var(--cyan)]'}`}
                  fill={isBookmarked ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </Button>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Eye className="h-3.5 w-3.5 text-[var(--cyan)]" aria-hidden="true" />
                {formatCount(project.viewsCount ?? project.views ?? 0)} views
              </span>
              {isOwner && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </Button>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <span className="eyebrow">Creator</span>
            <Link
              to={`/profile/${encodeURIComponent(authorHandle)}`}
              className="flex items-center gap-3"
            >
              <img
                src={getAvatarUrl(project.author?.avatarUrl || authorHandle, 64)}
                alt={authorHandle}
                onError={(e) => {
                  e.currentTarget.src = AVATAR_FALLBACK_SVG;
                }}
                className="h-12 w-12 rounded-full border border-[var(--border-strong)] object-cover"
              />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {project.author?.name || authorHandle}
                </div>
                <div className="mono text-xs text-[var(--text-tertiary)]">@{authorHandle}</div>
              </div>
            </Link>
          </GlassCard>

          {project.githubUrl && (
            <GlassCard className="p-6">
              <span className="eyebrow">Repository</span>
              {ghRepo ? (
                <div className="mb-4 space-y-2 text-sm">
                  <div className="font-semibold text-[var(--text-primary)]">{ghRepo.full_name}</div>
                  <div className="flex items-center gap-4 font-mono text-xs text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-[var(--amber)]" />
                      {ghRepo.stargazers_count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GitFork className="h-3.5 w-3.5 text-[var(--cyan)]" />
                      {ghRepo.forks_count ?? 0}
                    </span>
                    {ghRepo.language && <span>{ghRepo.language}</span>}
                  </div>
                </div>
              ) : null}
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm w-full"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open on GitHub
              </a>
            </GlassCard>
          )}
        </ParallaxLayer>
      </div>

      <LightboxModal src={lightboxSrc} alt={project.title} onClose={() => setLightboxSrc(null)} />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => deleteProjectMutation.mutate()}
        loading={deleteProjectMutation.isPending}
        title="Delete project?"
        message="This will permanently remove the project and its comments."
        confirmLabel="Delete Project"
      />
    </div>
  );
}
