export type V3 = [number, number, number];
export const FACILITY = [
  { id: 'arrival', title: 'Arrival Station', start: 18, end: -2, width: 16 },
  { id: 'tunnel', title: 'The Glass Tunnel', start: -2, end: -46, width: 8.4 },
  { id: 'laboratory', title: 'Research Laboratory', start: -46, end: -68, width: 20 },
  { id: 'observation', title: 'Abyss Observation Deck', start: -68, end: -96, width: 26 },
  { id: 'restricted', title: 'Restricted Deep-Sea Sector', start: -96, end: -116, width: 10 },
] as const;
export const WHALE_DELAY = 4;
export const WHALE_PASS = 42;
export const WHALE_INTERVAL = 150;
export function whalePhase(seconds: number) {
  const elapsed = seconds - WHALE_DELAY;
  const phase = elapsed < 0 ? -1 : elapsed % WHALE_INTERVAL;
  return { visible: phase >= 0 && phase < WHALE_PASS, progress: Math.max(0, Math.min(1, phase / WHALE_PASS)) };
}
export function sectorUnlocked(flags: Record<string, boolean>) { return flags['abyss-clearance'] === true; }
export function whalePosition(progress: number): V3 { return [33, 7 + Math.sin(progress * Math.PI * 2) * 1.5, -135 + progress * 106]; }
export function interiorAt(x: number, z: number) { return FACILITY.some(s => z <= s.start && z >= s.end && Math.abs(x) < s.width / 2); }