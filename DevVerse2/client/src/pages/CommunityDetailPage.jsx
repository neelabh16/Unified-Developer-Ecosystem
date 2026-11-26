import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MessageSquare, Trash2, Users } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import { communitiesApi, discussionsApi } from '../api/communities.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { invalidateGamification } from '../utils/gamification';
import { TECH_GRADIENTS, timeAgo } from '../utils/formatters';
import { discussionSchema } from '../utils/validation';

export default function CommunityDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [replyText, setReplyText] = useState({});

  const communityQuery = useQuery({
    queryKey: ['community', id],
    queryFn: () => communitiesApi.get(id),
    enabled: Boolean(id),
  });

  const discussionsQuery = useQuery({
    queryKey: ['community', id, 'discussions'],
    queryFn: () => communitiesApi.getDiscussions(id),
    enabled: Boolean(id),
  });

  const community =
    communityQuery.data?.data?.community ||
    communityQuery.data?.data ||
    communityQuery.data?.community;
  const isMember = Boolean(
    communityQuery.data?.data?.isMember ?? community?.isMember
  );

  const joinMutation = useMutation({
    mutationFn: () => communitiesApi.toggleJoin(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['community', id] });
      invalidateGamification(queryClient);
      showToast(res?.data?.joined ? 'Joined community (+5 XP)' : 'Left community', 'success');
    },
    onError: (err) => showToast(err.message || 'Sign in to join', 'error'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(discussionSchema),
    defaultValues: { title: '', body: '' },
  });

  const onCreateThread = async (values) => {
    try {
      await communitiesApi.createDiscussion(id, {
        title: values.title.trim(),
        body: values.body.trim(),
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ['community', id, 'discussions'] });
      invalidateGamification(queryClient);
      showToast('Thread posted (+25 XP)', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create thread', 'error');
    }
  };

  const replyMutation = useMutation({
    mutationFn: ({ discussionId, text }) => discussionsApi.addReply(discussionId, text),
    onSuccess: (_, vars) => {
      setReplyText((prev) => ({ ...prev, [vars.discussionId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['community', id, 'discussions'] });
      invalidateGamification(queryClient);
      showToast('Reply posted (+10 XP)', 'success');
    },
    onError: (err) => showToast(err.message || 'Failed to reply', 'error'),
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (discussionId) => discussionsApi.delete(discussionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id, 'discussions'] });
      showToast('Thread deleted', 'success');
    },
    onError: (err) => showToast(err.message || 'Failed to delete thread', 'error'),
  });

  if (communityQuery.isLoading) {
    return (
      <div className="wrap page-header" data-testid="page-community-detail">
        <Skeleton variant="rect" height="180px" className="mb-6" />
        <Skeleton variant="line" count={4} className="mb-3" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="wrap page-header" data-testid="page-community-detail">
        <GlassCard className="mx-auto max-w-lg p-10 text-center">
          <h1 className="mb-3 text-2xl font-bold">Community not found</h1>
          <Link to="/communities" className="btn btn-primary btn-sm">
            Back to Communities
          </Link>
        </GlassCard>
      </div>
    );
  }

  const grad = TECH_GRADIENTS[(Number(community.gradient) || 0) % TECH_GRADIENTS.length];
  const discussions =
    discussionsQuery.data?.data?.discussions ||
    discussionsQuery.data?.data ||
    discussionsQuery.data?.discussions ||
    [];

  return (
    <div className="wrap page-header" data-testid="page-community-detail">
      <Link
        to="/communities"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All Communities
      </Link>

      <GlassCard className="mb-8 overflow-hidden">
        <div className="h-28 w-full" style={{ background: grad }} />
        <div className="flex flex-wrap items-center justify-between gap-4 p-7">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{community.name}</h1>
            <p className="mb-3 max-w-2xl text-sm text-[var(--text-secondary)]">
              {community.desc || community.description}
            </p>
            <div className="mono flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[var(--cyan)]" />
                {community.membersCount ?? community.members ?? 0} members
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <Button
              type="button"
              variant={isMember ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => joinMutation.mutate()}
              loading={joinMutation.isPending}
            >
              {isMember ? 'Joined' : 'Join Guild (+5 XP)'}
            </Button>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign in to join
            </Link>
          )}
        </div>
      </GlassCard>

      <div className="detail-grid detail-grid--wide">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-2xl font-bold">Discussions ({discussions.length})</h2>
          </div>

          {discussions.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-[var(--text-secondary)]">
              No threads yet. Start the first conversation!
            </GlassCard>
          ) : (
            discussions.map((d) => {
              const dId = d._id || d.id;
              const authorHandle = d.author?.username || d.author?.name || 'builder';
              const isAuthor =
                Boolean(user) &&
                (user.role === 'admin' ||
                  String(d.author?._id || d.author) === String(user._id));
              return (
                <GlassCard key={dId} className="p-6">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{d.title}</h3>
                      <div className="mono mt-1 text-xs text-[var(--text-tertiary)]">
                        @{authorHandle} · {timeAgo(d.createdAt)}
                      </div>
                    </div>
                    {isAuthor && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => deleteThreadMutation.mutate(dId)}
                        aria-label="Delete thread"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="mb-4 whitespace-pre-line text-sm text-[var(--text-secondary)]">
                    {d.body}
                  </p>

                  {Array.isArray(d.replies) && d.replies.length > 0 && (
                    <div className="mb-4 space-y-2 border-l-2 border-[var(--border-strong)] pl-4">
                      {d.replies.map((r, rIdx) => (
                        <div key={r._id || rIdx} className="text-xs">
                          <span className="mono font-semibold text-[var(--accent)]">
                            @{r.author?.username || 'builder'}:{' '}
                          </span>
                          <span className="text-[var(--text-primary)]">{r.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAuthenticated && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const text = (replyText[dId] || '').trim();
                        if (text.length >= 2) {
                          replyMutation.mutate({ discussionId: dId, text });
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={replyText[dId] || ''}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [dId]: e.target.value }))
                        }
                        placeholder="Write a reply… (+10 XP)"
                      />
                      <Button type="submit" variant="outline" size="sm">
                        Reply
                      </Button>
                    </form>
                  )}
                </GlassCard>
              );
            })
          )}
        </div>

        <GlassCard className="sticky-panel p-6">
          <span className="eyebrow">Start a Thread (+25 XP)</span>
          {isAuthenticated ? (
            <form onSubmit={handleSubmit(onCreateThread)} noValidate>
              <div className="field">
                <label htmlFor="thread-title">Title</label>
                <input
                  id="thread-title"
                  type="text"
                  placeholder="Ask a question or share a pattern"
                  className={errors.title ? 'field-error' : ''}
                  {...register('title')}
                />
                {errors.title && (
                  <span className="field-error-msg show">{errors.title.message}</span>
                )}
              </div>
              <div className="field">
                <label htmlFor="thread-body">Details</label>
                <textarea
                  id="thread-body"
                  rows={4}
                  placeholder="Provide context, code snippets, or trade-offs…"
                  className={errors.body ? 'field-error' : ''}
                  {...register('body')}
                />
                {errors.body && (
                  <span className="field-error-msg show">{errors.body.message}</span>
                )}
              </div>
              <Button type="submit" variant="primary" size="sm" loading={isSubmitting} className="w-full">
                Post Thread
              </Button>
            </form>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
                Sign in
              </Link>{' '}
              to start a thread in {community.name}.
            </p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
