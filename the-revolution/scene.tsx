// THE REVOLUTION — an oppressive surveillance metropolis.
// Procedural placeholder geometry (merged towers, instanced traffic) until GLB
// assets land. Rules for drones live in ./drones.ts; this file only draws them.
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { InteractionSystem } from "@/game/scene/InteractionSystem";
import { ControlPanel, Door, Terminal, useInteractable } from "@/game/scene/interactables";
import { useGameAudio } from "@/game/GameRuntime";
import { useGameStore } from "@/game/state";
import { useDiscovery } from "@/game/scene/storytelling";
import { RevolutionStory } from "./story";
import { initDrone, stepDrone, type DroneRoute, type DroneState, type V3 } from "./drones";
import { ANNOUNCE_SFX, DRONE_LAYER, FREED_LAYER, SHUTDOWN_SFX, WARNING_SFX } from "./audio";
import { asphalt, billboard, concreteTile, eyeBanner, facade, mulberry32, poster, signTexture, type FacadeStyle } from "./textures";

export const FLAG_DOWN = "surveillance-down";
const FLAG_ARCHIVE = "archive-read";
const FLAG_GATE = "gate-open";

/* ---------- layout constants ---------- */

const BOUNDS = { x: 90, zMin: -100, zMax: 40 };
const AVENUE_HALF = 10;
const HOLE = { x0: -15, x1: -11, z0: -20, z1: -12 }; // hatch to the underground
const ROOM = { x0: -20, x1: -8, z0: -32, z1: -20, floor: -4 };
const CHECKPOINT_Z = -48;
const HQ = { x0: -18, x1: 18, z0: -87, z1: -63, door: 3, ceil: 14 };
const TRANSIT_Z = -38;
const TRANSIT_Y = 9;

/* ---------- small helpers ---------- */

type Box = { c: V3; s: V3 };

function Solid({ c, s, color = "#2b2e33", rough = 0.85, metal = 0.1, map, emissive, emissiveIntensity }: Box & {
  color?: string;
  rough?: number;
  metal?: number;
  map?: THREE.Texture;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <RigidBody type="fixed" colliders={false} position={c}>
      <CuboidCollider args={[s[0] / 2, s[1] / 2, s[2] / 2]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={s} />
        <meshStandardMaterial color={color} roughness={rough} metalness={metal} {...(map ? { map } : {})} emissive={emissive ?? "#000"} emissiveIntensity={emissiveIntensity ?? 0} />
      </mesh>
    </RigidBody>
  );
}

const fromBounds = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Box => ({
  c: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  s: [x1 - x0, y1 - y0, z1 - z0],
});

/* ---------- ground (with the hidden hatch cut out) ---------- */

function Ground() {
  const road = useMemo(() => {
    const t = asphalt();
    t.repeat.set(9, 7);
    return t;
  }, []);
  const { x } = BOUNDS;
  const pieces = [
    fromBounds(-x, HOLE.x0, -1, 0, BOUNDS.zMin, BOUNDS.zMax),
    fromBounds(HOLE.x1, x, -1, 0, BOUNDS.zMin, BOUNDS.zMax),
    fromBounds(HOLE.x0, HOLE.x1, -1, 0, HOLE.z1, BOUNDS.zMax),
    fromBounds(HOLE.x0, HOLE.x1, -1, 0, BOUNDS.zMin, HOLE.z0),
  ];
  return (
    <RigidBody type="fixed" colliders={false}>
      {pieces.map((p, i) => (
        <CuboidCollider key={i} args={[p.s[0] / 2, p.s[1] / 2, p.s[2] / 2]} position={p.c} friction={1} />
      ))}
      {pieces.map((p, i) => {
        const w = p.s[0];
        const d = p.s[2];
        return (
          <mesh key={`m${i}`} receiveShadow position={[p.c[0], -0.02, p.c[2]]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial
              map={road}
              color="#c4c9d2"
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        );
      })}
      {/* lane markings down the avenue */}
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={`l${i}`} position={[0, 0.005, 36 - i * 4.2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.18, 2]} />
          <meshStandardMaterial color="#c9b26a" emissive="#c9b26a" emissiveIntensity={0.15} roughness={0.6} />
        </mesh>
      ))}
    </RigidBody>
  );
}

/* ---------- skyline: merged tower geometry, one draw call per facade style ---------- */

interface Tower {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  style: FacadeStyle;
}

function layoutTowers(): Tower[] {
  const rand = mulberry32(42);
  const out: Tower[] = [];
  const styles: FacadeStyle[] = ["glass", "concrete", "glass"];
  // Street-front rows lining the avenue.
  for (const side of [-1, 1]) {
    let z = 34;
    while (z > -44) {
      const d = 8 + rand() * 6;
      const w = 9 + rand() * 6;
      const zc = z - d / 2;
      if (!(zc + d / 2 > TRANSIT_Z - 5 && zc - d / 2 < TRANSIT_Z + 5)) {
        out.push({ x: side * (16 + w / 2), z: zc, w, d, h: 40 + rand() * 110, style: styles[Math.floor(rand() * 3)]! });
      }
      z -= d + 4 + rand() * 4;
    }
  }
  // Deep city: taller, sparser.
  for (let i = 0; i < 40; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    const x = side * (40 + rand() * 45);
    const z = 30 - rand() * 120;
    const w = 10 + rand() * 12;
    const d = 10 + rand() * 12;
    if (out.some((t) => Math.abs(t.x - x) < (t.w + w) / 2 + 3 && Math.abs(t.z - z) < (t.d + d) / 2 + 3)) continue;
    out.push({ x, z, w, d, h: 70 + rand() * 180, style: rand() < 0.6 ? "glass" : "concrete" });
  }
  // Ministry blocks flanking the headquarters.
  out.push({ x: -40, z: -76, w: 22, d: 22, h: 55, style: "ministry" });
  out.push({ x: 40, z: -76, w: 22, d: 22, h: 55, style: "ministry" });
  return out;
}

