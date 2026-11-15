// E-key interactables. Worlds register objects via useInteractable or the
// reusable components in scene/interactables.tsx; InteractionSystem scans the
// registry every frame. Module-level on purpose: registration happens in
// effects and scanning per frame — neither may re-render.
export interface Interactable {
  id: string;
  /** World position the player must look at. */
  position: [number, number, number];
  /** Max distance from the camera. */
  radius: number;
  /** Lowercase verb phrase, e.g. "open the gate" — the HUD renders "Press E to …". */
  prompt: string;
  onInteract: () => void;
  /** Inactive items are skipped (e.g. a used-up terminal). Default true. */
  enabled?: boolean;
}

const registry = new Map<string, Interactable>();

export function registerInteractable(it: Interactable): () => void {
  registry.set(it.id, it);
  return () => {
    registry.delete(it.id);
  };
}

export function allInteractables(): Iterable<Interactable> {
  return registry.values();
}

/** Min dot(objectDir, cameraForward) to count as "looked at". */
export const FACING_DOT = 0.4;

/** Nearest enabled item in range and in view, or null. */
export function pickTarget(
  items: Iterable<Interactable>,
  origin: { x: number; y: number; z: number },
  forward: { x: number; y: number; z: number },
): Interactable | null {
  let best: Interactable | null = null;
  let bestD = Infinity;
  for (const it of items) {
    if (it.enabled === false) continue;
    const dx = it.position[0] - origin.x;
    const dy = it.position[1] - origin.y;
    const dz = it.position[2] - origin.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > it.radius || d >= bestD || d === 0) continue;
    if ((dx * forward.x + dy * forward.y + dz * forward.z) / d < FACING_DOT) continue;
    best = it;
    bestD = d;
  }
  return best;
}
