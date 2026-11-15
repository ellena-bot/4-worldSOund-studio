// WHITE SILENCE — night snow over an abandoned Korean apartment complex.
// Procedural placeholder geometry until GLB assets land; colliders are final.
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { Snowfall } from "@/game/scene/Snowfall";
import { InteractionSystem } from "@/game/scene/InteractionSystem";
import { Door, Inspectable, LightSwitch, useHighlighted, useInteractable } from "@/game/scene/interactables";
import { useGameAudio } from "@/game/GameRuntime";
import { useGameStore } from "@/game/state";
import { WhiteSilenceStory } from "./story";

/* ---------- procedural textures (seeded, built lazily on the client) ---------- */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function snowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#d3dcea";
  ctx.fillRect(0, 0, 256, 256);
  const rand = mulberry32(7);
  for (let i = 0; i < 2600; i++) {
    const v = 200 + Math.floor(rand() * 55);
    ctx.fillStyle = `rgb(${v - 12},${v - 4},${v + 10})`;
    ctx.fillRect(rand() * 256, rand() * 256, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  return tex;
}

/** Apartment facade: dark concrete + window grid; lit windows go on the emissive map. */
function facadeTextures(seed: number) {
  const rand = mulberry32(seed);
  const cols = 6;
  const rows = 8;
  const W = 512;
  const H = 640;
  const map = document.createElement("canvas");
  map.width = W;
  map.height = H;
  const glow = document.createElement("canvas");
  glow.width = W;
  glow.height = H;
  const m = map.getContext("2d")!;
  const g = glow.getContext("2d")!;
  m.fillStyle = "#3b414b";
  m.fillRect(0, 0, W, H);
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  // concrete weathering
  for (let i = 0; i < 900; i++) {
    const v = 48 + Math.floor(rand() * 26);
    m.fillStyle = `rgb(${v},${v + 2},${v + 7})`;
    m.fillRect(rand() * W, rand() * H, 3, 3);
  }
  const cw = W / cols;
  const ch = H / rows;
  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const x = cx * cw + cw * 0.22;
      const y = cy * ch + ch * 0.2;
      const w = cw * 0.56;
      const h = ch * 0.5;
      const lit = rand() < 0.09;
      m.fillStyle = lit ? "#4a3c22" : "#12161d";
      m.fillRect(x, y, w, h);
      m.strokeStyle = "#0b0d12";
      m.strokeRect(x, y, w, h);
      if (lit) {
        g.fillStyle = "#f0b562";
        g.fillRect(x, y, w, h);
      }
    }
  }
  const mapTex = new THREE.CanvasTexture(map);
  const glowTex = new THREE.CanvasTexture(glow);
  return { map: mapTex, emissiveMap: glowTex };
}

/* ---------- environment pieces ---------- */

function Ground() {
  const tex = useMemo(snowTexture, []);
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[60, 0.5, 60]} position={[0, -0.5, 0]} friction={1.2} />
      <mesh receiveShadow position={[0, -0.06, 0]}>
        <boxGeometry args={[120, 0.12, 120]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
    </RigidBody>
  );
}

interface BlockProps {
  position: [number, number, number];
  size: [number, number, number];
  seed: number;
}

function ApartmentBlock({ position, size, seed }: BlockProps) {
  const tex = useMemo(() => facadeTextures(seed), [seed]);
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow receiveShadow position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial {...tex} emissive="#ffffff" emissiveIntensity={1.4} roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

const SNOW_MAT = { color: "#c9d4e6", roughness: 0.95 } as const;

function ParkedCar({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotation, 0]}>
      <group>
        <mesh castShadow position={[0, 0.45, 0]}>
          <boxGeometry args={[1.8, 0.6, 4.2]} />
          <meshStandardMaterial {...SNOW_MAT} />
        </mesh>
        <mesh castShadow position={[0, 0.95, -0.2]}>
          <boxGeometry args={[1.6, 0.45, 2.1]} />
          <meshStandardMaterial {...SNOW_MAT} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function Streetlight({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[0.1, 2.4, 0.1]} position={[0, 2.4, 0]} />
      <mesh castShadow position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 4.8, 8]} />
        <meshStandardMaterial color="#343a44" roughness={0.6} metalness={0.6} />
      </mesh>
      <mesh position={[0, 4.75, 0.35]}>
        <boxGeometry args={[0.16, 0.1, 0.9]} />
        <meshStandardMaterial color="#343a44" roughness={0.6} metalness={0.6} />
      </mesh>
      <pointLight position={[0, 4.6, 0.6]} color="#ffd9a3" intensity={14} distance={20} decay={2} castShadow />
    </RigidBody>
  );
}

