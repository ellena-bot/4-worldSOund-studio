// Game runtime shell: canvas, physics, player, HUD, pointer-lock overlay,
// world audio, portal transitions. Kept separate from the app UI — a world
// only supplies its scene.
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useNavigate } from "@tanstack/react-router";
import { useWorldAudio } from "@/audio/useWorldAudio";
import { Player } from "./scene/Player";
import { AudioBridge } from "./scene/AudioBridge";
import { HUD } from "./ui/HUD";
import { Overlay } from "./ui/Overlay";
import { TouchControls } from "./ui/TouchControls";
import { isTouchDevice } from "./touch";
import { useGameStore } from "./state";
import { StoryWorldContext } from "./scene/storytelling";
import { Journal } from "./ui/Journal";
import { useJournal } from "./story";
import { useProgress } from "./progress";
import { getPortal, portalDestinationName } from "./portals";

const FADE_MS = 900;

type WorldAudio = ReturnType<typeof useWorldAudio>;

const GameAudioContext = createContext<WorldAudio | null>(null);
export function useGameAudio() {
  return useContext(GameAudioContext);
}

interface GameRuntimeProps {
  worldId: string;
  title: string;
  /** Override spawn (portal arrivals); defaults to the world's own spawn. */
  spawn?: [number, number, number] | undefined;
  spawnYaw?: number | undefined;
  children: ReactNode;
}

/** Full-screen cinematic fade for portal travel: out → navigate → in. */
function PortalTransition() {
  const transition = useGameStore((s) => s.transition);
  const navigate = useNavigate();
  const phase = transition?.phase ?? null;

  useEffect(() => {
    if (!transition || transition.phase !== "out") return;
    const def = getPortal(transition.portalId);
    if (!def) {
      useGameStore.getState().clearTransition();
      return;
    }
    const timer = window.setTimeout(() => {
      void navigate({
        to: "/worlds/$worldId",
        params: { worldId: def.to },
        search: { from: def.id },
      });
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [transition, navigate]);

  // After arrival the new runtime holds phase "in" until the player enters.
  const started = useGameStore((s) => s.started);
  useEffect(() => {
    if (transition?.phase === "in" && started) useGameStore.getState().clearTransition();
  }, [transition, started]);

  if (!transition) return null;
  const def = getPortal(transition.portalId);
  return (
    <div
      className={`absolute inset-0 z-40 flex items-center justify-center bg-black transition-opacity duration-700 ${phase === "out" ? "opacity-100" : started ? "opacity-0" : "opacity-100"}`}
      aria-live="polite"
    >
      {def && (
        <p className="text-xs uppercase tracking-[0.5em] text-neutral-400">
          {phase === "out" ? "The doorway opens" : `Arriving — ${portalDestinationName(def)}`}
        </p>
      )}
    </div>
  );
}

export function GameRuntime({ worldId, title, spawn, spawnYaw, children }: GameRuntimeProps) {
  const audio = useWorldAudio(worldId);
  const containerRef = useRef<HTMLDivElement>(null);
  const locked = useGameStore((s) => s.locked);
  const touchMode = useGameStore((s) => s.touchMode);
  const started = useGameStore((s) => s.started);
  const journalOpen = useJournal((s) => s.open);
  const setLocked = useGameStore((s) => s.setLocked);
  const markStarted = useGameStore((s) => s.markStarted);

  useEffect(() => () => useGameStore.getState().reset(), []);

  // Progression: this world counts as visited; exploration time accumulates.
  useEffect(() => {
    useProgress.getState().markVisited(worldId);
    const timer = window.setInterval(() => {
      if (useGameStore.getState().locked) useProgress.getState().addTime(worldId, 5);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [worldId]);

  useEffect(() => {
    const onChange = () => {
      // Touch mode owns `locked`; pointer-lock events must not override it.
      if (useGameStore.getState().touchMode) return;
      const isLocked = document.pointerLockElement === containerRef.current;
      setLocked(isLocked);
      if (isLocked) markStarted();
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, [setLocked, markStarted]);

  // Enter in touch mode: on-screen controls, no pointer lock.
  const enterTouch = useCallback(() => {
    const s = useGameStore.getState();
    s.setTouchMode(true);
    s.setLocked(true);
    s.markStarted();
  }, []);

  // Click gesture: start audio (autoplay rules) and grab the pointer together.
  // Phones/tablets, and any browser where pointer lock is missing, refused or
  // silently ignored, fall back to touch mode so Enter always enters.
  const enter = useCallback(() => {
    if (!useGameStore.getState().started) void audio.start();
    const el = containerRef.current;
    if (!el || isTouchDevice() || typeof el.requestPointerLock !== "function") {
      enterTouch();
      return;
    }
    let settled = false;
    const fallback = () => {
      if (settled) return;
      settled = true;
      if (document.pointerLockElement !== el) enterTouch();
    };
    document.addEventListener("pointerlockerror", fallback, { once: true });
    try {
      const r = el.requestPointerLock() as unknown;
      if (r && typeof (r as Promise<void>).catch === "function") (r as Promise<void>).catch(fallback);
    } catch {
      fallback();
    }
    window.setTimeout(fallback, 600);
  }, [audio, enterTouch]);

  return (
    <GameAudioContext.Provider value={audio}>
      <StoryWorldContext.Provider value={worldId}>
      <div ref={containerRef} className="dark relative h-[100dvh] w-screen overflow-hidden bg-background text-foreground">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ fov: 70, near: 0.1, far: 220, position: [0, 2, 10] }}
          onCreated={() => containerRef.current?.setAttribute("data-scene-ready", "true")}
        >
          <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
            <Player spawn={spawn} spawnYaw={spawnYaw} />
            {children}
          </Physics>
          <AudioBridge engine={audio.engine} />
        </Canvas>
        <HUD />
        {locked && touchMode && <TouchControls />}
        {!locked && !journalOpen && <Overlay started={started} title={title} onEnter={enter} mix={audio.mix} setMix={audio.setMix} />}
        <Journal worldId={worldId} title={title} onResume={enter} />
        <PortalTransition />
      </div>
      </StoryWorldContext.Provider>
    </GameAudioContext.Provider>
  );
}
