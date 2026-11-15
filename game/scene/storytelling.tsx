import { createContext, useContext, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameAudio } from "../GameRuntime";
import { useGameStore } from "../state";
import { insideStoryZone, useJournal, type Discovery } from "../story";
import type { LayerSpec } from "@/audio/types";

export const StoryWorldContext = createContext("");

export function useStoryWorld() {
  return useContext(StoryWorldContext);
}

export function useDiscovery() {
  const worldId = useContext(StoryWorldContext);
  const audio = useGameAudio();
  return (entry: Omit<Discovery, "worldId">, position?: [number, number, number]) => {
    const fresh = useJournal.getState().discover({ ...entry, worldId });
    if (fresh) void audio?.engine.current?.playOneShot({ kind: "noise", filter: "lowpass", frequency: 700, gain: 0.035 }, position, 0.18);
    return fresh;
  };
}

export function StoryZone({ id, position, radius, title, body, sound, children }: {
  id: string; position: [number, number, number]; radius: number;
  title?: string; body?: string; sound?: LayerSpec; children?: ReactNode;
}) {
  const discover = useDiscovery();
  const audio = useGameAudio();
  const inside = useRef(false);
  const nextSound = useRef(0);
  useFrame(({ camera, clock }) => {
    if (!useGameStore.getState().locked) return;
    const near = insideStoryZone(camera.position, position, radius);
    if (near && !inside.current && title) {
      if (discover({ id, title, body: body ?? "", kind: "location" }, position)) useGameStore.getState().showNotice(title, body);
    }
    if (near && sound && clock.elapsedTime >= nextSound.current && audio?.running) {
      nextSound.current = clock.elapsedTime + 24;
      void audio.engine.current?.playOneShot(sound, position, 2.5);
    }
    inside.current = near;
  });
  return <>{children}</>;
}