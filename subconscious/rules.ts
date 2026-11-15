export type V3 = [number, number, number];
export const ZONES: { id: string; title: string; position: V3; radius: number; body: string }[] = [
  { id: 'entrance', title: 'The Entrance', position: [0, 1, 7], radius: 6, body: 'A doorway with no wall. Beyond it, a place you almost remember.' },
  { id: 'architecture', title: 'The Floating Architecture', position: [0, 1, -15], radius: 8, body: 'The stairs continue long after they have forgotten where they lead.' },
  { id: 'reflection', title: 'The Reflection Zone', position: [22, 1, -30], radius: 8, body: 'The water remembers a sky that is not above you.' },
  { id: 'distortion', title: 'The Distortion Zone', position: [22, 1, -58], radius: 8, body: 'Up and down belong to the buildings. Your feet still know the way.' },
  { id: 'sanctuary', title: 'The Hidden Sanctuary', position: [0, 1, -80], radius: 6, body: 'Nothing here asks you to become someone else.' },
];
// All walking surfaces share the same elevation; only unreachable architecture defies gravity.
export const TERRACES: { position: V3; size: V3 }[] = [
  { position: [0, -0.4, 7], size: [16, 0.8, 18] },
  { position: [0, -0.4, -15], size: [18, 0.8, 18] },
  { position: [22, -0.4, -30], size: [20, 0.8, 20] },
  { position: [22, -0.4, -58], size: [18, 0.8, 18] },
  { position: [0, -0.4, -80], size: [16, 0.8, 16] },
];
export const PATHS: { position: V3; size: V3; secret?: boolean }[] = [
  { position: [0, -0.4, -4], size: [8, 0.8, 12] },
  { position: [10, -0.4, -20], size: [28, 0.8, 8] },
  { position: [22, -0.4, -44], size: [8, 0.8, 14] },
  { position: [10, -0.4, -63], size: [28, 0.8, 8] },
  { position: [0, -0.4, -70], size: [8, 0.8, 14], secret: true },
];
export function proximity(distance: number, radius = 12) {
  const t = Math.max(0, Math.min(1, 1 - distance / radius));
  return t * t * (3 - 2 * t);
}
export function ease(current: number, target: number, delta: number, rate = 2) {
  return current + (target - current) * (1 - Math.exp(-rate * Math.max(0, Math.min(delta, 0.05))));
}
export function sanctuaryUnlocked(flags: Record<string, boolean>) {
  return Boolean(flags['dream-memory-1'] && flags['dream-memory-2']);
}