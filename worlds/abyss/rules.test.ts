import { describe, expect, it } from 'vitest';
import { FACILITY, interiorAt, sectorUnlocked, whalePhase, whalePosition } from './rules';
import { abyssAudio } from './audio';
import { getWorldAudio, getLayerFactory } from '@/audio/registry';
import { getWorld } from '../registry';
describe('Abyss facility rules', () => {
  it('connects all five named zones without gaps', () => {
    expect(FACILITY.map(s => s.id)).toEqual(['arrival', 'tunnel', 'laboratory', 'observation', 'restricted']);
    for (let i = 1; i < FACILITY.length; i++) expect(FACILITY[i]?.start).toBe(FACILITY[i - 1]?.end);
    for (let z = 17; z > -116; z--) expect(interiorAt(0, z)).toBe(true);
  });
  it('keeps the ocean outside the glass corridor and closed ends', () => {
    expect(interiorAt(4.4, -20)).toBe(false); expect(interiorAt(0, 19)).toBe(false); expect(interiorAt(0, -117)).toBe(false);
  });
  it('requires research clearance for the restricted sector', () => {
    expect(sectorUnlocked({})).toBe(false); expect(sectorUnlocked({ 'abyss-clearance': false })).toBe(false); expect(sectorUnlocked({ 'abyss-clearance': true })).toBe(true);
  });
  it('makes the whale encounter rare with a complete interval between passes', () => {
    expect(whalePhase(0).visible).toBe(false); expect(whalePhase(4).visible).toBe(true); expect(whalePhase(45).visible).toBe(true); expect(whalePhase(46).visible).toBe(false); expect(whalePhase(153).visible).toBe(false); expect(whalePhase(154).visible).toBe(true);
  });
  it('moves the whale smoothly outside the observation glass', () => {
    expect(whalePosition(0)).toEqual([33, 7, -135]); expect(whalePosition(1)[2]).toBe(-29);
    expect(whalePosition(0.51)[2] - whalePosition(0.5)[2]).toBeCloseTo(1.06);
  });
  it('registers Abyss separately while all four worlds stay playable', () => {
    for (const id of ['abyss', 'subconscious', 'white-silence', 'the-revolution']) expect(getWorld(id)?.status).toBe('playable');
    expect(getWorldAudio('abyss')).toBe(abyssAudio); expect(getLayerFactory('abyss-call')).toBeTypeOf('function'); expect(abyssAudio.emitters).toHaveLength(5);
  });
});