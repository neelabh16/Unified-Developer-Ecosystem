export const TIERS = [
  { id: 'newcomer', name: 'Newcomer', min: 0, icon: '🌱' },
  { id: 'builder', name: 'Builder', min: 40, icon: '🔧' },
  { id: 'established', name: 'Established Builder', min: 120, icon: '⚡' },
  { id: 'veteran', name: 'Veteran Builder', min: 300, icon: '🛡️' },
  { id: 'legend', name: 'Legend', min: 600, icon: '👑' },
];

export const CODEX_REQUIRED_POINTS = 200;
export const LEGEND_REQUIRED_POINTS = 600;

export const BADGES = [
  {
    id: 'streak',
    name: 'Shipping Streak',
    icon: '🔥',
    description: 'Consistent shipping across projects and discussions.',
  },
  {
    id: 'early',
    name: 'Early Adopter',
    icon: '🌱',
    description: 'Joined DevVerse and started building in the ecosystem.',
  },
  {
    id: 'hunter',
    name: 'Bug Hunter',
    icon: '🐞',
    description: 'Shared debugging insights or critical feedback.',
  },
  {
    id: 'pillar',
    name: 'Community Pillar',
    icon: '🏛️',
    description: 'Active contributor across communities and hackathons.',
  },
];

export const POINT_VALUES = {
  register: 20,
  like: 2,
  bookmark: 3,
  follow: 2,
  join: 5,
  hackathonRegister: 20,
  comment: 15,
  thread: 25,
  reply: 10,
  portfolioMilestone: 30,
  squadFormed: 20,
  squadRegister: 30,
  message: 3,
  projectSubmit: 25,
  codexEntry: 25,
};

export const POINT_ACTIONS_REFERENCE = [
  { id: 'join-devverse', label: 'Join DevVerse', points: '+20', value: 20 },
  { id: 'like-project', label: 'Like a project', points: '+2', value: 2 },
  { id: 'bookmark-project', label: 'Bookmark a project', points: '+3', value: 3 },
  { id: 'follow-dev', label: 'Follow a developer', points: '+2', value: 2 },
  { id: 'join-community', label: 'Join a community', points: '+5', value: 5 },
  { id: 'register-hackathon', label: 'Register for a hackathon', points: '+20', value: 20 },
  { id: 'comment-project', label: 'Comment on a project', points: '+15', value: 15 },
  { id: 'start-thread', label: 'Start a forum thread', points: '+25', value: 25 },
  { id: 'reply-thread', label: 'Reply to a thread', points: '+10', value: 10 },
  { id: 'portfolio-milestone', label: 'Portfolio milestones', points: '+10–30', value: 30 },
  { id: 'squad-action', label: 'Form or register a squad', points: '+20–30', value: 25 },
  { id: 'submit-project', label: 'Submit a project', points: '+25', value: 25 },
  { id: 'contribute-codex', label: 'Contribute to the Codex', points: '+25', value: 25 },
];

export const GAMIFICATION_QUERY_KEYS = [
  ['auth', 'me'],
  ['activity', 'me'],
  ['leaderboard'],
  ['codex', 'status'],
];

export function invalidateGamification(queryClient) {
  if (!queryClient || typeof queryClient.invalidateQueries !== 'function') return Promise.resolve();
  return Promise.all(
    GAMIFICATION_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  );
}

export function getCurrentTier(points = 0) {
  const safePoints = Math.max(0, Number(points) || 0);
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (safePoints >= tier.min) {
      current = tier;
    }
  }
  return current;
}

export function getNextTier(points = 0) {
  const safePoints = Math.max(0, Number(points) || 0);
  for (const tier of TIERS) {
    if (safePoints < tier.min) {
      return tier;
    }
  }
  return null;
}

export function isCodexUnlocked(points = 0, role = 'user') {
  if (role === 'admin') return true;
  return (Number(points) || 0) >= CODEX_REQUIRED_POINTS;
}

export function isLegendUnlocked(points = 0) {
  return (Number(points) || 0) >= LEGEND_REQUIRED_POINTS;
}
