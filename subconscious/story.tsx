import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Inspectable, useInteractable, useHighlighted } from '@/game/scene/interactables';
import { StoryZone, useDiscovery } from '@/game/scene/storytelling';
import { PortalGate } from '@/game/scene/PortalGate';
import { portalsInWorld } from '@/game/portals';
import { useGameAudio } from '@/game/GameRuntime';
import { useGameStore } from '@/game/state';
import { dreamPalette } from './palette';
import { ZONES, ease, type V3 } from './rules';

function Memory({ id, position, title, body }: { id: string; position: V3; title: string; body: string }) {
  const palette = useMemo(dreamPalette, []);
  const discover = useDiscovery(); const audio = useGameAudio();
  const highlighted = useHighlighted(id);
  const found = useGameStore(s => s.flags[id] ?? false);
  const sculpture = useRef<THREE.Group>(null);
  const particles = useRef<THREE.Points>(null);
  const amount = useRef(0);
  const locations = useMemo(() => {
    const data = new Float32Array(64 * 3);
    for (let i = 0; i < 64; i++) { const angle = i * 2.39996; data[i * 3] = Math.cos(angle) * (0.6 + (i % 7) * 0.12); data[i * 3 + 1] = (i % 11) * 0.15 - 0.5; data[i * 3 + 2] = Math.sin(angle) * (0.6 + (i % 7) * 0.12); }
    return data;
  }, []);
  useInteractable({ id, position, radius: 3.2, prompt: found ? 'revisit the memory' : 'remember', onInteract: () => {
    const fresh = discover({ id, title, body, kind: 'clue' }, position);
    useGameStore.getState().setFlag(id, true); useGameStore.getState().showNotice(title, body);
    if (fresh) void audio?.engine.current?.playOneShot({ kind: 'dream-echo', notes: [293.66, 440, 587.33], gain: 0.14 }, position, 2.4);
  } });
  useFrame(({ clock }, dt) => {
    amount.current = ease(amount.current, found ? 1 : highlighted ? 0.35 : 0, dt);
    if (sculpture.current) { sculpture.current.rotation.y = clock.elapsedTime * 0.22; sculpture.current.scale.setScalar(1 + amount.current * 0.4); }
    if (particles.current) { particles.current.rotation.y = -clock.elapsedTime * 0.16; particles.current.visible = amount.current > 0.02; }
  });
  return <group position={position}>
    <mesh position={[0, -1.05, 0]}><cylinderGeometry args={[0.9, 1.15, 0.3, 32]} /><meshStandardMaterial color={palette.silver} metalness={0.7} roughness={0.3} /></mesh>
    <group ref={sculpture}>
      {[0, 1, 2].map(i => <mesh key={i} rotation={[i * 0.8, i * 0.5, i * 0.9]}><torusGeometry args={[0.6 + i * 0.16, 0.025, 6, 48]} /><meshStandardMaterial color={palette.light} emissive={palette.memory} emissiveIntensity={found ? 1 : 0.3} metalness={0.7} roughness={0.2} /></mesh>)}
      <mesh><icosahedronGeometry args={[0.22, 0]} /><meshBasicMaterial color={palette.memory} /></mesh>
    </group>
    <points ref={particles}><bufferGeometry><bufferAttribute attach="attributes-position" args={[locations, 3]} /></bufferGeometry><pointsMaterial color={palette.light} size={0.055} transparent opacity={0.7} depthWrite={false} /></points>
  </group>;
}
export function SubconsciousStory({ unlocked }: { unlocked: boolean }) {
  const palette = useMemo(dreamPalette, []);
  return <>
    {ZONES.filter(z => unlocked || z.id !== 'sanctuary').map(z => <StoryZone key={z.id} id={`dream-${z.id}`} position={z.position} radius={z.radius} title={z.title} body={z.body} sound={{ kind: 'dream-echo', notes: z.id === 'sanctuary' ? [220, 329.63, 440] : [146.83, 220], gain: 0.035 }} />)}
    <Memory id="dream-memory-1" position={[-4, 1.5, -14]} title="A room before language" body="Sunlight across an empty floor. Someone waited here, without knowing your name." />
    <Memory id="dream-memory-2" position={[25, 1.5, -31]} title="The other shore" body="A hand touched the water. The reflection stayed behind. Two fragments now form a doorway." />
    <Inspectable id="dream-sanctuary-heart" position={[0, 1.5, -81]} marker={false} radius={3} title="The still point" body="The missing room was never lost. It was the space you left for yourself." prompt="touch the still point">
      <mesh><torusKnotGeometry args={[0.6, 0.16, 64, 8]} /><meshStandardMaterial color={palette.light} emissive={palette.memory} emissiveIntensity={0.55} metalness={0.8} roughness={0.1} /></mesh>
    </Inspectable>
    {portalsInWorld('subconscious').map(p => <PortalGate key={p.id} def={p} />)}
  </>;
}