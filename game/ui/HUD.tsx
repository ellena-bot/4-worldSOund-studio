import { useEffect, useState } from "react";
import { useGameStore } from "../state";

const NOTICE_MS = 6000;

/** Minimal in-game overlay: crosshair, interact prompt, transient world notice. */
export function HUD() {
  const locked = useGameStore((s) => s.locked);
  const touchMode = useGameStore((s) => s.touchMode);
  const prompt = useGameStore((s) => s.prompt);
  const notice = useGameStore((s) => s.notice);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notice) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [notice]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {notice && visible && (
        <div key={notice.id} className="absolute left-1/2 top-[18%] w-[min(90vw,34rem)] -translate-x-1/2 animate-in fade-in border-y border-border bg-background/75 px-6 py-4 text-center backdrop-blur-sm duration-700">
          <p className="text-xs font-semibold uppercase tracking-[0.35em]">{notice.title}</p>
          {notice.body && <p className="mt-2 text-sm text-muted-foreground">{notice.body}</p>}
        </div>
      )}
      {locked && (
        <>
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70" />
          {prompt && !touchMode && (
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 rounded-md border border-border bg-background/70 px-4 py-2 text-sm tracking-widest backdrop-blur-sm">
              Press <kbd className="mx-1 rounded border border-border px-1.5 py-0.5 text-xs font-semibold">E</kbd> to{" "}
              {prompt.charAt(0).toLowerCase() + prompt.slice(1)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
