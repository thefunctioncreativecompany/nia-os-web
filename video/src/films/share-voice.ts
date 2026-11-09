// Written by scripts/narrate-film.mjs: the share film's spoken line per scene, and how long each runs.
import scene1 from "../../narration/share/scene-1.mp3";
import scene2 from "../../narration/share/scene-2.mp3";
import scene3 from "../../narration/share/scene-3.mp3";
import scene4 from "../../narration/share/scene-4.mp3";
import scene5 from "../../narration/share/scene-5.mp3";
import scene6 from "../../narration/share/scene-6.mp3";

export const VOICE: { src: string; seconds: number }[] = [
  { src: scene1, seconds: 5.84 },
  { src: scene2, seconds: 5.84 },
  { src: scene3, seconds: 6.72 },
  { src: scene4, seconds: 4.88 },
  { src: scene5, seconds: 7.04 },
  { src: scene6, seconds: 6 },
];
