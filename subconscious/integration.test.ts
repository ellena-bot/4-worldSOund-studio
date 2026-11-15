import { describe, expect, it } from 'vitest';
import { getWorld } from '../registry';
import { getLayerFactory, getWorldAudio } from '@/audio/registry';
import { subconsciousAudio } from './audio';
describe('Subconscious registration', () => {
  it('enables solo entry while preserving existing playable worlds', () => {
    expect(getWorld('subconscious')?.status).toBe('playable');
    expect(getWorld('white-silence')?.status).toBe('playable');
    expect(getWorld('the-revolution')?.status).toBe('playable');
    expect(getWorld('abyss')?.status).toBe('playable');
  });
  it('registers its independent audio profile and ethereal layer', () => {
    expect(getWorldAudio('subconscious')).toBe(subconsciousAudio);
    expect(getLayerFactory('dream-echo')).toBeTypeOf('function');
    expect(subconsciousAudio.music.length).toBeGreaterThan(0);
    expect(subconsciousAudio.ambient.length).toBeGreaterThan(0);
    expect(subconsciousAudio.emitters).toHaveLength(3);
  });
});