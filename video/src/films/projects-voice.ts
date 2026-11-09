// Written by scripts/narrate-film.mjs: the projects film's spoken line per scene, and how long each runs.
import scene1 from "../../narration/projects/scene-1.mp3";
import scene2 from "../../narration/projects/scene-2.mp3";
import scene3 from "../../narration/projects/scene-3.mp3";
import scene4 from "../../narration/projects/scene-4.mp3";
import scene5 from "../../narration/projects/scene-5.mp3";
import scene6 from "../../narration/projects/scene-6.mp3";
import scene7 from "../../narration/projects/scene-7.mp3";
import scene8 from "../../narration/projects/scene-8.mp3";

export const VOICE: { src: string; seconds: number }[] = [
  { src: scene1, seconds: 6 },
  { src: scene2, seconds: 3.6 },
  { src: scene3, seconds: 3.28 },
  { src: scene4, seconds: 5.52 },
  { src: scene5, seconds: 5.84 },
  { src: scene6, seconds: 5.36 },
  { src: scene7, seconds: 7.28 },
  { src: scene8, seconds: 4.72 },
];
