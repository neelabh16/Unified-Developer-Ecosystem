import { describe, expect, it, vi } from 'vitest';
import {
  BADGES,
  CODEX_REQUIRED_POINTS,
  GAMIFICATION_QUERY_KEYS,
  LEGEND_REQUIRED_POINTS,
  POINT_ACTIONS_REFERENCE,
  TIERS,
  getCurrentTier,
  getNextTier,
  invalidateGamification,
  isCodexUnlocked,
  isLegendUnlocked,
} from '../utils/gamification';

describe('Gamification utilities', () => {
  it('defines the 5 tiers with exact thresholds', () => {
    expect(TIERS.map((t) => [t.name, t.min])).toEqual([
      ['Newcomer', 0],
      ['Builder', 40],
      ['Established Builder', 120],
      ['Veteran Builder', 300],
      ['Legend', 600],
    ]);
  });

  it('resolves current and next tier boundaries accurately', () => {
    expect(getCurrentTier(0).name).toBe('Newcomer');
    expect(getNextTier(0).name).toBe('Builder');
    expect(getCurrentTier(39).name).toBe('Newcomer');
    expect(getCurrentTier(40).name).toBe('Builder');
    expect(getNextTier(40).name).toBe('Established Builder');
    expect(getCurrentTier(120).name).toBe('Established Builder');
    expect(getCurrentTier(300).name).toBe('Veteran Builder');
    expect(getCurrentTier(600).name).toBe('Legend');
    expect(getNextTier(600)).toBeNull();
  });

  it('gates Codex at 200 points (or admin) and Legend at 600 points', () => {
    expect(CODEX_REQUIRED_POINTS).toBe(200);
    expect(LEGEND_REQUIRED_POINTS).toBe(600);

    expect(isCodexUnlocked(199, 'user')).toBe(false);
    expect(isCodexUnlocked(200, 'user')).toBe(true);
    expect(isCodexUnlocked(10, 'admin')).toBe(true);

    expect(isLegendUnlocked(599)).toBe(false);
    expect(isLegendUnlocked(600)).toBe(true);
  });

  it('exposes 4 badges and 13 point action reference entries', () => {
    expect(BADGES).toHaveLength(4);
    expect(POINT_ACTIONS_REFERENCE).toHaveLength(13);
  });

  it('invalidates all gamification query keys', async () => {
    const queryClient = { invalidateQueries: vi.fn().mockResolvedValue(undefined) };
    await invalidateGamification(queryClient);
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(
      GAMIFICATION_QUERY_KEYS.length
    );
    GAMIFICATION_QUERY_KEYS.forEach((queryKey) => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey });
    });
  });
});
