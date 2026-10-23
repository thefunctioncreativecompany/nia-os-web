// Written by scripts/narrate.mjs (npm run narrate): one spoken line per step of the projects and
// templates film, and how long each runs. Until it has run, the film is silent.
import step1 from "../narration/step-1.mp3";
import step2 from "../narration/step-2.mp3";
import step3 from "../narration/step-3.mp3";
import step4 from "../narration/step-4.mp3";
import step5 from "../narration/step-5.mp3";
import step6 from "../narration/step-6.mp3";
import step7 from "../narration/step-7.mp3";
import step8 from "../narration/step-8.mp3";

export const VOICE: { src: string; seconds: number }[] = [
  { src: step1, seconds: 4.96 },
  { src: step2, seconds: 4.72 },
  { src: step3, seconds: 4.24 },
  { src: step4, seconds: 4.88 },
  { src: step5, seconds: 5.2 },
  { src: step6, seconds: 2.24 },
  { src: step7, seconds: 4.4 },
  { src: step8, seconds: 7.84 },
];
