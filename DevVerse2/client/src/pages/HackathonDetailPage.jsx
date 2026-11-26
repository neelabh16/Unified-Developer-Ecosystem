import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, Calendar, CheckCircle2, Trophy, Users } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import { hackathonsApi } from '../api/hackathons.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useCountdown } from '../hooks/useCountdown';
import { AVATAR_FALLBACK_SVG, getAvatarUrl } from '../utils/avatar';
import { invalidateGamification } from '../utils/gamification';
import { TECH_GRADIENTS } from '../utils/formatters';

export default function HackathonDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const hackathonQuery = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonsApi.get(id),
    enabled: Boolean(id),
  });

  const hackathon =
    hackathonQuery.data?.data?.hackathon ||
    hackathonQuery.data?.data ||
    hackathonQuery.data?.hackathon;
  const isRegistered = Boolean(
    hackathonQuery.data?.data?.isRegistered ?? hackathon?.isRegistered
  );
  const isBookmarked = Boolean(
    hackathonQuery.data?.data?.isBookmarked ?? hackathon?.isBookmarked
  );

  const countdown = useCountdown(hackathon?.endTime || hackathon?.startDate);

  const registerMutation = useMutation({
    mutationFn: () => hackathonsApi.toggleRegister(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', id] });
      queryClient.invalidateQueries({ queryKey: ['hackathons'] });
      invalidateGamification(queryClient);
      const active = res?.data?.registered;
      showToast(
        active ? 'Registered for hackathon! (+20 XP)' : 'Registration cancelled',
        'success'
      );
    },
    onError: (err) => showToast(err.message || 'Sign in to register', 'error'),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => hackathonsApi.toggleBookmark(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      const saved = res?.data?.bookmarked;
      showToast(saved ? 'Hackathon bookmarked' : 'Removed bookmark', 'success');
    },
    onError: (err) => showToast(err.message || 'Sign in to bookmark', 'error'),
  });

  if (hackathonQuery.isLoading) {
    return (
      <div className="wrap page-header" data-testid="page-hackathon-detail">
        <Skeleton variant="rect" height="240px" className="mb-6" />
        <Skeleton variant="line" count={4} className="mb-3" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="wrap page-header" data-testid="page-hackathon-detail">
        <GlassCard className="mx-auto max-w-lg p-10 text-center">
          <h1 className="mb-3 text-2xl font-bold">Hackathon not found</h1>
          <Link to="/hackathons" className="btn btn-primary btn-sm">
            Back to Hackathons
          </Link>
        </GlassCard>
      </div>
    );
  }

  const grad = TECH_GRADIENTS[(Number(hackathon.gradient) || 0) % TECH_GRADIENTS.length];
  const roster = hackathon.participants || hackathon.devverseParticipants || [];

  return (
    <div className="wrap page-header" data-testid="page-hackathon-detail">
      <Link
        to="/hackathons"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All Hackathons
      </Link>

      <GlassCard className="mb-8 overflow-hidden">
        <div
          className="relative flex min-h-[210px] items-end p-8"
          style={{ background: grad }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg)]/90 via-[var(--bg)]/40 to-transparent" />
          <div className="relative z-10 w-full">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="accent">{hackathon.status || 'Live'}</Badge>
              {Array.isArray(hackathon.tags) &&
                hackathon.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-5xl">{hackathon.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-7">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[var(--amber)]" aria-hidden="true" />
              <span className="font-semibold">{hackathon.prize || hackathon.prizePool || 'TBD'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--cyan)]" aria-hidden="true" />
              <span className="mono">{countdown.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              <span className="mono">
                {hackathon.participantsCount ?? roster.length} builders
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  type="button"
                  variant={isRegistered ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => registerMutation.mutate()}
                  loading={registerMutation.isPending}
                >
                  {isRegistered ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[var(--cyan)]" aria-hidden="true" />
                      Registered
                    </>
                  ) : (
                    'Register (+20 XP)'
                  )}
                </Button>
                <Button
                  type="button"
                  variant={isBookmarked ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => bookmarkMutation.mutate()}
                  loading={bookmarkMutation.isPending}
                >
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                Sign in to register
              </Link>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="detail-grid detail-grid--wide">
        <div className="space-y-6">
          <GlassCard className="p-7">
            <span className="eyebrow">Brief &amp; Rules</span>
            <p className="text-base leading-relaxed text-[var(--text-secondary)]">
              {hackathon.description || hackathon.tagline}
            </p>

            {Array.isArray(hackathon.tracks) && hackathon.tracks.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-base font-semibold">Tracks</h3>
                <div className="flex flex-wrap gap-2">
                  {hackathon.tracks.map((tr) => (
                    <Badge key={tr} variant="accent">
                      {tr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-7">
            <span className="eyebrow">Competing Builders ({roster.length})</span>
            {roster.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">
                Be the first builder to register for this arena.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {roster.map((item, idx) => {
                  const handle =
                    typeof item === 'string' ? item : item.username || item.handle || 'builder';
                  const name = typeof item === 'object' ? item.name || handle : handle;
                  const avatar = getAvatarUrl(
                    typeof item === 'object' ? item.avatarUrl || handle : handle,
                    64
                  );
                  return (
                    <Link
                      key={handle + idx}
                      to={`/profile/${encodeURIComponent(handle)}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--accent)]"
                    >
                      <img
                        src={avatar}
                        alt={name}
                        onError={(e) => {
                          e.currentTarget.src = AVATAR_FALLBACK_SVG;
                        }}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{name}</div>
                        <div className="mono truncate text-xs text-[var(--text-tertiary)]">
                          @{handle}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        <GlassCard className="sticky-panel p-6">
          <span className="eyebrow">Need a team?</span>
          <h3 className="mb-2 text-lg font-bold">Form a Hackathon Squad</h3>
          <p className="mb-5 text-sm text-[var(--text-secondary)]">
            Match with complementary engineers, chat in real time, and register your squad together.
          </p>
          <Link to="/squads" className="btn btn-outline btn-sm w-full">
            Open Squad Matcher
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