/** Box with UVs in metres / cell size so windows keep their scale on any tower. */
function towerGeometry(t: Tower) {
  const g = new THREE.BoxGeometry(t.w, t.h, t.d);
  const uv = g.attributes["uv"] as THREE.BufferAttribute;
  const RU = 9; // metres per texture repeat (4 cells x ~2.2 m)
  const RV = 13;
  for (let face = 0; face < 6; face++) {
    const along = face < 2 ? t.d : t.w;
    for (let k = 0; k < 4; k++) {
      const i = face * 4 + k;
      if (face === 2 || face === 3) uv.setXY(i, 0.01, 0.01); // roof: flat slab colour
      else uv.setXY(i, (uv.getX(i) * along) / RU, (uv.getY(i) * t.h) / RV);
    }
  }
  g.translate(t.x, t.h / 2, t.z);
  return g;
}

function Skyline({ towers, down }: { towers: Tower[]; down: boolean }) {
  const groups = useMemo(() => {
    const byStyle = new Map<FacadeStyle, Tower[]>();
    towers.forEach((t) => byStyle.set(t.style, [...(byStyle.get(t.style) ?? []), t]));
    let seed = 300;
    return [...byStyle.entries()].map(([style, list]) => ({
      style,
      geometry: mergeGeometries(list.map(towerGeometry))!,
      tex: facade(seed++, style),
    }));
  }, [towers]);
  // Spires + aircraft beacons on the tallest towers.
  const spires = useMemo(() => towers.filter((t) => t.h > 120), [towers]);
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {towers.map((t, i) => (
          <CuboidCollider key={i} args={[t.w / 2, Math.min(t.h, 30) / 2, t.d / 2]} position={[t.x, Math.min(t.h, 30) / 2, t.z]} />
        ))}
      </RigidBody>
      {groups.map((g) => (
        <mesh key={g.style} geometry={g.geometry} castShadow receiveShadow>
          <meshStandardMaterial
            map={g.tex.map}
            emissiveMap={g.tex.emissiveMap}
            emissive={g.style === "ministry" && down ? "#ffc58a" : "#ffffff"}
            emissiveIntensity={g.style === "ministry" ? 1.6 : 1.25}
            roughness={g.style === "glass" ? 0.25 : 0.8}
            metalness={g.style === "glass" ? 0.7 : 0.15}
          />
        </mesh>
      ))}
      {spires.map((t, i) => (
        <group key={i} position={[t.x, t.h, t.z]}>
          <mesh position={[0, 8, 0]}>
            <cylinderGeometry args={[0.2, 0.6, 16, 6]} />
            <meshStandardMaterial color="#20232a" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 16.4, 0]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshBasicMaterial color={down ? "#ffb35c" : "#ff2a1a"} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ---------- billboards: propaganda, swapped for resistance after the shutdown ---------- */

const PROPAGANDA: [string, string][] = [
  ["UNITY IS VIGILANCE", "THE MINISTRY OF ORDER THANKS YOU FOR YOUR COMPLIANCE"],
  ["THE CITY SEES YOU", "REPORT IRREGULAR BEHAVIOUR · DIAL 1-1-2"],
  ["CURFEW 22:00", "CITIZENS ABROAD AFTER CURFEW WILL BE PROCESSED"],
  ["TRUST THE NETWORK", "SAFETY IS A SHARED RESPONSIBILITY"],
];
const LIBERATED: [string, string][] = [
  ["THE CITY REMEMBERS", "WE WERE NEVER ALONE"],
  ["THE EYES ARE CLOSED", "LOOK UP. SPEAK FREELY."],
  ["NO MORE CURFEW", "THE STREETS BELONG TO US"],
  ["WE ARE AWAKE", "— CELL 7"],
];

interface BoardSpec {
  pos: V3;
  rotY: number;
  size: [number, number];
  idx: number;
}

function Billboards({ down, boards }: { down: boolean; boards: BoardSpec[] }) {
  const texes = useMemo(
    () => ({
      gov: PROPAGANDA.map((l) => billboard(l, "#f2ece0", "#1a0605", "#e3241b")),
      free: LIBERATED.map((l) => billboard(l, "#0d1212", "#f2b84b", "#0d1212")),
    }),
    [],
  );
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mats.current.forEach((m, i) => {
      if (!m) return;
      // LED flicker + slow shimmer; occasional glitch frame.
      const glitch = Math.sin(t * 13 + i * 7) > 0.995 ? 0.2 : 1;
      m.emissiveIntensity = (1.4 + Math.sin(t * 2 + i) * 0.15) * glitch;
      if (m.emissiveMap) m.emissiveMap.offset.y = Math.sin(t * 0.7 + i) * 0.004;
    });
  });
  return (
    <>
      {boards.map((b, i) => {
        const tx = (down ? texes.free : texes.gov)[b.idx % 4]!;
        return (
          <group key={i} position={b.pos} rotation-y={b.rotY}>
            <mesh position={[0, 0, -0.15]}>
              <boxGeometry args={[b.size[0] + 0.6, b.size[1] + 0.6, 0.2]} />
              <meshStandardMaterial color="#121418" metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh>
              <planeGeometry args={b.size} />
              <meshStandardMaterial
                ref={(m) => {
                  mats.current[i] = m;
                }}
                map={tx}
                emissiveMap={tx}
                emissive="#ffffff"
                toneMapped={false}
                roughness={0.5}
              />
            </mesh>
            <pointLight position={[0, 0, 3]} color={down ? "#f2b84b" : "#ff3b2a"} intensity={i < 3 ? 30 : 0} distance={18} decay={2} />
          </group>
        );
      })}
    </>
  );
}

/* ---------- elevated transit line + maglev train ---------- */

function TransitLine() {
  const train = useRef<THREE.Group>(null);
  const pillars = useMemo(() => {
    const xs: number[] = [];
    for (let x = -85; x <= 85; x += 17) if (Math.abs(x) > AVENUE_HALF + 2) xs.push(x);
    return xs;
  }, []);
  useFrame(({ clock }) => {
    if (!train.current) return;
    const t = clock.elapsedTime;
    // Crosses the city, pauses off-screen, repeats.
    const cycle = (t % 26) / 26;
    train.current.position.x = -140 + cycle * 280;
  });
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {pillars.map((x) => (
          <CuboidCollider key={x} args={[0.8, TRANSIT_Y / 2, 0.8]} position={[x, TRANSIT_Y / 2, TRANSIT_Z]} />
        ))}
      </RigidBody>
      {pillars.map((x) => (
        <mesh key={x} castShadow position={[x, TRANSIT_Y / 2, TRANSIT_Z]}>
          <boxGeometry args={[1.6, TRANSIT_Y, 1.6]} />
          <meshStandardMaterial color="#3a3d43" roughness={0.8} />
        </mesh>
      ))}
      <mesh castShadow receiveShadow position={[0, TRANSIT_Y + 0.4, TRANSIT_Z]}>
        <boxGeometry args={[200, 0.8, 6]} />
        <meshStandardMaterial color="#2e3137" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* glowing guide rails */}
      {[-2, 2].map((dz) => (
        <mesh key={dz} position={[0, TRANSIT_Y + 0.85, TRANSIT_Z + dz]}>
          <boxGeometry args={[200, 0.1, 0.15]} />
          <meshBasicMaterial color="#7fe0ff" toneMapped={false} />
        </mesh>
      ))}
      <group ref={train} position={[-140, TRANSIT_Y + 2.4, TRANSIT_Z]}>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} position={[-k * 15, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[14, 2.6, 3.4]} />
              <meshStandardMaterial color="#c9ccd2" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.3, 1.71]}>
              <planeGeometry args={[12.5, 0.9]} />
              <meshBasicMaterial color="#ffe7b8" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.3, -1.71]} rotation-y={Math.PI}>
              <planeGeometry args={[12.5, 0.9]} />
              <meshBasicMaterial color="#ffe7b8" toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

