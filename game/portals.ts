// Centralized portal registry: every hidden dimensional portal has a unique id,
// a host world, a destination world and a spawn point. Portal definitions are
// data; worlds render them with <PortalGate /> and nothing else needs wiring.
import { getWorld } from "@/worlds/registry";

export type V3 = [number, number, number];

export interface PortalDef {
  id: string;
  worldId: string;
  to: string;
  /** Interaction point (where the prompt is picked up). */
  position: V3;
  prompt: string;
  title: string;
  body: string;
  /** Panel colour / glow accent. */
  color: string;
  accent: string;
  /** Where the player appears in the destination world. */
  spawn: V3;
  /** Facing direction at the destination (radians, 0 = -Z). */
  spawnYaw?: number;
  /** Portal only appears once this game flag is set. */
  requiresFlag?: string;
  /** Panel size [w, h, d]. */
  size?: V3;
}

export const PORTALS: PortalDef[] = [
  {
    id: "ws-portal-dream",
    worldId: "white-silence",
    to: "subconscious",
    position: [-27.4, 1.6, -11.2],
    prompt: "step through the impossible doorway",
    title: "A doorway that was never built",
    body: "The door is warm. Beyond its frame the snow stops mid-air, and a pale light breathes like something asleep.",
    color: "#d9d4c8",
    accent: "#b9a7e8",
    spawn: [0, 1.2, 6],
    requiresFlag: "quiet-room-door",
  },
  {
    id: "rev-portal-abyss",
    worldId: "the-revolution",
    to: "abyss",
    position: [-17, -2.5, -30],
    prompt: "activate the drowned relay",
    title: "Cell 7's last experiment",
    body: "A transport frame the Ministry never found. Its coordinates resolve to a station 2,840 metres below the sea.",
    color: "#1d2733",
    accent: "#4fd8c8",
    spawn: [0, 1.2, 8],
  },
  {
    id: "dream-portal-snow",
    worldId: "subconscious",
    to: "white-silence",
    position: [0, 2, -84],
    prompt: "step into the drifting door",
    title: "A door that remembers winter",
    body: "It appears only here, in the still point. Through it: falling snow, and a streetlight that never went out.",
    color: "#e8e6f2",
    accent: "#ffd9a3",
    spawn: [0, 1.2, 10],
  },
  {
    id: "abyss-portal-rev",
    worldId: "abyss",
    to: "the-revolution",
    position: [-2, 1.6, -113],
    prompt: "open the basalt doorway",
    title: "The doorway in the photograph",
    body: "The stone from the photograph stands here, dry on both sides now. It opens onto a rooftop above a watched city.",
    color: "#10161d",
    accent: "#e07a4f",
    spawn: [0, 1.2, 10],
    requiresFlag: "abyss-power",
  },
];

export function getPortal(id: string): PortalDef | undefined {
  return PORTALS.find((p) => p.id === id);
}

export function portalsInWorld(worldId: string): PortalDef[] {
  return PORTALS.filter((p) => p.worldId === worldId);
}

/** Distinct discovery kinds registered for a world, including its portals. */
export function discoveryTotals(worldId: string): Record<"clue" | "location" | "event" | "portal", number> {
  const totals = { clue: 0, location: 0, event: 0, portal: portalsInWorld(worldId).length };
  for (const r of REGISTERED_DISCOVERIES) {
    if (r.worldId === worldId) totals[r.kind] += 1;
  }
  return totals;
}

export interface RegisteredDiscovery {
  id: string;
  worldId: string;
  kind: "clue" | "location" | "event" | "portal";
}

// Every discovery id a world can produce. Journal locked entries and menu
// completion percentages are computed from this list — never invented numbers.
export const REGISTERED_DISCOVERIES: RegisteredDiscovery[] = [
  // White Silence
  { id: "streetlight-fixed", worldId: "white-silence", kind: "event" },
  { id: "empty-swing", worldId: "white-silence", kind: "clue" },
  { id: "playground", worldId: "white-silence", kind: "location" },
  { id: "academy-roster", worldId: "white-silence", kind: "clue" },
  { id: "academy", worldId: "white-silence", kind: "location" },
  { id: "room-letter", worldId: "white-silence", kind: "clue" },
  { id: "family-photo", worldId: "white-silence", kind: "clue" },
  { id: "caretaker-room", worldId: "white-silence", kind: "location" },
  { id: "bus-timetable", worldId: "white-silence", kind: "clue" },
  { id: "bus-pa", worldId: "white-silence", kind: "location" },
  { id: "snow-tracks", worldId: "white-silence", kind: "clue" },
  // The Revolution
  { id: "surveillance-down", worldId: "the-revolution", kind: "event" },
  { id: "resistance-mark", worldId: "the-revolution", kind: "clue" },
  { id: "protest-remnant", worldId: "the-revolution", kind: "clue" },
  { id: "broken-camera", worldId: "the-revolution", kind: "clue" },
  { id: "cell-map", worldId: "the-revolution", kind: "clue" },
  { id: "radio-log", worldId: "the-revolution", kind: "clue" },
  { id: "freedom-message", worldId: "the-revolution", kind: "clue" },
  { id: "resistance-hideout", worldId: "the-revolution", kind: "location" },
  // Subconscious
  { id: "dream-entrance", worldId: "subconscious", kind: "location" },
  { id: "dream-architecture", worldId: "subconscious", kind: "location" },
  { id: "dream-reflection", worldId: "subconscious", kind: "location" },
  { id: "dream-distortion", worldId: "subconscious", kind: "location" },
  { id: "dream-sanctuary", worldId: "subconscious", kind: "location" },
  { id: "dream-memory-1", worldId: "subconscious", kind: "clue" },
  { id: "dream-memory-2", worldId: "subconscious", kind: "clue" },
  { id: "dream-sanctuary-heart", worldId: "subconscious", kind: "clue" },
  // Abyss
  { id: "abyss-arrival", worldId: "abyss", kind: "location" },
  { id: "abyss-tunnel", worldId: "abyss", kind: "location" },
  { id: "abyss-laboratory", worldId: "abyss", kind: "location" },
  { id: "abyss-observation", worldId: "abyss", kind: "location" },
  { id: "abyss-restricted", worldId: "abyss", kind: "location" },
  { id: "abyss-manifest", worldId: "abyss", kind: "clue" },
  { id: "abyss-research-log", worldId: "abyss", kind: "clue" },
  { id: "abyss-specimen", worldId: "abyss", kind: "clue" },
  { id: "abyss-window", worldId: "abyss", kind: "clue" },
  { id: "abyss-listening", worldId: "abyss", kind: "clue" },
  { id: "abyss-emergency-log", worldId: "abyss", kind: "clue" },
  { id: "abyss-unknown-discovery", worldId: "abyss", kind: "clue" },
];

/** Found / total for menu progress. Percent is 0 until something is found. */
export function worldCompletion(worldId: string, found: { worldId: string; id: string }[]): { found: number; total: number; percent: number } {
  const known = new Set(REGISTERED_DISCOVERIES.filter((r) => r.worldId === worldId).map((r) => r.id));
  for (const p of portalsInWorld(worldId)) known.add(p.id);
  let foundCount = 0;
  for (const f of found) if (f.worldId === worldId && known.has(f.id)) foundCount += 1;
  const total = known.size;
  return { found: foundCount, total, percent: total === 0 ? 0 : Math.round((foundCount / total) * 100) };
}

export function portalDestinationName(def: PortalDef): string {
  return getWorld(def.to)?.title ?? def.to;
}
