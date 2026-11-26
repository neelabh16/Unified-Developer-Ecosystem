import { describe, expect, it } from 'vitest';
import {
  DV_TECH_GRADIENTS,
  PROJECT_ART_MAP,
  heroRobotDark,
  heroRobotLight,
  pickProjectArtKey,
  resolveProjectArt,
  robotCoding,
  robotPodium,
} from '../utils/assets';

describe('Assets migration & resolver', () => {
  it('exports all 4 robot PNGs and all 16 project card PNGs', () => {
    expect(heroRobotDark).toBeTruthy();
    expect(heroRobotLight).toBeTruthy();
    expect(robotCoding).toBeTruthy();
    expect(robotPodium).toBeTruthy();
    expect(Object.keys(PROJECT_ART_MAP)).toHaveLength(16);
    for (let i = 1; i <= 16; i += 1) {
      expect(PROJECT_ART_MAP[`project-${i}.png`]).toBeTruthy();
    }
    expect(DV_TECH_GRADIENTS).toHaveLength(5);
  });

  it('resolves explicit art filename or legacy path including leading slashes', () => {
    expect(resolveProjectArt('project-7.png')).toBe(PROJECT_ART_MAP['project-7.png']);
    expect(resolveProjectArt('assets/img/project-cards/project-12.png')).toBe(
      PROJECT_ART_MAP['project-12.png']
    );
    expect(resolveProjectArt('/assets/img/project-cards/project-7.png')).toBe(
      PROJECT_ART_MAP['project-7.png']
    );
    expect(pickProjectArtKey('/assets/img/project-cards/project-7.png')).toBe('project-7.png');
    expect(resolveProjectArt({ art: 'project-14.png', title: 'Test' })).toBe(
      PROJECT_ART_MAP['project-14.png']
    );
    expect(
      resolveProjectArt({ art: '/assets/img/project-cards/project-9.png', title: 'Test' })
    ).toBe(PROJECT_ART_MAP['project-9.png']);
  });

  it('uses medical keyword heuristic and deterministic hashing fallback', () => {
    expect(
      pickProjectArtKey({
        title: 'AI Patient Triage Assistant',
        desc: 'For hospital clinic teams',
      })
    ).toBe('project-16.png');

    const k1 = pickProjectArtKey({ id: '42', title: 'Edge Compiler' });
    const k2 = pickProjectArtKey({ id: '42', title: 'Edge Compiler' });
    expect(k1).toBe(k2);
    expect(PROJECT_ART_MAP[k1]).toBeTruthy();
  });
});
