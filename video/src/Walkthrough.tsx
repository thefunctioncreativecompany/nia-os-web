import { loadFont } from "@remotion/fonts";
import type { CSSProperties } from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";

import { alpha, theme } from "./theme";

loadFont({ family: "Geist", url: staticFile("fonts/Geist-Regular.ttf"), weight: "400" });
loadFont({ family: "Geist", url: staticFile("fonts/Geist-Bold.ttf"), weight: "700" });

// The feature films (Ika, 2026-11-08; the cinematic pass, video/docs/PHASE1_QUICK_UPGRADE.md B,
// 2026-11-09). One engine for every film: a film is a JSON file (src/films/<id>.json) of scenes,
// each with one spoken line, a short headline and the real-app screenshots it shows. Each scene
// opens on its headline, revealed word by word over the scene's first screen, blurred; then the
// screen comes forward as a window floating on a dark canvas, tilted a little, and the camera
// pushes in toward what the line is about. The cursor glides in only where something is clicked.
// Grain and a vignette sit over every frame. Everything moves with the frame number.

const W = 1920;
const H = 1080;
const FPS = 30;

type Camera = [number, number, number];
/** `blendTo`: a second screen that fades in over the shot (a drag: before, then after).
 * `camera`: where the camera starts and ends, as [x, y, zoom] on the screenshot (zoom 1 shows the
 * whole screen as a floating window; from about 1.2 the screen fills the frame). */
export type ShotDef = { shot: string; cursor?: string; click?: boolean; press?: boolean; blendTo?: string; weight?: number; camera?: [Camera, Camera] };
export type FilmDef = { id: string; title: string; subtitle: string; scenes: { line: string; caption: string; shots: ShotDef[] }[] };
type Voice = { src: string; seconds: number }[];
type Target = { x: number; y: number };

// Frames: the title card, the end card, a scene's headline, when its line starts, the breath after it.
const INTRO = 96;
const OUTRO = 110;
const HEAD = 42;
const VOICE_AT = 14;
const TAIL = 14;
const FADE = 8;
/** The window's size when the camera is at zoom 1. */
const BASE = 0.82;

const ease = Easing.inOut(Easing.cubic);
const out = Easing.out(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

type Timed = ShotDef & { from: number; to: number; scene: number };
type Scene = { from: number; to: number };

/** When each scene and shot plays, in frames from the start of the film. */
export function plan(film: FilmDef, voice: Voice) {
  const scenes: Scene[] = [];
  const shots: Timed[] = [];
  let at = INTRO;
  film.scenes.forEach((scene, i) => {
    const seconds = voice[i]?.seconds ?? scene.line.split(" ").length / 2.6;
    const length = Math.max(HEAD + 60, VOICE_AT + Math.ceil(seconds * FPS) + TAIL);
    scenes.push({ from: at, to: at + length });
    // The shots share the scene after its headline.
    const start = at + HEAD - 10;
    const total = scene.shots.reduce((sum, s) => sum + (s.weight ?? 1), 0);
    let t = start;
    for (const s of scene.shots) {
      const len = Math.round(((at + length - start) * (s.weight ?? 1)) / total);
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
  const n = scenes.findLastIndex((s) => frame >= s.from);
  const inFilm = frame >= INTRO && frame < end;

  return (
    <AbsoluteFill style={{ background: theme.bgDeep, fontFamily: theme.font }}>
      <Canvas frame={frame} />
      {inFilm && n >= 0 && <SceneView film={film} n={n} scene={scenes[n]} shots={shots} frame={frame} screens={screens} targets={targets} />}
      <TitleCard film={film} frame={frame} end={end} />
      <Grain frame={frame} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 55%, ${alpha(theme.black, 0.55)} 100%)`, pointerEvents: "none" }} />
      {voice.map((line, i) => (
        <Sequence key={i} from={scenes[i].from + VOICE_AT}>
          <Audio src={line.src} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

// The dark canvas the windows float on: deep grey with a faint Nia Blue glow that drifts.
function Canvas({ frame }: { frame: number }) {
  const x = 50 + Math.sin(frame / 160) * 8;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 60% at ${x}% 30%, ${alpha(theme.blue, 0.12)}, transparent 70%), linear-gradient(180deg, ${theme.bg} 0%, ${theme.bgDeep} 100%)`,
      }}
    />
  );
}

function SceneView({ film, n, scene, shots, frame, screens, targets }: { film: FilmDef; n: number; scene: Scene; shots: Timed[]; frame: number; screens: Record<string, string>; targets: Record<string, Target> }) {
  const own = shots.filter((s) => s.scene === n);
  const i = Math.max(0, own.findLastIndex((s) => frame >= s.from));
  const shot = own[i];
  const prev = i > 0 ? own[i - 1] : null;
  // Within a scene, screens cross-fade; between scenes, the cut is a quick push.
  const fade = prev && prev.shot !== shot.shot ? interpolate(frame, [shot.from, shot.from + FADE], [0, 1], clamp) : 1;
  // The headline's veil over the first screen: blurred and dark, then clearing as the screen comes forward.
  const veil = interpolate(frame, [scene.from, scene.from + HEAD - 12, scene.from + HEAD + 4], [1, 1, 0], { ...clamp, easing: ease });
  const push = interpolate(frame, [scene.from, scene.from + 6], [1.06, 1], { ...clamp, easing: out });
  const first = own[0];
  const showFirst = frame < first.from;

  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      {showFirst ? (
        <Window s={first} at={first.from} frame={frame} screens={screens} targets={targets} veil={veil} own={own} />
      ) : (
        <>
          {fade < 1 && prev && <Window s={prev} at={frame} frame={frame} screens={screens} targets={targets} veil={veil} own={own} />}
          <Window s={shot} at={frame} frame={frame} screens={screens} targets={targets} veil={veil} own={own} style={{ opacity: fade }} />
        </>
      )}
      <Headline text={film.scenes[n].caption} scene={scene} frame={frame} />
    </AbsoluteFill>
  );
}

