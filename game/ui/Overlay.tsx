// Enter screen and pause menu (pointer lock released). Pause doubles as the
// audio mixer so the player can tune the world's sound in place.
import { Link } from "@tanstack/react-router";
import type { MixState } from "@/audio/types";
import { BUSES } from "@/audio/types";
import { setBus, setMaster } from "@/audio/mix";
import { isTouchDevice } from "../touch";

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-4 text-sm">
      <span className="w-20 text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        aria-label={label}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary"
      />
      <span className="w-8 text-right text-xs tabular-nums">{Math.round(value * 100)}</span>
    </label>
  );
}

interface OverlayProps {
  started: boolean;
  title: string;
  onEnter: () => void;
  mix: MixState;
  setMix: (m: MixState) => void;
}

export function Overlay({ started, title, onEnter, mix, setMix }: OverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-8 px-8 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
            {started ? "Paused" : "Now entering"}
          </p>
          <h1 className="mt-3 text-3xl font-extralight tracking-[0.3em]">{title}</h1>
        </div>
        <button
          onClick={onEnter}
          className="rounded-md bg-primary px-8 py-3 text-sm uppercase tracking-widest text-primary-foreground transition hover:opacity-90"
        >
          {started ? "Resume" : "Click to enter"}
        </button>
        {!started && isTouchDevice() && (
          <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground">
            Left thumb: move · Right thumb: look · On-screen buttons: jump and interact
          </p>
        )}
        {!started && !isTouchDevice() && (
          <dl className="mx-auto grid max-w-xs grid-cols-2 gap-x-8 gap-y-1 text-left text-xs text-muted-foreground">
            <dt className="font-semibold text-foreground">W A S D</dt>
            <dd>Move</dd>
            <dt className="font-semibold text-foreground">Mouse</dt>
            <dd>Look</dd>
            <dt className="font-semibold text-foreground">Shift</dt>
            <dd>Run</dd>
            <dt className="font-semibold text-foreground">Space</dt>
            <dd>Jump</dd>
            <dt className="font-semibold text-foreground">E</dt>
            <dd>Interact</dd>
            <dt className="font-semibold text-foreground">Esc</dt>
            <dd>Pause</dd>
          </dl>
        )}
        {started && (
          <section className="space-y-3 text-left">
            <h2 className="text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Sound</h2>
            <Slider label="master" value={mix.master} onChange={(v) => setMix(setMaster(mix, v))} />
            {BUSES.map((b) => (
              <Slider key={b} label={b} value={mix.buses[b]} onChange={(v) => setMix(setBus(mix, b, v))} />
            ))}
          </section>
        )}
        <div>
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground underline-offset-4 hover:underline">
            Leave world
          </Link>
        </div>
      </div>
    </div>
  );
}