/** The one working light in the district — dying until the visitor fixes it (E). */
function FlickeringStreetlight({ position }: { position: [number, number, number] }) {
  const fixed = useGameStore((s) => s.flags["streetlight-fixed"] ?? false);
  const light = useRef<THREE.PointLight>(null);
  const bulb = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (fixed || !light.current || !bulb.current) return;
    const dying = Math.random();
    light.current.intensity = dying < 0.14 ? 0.3 : 3.5 + Math.random() * 3;
    bulb.current.emissiveIntensity = dying < 0.14 ? 0.05 : 0.8;
  });
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[0.1, 2.4, 0.1]} position={[0, 2.4, 0]} />
      <mesh castShadow position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 4.8, 8]} />
        <meshStandardMaterial color="#343a44" roughness={0.6} metalness={0.6} />
      </mesh>
      <mesh position={[0, 4.75, 0.35]}>
        <boxGeometry args={[0.16, 0.1, 0.9]} />
        <meshStandardMaterial
          ref={bulb}
          color="#343a44"
          emissive="#ffd9a3"
          emissiveIntensity={fixed ? 2 : 0.8}
          roughness={0.6}
        />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 4.6, 0.6]}
        color="#ffd9a3"
        intensity={fixed ? 18 : 4}
        distance={24}
        decay={2}
        castShadow
      />
    </RigidBody>
  );
}

/** Invisible walls so the visitor can't leave the district. */
function PerimeterWalls() {
  const walls: { pos: [number, number, number]; args: [number, number, number] }[] = [
    { pos: [0, 3, -58], args: [60, 5, 0.5] },
    { pos: [0, 3, 58], args: [60, 5, 0.5] },
    { pos: [-58, 3, 0], args: [0.5, 5, 60] },
    { pos: [58, 3, 0], args: [0.5, 5, 60] },
  ];
  return (
    <RigidBody type="fixed" colliders={false}>
      {walls.map((w, i) => (
        <CuboidCollider key={i} args={w.args} position={w.pos} />
      ))}
    </RigidBody>
  );
}

/* ---------- interactive set pieces ---------- */

/** Entrance lobby attached to a block's front face: sliding door, small hall, light switch. */
function EntranceLobby({ x, z }: { x: number; z: number }) {
  // z is the facade plane; the lobby extends toward +z (the plaza).
  const audio = useGameAudio();
  const [open, setOpen] = useState(false);
  const [lit, setLit] = useState(false);
  const depth = 2.5;
  const zc = z + depth / 2;
  const wall = "#454b55";
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.5, 1.6, depth / 2]} position={[x - 1.6, 1.6, zc]} />
        <CuboidCollider args={[0.5, 1.6, depth / 2]} position={[x + 1.6, 1.6, zc]} />
        <CuboidCollider args={[2.1, 0.15, depth / 2]} position={[x, 3.3, zc]} />
        <mesh castShadow position={[x - 1.6, 1.6, zc]}>
          <boxGeometry args={[1, 3.2, depth]} />
          <meshStandardMaterial color={wall} roughness={0.85} />
        </mesh>
        <mesh castShadow position={[x + 1.6, 1.6, zc]}>
          <boxGeometry args={[1, 3.2, depth]} />
          <meshStandardMaterial color={wall} roughness={0.85} />
        </mesh>
        <mesh castShadow position={[x, 3.3, zc]}>
          <boxGeometry args={[4.2, 0.3, depth]} />
          <meshStandardMaterial color={wall} roughness={0.85} />
        </mesh>
      </RigidBody>
      <Door
        id="entrance"
        position={[x, 1.55, z + 0.35]}
        size={[2.2, 3.1, 0.15]}
        color="#2e343c"
        open={open}
        onToggle={(next) => {
          setOpen(next);
          void audio?.engine.current?.playOneShot(
            { kind: "noise", filter: "lowpass", frequency: 300, q: 1, gain: 0.6 },
            [x, 1.5, z + 0.3],
            0.4,
          );
        }}
        promptOpen="enter the building"
        promptClose="close the door"
      />
      <LightSwitch id="hall-light" position={[x - 0.9, 1.3, z + 0.08]} on={lit} onToggle={setLit} lamp lampColor="#ffdba8" />
    </>
  );
}

