import voices from "./voices.json";
import type { TutorialVoice } from "./template-tutorial";

// Which templates have a voice-over (made by scripts/make-tutorial-voices.mjs) and how long each
// scene's clip runs. No entry: the tutorial plays silent, with no sound button.
const VOICES = voices as Record<string, { seconds: [number, number, number] }>;

// The same object each time for a code, so the player doesn't reload its clips on every render.
const made = new Map<string, TutorialVoice | null>();

export function voiceFor(code: string): TutorialVoice | null {
  if (!made.has(code)) {
    const v = VOICES[code];
    made.set(code, v ? { src: [0, 1, 2].map((i) => `/tutorial-voice/${code}-${i}.mp3`) as TutorialVoice["src"], seconds: v.seconds } : null);
  }
  return made.get(code) ?? null;
}
