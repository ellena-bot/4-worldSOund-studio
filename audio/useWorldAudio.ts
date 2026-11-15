// React binding. Holds the mix in state (UI only); the engine lives in a ref.
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine } from "./engine";
import { defaultMix, loadMix, saveMix } from "./mix";
import type { MixState } from "./types";

export function useWorldAudio(worldId: string) {
  const engine = useRef<AudioEngine | null>(null);
  const [mix, setMixState] = useState<MixState>(defaultMix);
  const [running, setRunning] = useState(false);

  useEffect(() => { setMixState(loadMix(window.localStorage)); }, []);
  useEffect(() => () => { engine.current?.dispose(); engine.current = null; }, []);

  const setMix = useCallback((m: MixState) => {
    setMixState(m);
    saveMix(window.localStorage, m);
    engine.current?.applyMix(m);
  }, []);

  /** Must be called from a user gesture (browser autoplay rules). */
  const start = useCallback(async () => {
    if (!engine.current) engine.current = new AudioEngine(mix);
    await engine.current.resume();
    engine.current.applyMix(mix);
    await engine.current.loadWorld(worldId);
    setRunning(true);
  }, [mix, worldId]);

  const stop = useCallback(async () => { await engine.current?.unloadWorld(); setRunning(false); }, []);

  return { engine, mix, setMix, start, stop, running };
}
