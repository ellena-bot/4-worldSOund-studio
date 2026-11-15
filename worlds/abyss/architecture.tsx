import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { abyssPalette, metalTexture, signTexture } from './palette';
import { FACILITY, type V3 } from './rules';

export function Metal({ position, size, solid = false, dark = false }: { position: V3; size: V3; solid?: boolean; dark?: boolean }) {
  const p = useMemo(abyssPalette, []);
  const mesh = <mesh castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={dark ? p.ink : p.metal} metalness={0.72} roughness={0.48} /></mesh>;
  return solid ? <RigidBody type="fixed" colliders={false} position={position}><CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />{mesh}</RigidBody> : <group position={position}>{mesh}</group>;
}
export function Sign({ position, lines, rotationY = 0, size = [5, 1.25] }: { position: V3; lines: string[]; rotationY?: number; size?: [number, number] }) {
  const map = useMemo(() => signTexture(lines), [lines.join('|')]); useEffect(() => () => map.dispose(), [map]);
  return <mesh position={position} rotation-y={rotationY}><planeGeometry args={size} /><meshBasicMaterial map={map} side={THREE.DoubleSide} /></mesh>;
}
export function FacilityShell() {
  const p = useMemo(abyssPalette, []); const floor = useMemo(metalTexture, []); useEffect(() => () => floor.dispose(), [floor]);
  return <>
    {FACILITY.map((s, index) => {
      const length = s.start - s.end; const center = (s.start + s.end) / 2; const w = s.width;
      const glass = index === 1 || index === 3 || index === 0;
      return <group key={s.id}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[w / 2, 0.3, length / 2]} position={[0, -0.3, center]} />
          <CuboidCollider args={[0.18, 4, length / 2]} position={[-w / 2, 4, center]} />
          <CuboidCollider args={[0.18, 4, length / 2]} position={[w / 2, 4, center]} />
          <CuboidCollider args={[w / 2, 0.2, length / 2]} position={[0, 8, center]} />
        </RigidBody>
        <mesh position={[0, -0.3, center]} receiveShadow><boxGeometry args={[w, 0.6, length]} /><meshStandardMaterial map={floor} color={p.metal} metalness={0.65} roughness={0.4} /></mesh>
        {[-1, 1].map(side => <group key={side}>
          <Metal position={[side * w / 2, 0.5, center]} size={[0.35, 1, length]} dark />
          <mesh position={[side * w / 2, 4.3, center]}><boxGeometry args={[0.06, 6.6, length]} /><meshPhysicalMaterial color={glass ? p.glass : p.ink} metalness={glass ? 0.15 : 0.65} roughness={glass ? 0.12 : 0.5} transparent={glass} opacity={glass ? 0.085 : 1} side={THREE.DoubleSide} depthWrite={!glass} envMapIntensity={1.5} /></mesh>
          <mesh position={[side * (w / 2 - 0.3), 0.09, center]}><boxGeometry args={[0.08, 0.04, length]} /><meshBasicMaterial color={index === 4 ? p.alert : p.signal} /></mesh>
        </group>)}
        <mesh position={[0, 7.9, center]}><boxGeometry args={[w, 0.12, length]} /><meshPhysicalMaterial color={glass ? p.glass : p.ink} transparent={glass} opacity={glass ? 0.05 : 1} depthWrite={!glass} side={THREE.DoubleSide} roughness={0.2} metalness={0.3} /></mesh>
        {Array.from({ length: Math.ceil(length / 6) }, (_, i) => {
          const z = s.start - 1 - i * 6;
          return <group key={i}>
            <Metal position={[-w / 2 + 0.12, 4, z]} size={[0.26, 8, 0.32]} />
            <Metal position={[w / 2 - 0.12, 4, z]} size={[0.26, 8, 0.32]} />
            <Metal position={[0, 7.7, z]} size={[w, 0.32, 0.32]} />
            <mesh position={[0, 7.48, z]}><boxGeometry args={[w * 0.65, 0.05, 0.1]} /><meshBasicMaterial color={index === 4 ? p.alert : p.light} /></mesh>
          </group>;
        })}
        <pointLight position={[0, 5, center]} color={index === 4 ? p.alert : p.light} intensity={index === 4 ? 18 : 65} distance={length + 12} decay={2} />
      </group>;
    })}
    {/* Solid shoulders at width changes leave only the adjoining corridor open. */}
    {FACILITY.slice(0, -1).map((s, i) => {
      const next = FACILITY[i + 1]; if (!next) return null;
      const wide = Math.max(s.width, next.width); const narrow = Math.min(s.width, next.width); const shoulder = (wide - narrow) / 2;
      return [-1, 1].map(side => <Metal key={`${i}-${side}`} position={[side * (narrow / 2 + shoulder / 2), 4, s.end]} size={[shoulder, 8, 0.4]} solid dark />);
    })}
    <Metal position={[0, 4, 18]} size={[16, 8, 0.4]} solid dark />
    <Metal position={[0, 4, -116]} size={[10, 8, 0.4]} solid dark />
    <Sign position={[0, 4.5, 17.75]} lines={['NEREID / ARRIVAL', 'DEPTH 2,840 M  /  CREW 00']} />
    <Sign position={[0, 6.7, -1.6]} lines={['01 / GLASS TRANSIT', 'RESEARCH  →  OBSERVATION']} />
    <Sign position={[0, 6.7, -45.6]} lines={['02 / RESEARCH', 'NEREID BATHYAL FACILITY']} />
    <Sign position={[0, 6.7, -67.6]} lines={['03 / OBSERVATION', 'PASSIVE LISTENING ONLY']} />
    <Sign position={[0, 6.7, -95.5]} lines={['04 / RESTRICTED', 'AUTHORIZED PERSONNEL']} />
  </>;
}