/* ---------- flying traffic: one instanced mesh ---------- */

const TRAFFIC = 90;

function FlyingTraffic() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const cars = useMemo(() => {
    const rand = mulberry32(77);
    const lanes = [
      { y: 44, axis: "z" as const, at: -4 },
      { y: 52, axis: "z" as const, at: 4 },
      { y: 38, axis: "x" as const, at: -10 },
      { y: 46, axis: "z" as const, at: 28 },
      { y: 58, axis: "x" as const, at: -58 },
      { y: 72, axis: "z" as const, at: -30 },
      { y: 40, axis: "x" as const, at: 18 },
    ];
    return Array.from({ length: TRAFFIC }, (_, i) => {
      const lane = lanes[i % lanes.length]!;
      const dir = rand() < 0.5 ? 1 : -1;
      return { lane, dir, s: rand() * 260 - 130, speed: 14 + rand() * 16, off: (rand() - 0.5) * 3 };
    });
  }, []);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new THREE.Color();
    cars.forEach((car, i) => {
      c.set(i % 5 === 0 ? "#ff6a4d" : i % 3 === 0 ? "#9fe8ff" : "#ffe2b0");
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [cars]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(delta, 0.05);
    cars.forEach((car, i) => {
      car.s += car.speed * car.dir * dt;
      if (car.s > 130) car.s -= 260;
      if (car.s < -130) car.s += 260;
      const { lane } = car;
      const lateral = lane.at + car.off + car.dir * 1.6;
      if (lane.axis === "z") {
        o.position.set(lateral, lane.y, car.s - 30);
        o.rotation.set(0, car.dir > 0 ? 0 : Math.PI, 0);
      } else {
        o.position.set(car.s, lane.y, lateral);
        o.rotation.set(0, car.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      }
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, TRAFFIC]} frustumCulled={false}>
      <boxGeometry args={[1.4, 0.45, 3.4]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* ---------- surveillance drones ---------- */

const ROUTES: DroneRoute[] = [
  { id: "d1", waypoints: [[-6, 16, 30], [6, 16, -30], [-6, 16, -44], [6, 16, 20]], speed: 5, scanRadius: 4.5 },
  { id: "d2", waypoints: [[8, 20, 10], [-8, 20, -10], [8, 20, -40], [-8, 20, 30]], speed: 4, scanRadius: 5 },
  { id: "d3", waypoints: [[-12, 14, -46], [12, 14, -46], [12, 14, -56], [-12, 14, -56]], speed: 3.5, scanRadius: 4 },
  { id: "d4", waypoints: [[-30, 22, 0], [30, 22, 0], [30, 22, -24], [-30, 22, -24]], speed: 6, scanRadius: 5 },
  { id: "d5", waypoints: [[0, 26, 34], [0, 26, -60]], speed: 4.5, scanRadius: 5.5 },
];

function Drones({ down, onWarn }: { down: boolean; onWarn: (route: DroneRoute, d: DroneState) => void }) {
  const states = useRef(ROUTES.map((r, i) => initDrone(r, i * 13)));
  const bodies = useRef<(THREE.Group | null)[]>([]);
  const lights = useRef<(THREE.SpotLight | null)[]>([]);
  const targets = useMemo(() => ROUTES.map(() => new THREE.Object3D()), []);
  const cones = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const eyes = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const alarm = useRef(ROUTES.map(() => 0));
  const scene = useThree((s) => s.scene);
  const audio = useGameAudio();
  const tmp = useMemo(() => ({ dir: new THREE.Vector3(), up: new THREE.Vector3(0, -1, 0), q: new THREE.Quaternion() }), []);

  useEffect(() => {
    targets.forEach((t) => scene.add(t));
    lights.current.forEach((l, i) => l && (l.target = targets[i]!));
    return () => targets.forEach((t) => scene.remove(t));
  }, [scene, targets]);

  // Rotor emitters follow each drone once audio is running.
  const running = audio?.running ?? false;
  useEffect(() => {
    const engine = audio?.engine.current;
    if (!running || !engine || down) return;
    ROUTES.forEach((r, i) => void engine.addEmitter({ id: `drone-${r.id}`, position: states.current[i]!.position, layer: DRONE_LAYER, refDistance: 3, maxDistance: 80 }));
    return () => ROUTES.forEach((r) => engine.removeEmitter(`drone-${r.id}`));
  }, [running, down, audio]);

  useFrame(({ camera, clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const inControl = useGameStore.getState().locked;
    // Only street-level visitors can be seen; the underground is a blind spot.
    const player: V3 | null = inControl && camera.position.y > 0 ? [camera.position.x, 0, camera.position.z] : null;
    ROUTES.forEach((r, i) => {
      const d = states.current[i]!;
      const body = bodies.current[i];
      if (down) {
        // Grounded on their last post: hovering low, lights dead.
        if (body) {
          body.position.y += (6 - body.position.y) * Math.min(1, dt * 0.4);
          body.rotation.z = Math.sin(t * 0.3 + i) * 0.05;
        }
        return;
      }
      if (stepDrone(r, d, dt, t, player)) {
        alarm.current[i] = 1.5;
        onWarn(r, d);
      }
      alarm.current[i] = Math.max(0, alarm.current[i]! - dt);
      const alarmed = alarm.current[i]! > 0;
      if (body) {
        body.position.set(d.position[0], d.position[1] + Math.sin(t * 1.3 + i) * 0.4, d.position[2]);
        body.rotation.y = t * 0.4 + i;
      }
      targets[i]!.position.set(d.target[0], 0, d.target[2]);
      const l = lights.current[i];
      if (l) l.color.set(alarmed ? "#ff3322" : "#dbe9ff");
      const eye = eyes.current[i];
      if (eye) eye.color.set(alarmed && Math.sin(t * 20) > 0 ? "#ff1a0a" : "#ff5a3c");
      const cone = cones.current[i];
      if (cone && body) {
        tmp.dir.set(d.target[0] - body.position.x, -body.position.y, d.target[2] - body.position.z);
        const len = tmp.dir.length();
        tmp.q.setFromUnitVectors(tmp.up, tmp.dir.normalize());
        cone.position.copy(body.position);
        cone.quaternion.copy(tmp.q);
        cone.scale.set(1, len, 1);
      }
      const ring = rings.current[i];
      if (ring) {
        ring.position.set(d.target[0], 0.03, d.target[2]);
        (ring.material as THREE.MeshBasicMaterial).color.set(alarmed ? "#ff3322" : "#cfe2ff");
      }
      audio?.engine.current?.moveEmitter(`drone-${r.id}`, d.position);
    });
  });

  return (
    <>
      {ROUTES.map((r, i) => (
        <group key={r.id}>
          <group
            ref={(g) => {
              bodies.current[i] = g;
            }}
            position={states.current[i]!.position}
          >
            <mesh castShadow>
              <sphereGeometry args={[0.7, 16, 12]} />
              <meshStandardMaterial color="#1c1f24" metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.25, 0.55]}>
              <sphereGeometry args={[0.18, 10, 8]} />
              <meshBasicMaterial
                ref={(m) => {
                  eyes.current[i] = m;
                }}
                color={down ? "#222" : "#ff5a3c"}
                toneMapped={false}
              />
            </mesh>
            {[0, 1, 2, 3].map((k) => (
              <mesh key={k} position={[Math.cos((k * Math.PI) / 2) * 1.1, 0.15, Math.sin((k * Math.PI) / 2) * 1.1]}>
                <cylinderGeometry args={[0.45, 0.45, 0.06, 12]} />
                <meshStandardMaterial color="#2a2e35" metalness={0.7} roughness={0.4} />
              </mesh>
            ))}
            {!down && (
              <spotLight
                ref={(l) => {
                  lights.current[i] = l;
                  if (l) l.target = targets[i]!;
                }}
                position={[0, -0.6, 0]}
                angle={0.32}
                penumbra={0.5}
                intensity={900}
                distance={60}
                decay={2}
                color="#dbe9ff"
              />
            )}
          </group>
          {!down && (
            <>
              <group
                ref={(g) => {
                  cones.current[i] = g;
                }}
              >
                {/* unit-height cone hanging below the drone, scaled to the beam length */}
                <mesh position={[0, -0.5, 0]}>
                  <coneGeometry args={[r.scanRadius * 0.9, 1, 24, 1, true]} />
                  <meshBasicMaterial color="#cfe2ff" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
                </mesh>
              </group>
              <mesh
                ref={(m) => {
                  rings.current[i] = m;
                }}
                rotation-x={-Math.PI / 2}
              >
                <ringGeometry args={[r.scanRadius - 0.25, r.scanRadius, 40]} />
                <meshBasicMaterial color="#cfe2ff" transparent opacity={0.35} toneMapped={false} depthWrite={false} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </>
  );
}

/* ---------- checkpoint and restricted zone ---------- */

function Checkpoint({ down }: { down: boolean }) {
  const sign = useMemo(() => signTexture("RESTRICTED ZONE", "MINISTRY OF ORDER · AUTHORISED CITIZENS ONLY"), []);
  const arch = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (arch.current) arch.current.color.set(down ? "#3a2a12" : Math.sin(clock.elapsedTime * 3) > 0 ? "#ff2a1a" : "#5a0a05");
  });
  const z = CHECKPOINT_Z;
  return (
    <>
      <Solid {...fromBounds(-BOUNDS.x, -3, 0, 3.2, z - 0.4, z + 0.4)} color="#4a4c50" />
      <Solid {...fromBounds(3, BOUNDS.x, 0, 3.2, z - 0.4, z + 0.4)} color="#4a4c50" />
      {/* scanner arch */}
      <Solid {...fromBounds(-3.4, -2.6, 0, 5.2, z - 0.6, z + 0.6)} color="#202227" metal={0.6} rough={0.4} />
      <Solid {...fromBounds(2.6, 3.4, 0, 5.2, z - 0.6, z + 0.6)} color="#202227" metal={0.6} rough={0.4} />
      <mesh position={[0, 5, z]}>
        <boxGeometry args={[6.8, 0.5, 1.2]} />
        <meshStandardMaterial color="#202227" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 4.7, z]}>
        <boxGeometry args={[5.2, 0.08, 0.9]} />
        <meshBasicMaterial ref={arch} color="#ff2a1a" toneMapped={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 8, 2.2, z + 0.42]}>
          <planeGeometry args={[6, 1.9]} />
          <meshStandardMaterial map={sign} roughness={0.7} />
        </mesh>
      ))}
      {/* guard booth */}
      <Solid {...fromBounds(5, 8, 0, 3, z + 1, z + 4)} color="#2c2f35" />
      <mesh position={[6.5, 2, z + 4.01]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshBasicMaterial color={down ? "#2a2015" : "#5be0ff"} toneMapped={false} />
      </mesh>
      {/* PA speaker mast */}
      <mesh position={[-6, 3.5, z + 1]}>
        <cylinderGeometry args={[0.08, 0.1, 7, 8]} />
        <meshStandardMaterial color="#2a2d33" metalness={0.6} />
      </mesh>
      {[-0.5, 0.5].map((dx) => (
        <mesh key={dx} position={[-6 + dx, 6.6, z + 1.2]} rotation-x={-0.3}>
          <coneGeometry args={[0.35, 0.7, 12, 1, true]} />
          <meshStandardMaterial color="#8a8d93" metalness={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

/* ---------- government headquarters ---------- */

function Headquarters({ down }: { down: boolean }) {
  const banner = useMemo(() => eyeBanner("#e8d9b0", "#7a0d08"), []);
  const freeBanner = useMemo(() => eyeBanner("#1b1b1b", "#f2b84b"), []);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const tile = useMemo(() => {
    const t = concreteTile();
    t.repeat.set(10, 7);
    return t;
  }, []);
  useFrame(({ clock }) => {
    if (!core.current) return;
    core.current.emissiveIntensity = down ? 0.25 : 2 + Math.sin(clock.elapsedTime * 2.2) * 0.8;
  });
  const { x0, x1, z0, z1, door, ceil } = HQ;
  const wall = "#3a3634";
  const accent = down ? "#ffb35c" : "#ff2a1a";
  return (
    <>
      {/* plaza */}
      <mesh receiveShadow position={[0, 0.01, (z1 + CHECKPOINT_Z) / 2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, CHECKPOINT_Z - z1]} />
        <meshStandardMaterial map={tile} roughness={0.4} metalness={0.2} color="#8b8b90" />
      </mesh>
      {/* shell */}
      <Solid {...fromBounds(x0, -door, 0, ceil, z1 - 1, z1)} color={wall} />
      <Solid {...fromBounds(door, x1, 0, ceil, z1 - 1, z1)} color={wall} />
      <Solid {...fromBounds(-door, door, 6, ceil, z1 - 1, z1)} color={wall} />
      <Solid {...fromBounds(x0, x0 + 1, 0, ceil, z0, z1)} color={wall} />
      <Solid {...fromBounds(x1 - 1, x1, 0, ceil, z0, z1)} color={wall} />
      <Solid {...fromBounds(x0, x1, 0, ceil, z0, z0 + 1)} color={wall} />
      <Solid {...fromBounds(x0, x1, ceil, ceil + 1, z0, z1)} color={wall} />
      {/* monumental tower mass + crown */}
      <mesh castShadow position={[0, ceil + 1 + 30, (z0 + z1) / 2 - 2]}>
        <boxGeometry args={[30, 60, 18]} />
        <meshStandardMaterial color="#2f2c2b" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, ceil + 1 + 66, (z0 + z1) / 2 - 2]}>
        <boxGeometry args={[18, 12, 12]} />
        <meshStandardMaterial color="#2a2726" roughness={0.85} />
      </mesh>
      {/* the eye on the crown */}
      <mesh position={[0, ceil + 1 + 66, (z0 + z1) / 2 - 2 + 6.05]}>
        <circleGeometry args={[3.2, 32]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {/* colonnade */}
      {[-15, -11, -7, 7, 11, 15].map((x) => (
        <Solid key={x} c={[x, ceil / 2, z1 + 2]} s={[1.4, ceil, 1.4]} color="#4b4744" />
      ))}
      {/* banners */}
      {[-13, -9, 9, 13].map((x) => (
        <mesh key={x} position={[x, 8, z1 + 0.02]}>
          <planeGeometry args={[2.4, 9]} />
          <meshStandardMaterial map={down ? freeBanner : banner} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* doorway light spill */}
      <pointLight position={[0, 4, z1 + 3]} color={accent} intensity={40} distance={16} decay={2} />
      {/* interior: hall, pillars, core */}
      <pointLight position={[0, 10, -76]} color={accent} intensity={120} distance={30} decay={2} />
      <pointLight position={[0, 3, -70]} color="#9fc6ff" intensity={20} distance={14} decay={2} />
      {[-10, 10].map((x) =>
        [-70, -80].map((z) => <Solid key={`${x}${z}`} c={[x, ceil / 2, z]} s={[1.2, ceil, 1.2]} color="#2e2b2a" />),
      )}
      <Solid c={[0, 0.5, -81]} s={[6, 1, 6]} color="#1d1e22" metal={0.7} rough={0.3} />
      <mesh position={[0, 6, -81]}>
        <cylinderGeometry args={[1.4, 1.4, 10, 24]} />
        <meshStandardMaterial ref={core} color="#200606" emissive={accent} emissiveIntensity={2} roughness={0.2} metalness={0.5} />
      </mesh>
      {/* override console */}
      <Solid c={[0, 0.55, -76.5]} s={[2.4, 1.1, 0.9]} color="#25272c" metal={0.6} rough={0.4} />
      <mesh position={[0, 1.2, -76.2]} rotation-x={-0.6}>
        <planeGeometry args={[2, 0.7]} />
        <meshBasicMaterial color={down ? "#3fbf6a" : "#ff4a30"} toneMapped={false} />
      </mesh>
    </>
  );
}

/* ---------- the hidden underground archive ---------- */

function Underground() {
  const [hatchOpen, setHatchOpen] = useState(false);
  const rampLen = Math.hypot(HOLE.z1 - HOLE.z0, -ROOM.floor);
  const angle = Math.atan2(-ROOM.floor, HOLE.z1 - HOLE.z0);
  const hatchPoster = useMemo(() => poster(5, "CELL 7", "BENEATH THE CITY"), []);
  const roomPosters = useMemo(
    () => [poster(9, "REMEMBER", "THE 14TH OF MARCH"), poster(13, "WAKE UP", "THEY CANNOT WATCH EVERYONE"), poster(17, "THE CORE", "IS UNGUARDED AT NIGHT")],
    [],
  );
  const bulb = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (bulb.current) bulb.current.intensity = Math.random() < 0.05 ? 2 : 18;
  });
  const { x0, x1, z0, z1, floor } = ROOM;
  const cx = (HOLE.x0 + HOLE.x1) / 2;
  return (
    <>
      {/* ramp */}
      <RigidBody type="fixed" colliders={false} position={[cx, floor / 2 - 0.12, (HOLE.z0 + HOLE.z1) / 2]} rotation={[-angle, 0, 0]}>
        <CuboidCollider args={[(HOLE.x1 - HOLE.x0) / 2, 0.1, rampLen / 2]} />
        <mesh receiveShadow>
          <boxGeometry args={[HOLE.x1 - HOLE.x0, 0.2, rampLen]} />
          <meshStandardMaterial color="#3b3b3d" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* ramp side walls under the slab */}
      <Solid {...fromBounds(HOLE.x0 - 0.3, HOLE.x0, floor - 0.5, 0, HOLE.z0, HOLE.z1)} color="#2a2a2c" />
      <Solid {...fromBounds(HOLE.x1, HOLE.x1 + 0.3, floor - 0.5, 0, HOLE.z0, HOLE.z1)} color="#2a2a2c" />
      <Solid {...fromBounds(HOLE.x0, HOLE.x1, floor - 0.5, 0, HOLE.z1, HOLE.z1 + 0.3)} color="#2a2a2c" />
      {/* hatch guard rails + a poster that marks the way */}
      <Solid {...fromBounds(HOLE.x0 - 0.3, HOLE.x0, 0, 1, HOLE.z0, HOLE.z1)} color="#55504a" metal={0.5} />
      <Solid {...fromBounds(HOLE.x1, HOLE.x1 + 0.3, 0, 1, HOLE.z0, HOLE.z1)} color="#55504a" metal={0.5} />
      <mesh position={[cx, 1.4, HOLE.z1 + 0.32]}>
        <planeGeometry args={[1, 1.4]} />
        <meshStandardMaterial map={hatchPoster} transparent roughness={0.9} />
      </mesh>
      <Solid {...fromBounds(HOLE.x0, HOLE.x0 + 0.65, 0, 2.4, HOLE.z1, HOLE.z1 + 0.3)} color="#3a3633" />
      <Solid {...fromBounds(HOLE.x1 - 0.65, HOLE.x1, 0, 2.4, HOLE.z1, HOLE.z1 + 0.3)} color="#3a3633" />
      <Door id="hideout-hatch" position={[cx, 1.2, HOLE.z1 + 0.15]} size={[2.7, 2.4, 0.2]} slide="up" open={hatchOpen} onToggle={setHatchOpen} promptOpen="open the concealed service hatch" />
      {/* room */}
      <Solid {...fromBounds(x0, x1, floor - 0.5, floor, z0, z1)} color="#2c2b2a" />
      <Solid {...fromBounds(x0 - 0.3, x0, floor, -1, z0, z1)} color="#3a3633" />
      <Solid {...fromBounds(x1, x1 + 0.3, floor, -1, z0, z1)} color="#3a3633" />
      <Solid {...fromBounds(x0, x1, floor, -1, z0 - 0.3, z0)} color="#3a3633" />
      <Solid {...fromBounds(x0, HOLE.x0, floor, -1, z1, z1 + 0.3)} color="#3a3633" />
      <Solid {...fromBounds(HOLE.x1, x1, floor, -1, z1, z1 + 0.3)} color="#3a3633" />
      {/* ceiling visual (the street slab above) */}
      <mesh position={[(x0 + x1) / 2, -1.01, (z0 + z1) / 2]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[x1 - x0, z1 - z0]} />
        <meshStandardMaterial color="#1e1e20" roughness={1} />
      </mesh>
      <pointLight ref={bulb} position={[-14, -1.6, -26]} color="#ffb070" intensity={18} distance={14} decay={2} />
      <mesh position={[-14, -1.4, -26]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color="#ffcf9a" toneMapped={false} />
      </mesh>
      {/* table, crates, map wall */}
      <Solid c={[-14, floor + 0.45, -27]} s={[3, 0.9, 1.4]} color="#4a3826" />
      <Solid c={[-18.6, floor + 0.5, -30.5]} s={[1.6, 1, 1.6]} color="#3d3324" />
      <Solid c={[-9.5, floor + 0.4, -30.6]} s={[1.4, 0.8, 1.2]} color="#3d3324" />
      {roomPosters.map((p, i) => (
        <mesh key={i} position={[-17 + i * 3, -2.4, z0 + 0.02]}>
          <planeGeometry args={[1.3, 1.8]} />
          <meshStandardMaterial map={p} transparent roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[-14, floor + 0.92, -27]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1, 0.7]} />
        <meshStandardMaterial color="#d8cfb8" roughness={0.9} />
      </mesh>
    </>
  );
}

/* ---------- street details ---------- */

function StreetPosters() {
  const list = useMemo(
    () => [
      { tex: poster(21, "RESIST", "THE EYE IS BLIND BELOW"), pos: [-15.9, 1.8, 4] as V3, rot: Math.PI / 2 },
      { tex: poster(25, "WE ARE HERE", "CELL 7"), pos: [15.9, 1.6, -2] as V3, rot: -Math.PI / 2 },
      { tex: poster(29, "LOOK DOWN", "WHERE THE STREET OPENS"), pos: [-15.9, 1.7, -8] as V3, rot: Math.PI / 2 },
      { tex: poster(33, "NO CURFEW", "FOR THE MIND"), pos: [15.9, 1.9, 18] as V3, rot: -Math.PI / 2 },
    ],
    [],
  );
  return (
    <>
      {list.map((p, i) => (
        <mesh key={i} position={p.pos} rotation-y={p.rot}>
          <planeGeometry args={[1.2, 1.7]} />
          <meshStandardMaterial map={p.tex} transparent roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

function StreetLamps({ down }: { down: boolean }) {
  const zs = [30, 18, 6, -6, -18, -30, -44];
  return (
    <>
      {zs.map((z, i) =>
        [-1, 1].map((s) => {
          const x = s * (AVENUE_HALF + 1.5);
          return (
            <group key={`${z}${s}`} position={[x, 0, z + (s > 0 ? 6 : 0)]}>
              <RigidBody type="fixed" colliders={false}>
                <CuboidCollider args={[0.12, 3, 0.12]} position={[0, 3, 0]} />
              </RigidBody>
              <mesh castShadow position={[0, 3, 0]}>
                <boxGeometry args={[0.18, 6, 0.18]} />
                <meshStandardMaterial color="#25282d" metalness={0.7} roughness={0.4} />
              </mesh>
              <mesh position={[-s * 0.9, 6, 0]}>
                <boxGeometry args={[2, 0.12, 0.35]} />
                <meshStandardMaterial color="#25282d" metalness={0.7} />
              </mesh>
              <mesh position={[-s * 1.6, 5.92, 0]}>
                <boxGeometry args={[0.8, 0.04, 0.25]} />
                <meshBasicMaterial color={down ? "#ffd7a0" : "#bfe9ff"} toneMapped={false} />
              </mesh>
              {i % 2 === 0 && s < 0 && (
                <pointLight position={[-s * 1.6, 5.6, 0]} color={down ? "#ffcf94" : "#a9dcff"} intensity={45} distance={18} decay={2} />
              )}
            </group>
          );
        }),
      )}
    </>
  );
}

function PerimeterWalls() {
  const { x, zMin, zMax } = BOUNDS;
  const walls: Box[] = [
    fromBounds(-x, x, 0, 8, zMin - 0.5, zMin),
    fromBounds(-x, x, 0, 8, zMax, zMax + 0.5),
    fromBounds(-x - 0.5, -x, 0, 8, zMin, zMax),
    fromBounds(x, x + 0.5, 0, 8, zMin, zMax),
  ];
  return (
    <RigidBody type="fixed" colliders={false}>
      {walls.map((w, i) => (
        <CuboidCollider key={i} args={[w.s[0] / 2, w.s[1] / 2, w.s[2] / 2]} position={w.c} />
      ))}
    </RigidBody>
  );
}

/** Rain streaks around the camera (the city never dries). */
function Rain({ count = 1400 }) {
  const geo = useRef<THREE.BufferGeometry>(null);
  const data = useMemo(() => {
    const pos = new Float32Array(count * 6);
    const rand = mulberry32(3);
    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * 60;
      const y = rand() * 30;
      const z = (rand() - 0.5) * 60;
      pos.set([x, y, z, x + 0.05, y + 0.7, z], i * 6);
    }
    return pos;
  }, [count]);
  useFrame(({ camera }, delta) => {
    const g = geo.current;
    if (!g) return;
    const a = g.attributes["position"] as THREE.BufferAttribute;
    const arr = a.array as Float32Array;
    const fall = Math.min(delta, 0.05) * 22;
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      arr[o + 1]! -= fall;
      arr[o + 4]! -= fall;
      if (arr[o + 1]! < camera.position.y - 8) {
        const x = camera.position.x + (Math.random() - 0.5) * 60;
        const z = camera.position.z + (Math.random() - 0.5) * 60;
        const y = camera.position.y + 18 + Math.random() * 6;
        arr.set([x, y, z, x + 0.05, y + 0.7, z], o);
      }
    }
    a.needsUpdate = true;
  });
  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[data, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#9fb3c8" transparent opacity={0.35} />
    </lineSegments>
  );
}

/* ---------- the world ---------- */

const BOARDS: BoardSpec[] = [
  { pos: [-15.8, 14, 12], rotY: Math.PI / 2, size: [14, 3.5], idx: 0 },
  { pos: [15.8, 18, -14], rotY: -Math.PI / 2, size: [16, 4], idx: 1 },
  { pos: [-15.8, 22, -26], rotY: Math.PI / 2, size: [12, 3], idx: 2 },
  { pos: [0, 30, -62.4], rotY: 0, size: [24, 6], idx: 3 },
  { pos: [15.8, 9, 26], rotY: -Math.PI / 2, size: [10, 2.5], idx: 2 },
];

export function RevolutionScene() {
  const audio = useGameAudio();
  const discover = useDiscovery();
  const down = useGameStore((s) => s.flags[FLAG_DOWN] ?? false);
  const archiveRead = useGameStore((s) => s.flags[FLAG_ARCHIVE] ?? false);
  const towers = useMemo(layoutTowers, []);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const flagged = useRef(false);
  const restricted = useRef(false);
  const nextAnnounce = useRef(12);

  // The skyline needs a long view distance; restore the runtime default on exit.
  useEffect(() => {
    const prev = camera.far;
    camera.far = 650;
    camera.updateProjectionMatrix();
    return () => {
      camera.far = prev;
      camera.updateProjectionMatrix();
    };
  }, [camera]);

  // After the shutdown: the warm city chord replaces the PA drone.
  const running = audio?.running ?? false;
  useEffect(() => {
    const engine = audio?.engine.current;
    if (!running || !engine || !down) return;
    engine.removeEmitter("pa-checkpoint");
    engine.removeEmitter("hq-core");
    void engine.addEmitter({ id: "freed", position: [0, 30, -20], layer: FREED_LAYER, refDistance: 60, maxDistance: 400 });
    return () => engine.removeEmitter("freed");
  }, [running, down, audio]);

  const onWarn = (_r: DroneRoute, d: DroneState) => {
    void audio?.engine.current?.playOneShot(WARNING_SFX, d.position, 0.7);
    if (!flagged.current) {
      flagged.current = true;
      useGameStore.getState().showNotice("Citizen flagged", "Remain calm. Your movements are now being logged.");
    }
  };

  // Ambient scripting: PA announcements and the restricted-zone alert.
  useFrame(({ clock, camera: cam }) => {
    if (!useGameStore.getState().locked || down) return;
    const t = clock.elapsedTime;
    if (t > nextAnnounce.current) {
      nextAnnounce.current = t + 28;
      void audio?.engine.current?.playOneShot(ANNOUNCE_SFX, [-6, 6.6, CHECKPOINT_Z + 1], 1.6);
      void audio?.engine.current?.playOneShot(ANNOUNCE_SFX, [cam.position.x, 40, cam.position.z - 30], 1.6);
    }
    if (!restricted.current && cam.position.z < CHECKPOINT_Z - 1 && cam.position.y > 0) {
      restricted.current = true;
      void audio?.engine.current?.playOneShot(WARNING_SFX, [0, 5, CHECKPOINT_Z], 1);
      useGameStore.getState().showNotice("Restricted zone", "Your presence has been recorded by the Ministry of Order.");
    }
  });

  const gateOpen = useGameStore((s) => s.flags[FLAG_GATE] ?? false);

  useInteractable({
    id: "archive",
    position: [-14, ROOM.floor + 1, -27],
    radius: 2.6,
    prompt: "read the resistance archive",
    enabled: !archiveRead,
    onInteract: () => {
      const s = useGameStore.getState();
      s.setFlag(FLAG_ARCHIVE, true);
      discover({ id: "archive", title: "Cell 7 — field notes", body: "The Ministry's surveillance override was never locked. They never believed anyone would reach it.", kind: "clue" }, [-14, -3, -27]);
      s.showNotice(
        "Cell 7 — field notes",
        "The surveillance core sits inside the Ministry. Its override console was never locked: they never believed anyone would reach it.",
      );
    },
  });

  useInteractable({
    id: "override",
    position: [0, 1.2, -76.5],
    radius: 2.6,
    prompt: "override the surveillance network",
    enabled: !down,
    onInteract: () => {
      const s = useGameStore.getState();
      s.setFlag(FLAG_DOWN, true);
      discover({ id: "network-freed", title: "The eyes are closed", body: "The drones are grounded. Resistance messages replace the Ministry's propaganda across the city.", kind: "event" }, [0, 1.2, -76.5]);
      s.showNotice("Surveillance network disabled", "The drones are grounded. For the first time in years, nobody is watching.");
      void audio?.engine.current?.playOneShot(SHUTDOWN_SFX, [0, 3, -81], 2.5);
      ROUTES.forEach((r) => audio?.engine.current?.removeEmitter(`drone-${r.id}`));
    },
  });

  const fogColor = down ? "#2a2220" : "#151820";

  return (
    <>
      <color attach="background" args={[down ? "#1a1412" : "#0a0c12"]} />
      <fogExp2 attach="fog" args={[fogColor, 0.0115]} />
      <ambientLight intensity={down ? 0.55 : 0.4} color={down ? "#a88a70" : "#5a6a88"} />
      <hemisphereLight args={[down ? "#d9a070" : "#4a6a9a", "#120e10", 0.5]} />
      <directionalLight
        position={[-30, 80, 40]}
        intensity={down ? 0.8 : 0.6}
        color={down ? "#ffd2a0" : "#9fb8e8"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={220}
      />
      <Environment resolution={128}>
        <Lightformer intensity={1.2} color={down ? "#ffb070" : "#ff4030"} position={[0, 6, -40]} scale={[30, 4, 1]} />
        <Lightformer intensity={1.5} color="#7fd0ff" position={[-20, 10, 0]} rotation-y={Math.PI / 2} scale={[40, 3, 1]} />
        <Lightformer intensity={0.8} color="#ffd9a0" position={[20, 10, 0]} rotation-y={-Math.PI / 2} scale={[40, 3, 1]} />
        <Lightformer intensity={0.6} position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} color="#3a4a6a" />
      </Environment>

      <Ground />
      <Skyline towers={towers} down={down} />
      <Billboards down={down} boards={BOARDS} />
      <TransitLine />
      <FlyingTraffic />
      <Checkpoint down={down} />
      <Headquarters down={down} />
      <Underground />
      <StreetPosters />
      <StreetLamps down={down} />
      <Drones down={down} onWarn={onWarn} />
      <PerimeterWalls />
      <Rain />
      <RevolutionStory />

      {/* checkpoint security gate: sealed until released from the guard booth (or the network falls) */}
      <Door
        id="gate"
        position={[0, 2.2, CHECKPOINT_Z]}
        size={[5.2, 4.4, 0.3]}
        slide="up"
        color="#23262c"
        accent="#ff4a30"
        open={gateOpen || down}
        lockedNotice={gateOpen || down ? undefined : { title: "Sealed", body: "The checkpoint gate is operated from the guard booth." }}
        onToggle={(next) => {
          useGameStore.getState().setFlag(FLAG_GATE, next);
          useGameStore.getState().showNotice(next ? "Checkpoint gate released" : "Checkpoint gate sealed");
          void audio?.engine.current?.playOneShot({ kind: "noise", filter: "lowpass", frequency: 220, q: 1, gain: 0.7 }, [0, 3, CHECKPOINT_Z], 0.6);
        }}
        promptOpen="open the security gate"
        promptClose="close the security gate"
        radius={3.4}
      />
      <ControlPanel
        id="gate-panel"
        position={[4.95, 1.3, -45.5]}
        rotationY={-Math.PI / 2}
        prompt="operate the gate controls"
        color="#5be0ff"
        onPress={() => {
          const s = useGameStore.getState();
          const next = !(s.flags[FLAG_GATE] ?? false);
          s.setFlag(FLAG_GATE, next);
          s.showNotice(next ? "Gate release engaged" : "Gate sealed", next ? "The security gate is opening." : undefined);
          void audio?.engine.current?.playOneShot({ kind: "noise", filter: "highpass", frequency: 3200, q: 3, gain: 0.4 }, [4.95, 1.3, -45.5], 0.15);
        }}
      />
      <Terminal
        id="kiosk"
        position={[13.5, 0, 8]}
        rotationY={-Math.PI / 2}
        title="Citizen record #7714-K"
        body="ACCESS DENIED. Irregular behaviour has been flagged for review. Report to the nearest processing centre."
        screenColor="#5be0ff"
        prompt="check your citizen record"
      />
      <Terminal
        id="records"
        position={[6, 0, -72]}
        rotationY={-Math.PI / 2}
        title="Ministry records"
        body="Citizen compliance: 99.1%. Dissent reports: rising. Core maintenance overdue — the technicians were reassigned."
        screenColor="#ff4a30"
      />

      <InteractionSystem />
    </>
  );
}
