// Surveillance drone rules: patrol along looping waypoint routes, sweep a
// searchlight footprint on the ground, and flag the player when inside it.
// Pure TypeScript — no React or three.js — so it can be unit tested.

export type V3 = [number, number, number];

export interface DroneRoute {
  id: string;
  waypoints: V3[];
  /** Metres per second along the route. */
  speed: number;
  /** Searchlight footprint radius on the ground (m). */
  scanRadius: number;
}

export interface DroneState {
  /** Distance travelled along the looped route (m). */
  s: number;
  position: V3;
  /** Point on the ground the searchlight is aimed at. */
  target: V3;
  /** Seconds before this drone may warn again. */
  cooldown: number;
}

export const WARNING_COOLDOWN = 6;
/** Searchlight sways this far off the drone's ground point. */
export const SWAY = 3;

function dist(a: V3, b: V3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function routeLength(r: DroneRoute) {
  let L = 0;
  for (let i = 0; i < r.waypoints.length; i++) L += dist(r.waypoints[i]!, r.waypoints[(i + 1) % r.waypoints.length]!);
  return L;
}

/** Position along the closed route after travelling `s` metres. */
export function pointOnRoute(r: DroneRoute, s: number): V3 {
  const L = routeLength(r);
  let d = ((s % L) + L) % L;
  const n = r.waypoints.length;
  for (let i = 0; i < n; i++) {
    const a = r.waypoints[i]!;
    const b = r.waypoints[(i + 1) % n]!;
    const seg = dist(a, b);
    if (d <= seg) {
      const t = seg === 0 ? 0 : d / seg;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
    d -= seg;
  }
  return [...r.waypoints[0]!] as V3;
}

export function initDrone(r: DroneRoute, offset = 0): DroneState {
  const p = pointOnRoute(r, offset);
  return { s: offset, position: p, target: [p[0], 0, p[2]], cooldown: 0 };
}

/** True when the player's feet are inside the searchlight footprint. */
export function detects(r: DroneRoute, d: DroneState, player: V3) {
  return Math.hypot(player[0] - d.target[0], player[2] - d.target[2]) <= r.scanRadius;
}

/**
 * Advance one drone. Returns true when it should sound a warning this step
 * (player inside the beam and the drone's cooldown has elapsed).
 */
export function stepDrone(r: DroneRoute, d: DroneState, dt: number, time: number, player: V3 | null): boolean {
  d.s += r.speed * dt;
  d.position = pointOnRoute(r, d.s);
  const phase = d.s * 0.37;
  d.target = [d.position[0] + Math.sin(time * 0.6 + phase) * SWAY, 0, d.position[2] + Math.cos(time * 0.45 + phase) * SWAY];
  d.cooldown = Math.max(0, d.cooldown - dt);
  if (player && d.cooldown === 0 && detects(r, d, player)) {
    d.cooldown = WARNING_COOLDOWN;
    return true;
  }
  return false;
}
