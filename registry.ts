// World catalogue: metadata for the selection screen and routing.
// World content (scene, audio) lives in worlds/<id>/; this file only describes it.
import revolutionImg from "@/assets/worlds/revolution.jpg";
import subconsciousImg from "@/assets/worlds/subconscious.jpg";
import whiteSilenceImg from "@/assets/worlds/white-silence.jpg";
import abyssImg from "@/assets/worlds/abyss.jpg";

export type WorldStatus = "playable" | "in-development";

export interface WorldMeta {
  id: string;
  order: string;
  title: string;
  tagline: string;
  description: string;
  status: WorldStatus;
  image: string;
}

export const WORLDS: WorldMeta[] = [
  {
    id: "the-revolution",
    order: "01",
    title: "THE REVOLUTION",
    tagline: "The city watches back.",
    description:
      "A surveillance state of monumental towers, patrol drones and neon edicts. Somewhere under the floodlights, the resistance still meets.",
    status: "playable",
    image: revolutionImg,
  },
  {
    id: "subconscious",
    order: "02",
    title: "SUBCONSCIOUS",
    tagline: "It reshapes itself around you.",
    description:
      "A holographic dreamscape of translucent architecture and drifting light. Every choice you make rewrites the geometry around you.",
    status: "playable",
    image: subconsciousImg,
  },
  {
    id: "white-silence",
    order: "03",
    title: "WHITE SILENCE",
    tagline: "One streetlight still burns.",
    description:
      "A Korean apartment complex and academy district under fresh night snow, long abandoned. Footprints lead in. None lead out.",
    status: "playable",
    image: whiteSilenceImg,
  },
  {
    id: "abyss",
    order: "04",
    title: "ABYSS",
    tagline: "The deep does not sleep.",
    description:
      "A glass tunnel through black-blue water, past a silent research station. Whales and stranger things circle in the dark outside.",
    status: "playable",
    image: abyssImg,
  },
];

export function getWorld(id: string): WorldMeta | undefined {
  return WORLDS.find((w) => w.id === id);
}
