"use client";

import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { cn } from "@/lib/utils";
import { FlatIcon } from "@/features/templates/components/flat-icon";

// A template's mini tutorial (Ika, 2026-10-31), drawn with Remotion from the template's own
// content, nothing invented: where it fits and what it does for the team (context), what it does
// for you (purpose), then its How to use steps beside a document filling in its real sections
// (how to). Nia's theme colours, Geist and the type scale; one play, no loop.

export type TutorialProps = {
  name: string;
  icon: string;
  stage: string;
  forYou: string | null;
  forTeam: string | null;
  steps: string[];
  sections: string[];
};

export const TUTORIAL_FPS = 30;
const CONTEXT = 3.5 * TUTORIAL_FPS;
const PURPOSE = 3.5 * TUTORIAL_FPS;
const HOW = 7 * TUTORIAL_FPS;
export const TUTORIAL_FRAMES = CONTEXT + PURPOSE + HOW;
export const TUTORIAL_SIZE = { width: 1280, height: 720 };

const ease = Easing.out(Easing.cubic);
/** 0 → 1 over `length` frames from `start`. */
const rise = (frame: number, start: number, length = 12) => interpolate(frame, [start, start + length], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

function Fade({ start = 0, children, className }: { start?: number; children: React.ReactNode; className?: string }) {
  const frame = useCurrentFrame();
  const t = rise(frame, start);
  return (
    <div className={className} style={{ opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-h3 font-semibold text-nia-blue">{children}</p>;
}

function Context({ name, icon, stage, forTeam }: TutorialProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill className="items-center justify-center gap-10 px-28 text-center">
      <div className="flex size-36 items-center justify-center rounded-[2rem] bg-card shadow-elevation-2" style={{ transform: `scale(${0.6 + 0.4 * pop})` }}>
        <FlatIcon name={icon} size="md" className="size-18" />
      </div>
      <Fade start={8}>
        <h2 className="text-[4.5rem] leading-none font-bold tracking-tight text-foreground">{name}</h2>
      </Fade>
      <Fade start={18}>
        <span className="rounded-full border border-nia-blue/50 bg-nia-blue/15 px-6 py-2.5 text-h3 font-semibold text-foreground">{stage}</span>
      </Fade>
      {forTeam && (
        <Fade start={30} className="max-w-[56rem]">
          <p className="text-[1.9rem] leading-snug text-muted-foreground">{forTeam}</p>
        </Fade>
      )}
    </AbsoluteFill>
  );
}

function Purpose({ forYou, name }: TutorialProps) {
  const frame = useCurrentFrame();
  const words = (forYou ?? `What the ${name} is for, on one page.`).split(" ");
  return (
    <AbsoluteFill className="justify-center gap-8 px-32">
      <Fade>
        <Label>What it does for you</Label>
      </Fade>
      <p className="text-[3.1rem] leading-[1.2] font-semibold tracking-tight text-foreground">
        {words.map((w, i) => (
          <span key={i} style={{ opacity: 0.18 + 0.82 * rise(frame, 6 + i * 2.2, 8) }}>
            {w}{" "}
          </span>
        ))}
      </p>
    </AbsoluteFill>
  );
}

function HowTo({ steps, sections, name }: TutorialProps) {
  const frame = useCurrentFrame();
  const shownSteps = steps.slice(0, 3);
  const shownSections = sections.slice(0, 5);
  const per = (HOW - 40) / Math.max(shownSections.length, 1);
  return (
    <AbsoluteFill className="flex-row items-center gap-14 px-24">
      <div className="flex w-[34rem] flex-col gap-7">
        <Fade>
          <Label>How to use it</Label>
        </Fade>
        <ol className="flex flex-col gap-6">
          {shownSteps.map((step, i) => {
            const t = rise(frame, 10 + i * 45);
            return (
              <li key={i} className="flex items-start gap-5" style={{ opacity: t, transform: `translateX(${(1 - t) * -20}px)` }}>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-nia-blue text-h3 font-bold text-nia-blue-foreground">{i + 1}</span>
                <span className="line-clamp-3 text-[1.55rem] leading-snug text-foreground">{step}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The document, its real sections filling in one after another. */}
      <div className="flex flex-1 flex-col gap-5 rounded-3xl border border-border bg-card p-10 shadow-elevation-2">
        <p className="text-h2 font-bold text-foreground">{name}</p>
        {shownSections.map((title, i) => {
          const fill = rise(frame, 20 + i * per, per * 0.8);
          const done = fill >= 1;
          return (
            <div key={i} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-lead font-semibold text-foreground">{title}</span>
                <span className={cn("flex size-6 items-center justify-center rounded-full border-2 text-micro font-bold", done ? "border-nia-blue bg-nia-blue text-nia-blue-foreground" : "border-border")}>{done ? "✓" : ""}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-nia-blue" style={{ width: `${fill * 100}%` }} />
              </div>
            </div>
          );
        })}
        <div className="mt-2 flex gap-3" style={{ opacity: rise(frame, HOW - 45) }}>
          <span className="rounded-full bg-primary px-5 py-2.5 text-lead font-semibold text-primary-foreground">Download PDF</span>
          <span className="rounded-full border border-border px-5 py-2.5 text-lead font-semibold text-foreground">Save to project</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function TemplateTutorial(props: TutorialProps) {
  return (
    <AbsoluteFill className="bg-background font-sans">
      <Sequence durationInFrames={CONTEXT} premountFor={10}>
        <Context {...props} />
      </Sequence>
      <Sequence from={CONTEXT} durationInFrames={PURPOSE} premountFor={10}>
        <Purpose {...props} />
      </Sequence>
      <Sequence from={CONTEXT + PURPOSE} premountFor={10}>
        <HowTo {...props} />
      </Sequence>
    </AbsoluteFill>
  );
}
