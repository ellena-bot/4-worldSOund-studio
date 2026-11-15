import { useEffect, useRef } from "react";
import { BookOpen, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJournal } from "../story";
import { useGameStore } from "../state";
import { touchJump, touchLook, touchMove } from "../touch";
import { REGISTERED_DISCOVERIES, portalsInWorld, getPortal } from "../portals";
import { getWorld } from "@/worlds/registry";

function formatTime(at: number): string {
  return new Date(at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Journal({ worldId, title, onResume }: { worldId: string; title: string; onResume(): void }) {
  const open = useJournal((s) => s.open);
  const entries = useJournal((s) => s.entries);
  const started = useGameStore((s) => s.started);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasLocked = useRef(false);
  const toggle = () => {
    if (useJournal.getState().open) {
      useJournal.getState().setOpen(false);
      if (wasLocked.current) onResume();
      return;
    }
    wasLocked.current = useGameStore.getState().locked;
    touchMove.fwd = touchMove.strafe = touchLook.dx = touchLook.dy = 0;
    touchJump.held = false;
    useGameStore.getState().setLocked(false);
    document.exitPointerLock?.();
    useJournal.getState().setOpen(true);
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.repeat || !useGameStore.getState().started) return;
      if (event.code === "KeyJ" || (event.code === "Escape" && useJournal.getState().open)) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  useEffect(() => { if (open) closeRef.current?.focus(); }, [open]);
  useEffect(() => () => useJournal.getState().setOpen(false), []);
  if (!started) return null;

  const foundInWorld = entries.filter((e) => e.worldId === worldId);
  const foundIds = new Set(foundInWorld.map((e) => e.id));
  const lockedCount =
    REGISTERED_DISCOVERIES.filter((r) => r.worldId === worldId && !foundIds.has(r.id)).length +
    portalsInWorld(worldId).filter((p) => !foundIds.has(p.id)).length;

  return <>
    {!open && <Button variant="outline" size="icon" aria-label="Discovery journal" title="Discovery journal (J)" onClick={toggle} className="absolute left-4 top-4 bg-background/60 backdrop-blur-sm"><BookOpen /></Button>}
    {open && <section role="dialog" aria-modal="true" aria-labelledby="journal-title" className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85dvh] w-full max-w-xl flex-col border border-border bg-background p-6">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div><p className="text-xs uppercase text-muted-foreground">{title}</p><h2 id="journal-title" className="mt-1 text-2xl font-light">Discoveries</h2></div>
          <Button ref={closeRef} variant="ghost" size="icon" aria-label="Close journal" title="Close journal" onClick={toggle}><X /></Button>
        </header>
        <div className="overflow-y-auto py-2" tabIndex={0}>
          {foundInWorld.length === 0 && <p className="py-8 text-sm text-muted-foreground">No discoveries yet.</p>}
          {foundInWorld.map((entry) => <article key={entry.id} className="border-b border-border py-5 last:border-0">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[10px] uppercase text-muted-foreground">{entry.kind}</p>
              {"at" in entry && typeof entry.at === "number" && <time className="text-[10px] text-muted-foreground">{formatTime(entry.at)}</time>}
            </div>
            <h3 className="mt-1 font-medium">{entry.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
            {entry.kind === "portal" && <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Leads to {getWorld(getPortal(entry.id)?.to ?? "")?.title ?? "another world"}</p>}
          </article>)}
          {lockedCount > 0 && <div className="flex items-center gap-2 border-t border-border py-5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>{lockedCount} {lockedCount === 1 ? "entry remains" : "entries remain"} undiscovered in this world.</span>
          </div>}
        </div>
      </div>
    </section>}
  </>;
}
