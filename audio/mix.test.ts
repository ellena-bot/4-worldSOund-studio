import { describe, expect, it } from "vitest";
import { defaultMix, effectiveGain, loadMix, setBus, setMaster, setWorldBus } from "./mix";

describe("audio mix", () => {
  it("multiplies master, bus and world level", () => {
    let m = setMaster(defaultMix(), 0.5);
    m = setBus(m, "music", 0.5);
    m = setWorldBus(m, "white-silence", "music", 0.5);
    expect(effectiveGain(m, "music", "white-silence")).toBeCloseTo(0.125);
  });
  it("world volume is independent per world", () => {
    const m = setWorldBus(setMaster(defaultMix(), 1), "abyss", "ambient", 0);
    expect(effectiveGain(m, "ambient", "abyss")).toBe(0);
    expect(effectiveGain(m, "ambient", "white-silence")).toBeCloseTo(0.8);
  });
  it("falls back to the world's default mix", () => {
    const m = setMaster(setBus(defaultMix(), "music", 1), 1);
    const profile = { worldId: "w", music: [], ambient: [], emitters: [], defaultMix: { music: 0.4 } };
    expect(effectiveGain(m, "music", "w", profile)).toBeCloseTo(0.4);
  });
  it("mute silences everything and values clamp to 0..1", () => {
    expect(effectiveGain({ ...defaultMix(), muted: true }, "sfx")).toBe(0);
    expect(setMaster(defaultMix(), 3).master).toBe(1);
  });
  it("ignores corrupt saved settings", () => {
    expect(loadMix({ getItem: () => "{bad" })).toEqual(defaultMix());
  });
});
