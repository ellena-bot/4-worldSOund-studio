// Scans the interactable registry each frame: publishes the looked-at object's
// prompt + id to the HUD store and fires its onInteract on E. Objects register
// themselves via useInteractable / the components in interactables.tsx.
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { allInteractables, pickTarget, type Interactable } from "../interact";
import { useGameStore } from "../state";

export function InteractionSystem() {
  const current = useRef<Interactable | null>(null);
  const fwd = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    camera.getWorldDirection(fwd.current);
    const best = pickTarget(allInteractables(), camera.position, fwd.current);
    current.current = best;
    useGameStore.getState().setInteraction(best?.id ?? null, best?.prompt ?? null);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // locked covers both desktop pointer lock and touch mode (no pointer lock there).
      if (e.code === "KeyE" && useGameStore.getState().locked) current.current?.onInteract();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
