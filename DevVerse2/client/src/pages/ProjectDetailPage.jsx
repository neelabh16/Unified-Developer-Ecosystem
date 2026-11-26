import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Bookmark,
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
import { projectsApi } from '../api/projects.api';
import { githubApi } from '../api/github.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatCount, parseGithubRepoUrl, resolveProjectArt, timeAgo } from '../utils/formatters';
import { AVATAR_FALLBACK_SVG, getAvatarUrl, resolveUploadUrl } from '../utils/avatar';
import { invalidateGamification } from '../utils/gamification';
import { commentSchema } from '../utils/validation';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
    enabled: Boolean(id),
  });

  const project = projectQuery.data?.data?.project || projectQuery.data?.data || projectQuery.data?.project;

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

  const likeMutation = useMutation({
    mutationFn: () => projectsApi.toggleLike(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      invalidateGamification(queryClient);
      const liked = res?.data?.liked;
      showToast(liked ? 'Project liked (+2 XP)' : 'Like removed', 'success');
    },
    onError: (err) => showToast(err.message || 'Sign in to like projects', 'error'),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => projectsApi.toggleBookmark(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      invalidateGamification(queryClient);
      const saved = res?.data?.bookmarked;
      showToast(saved ? 'Saved to bookmarks (+3 XP)' : 'Removed from bookmarks', 'success');
    },
    onError: (err) => showToast(err.message || 'Sign in to bookmark projects', 'error'),
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

  return (
    <div className="wrap page-header" data-testid="page-project-detail">
      <Link
        to="/explore"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Explore
      </Link>

      <div className="detail-grid detail-grid--wide">
        <div className="space-y-6">
          <GlassCard className="overflow-hidden">
            <div className="relative h-64 w-full bg-[var(--bg-elevated)] sm:h-80">
              <img
                src={heroArt}
                alt={project.title}
                onClick={() => setLightboxSrc(heroArt)}
                className="h-full w-full cursor-zoom-in object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
            </div>

            <div className="p-7">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="accent">{project.category || 'General'}</Badge>
                <Badge>{project.difficulty || 'Intermediate'}</Badge>
              </div>
              <h1 className="mb-3 text-3xl font-bold sm:text-4xl">{project.title}</h1>
              <p className="mb-5 text-base leading-relaxed text-[var(--text-secondary)]">
                {project.desc || project.tagline}
              </p>

              {Array.isArray(project.tags) && project.tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag}>#{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
                <Button
                  type="button"
                  variant={project.liked ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  loading={likeMutation.isPending}
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  {formatCount(project.likesCount ?? project.likes ?? 0)}
                </Button>

                <Button
                  type="button"
                  variant={project.bookmarked ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => bookmarkMutation.mutate()}
                  loading={bookmarkMutation.isPending}
                >
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                  {project.bookmarked ? 'Saved' : 'Bookmark'}
                </Button>

                <span className="chip">
                  <Eye className="h-3.5 w-3.5 text-[var(--cyan)]" aria-hidden="true" />
                  {formatCount(project.viewsCount ?? project.views ?? 0)} views
                </span>

                {isOwner && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>

          {images.length > 1 && (
            <GlassCard className="p-6">
              <span className="eyebrow">Screenshots</span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((src, idx) => (
                  <button
                    key={src + idx}
                    type="button"
                    onClick={() => setLightboxSrc(src)}
                    className="h-32 overflow-hidden rounded-xl border border-[var(--border)]"
                  >
                    <img
                      src={src}
                      alt={`${project.title} screenshot ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Comments Section */}
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
        </div>

        {/* Sidebar */}
        <div className="sticky-panel space-y-5">
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
        </div>
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
