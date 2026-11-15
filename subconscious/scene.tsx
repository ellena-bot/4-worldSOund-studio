import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { InteractionSystem } from '@/game/scene/InteractionSystem';
import { Door } from '@/game/scene/interactables';
import { useGameStore } from '@/game/state';
import { Arch, ImpossibleStairs, ReactiveSculpture, Stone } from './architecture';
import { dreamPalette } from './palette';
import { PATHS, TERRACES, ease, proximity, sanctuaryUnlocked } from './rules';
import { SubconsciousStory } from './story';

function DreamAtmosphere() {
  const palette = useMemo(dreamPalette, []);
  const distant = useRef<THREE.Group>(null);
  const fog = useRef<THREE.Fog>(null);
  useFrame(({ camera }, dt) => {
    if (fog.current) { fog.current.far = ease(fog.current.far, 110 + proximity(Math.abs(camera.position.z + 58), 35) * 65, dt, 0.5); }
    if (distant.current) distant.current.position.y = ease(distant.current.position.y, 11 - proximity(Math.abs(camera.position.z + 58), 30) * 5, dt, 0.6);
  });
  return <>
    <color attach="background" args={[palette.sky]} />
    <fog ref={fog} attach="fog" args={[palette.sky, 25, 110]} />
    <hemisphereLight args={[palette.light, palette.water, 1.8]} />
    <directionalLight position={[-20, 35, 15]} color={palette.light} intensity={3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-65} shadow-camera-right={65} shadow-camera-top={35} shadow-camera-bottom={-110} shadow-camera-far={170} shadow-bias={-0.0005} />
    <Environment resolution={64} frames={1}>
      <Lightformer intensity={2} color={palette.light} position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
      <Lightformer intensity={1.5} color={palette.memory} position={[-20, 3, -20]} rotation-y={Math.PI / 2} scale={[40, 10, 1]} />
    </Environment>
    <group ref={distant} position={[0, 11, 0]}>
      <Arch position={[-40, 0, -74]} scale={4} rotationY={0.3} />
      <Arch position={[48, 10, -95]} scale={3} rotationY={-0.4} />
      <ImpossibleStairs position={[-30, 12, -55]} rotation={[0, -0.6, Math.PI / 2]} />
    </group>
  </>;
}

function RevealingPath({ unlocked }: { unlocked: boolean }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const palette = useMemo(dreamPalette, []);
  useFrame((_, dt) => { if (mat.current) mat.current.opacity = ease(mat.current.opacity, unlocked ? 0.9 : 0.035, dt, 1.5); });
  // Permanent collision protects explorers during the reveal; the sanctuary gate enforces access.
  return <RigidBody type="fixed" colliders={false} position={[0, -0.4, -70]}>
    <CuboidCollider args={[4, 0.4, 7]} />
    <mesh receiveShadow><boxGeometry args={[8, 0.8, 14]} /><meshStandardMaterial ref={mat} color={palette.memory} metalness={0.5} roughness={0.3} transparent opacity={0.035} depthWrite={false} /></mesh>
  </RigidBody>;
}

