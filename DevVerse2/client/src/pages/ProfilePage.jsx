import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Crown, MapPin, Save, UserCheck, UserPlus } from 'lucide-react';
import { GitHubIcon } from '../components/common/BrandIcons';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import ProjectCard from '../components/projects/ProjectCard';
import { usersApi } from '../api/users.api';
import { activityApi } from '../api/leaderboard.api';
import { githubApi } from '../api/github.api';
import { uploadsApi } from '../api/uploads.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { AVATAR_FALLBACK_SVG, getAvatarUrl } from '../utils/avatar';
import { timeAgo } from '../utils/formatters';
import {
  BADGES,
  getCurrentTier,
  getNextTier,
  invalidateGamification,
  isLegendUnlocked,
} from '../utils/gamification';
import { validateImageFile } from '../utils/validation';

export default function ProfilePage() {
  const { username } = useParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { showToast } = useToast();

  const targetHandle = username || user?.username;
  const isOwnProfile =
    Boolean(user) &&
    (!username || (user.username && user.username.toLowerCase() === username.toLowerCase()));

  const [tab, setTab] = useState('overview');
  const [editDraft, setEditDraft] = useState(null);
  const [usernameDraft, setUsernameDraft] = useState(null);

  const profileQuery = useQuery({
    queryKey: ['profile', targetHandle],
    queryFn: () => usersApi.getProfile(targetHandle),
    enabled: Boolean(targetHandle),
  });

  const profile =
    profileQuery.data?.data?.user ||
    profileQuery.data?.data?.profile ||
    profileQuery.data?.data ||
    (isOwnProfile ? user : null);

  const projects = profileQuery.data?.data?.projects || profile?.projects || [];
  const isFollowing = Boolean(profileQuery.data?.data?.isFollowing ?? profile?.isFollowing);

  const baseEditForm = {
    name: profile?.name || '',
    bio: profile?.bio || '',
    roleTitle: profile?.roleTitle || '',
    location: profile?.location || '',
    github: profile?.github || '',
    skillsText: Array.isArray(profile?.skills) ? profile.skills.join(', ') : '',
  };
  const editForm = editDraft ?? baseEditForm;
  const setEditForm = (updater) => {
    setEditDraft((prev) => {
      const current = prev ?? baseEditForm;
      return typeof updater === 'function' ? updater(current) : updater;
    });
  };
  const newUsername = usernameDraft ?? (profile?.username || '');
  const setNewUsername = (val) => setUsernameDraft(val);

  const ghHandle = profile?.github || '';
  const ghReposQuery = useQuery({
    queryKey: ['github', 'repos', ghHandle],
    queryFn: () => githubApi.getRepos(ghHandle),
    enabled: Boolean(ghHandle && tab === 'github'),
    retry: false,
  });

  const activityQuery = useQuery({
    queryKey: ['activity', 'me'],
    queryFn: () => activityApi.mine(),
    enabled: isOwnProfile && tab === 'activity',
  });

  const followMutation = useMutation({
    mutationFn: () => usersApi.toggleFollow(targetHandle),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetHandle] });
      invalidateGamification(queryClient);
      showToast(res?.data?.following ? `Following @${targetHandle} (+2 XP)` : 'Unfollowed', 'success');
    },
    onError: (err) => showToast(err.message || 'Sign in to follow builders', 'error'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({
        name: editForm.name.trim(),
        bio: editForm.bio.trim(),
        roleTitle: editForm.roleTitle.trim(),
        location: editForm.location.trim(),
        github: editForm.github.trim(),
        skills: editForm.skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['profile', targetHandle] });
      showToast('Profile updated!', 'success');
    },
    onError: (err) => showToast(err.message || 'Failed to update profile', 'error'),
  });

  const updateUsernameMutation = useMutation({
    mutationFn: () => usersApi.updateUsername(newUsername.trim().toLowerCase()),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('Legend handle updated!', 'success');
    },
    onError: (err) => showToast(err.message || 'Could not update username', 'error'),
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.valid) {
      showToast(check.message, 'error');
      return;
    }
    try {
      await uploadsApi.avatar(file);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['profile', targetHandle] });
      showToast('Avatar updated!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to upload avatar', 'error');
    } finally {
      e.target.value = '';
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="wrap page-header" data-testid="page-profile">
        <Skeleton variant="rect" height="220px" className="mb-6" />
        <Skeleton variant="line" count={4} className="mb-3" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="wrap page-header" data-testid="page-profile">
        <GlassCard className="mx-auto max-w-lg p-10 text-center">
          <h1 className="mb-3 text-2xl font-bold">Builder not found</h1>
          <Link to="/leaderboard" className="btn btn-primary btn-sm">
            Browse Leaderboard
          </Link>
        </GlassCard>
      </div>
    );
  }

  const points = Number(profile.points) || 0;
  const currentTier = getCurrentTier(points);
  const nextTier = getNextTier(points);
  const tierProgress = nextTier
    ? Math.min(100, Math.round(((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100))
    : 100;

  const ghRepos = ghReposQuery.data?.data?.repos || ghReposQuery.data?.data || [];
  const activityItems = activityQuery.data?.data?.events || activityQuery.data?.data || [];

  return (
    <div className="wrap page-header" data-testid="page-profile">
      {/* Header Banner */}
      <GlassCard className="mb-8 p-7 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={getAvatarUrl(profile.avatarUrl || profile.username, 120)}
                alt={profile.name || profile.username}
                onError={(e) => {
                  e.currentTarget.src = AVATAR_FALLBACK_SVG;
                }}
                className="h-24 w-24 rounded-full border-2 border-[var(--accent)] object-cover"
              />
              {isOwnProfile && (
                <label
                  htmlFor="profile-avatar-upload"
                  title="Upload avatar"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <input
                    id="profile-avatar-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}
            </div>

            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold sm:text-3xl">{profile.name || profile.username}</h1>
                <Badge variant="tier" icon={currentTier.icon}>
                  {currentTier.name}
                </Badge>
              </div>
              <div className="mono mb-2 text-sm text-[var(--text-tertiary)]">
                @{profile.username}
                {profile.roleTitle ? ` · ${profile.roleTitle}` : ''}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {profile.location}
                  </span>
                )}
                {profile.github && (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
                  >
                    <GitHubIcon className="h-3.5 w-3.5" />
                    {profile.github}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isOwnProfile && isAuthenticated && (
              <Button
                type="button"
                variant={isFollowing ? 'ghost' : 'primary'}
                size="sm"
                onClick={() => followMutation.mutate()}
                loading={followMutation.isPending}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4 text-[var(--cyan)]" aria-hidden="true" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Follow (+2 XP)
                  </>
                )}
              </Button>
            )}
            <Link
              to={`/portfolio/${encodeURIComponent(profile.username)}`}
              className="btn btn-outline btn-sm"
            >
              Portfolio
            </Link>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-5 max-w-3xl text-sm text-[var(--text-secondary)]">{profile.bio}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-4">
          <div>
            <div className="mono text-xl font-bold text-[var(--cyan)]">
              {points.toLocaleString()} XP
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">Total Points</div>
          </div>
          <div>
            <div className="mono text-xl font-bold">{projects.length}</div>
            <div className="text-xs text-[var(--text-tertiary)]">Projects</div>
          </div>
          <div>
            <div className="mono text-xl font-bold">{profile.followersCount ?? 0}</div>
            <div className="text-xs text-[var(--text-tertiary)]">Followers</div>
          </div>
          <div>
            <div className="mono mb-1 flex justify-between text-xs text-[var(--text-tertiary)]">
              <span>{nextTier ? `Next: ${nextTier.name}` : 'Max Tier'}</span>
              <span>{tierProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--violet)] to-[var(--cyan)]"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="pill-toggle">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={tab === 'overview' ? 'active' : ''}
          >
            Projects &amp; Badges
          </button>
          {ghHandle && (
            <button
              type="button"
              onClick={() => setTab('github')}
              className={tab === 'github' ? 'active' : ''}
            >
              GitHub Repos
            </button>
          )}
          {isOwnProfile && (
            <>
              <button
                type="button"
                onClick={() => setTab('activity')}
                className={tab === 'activity' ? 'active' : ''}
              >
                XP Log
              </button>
              <button
                type="button"
                onClick={() => setTab('edit')}
                className={tab === 'edit' ? 'active' : ''}
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-4">
            {BADGES.map((b) => (
              <GlassCard key={b.id} className="p-4">
                <div className="mb-1 text-2xl">{b.icon}</div>
                <div className="text-sm font-bold">{b.name}</div>
                <p className="text-xs text-[var(--text-tertiary)]">{b.description}</p>
              </GlassCard>
            ))}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold">Shipped Projects ({projects.length})</h2>
            {projects.length === 0 ? (
              <GlassCard className="p-8 text-center text-sm text-[var(--text-secondary)]">
                No published projects yet.
              </GlassCard>
            ) : (
              <div className="grid grid-3">
                {projects.map((p, idx) => (
                  <ProjectCard key={p._id || p.id || idx} project={p} index={idx} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'github' && (
        <div className="grid grid-3">
          {ghReposQuery.isLoading ? (
            <Skeleton variant="card" count={3} />
          ) : ghRepos.length === 0 ? (
            <GlassCard className="p-8 text-sm text-[var(--text-secondary)]">
              No public repositories found for @{ghHandle}.
            </GlassCard>
          ) : (
            ghRepos.slice(0, 9).map((repo) => (
              <GlassCard key={repo.id || repo.name} lift className="p-5">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-1 block font-bold text-[var(--accent)] hover:underline"
                >
                  {repo.name}
                </a>
                <p className="mb-3 line-clamp-2 text-xs text-[var(--text-secondary)]">
                  {repo.description || 'No description'}
                </p>
                <div className="mono flex gap-3 text-[11px] text-[var(--text-tertiary)]">
                  {repo.language && <span>{repo.language}</span>}
                  <span>★ {repo.stargazers_count ?? 0}</span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {tab === 'activity' && isOwnProfile && (
        <GlassCard className="p-6">
          <h2 className="mb-4 text-xl font-bold">Your XP History</h2>
          {activityQuery.isLoading ? (
            <Skeleton variant="line" count={4} className="mb-3" />
          ) : activityItems.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No XP events recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {activityItems.map((ev, idx) => (
                <li key={ev._id || idx} className="flex items-center justify-between py-3 text-sm">
                  <span>{ev.description || ev.reason || ev.action}</span>
                  <div className="flex items-center gap-3">
                    {ev.points && (
                      <span className="mono font-semibold text-[var(--cyan)]">+{ev.points} XP</span>
                    )}
                    <span className="mono text-xs text-[var(--text-tertiary)]">
                      {timeAgo(ev.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      {tab === 'edit' && isOwnProfile && (
        <div className="detail-grid detail-grid--even">
          <GlassCard className="p-7">
            <h2 className="mb-5 text-xl font-bold">Update Profile</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate();
              }}
            >
              <div className="field">
                <label htmlFor="prof-name">Display Name</label>
                <input
                  id="prof-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="prof-role">Role Title</label>
                <input
                  id="prof-role"
                  type="text"
                  value={editForm.roleTitle}
                  onChange={(e) => setEditForm((p) => ({ ...p, roleTitle: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="prof-bio">Bio</label>
                <textarea
                  id="prof-bio"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="field">
                  <label htmlFor="prof-loc">Location</label>
                  <input
                    id="prof-loc"
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="prof-gh">GitHub Username</label>
                  <input
                    id="prof-gh"
                    type="text"
                    value={editForm.github}
                    onChange={(e) => setEditForm((p) => ({ ...p, github: e.target.value }))}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="prof-skills">Skills (comma-separated)</label>
                <input
                  id="prof-skills"
                  type="text"
                  value={editForm.skillsText}
                  onChange={(e) => setEditForm((p) => ({ ...p, skillsText: e.target.value }))}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={updateProfileMutation.isPending}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Changes
              </Button>
            </form>
          </GlassCard>

          <GlassCard className="p-7">
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-5 w-5 text-[var(--legend)]" aria-hidden="true" />
              <h2 className="text-xl font-bold">Legend Handle</h2>
            </div>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Reach 600 XP (Legend tier) to unlock custom handle changes.
            </p>
            <div className="field">
              <label htmlFor="prof-username">New Username</label>
              <input
                id="prof-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={!isLegendUnlocked(points)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isLegendUnlocked(points)}
              loading={updateUsernameMutation.isPending}
              onClick={() => updateUsernameMutation.mutate()}
            >
              Update Handle
            </Button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