/** The camera for a shot at a frame: eases from its first point to its second, with a slow drift. */
function cameraAt(s: Timed, frame: number): Camera {
  const [a, b] = s.camera ?? [[960, 540, 1], [960, 540, 1.04]];
  const p = interpolate(frame, [s.from, s.to], [0, 1], { ...clamp, easing: ease });
  return [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p) * (1 + 0.03 * p)];
}

// One screen as a window floating on the canvas: tilted a little at rest, flattening and filling
// the frame as the camera pushes in on the point it names.
function Window({ s, at, frame, screens, targets, veil, own, style }: { s: Timed; at: number; frame: number; screens: Record<string, string>; targets: Record<string, Target>; veil: number; own: Timed[]; style?: CSSProperties }) {
  const [cx, cy, z] = cameraAt(s, at);
  const scale = BASE * z;
  // How far in the camera is: 0 floating whole, 1 filling the frame.
  const inward = interpolate(scale, [BASE, 1.15], [0, 1], clamp);
  let fx = lerp(W / 2, cx, inward);
  let fy = lerp(H / 2, cy, inward);
  if (scale >= 1) {
    fx = Math.min(Math.max(fx, W / 2 / scale), W - W / 2 / scale);
    fy = Math.min(Math.max(fy, H / 2 / scale), H - H / 2 / scale);
  }
  const p = interpolate(frame, [s.from, s.to], [0, 1], { ...clamp, easing: ease });
  const tilt = 1 - inward;
  const rotY = lerp(-6, -2.5, p) * tilt;
  const rotX = lerp(4.5, 2, p) * tilt;
  const blend = s.blendTo ? interpolate(frame, [s.from + 6, s.from + (s.to - s.from) * 0.85], [0, 1], { ...clamp, easing: ease }) : 0;
  const full: CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H };

  return (
    <AbsoluteFill style={{ ...style, perspective: 2600, overflow: "hidden" }}>
      <div
        style={{
          ...full,
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
          borderRadius: 26,
          overflow: "hidden",
          boxShadow: `0 60px 160px ${alpha(theme.black, 0.7)}, 0 0 0 1px ${alpha(theme.white, 0.07)}`,
          filter: veil > 0 ? `blur(${(18 * veil).toFixed(1)}px) brightness(${(1 - 0.62 * veil).toFixed(2)})` : undefined,
        }}
      >
        <Img src={screens[s.shot]} style={full} />
        {s.blendTo && <Img src={screens[s.blendTo]} style={{ ...full, opacity: blend }} />}
        {/* A 1px highlight along the window's top edge. */}
        <div style={{ ...full, borderRadius: 26, boxShadow: `inset 0 1px 0 ${alpha(theme.white, 0.16)}`, pointerEvents: "none" }} />
        {veil < 1 && <Cursor s={s} own={own} frame={frame} targets={targets} scale={scale} />}
      </div>
    </AbsoluteFill>
  );
}