export function SubconsciousScene() {
  const palette = useMemo(dreamPalette, []);
  const flags = useGameStore(s => s.flags);
  const unlocked = sanctuaryUnlocked(flags);
  const open = flags['dream-sanctuary-door'] ?? false;
  const reflectionOpen = flags['dream-reflection-door'] ?? false;
  return <>
    <DreamAtmosphere />
    {/* Shallow collidable basin catches every missed edge without changing the controller. */}
    <RigidBody type="fixed" colliders={false} position={[0, -1.2, -40]}><CuboidCollider args={[90, 0.3, 100]} /></RigidBody>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[0.4, 6, 100]} position={[-89, 3, -40]} />
      <CuboidCollider args={[0.4, 6, 100]} position={[89, 3, -40]} />
      <CuboidCollider args={[90, 6, 0.4]} position={[0, 3, 59]} />
      <CuboidCollider args={[90, 6, 0.4]} position={[0, 3, -139]} />
    </RigidBody>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.78, -40]} receiveShadow>
      <planeGeometry args={[180, 200]} />
      <MeshReflectorMaterial resolution={256} mirror={0.65} mixStrength={0.65} mixBlur={0} color={palette.water} metalness={0.65} roughness={0.18} depthScale={0} />
    </mesh>
    {TERRACES.map((t, i) => <Stone key={`terrace-${i}`} position={t.position} size={t.size} solid />)}
    {PATHS.filter(p => !p.secret).map((p, i) => <Stone key={`path-${i}`} position={p.position} size={p.size} solid />)}
    <RevealingPath unlocked={unlocked} />
    <Arch position={[0, 0, 1]} />
    <Arch position={[0, 6, -20]} scale={1.8} rotationY={0.18} />
    <Arch position={[-13, 3, -16]} scale={0.9} rotationY={Math.PI / 2} />
    <ImpossibleStairs position={[-10, 6, -9]} rotation={[0, -0.4, 0]} />
    <ImpossibleStairs position={[10, 18, -26]} rotation={[0, Math.PI / 2, Math.PI]} />
    <Stone position={[0, 15, -21]} size={[21, 0.9, 5]} />
    <Stone position={[-13, 13, -22]} size={[0.8, 20, 6]} rotation={[0, 0, 0.35]} />
    <ReactiveSculpture position={[4, 4.2, -14]} />
    <ReactiveSculpture position={[18, 4, -30]} variant={1} />
    <Arch position={[22, 0, -43]} scale={0.7} />
    <Door id="dream-reflection-door" position={[22, 2.4, -43]} size={[3.8, 4.8, 0.22]} color={palette.silver} accent={palette.light} open={reflectionOpen} onToggle={v => useGameStore.getState().setFlag('dream-reflection-door', v)} promptOpen="open the far doorway" promptClose="close the far doorway" slide="up" />
    {[0, 1, 2, 3].map(i => <group key={i} position={[22, 8 + i * 2, -58]} rotation={[i * 0.35, i * 0.5, i * 0.2]}>
      <Arch position={[-5, -4, 0]} scale={1.5 - i * 0.15} rotationY={Math.PI / 2} />
    </group>)}
    <ReactiveSculpture position={[26, 4, -57]} variant={2} />
    <ImpossibleStairs position={[30, 5, -62]} rotation={[Math.PI / 2, 0, 0.5]} />
    {/* Gate spans the complete secret walkway: memories cannot be bypassed at its edges. */}
    <Door id="dream-sanctuary-door" position={[0, 2.5, -72]} size={[8, 5, 0.35]} color={palette.silver} accent={palette.memory} open={open} onToggle={v => useGameStore.getState().setFlag('dream-sanctuary-door', v)} lockedNotice={unlocked ? undefined : { title: 'An incomplete memory', body: 'Two fragments wait among the floating architecture and beside the water.' }} promptOpen={unlocked ? 'enter the sanctuary' : 'listen to the sealed doorway'} promptClose="close the sanctuary" slide="up" />
    <Stone position={[-6, 3, -72]} size={[4, 6, 0.8]} solid />
    <Stone position={[6, 3, -72]} size={[4, 6, 0.8]} solid />
    <Stone position={[0, 6.4, -72]} size={[16, 0.8, 1]} />
    <Stone position={[-7.6, 3, -80]} size={[0.8, 6, 16]} solid />
    <Stone position={[7.6, 3, -80]} size={[0.8, 6, 16]} solid />
    <Stone position={[0, 3, -87.6]} size={[16, 6, 0.8]} solid />
    <mesh position={[0, 5, -81]} rotation-x={Math.PI / 2}><torusGeometry args={[3.4, 0.06, 6, 64]} /><meshBasicMaterial color={palette.light} /></mesh>
    <pointLight position={[0, 4, -80]} color={palette.memory} intensity={18} distance={17} />
    <SubconsciousStory unlocked={unlocked} />
    <InteractionSystem />
  </>;
}