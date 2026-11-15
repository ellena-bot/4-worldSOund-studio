// Extension points. New sound types and new worlds plug in here;
// neither the engine nor the world modules need editing.
import type { LayerFactory, WorldAudioProfile } from "./types";

const layerKinds = new Map<string, LayerFactory>();
const worldProfiles = new Map<string, WorldAudioProfile>();

export function registerLayerKind(kind: string, factory: LayerFactory) {
  layerKinds.set(kind, factory);
}
export function getLayerFactory(kind: string): LayerFactory | undefined {
  return layerKinds.get(kind);
}

export function registerWorldAudio(profile: WorldAudioProfile) {
  worldProfiles.set(profile.worldId, profile);
}
export function getWorldAudio(worldId: string): WorldAudioProfile | undefined {
  return worldProfiles.get(worldId);
}
export function listWorldAudio(): WorldAudioProfile[] {
  return [...worldProfiles.values()];
}
