import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Inspectable } from "@/game/scene/interactables";
import { StoryZone } from "@/game/scene/storytelling";
import { PortalGate } from "@/game/scene/PortalGate";
import { portalsInWorld } from "@/game/portals";
import { StoryPanel, storyPalette, storyTexture } from "@/game/scene/storyProps";
import { useGameStore } from "@/game/state";

function WatchDisplay({ down }: { down: boolean }) {
  const textures = useMemo(() => ({ normal: storyTexture(["MINISTRY OF ORDER", "MOVE ALONG", "CURFEW 22:00"], true), near: storyTexture(["CITIZEN DETECTED", "YOUR VISIT IS LOGGED", "COMPLIANCE REQUIRED"], true), free: storyTexture(["THE EYES ARE CLOSED", "CELL 7 IS LISTENING", "WE WERE NEVER ALONE"], true) }), []);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const palette = useMemo(storyPalette, []);
  useFrame(({ camera }) => {
    if (!material.current) return;
    const texture = down ? textures.free : Math.hypot(camera.position.x - 8, camera.position.z - 5) < 5 ? textures.near : textures.normal;
    material.current.map = texture;
    material.current.emissiveMap = texture;
  });
  return <mesh position={[8, 2.4, 5]} rotation-y={-Math.PI / 2}><planeGeometry args={[2.4, 1.8]} /><meshStandardMaterial ref={material} map={textures.normal} emissive={palette.signal} emissiveMap={textures.normal} emissiveIntensity={0.65} side={THREE.DoubleSide} /></mesh>;
}

export function RevolutionStory() {
  const down = useGameStore((s) => s.flags["surveillance-down"] ?? false);
  const gateOpen = useGameStore((s) => s.flags["gate-open"] ?? false);
  const palette = useMemo(storyPalette, []);
  return <>
    <WatchDisplay down={down} />
    <StoryPanel id="resistance-mark" position={[-15.85, 1.1, -8]} rotationY={Math.PI / 2} title="The crossed eye" body="Under the torn poster: an eye crossed by seven strokes. A small arrow points toward the opening in the pavement." lines={["⊗ / VII", "LOOK BELOW", "FOLLOW THE RAMP"]} dark size={[0.65, 0.5]} />
    <StoryPanel id="protest-remnant" position={[7.5, 0.03, 16]} flat title="A protest erased" body="Rain has blurred the faces on a March 14 poster. The slogan remains: ‘A city is its people, not its cameras.’" lines={["14 MARCH", "WE ARE THE CITY", "NOT ITS CAMERAS"]} />
    <Inspectable id="broken-camera" position={[-8, 0.4, 1]} marker={false} title="A severed camera" body="The lens is intact, but its cable was cut cleanly. Someone disabled it without damaging the recordings." prompt="inspect the damaged camera">
      <mesh rotation-z={0.25}><boxGeometry args={[0.6, 0.25, 0.25]} /><meshStandardMaterial color={palette.metal} metalness={0.7} roughness={0.4} /></mesh>
      <mesh position={[0, 0, 0.14]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.09, 0.09, 0.04, 12]} /><meshStandardMaterial color={palette.ink} metalness={0.8} /></mesh>
    </Inspectable>
    <StoryPanel id="cell-map" position={[-14, -2.4, -31.96]} title="Seven cells, one city" body="Transit routes connect seven marked meeting points. Each cell kept only part of the network. The Ministry called them isolated incidents." lines={["CELL 7 / TRANSIT MAP", "01 — 03 — 07", "NO ONE STANDS ALONE"]} dark size={[1, 0.7]} />
    <StoryPanel id="radio-log" position={[-18.6, -2.97, -30.5]} flat title="An unfinished transmission" body="‘If the boards change, the override worked. Leave the receiver on. Others will answer.’ The final line is a list of names, not call signs." lines={["RECEIVER LOG", "WAIT FOR THE BOARDS", "OTHERS WILL ANSWER"]} size={[0.6, 0.45]} />
    {down && <StoryPanel id="freedom-message" position={[8, 1.1, 5]} rotationY={-Math.PI / 2} title="The city answers" body="Below the liberated display, a hidden message becomes visible: ‘We kept the lights on for each other.’ Cell 7 was never alone." lines={["WE KEPT THE LIGHTS ON", "FOR EACH OTHER", "— CELL 7"]} dark />}
    <StoryZone id="resistance-hideout" position={[-13, -2.3, -23]} radius={2.6} title="Cell 7's hidden refuge" body="Below the watched streets: field notes, shared supplies, and a map of a city that refused to forget." sound={{ kind: "noise", filter: "bandpass", frequency: 620, q: 8, gain: 0.04 }} />
    <mesh position={[3.5, 2.3, -47.6]}><planeGeometry args={[0.2, 1.4]} /><meshBasicMaterial color={down || gateOpen ? palette.signal : palette.alert} toneMapped={false} /></mesh>
    {portalsInWorld("the-revolution").map((p) => <PortalGate key={p.id} def={p} />)}
  </>;
}