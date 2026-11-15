import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { StoryWorldContext, StoryZone } from "./storytelling";
import { useJournal } from "../story";
import { useGameStore } from "../state";

const mocks = vi.hoisted(() => ({ frame: null as null | ((state: { camera: { position: { x: number; y: number; z: number } }; clock: { elapsedTime: number } }) => void), play: vi.fn() }));
vi.mock("@react-three/fiber", () => ({ useFrame: (callback: typeof mocks.frame) => { mocks.frame = callback; } }));
vi.mock("../GameRuntime", () => ({ useGameAudio: () => ({ running: true, engine: { current: { playOneShot: mocks.play } } }) }));

describe("localized story audio", () => {
  beforeEach(() => {
    cleanup();
    mocks.play.mockClear();
    useJournal.setState({ entries: [], open: false });
    useGameStore.getState().reset();
    useGameStore.getState().setLocked(true);
  });
  const mount = () => render(<StoryWorldContext.Provider value="white-silence"><StoryZone id="academy" position={[-30, 1.7, 2]} radius={4} title="Academy" body="Leave the light on." sound={{ kind: "drone", notes: [440], gain: 0.012 }} /></StoryWorldContext.Provider>);
  const step = (x: number, time: number) => mocks.frame?.({ camera: { position: { x, y: 1.7, z: 2 } }, clock: { elapsedTime: time } });
  it("plays the localized sound only near the academy", () => {
    mount();
    step(0, 1);
    expect(mocks.play).not.toHaveBeenCalled();
    step(-30, 2);
    expect(mocks.play).toHaveBeenCalledWith({ kind: "drone", notes: [440], gain: 0.012 }, [-30, 1.7, 2], 2.5);
    expect(useJournal.getState().entries.map((e) => e.id)).toEqual(["academy"]);
  });
  it("does not repeat announcements every frame or while paused", () => {
    mount();
    step(-30, 2);
    const calls = mocks.play.mock.calls.length;
    step(-30, 3);
    expect(mocks.play).toHaveBeenCalledTimes(calls);
    useGameStore.getState().setLocked(false);
    step(-30, 40);
    expect(mocks.play).toHaveBeenCalledTimes(calls);
  });
});