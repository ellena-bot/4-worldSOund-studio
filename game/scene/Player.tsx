// First-person controller: Rapier dynamic capsule + pointer-lock mouse look.
// Movement math lives in sim/movement.ts; this component only applies it.
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";
import {
  AIR_ACCEL,
  applyLook,
  approachVelocity,
  EYE_OFFSET,
  GROUND_ACCEL,
  JUMP_VELOCITY,
  keyboardInput,
  targetVelocity,
} from "../sim/movement";
import { touchJump, touchLook, touchMove } from "../touch";
import { useGameStore } from "../state";
import { useJournal } from "../story";
import { useProgress } from "../progress";
import { useStoryWorld } from "./storytelling";

export const SPAWN: [number, number, number] = [0, 1.2, 10];

/** Feet-to-center + margin: ray hit below this means grounded. */
const GROUND_RAY_LENGTH = 1.1;

interface PlayerProps {
  spawn?: [number, number, number] | undefined;
  spawnYaw?: number | undefined;
}

export function Player({ spawn = SPAWN, spawnYaw = 0 }: PlayerProps) {
  const body = useRef<RapierRigidBody>(null);
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const keys = useRef<Set<string>>(new Set());
  const yaw = useRef(spawnYaw);
  const pitch = useRef(0);
  const ray = useRef<InstanceType<typeof rapier.Ray> | null>(null);
  const worldId = useStoryWorld();
  const lastSaved = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      keys.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const look = (e: MouseEvent) => {
      if (!document.pointerLockElement || !useGameStore.getState().locked) return;
      const r = applyLook(yaw.current, pitch.current, e.movementX, e.movementY);
      yaw.current = r.yaw;
      pitch.current = r.pitch;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", look);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", look);
    };
  }, []);

  // Dev-only hooks for scripted checks: teleport/look/position/flags.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __game?: unknown };
    w.__game = {
      teleport: (x: number, y: number, z: number) => {
        const b = body.current;
        if (!b) return;
        b.setTranslation({ x, y, z }, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      },
      look: (newYaw: number, newPitch = 0) => {
        yaw.current = newYaw;
        pitch.current = newPitch;
      },
      position: () => {
        const t = body.current?.translation();
        return t ? [t.x, t.y, t.z] : null;
      },
      flags: () => useGameStore.getState().flags,
      discoveries: () => useJournal.getState().entries,
    };
    return () => {
      delete w.__game;
    };
  }, []);

  useFrame((_, delta) => {
    const b = body.current;
    if (!b) return;
    const dt = Math.min(delta, 0.05);
    // Merge keyboard and virtual-joystick input; consume touch look drags.
    const kb = keyboardInput(keys.current);
    if (!useGameStore.getState().locked) {
      kb.fwd = 0;
      kb.strafe = 0;
      kb.jump = false;
      touchMove.fwd = touchMove.strafe = 0;
      touchJump.held = false;
    }
    const input = { fwd: kb.fwd + touchMove.fwd, strafe: kb.strafe + touchMove.strafe };
    const jump = kb.jump || touchJump.held;
    if (touchLook.dx !== 0 || touchLook.dy !== 0) {
      const r = applyLook(yaw.current, pitch.current, touchLook.dx, touchLook.dy);
      yaw.current = r.yaw;
      pitch.current = r.pitch;
      touchLook.dx = 0;
      touchLook.dy = 0;
    }
    const target = targetVelocity(input, yaw.current, kb.running);
    const t = b.translation();
    if (!ray.current) ray.current = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
    ray.current.origin = { x: t.x, y: t.y, z: t.z };
    const grounded = world.castRay(ray.current, GROUND_RAY_LENGTH, true, undefined, undefined, undefined, b) !== null;
    // Smooth accel/decel: full control on the ground, momentum-keeping in air.
    const lv = b.linvel();
    const h = approachVelocity({ x: lv.x, z: lv.z }, target, grounded ? GROUND_ACCEL : AIR_ACCEL, dt);
    const vy = jump && grounded ? JUMP_VELOCITY : lv.y;
    b.setLinvel({ x: h.x, y: vy, z: h.z }, true);
    camera.position.set(t.x, t.y + EYE_OFFSET, t.z);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    // Autosave the last grounded position (safe spot) a few times a minute.
    if (grounded && clockTime() - lastSaved.current > 10) {
      lastSaved.current = clockTime();
      useProgress.getState().savePosition(worldId, [t.x, t.y, t.z]);
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={spawn}
      enabledRotations={[false, false, false]}
      ccd
      friction={0.1}
    >
      <CapsuleCollider args={[0.55, 0.35]} />
    </RigidBody>
  );
}

function clockTime(): number {
  return performance.now() / 1000;
}
