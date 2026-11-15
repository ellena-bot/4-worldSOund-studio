// WHITE SILENCE soundscape. Placeholder synthesized layers until CC0 recordings
// are added — swap any entry to { kind: "file", url } without touching the engine.
import { registerWorldAudio } from "@/audio/registry";
import type { WorldAudioProfile } from "@/audio/types";

export const whiteSilenceAudio: WorldAudioProfile = {
  worldId: "white-silence",
  fadeSeconds: 3,
  defaultMix: { music: 0.5, ambient: 1, spatial: 1 },
  music: [{ kind: "drone", notes: [110, 164.8, 220, 277.2], type: "sine", gain: 0.25 }],
  ambient: [
    { kind: "noise", filter: "lowpass", frequency: 500, lfoRate: 0.08, lfoDepth: 350, gain: 0.5 }, // wind
    { kind: "noise", filter: "highpass", frequency: 4000, gain: 0.05 }, // snow hiss
  ],
  emitters: [
    { id: "streetlight-hum", position: [6, 3, -4], layer: { kind: "drone", notes: [120, 240], type: "sawtooth", gain: 0.05 }, refDistance: 1.5 },
    { id: "vent", position: [-8, 1, -10], layer: { kind: "noise", filter: "bandpass", frequency: 900, q: 2, gain: 0.4 } },
  ],
};

registerWorldAudio(whiteSilenceAudio);
