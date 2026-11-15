// UI-facing game state only. Per-frame sim state (positions, velocities)
// lives in refs inside the scene — never here.
import { create } from "zustand";

interface GameState {
  /** The player is in control (pointer lock on desktop, or touch mode). */
  locked: boolean;
  /** Control via on-screen touch controls instead of mouse pointer lock. */
  touchMode: boolean;
  /** The player entered at least once (drives enter vs pause overlay). */
  started: boolean;
  /** Current interact prompt text, e.g. "repair the streetlight". */
  prompt: string | null;
  /** Id of the interactable the player is looking at (drives highlighting). */
  activeId: string | null;
  /** World-scriptable flags, e.g. "streetlight-fixed". */
  flags: Record<string, boolean>;
  /** Transient centre-screen notification set by world scripts. */
  notice: { title: string; body?: string | undefined; id: number } | null;
  /** Active portal transition: fade out, load destination, fade in. */
  transition: { portalId: string; phase: "out" | "in" } | null;
  startTransition(portalId: string): void;
  setTransitionPhase(phase: "out" | "in"): void;
  clearTransition(): void;
  showNotice(title: string, body?: string): void;
  setLocked(v: boolean): void;
  setTouchMode(v: boolean): void;
  markStarted(): void;
  setInteraction(id: string | null, prompt: string | null): void;
  setFlag(id: string, v: boolean): void;
  reset(): void;
}

export const useGameStore = create<GameState>((set, get) => ({
  locked: false,
  touchMode: false,
  started: false,
  prompt: null,
  activeId: null,
  flags: {},
  notice: null,
  transition: null,
  startTransition: (portalId) => {
    if (get().transition) return;
    set({ transition: { portalId, phase: "out" }, locked: false, prompt: null, activeId: null });
    document.exitPointerLock?.();
  },
  setTransitionPhase: (phase) => {
    const t = get().transition;
    if (t) set({ transition: { ...t, phase } });
  },
  clearTransition: () => set({ transition: null }),
  showNotice: (title, body) => set({ notice: { title, body, id: Date.now() } }),
  setLocked: (locked) => set({ locked }),
  setTouchMode: (touchMode) => set({ touchMode }),
  markStarted: () => set({ started: true }),
  setInteraction: (activeId, prompt) => {
    const s = get();
    if (s.activeId !== activeId || s.prompt !== prompt) set({ activeId, prompt });
  },
  setFlag: (id, v) => set((s) => ({ flags: { ...s.flags, [id]: v } })),
  reset: () => set({ locked: false, touchMode: false, started: false, prompt: null, activeId: null, flags: {}, notice: null, transition: null }),
}));