// The cursor, only in shots that click or drag: it springs from where it last was to the
// shot's target, presses there, and a ring of Nia Blue spreads from the click.
function Cursor({ s, own, frame, targets, scale }: { s: Timed; own: Timed[]; frame: number; targets: Record<string, Target>; scale: number }) {
  if (!s.cursor || !(s.click || s.press) || !targets[s.cursor]) return null;
  const to = targets[s.cursor];
  const i = own.indexOf(s);
  const earlier = own.slice(0, i).reverse().find((x) => x.cursor && targets[x.cursor]);
  const from = earlier ? targets[earlier.cursor!] : { x: to.x + 320, y: to.y + 220 };
  const glide = spring({ frame: frame - s.from - 2, fps: FPS, config: { damping: 200, mass: 0.9 }, durationInFrames: 26 });
  const x = lerp(from.x, to.x, glide);
  const y = lerp(from.y, to.y, glide);
  const clickAt = s.from + 30;
  const since = frame - clickAt;
  const pressed = s.press || (s.click && since >= 0 && since < 6);
  const ring = s.click && since >= 0 && since < 18 ? since / 18 : null;
  const appear = earlier ? 1 : interpolate(frame, [s.from, s.from + 6], [0, 1], clamp);
  const size = 1.35 / scale;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: appear, transform: `scale(${size})`, transformOrigin: "0 0" }}>
      {ring !== null && (
        <div style={{ position: "absolute", left: -44 * ring, top: -44 * ring, width: 88 * ring, height: 88 * ring, borderRadius: 999, border: `3px solid ${theme.blue}`, opacity: 0.7 * (1 - ring) }} />
      )}
      <svg width={34} height={42} viewBox="0 0 20 25" style={{ position: "absolute", left: -3, top: -2, transform: `scale(${pressed ? 0.86 : 1})`, transformOrigin: "3px 2px", filter: `drop-shadow(0 4px 10px ${alpha(theme.black, 0.55)})` }}>
        <path d="M3 2 L3 20 L7.5 15.8 L10.6 22.6 L13.4 21.4 L10.4 14.8 L16.5 14.8 Z" fill={theme.white} stroke={theme.bg} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// The scene's headline, large, each word rising into place through a mask; it holds, then lifts away.
function Headline({ text, scene, frame }: { text: string; scene: Scene; frame: number }) {
  const t = frame - scene.from;
  if (t > HEAD + 6) return null;
  const leave = interpolate(t, [HEAD - 12, HEAD + 2], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const words = text.split(" ");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - leave, transform: `translateY(${-28 * leave}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.28em", maxWidth: 1800, padding: "0 60px", color: theme.text, fontSize: 108, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.04, textAlign: "center" }}>
        {words.map((word, i) => {
          const p = interpolate(t, [2 + i * 4, 14 + i * 4], [0, 1], { ...clamp, easing: out });
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.08em" }}>
              <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105}%)` }}>{word}</span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// The title before the first scene (the wordmark resolving out of a Nia Blue bloom, a light
// sweeping across it, then the film's title) and the end card after the last.
function TitleCard({ film, frame, end }: { film: FilmDef; frame: number; end: number }) {
  if (frame >= INTRO && frame < end) return null;
  const intro = frame < INTRO;
  const t = intro ? frame : frame - end;
  const card = intro ? interpolate(frame, [0, 6, INTRO - 12, INTRO], [0, 1, 1, 0], clamp) : interpolate(t, [0, 14], [0, 1], { ...clamp, easing: out });
  const bloom = interpolate(t, [0, 18, 70], [0, 0.55, 0.28], clamp);
  const bloomSize = interpolate(t, [0, 34], [0.5, 1.25], { ...clamp, easing: out });
  const mark = interpolate(t, [2, 24], [0, 1], { ...clamp, easing: out });
  const sweep = interpolate(t, [22, 56], [-60, 160], clamp);
  const title = interpolate(t, [26, 44], [0, 1], { ...clamp, easing: out });
  const wordmark = staticFile("brand/nia-wordmark-white.svg");
  const markStyle: CSSProperties = { height: 92, width: 280 };
  return (
    <AbsoluteFill style={{ background: theme.bgDeep, opacity: card, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: 999, background: `radial-gradient(circle, ${alpha(theme.blue, 0.55)}, transparent 65%)`, opacity: bloom, transform: `scale(${bloomSize})`, filter: "blur(40px)" }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <div style={{ position: "relative", ...markStyle, opacity: mark, filter: `blur(${(1 - mark) * 14}px)`, transform: `scale(${lerp(0.94, 1, mark)})` }}>
          <Img src={wordmark} style={{ ...markStyle, objectFit: "contain" }} />
          {/* The light sweep, kept to the wordmark's shape. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg, transparent ${sweep - 18}%, ${alpha(theme.white, 0.95)} ${sweep}%, transparent ${sweep + 18}%)`,
              WebkitMaskImage: `url(${wordmark})`,
              maskImage: `url(${wordmark})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: title, transform: `translateY(${(1 - title) * 18}px)` }}>
          <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-0.03em", color: theme.text }}>{intro ? film.title : film.subtitle}</div>
          <div style={{ fontSize: 28, color: theme.muted }}>{intro ? film.subtitle : "app.niatechnologies.co"}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// Fine film grain: fresh noise every other frame, laid lightly over everything.
function Grain({ frame }: { frame: number }) {
  return (
    <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width={W} height={H}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(frame / 2)} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
}
