export const AVATAR_FALLBACK_SVG =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%237c6fff'/%3E%3Cstop offset='1' stop-color='%234fe3c1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='40' fill='url(%23g)' opacity='0.22'/%3E%3Ccircle cx='40' cy='31' r='13' fill='%239aa0b4'/%3E%3Cpath d='M16 68c4-14 14-20 24-20s20 6 24 20' fill='%239aa0b4'/%3E%3C/svg%3E";

export function resolveUploadUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith('/uploads/')) return url;
  if (url.startsWith('uploads/')) return `/${url}`;
  return url;
}

export function getAvatarUrl(seedOrUrl, size = 80) {
  const val = typeof seedOrUrl === 'string' && seedOrUrl.trim() ? seedOrUrl.trim() : 'you-builder';
  if (/^(https?:|data:|blob:)/i.test(val) || val.startsWith('/uploads/') || val.startsWith('uploads/')) {
    return resolveUploadUrl(val);
  }
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(val)}&backgroundColor=transparent&size=${size}`;
}

export function getInitialGradient(name = 'D') {
  const ch = (String(name || 'D').trim()[0] || 'D').toUpperCase();
  const deg = (ch.charCodeAt(0) * 27) % 360;
  return {
    initial: ch,
    background: `conic-gradient(from ${deg}deg, var(--violet), var(--cyan), var(--coral), var(--amber), var(--violet))`,
  };
}
