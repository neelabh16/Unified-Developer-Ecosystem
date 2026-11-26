import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import { portfoliosApi } from '../api/portfolios.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { AVATAR_FALLBACK_SVG, getAvatarUrl } from '../utils/avatar';
import { invalidateGamification } from '../utils/gamification';

export default function PortfolioPage() {
  const { username } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();

  const targetHandle = username || user?.username;
  const isOwnPortfolio =
    !username || (user?.username && user.username.toLowerCase() === username.toLowerCase());

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', targetHandle],
    queryFn: () => portfoliosApi.get(targetHandle),
    enabled: Boolean(targetHandle),
    retry: false,
  });

  const fetched =
    portfolioQuery.data?.data?.portfolio ||
    portfolioQuery.data?.data ||
    portfolioQuery.data?.portfolio;

  const [draft, setDraft] = useState(null);
  const baseState = fetched
    ? {
        name: fetched.name || user?.name || '',
        title: fetched.title || 'Full-Stack Builder',
        bio: fetched.bio || user?.bio || '',
        accent: fetched.accent || '#7c6fff',
        skillsText: Array.isArray(fetched.skills) ? fetched.skills.join(', ') : '',
        links: Array.isArray(fetched.links) ? fetched.links : [],
        projects: Array.isArray(fetched.projects) ? fetched.projects : [],
      }
    : {
        name: isOwnPortfolio && user ? user.name || '' : '',
        title: 'Full-Stack Builder',
        bio: isOwnPortfolio && user ? user.bio || '' : '',
        accent: '#7c6fff',
        skillsText:
          isOwnPortfolio && user && Array.isArray(user.skills) ? user.skills.join(', ') : '',
        links: [],
        projects: [],
      };
  const formState = draft ?? baseState;
  const setFormState = (updater) => {
    setDraft((prev) => {
      const current = prev ?? baseState;
      return typeof updater === 'function' ? updater(current) : updater;
    });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      portfoliosApi.save({
        name: formState.name.trim(),
        title: formState.title.trim(),
        bio: formState.bio.trim(),
        accent: formState.accent,
        skills: formState.skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        links: formState.links.filter((l) => l.label && l.url),
        projects: formState.projects.filter((p) => p.title),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', targetHandle] });
      invalidateGamification(queryClient);
      showToast('Portfolio saved!', 'success');
    },
    onError: (err) => showToast(err.message || 'Failed to save portfolio', 'error'),
  });

  const handleCopyShareUrl = () => {
    const shareUrl = `${window.location.origin}/portfolio/${encodeURIComponent(targetHandle || '')}`;
    navigator.clipboard?.writeText(shareUrl);
    showToast('Public portfolio link copied', 'success');
  };

  if (portfolioQuery.isLoading) {
    return (
      <div className="wrap page-header" data-testid="page-portfolio">
        <Skeleton variant="rect" height="260px" className="mb-6" />
        <Skeleton variant="line" count={4} className="mb-3" />
      </div>
    );
  }

  const previewSkills = formState.skillsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="wrap page-header" data-testid="page-portfolio">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {isOwnPortfolio ? 'Portfolio Studio' : `Portfolio · @${targetHandle}`}
          </span>
          <h1 className="mb-2">
            {isOwnPortfolio ? (
              <>
                Build your <span className="grad-text">Showcase</span>
              </>
            ) : (
              formState.name || targetHandle
            )}
          </h1>
        </div>

        {targetHandle && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCopyShareUrl}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy Share Link
            </Button>
            <Link
              to={`/profile/${encodeURIComponent(targetHandle)}`}
              className="btn btn-ghost btn-sm"
            >
              View Profile
            </Link>
          </div>
        )}
      </div>

      <div className={isOwnPortfolio ? 'detail-grid detail-grid--even' : 'mx-auto max-w-4xl'}>
        {isOwnPortfolio && (
          <GlassCard className="p-7">
            <h2 className="mb-5 text-xl font-bold">Editor</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="field">
                  <label htmlFor="pf-name">Display name</label>
                  <input
                    id="pf-name"
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-title">Headline / Role</label>
                  <input
                    id="pf-title"
                    type="text"
                    value={formState.title}
                    onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Distributed Systems Engineer"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="pf-bio">Bio</label>
                <textarea
                  id="pf-bio"
                  rows={3}
                  value={formState.bio}
                  onChange={(e) => setFormState((p) => ({ ...p, bio: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
                <div className="field">
                  <label htmlFor="pf-skills">Skills (comma-separated)</label>
                  <input
                    id="pf-skills"
                    type="text"
                    value={formState.skillsText}
                    onChange={(e) => setFormState((p) => ({ ...p, skillsText: e.target.value }))}
                    placeholder="React, Node.js, MongoDB, Docker"
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-accent">Accent</label>
                  <input
                    id="pf-accent"
                    type="color"
                    value={formState.accent}
                    onChange={(e) => setFormState((p) => ({ ...p, accent: e.target.value }))}
                  />
                </div>
              </div>

              {/* Links */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Links</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((p) => ({
                        ...p,
                        links: [...p.links, { label: '', url: '' }],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add link
                  </button>
                </div>
                <div className="space-y-2">
                  {formState.links.map((lk, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. GitHub)"
                        value={lk.label}
                        onChange={(e) => {
                          const next = [...formState.links];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setFormState((p) => ({ ...p, links: next }));
                        }}
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={lk.url}
                        onChange={(e) => {
                          const next = [...formState.links];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setFormState((p) => ({ ...p, links: next }));
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Remove link"
                        onClick={() =>
                          setFormState((p) => ({
                            ...p,
                            links: p.links.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-[var(--coral)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Projects */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    Featured Projects
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((p) => ({
                        ...p,
                        projects: [...p.projects, { title: '', desc: '', githubUrl: '' }],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add project
                  </button>
                </div>
                <div className="space-y-3">
                  {formState.projects.map((pr, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                    >
                      <div className="mb-2 flex gap-2">
                        <input
                          type="text"
                          placeholder="Project title"
                          value={pr.title}
                          onChange={(e) => {
                            const next = [...formState.projects];
                            next[idx] = { ...next[idx], title: e.target.value };
                            setFormState((p) => ({ ...p, projects: next }));
                          }}
                        />
                        <button
                          type="button"
                          aria-label="Remove project"
                          onClick={() =>
                            setFormState((p) => ({
                              ...p,
                              projects: p.projects.filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-[var(--coral)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Short description"
                        className="mb-2"
                        value={pr.desc || ''}
                        onChange={(e) => {
                          const next = [...formState.projects];
                          next[idx] = { ...next[idx], desc: e.target.value };
                          setFormState((p) => ({ ...p, projects: next }));
                        }}
                      />
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={pr.githubUrl || ''}
                        onChange={(e) => {
                          const next = [...formState.projects];
                          next[idx] = { ...next[idx], githubUrl: e.target.value };
                          setFormState((p) => ({ ...p, projects: next }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" variant="primary" loading={saveMutation.isPending} className="w-full">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Portfolio
              </Button>
            </form>
          </GlassCard>
        )}

        {/* Live Showcase Preview */}
        <GlassCard
          className="overflow-hidden"
          style={{ borderColor: formState.accent || 'var(--accent)' }}
        >
          <div
            className="h-24 w-full"
            style={{
              background: `linear-gradient(135deg, ${formState.accent || '#7c6fff'}, #4fe3c1)`,
            }}
          />
          <div className="p-7">
            <div className="-mt-14 mb-4 flex items-end gap-4">
              <img
                src={getAvatarUrl(user?.avatarUrl || targetHandle, 96)}
                alt={formState.name || targetHandle}
                onError={(e) => {
                  e.currentTarget.src = AVATAR_FALLBACK_SVG;
                }}
                className="h-20 w-20 rounded-full border-4 border-[var(--bg)] bg-[var(--bg-elevated)] object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold">{formState.name || targetHandle}</h2>
                <p className="mono text-xs" style={{ color: formState.accent || 'var(--accent)' }}>
                  {formState.title || 'Builder'} · @{targetHandle}
                </p>
              </div>
            </div>

            {formState.bio && (
              <p className="mb-5 text-sm text-[var(--text-secondary)]">{formState.bio}</p>
            )}

            {previewSkills.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-1.5">
                {previewSkills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            )}

            {formState.links.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {formState.links
                  .filter((l) => l.label && l.url)
                  .map((l, idx) => (
                    <a
                      key={idx}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      {l.label}
                    </a>
                  ))}
              </div>
            )}

            {formState.projects.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Featured Work
                </h3>
                <div className="space-y-3">
                  {formState.projects
                    .filter((p) => p.title)
                    .map((p, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm">{p.title}</strong>
                          {p.githubUrl && (
                            <a
                              href={p.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mono text-xs text-[var(--accent)] hover:underline"
                            >
                              Repo ↗
                            </a>
                          )}
                        </div>
                        {p.desc && (
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">{p.desc}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
