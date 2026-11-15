import { describe, expect, it } from "vitest";
import { detects, initDrone, pointOnRoute, routeLength, stepDrone, WARNING_COOLDOWN, type DroneRoute } from "./drones";

const square: DroneRoute = {
  id: "t",
  waypoints: [[0, 10, 0], [10, 10, 0], [10, 10, 10], [0, 10, 10]],
  speed: 5,
  scanRadius: 4,
};

describe("drone patrol", () => {
  it("loops a closed route", () => {
    expect(routeLength(square)).toBe(40);
    expect(pointOnRoute(square, 15)).toEqual([10, 10, 5]);
    expect(pointOnRoute(square, 40)).toEqual([0, 10, 0]);
  });

  it("moves at its route speed", () => {
    const d = initDrone(square);
    stepDrone(square, d, 1, 0, null);
    expect(d.position).toEqual([5, 10, 0]);
  });

  it("warns once when the player is in the beam, then cools down", () => {
    const d = initDrone(square);
    stepDrone(square, d, 0.0001, 0, null);
    const player: [number, number, number] = [d.target[0], 0, d.target[2]];
    d.s -= 0.0005; // keep the drone in place for the next steps
    square.speed = 0;
    expect(stepDrone(square, d, 0.01, 0, player)).toBe(true);
    expect(d.cooldown).toBe(WARNING_COOLDOWN);
    expect(stepDrone(square, d, 0.01, 0, player)).toBe(false);
    square.speed = 5;
  });

  it("ignores a player outside the footprint", () => {
    const d = initDrone(square);
    expect(detects(square, d, [d.target[0] + 5, 0, d.target[2]])).toBe(false);
  });
});
