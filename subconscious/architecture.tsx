import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { dreamPalette, stoneTexture } from './palette';
import { ease, proximity, type V3 } from './rules';

export function Stone({ position, size, rotation = [0, 0, 0], solid = false }: { position: V3; size: V3; rotation?: V3; solid?: boolean }) {
  const palette = useMemo(dreamPalette, []);
  const texture = useMemo(stoneTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const mesh = <mesh castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={palette.stone} map={texture} roughness={0.5} metalness={0.18} /></mesh>;
  return solid ? <RigidBody type="fixed" colliders={false} position={position} rotation={rotation}><CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />{mesh}</RigidBody> : <group position={position} rotation={rotation}>{mesh}</group>;
}

export function Arch({ position, scale = 1, rotationY = 0 }: { position: V3; scale?: number; rotationY?: number }) {
  return <group position={position} rotation-y={rotationY} scale={scale}>
    <Stone position={[-3.3, 4.5, 0]} size={[1.2, 9, 1.6]} />
    <Stone position={[3.3, 4.5, 0]} size={[1.2, 9, 1.6]} />
    <Stone position={[0, 8.5, 0]} size={[7.8, 1.2, 1.6]} />
  </group>;
}

export function ImpossibleStairs({ position, rotation = [0, 0, 0] }: { position: V3; rotation?: V3 }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const palette = useMemo(dreamPalette, []);
  useEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Object3D();
    for (let i = 0; i < 26; i++) { m.position.set(0, i * 0.34, -i * 0.7); m.updateMatrix(); ref.current.setMatrixAt(i, m.matrix); }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={ref} args={[undefined, undefined, 26]} position={position} rotation={rotation} castShadow><boxGeometry args={[3.4, 0.3, 0.9]} /><meshStandardMaterial color={palette.stone} metalness={0.25} roughness={0.4} /></instancedMesh>;
}

export function ReactiveSculpture({ position, variant = 0 }: { position: V3; variant?: number }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const amount = useRef(0);
  const palette = useMemo(dreamPalette, []);
  useFrame(({ camera, clock }, delta) => {
    const distance = Math.hypot(camera.position.x - position[0], camera.position.z - position[2]);
    amount.current = ease(amount.current, proximity(distance, 14), delta);
    const a = amount.current;
    if (group.current) { group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.4 + variant) * 0.22 + a * 1.3; group.current.rotation.y = clock.elapsedTime * 0.08 + a * 0.6; }
    if (inner.current) { inner.current.rotation.z = -clock.elapsedTime * 0.13; inner.current.scale.setScalar(0.8 + a * 0.4); }
    if (material.current) material.current.emissiveIntensity = 0.15 + a * 0.8;
    if (light.current) light.current.intensity = 2 + a * 10;
  });
  return <group ref={group} position={position}>
    <mesh rotation={[0.3, 0, 0.4]}><torusGeometry args={[2.3, 0.13, 8, 48]} /><meshStandardMaterial color={palette.silver} metalness={0.85} roughness={0.18} /></mesh>
    <mesh ref={inner}><octahedronGeometry args={[1.15]} /><meshStandardMaterial ref={material} color={palette.memory} emissive={palette.memory} emissiveIntensity={0.2} metalness={0.5} roughness={0.15} wireframe={variant === 1} /></mesh>
    <pointLight ref={light} color={palette.memory} intensity={2} distance={15} />
  </group>;
}