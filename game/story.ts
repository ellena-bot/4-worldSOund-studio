import { create } from "zustand";
import { useProgress } from "./progress";

export interface Discovery {
  id: string;
  worldId: string;
  title: string;
  body: string;
  kind: "clue" | "location" | "event" | "portal";
  /** Epoch ms when first discovered (set by the progression store). */
  at?: number;
}

export function appendDiscovery(entries: Discovery[], entry: Discovery): Discovery[] {
  return entries.some((e) => e.id === entry.id && e.worldId === entry.worldId) ? entries : [...entries, entry];
}

export function insideStoryZone(position: { x: number; y: number; z: number }, center: [number, number, number], radius: number): boolean {
  return Math.hypot(position.x - center[0], position.y - center[1], position.z - center[2]) <= radius;
}

// Session view over the persisted progression store: entries mirror the saved
// discoveries so the journal survives refresh, while `open` stays UI-only.
export const useJournal = create<{
  entries: Discovery[];
  open: boolean;
  setOpen(open: boolean): void;
  discover(entry: Discovery): boolean;
}>((set, get) => ({
  entries: useProgress.getState().discoveries,
  open: false,
  setOpen: (open) => set({ open }),
  discover: (entry) => {
    const previous = get().entries;
    const entries = appendDiscovery(previous, entry);
    if (entries === previous) return false;
    set({ entries });
    useProgress.getState().recordDiscovery(entry);
    return true;
  },
}));

// Keep the session list in sync when progression is restored or reset.
useProgress.subscribe((s) => {
  if (useJournal.getState().entries !== s.discoveries) useJournal.setState({ entries: s.discoveries });
});
