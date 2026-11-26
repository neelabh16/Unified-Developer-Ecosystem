import { DV_TECH_GRADIENTS, pickProjectArtKey, resolveProjectArt } from './assets';

export const TECH_GRADIENTS = DV_TECH_GRADIENTS;

export function pickProjectArt(project) {
  return pickProjectArtKey(project);
}

export { resolveProjectArt };

export function timeAgo(input) {
  if (input === null || input === undefined) return 'just now';
  let minutes = 0;
  if (typeof input === 'number' && Number.isFinite(input)) {
    minutes = Math.max(0, input);
  } else {
    const ts = new Date(input).getTime();
    if (Number.isNaN(ts)) return 'just now';
    minutes = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  }
  if (minutes <= 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return String(num);
}

export function formatRupees(n) {
  const num = Number(n) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function parseGithubRepoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git|\/|$)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
  };
}
