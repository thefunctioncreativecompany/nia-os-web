// Written by scripts/narrate-film.mjs: the explore film's spoken line per scene, and how long each runs.
import scene1 from "../../narration/explore/scene-1.mp3";
import scene2 from "../../narration/explore/scene-2.mp3";
import scene3 from "../../narration/explore/scene-3.mp3";
import scene4 from "../../narration/explore/scene-4.mp3";
import scene5 from "../../narration/explore/scene-5.mp3";
import scene6 from "../../narration/explore/scene-6.mp3";
import scene7 from "../../narration/explore/scene-7.mp3";
import scene8 from "../../narration/explore/scene-8.mp3";
import scene9 from "../../narration/explore/scene-9.mp3";

export const VOICE: { src: string; seconds: number }[] = [
  { src: scene1, seconds: 6.16 },
  { src: scene2, seconds: 6.48 },
  { src: scene3, seconds: 4 },
  { src: scene4, seconds: 4.24 },
  { src: scene5, seconds: 4.16 },
  { src: scene6, seconds: 5.28 },
  { src: scene7, seconds: 5.12 },
  { src: scene8, seconds: 5.12 },
  { src: scene9, seconds: 4.24 },
];
