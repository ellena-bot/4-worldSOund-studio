// Dynamic snowfall: one Points cloud that wraps around the camera.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

const COUNT = 1800;
const AREA = 70;
const TOP = 18;

export function Snowfall() {
  const geo = useRef<THREE.BufferGeometry>(null);
  const { positions, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * AREA;
      positions[i * 3 + 1] = Math.random() * TOP;
      positions[i * 3 + 2] = (Math.random() - 0.5) * AREA;
      speeds[i] = 1.1 + Math.random() * 1.7;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, phases };
  }, []);

  useFrame(({ camera, clock }, delta) => {
    const g = geo.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const attr = g.attributes["position"] as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const cx = camera.position.x;
    const cz = camera.position.z;
    for (let i = 0; i < COUNT; i++) {
      const phase = phases[i] ?? 0;
      const speed = speeds[i] ?? 1;
      arr[i * 3] = (arr[i * 3] ?? 0) + Math.sin(t * 0.6 + phase) * 0.25 * dt;
      let y = (arr[i * 3 + 1] ?? TOP) - speed * dt;
      if (y < 0) {
        y = TOP;
        arr[i * 3] = cx + (Math.random() - 0.5) * AREA;
        arr[i * 3 + 2] = cz + (Math.random() - 0.5) * AREA;
      }
      arr[i * 3 + 1] = y;
    }
    attr.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#e8eefb" transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
}
