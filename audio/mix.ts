// Pure volume math and persistence. No Web Audio here, so it is unit-testable.
import { BUSES, type BusId, type MixState, type WorldAudioProfile } from "./types";

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export const defaultMix = (): MixState => ({
  master: 0.8,
  buses: { music: 0.7, ambient: 0.8, spatial: 0.9, sfx: 0.9 },
  worlds: {},
  muted: false,
});

/** Effective gain = master × global bus × world bus (override, else profile default, else 1). */
export function effectiveGain(mix: MixState, bus: BusId, worldId?: string, profile?: WorldAudioProfile): number {
  if (mix.muted) return 0;
  const world = worldId ? (mix.worlds[worldId]?.[bus] ?? profile?.defaultMix?.[bus] ?? 1) : 1;
  return clamp01(mix.master) * clamp01(mix.buses[bus]) * clamp01(world);
}

export function setMaster(mix: MixState, v: number): MixState {
  return { ...mix, master: clamp01(v) };
}
export function setBus(mix: MixState, bus: BusId, v: number): MixState {
  return { ...mix, buses: { ...mix.buses, [bus]: clamp01(v) } };
}
export function setWorldBus(mix: MixState, worldId: string, bus: BusId, v: number): MixState {
  return { ...mix, worlds: { ...mix.worlds, [worldId]: { ...mix.worlds[worldId], [bus]: clamp01(v) } } };
}

const KEY = "iw.audio.mix.v1";
export function loadMix(storage: Pick<Storage, "getItem"> | undefined): MixState {
  const base = defaultMix();
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return base;
    const p = JSON.parse(raw) as Partial<MixState>;
    const buses = { ...base.buses };
    for (const b of BUSES) if (typeof p.buses?.[b] === "number") buses[b] = clamp01(p.buses[b]);
    return {
      master: typeof p.master === "number" ? clamp01(p.master) : base.master,
      buses,
      worlds: p.worlds && typeof p.worlds === "object" ? p.worlds : {},
      muted: !!p.muted,
    };
  } catch {
    return base;
  }
}
export function saveMix(storage: Pick<Storage, "setItem"> | undefined, mix: MixState) {
  storage?.setItem(KEY, JSON.stringify(mix));
}
