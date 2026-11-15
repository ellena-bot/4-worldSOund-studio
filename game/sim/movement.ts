// Pure first-person movement rules. No React, no three.js — unit-testable.
// Yaw convention: yaw 0 faces -Z. forward = (-sin yaw, -cos yaw), right = (cos yaw, -sin yaw).

export const WALK_SPEED = 3.4; // m/s
export const RUN_SPEED = 6.2; // m/s
export const JUMP_VELOCITY = 5.6; // m/s
export const EYE_OFFSET = 0.72; // capsule center -> eyes
export const LOOK_SENSITIVITY = 0.0022; // rad per mouse px
export const PITCH_LIMIT = Math.PI / 2 - 0.01;
export const GROUND_ACCEL = 12; // s^-1 approach rate on ground (walk<->sprint blend)
export const AIR_ACCEL = 2.5; // s^-1 in air: keeps momentum, limited steering

export interface MoveInput {
  /** +1 forward (W), -1 back (S). */
  fwd: number;
  /** +1 right (D), -1 left (A). */
  strafe: number;
}

/** Merge held key codes into one input state. Uses e.code (physical keys). */
export function keyboardInput(codes: ReadonlySet<string>): MoveInput & { running: boolean; jump: boolean } {
  return {
    fwd: (codes.has("KeyW") ? 1 : 0) - (codes.has("KeyS") ? 1 : 0),
    strafe: (codes.has("KeyD") ? 1 : 0) - (codes.has("KeyA") ? 1 : 0),
    running: codes.has("ShiftLeft") || codes.has("ShiftRight"),
    jump: codes.has("Space"),
  };
}

/** Camera-relative XZ direction. Length <= 1 (diagonals normalized). */
export function moveDirection(input: MoveInput, yaw: number): { x: number; z: number } {
  let x = -Math.sin(yaw) * input.fwd + Math.cos(yaw) * input.strafe;
  let z = -Math.cos(yaw) * input.fwd + -Math.sin(yaw) * input.strafe;
  const len = Math.hypot(x, z);
  if (len > 1) {
    x /= len;
    z /= len;
  }
  return { x, z };
}

/** Desired horizontal velocity in m/s. */
export function targetVelocity(input: MoveInput, yaw: number, running: boolean): { x: number; z: number } {
  const d = moveDirection(input, yaw);
  const speed = running ? RUN_SPEED : WALK_SPEED;
  return { x: d.x * speed, z: d.z * speed };
}

/**
 * Exponentially approach the target horizontal velocity. Framerate-independent
 * (k = 1 - e^-rate*dt), never overshoots, and magnitude never exceeds the
 * larger of |current| and |target| — so direction switches stay consistent.
 */
export function approachVelocity(
  current: { x: number; z: number },
  target: { x: number; z: number },
  rate: number,
  dt: number,
): { x: number; z: number } {
  const k = 1 - Math.exp(-rate * dt);
  return {
    x: current.x + (target.x - current.x) * k,
    z: current.z + (target.z - current.z) * k,
  };
}

/** Apply mouse deltas. Moving the mouse right turns the view right; pitch is clamped. */
export function applyLook(
  yaw: number,
  pitch: number,
  dx: number,
  dy: number,
  sensitivity: number = LOOK_SENSITIVITY,
): { yaw: number; pitch: number } {
  return {
    yaw: yaw - dx * sensitivity,
    pitch: Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, pitch - dy * sensitivity)),
  };
}
