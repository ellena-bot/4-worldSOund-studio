import { registerLayerKind, registerWorldAudio } from '@/audio/registry';
import type { WorldAudioProfile } from '@/audio/types';
// Procedural ethereal synthesizer: this world's requested instrument, not a substitute recording.
registerLayerKind('dream-echo', (ctx, spec) => {
  const output = ctx.createGain(); output.gain.value = spec.gain ?? 0.08;
  const dry = ctx.createGain(); dry.gain.value = 0.5; dry.connect(output);
  const delay = ctx.createDelay(2); delay.delayTime.value = 0.63;
  const feedback = ctx.createGain(); feedback.gain.value = 0.28;
  dry.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(output);
  const sources = (spec.notes ?? [146.83, 220, 293.66]).map((frequency, index) => {
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = frequency; osc.detune.value = index * 3 - 3;
    const gain = ctx.createGain(); gain.gain.value = 1 / 6; osc.connect(gain).connect(dry); return osc;
  });
  return { output, start: t => { output.gain.setValueAtTime(0, t); output.gain.linearRampToValueAtTime(spec.gain ?? 0.08, t + 0.4); sources.forEach(s => s.start(t)); }, stop: t => { output.gain.cancelScheduledValues(t); output.gain.setTargetAtTime(0, t, 0.15); sources.forEach(s => { try { s.stop(t + 0.8); } catch { /* already stopped */ } }); setTimeout(() => { feedback.disconnect(); delay.disconnect(); output.disconnect(); }, Math.max(0, t + 1.5 - ctx.currentTime) * 1000); } };
});
export const subconsciousAudio: WorldAudioProfile = {
  worldId: 'subconscious', fadeSeconds: 3, defaultMix: { music: 0.7, ambient: 0.8, spatial: 0.9 },
  music: [{ kind: 'dream-echo', notes: [73.42, 110, 146.83, 185], gain: 0.12 }],
  ambient: [{ kind: 'noise', filter: 'lowpass', frequency: 260, lfoRate: 0.04, lfoDepth: 120, gain: 0.08 }, { kind: 'dream-echo', notes: [440, 554.37, 659.25], gain: 0.022 }],
  emitters: [
    { id: 'dream-reflection', position: [22, 2, -30], layer: { kind: 'dream-echo', notes: [293.66, 440], gain: 0.09 }, refDistance: 3 },
    { id: 'dream-distant', position: [36, 10, -59], layer: { kind: 'dream-echo', notes: [98, 147], gain: 0.12 }, refDistance: 5 },
    { id: 'dream-sanctuary', position: [0, 3, -80], layer: { kind: 'dream-echo', notes: [220, 329.63, 440], gain: 0.1 }, refDistance: 3 },
  ],
};
registerWorldAudio(subconsciousAudio);