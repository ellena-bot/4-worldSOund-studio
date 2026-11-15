// THE REVOLUTION soundscape. Synthesized placeholders — swap any entry to
// { kind: "file", url } without touching the engine. Drone and calm-city
// emitters are added at runtime by the scene.
import { registerWorldAudio } from "@/audio/registry";
import type { LayerSpec, WorldAudioProfile } from "@/audio/types";

export const revolutionAudio: WorldAudioProfile = {
  worldId: "the-revolution",
  fadeSeconds: 2.5,
  defaultMix: { music: 0.45, ambient: 0.9, spatial: 1 },
  // Subtle, tense electronic bed: low minor cluster with a detuned saw on top.
  music: [
    { kind: "drone", notes: [55, 65.4, 82.4, 110], type: "sine", gain: 0.22 },
    { kind: "drone", notes: [220, 261.6], type: "sawtooth", gain: 0.025 },
  ],
  ambient: [
    // Distant industrial machinery.
    { kind: "noise", filter: "lowpass", frequency: 140, lfoRate: 0.08, lfoDepth: 40, gain: 0.55 },
    // Futuristic traffic wash.
    { kind: "noise", filter: "bandpass", frequency: 700, q: 0.7, lfoRate: 0.2, lfoDepth: 300, gain: 0.18 },
  ],
  emitters: [
    { id: "pa-checkpoint", position: [0, 6, -48], layer: { kind: "drone", notes: [180, 360], type: "square", gain: 0.03 }, refDistance: 3 },
    { id: "hq-core", position: [0, 2, -80], layer: { kind: "drone", notes: [48, 96, 144], type: "sawtooth", gain: 0.08 }, refDistance: 2 },
    { id: "foundry-vent", position: [40, 2, -20], layer: { kind: "noise", filter: "bandpass", frequency: 300, q: 1.5, gain: 0.5 }, refDistance: 4 },
    { id: "transit-line", position: [0, 10, -38], layer: { kind: "noise", filter: "lowpass", frequency: 420, lfoRate: 0.15, lfoDepth: 200, gain: 0.25 }, refDistance: 6 },
  ],
};

/** Drone rotor + scanner whine; one emitter per patrolling drone. */
export const DRONE_LAYER: LayerSpec = { kind: "drone", notes: [310, 318], type: "sawtooth", gain: 0.035 };
/** Two-tone alarm when a drone's beam catches the visitor. */
export const WARNING_SFX: LayerSpec = { kind: "drone", notes: [880, 660], type: "square", gain: 0.12 };
/** Public-address chime before an announcement. */
export const ANNOUNCE_SFX: LayerSpec = { kind: "drone", notes: [523.3, 659.3, 784], type: "sine", gain: 0.2 };
/** Shutdown power-down. */
export const SHUTDOWN_SFX: LayerSpec = { kind: "noise", filter: "lowpass", frequency: 260, q: 6, gain: 0.8 };
/** Warm chord that replaces the surveillance tension once the network is down. */
export const FREED_LAYER: LayerSpec = { kind: "drone", notes: [130.8, 196, 261.6, 329.6], type: "sine", gain: 0.12 };

registerWorldAudio(revolutionAudio);
