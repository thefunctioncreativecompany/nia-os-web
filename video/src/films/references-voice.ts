// Written by scripts/narrate-film.mjs: the references film's spoken line per scene, and how long each runs.
import scene1 from "../../narration/references/scene-1.mp3";
import scene2 from "../../narration/references/scene-2.mp3";
import scene3 from "../../narration/references/scene-3.mp3";
import scene4 from "../../narration/references/scene-4.mp3";
import scene5 from "../../narration/references/scene-5.mp3";
import scene6 from "../../narration/references/scene-6.mp3";

export const VOICE: { src: string; seconds: number }[] = [
  { src: scene1, seconds: 5.36 },
  { src: scene2, seconds: 5.68 },
  { src: scene3, seconds: 5.28 },
  { src: scene4, seconds: 6.24 },
  { src: scene5, seconds: 11.28 },
  { src: scene6, seconds: 4.32 },
];
