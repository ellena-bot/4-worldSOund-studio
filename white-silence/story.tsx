import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Door, Inspectable } from "@/game/scene/interactables";
import { StoryZone } from "@/game/scene/storytelling";
import { PortalGate } from "@/game/scene/PortalGate";
import { portalsInWorld } from "@/game/portals";
import { useGameStore } from "@/game/state";
import { storyPalette, StoryPanel, StorySolid, storyTexture } from "@/game/scene/storyProps";

function Footprints() {
  const palette = useMemo(storyPalette, []);
  const points = useMemo(() => {
    const waypoints = [[-4, 4], [-18, 4], [-29, 2], [-29, -5]];
    const result: [number, number, number][] = [];
    for (let s = 0; s < waypoints.length - 1; s++) {
      const a = waypoints[s], b = waypoints[s + 1];
      if (!a || !b) continue;
      const ax = a[0] ?? 0, az = a[1] ?? 0, bx = b[0] ?? 0, bz = b[1] ?? 0;
      const count = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.7);
      for (let i = 0; i < count; i++) result.push([ax + (bx - ax) * i / count + (i % 2 ? 0.12 : -0.12), az + (bz - az) * i / count, Math.atan2(bx - ax, bz - az)]);
    }
    return result;
  }, []);
  return <>{points.map(([x, z, angle], i) => <mesh key={i} position={[x, 0.007, z]} rotation={[-Math.PI / 2, 0, angle]} scale={[0.09, 0.2, 1]}><circleGeometry args={[1, 10]} /><meshStandardMaterial color={palette.metal} transparent opacity={0.3} roughness={1} /></mesh>)}</>;
}

function Playground() {
  const palette = useMemo(storyPalette, []);
  const swing = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (swing.current) swing.current.rotation.x = Math.sin(clock.elapsedTime * 0.75) * 0.045 * Math.max(0, Math.sin(clock.elapsedTime * 0.06));
  });
  return <>
    {[-20, -16].map((x) => <StorySolid key={x} position={[x, 1.3, 4]} size={[0.12, 2.6, 0.12]} />)}
    <StorySolid position={[-18, 2.65, 4]} size={[4.2, 0.12, 0.12]} />
    <group ref={swing} position={[-18, 2.6, 4]}>
      {[-0.42, 0.42].map((x) => <mesh key={x} position={[x, -0.95, 0]}><cylinderGeometry args={[0.016, 0.016, 1.9, 6]} /><meshStandardMaterial color={palette.metal} metalness={0.65} roughness={0.5} /></mesh>)}
      <mesh position={[0, -1.9, 0]}><boxGeometry args={[1, 0.12, 0.45]} /><meshStandardMaterial color={palette.snow} roughness={1} /></mesh>
    </group>
    <Inspectable id="empty-swing" position={[-18, 0.8, 4]} marker={false} title="An empty swing" body="Snow fills the seat. The chains still move a little in the wind. Beneath it, a small pair of tracks joins a larger pair." prompt="inspect the swing" />
    <StoryZone id="playground" position={[-18, 1.7, 4]} radius={5} title="Snowbound playground" body="Two sets of footprints leave the playground together, toward the academy." sound={{ kind: "noise", filter: "bandpass", frequency: 1300, q: 12, gain: 0.018 }} />
  </>;
}

function Academy() {
  const palette = useMemo(storyPalette, []);
  const lamp = useRef<THREE.PointLight>(null);
  const sign = useMemo(() => storyTexture(["한빛 학원", "HANBIT ACADEMY", "EVENING CLASS · 20:00"], true), []);
  useFrame(({ camera, clock }) => {
    if (lamp.current) lamp.current.intensity = camera.position.distanceTo(new THREE.Vector3(-29, 2, 2)) < 8 && Math.sin(clock.elapsedTime * 9) > 0.7 ? 1 : 7;
  });
  return <>
    <StorySolid position={[-33, 1.7, 2]} size={[0.2, 3.4, 5]} />
    <StorySolid position={[-31, 3.5, 2]} size={[4.2, 0.25, 5]} />
    <mesh position={[-32.88, 2.65, 2]} rotation-y={Math.PI / 2}><planeGeometry args={[3.2, 1.1]} /><meshStandardMaterial map={sign} emissiveMap={sign} emissive={palette.warm} emissiveIntensity={0.8} /></mesh>
    <pointLight ref={lamp} position={[-31, 2.8, 2]} color={palette.warm} intensity={7} distance={10} />
    <StoryPanel id="academy-roster" position={[-32.85, 1.4, 2]} rotationY={Math.PI / 2} title="The last evening class" body="The attendance sheet ends midweek. Beside one absent student's name: ‘Mother collecting her after class. Leave the light on.’" lines={["출석부 / ATTENDANCE", "WEDNESDAY: 7 PRESENT", "LEAVE THE LIGHT ON"]} />
    <StoryZone id="academy" position={[-30, 1.7, 2]} radius={4} sound={{ kind: "drone", notes: [440, 554.4], type: "sine", gain: 0.012 }} />
  </>;
}

