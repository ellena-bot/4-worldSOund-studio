import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { abyssPalette } from './palette';

export function OceanAtmosphere() {
  const p = useMemo(abyssPalette, []); const points = useRef<THREE.Points>(null); const caustic = useRef<THREE.Mesh>(null); const light = useRef<THREE.DirectionalLight>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i++) { a[i * 3] = (i % 2 ? -1 : 1) * (7 + i * 13 % 65); a[i * 3 + 1] = i * 7 % 36 - 12; a[i * 3 + 2] = 20 - i * 17 % 160; }
    return a;
  }, []);
  const shader = useMemo(() => ({ time: { value: 0 }, tint: { value: new THREE.Color(p.signal) } }), [p.signal]);
  useFrame(({ clock }) => {
    if (points.current) { points.current.position.y = Math.sin(clock.elapsedTime * 0.08) * 1.8; points.current.rotation.z = Math.sin(clock.elapsedTime * 0.03) * 0.015; }
    shader.time.value = clock.elapsedTime;
    if (light.current) light.current.intensity = 2.2 + Math.sin(clock.elapsedTime * 0.17) * 0.08;
  });
  return <>
    <color attach="background" args={[p.ocean]} /><fog attach="fog" args={[p.ocean, 30, 140]} />
    <hemisphereLight args={[p.haze, p.ink, 1.2]} />
    <directionalLight ref={light} position={[20, 45, -40]} color={p.glass} intensity={2.2} />
    <Environment frames={1} resolution={64}><Lightformer position={[0, 20, -40]} rotation-x={Math.PI / 2} scale={[50, 80, 1]} color={p.light} intensity={1.6} /><Lightformer position={[25, 6, -80]} rotation-y={-Math.PI / 2} scale={[50, 15, 1]} color={p.signal} intensity={1.4} /></Environment>
    <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color={p.glass} size={0.045} transparent opacity={0.32} depthWrite={false} /></points>
    {/* Local animated light network on the floor, never a full-screen overlay. */}
    <mesh ref={caustic} rotation-x={-Math.PI / 2} position={[0, 0.013, -45]}><planeGeometry args={[26, 140]} /><shaderMaterial transparent depthWrite={false} uniforms={shader} vertexShader={'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}'} fragmentShader={'uniform float time; uniform vec3 tint; varying vec2 vUv; void main(){vec2 p=vUv*vec2(38.0,120.0);float a=sin(p.x+sin(p.y*.7+time*.14)*1.3);float b=sin(p.y+cos(p.x*.8-time*.11)*1.3);float line=pow(max(0.0,1.0-abs(a+b)*2.5),8.0);gl_FragColor=vec4(tint,line*.085);}'} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * 23, 15, -78]} rotation-z={side * -0.3}><coneGeometry args={[4, 38, 20, 1, true]} /><meshBasicMaterial color={p.signal} transparent opacity={0.018} side={THREE.DoubleSide} depthWrite={false} /></mesh>)}
  </>;
}