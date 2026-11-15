// On-screen controls for coarse-pointer devices: left-half virtual joystick
// (move), right-half drag (look), jump and interact buttons. Writes only to
// the mutable touch state module — no React state changes per touch event.
import { useEffect, useRef } from "react";
import { touchJump, touchLook, touchMove } from "../touch";
import { useGameStore } from "../state";

const STICK_RADIUS = 48; // px from joystick origin to full deflection

interface StickTrack {
  id: number;
  originX: number;
  originY: number;
}

export function TouchControls() {
  const prompt = useGameStore((s) => s.prompt);
  const stick = useRef<StickTrack | null>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const setThumb = (dx: number, dy: number, visible: boolean) => {
    if (baseRef.current) baseRef.current.style.opacity = visible ? "1" : "0";
    if (thumbRef.current) thumbRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    for (const t of Array.from(e.changedTouches)) {
      const x = t.clientX - rect.left;
      if (x < rect.width * 0.45 && stick.current === null) {
        stick.current = { id: t.identifier, originX: t.clientX, originY: t.clientY };
        if (baseRef.current) {
          baseRef.current.style.left = `${t.clientX - rect.left}px`;
          baseRef.current.style.top = `${t.clientY - rect.top}px`;
        }
        setThumb(0, 0, true);
      } else if (lookId.current === null) {
        lookId.current = t.identifier;
        lookLast.current = { x: t.clientX, y: t.clientY };
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (const t of Array.from(e.changedTouches)) {
      if (stick.current && t.identifier === stick.current.id) {
        let dx = t.clientX - stick.current.originX;
        let dy = t.clientY - stick.current.originY;
        const len = Math.hypot(dx, dy);
        if (len > STICK_RADIUS) {
          dx = (dx / len) * STICK_RADIUS;
          dy = (dy / len) * STICK_RADIUS;
        }
        touchMove.strafe = dx / STICK_RADIUS;
        touchMove.fwd = -dy / STICK_RADIUS;
        setThumb(dx, dy, true);
      } else if (t.identifier === lookId.current) {
        touchLook.dx += t.clientX - lookLast.current.x;
        touchLook.dy += t.clientY - lookLast.current.y;
        lookLast.current = { x: t.clientX, y: t.clientY };
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (const t of Array.from(e.changedTouches)) {
      if (stick.current && t.identifier === stick.current.id) {
        stick.current = null;
        touchMove.fwd = 0;
        touchMove.strafe = 0;
        setThumb(0, 0, false);
      }
      if (t.identifier === lookId.current) lookId.current = null;
    }
  };

  // Mouse fallback (desktop browsers where pointer lock is blocked, e.g. an
  // embedded preview): click-and-drag anywhere to look; Esc pauses.
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    let lastX = e.clientX;
    let lastY = e.clientY;
    const move = (ev: MouseEvent) => {
      touchLook.dx += ev.clientX - lastX;
      touchLook.dy += ev.clientY - lastY;
      lastX = ev.clientX;
      lastY = ev.clientY;
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") useGameStore.getState().setLocked(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const interact = () => {
    // InteractionSystem listens for KeyE; a synthetic event keeps one code path.
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
  };

  return (
    <div
      className="absolute inset-0 touch-none select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onMouseDown={onMouseDown}
      style={{ cursor: "grab" }}
    >
      {/* Floating joystick: appears where the left thumb lands. */}
      <div
        ref={baseRef}
        className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/30 opacity-0 transition-opacity"
      >
        <div
          ref={thumbRef}
          className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/40"
          style={{ transform: "translate(0px, 0px)" }}
        />
      </div>

      <button
        aria-label="Pause"
        onTouchStart={(e) => e.stopPropagation()}
        onClick={() => {
          touchMove.fwd = 0;
          touchMove.strafe = 0;
          touchJump.held = false;
          useGameStore.getState().setLocked(false);
        }}
        className="absolute right-4 top-4 rounded-md border border-border bg-background/60 px-4 py-2 text-xs uppercase tracking-widest backdrop-blur-sm"
      >
        Pause
      </button>

      <div className="absolute bottom-8 right-6 flex flex-col items-end gap-3">
        {prompt && (
          <button
            aria-label={prompt}
            onTouchStart={(e) => {
              e.stopPropagation();
              interact();
            }}
            className="rounded-md border border-border bg-background/70 px-5 py-3 text-xs uppercase tracking-widest backdrop-blur-sm"
          >
            {prompt}
          </button>
        )}
        <button
          aria-label="Jump"
          onTouchStart={(e) => {
            e.stopPropagation();
            touchJump.held = true;
          }}
          onTouchEnd={() => {
            touchJump.held = false;
          }}
          className="h-16 w-16 rounded-full border border-foreground/30 bg-background/50 text-xs uppercase tracking-widest backdrop-blur-sm"
        >
          Jump
        </button>
      </div>
    </div>
  );
}
