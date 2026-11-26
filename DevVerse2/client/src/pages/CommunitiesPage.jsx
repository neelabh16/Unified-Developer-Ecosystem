import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import PageHeaderStats from '../components/common/PageHeaderStats';
import Skeleton from '../components/common/Skeleton';
import { communitiesApi } from '../api/communities.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { invalidateGamification } from '../utils/gamification';
import { TECH_GRADIENTS } from '../utils/formatters';

function extractCommunities(res) {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.communities)) return payload.communities;
  return [];
}

export default function CommunitiesPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => communitiesApi.list(),
  });

  const joinMutation = useMutation({
    mutationFn: (id) => communitiesApi.toggleJoin(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      invalidateGamification(queryClient);
      const joined = res?.data?.joined;
      showToast(joined ? 'Joined community (+5 XP)' : 'Left community', 'success');
    },
    onError: (err) => showToast(err.message || 'Sign in to join communities', 'error'),
  });

  const communities = extractCommunities(data);

  return (
    <div className="wrap page-header" data-testid="page-communities">
      <div className="page-header-flex mb-10">
        <div className="page-header-text">
          <span className="eyebrow">Guilds &amp; Forums</span>
          <h1 className="mb-3">
            Developer <span className="grad-text">Communities</span>
          </h1>
          <p className="lede">
            Join specialized engineering guilds, ask deep technical questions, and share insights.
          </p>
        </div>
        <PageHeaderStats
          loading={isLoading}
          stats={[
            { label: 'Guilds', value: communities.length },
            { label: 'Join Bonus', value: '+5 XP' },
            { label: 'Thread Bonus', value: '+25 XP' },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-3">
          <Skeleton variant="card" count={6} />
        </div>
      ) : (
        <div className="grid grid-3">
          {communities.map((c, idx) => {
            const id = c.legacyId || c.slug || c._id || c.id;
            const grad = TECH_GRADIENTS[(Number(c.gradient) || idx) % TECH_GRADIENTS.length];
            const isMember = Boolean(c.isMember);
            return (
              <GlassCard key={id} lift className="flex flex-col overflow-hidden">
                <div className="h-24 w-full" style={{ background: grad }} />
                <div className="flex flex-1 flex-col p-6">
                  <Link
                    to={`/communities/${encodeURIComponent(id)}`}
                    className="mb-2 text-xl font-bold hover:text-[var(--accent)]"
                  >
                    {c.name}
                  </Link>
                  <p className="mb-5 line-clamp-2 flex-1 text-sm text-[var(--text-secondary)]">
                    {c.desc || c.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
                    <span className="mono inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                      <Users className="h-3.5 w-3.5 text-[var(--cyan)]" aria-hidden="true" />
                      {c.membersCount ?? c.members ?? 0} members
                    </span>

                    <div className="flex items-center gap-2">
                      {isAuthenticated && (
                        <Button
                          type="button"
                          variant={isMember ? 'ghost' : 'primary'}
                          size="sm"
                          onClick={() => joinMutation.mutate(id)}
                          loading={joinMutation.isPending}
                        >
                          {isMember ? 'Joined' : 'Join'}
                        </Button>
                      )}
                      <Link
                        to={`/communities/${encodeURIComponent(id)}`}
                        className="btn btn-outline btn-sm"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
