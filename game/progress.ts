// Centralized progression manager: visited worlds, exploration time, unique
// discoveries, last world + safe positions. Persists through the adapter in
// persistence.ts (localStorage today, cloud later). Discovery ids are unique
// per world — recording the same id twice is a no-op.
import { create } from "zustand";
import { createLocalStorageAdapter, emptySave, type DiscoveryRecord, type PersistenceAdapter, type SaveData, type WorldProgress } from "./persistence";

export type { DiscoveryRecord };

interface ProgressState {
  lastWorld: string | null;
  worlds: Record<string, WorldProgress>;
  discoveries: DiscoveryRecord[];
  markVisited(worldId: string): void;
  /** Record a discovery; returns true only when the id is new for that world. */
  recordDiscovery(entry: Omit<DiscoveryRecord, "at">, at?: number): boolean;
  /** Accumulate exploration time for a world. */
  addTime(worldId: string, seconds: number): void;
  /** Store the last known safe (grounded) position in a world. */
  savePosition(worldId: string, position: [number, number, number]): void;
  resetProgress(): void;
}

function worldEntry(save: SaveData, worldId: string): WorldProgress {
  return save.worlds[worldId] ?? { visited: false, timeSeconds: 0, lastPosition: null };
}

function hasDiscovery(save: SaveData, worldId: string, id: string): boolean {
  return save.discoveries.some((d) => d.worldId === worldId && d.id === id);
}

// Pure reducers, exported for tests.
export function reduceVisit(save: SaveData, worldId: string): SaveData {
  const w = worldEntry(save, worldId);
  if (w.visited && save.lastWorld === worldId) return save;
  return { ...save, lastWorld: worldId, worlds: { ...save.worlds, [worldId]: { ...w, visited: true } } };
}

export function reduceDiscovery(save: SaveData, entry: Omit<DiscoveryRecord, "at">, at: number): SaveData {
  if (hasDiscovery(save, entry.worldId, entry.id)) return save;
  return { ...save, discoveries: [...save.discoveries, { ...entry, at }] };
}

export function reduceTime(save: SaveData, worldId: string, seconds: number): SaveData {
  if (seconds <= 0) return save;
  const w = worldEntry(save, worldId);
  return { ...save, worlds: { ...save.worlds, [worldId]: { ...w, timeSeconds: w.timeSeconds + seconds } } };
}

export function reducePosition(save: SaveData, worldId: string, position: [number, number, number]): SaveData {
  const w = worldEntry(save, worldId);
  return { ...save, worlds: { ...save.worlds, [worldId]: { ...w, lastPosition: position } } };
}

function toState(save: SaveData) {
  return { lastWorld: save.lastWorld, worlds: save.worlds, discoveries: save.discoveries };
}

function createProgressStore(adapter: PersistenceAdapter) {
  const initial = adapter.load() ?? emptySave();
  return create<ProgressState>((set, get) => {
    const commit = (next: SaveData) => {
      adapter.save(next);
      set(toState(next));
    };
    const current = (): SaveData => ({ version: 1, lastWorld: get().lastWorld, worlds: get().worlds, discoveries: get().discoveries });
    return {
      ...toState(initial),
      markVisited: (worldId) => commit(reduceVisit(current(), worldId)),
      recordDiscovery: (entry, at = Date.now()) => {
        const next = reduceDiscovery(current(), entry, at);
        if (next.discoveries === get().discoveries) return false;
        commit(next);
        return true;
      },
      addTime: (worldId, seconds) => commit(reduceTime(current(), worldId, seconds)),
      savePosition: (worldId, position) => commit(reducePosition(current(), worldId, position)),
      resetProgress: () => {
        adapter.clear();
        set(toState(emptySave()));
      },
    };
  });
}

export const useProgress = createProgressStore(createLocalStorageAdapter());
