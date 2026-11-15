import * as THREE from 'three';
export function dreamPalette() {
  const css = getComputedStyle(document.documentElement);
  const color = (role: string) => css.getPropertyValue(`--dream-${role}`).trim();
  return { stone: color('stone'), silver: color('silver'), water: color('water'), sky: color('sky'), light: color('light'), memory: color('memory'), shadow: color('shadow') };
}
export function stoneTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const p = dreamPalette(); ctx.fillStyle = p.stone; ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = p.silver; ctx.globalAlpha = 0.13;
    for (let i = 0; i < 2200; i++) ctx.fillRect((i * 79) % 256, (i * 137 + Math.floor(i / 256) * 23) % 256, 1, 1);
    ctx.globalAlpha = 0.25; ctx.strokeStyle = p.silver; ctx.strokeRect(0, 0, 255, 255);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(5, 5);
  return texture;
}