/** A frosted bank of mailboxes — unopened since the evacuation. */
function Mailboxes() {
  const highlighted = useHighlighted("mailboxes");
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, delta) => {
    const m = mat.current;
    if (!m) return;
    const target = highlighted ? 0.5 : 0.06;
    m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, Math.min(delta, 0.05) * 8);
  });
  return (
    <>
      <Inspectable
        id="mailboxes"
        position={[-13, 0.6, -14]}
        radius={2.4}
        title="Unopened mail"
        body="Envelopes yellowed behind frosted glass. The newest stamp is dated December 2019."
        prompt="inspect the mailboxes"
        marker={false}
      />
      <RigidBody type="fixed" colliders="cuboid" position={[-13, 0.55, -14]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.1, 0.4]} />
          <meshStandardMaterial ref={mat} color="#5a6068" emissive="#9fb8d8" emissiveIntensity={0.06} metalness={0.7} roughness={0.4} />
        </mesh>
      </RigidBody>
      {[-0.45, 0, 0.45].map((dx) => (
        <mesh key={dx} position={[-13 + dx, 0.55, -13.79]}>
          <planeGeometry args={[0.4, 0.9]} />
          <meshStandardMaterial color="#43484f" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </>
  );
}

/** A small paper clue; brightens subtly when looked at. */
function CluePaper({ id, position, flat = false, title, body }: { id: string; position: [number, number, number]; flat?: boolean; title: string; body: string }) {
  const highlighted = useHighlighted(id);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, delta) => {
    const m = mat.current;
    if (!m) return;
    const target = highlighted ? 0.7 : 0.05;
    m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, Math.min(delta, 0.05) * 8);
  });
  return (
    <Inspectable id={id} position={position} title={title} body={body} prompt="read" marker={false}>
      <mesh rotation-x={flat ? -Math.PI / 2 : 0}>
        <planeGeometry args={[0.35, 0.5]} />
        <meshStandardMaterial ref={mat} color="#d8d2c0" emissive="#fff2d0" emissiveIntensity={0.05} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </Inspectable>
  );
}

/* ---------- the world ---------- */

const FLICKER_POS: [number, number, number] = [1.5, 0, -4];

export function WhiteSilenceScene() {
  const audio = useGameAudio();
  const fixed = useGameStore((s) => s.flags["streetlight-fixed"] ?? false);

  useInteractable({
    id: "streetlight",
    position: [FLICKER_POS[0], 1.4, FLICKER_POS[2]],
    radius: 3,
    prompt: "repair the streetlight",
    enabled: !fixed,
    onInteract: () => {
      useGameStore.getState().setFlag("streetlight-fixed", true);
      void audio?.engine.current?.playOneShot(
        { kind: "noise", filter: "highpass", frequency: 2400, q: 4, gain: 0.5 },
        [FLICKER_POS[0], 4.5, FLICKER_POS[2]],
        0.3,
      );
    },
  });

  return (
    <>
      <color attach="background" args={["#070b14"]} />
      <fog attach="fog" args={["#0a1020", 12, 70]} />
      <ambientLight intensity={0.5} color="#3d5178" />
      <directionalLight
        position={[10, 45, 30]}
        intensity={1.1}
        color="#a9c3ef"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-far={130}
      />

      <Ground />
      <ApartmentBlock position={[-16, 8, -20]} size={[12, 16, 10]} seed={101} />
      <ApartmentBlock position={[2, 8, -28]} size={[14, 16, 10]} seed={102} />
      <ApartmentBlock position={[19, 8, -19]} size={[12, 16, 10]} seed={103} />
      <ApartmentBlock position={[15, 5, 4]} size={[9, 10, 8]} seed={201} />
      <ParkedCar position={[-7, 0, 4]} rotation={0.25} />
      <ParkedCar position={[10, 0, -8]} rotation={-0.12} />
      <Streetlight position={[-9, 0, -8]} />
      <Streetlight position={[9, 0, -14]} />
      <FlickeringStreetlight position={FLICKER_POS} />
      <PerimeterWalls />

      <EntranceLobby x={2} z={-23} />
      <Door
        id="entrance-c"
        position={[19, 1.4, -13.92]}
        size={[1.6, 2.8, 0.12]}
        open={false}
        lockedNotice={{ title: "Frozen shut", body: "Ice seals the frame. No one has opened this door in years." }}
        promptOpen="try the door"
      />
      <Mailboxes />
      <CluePaper
        id="drawing"
        position={[-4, 0.05, 3]}
        flat
        title="A child's drawing"
        body="Stick figures in front of these towers. Everyone is smiling. The sun is coloured purple."
      />
      <CluePaper
        id="evac-notice"
        position={[14.5, 1.5, -13.88]}
        title="Evacuation notice"
        body="BY ORDER OF THE DISTRICT OFFICE: the complex is closed for heating repairs. Residents will be contacted. The date stamp has faded."
      />
      <Snowfall />
      <WhiteSilenceStory />
      <InteractionSystem />
    </>
  );
}
