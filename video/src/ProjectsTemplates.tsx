import { loadFont } from "@remotion/fonts";
import type { CSSProperties } from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

import { VOICE } from "./narration-audio";
import { screens, type Screen } from "./screens";
import { theme } from "./theme";

loadFont({ family: "Geist", url: staticFile("fonts/Geist-Regular.ttf"), weight: "400" });
loadFont({ family: "Geist", url: staticFile("fonts/Geist-Bold.ttf"), weight: "700" });

// A walk through creating a project and using a template, for new users. Every frame is a
// screenshot of the real app (screens.ts); the film only moves a camera over them, draws the
// cursor where the capture clicked, names each step and, once narrated, speaks it
// (narration.json). The timelines below are in story frames; see `storyFrame` for pacing.
const W = 1920;
const H = 1080;

// The screen from each frame on, cross-fading in over `fade` frames (none: a cut, as when typing).
type Shot = { from: number; screen: Screen | "project-new" | "files-scroll"; fade?: number };

const typed = (prefix: "name" | "title", count: number, from: number, every: number): Shot[] =>
  Array.from({ length: count }, (_, i) => ({ from: Math.round(from + i * every), screen: `${prefix}-${i + 1}` as Screen }));

const SHOTS: Shot[] = [
  { from: 0, screen: "projects" },
  { from: 34, screen: "dialog", fade: 6 },
  { from: 66, screen: "form", fade: 6 },
  ...typed("name", 15, 80, 2),
  { from: 122, screen: "cropper", fade: 5 },
  { from: 136, screen: "form-cover", fade: 5 },
  { from: 148, screen: "type-open", fade: 3 },
  { from: 160, screen: "form-filled", fade: 3 },
  { from: 194, screen: "project-new", fade: 8 },
  { from: 242, screen: "templates", fade: 6 },
  { from: 272, screen: "preview", fade: 6 },
  { from: 302, screen: "editor", fade: 6 },
  ...typed("title", 22, 316, 1.5),
  { from: 352, screen: "title-preview", fade: 4 },
  { from: 366, screen: "save-dialog", fade: 5 },
  { from: 384, screen: "saved", fade: 4 },
  { from: 404, screen: "project-final", fade: 8 },
  { from: 428, screen: "files-scroll" },
  { from: 470, screen: "upload-start", fade: 3 },
  { from: 480, screen: "upload-done", fade: 3 },
  { from: 492, screen: "files-done", fade: 2 },
];

// The form scrolls down to Create project: form-bottom is the same form 280 px further down.
const SCROLL = { from: 166, to: 182, by: 280 };
// The project page scrolls down to Files & references: files-empty is the page 819 px further down.
const FILES_SCROLL = { from: 432, to: 452, by: 819 };
// Where the just-created project page shows the call sheet (saved later); above it, the final
// page is the same page with its cover loaded.
const PROJECT_TOP = 830;

// [frame, x, y, zoom]: the point of the screen at the middle of the film, and how close.
const CAMERA: [number, number, number, number][] = [
  [0, 960, 540, 1],
  [14, 960, 540, 1],
  [30, 960, 640, 1.18],
  [40, 960, 545, 1.15],
  [62, 960, 545, 1.2],
  [74, 960, 470, 1.35],
  [112, 960, 470, 1.35],
  [122, 960, 560, 1.15],
  [136, 960, 640, 1.25],
  [146, 1000, 700, 1.25],
  [184, 1050, 760, 1.25],
  [194, 533, 520, 1.8],
  [214, 533, 540, 1.6],
  [230, 960, 540, 1],
  [244, 960, 540, 1],
  [262, 700, 640, 1.2],
  [276, 1000, 420, 1.15],
  [296, 1010, 380, 1.2],
  [306, 960, 540, 1],
  [314, 680, 640, 1.5],
  [348, 680, 640, 1.5],
  [358, 1300, 600, 1.15],
  [366, 960, 540, 1.2],
  [380, 960, 600, 1.25],
  [390, 1450, 800, 1.3],
  [402, 1450, 800, 1.3],
  [404, 1300, 820, 1.6],
  [426, 1200, 760, 1.4],
  [440, 960, 540, 1],
  [452, 960, 540, 1],
  [490, 960, 540, 1],
  [512, 960, 600, 1.04],
];

