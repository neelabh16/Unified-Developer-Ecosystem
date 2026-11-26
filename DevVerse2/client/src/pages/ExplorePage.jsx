import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import PageHeaderStats from '../components/common/PageHeaderStats';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ProjectCard from '../components/projects/ProjectCard';
import { ParallaxLayer, RevealSection } from '../components/common/MotionPrimitives';
import { projectsApi } from '../api/projects.api';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

function extractProjects(res) {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.projects)) return payload.projects;
  return [];
}

function isOwnedByUser(project, user) {
  if (!project || !user) return false;
  if (project.isOwner) return true;
  const uId = String(user._id || user.id || '');
  const authorId = String(project.author?._id || project.author?.id || project.authorId || '');
  if (uId && authorId && uId === authorId) return true;
  const uHandle = (user.username || '').toLowerCase();
  const authorHandle = (
    typeof project.author === 'string'
      ? project.author
      : project.author?.username || project.author?.name || ''
  ).toLowerCase();
  return Boolean(uHandle && authorHandle && authorHandle === uHandle);
}

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const searchInputRef = useRef(null);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('cat') || 'All');
  const [difficulty, setDifficulty] = useState('All');
  const [sort, setSort] = useState('trending');

  const debouncedSearch = useDebounce(search, 200);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { limit: 100 }],
    queryFn: () => projectsApi.list({ limit: 100 }),
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allProjects = useMemo(() => extractProjects(data), [data]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(allProjects.map((p) => p.category).filter(Boolean)));
    return ['All', ...unique];
  }, [allProjects]);

  const { myProjects, communityProjects } = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const filterFn = (p) => {
      const matchSearch =
        !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.desc || p.tagline || '').toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t) => String(t).toLowerCase().includes(q)));
      const matchCat = category === 'All' || p.category === category;
      const matchDiff = difficulty === 'All' || p.difficulty === difficulty;
      return matchSearch && matchCat && matchDiff;
    };

    const sortFn = (a, b) => {
      const likesA = a.likesCount ?? a.likes ?? 0;
      const likesB = b.likesCount ?? b.likes ?? 0;
      const viewsA = a.viewsCount ?? a.views ?? 0;
      const viewsB = b.viewsCount ?? b.views ?? 0;
      if (sort === 'likes') return likesB - likesA;
      if (sort === 'views') return viewsB - viewsA;
      if (sort === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return likesB + viewsB / 10 - (likesA + viewsA / 10);
    };

    const mine = allProjects.filter((p) => isOwnedByUser(p, user) && filterFn(p)).sort(sortFn);
    const community = allProjects
      .filter((p) => !isOwnedByUser(p, user) && filterFn(p))
      .sort(sortFn);

    return { myProjects: mine, communityProjects: community };
  }, [allProjects, user, debouncedSearch, category, difficulty, sort]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') next.delete('cat');
    else next.set('cat', cat);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="wrap page-header" data-testid="page-explore">
      <div className="page-header-flex mb-10">
        <div className="page-header-text">
          <span className="eyebrow">Explore · Open Source</span>
          <h1 className="mb-3">
            Discover <span className="grad-text">shipped builds</span>
          </h1>
          <p className="lede">
            Search developer tools, AI agents, systems software, and hackathon winners.
          </p>
        </div>
        <ParallaxLayer speed={-18}>
          <PageHeaderStats
            loading={isLoading}
            stats={[
              { label: 'Total Projects', value: allProjects.length },
              { label: 'Categories', value: Math.max(0, categories.length - 1) },
              { label: 'Matching', value: myProjects.length + communityProjects.length },
            ]}
          />
        </ParallaxLayer>
      </div>

      {/* Filter Toolbar */}
      <div className="glass mb-8 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="search-wrap flex-1">
            <Search aria-hidden="true" />
            <input
              ref={searchInputRef}
              id="explore-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title, stack, or tag…"
              aria-label="Search projects"
            />
            <span className="search-kbd">/</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="pill-toggle" role="group" aria-label="Filter by difficulty">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={difficulty === diff ? 'active' : ''}
                >
                  {diff}
                </button>
              ))}
            </div>

            <select
              aria-label="Sort projects"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-auto min-w-[150px]"
            >
              <option value="trending">Trending</option>
              <option value="likes">Most Liked</option>
              <option value="views">Most Viewed</option>
              <option value="newest">Newest</option>
            </select>

            {isAuthenticated && (
              <Link to="/submit-project" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Submit
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`chip cursor-pointer transition-colors ${
                category === cat ? 'chip-accent' : 'hover:border-[var(--border-strong)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-3">
          <Skeleton variant="card" count={6} />
        </div>
      ) : (
        <>
          {myProjects.length > 0 && (
            <section className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Your Projects ({myProjects.length})</h2>
              </div>
              <div className="grid grid-3">
                {myProjects.map((project, idx) => (
                  <ProjectCard
                    key={project._id || project.id || idx}
                    project={project}
                    index={idx}
                  />
                ))}
              </div>
            </section>
          )}

          {communityProjects.length === 0 && myProjects.length === 0 ? (
            <EmptyState
              title="No matching projects"
              description="Try clearing your search or selecting a different category or difficulty."
              action={
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearch('');
                    setDifficulty('All');
                    handleCategoryChange('All');
                  }}
                >
                  Reset filters
                </button>
              }
            />
          ) : (
            <section>
              {myProjects.length > 0 && (
                <h2 className="mb-4 text-xl font-bold">
                  Community Projects ({communityProjects.length})
                </h2>
              )}
              <RevealSection>
                <div className="grid grid-3">
                  {communityProjects.map((project, idx) => (
                    <ProjectCard
                      key={project._id || project.id || idx}
                      project={project}
                      index={idx}
                    />
                  ))}
                </div>
              </RevealSection>
            </section>
          )}
        </>
      )}
    </div>
  );
}
