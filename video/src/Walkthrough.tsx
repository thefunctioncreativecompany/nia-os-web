import { loadFont } from "@remotion/fonts";
import type { CSSProperties } from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

loadFont({ family: "Geist", url: staticFile("fonts/Geist-Regular.ttf"), weight: "400" });
loadFont({ family: "Geist", url: staticFile("fonts/Geist-Bold.ttf"), weight: "700" });

// The demo films (Ika, 2026-11-08): one engine for every feature film. Each film is a JSON file
// (src/films/<id>.json) of scenes, each with one spoken line, a caption and the real-app
// screenshots it shows (captured by scripts/capture/films/<id>.mjs). A scene lasts as long as its
// line plus a breath; its shots share that time by weight. The camera eases between the points a
// shot names, the cursor glides to the shot's target and clicks there, and shots cross-fade.

const W = 1920;
const H = 1080;
const FPS = 30;
// Nia's dark theme (src/app/globals.css): neutral greys, Nia Blue for the one accent.
const C = { bg: "#1f1f1f", text: "#e6e6e6", muted: "#a0a0a0", blue: "#3794ff", panel: "rgba(38, 38, 38, 0.86)", line: "rgba(255, 255, 255, 0.1)" };
const FONT = "Geist, system-ui, sans-serif";

type Camera = [number, number, number];
/** `blendTo`: a second screen that fades in over the shot (a drag: before, then after). */
export type ShotDef = { shot: string; cursor?: string; click?: boolean; press?: boolean; blendTo?: string; weight?: number; camera?: [Camera, Camera] };
export type FilmDef = { id: string; title: string; subtitle: string; scenes: { line: string; caption: string; shots: ShotDef[] }[] };
type Voice = { src: string; seconds: number }[];
type Target = { x: number; y: number };

// Frames before a line starts, after it ends, the title card and the end card.
const LEAD = 10;
const TAIL = 18;
const INTRO = 75;
const OUTRO = 90;
const FADE = 8;

const ease = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Timed = ShotDef & { from: number; to: number; scene: number };

/** When each scene and shot plays, in frames from the start of the film. */
export function plan(film: FilmDef, voice: Voice) {
  const scenes: { from: number; to: number }[] = [];
  const shots: Timed[] = [];
  let at = INTRO;
  film.scenes.forEach((scene, i) => {
    const seconds = voice[i]?.seconds ?? scene.line.split(" ").length / 2.6;
    const length = LEAD + Math.ceil(seconds * FPS) + TAIL;
    scenes.push({ from: at, to: at + length });
    const total = scene.shots.reduce((sum, s) => sum + (s.weight ?? 1), 0);
    let t = at;
    for (const s of scene.shots) {
      const len = Math.round((length * (s.weight ?? 1)) / total);
      shots.push({ ...s, from: t, to: t + len, scene: i });
      t += len;
    }
    shots[shots.length - 1].to = at + length;
    at += length;
  });
  return { scenes, shots, end: at, duration: at + OUTRO };
}

