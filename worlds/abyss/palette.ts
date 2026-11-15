import * as THREE from 'three';
export function abyssPalette() {
  const css = getComputedStyle(document.documentElement);
  const get = (key: string) => css.getPropertyValue(`--abyss-${key}`).trim();
  return { ocean: get('ocean'), haze: get('haze'), metal: get('metal'), floor: get('floor'), ink: get('ink'), glass: get('glass'), light: get('light'), signal: get('signal'), alert: get('alert'), life: get('life'), whale: get('whale') };
}
export function metalTexture() {
  const p = abyssPalette(); const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d'); if (!ctx) return new THREE.Texture();
  ctx.fillStyle = p.floor; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = p.metal; ctx.globalAlpha = 0.28;
  for (let y = 0; y < 256; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  ctx.globalAlpha = 0.5; ctx.strokeRect(3, 3, 250, 250);
  ctx.fillStyle = p.ink; for (let i = 0; i < 400; i++) ctx.fillRect(i * 71 % 256, i * 43 % 256, 1 + i % 9, 1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 8); return t;
}
export function signTexture(lines: string[]) {
  const p = abyssPalette(); const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const ctx = c.getContext('2d'); if (!ctx) return new THREE.Texture();
  ctx.fillStyle = p.ink; ctx.fillRect(0, 0, 1024, 256); ctx.fillStyle = p.signal; ctx.fillRect(32, 30, 5, 196);
  lines.forEach((line, i) => { ctx.font = i === 0 ? '500 54px sans-serif' : '28px monospace'; ctx.fillStyle = i === 0 ? p.light : p.signal; ctx.fillText(line, 70, 90 + i * 60, 900); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}