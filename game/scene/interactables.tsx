// Reusable E-key objects. Each component renders its own mesh + collider and
// registers itself in the interaction registry — a world drops one in and
// nothing else needs wiring. RigidBodies carry their own position/rotation
// props (never a transformed parent group) so colliders always line up.
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { registerInteractable, type Interactable } from "../interact";
import { useGameStore } from "../state";
import { useDiscovery } from "./storytelling";

type V3 = [number, number, number];

/** Register an interactable for as long as the calling component is mounted. */
export function useInteractable(item: Interactable) {
  useEffect(() => registerInteractable(item));
}

/** True while the player is looking at this object (drives highlighting). */
export function useHighlighted(id: string): boolean {
  return useGameStore((s) => s.activeId === id);
}

/** Ease a material's emissiveIntensity: bright pulse when highlighted, dim idle otherwise. */
function useEmissiveHighlight(ref: RefObject<THREE.MeshStandardMaterial | null>, highlighted: boolean, base = 0.06, high = 0.7) {
  useFrame((_, delta) => {
    const m = ref.current;
    if (!m) return;
    const target = highlighted ? high + Math.sin(performance.now() / 180) * 0.15 : base;
    m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, Math.min(delta, 0.05) * 8);
  });
}

/* ---------- door: slides aside (or up) with a kinematic collider ---------- */

interface DoorProps {
  id: string;
  /** Centre of the closed panel. */
  position: V3;
  size: V3;
  rotationY?: number;
  color?: string;
  accent?: string;
  /** "side" slides along the panel width; "up" lifts it like a gate. */
  slide?: "side" | "up";
  open: boolean;
  onToggle?: (next: boolean) => void;
  /** When set, E shows this notice instead of moving the door. */
  lockedNotice?: { title: string; body?: string } | undefined;
  promptOpen?: string;
  promptClose?: string;
  radius?: number;
}

export function Door({
  id,
  position,
  size,
  rotationY = 0,
  color = "#3d3a36",
  accent = "#ffd9a3",
  slide = "side",
  open,
  onToggle,
  lockedNotice,
  promptOpen = "open the door",
  promptClose = "close the door",
  radius = 3,
}: DoorProps) {
  const body = useRef<RapierRigidBody>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const highlighted = useHighlighted(id);
  const t = useRef(open ? 1 : 0);
  const slideVec: V3 =
    slide === "up" ? [0, size[1] * 0.94, 0] : [size[0] * 0.96 * Math.cos(rotationY), 0, -size[0] * 0.96 * Math.sin(rotationY)];

  useInteractable({
    id,
    position,
    radius,
    prompt: open ? promptClose : promptOpen,
    onInteract: () => {
      if (lockedNotice) {
        useGameStore.getState().showNotice(lockedNotice.title, lockedNotice.body);
        return;
      }
      onToggle?.(!open);
    },
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current += ((open ? 1 : 0) - t.current) * Math.min(1, dt * 3.5);
    body.current?.setNextKinematicTranslation({
      x: position[0] + slideVec[0] * t.current,
      y: position[1] + slideVec[1] * t.current,
      z: position[2] + slideVec[2] * t.current,
    });
  });
  useEmissiveHighlight(mat, highlighted, 0.06, 0.55);

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial ref={mat} color={color} emissive={accent} emissiveIntensity={0.06} roughness={0.6} metalness={0.4} />
      </mesh>
      {/* glow strip along the panel's top edge */}
      <mesh position={[0, size[1] / 2 - 0.07, size[2] / 2 + 0.01]}>
        <boxGeometry args={[size[0] * 0.9, 0.05, 0.02]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </RigidBody>
  );
}

/* ---------- terminal: console + screen, shows a notice when used ---------- */

interface TerminalProps {
  id: string;
  position: V3;
  rotationY?: number;
  title: string;
  body?: string;
  prompt?: string;
  radius?: number;
  screenColor?: string;
  /** Disable after the first use. */
  once?: boolean;
  onUse?: () => void;
}

export function Terminal({
  id,
  position,
  rotationY = 0,
  title,
  body,
  prompt = "use the terminal",
  radius = 2.4,
  screenColor = "#5be0ff",
  once = false,
  onUse,
}: TerminalProps) {
  const [used, setUsed] = useState(false);
  const highlighted = useHighlighted(id);
  const screen = useRef<THREE.MeshBasicMaterial>(null);
  const tmp = useRef(new THREE.Color());

  useInteractable({
    id,
    position: [position[0], position[1] + 1.2, position[2]],
    radius,
    prompt,
    enabled: !(once && used),
    onInteract: () => {
      setUsed(true);
      onUse?.();
      useGameStore.getState().showNotice(title, body);
    },
  });

  useFrame(() => {
    const m = screen.current;
    if (!m) return;
    m.color.copy(tmp.current.set(once && used ? "#22302a" : screenColor)).multiplyScalar(highlighted ? 1.7 : 1);
  });

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CuboidCollider args={[0.6, 0.55, 0.25]} position={[0, 0.55, 0]} />
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[1.2, 1.1, 0.5]} />
        <meshStandardMaterial color="#24272d" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.25, 0.12]} rotation-x={-0.5}>
        <planeGeometry args={[1, 0.6]} />
        <meshBasicMaterial ref={screen} color={screenColor} toneMapped={false} />
      </mesh>
    </RigidBody>
  );
}