export function Walkthrough({ film, voice, screens, targets }: { film: FilmDef; voice: Voice; screens: Record<string, string>; targets: Record<string, Target> }) {
  const frame = useCurrentFrame();
  const { scenes, shots, end } = plan(film, voice);
  const i = Math.max(0, shots.findLastIndex((s) => frame >= s.from));
  const shot = shots[i];
  const prev = i > 0 ? shots[i - 1] : null;
  const fade = prev && prev.shot !== shot.shot ? interpolate(frame, [shot.from, shot.from + FADE], [0, 1], clamp) : 1;

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      {frame >= INTRO - 10 && frame < end + 10 && (
        <>
          {fade < 1 && prev && <ShotView s={prev} frame={frame} screens={screens} />}
          <ShotView s={shot} frame={frame} screens={screens} style={{ opacity: fade }} />
          <Cursor shots={shots} frame={frame} targets={targets} end={end} />
          <Caption film={film} scenes={scenes} frame={frame} end={end} />
        </>
      )}
      <TitleCard film={film} frame={frame} end={end} />
      {voice.map((line, n) => (
        <Sequence key={n} from={scenes[n].from + LEAD}>
          <Audio src={line.src} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

/** The camera for a shot at a frame: eases from its first point to its second over the shot. */
function cameraAt(s: Timed, frame: number): Camera {
  const [a, b] = s.camera ?? [[960, 540, 1], [960, 540, 1.03]];
  const p = interpolate(frame, [s.from, s.to], [0, 1], { ...clamp, easing: ease });
  const z = a[2] + (b[2] - a[2]) * p;
  // Keep the picture filling the frame: no edge shows.
  const x = Math.min(Math.max(a[0] + (b[0] - a[0]) * p, W / 2 / z), W - W / 2 / z);
  const y = Math.min(Math.max(a[1] + (b[1] - a[1]) * p, H / 2 / z), H - H / 2 / z);
  return [x, y, z];
}

function ShotView({ s, frame, screens, style }: { s: Timed; frame: number; screens: Record<string, string>; style?: CSSProperties }) {
  const [x, y, z] = cameraAt(s, frame);
  const blend = s.blendTo ? interpolate(frame, [s.from + 6, s.from + (s.to - s.from) * 0.85], [0, 1], { ...clamp, easing: ease }) : 0;
  const full: CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H };
  return (
    <AbsoluteFill style={{ ...style, overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${W / 2 - x * z}px, ${H / 2 - y * z}px) scale(${z})` }}>
        <Img src={screens[s.shot]} style={full} />
        {s.blendTo && <Img src={screens[s.blendTo]} style={{ ...full, opacity: blend }} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Where the cursor is: it glides to each shot's target over the first part of the shot, in the
 * camera's view of the screen, and clicks once it's there. */
function Cursor({ shots, frame, targets, end }: { shots: Timed[]; frame: number; targets: Record<string, Target>; end: number }) {
  const i = Math.max(0, shots.findLastIndex((s) => frame >= s.from));
  const s = shots[i];
  const lastTarget = (upto: number) => {
    for (let k = upto; k >= 0; k--) if (shots[k].cursor && targets[shots[k].cursor!]) return targets[shots[k].cursor!];
    return null;
  };
  const to = s.cursor ? targets[s.cursor] : lastTarget(i);
  if (!to) return null;
  const from = lastTarget(i - 1) ?? { x: to.x + 260, y: to.y + 180 };
  const arrive = s.from + Math.min(30, (s.to - s.from) * 0.55);
  const p = s.cursor ? interpolate(frame, [s.from, arrive], [0, 1], { ...clamp, easing: ease }) : 1;
  const sx = from.x + (to.x - from.x) * p;
  const sy = from.y + (to.y - from.y) * p;
  // Into the camera's view.
  const [cx, cy, z] = cameraAt(s, frame);
  const vx = W / 2 + (sx - cx) * z;
  const vy = H / 2 + (sy - cy) * z;
  const clickAt = s.click ? arrive + 3 : null;
  const sinceClick = clickAt === null ? -1 : frame - clickAt;
  const pressed = s.press || (sinceClick >= 0 && sinceClick < 6);
  const ring = sinceClick >= 0 && sinceClick < 16 ? sinceClick / 16 : null;
  // Shown only in scenes that use a cursor, from its first move; fades out at the end.
  if (!s.cursor && !shots.slice(0, i).some((x) => x.scene === s.scene && x.cursor)) return null;
  const visible = interpolate(frame, [end - 8, end], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: vx, top: vy, opacity: visible }}>
      {ring !== null && (
        <div style={{ position: "absolute", left: -40 * ring, top: -40 * ring, width: 80 * ring, height: 80 * ring, borderRadius: 999, border: `3px solid ${C.blue}`, opacity: 0.6 * (1 - ring) }} />
      )}
      <svg width={32} height={40} viewBox="0 0 20 25" style={{ position: "absolute", left: -3, top: -2, transform: `scale(${pressed ? 0.86 : 1})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))" }}>
        <path d="M3 2 L3 20 L7.5 15.8 L10.6 22.6 L13.4 21.4 L10.4 14.8 L16.5 14.8 Z" fill="#ffffff" stroke="#1f1f1f" strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// The scene's caption, bottom left, in a pill like the app's.
function Caption({ film, scenes, frame, end }: { film: FilmDef; scenes: { from: number; to: number }[]; frame: number; end: number }) {
  const n = scenes.findLastIndex((s) => frame >= s.from);
  if (n < 0) return null;
  const { from } = scenes[n];
  const p = interpolate(frame, [from, from + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [end - 10, end], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 56,
        display: "flex",
        alignItems: "center",
        gap: 14,
        height: 64,
        padding: "0 28px 0 14px",
        borderRadius: 999,
        background: C.panel,
        border: `1px solid ${C.line}`,
        backdropFilter: "blur(16px)",
        color: C.text,
        fontSize: 26,
        fontWeight: 700,
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
        opacity: Math.min(p, out),
        transform: `translateY(${(1 - p) * 14}px)`,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 999, background: "rgba(55, 148, 255, 0.16)", color: C.blue, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
        {n + 1}
      </span>
      {film.scenes[n].caption}
    </div>
  );
}

// The title before the first scene and the end card after the last.
function TitleCard({ film, frame, end }: { film: FilmDef; frame: number; end: number }) {
  const inIntro = frame < INTRO;
  const opacity = inIntro
    ? interpolate(frame, [0, 12, INTRO - 10, INTRO], [0, 1, 1, 0], clamp)
    : interpolate(frame, [end, end + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (opacity === 0) return null;
  const rise = (1 - opacity) * 18;
  return (
    <AbsoluteFill style={{ background: C.bg, opacity, alignItems: "center", justifyContent: "center", gap: 28 }}>
      <Img src={staticFile("brand/nia-wordmark-white.svg")} style={{ height: 60, transform: `translateY(${rise}px)` }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transform: `translateY(${rise}px)` }}>
        <div style={{ fontSize: 44, fontWeight: 700, color: C.text }}>{inIntro ? film.title : "app.niatechnologies.co"}</div>
        <div style={{ fontSize: 26, color: C.muted }}>{inIntro ? film.subtitle : `${film.title} · ${film.subtitle}`}</div>
      </div>
    </AbsoluteFill>
  );
}
