import { describe, expect, it } from "vitest";
import {
  AIR_ACCEL,
  applyLook,
  approachVelocity,
  GROUND_ACCEL,
  keyboardInput,
  moveDirection,
  PITCH_LIMIT,
  RUN_SPEED,
  targetVelocity,
  WALK_SPEED,
} from "./movement";

describe("keyboardInput", () => {
  it("maps W/S to fwd and D/A to strafe", () => {
    expect(keyboardInput(new Set(["KeyW"]))).toMatchObject({ fwd: 1, strafe: 0 });
    expect(keyboardInput(new Set(["KeyS"]))).toMatchObject({ fwd: -1 });
    expect(keyboardInput(new Set(["KeyD"]))).toMatchObject({ strafe: 1 });
    expect(keyboardInput(new Set(["KeyA"]))).toMatchObject({ strafe: -1 });
  });
  it("cancels opposite keys", () => {
    expect(keyboardInput(new Set(["KeyW", "KeyS"])).fwd).toBe(0);
  });
  it("reads run and jump", () => {
    expect(keyboardInput(new Set(["ShiftLeft"])).running).toBe(true);
    expect(keyboardInput(new Set(["Space"])).jump).toBe(true);
    expect(keyboardInput(new Set()).running).toBe(false);
  });
});

describe("moveDirection", () => {
  it("W moves where the camera looks: -Z at yaw 0", () => {
    const d = moveDirection({ fwd: 1, strafe: 0 }, 0);
    expect(d.x).toBeCloseTo(0);
    expect(d.z).toBeCloseTo(-1);
  });
  it("rotates with yaw: at yaw π/2 forward is -X", () => {
    const d = moveDirection({ fwd: 1, strafe: 0 }, Math.PI / 2);
    expect(d.x).toBeCloseTo(-1);
    expect(d.z).toBeCloseTo(0);
  });
  it("D strafes to screen right (+X at yaw 0)", () => {
    const d = moveDirection({ fwd: 0, strafe: 1 }, 0);
    expect(d.x).toBeCloseTo(1);
    expect(d.z).toBeCloseTo(0);
  });
  it("normalizes diagonals to length 1", () => {
    const d = moveDirection({ fwd: 1, strafe: 1 }, 0);
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1);
  });
});

describe("targetVelocity", () => {
  it("walks at WALK_SPEED", () => {
    const v = targetVelocity({ fwd: 1, strafe: 0 }, 0, false);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(WALK_SPEED);
  });
  it("runs faster than walk", () => {
    const v = targetVelocity({ fwd: 1, strafe: 0 }, 0, true);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(RUN_SPEED);
    expect(RUN_SPEED).toBeGreaterThan(WALK_SPEED);
  });
});

describe("approachVelocity", () => {
  it("moves toward the target without overshooting", () => {
    const v = approachVelocity({ x: 0, z: 0 }, { x: 0, z: -WALK_SPEED }, GROUND_ACCEL, 1 / 60);
    expect(v.z).toBeLessThan(0);
    expect(v.z).toBeGreaterThan(-WALK_SPEED);
  });
  it("sprint transition is smooth: one frame after SHIFT, speed is between walk and run", () => {
    const walk = targetVelocity({ fwd: 1, strafe: 0 }, 0, false);
    const run = targetVelocity({ fwd: 1, strafe: 0 }, 0, true);
    const v = approachVelocity(walk, run, GROUND_ACCEL, 1 / 60);
    const speed = Math.hypot(v.x, v.z);
    expect(speed).toBeGreaterThan(WALK_SPEED);
    expect(speed).toBeLessThan(RUN_SPEED);
  });
  it("converges to the target after repeated frames", () => {
    let v = { x: 0, z: 0 };
    for (let i = 0; i < 120; i++) v = approachVelocity(v, { x: 0, z: -RUN_SPEED }, GROUND_ACCEL, 1 / 60);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(RUN_SPEED, 1);
  });
  it("never exceeds sprint speed while switching to the opposite direction", () => {
    let v = { x: 0, z: -RUN_SPEED };
    for (let i = 0; i < 30; i++) {
      v = approachVelocity(v, { x: 0, z: RUN_SPEED }, GROUND_ACCEL, 1 / 60);
      expect(Math.hypot(v.x, v.z)).toBeLessThanOrEqual(RUN_SPEED + 1e-9);
    }
  });
  it("air steering is weaker than ground control", () => {
    const from = { x: 0, z: -WALK_SPEED };
    const target = { x: WALK_SPEED, z: 0 };
    const ground = approachVelocity(from, target, GROUND_ACCEL, 1 / 60);
    const air = approachVelocity(from, target, AIR_ACCEL, 1 / 60);
    const dist = (a: typeof from) => Math.hypot(a.x - target.x, a.z - target.z);
    expect(dist(air)).toBeGreaterThan(dist(ground));
  });
});

describe("applyLook", () => {
  it("moving the mouse right turns the view right (forward gains +X)", () => {
    const { yaw } = applyLook(0, 0, 100, 0);
    const d = moveDirection({ fwd: 1, strafe: 0 }, yaw);
    expect(d.x).toBeGreaterThan(0);
  });
  it("clamps pitch to ±PITCH_LIMIT", () => {
    expect(applyLook(0, 0, 0, 100000).pitch).toBeCloseTo(-PITCH_LIMIT);
    expect(applyLook(0, 0, 0, -100000).pitch).toBeCloseTo(PITCH_LIMIT);
  });
});
