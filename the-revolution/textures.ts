// Procedural canvas textures for THE REVOLUTION (client-only, built lazily).
import * as THREE from "three";

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export type FacadeStyle = "glass" | "concrete" | "ministry";

/** One repeat = 4 x 6 cells of 4 m. Lit windows go on the emissive map. */
export function facade(seed: number, style: FacadeStyle) {
  const rand = mulberry32(seed);
  const W = 256;
  const H = 384;
  const [m, mc] = canvas(W, H);
  const [g, gc] = canvas(W, H);
  const base = style === "glass" ? "#1a2230" : style === "ministry" ? "#2a2726" : "#2c3036";
  mc.fillStyle = base;
  mc.fillRect(0, 0, W, H);
  gc.fillStyle = "#000";
  gc.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) {
    const v = 30 + Math.floor(rand() * 30);
    mc.fillStyle = `rgba(${v},${v + 3},${v + 8},0.6)`;
    mc.fillRect(rand() * W, rand() * H, 2, 2);
  }
  const cw = W / 4;
  const ch = H / 6;
  const litColors = style === "ministry" ? ["#ff5a3c", "#ffb27a"] : ["#bfe8ff", "#ffd59a", "#8ff3e6", "#f4f4ff"];
  for (let cx = 0; cx < 4; cx++) {
    for (let cy = 0; cy < 6; cy++) {
      const x = cx * cw;
      const y = cy * ch;
      if (style === "glass") {
        mc.fillStyle = "#0e141d";
        mc.fillRect(x + 2, y + 3, cw - 4, ch - 8);
      } else if (style === "ministry") {
        mc.fillStyle = "#120f0e";
        mc.fillRect(x + cw * 0.4, y + 6, cw * 0.2, ch - 12);
      } else {
        mc.fillStyle = "#11151b";
        mc.fillRect(x + cw * 0.15, y + ch * 0.2, cw * 0.7, ch * 0.5);
      }
      if (rand() < (style === "ministry" ? 0.18 : 0.32)) {
        gc.fillStyle = litColors[Math.floor(rand() * litColors.length)]!;
        gc.globalAlpha = 0.5 + rand() * 0.5;
        if (style === "glass") gc.fillRect(x + 2, y + 3, cw - 4, ch - 8);
        else if (style === "ministry") gc.fillRect(x + cw * 0.4, y + 6, cw * 0.2, ch - 12);
        else gc.fillRect(x + cw * 0.15, y + ch * 0.2, cw * 0.7, ch * 0.5);
        gc.globalAlpha = 1;
      }
    }
  }
  // floor slab lines
  mc.fillStyle = "rgba(0,0,0,0.5)";
  for (let cy = 0; cy < 6; cy++) mc.fillRect(0, cy * ch, W, 2);
  return { map: tex(m), emissiveMap: tex(g) };
}

/** Wet asphalt with lane markings across one 20 m tile. */
export function asphalt() {
  const [c, x] = canvas(512, 512);
  x.fillStyle = "#16181c";
  x.fillRect(0, 0, 512, 512);
  const rand = mulberry32(11);
  for (let i = 0; i < 5000; i++) {
    const v = 18 + Math.floor(rand() * 26);
    x.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
    x.fillRect(rand() * 512, rand() * 512, 2, 2);
  }
  // puddles (darker, will read as reflective via roughness map)
  for (let i = 0; i < 18; i++) {
    x.fillStyle = "rgba(6,8,12,0.55)";
    x.beginPath();
    x.ellipse(rand() * 512, rand() * 512, 20 + rand() * 50, 8 + rand() * 20, rand() * 3, 0, Math.PI * 2);
    x.fill();
  }
  const t = tex(c);
  return t;
}

export function concreteTile() {
  const [c, x] = canvas(256, 256);
  x.fillStyle = "#3a3c40";
  x.fillRect(0, 0, 256, 256);
  const rand = mulberry32(23);
  for (let i = 0; i < 2000; i++) {
    const v = 50 + Math.floor(rand() * 20);
    x.fillStyle = `rgb(${v},${v},${v + 3})`;
    x.fillRect(rand() * 256, rand() * 256, 2, 2);
  }
  x.strokeStyle = "#222428";
  x.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, 256);
    x.moveTo(0, i);
    x.lineTo(256, i);
    x.stroke();
  }
  return tex(c);
}

