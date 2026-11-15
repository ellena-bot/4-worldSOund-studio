import { describe, expect, it } from "vitest";
import { appendDiscovery, insideStoryZone, useJournal, type Discovery } from "./story";
import { useGameStore } from "./state";

const clue: Discovery = { id: "note", worldId: "white-silence", title: "Note", body: "Come home.", kind: "clue" };
describe("environmental discovery", () => {
  it("records an inspected clue only once", () => {
    const entries = appendDiscovery([], clue);
    expect(appendDiscovery(entries, clue)).toBe(entries);
    expect(entries).toEqual([clue]);
  });
  it("keeps independently named clues in each world", () => {
    expect(appendDiscovery([clue], { ...clue, worldId: "the-revolution" })).toHaveLength(2);
  });
  it("retains discovery progress when the player leaves a world", () => {
    useJournal.setState({ entries: [] });
    useJournal.getState().discover(clue);
    useGameStore.getState().reset();
    const [entry] = useJournal.getState().entries;
    expect(entry).toMatchObject(clue);
    expect(typeof entry?.at).toBe("number");
  });
  it("activates localized events only inside their defined radius", () => {
    expect(insideStoryZone({ x: 0, y: 1, z: 3 }, [0, 1, 0], 3)).toBe(true);
    expect(insideStoryZone({ x: 0, y: 1, z: 3.01 }, [0, 1, 0], 3)).toBe(false);
    expect(insideStoryZone({ x: 0, y: 8, z: 0 }, [0, 1, 0], 3)).toBe(false);
  });
});