/* ---------- control panel: wall plate with a glowing push button ---------- */

interface ControlPanelProps {
  id: string;
  position: V3;
  rotationY?: number;
  prompt: string;
  radius?: number;
  color?: string;
  disabled?: boolean;
  onPress: () => void;
}

export function ControlPanel({ id, position, rotationY = 0, prompt, radius = 2.2, color = "#ff5a3c", disabled = false, onPress }: ControlPanelProps) {
  const highlighted = useHighlighted(id);
  const btn = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const pressedAt = useRef(-10);

  useInteractable({
    id,
    position,
    radius,
    prompt,
    enabled: !disabled,
    onInteract: () => {
      pressedAt.current = performance.now() / 1000;
      onPress();
    },
  });

  useFrame(() => {
    const since = performance.now() / 1000 - pressedAt.current;
    const dip = since < 0.25 ? Math.sin((since / 0.25) * Math.PI) : 0;
    if (btn.current) btn.current.position.z = 0.07 - dip * 0.035;
    const m = glow.current;
    if (m) m.emissiveIntensity = disabled ? 0.05 : highlighted ? 1.6 + Math.sin(performance.now() / 150) * 0.3 : 0.5;
  });

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CuboidCollider args={[0.35, 0.25, 0.08]} />
      <mesh>
        <boxGeometry args={[0.7, 0.5, 0.12]} />
        <meshStandardMaterial color="#2a2d33" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh ref={btn} position={[0, 0, 0.07]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.09, 0.09, 0.05, 16]} />
        <meshStandardMaterial ref={glow} color="#1c1210" emissive={color} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
    </RigidBody>
  );
}

/* ---------- light switch: wall plate; optionally carries its own lamp ---------- */

interface LightSwitchProps {
  id: string;
  position: V3;
  rotationY?: number;
  on: boolean;
  onToggle: (next: boolean) => void;
  promptOn?: string;
  promptOff?: string;
  /** Render a bulb + point light above the switch (self-contained lamp). */
  lamp?: boolean;
  lampColor?: string;
  radius?: number;
}

export function LightSwitch({
  id,
  position,
  rotationY = 0,
  on,
  onToggle,
  promptOn = "switch the light on",
  promptOff = "switch the light off",
  lamp = false,
  lampColor = "#ffd9a3",
  radius = 2,
}: LightSwitchProps) {
  const highlighted = useHighlighted(id);
  const led = useRef<THREE.MeshBasicMaterial>(null);

  useInteractable({
    id,
    position,
    radius,
    prompt: on ? promptOff : promptOn,
    onInteract: () => onToggle(!on),
  });

  useFrame(() => {
    if (led.current) led.current.color.set(highlighted ? "#ffffff" : on ? "#7ddf9a" : "#3a4a3f");
  });

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh>
        <boxGeometry args={[0.16, 0.24, 0.04]} />
        <meshStandardMaterial color="#c9c9c2" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0.03]}>
        <boxGeometry args={[0.05, 0.09, 0.02]} />
        <meshStandardMaterial color="#8a8a84" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.07, 0.025]}>
        <circleGeometry args={[0.014, 8]} />
        <meshBasicMaterial ref={led} color="#3a4a3f" toneMapped={false} />
      </mesh>
      {lamp && (
        <>
          <mesh position={[0, 1.1, 0.35]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshBasicMaterial color={on ? lampColor : "#2a2a26"} toneMapped={false} />
          </mesh>
          {on && <pointLight position={[0, 1.1, 0.6]} color={lampColor} intensity={10} distance={9} decay={2} />}
        </>
      )}
    </group>
  );
}

/* ---------- inspectable: an environmental clue with a story notice ---------- */

interface InspectableProps {
  id: string;
  position: V3;
  title: string;
  body?: string;
  prompt?: string;
  radius?: number;
  /** Soft ground ring so the clue is discoverable (ground-level objects only). */
  marker?: boolean;
  children?: ReactNode;
}

export function Inspectable({ id, position, title, body, prompt = "inspect", radius = 2.2, marker = true, children }: InspectableProps) {
  const highlighted = useHighlighted(id);
  const discover = useDiscovery();
  const ring = useRef<THREE.MeshBasicMaterial>(null);

  useInteractable({
    id,
    position,
    radius,
    prompt,
    onInteract: () => {
      discover({ id, title, body: body ?? "", kind: "clue" }, position);
      useGameStore.getState().showNotice(title, body);
    },
  });

  useFrame(() => {
    const m = ring.current;
    if (m) m.opacity = highlighted ? 0.55 + Math.sin(performance.now() / 160) * 0.2 : 0.12;
  });

  return (
    <group position={position}>
      {children}
      {marker && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.04 - position[1], 0]}>
          <ringGeometry args={[0.28, 0.34, 24]} />
          <meshBasicMaterial ref={ring} color="#cfe2ff" transparent opacity={0.12} toneMapped={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
