// Persistence abstraction for player progression. Today the only adapter is
// localStorage (single-player, this device). A cloud adapter can implement the
// same interface later without touching progress.ts — do not claim cloud sync
// until one is connected and tested.

export interface WorldProgress {
  visited: boolean;
  /** Seconds spent in this world, accumulated across sessions. */
  timeSeconds: number;
  /** Last known safe position (grounded), restored on re-entry. */
  lastPosition: [number, number, number] | null;
}

export interface SaveData {
  version: 1;
  lastWorld: string | null;
  worlds: Record<string, WorldProgress>;
  discoveries: DiscoveryRecord[];
}

export interface DiscoveryRecord {
  id: string;
  worldId: string;
  title: string;
  body: string;
  kind: "clue" | "location" | "event" | "portal";
  /** Epoch ms when first discovered. */
  at: number;
}

export interface PersistenceAdapter {
  load(): SaveData | null;
  save(data: SaveData): void;
  clear(): void;
}

export function emptySave(): SaveData {
  return { version: 1, lastWorld: null, worlds: {}, discoveries: [] };
}

const KEY = "immersive-worlds:progress:v1";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Parse stored JSON defensively; anything unexpected yields null (fresh start). */
export function parseSave(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data["version"] !== 1) return null;
    if (!Array.isArray(data["discoveries"]) || !isRecord(data["worlds"])) return null;
    return data as unknown as SaveData;
  } catch {
    return null;
  }
}

export function createLocalStorageAdapter(storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">): PersistenceAdapter {
  const store = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  return {
    load: () => parseSave(store?.getItem(KEY) ?? null),
    save: (data) => {
      try {
        store?.setItem(KEY, JSON.stringify(data));
      } catch {
        // Quota or privacy mode: progression stays session-only.
      }
    },
    clear: () => store?.removeItem(KEY),
  };
}
