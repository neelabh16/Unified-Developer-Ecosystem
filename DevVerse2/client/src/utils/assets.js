import heroRobotDark from '../assets/img/hero-robot-dark.png';
import heroRobotLight from '../assets/img/hero-robot-light.png';
import robotCoding from '../assets/img/robot-coding.png';
import robotPodium from '../assets/img/robot-podium.png';

import project1 from '../assets/img/project-cards/project-1.png';
import project2 from '../assets/img/project-cards/project-2.png';
import project3 from '../assets/img/project-cards/project-3.png';
import project4 from '../assets/img/project-cards/project-4.png';
import project5 from '../assets/img/project-cards/project-5.png';
import project6 from '../assets/img/project-cards/project-6.png';
import project7 from '../assets/img/project-cards/project-7.png';
import project8 from '../assets/img/project-cards/project-8.png';
import project9 from '../assets/img/project-cards/project-9.png';
import project10 from '../assets/img/project-cards/project-10.png';
import project11 from '../assets/img/project-cards/project-11.png';
import project12 from '../assets/img/project-cards/project-12.png';
import project13 from '../assets/img/project-cards/project-13.png';
import project14 from '../assets/img/project-cards/project-14.png';
import project15 from '../assets/img/project-cards/project-15.png';
import project16 from '../assets/img/project-cards/project-16.png';

export { heroRobotDark, heroRobotLight, robotCoding, robotPodium };

export const PROJECT_ART_MAP = {
  'project-1.png': project1,
  'project-2.png': project2,
  'project-3.png': project3,
  'project-4.png': project4,
  'project-5.png': project5,
  'project-6.png': project6,
  'project-7.png': project7,
  'project-8.png': project8,
  'project-9.png': project9,
  'project-10.png': project10,
  'project-11.png': project11,
  'project-12.png': project12,
  'project-13.png': project13,
  'project-14.png': project14,
  'project-15.png': project15,
  'project-16.png': project16,
};

export const DV_TECH_GRADIENTS = [
  'linear-gradient(135deg,#7c6fff,#4fe3c1)',
  'linear-gradient(135deg,#ff6b5b,#7c6fff)',
  'linear-gradient(135deg,#4fe3c1,#ffb86b)',
  'linear-gradient(135deg,#ffb86b,#ff6b5b)',
  'linear-gradient(135deg,#7c6fff,#ff6b5b)',
];

const FALLBACK_ART_KEYS = [
  'project-1.png',
  'project-2.png',
  'project-3.png',
  'project-4.png',
  'project-5.png',
];

const MEDICAL_RE =
  /\b(health|medical|medicine|doctor|clinic|clinician|patient|hospital|pharmacy|nurse|therapy|diagnosis)\b/i;

function normalizeArtKey(val) {
  return String(val)
    .trim()
    .replace(/^\/+/, '')
    .replace(/^assets\/img\/project-cards\//, '');
}

export function pickProjectArtKey(project) {
  if (!project) return 'project-1.png';
  if (typeof project === 'string') {
    const clean = normalizeArtKey(project);
    if (PROJECT_ART_MAP[clean]) return clean;
  }

  const rawArt = typeof project.art === 'string'
    ? normalizeArtKey(project.art)
    : '';
  if (rawArt && PROJECT_ART_MAP[rawArt]) {
    return rawArt;
  }

  const text = `${project.title || ''} ${project.desc || ''}`;
  if (MEDICAL_RE.test(text)) {
    return 'project-16.png';
  }

  const seed = String(project.id || project._id || project.legacyId || project.title || '0');
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_ART_KEYS[Math.abs(h) % FALLBACK_ART_KEYS.length];
}

export function resolveProjectArt(projectOrFilename) {
  if (typeof projectOrFilename === 'string') {
    const clean = normalizeArtKey(projectOrFilename);
    if (PROJECT_ART_MAP[clean]) {
      return PROJECT_ART_MAP[clean];
    }
    return PROJECT_ART_MAP['project-1.png'];
  }
  const key = pickProjectArtKey(projectOrFilename);
  return PROJECT_ART_MAP[key] || PROJECT_ART_MAP['project-1.png'];
}
