// World scene registry. A world plugs in here and in worlds/<id>/audio.ts —
// no edits to the runtime or other worlds.
import type { ComponentType } from "react";
import { whiteSilenceAudio } from "./white-silence/audio";
import { WhiteSilenceScene } from "./white-silence/scene";
import { revolutionAudio } from "./the-revolution/audio";
import { RevolutionScene } from "./the-revolution/scene";
import { subconsciousAudio } from "./subconscious/audio";
import { SubconsciousScene } from "./subconscious/scene";
import { abyssAudio } from "./abyss/audio";
import { AbyssScene } from "./abyss/scene";

// Referencing the profile keeps its registration module in the bundle
// (package.json marks files as side-effect-free, so a bare import is shaken out).
export const WORLD_AUDIO = { "white-silence": whiteSilenceAudio, "the-revolution": revolutionAudio, "subconscious": subconsciousAudio, "abyss": abyssAudio } as const;

export const WORLD_SCENES: Record<string, ComponentType> = {
  "white-silence": WhiteSilenceScene,
  "the-revolution": RevolutionScene,
  "subconscious": SubconsciousScene,
  "abyss": AbyssScene,
};
