import { describe, expect, it } from "vitest";
import { PORTALS, REGISTERED_DISCOVERIES, discoveryTotals, getPortal, portalsInWorld, worldCompletion } from "./portals";
import { getWorld } from "@/worlds/registry";

describe("portal registry", () => {
  it("has unique portal ids", () => {
    expect(new Set(PORTALS.map((p) => p.id)).size).toBe(PORTALS.length);
  });

  it("links only between existing, distinct worlds", () => {
    for (const p of PORTALS) {
      expect(getWorld(p.worldId), p.id).toBeDefined();
      expect(getWorld(p.to), p.id).toBeDefined();
      expect(p.to).not.toBe(p.worldId);
    }
  });

  it("places one hidden portal in each of the four worlds", () => {
    for (const w of ["white-silence", "the-revolution", "subconscious", "abyss"]) {
      expect(portalsInWorld(w).length).toBe(1);
    }
  });

  it("looks up portals by id", () => {
    expect(getPortal("abyss-portal-rev")?.to).toBe("the-revolution");
    expect(getPortal("nope")).toBeUndefined();
  });
});

describe("discovery registry", () => {
  it("has unique ids per world", () => {
    const seen = new Set<string>();
    for (const r of REGISTERED_DISCOVERIES) {
      const key = `${r.worldId}:${r.id}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it("counts portals in world totals", () => {
    const totals = discoveryTotals("abyss");
    expect(totals.portal).toBe(1);
    expect(totals.clue).toBeGreaterThan(0);
  });

  it("computes completion from real discoveries only", () => {
    expect(worldCompletion("abyss", []).percent).toBe(0);
    const all = [
      ...REGISTERED_DISCOVERIES.filter((r) => r.worldId === "abyss"),
      { worldId: "abyss", id: "abyss-portal-rev" },
    ];
    const done = worldCompletion("abyss", all);
    expect(done.percent).toBe(100);
    expect(done.found).toBe(done.total);
  });

  it("ignores discoveries from other worlds and unknown ids", () => {
    const { found } = worldCompletion("abyss", [
      { worldId: "subconscious", id: "dream-memory-1" },
      { worldId: "abyss", id: "made-up" },
    ]);
    expect(found).toBe(0);
  });
});
