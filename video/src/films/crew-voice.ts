// Written by scripts/narrate-film.mjs: the crew film's spoken line per scene, and how long each runs.
import scene1 from "../../narration/crew/scene-1.mp3";
import scene2 from "../../narration/crew/scene-2.mp3";
import scene3 from "../../narration/crew/scene-3.mp3";
import scene4 from "../../narration/crew/scene-4.mp3";
import scene5 from "../../narration/crew/scene-5.mp3";
import scene6 from "../../narration/crew/scene-6.mp3";
import scene7 from "../../narration/crew/scene-7.mp3";

export const VOICE: { src: string; seconds: number }[] = [
  { src: scene1, seconds: 5.92 },
  { src: scene2, seconds: 6 },
  { src: scene3, seconds: 5.2 },
  { src: scene4, seconds: 5.68 },
  { src: scene5, seconds: 7.44 },
  { src: scene6, seconds: 5.84 },
  { src: scene7, seconds: 3.6 },
];
