// Written by scripts/narrate-film.mjs: the templates film's spoken line per scene, and how long each runs.
import scene1 from "../../narration/templates/scene-1.mp3";
import scene2 from "../../narration/templates/scene-2.mp3";
import scene3 from "../../narration/templates/scene-3.mp3";
import scene4 from "../../narration/templates/scene-4.mp3";
import scene5 from "../../narration/templates/scene-5.mp3";
import scene6 from "../../narration/templates/scene-6.mp3";

export const VOICE: { src: string; seconds: number }[] = [
  { src: scene1, seconds: 10.32 },
  { src: scene2, seconds: 1.84 },
  { src: scene3, seconds: 6.88 },
  { src: scene4, seconds: 7.28 },
  { src: scene5, seconds: 5.04 },
  { src: scene6, seconds: 7.2 },
];