// [frame, x, y]: the cursor, at the buttons the capture clicked (screen pixels).
const CURSOR: [number, number, number][] = [
  [0, 1250, 900],
  [26, 960, 711], // New project
  [36, 960, 711],
  [58, 816, 545], // Blank project
  [66, 816, 545],
  [74, 900, 415], // Project name
  [82, 1180, 470],
  [112, 1180, 500],
  [118, 960, 781], // Add cover image
  [128, 1252, 830], // Apply
  [142, 1139, 966], // Production type
  [154, 1138, 856], // Photo Shoot
  [166, 1138, 900],
  [184, 1205, 969], // Create project
  [200, 1205, 969],
  [228, 444, 53], // Templates
  [244, 444, 53],
  [262, 539, 700], // Call Sheet
  [292, 1513, 304], // Use this template
  [308, 760, 699], // Title
  [318, 1000, 760],
  [348, 1000, 760],
  [358, 1667, 837], // Save to project
  [376, 960, 663], // Studio lookbook
  [384, 960, 663],
  [396, 1587, 917], // Open project
  [404, 1587, 917],
  [418, 1104, 916], // the Call Sheet in the project
  [430, 1104, 916],
  [462, 960, 382], // Drag files here, or choose files
  [474, 960, 382],
  [490, 1250, 880],
];
const CLICKS = [30, 62, 76, 120, 132, 146, 158, 188, 236, 268, 296, 310, 362, 380, 400, 466];

const STEPS: [number, string][] = [
  [0, "Start a new project"],
  [66, "Name it, add a cover, choose the type"],
  [194, "Your project page"],
  [242, "Pick a template"],
  [302, "Fill it in. Changes save as you go"],
  [356, "Save it to the project"],
  [404, "The call sheet is in the project"],
  [428, "Add your references"],
];
const END = 512;
const STORY_END = 534;

const ease = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Pacing (Ika, 2026-10-22: a bit slower, then narrated). Each step plays SLOWER times its story
// length, or longer when its spoken line needs it, so voice and picture stay together.
const FPS = 30;
const SLOWER = 1.6;
// Frames into a step before its line starts, and after the line before the next step.
const LEAD = 8;
const TAIL = 14;
const BOUNDS = [...STEPS.map(([from]) => from), END, STORY_END];
const LENGTHS = BOUNDS.slice(1).map((to, i) => {
  const base = Math.round((to - BOUNDS[i]) * SLOWER);
  const line = VOICE[i];
  return line ? Math.max(base, Math.ceil(line.seconds * FPS) + LEAD + TAIL) : base;
});
const STARTS = LENGTHS.map((_, i) => LENGTHS.slice(0, i).reduce((a, b) => a + b, 0));
export const DURATION = LENGTHS.reduce((a, b) => a + b, 0);

/** The story frame at a film frame: each step's part of the story, stretched to its length. */
function storyFrame(frame: number) {
  const i = Math.max(0, STARTS.findLastIndex((start) => frame >= start));
  return interpolate(frame, [STARTS[i], STARTS[i] + LENGTHS[i]], [BOUNDS[i], BOUNDS[i + 1]], clamp);
}

/** Eased value along keyframes: holds before the first and after the last. */
function along(frame: number, keys: number[][], index: number) {
  const next = keys.findIndex((k) => k[0] > frame);
  if (next === -1) return keys[keys.length - 1][index];
  if (next === 0) return keys[0][index];
  const [a, b] = [keys[next - 1], keys[next]];
  return interpolate(frame, [a[0], b[0]], [a[index], b[index]], { ...clamp, easing: ease });
}

