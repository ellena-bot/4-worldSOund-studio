import { useMemo } from "react";
import * as THREE from "three";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Inspectable, useHighlighted } from "./interactables";

export type StoryPosition = [number, number, number];
export function storyPalette() {
  const css = getComputedStyle(document.documentElement);
  const color = (key: string) => css.getPropertyValue(`--story-${key}`).trim();
  return { snow: color("snow"), metal: color("metal"), ink: color("ink"), paper: color("paper"), warm: color("warm"), resistance: color("resistance"), alert: color("alert"), signal: color("signal") };
}

export function storyTexture(lines: string[], dark = false) {
  const palette = storyPalette();
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 384;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  ctx.fillStyle = dark ? palette.ink ?? "" : palette.paper ?? "";
  ctx.fillRect(0, 0, 512, 384);
  ctx.fillStyle = dark ? palette.resistance ?? "" : palette.ink ?? "";
  ctx.strokeStyle = ctx.fillStyle;
  ctx.strokeRect(18, 18, 476, 348);
  lines.forEach((line, i) => {
    ctx.font = i === 0 ? "bold 32px sans-serif" : "22px monospace";
    ctx.fillText(line, 38, 76 + i * 52, 440);
  });
  // Weathered paper, not a pristine UI panel.
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 120; i++) ctx.fillRect((i * 71) % 512, (i * 47) % 384, 8, 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function StoryPanel({ id, position, title, body, lines, rotationY = 0, flat = false, dark = false, size = [0.8, 0.6] }: {
  id: string; position: StoryPosition; title: string; body: string; lines: string[];
  rotationY?: number; flat?: boolean; dark?: boolean; size?: [number, number];
}) {
  const texture = useMemo(() => storyTexture(lines, dark), [lines.join("|"), dark]);
  const palette = useMemo(storyPalette, []);
  const highlighted = useHighlighted(id);
  return <Inspectable id={id} position={position} title={title} body={body} marker={false} prompt="inspect">
    <mesh rotation={[flat ? -Math.PI / 2 : 0, rotationY, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={texture} emissive={palette.warm} emissiveIntensity={highlighted ? 0.24 : 0.07} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  </Inspectable>;
}

export function StorySolid({ position, size, role = "metal" }: { position: StoryPosition; size: StoryPosition; role?: keyof ReturnType<typeof storyPalette> }) {
  const palette = useMemo(storyPalette, []);
  return <RigidBody type="fixed" colliders={false} position={position}>
    <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
    <mesh castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={palette[role]} roughness={0.85} /></mesh>
  </RigidBody>;
}