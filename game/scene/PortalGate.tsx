// PortalGate: renders one hidden portal from the registry. A dark frame with a
// breathing glow — no markers, no waypoints. E activates it (never proximity),
// which starts the cinematic transition in the game store. Gated portals stay
// invisible until their condition flag is set.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { PortalDef } from "../portals";
import { useGameStore } from "../state";
import { useDiscovery } from "./storytelling";
import { useGameAudio } from "../GameRuntime";
import { useInteractable, useHighlighted } from "./interactables";

export function PortalGate({ def }: { def: PortalDef }) {
  const size = def.size ?? [1.9, 3, 0.3];
  const flags = useGameStore((s) => s.flags);
  const transitioning = useGameStore((s) => s.transition !== null);
  const highlighted = useHighlighted(def.id);
  const discover = useDiscovery();
  const audio = useGameAudio();
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);

  useInteractable({
    id: def.id,
    position: def.position,
    radius: 2.8,
    prompt: def.prompt,
    enabled: !transitioning,
    onInteract: () => {
      const s = useGameStore.getState();
      if (s.transition) return; // never double-activate
      discover({ id: def.id, title: def.title, body: def.body, kind: "portal" }, def.position);
      void audio?.engine.current?.playOneShot({ kind: "drone", notes: [110, 165, 220], type: "sine", gain: 0.16 }, def.position, 2.2);
      s.startTransition(def.id);
    },
  });

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const breath = 0.5 + Math.sin(t * 1.4) * 0.25;
    if (glow.current) glow.current.opacity = highlighted ? 0.75 + Math.sin(t * 5) * 0.15 : breath * 0.4;
    if (ring.current) {
      ring.current.rotation.z = t * 0.3;
      const target = highlighted ? 1.12 : 1;
      const c = ring.current.scale.x;
      const next = c + (target - c) * Math.min(1, Math.min(dt, 0.05) * 6);
      ring.current.scale.setScalar(next);
    }
  });

  if (def.requiresFlag && !flags[def.requiresFlag]) return null;

  return (
    <RigidBody type="fixed" colliders={false} position={def.position}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
      {/* dark stone frame */}
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={def.color} roughness={0.55} metalness={0.35} />
      </mesh>
      {/* recessed shimmer on both faces */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, 0, (size[2] / 2 + 0.012) * side]}>
          <planeGeometry args={[size[0] * 0.72, size[1] * 0.82]} />
          <meshBasicMaterial ref={side === 1 ? glow : null} color={def.accent} transparent opacity={0.3} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh ref={ring} position={[0, size[1] / 2 + 0.35, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.22, 0.02, 8, 32]} />
        <meshBasicMaterial color={def.accent} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.4, 0]} color={def.accent} intensity={highlighted ? 9 : 4} distance={6} decay={2} />
    </RigidBody>
  );
}