export function ProjectsTemplates({ frame: fixed }: { frame?: number }) {
  const current = useCurrentFrame();
  const frame = storyFrame(fixed ?? current);

  const z = along(frame, CAMERA, 3);
  // Keep the camera inside the screen so no edge shows.
  const x = Math.min(Math.max(along(frame, CAMERA, 1), W / 2 / z), W - W / 2 / z);
  const y = Math.min(Math.max(along(frame, CAMERA, 2), H / 2 / z), H - H / 2 / z);

  const active = SHOTS.findLastIndex((s) => frame >= s.from);
  const shot = SHOTS[active];
  const fade = shot.fade ? interpolate(frame, [shot.from, shot.from + shot.fade], [0, 1], clamp) : 1;

  return (
    <AbsoluteFill style={{ background: theme.white, fontFamily: theme.font }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${W / 2 - x * z}px, ${H / 2 - y * z}px) scale(${z})` }}>
        {fade < 1 && active > 0 && <ScreenView shot={SHOTS[active - 1]} frame={frame} />}
        <ScreenView shot={shot} frame={frame} style={{ opacity: fade }} />
        <Cursor frame={frame} />
      </AbsoluteFill>
      <Caption frame={frame} />
      <EndCard frame={frame} />
      {VOICE.map((line, i) => (
        <Sequence key={i} from={STARTS[i] + LEAD}>
          <Audio src={line.src} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function ScreenView({ shot, frame, style }: { shot: Shot; frame: number; style?: CSSProperties }) {
  const full: CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, display: "block" };
  if (shot.screen === "project-new") {
    return (
      <AbsoluteFill style={style}>
        <Img src={screens.project} style={full} />
        <Img src={screens["project-final"]} style={{ ...full, clipPath: `inset(0 0 ${H - PROJECT_TOP}px 0)` }} />
      </AbsoluteFill>
    );
  }
  if (shot.screen === "files-scroll") {
    const scroll = interpolate(frame, [FILES_SCROLL.from, FILES_SCROLL.to], [0, FILES_SCROLL.by], { ...clamp, easing: ease });
    return (
      <AbsoluteFill style={{ ...style, background: theme.white }}>
        <Img src={screens["files-empty"]} style={{ ...full, top: FILES_SCROLL.by - scroll }} />
        <Img src={screens["project-final"]} style={{ ...full, top: -scroll }} />
      </AbsoluteFill>
    );
  }
  if (shot.screen === "form-filled") {
    const scroll = interpolate(frame, [SCROLL.from, SCROLL.to], [0, SCROLL.by], { ...clamp, easing: ease });
    return (
      <AbsoluteFill style={{ ...style, background: theme.white }}>
        <Img src={screens["form-bottom"]} style={{ ...full, top: SCROLL.by - scroll }} />
        <Img src={screens["form-filled"]} style={{ ...full, top: -scroll }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={style}>
      <Img src={screens[shot.screen]} style={full} />
    </AbsoluteFill>
  );
}

function Cursor({ frame }: { frame: number }) {
  const x = along(frame, CURSOR, 1);
  const y = along(frame, CURSOR, 2);
  const click = CLICKS.findLast((c) => frame >= c && frame < c + 14);
  const press = click === undefined ? 1 : interpolate(frame - click, [0, 3, 8], [1, 0.82, 1], clamp);
  const ring = click === undefined ? 0 : (frame - click) / 14;
  const visible = interpolate(frame, [0, 8, END - 6, END], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: visible }}>
      {click !== undefined && (
        <div
          style={{
            position: "absolute",
            left: -36 * ring,
            top: -36 * ring,
            width: 72 * ring,
            height: 72 * ring,
            borderRadius: 999,
            border: `3px solid ${theme.obsidian}`,
            opacity: 0.35 * (1 - ring),
          }}
        />
      )}
      <svg width={30} height={38} viewBox="0 0 20 25" style={{ position: "absolute", left: -3, top: -2, transform: `scale(${press})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }}>
        <path d="M3 2 L3 20 L7.5 15.8 L10.6 22.6 L13.4 21.4 L10.4 14.8 L16.5 14.8 Z" fill={theme.obsidian} stroke={theme.white} strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// The step's name, bottom left, in the app's pill shape.
function Caption({ frame }: { frame: number }) {
  const step = STEPS.findLastIndex(([from]) => frame >= from);
  const [from, text] = STEPS[step];
  const p = interpolate(frame, [from, from + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [END - 8, END], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 56,
        display: "flex",
        alignItems: "center",
        gap: 16,
        height: 64,
        padding: "0 28px 0 12px",
        borderRadius: 999,
        background: theme.obsidian,
        color: theme.white,
        fontSize: 26,
        fontWeight: 700,
        boxShadow: "0 12px 32px rgba(10, 9, 8, 0.28)",
        opacity: Math.min(p, out),
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.12)",
          fontSize: 20,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {step + 1}
      </span>
      {text}
    </div>
  );
}

function EndCard({ frame }: { frame: number }) {
  const p = interpolate(frame, [END, END + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (p === 0) return null;
  return (
    <AbsoluteFill style={{ background: theme.white, opacity: p, alignItems: "center", justifyContent: "center", gap: 28 }}>
      <Img src={staticFile("brand/nia-wordmark-black.svg")} style={{ height: 64, transform: `translateY(${(1 - p) * 20}px)` }} />
      <div style={{ fontSize: 30, color: theme.mutedOnLight, transform: `translateY(${(1 - p) * 20}px)` }}>Projects and templates</div>
    </AbsoluteFill>
  );
}
