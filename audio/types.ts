// Audio system types. Worlds never import these at the core level:
// a world's audio is attached by world id through the audio registry.

export type BusId = "music" | "ambient" | "spatial" | "sfx";
export const BUSES: BusId[] = ["music", "ambient", "spatial", "sfx"];

export type Vec3 = [number, number, number];

/** A sound source description. `kind` selects a registered layer factory. */
export interface LayerSpec {
  kind: string;
  /** Per-layer gain 0..1 before bus/master. */
  gain?: number;
  // Options read by built-in kinds; custom kinds may use `options`.
  url?: string;
  loop?: boolean;
  filter?: BiquadFilterType;
  frequency?: number;
  q?: number;
  lfoRate?: number;
  lfoDepth?: number;
  notes?: number[];
  type?: OscillatorType;
  options?: Record<string, unknown>;
}

export interface EmitterSpec {
  id: string;
  position: Vec3;
  layer: LayerSpec;
  refDistance?: number;
  maxDistance?: number;
  rolloff?: number;
}

export interface WorldAudioProfile {
  worldId: string;
  music: LayerSpec[];
  ambient: LayerSpec[];
  emitters: EmitterSpec[];
  /** Default per-world bus levels (0..1). */
  defaultMix?: Partial<Record<BusId, number>>;
  fadeSeconds?: number;
}

export interface MixState {
  master: number;
  /** Global bus levels. */
  buses: Record<BusId, number>;
  /** Per-world overrides of bus levels. */
  worlds: Record<string, Partial<Record<BusId, number>>>;
  muted: boolean;
}

/** A running sound. Factories return one; the engine owns its lifetime. */
export interface LayerInstance {
  output: AudioNode;
  start(when: number): void;
  stop(when: number): void;
}

export type LayerFactory = (ctx: AudioContext, spec: LayerSpec) => LayerInstance | Promise<LayerInstance>;
