// Feeds the camera pose to the audio engine's listener each frame.
import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AudioEngine } from "@/audio/engine";

export function AudioBridge({ engine }: { engine: RefObject<AudioEngine | null> }) {
  const fwd = useRef(new THREE.Vector3());
  useFrame(({ camera }) => {
    const e = engine.current;
    if (!e) return;
    const f = camera.getWorldDirection(fwd.current);
    e.setListener([camera.position.x, camera.position.y, camera.position.z], [f.x, f.y, f.z]);
  });
  return null;
}
