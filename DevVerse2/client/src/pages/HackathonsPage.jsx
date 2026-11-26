import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeaderStats from '../components/common/PageHeaderStats';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import HackathonCard from '../components/hackathons/HackathonCard';
import { ParallaxLayer, RevealSection } from '../components/common/MotionPrimitives';
import { hackathonsApi } from '../api/hackathons.api';

const FILTERS = ['All', 'Live', 'Upcoming', 'Ended'];

function extractHackathons(res) {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.hackathons)) return payload.hackathons;
  return [];
}

export default function HackathonsPage() {
  const [statusFilter, setStatusFilter] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['hackathons'],
    queryFn: () => hackathonsApi.list(),
  });

  const hackathons = useMemo(() => extractHackathons(data), [data]);

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return hackathons;
    return hackathons.filter(
      (h) => (h.status || 'Live').toLowerCase() === statusFilter.toLowerCase()
    );
  }, [hackathons, statusFilter]);

  const liveCount = hackathons.filter(
    (h) => (h.status || 'Live').toLowerCase() === 'live'
  ).length;

  return (
    <div className="wrap page-header" data-testid="page-hackathons">
      <div className="page-header-flex mb-10">
        <div className="page-header-text">
          <span className="eyebrow">Arenas &amp; Sprints</span>
          <h1 className="mb-3">
            Live <span className="grad-text">Hackathons</span>
          </h1>
          <p className="lede">
            Compete solo or with a squad, ship under pressure, and earn +20 XP on registration.
          </p>
        </div>
        <ParallaxLayer speed={-18}>
          <PageHeaderStats
            loading={isLoading}
            stats={[
              { label: 'Total Arenas', value: hackathons.length },
              { label: 'Live Now', value: liveCount },
              { label: 'Reg Bonus', value: '+20 XP' },
            ]}
          />
        </ParallaxLayer>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="pill-toggle" role="group" aria-label="Filter hackathons by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={statusFilter === f ? 'active' : ''}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-3">
          <Skeleton variant="card" count={3} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No hackathons match this filter"
          description="Try selecting All to view every upcoming and live arena."
          action={
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setStatusFilter('All')}
            >
              Show all arenas
            </button>
          }
        />
      ) : (
        <RevealSection>
          <div className="grid grid-3">
            {filtered.map((h, idx) => (
              <HackathonCard key={h._id || h.id || h.legacyId || idx} hackathon={h} index={idx} />
            ))}
          </div>
        </RevealSection>
      )}
    </div>
  );
}
