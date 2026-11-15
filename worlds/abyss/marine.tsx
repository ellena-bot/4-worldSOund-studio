import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameAudio } from '@/game/GameRuntime';
import { useDiscovery } from '@/game/scene/storytelling';
import { useGameStore } from '@/game/state';
import { abyssPalette } from './palette';
import { whalePhase, whalePosition } from './rules';
import { whaleCall } from './audio';

// Smooth connected lathe body: head, belly, narrowing peduncle, separate articulated flukes.
function whaleBody() {
  return new THREE.LatheGeometry([[0.08, -14], [0.55, -12], [1, -10], [1.65, -7], [2.15, -3], [2.5, 1], [2.45, 4], [2.1, 7], [1.5, 9], [0.5, 10.5], [0, 10.8]].map(([r, z]) => new THREE.Vector2(r, z)), 28);
}
function flukeGeometry() {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(1, -1, 4.5, -2.2, 5.5, -1.6); s.bezierCurveTo(4, -0.4, 2.4, 1.3, 0, 0.35); s.bezierCurveTo(-2.4, 1.3, -4, -0.4, -5.5, -1.6); s.bezierCurveTo(-4.5, -2.2, -1, -1, 0, 0);
  return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 2, steps: 1, curveSegments: 10 });
}
export function WhaleEncounter() {
  const p = useMemo(abyssPalette, []); const group = useRef<THREE.Group>(null); const tail = useRef<THREE.Group>(null); const fin = useRef<THREE.Group>(null);
  const body = useMemo(whaleBody, []); const fluke = useMemo(flukeGeometry, []);
  useEffect(() => () => { body.dispose(); fluke.dispose(); }, [body, fluke]);
  const time = useRef(0); const wasVisible = useRef(false); const audio = useGameAudio(); const discover = useDiscovery();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __abyss?: unknown };
    w.__abyss = { encounter: (seconds: number) => { time.current = seconds; }, whale: () => ({ ...whalePhase(time.current), seconds: time.current }), audio: () => audio?.running ?? false };
    return () => { delete w.__abyss; };
  }, [audio]);
  useFrame(({ camera }, dt) => {
    if (!group.current) return;
    const inDeck = camera.position.z < -68 && camera.position.z > -96;
    if (inDeck && useGameStore.getState().locked) time.current += Math.min(dt, 0.05);
    const phase = whalePhase(time.current); group.current.visible = phase.visible;
    const at = whalePosition(phase.progress); group.current.position.set(...at); group.current.rotation.y = 0.08 * Math.sin(time.current * 0.12);
    if (tail.current) tail.current.rotation.x = Math.sin(time.current * 0.6) * 0.18;
    if (fin.current) fin.current.rotation.z = Math.sin(time.current * 0.4) * 0.12;
    if (phase.visible && !wasVisible.current && inDeck) {
      discover({ id: 'abyss-whale', title: 'A visitor from the dark', body: 'An immense whale crosses the observation window. The hydrophone answers with a lower call, from somewhere beneath it.', kind: 'event' });
      useGameStore.getState().showNotice('A visitor from the dark', 'Beyond the glass, something immense moves through the current.');
      void audio?.engine.current?.playOneShot(whaleCall, [15, 4, -82], 8);
    }
    wasVisible.current = phase.visible;
  });
  return <group ref={group} visible={false}>
    <mesh geometry={body} rotation-x={Math.PI / 2}><meshStandardMaterial color={p.whale} roughness={0.5} metalness={0.05} /></mesh>
    <mesh position={[0, -0.7, 5]} scale={[1.7, 1.1, 4.7]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={p.metal} roughness={0.6} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * 1.7, 0.4, 8]}><sphereGeometry args={[0.12, 12, 8]} /><meshStandardMaterial color={p.ink} roughness={0.05} /></mesh>)}
    <group ref={fin} position={[0, -0.7, 3]}>
      {[-1, 1].map(side => <mesh key={side} position={[side * 3.2, -0.3, -1.3]} rotation={[0, side * 0.5, side * -0.25]} scale={[3.5, 0.17, 1.1]}><sphereGeometry args={[1, 16, 8]} /><meshStandardMaterial color={p.whale} roughness={0.5} /></mesh>)}
    </group>
    <group ref={tail} position={[0, 0, -13]}><mesh geometry={fluke} rotation-x={Math.PI / 2}><meshStandardMaterial color={p.whale} roughness={0.5} /></mesh></group>
    <mesh position={[0, 2.1, -3]} rotation-z={-0.2} scale={[0.16, 0.85, 1.1]}><sphereGeometry args={[1, 16, 8]} /><meshStandardMaterial color={p.whale} /></mesh>
    {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[(i - 3) * 0.3, -1.65 + Math.abs(i - 3) * 0.05, 5]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.018, 0.018, 5.5, 5]} /><meshStandardMaterial color={p.ink} /></mesh>)}
  </group>;
}
function School() {
  const p = useMemo(abyssPalette, []); const fish = useRef<THREE.InstancedMesh>(null); const tails = useRef<THREE.InstancedMesh>(null); const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!fish.current || !tails.current) return;
    const t = clock.elapsedTime * 0.12;
    for (let i = 0; i < 36; i++) {
      const side = i < 18 ? -1 : 1; const angle = t + i * 0.16;
      const x = side * (12 + Math.sin(angle) * 4); const y = 3 + Math.sin(angle * 0.8 + i) * 2.5; const z = -28 + Math.cos(angle) * 12 + (i % 5) * 1.1;
      dummy.position.set(x, y, z); dummy.rotation.set(0, -angle, 0); dummy.scale.set(0.15, 0.25, 0.65); dummy.updateMatrix(); fish.current.setMatrixAt(i, dummy.matrix);
      dummy.position.z -= 0.7 * Math.cos(angle); dummy.position.x += 0.7 * Math.sin(angle); dummy.rotation.y += Math.sin(clock.elapsedTime * 2 + i) * 0.25; dummy.scale.set(0.08, 0.38, 0.25); dummy.updateMatrix(); tails.current.setMatrixAt(i, dummy.matrix);
    }
    fish.current.instanceMatrix.needsUpdate = true; tails.current.instanceMatrix.needsUpdate = true;
  });
  return <><instancedMesh ref={fish} args={[undefined, undefined, 36]} frustumCulled={false}><sphereGeometry args={[1, 10, 6]} /><meshStandardMaterial color={p.metal} metalness={0.55} roughness={0.3} /></instancedMesh><instancedMesh ref={tails} args={[undefined, undefined, 36]} frustumCulled={false}><coneGeometry args={[1, 1, 3]} /><meshStandardMaterial color={p.whale} roughness={0.5} /></instancedMesh></>;
}
function Jellyfish({ i }: { i: number }) {
  const p = useMemo(abyssPalette, []); const group = useRef<THREE.Group>(null); const bell = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) { group.current.position.set(-10 - i * 1.7 + Math.sin(t * 0.07 + i), 3 + (i % 3) * 1.5 + Math.sin(t * 0.22 + i) * 1.5, -18 - i * 7); group.current.rotation.z = Math.sin(t * 0.25 + i) * 0.1; }
    if (bell.current) bell.current.scale.set(1 + Math.sin(t * 1.1 + i) * 0.1, 1 - Math.sin(t * 1.1 + i) * 0.12, 1 + Math.sin(t * 1.1 + i) * 0.1);
  });
  return <group ref={group}>
    <mesh ref={bell}><sphereGeometry args={[0.65, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={p.life} emissive={p.life} emissiveIntensity={0.3} transparent opacity={0.45} side={THREE.DoubleSide} /></mesh>
    {Array.from({ length: 6 }, (_, j) => <mesh key={j} position={[Math.cos(j) * 0.4, -0.8, Math.sin(j) * 0.4]} rotation-z={Math.sin(j) * 0.1}><cylinderGeometry args={[0.015, 0.008, 1.6 + j % 2 * 0.5, 5]} /><meshStandardMaterial color={p.life} emissive={p.life} emissiveIntensity={0.5} transparent opacity={0.45} /></mesh>)}
  </group>;
}
function DeepOrganism() {
  const p = useMemo(abyssPalette, []); const group = useRef<THREE.Group>(null); const tendrils = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) { group.current.position.set(-25 + Math.sin(t * 0.04) * 6, 5 + Math.sin(t * 0.1) * 2, -87 + Math.cos(t * 0.04) * 10); group.current.rotation.y = t * 0.04; }
    if (tendrils.current) tendrils.current.rotation.x = Math.sin(t * 0.6) * 0.13;
  });
  return <group ref={group}>
    <mesh scale={[0.7, 0.7, 2.7]}><sphereGeometry args={[1, 20, 12]} /><meshStandardMaterial color={p.ink} roughness={0.4} metalness={0.25} /></mesh>
    <group ref={tendrils} position={[0, 0, -2]}>{Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 4) * 0.5, Math.sin(i * Math.PI / 4) * 0.5, -2]} rotation={[Math.sin(i) * 0.2, Math.cos(i) * 0.2, 0]}><cylinderGeometry args={[0.08, 0.015, 4.5, 6]} /><meshStandardMaterial color={p.whale} roughness={0.45} /></mesh>)}</group>
    {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[0.62, -0.1, 1.6 - i * 0.55]}><sphereGeometry args={[0.045, 8, 6]} /><meshStandardMaterial color={p.life} emissive={p.life} emissiveIntensity={0.65} /></mesh>)}
  </group>;
}
export function MarineLife() { return <><School />{[0, 1, 2, 3, 4].map(i => <Jellyfish key={i} i={i} />)}<DeepOrganism /><WhaleEncounter /></>; }