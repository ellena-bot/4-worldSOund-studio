import { describe, expect, it } from "vitest";
import { emptySave, parseSave } from "./persistence";
import { reduceDiscovery, reducePosition, reduceTime, reduceVisit } from "./progress";

describe("progression reducers", () => {
  it("marks a world visited and remembers it as last world", () => {
    const save = reduceVisit(emptySave(), "abyss");
    expect(save.worlds["abyss"]?.visited).toBe(true);
    expect(save.lastWorld).toBe("abyss");
  });

  it("records each discovery exactly once", () => {
    let save = emptySave();
    save = reduceDiscovery(save, { id: "abyss-manifest", worldId: "abyss", title: "t", body: "b", kind: "clue" }, 1000);
    const again = reduceDiscovery(save, { id: "abyss-manifest", worldId: "abyss", title: "t", body: "b", kind: "clue" }, 2000);
    expect(again.discoveries).toHaveLength(1);
    expect(again.discoveries[0]?.at).toBe(1000);
  });

  it("treats the same id in another world as a separate discovery", () => {
    let save = emptySave();
    save = reduceDiscovery(save, { id: "x", worldId: "abyss", title: "t", body: "b", kind: "clue" }, 1);
    save = reduceDiscovery(save, { id: "x", worldId: "subconscious", title: "t", body: "b", kind: "clue" }, 2);
    expect(save.discoveries).toHaveLength(2);
  });

  it("accumulates exploration time and ignores non-positive deltas", () => {
    let save = reduceTime(emptySave(), "abyss", 30);
    save = reduceTime(save, "abyss", 15);
    expect(save.worlds["abyss"]?.timeSeconds).toBe(45);
    expect(reduceTime(save, "abyss", 0).worlds["abyss"]?.timeSeconds).toBe(45);
  });

  it("stores the last safe position per world", () => {
    const save = reducePosition(emptySave(), "abyss", [1, 2, -80]);
    expect(save.worlds["abyss"]?.lastPosition).toEqual([1, 2, -80]);
  });
});

describe("save parsing", () => {
  it("round-trips a save", () => {
    const save = reduceVisit(emptySave(), "subconscious");
    expect(parseSave(JSON.stringify(save))?.lastWorld).toBe("subconscious");
  });

  it("rejects corrupt or foreign data", () => {
    expect(parseSave("not json")).toBeNull();
    expect(parseSave(JSON.stringify({ version: 99 }))).toBeNull();
    expect(parseSave(null)).toBeNull();
  });
});
