import { registerLayerKind, registerWorldAudio } from '@/audio/registry';
import type { WorldAudioProfile } from '@/audio/types';
import whaleRecording from '@/assets/audio/abyss-whale.ogg.asset.json';
export const whaleCall = { kind: 'file', url: whaleRecording.url, loop: false, gain: 0.32 };
// Synthesized fallback for unavailable CC0 hydrophone recordings.
registerLayerKind('abyss-call', (ctx, spec) => {
  const out = ctx.createGain(); out.gain.value = 0;
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.connect(out);
  return { output: out, start: t => {
    osc.frequency.setValueAtTime(spec.frequency ?? 100, t); osc.frequency.exponentialRampToValueAtTime(47, t + 3.5);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(spec.gain ?? 0.1, t + 1); out.gain.setTargetAtTime(0, t + 2, 0.9); osc.start(t);
  }, stop: t => { out.gain.setTargetAtTime(0, t, 0.12); try { osc.stop(t + 0.6); } catch { /* already stopped */ } } };
});
export const abyssAudio: WorldAudioProfile = {
  worldId: 'abyss', fadeSeconds: 3, defaultMix: { music: 0.65, ambient: 0.8, spatial: 0.9 },
  music: [{ kind: 'drone', notes: [36.7, 55.05, 73.4], gain: 0.065 }],
  ambient: [{ kind: 'noise', filter: 'lowpass', frequency: 180, gain: 0.14, lfoRate: 0.06, lfoDepth: 70 }],
  emitters: [
    { id: 'abyss-arrival-fan', position: [5, 4, 8], layer: { kind: 'noise', filter: 'bandpass', frequency: 500, q: 2, gain: 0.13 }, refDistance: 3, maxDistance: 22, rolloff: 1.4 },
    { id: 'abyss-tunnel-hull', position: [-4, 3, -24], layer: { kind: 'drone', notes: [82, 83.1], gain: 0.1 }, refDistance: 4, maxDistance: 28 },
    { id: 'abyss-lab-machinery', position: [-7, 2, -56], layer: { kind: 'noise', filter: 'bandpass', frequency: 960, q: 5, gain: 0.15 }, refDistance: 3, maxDistance: 20 },
    { id: 'abyss-deck-ocean', position: [20, 5, -82], layer: { kind: 'noise', filter: 'lowpass', frequency: 95, gain: 0.22 }, refDistance: 12, maxDistance: 50 },
    { id: 'abyss-restricted-hum', position: [3, 3, -108], layer: { kind: 'drone', notes: [47, 48.5], gain: 0.16 }, refDistance: 3, maxDistance: 18 },
  ],
};
registerWorldAudio(abyssAudio);