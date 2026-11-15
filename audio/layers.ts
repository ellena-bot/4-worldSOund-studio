// Built-in layer kinds. Add more by calling registerLayerKind elsewhere.
import { registerLayerKind } from "./registry";
import type { LayerInstance, LayerSpec } from "./types";

function wrap(ctx: AudioContext, sources: AudioScheduledSourceNode[], out: AudioNode, gain = 1): LayerInstance {
  const g = ctx.createGain();
  g.gain.value = gain;
  out.connect(g);
  return {
    output: g,
    start: (t) => sources.forEach((s) => s.start(t)),
    stop: (t) => sources.forEach((s) => { try { s.stop(t); } catch { /* already stopped */ } }),
  };
}

/** Looping recorded file: { kind: "file", url, loop? } */
registerLayerKind("file", async (ctx, spec: LayerSpec) => {
  const res = await fetch(String(spec.url));
  const buf = await ctx.decodeAudioData(await res.arrayBuffer());
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = spec.loop !== false;
  return wrap(ctx, [src], src, spec.gain);
});

/** Filtered noise (wind, hum, water): { kind: "noise", filter, frequency, q, lfoRate, lfoDepth } */
registerLayerKind("noise", (ctx, spec) => {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = (spec.filter as BiquadFilterType) ?? "lowpass";
  f.frequency.value = Number(spec.frequency ?? 600);
  f.Q.value = Number(spec.q ?? 0.7);
  src.connect(f);
  const sources: AudioScheduledSourceNode[] = [src];
  if (spec.lfoRate) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = Number(spec.lfoRate);
    depth.gain.value = Number(spec.lfoDepth ?? 200);
    lfo.connect(depth).connect(f.frequency);
    sources.push(lfo);
  }
  return wrap(ctx, sources, f, spec.gain);
});

/** Sustained chord pad (placeholder music): { kind: "drone", notes: Hz[], type } */
registerLayerKind("drone", (ctx, spec) => {
  const notes = (spec.notes as number[]) ?? [110, 165];
  const mix = ctx.createGain();
  mix.gain.value = 1 / notes.length;
  const oscs = notes.map((hz, i) => {
    const o = ctx.createOscillator();
    o.type = (spec.type as OscillatorType) ?? "sine";
    o.frequency.value = hz;
    o.detune.value = (i % 2 ? 1 : -1) * 6;
    o.connect(mix);
    return o;
  });
  return wrap(ctx, oscs, mix, spec.gain);
});
