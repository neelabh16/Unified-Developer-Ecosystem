import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, Plus, Send, Sparkles, Trophy, UserPlus, Users } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import { squadsApi, messagesApi } from '../api/squads.api';
import { hackathonsApi } from '../api/hackathons.api';
import { useToast } from '../hooks/useToast';
import { AVATAR_FALLBACK_SVG, getAvatarUrl } from '../utils/avatar';
import { invalidateGamification } from '../utils/gamification';
import { squadSchema } from '../utils/validation';

export default function SquadsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeChatHandle, setActiveChatHandle] = useState('');
  const [chatText, setChatText] = useState('');
  const [inviteInputs, setInviteInputs] = useState({});
  const [selectedHackathon, setSelectedHackathon] = useState({});

  const squadsQuery = useQuery({
    queryKey: ['squads', 'mine'],
    queryFn: () => squadsApi.mine(),
  });

  const matchesQuery = useQuery({
    queryKey: ['squads', 'matches'],
    queryFn: () => squadsApi.matches(),
  });

  const hackathonsQuery = useQuery({
    queryKey: ['hackathons'],
    queryFn: () => hackathonsApi.list(),
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', activeChatHandle],
    queryFn: () => messagesApi.get(activeChatHandle),
    enabled: Boolean(activeChatHandle),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(squadSchema),
    defaultValues: { name: '', description: '' },
  });

  const createSquad = async (values) => {
    try {
      await squadsApi.create({
        name: values.name.trim(),
        description: values.description.trim(),
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ['squads', 'mine'] });
      invalidateGamification(queryClient);
      showToast('Squad formed! (+20 XP)', 'success');
    } catch (err) {
      showToast(err.message || 'Could not create squad', 'error');
    }
  };

  const leaveMutation = useMutation({
    mutationFn: (id) => squadsApi.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads', 'mine'] });
      showToast('Left squad', 'success');
    },
    onError: (err) => showToast(err.message || 'Could not leave squad', 'error'),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ squadId, username }) => squadsApi.addMember(squadId, username),
    onSuccess: (_, vars) => {
      setInviteInputs((prev) => ({ ...prev, [vars.squadId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['squads', 'mine'] });
      showToast('Builder added to squad', 'success');
    },
    onError: (err) => showToast(err.message || 'Could not add member', 'error'),
  });

  const regHackMutation = useMutation({
    mutationFn: ({ squadId, hackathonId }) => squadsApi.registerHackathon(squadId, hackathonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads', 'mine'] });
      invalidateGamification(queryClient);
      showToast('Squad registered for hackathon! (+30 XP)', 'success');
    },
    onError: (err) => showToast(err.message || 'Could not register squad', 'error'),
  });

  const sendMessageMutation = useMutation({
    mutationFn: () => messagesApi.send(activeChatHandle, chatText.trim()),
    onSuccess: () => {
      setChatText('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeChatHandle] });
      invalidateGamification(queryClient);
    },
    onError: (err) => showToast(err.message || 'Failed to send message', 'error'),
  });

  const mySquads = squadsQuery.data?.data?.squads || squadsQuery.data?.data || [];
  const matches = matchesQuery.data?.data?.matches || matchesQuery.data?.data || [];
  const hackathons = hackathonsQuery.data?.data?.hackathons || hackathonsQuery.data?.data || [];
  const messages = messagesQuery.data?.data?.messages || messagesQuery.data?.data || [];

  return (
    <div className="wrap page-header" data-testid="page-squads">
      <span className="eyebrow">Team Formation &amp; Messaging</span>
      <h1 className="mb-3">
        Hackathon <span className="grad-text">Squads</span>
      </h1>
      <p className="lede mb-10">
        Form engineering squads, discover compatible teammates, and message builders directly.
      </p>

      <div className="detail-grid detail-grid--even mb-12">
        {/* Create Squad */}
        <GlassCard className="p-7">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-xl font-bold">Form a New Squad (+20 XP)</h2>
          </div>
          <form onSubmit={handleSubmit(createSquad)} noValidate>
            <div className="field">
              <label htmlFor="sq-name">Squad name</label>
              <input
                id="sq-name"
                type="text"
                placeholder="e.g. Neural Forge"
                className={errors.name ? 'field-error' : ''}
                {...register('name')}
              />
              {errors.name && <span className="field-error-msg show">{errors.name.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="sq-desc">Mission / stack</label>
              <textarea
                id="sq-desc"
                rows={3}
                placeholder="What are you building and who are you looking for?"
                className={errors.description ? 'field-error' : ''}
                {...register('description')}
              />
              {errors.description && (
                <span className="field-error-msg show">{errors.description.message}</span>
              )}
            </div>
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
              Create Squad
            </Button>
          </form>
        </GlassCard>

        {/* Direct Messages */}
        <GlassCard className="flex flex-col p-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[var(--cyan)]" aria-hidden="true" />
              <h2 className="text-xl font-bold">Direct Messages</h2>
            </div>
            {activeChatHandle && <Badge variant="accent">@{activeChatHandle}</Badge>}
          </div>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={activeChatHandle}
              onChange={(e) => setActiveChatHandle(e.target.value.trim())}
              placeholder="Enter builder handle (e.g. kmori)"
              aria-label="Builder handle to message"
            />
          </div>

          <div className="mb-4 h-48 flex-1 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            {!activeChatHandle ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                Select a teammate below or enter a handle to open a thread.
              </p>
            ) : messagesQuery.isLoading ? (
              <Skeleton variant="line" count={3} />
            ) : messages.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                No messages with @{activeChatHandle} yet. Say hello!
              </p>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={m._id || idx}
                  className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs"
                >
                  <span className="mono font-semibold text-[var(--accent)]">
                    @{m.sender?.username || m.from || 'you'}:{' '}
                  </span>
                  <span className="text-[var(--text-primary)]">{m.text}</span>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!activeChatHandle || !chatText.trim()) return;
              sendMessageMutation.mutate();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Write a message… (+3 XP)"
              disabled={!activeChatHandle}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!activeChatHandle || !chatText.trim()}
              loading={sendMessageMutation.isPending}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </GlassCard>
      </div>

      {/* My Squads */}
      <section className="mb-12">
        <div className="mb-5 flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-2xl font-bold">Your Squads ({mySquads.length})</h2>
        </div>

        {squadsQuery.isLoading ? (
          <div className="grid grid-2">
            <Skeleton variant="card" count={2} />
          </div>
        ) : mySquads.length === 0 ? (
          <GlassCard className="p-8 text-center text-sm text-[var(--text-secondary)]">
            You haven&apos;t joined or created a squad yet. Create one above!
          </GlassCard>
        ) : (
          <div className="grid grid-2">
            {mySquads.map((sq) => {
              const sqId = sq._id || sq.id;
              return (
                <GlassCard key={sqId} className="p-6">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">{sq.name}</h3>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => leaveMutation.mutate(sqId)}
                    >
                      Leave
                    </Button>
                  </div>
                  <p className="mb-4 text-sm text-[var(--text-secondary)]">{sq.description}</p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {(sq.members || []).map((mem, i) => {
                      const handle = typeof mem === 'string' ? mem : mem.username || 'member';
                      return (
                        <button
                          key={handle + i}
                          type="button"
                          onClick={() => setActiveChatHandle(handle)}
                          className="chip chip-link"
                        >
                          @{handle}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={inviteInputs[sqId] || ''}
                      onChange={(e) =>
                        setInviteInputs((prev) => ({ ...prev, [sqId]: e.target.value }))
                      }
                      placeholder="Add member by @username"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const username = (inviteInputs[sqId] || '').trim().replace(/^@/, '');
                        if (username) addMemberMutation.mutate({ squadId: sqId, username });
                      }}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>

                  {hackathons.length > 0 && (
                    <div className="flex gap-2">
                      <select
                        value={selectedHackathon[sqId] || ''}
                        onChange={(e) =>
                          setSelectedHackathon((prev) => ({ ...prev, [sqId]: e.target.value }))
                        }
                        aria-label="Select hackathon for squad"
                      >
                        <option value="">Register squad for hackathon…</option>
                        {hackathons.map((h) => (
                          <option key={h._id || h.id} value={h._id || h.id}>
                            {h.title}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const hid = selectedHackathon[sqId];
                          if (hid) regHackMutation.mutate({ squadId: sqId, hackathonId: hid });
                        }}
                      >
                        <Trophy className="h-4 w-4 text-[var(--amber)]" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>

      {/* Recommended Teammate Matches */}
      <section>
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--cyan)]" aria-hidden="true" />
          <h2 className="text-2xl font-bold">Compatible Builders</h2>
        </div>

        <div className="grid grid-3">
          {matchesQuery.isLoading ? (
            <Skeleton variant="card" count={3} />
          ) : (
            matches.slice(0, 6).map((m, idx) => {
              const dev = m.user || m;
              const handle = dev.username || dev.handle || 'builder';
              return (
                <GlassCard key={handle + idx} className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={getAvatarUrl(dev.avatarUrl || handle, 64)}
                      alt={dev.name || handle}
                      onError={(e) => {
                        e.currentTarget.src = AVATAR_FALLBACK_SVG;
                      }}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${encodeURIComponent(handle)}`}
                        className="block truncate font-semibold hover:text-[var(--accent)]"
                      >
                        {dev.name || handle}
                      </Link>
                      <div className="mono text-xs text-[var(--text-tertiary)]">@{handle}</div>
                    </div>
                    {typeof m.score === 'number' && (
                      <Badge variant="accent">{m.score}% match</Badge>
                    )}
                  </div>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {(dev.skills || []).slice(0, 4).map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveChatHandle(handle)}
                  >
                    Message @{handle}
                  </Button>
                </GlassCard>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