/** Wide LED billboard: text lines on a dark ground; scrolled via texture offset. */
export function billboard(lines: string[], fg: string, bg: string, accent: string) {
  const [c, x] = canvas(1024, 256);
  x.fillStyle = bg;
  x.fillRect(0, 0, 1024, 256);
  x.fillStyle = accent;
  x.fillRect(0, 0, 1024, 14);
  x.fillRect(0, 242, 1024, 14);
  x.fillStyle = fg;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = "800 92px Impact, 'Arial Narrow', sans-serif";
  x.fillText(lines[0] ?? "", 512, lines[1] ? 108 : 128);
  if (lines[1]) {
    x.font = "600 38px 'Arial Narrow', Arial, sans-serif";
    x.fillText(lines[1], 512, 196);
  }
  // LED scanlines
  x.fillStyle = "rgba(0,0,0,0.28)";
  for (let y = 0; y < 256; y += 4) x.fillRect(0, y, 1024, 1);
  const t = tex(c);
  return t;
}

/** Ministry eye emblem for vertical banners. */
export function eyeBanner(fg: string, bg: string) {
  const [c, x] = canvas(128, 512);
  x.fillStyle = bg;
  x.fillRect(0, 0, 128, 512);
  x.strokeStyle = fg;
  x.fillStyle = fg;
  x.lineWidth = 8;
  x.beginPath();
  x.ellipse(64, 160, 48, 26, 0, 0, Math.PI * 2);
  x.stroke();
  x.beginPath();
  x.arc(64, 160, 14, 0, Math.PI * 2);
  x.fill();
  x.fillRect(20, 260, 88, 6);
  x.fillRect(20, 420, 88, 6);
  return tex(c, false);
}

/** Torn hand-printed resistance poster. */
export function poster(seed: number, headline: string, sub: string) {
  const rand = mulberry32(seed);
  const [c, x] = canvas(256, 360);
  x.fillStyle = "#d8cfb8";
  x.fillRect(0, 0, 256, 360);
  for (let i = 0; i < 400; i++) {
    x.fillStyle = `rgba(90,70,40,${rand() * 0.25})`;
    x.fillRect(rand() * 256, rand() * 360, 3, 3);
  }
  x.fillStyle = "#1b1b1b";
  // raised fist silhouette, crude
  x.fillRect(98, 60, 60, 70);
  x.fillRect(108, 130, 40, 90);
  for (let i = 0; i < 4; i++) x.fillRect(98 + i * 15, 46, 12, 18);
  x.fillStyle = "#a3241c";
  x.font = "900 40px Impact, sans-serif";
  x.textAlign = "center";
  x.fillText(headline, 128, 268);
  x.fillStyle = "#1b1b1b";
  x.font = "600 18px Arial, sans-serif";
  x.fillText(sub, 128, 300);
  // tears
  x.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 5; i++) {
    x.beginPath();
    const ex = rand() < 0.5 ? 0 : 256;
    const ey = rand() * 360;
    x.moveTo(ex, ey);
    x.lineTo(ex + (ex ? -1 : 1) * (20 + rand() * 50), ey + 20);
    x.lineTo(ex, ey + 50 + rand() * 40);
    x.fill();
  }
  x.globalCompositeOperation = "source-over";
  return tex(c, false);
}

export function signTexture(text: string, sub: string) {
  const [c, x] = canvas(512, 160);
  x.fillStyle = "#d9b02a";
  x.fillRect(0, 0, 512, 160);
  x.fillStyle = "#151515";
  for (let i = -160; i < 512; i += 48) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i + 24, 0);
    x.lineTo(i + 24 + 20, 20);
    x.lineTo(i + 20, 20);
    x.fill();
  }
  x.fillRect(16, 30, 480, 114);
  x.fillStyle = "#e8e2d0";
  x.textAlign = "center";
  x.font = "800 46px Impact, sans-serif";
  x.fillText(text, 256, 86);
  x.font = "600 20px Arial, sans-serif";
  x.fillText(sub, 256, 124);
  return tex(c, false);
}
