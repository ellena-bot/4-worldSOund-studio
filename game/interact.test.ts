import { describe, expect, it } from "vitest";
import { pickTarget, type Interactable } from "./interact";

const item = (id: string, position: [number, number, number], radius = 2.5, enabled = true): Interactable => ({
  id,
  position,
  radius,
  prompt: `use ${id}`,
  enabled,
  onInteract: () => {},
});

const atSpawn = { x: 0, y: 1.9, z: 10 };
const faceNorth = { x: 0, y: 0, z: -1 };

describe("pickTarget", () => {
  it("picks the item the player looks at in range", () => {
    expect(pickTarget([item("a", [0, 1.7, 8])], atSpawn, faceNorth)?.id).toBe("a");
  });
  it("ignores items out of range", () => {
    expect(pickTarget([item("a", [0, 1.5, -20])], atSpawn, faceNorth)).toBeNull();
  });
  it("ignores items behind the player", () => {
    expect(pickTarget([item("a", [0, 1.5, 14])], atSpawn, faceNorth)).toBeNull();
  });
  it("ignores items far off to the side", () => {
    expect(pickTarget([item("a", [8, 1.5, 9])], atSpawn, faceNorth)).toBeNull();
  });
  it("skips disabled items", () => {
    expect(pickTarget([item("a", [0, 1.5, 6], 2.5, false)], atSpawn, faceNorth)).toBeNull();
  });
  it("prefers the nearer of two visible items", () => {
    const near = item("near", [0.2, 1.7, 8], 4);
    const far = item("far", [-0.2, 1.7, 6.5], 4);
    expect(pickTarget([far, near], atSpawn, faceNorth)?.id).toBe("near");
  });
});
