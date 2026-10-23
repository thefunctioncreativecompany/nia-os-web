// Nia's interface sounds (Ika, 2026-10-22): soft cues at the moments that already animate, on by
// default at low volume, and a quiet ambient loop on Explore all's canvas only. The files are made
// once with ElevenLabs (scripts/make-sounds.mjs) and served from public/sounds. Settings → General
// turns them off on this device.

export type Cue = "success" | "navigate" | "problem";
const CUES: Cue[] = ["success", "navigate", "problem"];

// Each file's level differs, so each plays at its own gain to sit at about the same quiet level
// (measured 2026-10-22: success −25 dB, navigate −36, problem −45 average).
const GAIN: Record<Cue, number> = { success: 0.3, navigate: 0.5, problem: 2 };
// The same cue twice within this many milliseconds plays once (a double click, two toasts).
const APART = 120;
const KEY = "nia-sounds";
const AMBIENCE_KEY = "nia-explore-ambience";

let ctx: AudioContext | null = null;
// Decoding needs no sound output, so files decode ahead of time in a context that never plays;
// a decoded sound then starts the instant it's asked for (Ika: the tick came late).
let decoder: OfflineAudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const ready = new Map<string, AudioBuffer>();
const last = new Map<Cue, number>();
const listeners = new Set<() => void>();

/** The page's one audio context, woken up (browsers start it asleep until someone interacts). */
function context() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

function load(src: string) {
  if (!buffers.has(src)) {
    decoder ??= new OfflineAudioContext(1, 1, 44100);
    const buffer = fetch(src)
      .then((r) => r.arrayBuffer())
      .then((data) => decoder!.decodeAudioData(data))
      .then((decoded) => {
        ready.set(src, decoded);
        return decoded;
      })
      .catch(() => null);
    buffers.set(src, buffer);
  }
  return buffers.get(src)!;
}

function start(c: AudioContext, buffer: AudioBuffer, level: number) {
  const source = c.createBufferSource();
  source.buffer = buffer;
  const gain = c.createGain();
  gain.gain.value = level;
  source.connect(gain).connect(c.destination);
  source.start();
}

export function soundsOn() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundsOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((listener) => listener());
}

/** Explore all's ambience, switched off from the canvas itself (on unless turned off). */
export function ambienceOn() {
  try {
    return localStorage.getItem(AMBIENCE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setAmbienceOn(on: boolean) {
  try {
    localStorage.setItem(AMBIENCE_KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((listener) => listener());
}

/** For useSyncExternalStore: tells a component when sounds or ambience are switched on or off. */
export function subscribeSounds(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function playSound(cue: Cue) {
  if (typeof window === "undefined" || !soundsOn()) return;
  const now = performance.now();
  if (now - (last.get(cue) ?? -Infinity) < APART) return;
  last.set(cue, now);
  const c = context();
  const src = `/sounds/${cue}.mp3`;
  const buffer = ready.get(src);
  if (buffer) start(c, buffer, GAIN[cue]);
  else void load(src).then((loaded) => loaded && start(c, loaded, GAIN[cue]));
}

/** A loop that fades in on start and out on stop (Explore all's canvas). */
export function ambientLoop(src: string, level: number) {
  let source: AudioBufferSourceNode | null = null;
  let gain: GainNode | null = null;
  let wanted = false;
  return {
    async start() {
      wanted = true;
      if (!soundsOn()) return;
      // Wakes the audio if the browser held it until someone interacted.
      const c = context();
      if (source) return;
      const buffer = await load(src);
      if (!buffer || !wanted || source) return;
      gain = c.createGain();
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(level, c.currentTime + 1.5);
      source = c.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain).connect(c.destination);
      source.start();
    },
    stop() {
      wanted = false;
      if (!source || !gain || !ctx) return;
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.4);
      source.stop(t + 0.45);
      source = null;
      gain = null;
    },
  };
}

// The cues (about 35 KB together) load once the page is idle, and the first tap or key wakes the
// audio, so even the first sound plays without a wait.
if (typeof window !== "undefined") {
  const warm = () => soundsOn() && CUES.forEach((cue) => void load(`/sounds/${cue}.mp3`));
  if ("requestIdleCallback" in window) requestIdleCallback(warm);
  else setTimeout(warm, 1500);
  const wake = () => soundsOn() && context();
  window.addEventListener("pointerdown", wake, { once: true, capture: true });
  window.addEventListener("keydown", wake, { once: true, capture: true });
}