function QuietRoom() {
  // Store flag (not local state): the hidden portal inside gates on this door.
  const open = useGameStore((s) => s.flags["quiet-room-door"] ?? false);
  const palette = useMemo(storyPalette, []);
  return <>
    <StorySolid position={[-29, -0.08, -9]} size={[6, 0.15, 6]} role="paper" />
    <StorySolid position={[-32, 1.6, -9]} size={[0.2, 3.2, 6]} />
    <StorySolid position={[-26, 1.6, -9]} size={[0.2, 3.2, 6]} />
    <StorySolid position={[-29, 1.6, -12]} size={[6, 3.2, 0.2]} />
    <StorySolid position={[-29, 3.2, -9]} size={[6.2, 0.15, 6.2]} />
    {[-31.1, -26.9].map((x) => <StorySolid key={x} position={[x, 1.6, -6]} size={[1.8, 3.2, 0.2]} />)}
    <Door id="quiet-room-door" position={[-29, 1.5, -6]} size={[2.3, 3, 0.12]} color={palette.metal} accent={palette.warm} open={open} onToggle={(v) => useGameStore.getState().setFlag("quiet-room-door", v)} promptOpen="open the caretaker's room" />
    <pointLight position={[-29, 2.6, -9]} color={palette.warm} intensity={8} distance={8} />
    <StorySolid position={[-30, 0.65, -10.5]} size={[2.2, 0.12, 1]} role="paper" />
    <StoryPanel id="room-letter" position={[-30, 0.73, -10.5]} flat size={[0.65, 0.5]} title="A letter never sent" body="‘I kept the academy key. When the heating comes back, we'll return together.’ A child's drawing is folded inside. No forwarding address." lines={["WHEN THE HEATING", "COMES BACK", "WE'LL RETURN TOGETHER"]} />
    <StoryPanel id="family-photo" position={[-28, 1.5, -11.88]} title="Three silhouettes" body="A faded photograph of three people at the playground. Someone has circled the academy light in the background." lines={["○    ○    ○", " /|\u005c   /|\u005c   /|\u005c", "HANBIT · WINTER 2019"]} />
    <StoryZone id="caretaker-room" position={[-29, 1.7, -9]} radius={2.3} title="The caretaker's room" body="A key, an unfinished letter, and a photograph. Nothing was packed for a long absence." sound={{ kind: "noise", filter: "lowpass", frequency: 180, gain: 0.035 }} />
  </>;
}

function BusStop() {
  const palette = useMemo(storyPalette, []);
  return <>
    {[-7, -3].map((x) => <StorySolid key={x} position={[x, 1.3, 18]} size={[0.12, 2.6, 0.12]} />)}
    <StorySolid position={[-5, 2.65, 18]} size={[4.5, 0.15, 1.5]} />
    <StorySolid position={[-5, 0.5, 18]} size={[3.4, 0.12, 0.55]} role="snow" />
    <StoryPanel id="bus-timetable" position={[-7, 1.6, 18.08]} title="The missing last bus" body="Route 27: the last departure has been scratched out. Someone wrote ‘Wait at the academy instead’ under the torn timetable." lines={["27 / 막차", "22:10  — CANCELLED", "WAIT AT THE ACADEMY"]} />
    <mesh position={[-5, 2.45, 18]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color={palette.warm} /></mesh>
    <StoryZone id="bus-pa" position={[-5, 1.7, 18]} radius={8} sound={{ kind: "drone", notes: [330, 440, 660], type: "sine", gain: 0.016 }} />
  </>;
}

export function WhiteSilenceStory() {
  return <><Footprints /><Playground /><Academy /><QuietRoom /><BusStop />
    <Inspectable id="snow-tracks" position={[-9, 0.08, 4]} marker={false} title="Two sets of tracks" body="An adult and a child walked this way together. Fresh snowfall is slowly filling their footprints." prompt="examine the footprints" />
    {portalsInWorld("white-silence").map((p) => <PortalGate key={p.id} def={p} />)}
  </>;
}