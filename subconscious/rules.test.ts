import { describe, expect, it } from 'vitest';
import { PATHS, TERRACES, ZONES, ease, proximity, sanctuaryUnlocked } from './rules';
describe('Subconscious exploration', () => {
  it('connects all five zones with overlapping walkable surfaces', () => {
    expect(ZONES).toHaveLength(5);
    const surfaces = [...TERRACES, ...PATHS];
    const seen = new Set([0]);
    for (let pass = 0; pass < surfaces.length; pass++) surfaces.forEach((a, i) => {
      surfaces.forEach((b, j) => {
        if (seen.has(j) && Math.abs(a.position[0] - b.position[0]) <= (a.size[0] + b.size[0]) / 2 && Math.abs(a.position[2] - b.position[2]) <= (a.size[2] + b.size[2]) / 2) seen.add(i);
      });
    });
    expect(seen.size).toBe(surfaces.length);
    ZONES.forEach(zone => expect(surfaces.some(s => Math.abs(zone.position[0] - s.position[0]) < s.size[0] / 2 && Math.abs(zone.position[2] - s.position[2]) < s.size[2] / 2)).toBe(true));
  });
  it('requires both visual memories to reveal the sanctuary path', () => {
    expect(sanctuaryUnlocked({})).toBe(false);
    expect(sanctuaryUnlocked({ 'dream-memory-1': true })).toBe(false);
    expect(sanctuaryUnlocked({ 'dream-memory-1': true, 'dream-memory-2': true })).toBe(true);
  });
  it('reacts only within proximity with a smooth bounded transformation', () => {
    expect(proximity(12)).toBe(0); expect(proximity(0)).toBe(1); expect(proximity(6)).toBe(0.5);
    expect(ease(0, 1, 0.05)).toBeGreaterThan(0); expect(ease(0, 1, 0.05)).toBeLessThan(0.1);
    expect(ease(0, 1, 10)).toBe(ease(0, 1, 0.05));
  });
});