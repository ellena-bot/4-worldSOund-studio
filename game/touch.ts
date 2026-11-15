// Mutable touch-input state shared between the DOM touch controls and the
// per-frame player sim. Lives outside React on purpose: it changes at touch
// frequency and must never re-render.

/** Virtual joystick output, same units as keyboardInput (-1..1). */
export const touchMove = { fwd: 0, strafe: 0 };

/** Held state of the on-screen jump button. */
export const touchJump = { held: false };

/** Accumulated look-drag pixels; the Player consumes and zeroes each frame. */
export const touchLook = { dx: 0, dy: 0 };

/**
 * True on phones/tablets. Several signals because embedded webviews (e.g. an
 * app's in-app preview) can misreport `pointer: coarse`.
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  const mq = (q: string) => window.matchMedia?.(q).matches ?? false;
  return (
    mq("(pointer: coarse)") ||
    mq("(any-pointer: coarse)") ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    "ontouchstart" in window
  );
}
