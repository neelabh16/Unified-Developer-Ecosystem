import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, Lock, Plus, Search, Trash2 } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import { codexApi } from '../api/codex.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { CODEX_REQUIRED_POINTS, invalidateGamification, isCodexUnlocked } from '../utils/gamification';
import { timeAgo } from '../utils/formatters';
import { codexEntrySchema } from '../utils/validation';

const CODEX_CATEGORIES = [
  'All',
  'Debugging',
  'Performance',
  'Architecture',
  'Incidents',
  'Career',
  'Solo Building',
  'Security',
  'Other',
];

export default function CodexPage() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const statusQuery = useQuery({
    queryKey: ['codex', 'status'],
    queryFn: () => codexApi.status(),
    enabled: isAuthenticated,
    retry: false,
  });

  const unlocked =
    Boolean(statusQuery.data?.data?.unlocked) ||
    isCodexUnlocked(user?.points, user?.role);

  const entriesQuery = useQuery({
    queryKey: ['codex', 'entries'],
    queryFn: () => codexApi.list(),
    enabled: unlocked,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(codexEntrySchema),
    defaultValues: {
      title: '',
      category: 'Debugging',
      problem: '',
      tried: '',
      fix: '',
      lesson: '',
    },
  });

  const onPublish = async (values) => {
    try {
      await codexApi.create(values);
      reset();
      queryClient.invalidateQueries({ queryKey: ['codex', 'entries'] });
      invalidateGamification(queryClient);
      showToast('Codex field note published! (+25 XP)', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to publish Codex entry', 'error');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => codexApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codex', 'entries'] });
      showToast('Entry removed', 'success');
    },
    onError: (err) => showToast(err.message || 'Failed to delete entry', 'error'),
  });

  const entries = useMemo(
    () => entriesQuery.data?.data?.entries || entriesQuery.data?.data || [],
    [entriesQuery.data]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      const matchCat = category === 'All' || e.category === category;
      const matchQ =
        !q ||
        (e.title || '').toLowerCase().includes(q) ||
        (e.problem || '').toLowerCase().includes(q) ||
        (e.lesson || '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [entries, category, search]);

  if (!isAuthenticated) {
    return (
      <div className="wrap page-header" data-testid="page-codex">
        <GlassCard className="mx-auto max-w-xl p-10 text-center">
          <Lock className="mx-auto mb-4 h-10 w-10 text-[var(--accent)]" aria-hidden="true" />
          <h1 className="mb-3 text-3xl font-bold">The Codex is gated</h1>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            Sign in and reach {CODEX_REQUIRED_POINTS} XP to unlock engineering post-mortems and
            field notes.
          </p>
          <Link to="/login?redirect=/codex" className="btn btn-primary btn-sm">
            Sign in to check status
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (!unlocked) {
    const pts = Number(user?.points) || 0;
    const pct = Math.min(100, Math.round((pts / CODEX_REQUIRED_POINTS) * 100));
    return (
      <div className="wrap page-header" data-testid="page-codex">
        <GlassCard className="mx-auto max-w-xl p-12 text-center">
          <div className="mb-4 text-4xl">🔒</div>
          <h1 className="mb-3 text-3xl font-bold">The Codex is sealed.</h1>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            A living archive of real bugs, incidents, and architectural lessons — unlocked at{' '}
            {CODEX_REQUIRED_POINTS} XP.
          </p>
          <div className="mx-auto mb-3 h-2.5 max-w-sm overflow-hidden rounded-full bg-[var(--surface-hover)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--violet)] to-[var(--cyan)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mono mb-6 text-xs text-[var(--text-tertiary)]">
            {pts} / {CODEX_REQUIRED_POINTS} pts to unlock
          </p>
          <Link to="/leaderboard" className="btn btn-primary btn-sm">
            See how points work
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="wrap page-header" data-testid="page-codex">
      <span className="eyebrow">Unlocked · 200+ XP Archive</span>
      <h1 className="mb-3">
        Engineering <span className="grad-text">Codex</span>
      </h1>
      <p className="lede mb-8">
        Real post-mortems, debugging war stories, and hard-won lessons from verified builders.
      </p>

      <div className="detail-grid detail-grid--wide">
        <div className="space-y-5">
          <div className="glass p-4">
            <div className="search-wrap mb-3">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search field notes…"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CODEX_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`chip cursor-pointer ${category === c ? 'chip-accent' : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {entriesQuery.isLoading ? (
            <Skeleton variant="card" count={3} />
          ) : filtered.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-[var(--text-secondary)]">
              No field notes match your filter yet.
            </GlassCard>
          ) : (
            filtered.map((entry) => {
              const eId = entry._id || entry.id;
              const isOwner =
                user &&
                (user.role === 'admin' ||
                  String(entry.author?._id || entry.author) === String(user._id));
              return (
                <GlassCard key={eId} className="p-6">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="accent" className="mb-2">
                        {entry.category}
                      </Badge>
                      <h2 className="text-xl font-bold">{entry.title}</h2>
                      <div className="mono mt-1 text-xs text-[var(--text-tertiary)]">
                        @{entry.author?.username || 'builder'} · {timeAgo(entry.createdAt)}
                      </div>
                    </div>
                    {isOwner && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMutation.mutate(eId)}
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                      <div className="mono mb-1 text-[11px] font-semibold uppercase text-[var(--coral)]">
                        Problem
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{entry.problem}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                      <div className="mono mb-1 text-[11px] font-semibold uppercase text-[var(--amber)]">
                        What was tried
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{entry.tried}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                      <div className="mono mb-1 text-[11px] font-semibold uppercase text-[var(--cyan)]">
                        The Fix
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{entry.fix}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                      <div className="mono mb-1 text-[11px] font-semibold uppercase text-[var(--accent)]">
                        Lesson Learned
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{entry.lesson}</p>
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>

        <GlassCard className="sticky-panel p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-lg font-bold">Publish Field Note (+25 XP)</h2>
          </div>
          <form onSubmit={handleSubmit(onPublish)} noValidate>
            <div className="field">
              <label htmlFor="cx-title">Title</label>
              <input
                id="cx-title"
                type="text"
                placeholder="e.g. Why our Redis pool deadlocked under burst"
                className={errors.title ? 'field-error' : ''}
                {...register('title')}
              />
              {errors.title && <span className="field-error-msg show">{errors.title.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="cx-cat">Category</label>
              <select id="cx-cat" {...register('category')}>
                {CODEX_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cx-problem">Problem</label>
              <textarea
                id="cx-problem"
                rows={2}
                className={errors.problem ? 'field-error' : ''}
                {...register('problem')}
              />
              {errors.problem && (
                <span className="field-error-msg show">{errors.problem.message}</span>
              )}
            </div>
            <div className="field">
              <label htmlFor="cx-tried">What you tried</label>
              <textarea
                id="cx-tried"
                rows={2}
                className={errors.tried ? 'field-error' : ''}
                {...register('tried')}
              />
              {errors.tried && <span className="field-error-msg show">{errors.tried.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="cx-fix">The Fix</label>
              <textarea
                id="cx-fix"
                rows={2}
                className={errors.fix ? 'field-error' : ''}
                {...register('fix')}
              />
              {errors.fix && <span className="field-error-msg show">{errors.fix.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="cx-lesson">Lesson</label>
              <textarea
                id="cx-lesson"
                rows={2}
                className={errors.lesson ? 'field-error' : ''}
                {...register('lesson')}
              />
              {errors.lesson && (
                <span className="field-error-msg show">{errors.lesson.message}</span>
              )}
            </div>
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting} className="w-full">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Publish Note
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
