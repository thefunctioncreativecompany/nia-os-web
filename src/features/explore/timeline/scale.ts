// Explore's Timeline (Ika, 2026-11-02; design-ref EXPLORE_TIMELINE_SPEC.md §2): one linear time
// scale, `start` to `end` in ms, from a century down to an hour. Zooming and panning only change
// those two numbers, so there are no modes and no jumps. Pure functions, tested in scale.test.ts;
// use-timeline-scale.ts holds the state and the motion.

import {
  timeDay,
  timeHour,
  timeMinute,
  timeMonday,
  timeMonth,
  timeYear,
  type CountableTimeInterval,
  type TimeInterval,
} from "d3-time";

export type View = { start: number; end: number };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const YEAR = 365.2425 * DAY;

export const MIN_SPAN = 2 * HOUR;
export const MAX_SPAN = 150 * YEAR;

/** The zoom levels, Century to Hour (§2): each a span the preset buttons glide to. */
export const PRESETS = [
  { id: "century", label: "Century", span: 120 * YEAR },
  { id: "decade", label: "Decade", span: 15 * YEAR },
  { id: "year", label: "Year", span: YEAR },
  { id: "month", label: "Month", span: 42 * DAY },
  { id: "week", label: "Week", span: 7 * DAY },
  { id: "day", label: "Day", span: DAY },
  { id: "hour", label: "Hour", span: 4 * HOUR },
] as const;
export type PresetId = (typeof PRESETS)[number]["id"];

/** The preset nearest the visible span, in log space: it lights up as people zoom by hand. */
export function nearestPreset(span: number): PresetId {
  return PRESETS.reduce((best, p) => (Math.abs(Math.log(p.span / span)) < Math.abs(Math.log(best.span / span)) ? p : best)).id;
}

/** The furthest the view can go: 1900 (or the decade of the oldest title) to two years ahead. */
export function boundsFor(dates: number[], now: number): View {
  const oldest = dates.length ? Math.min(...dates) : now;
  const decade = Math.floor(new Date(oldest).getUTCFullYear() / 10) * 10;
  return { start: Date.UTC(Math.min(1900, decade), 0, 1), end: now + 2 * YEAR };
}

/** Keeps the span within the limits and the view inside the bounds (sliding, not squashing). */
export function clampView(v: View, bounds: View): View {
  const span = Math.min(Math.max(v.end - v.start, MIN_SPAN), Math.min(MAX_SPAN, bounds.end - bounds.start));
  let start = (v.start + v.end) / 2 - span / 2;
  if (v.end - v.start === span) start = v.start;
  start = Math.min(Math.max(start, bounds.start), bounds.end - span);
  return { start, end: start + span };
}

/** Zoom by `factor` (> 1 zooms out) keeping the time at `anchor` where it is on screen. */
export function zoomAround(v: View, anchor: number, factor: number, bounds: View): View {
  const span = Math.min(Math.max((v.end - v.start) * factor, MIN_SPAN), MAX_SPAN);
  const at = (anchor - v.start) / (v.end - v.start);
  const start = anchor - at * span;
  return clampView({ start, end: start + span }, bounds);
}

export function panBy(v: View, ms: number, bounds: View): View {
  return clampView({ start: v.start + ms, end: v.end + ms }, bounds);
}

/** A view of `span` centred on `centre`. */
export const centredOn = (centre: number, span: number, bounds: View) => clampView({ start: centre - span / 2, end: centre + span / 2 }, bounds);

/** Everything in `dates` with 10% room either side (Fit). */
export function fitView(dates: number[], bounds: View): View | null {
  if (!dates.length) return null;
  const lo = Math.min(...dates);
  const hi = Math.max(...dates);
  const pad = Math.max((hi - lo) * 0.1, DAY);
  return clampView({ start: lo - pad, end: hi + pad }, bounds);
}

// ---- Ticks (§2): the smallest unit whose spacing is at least 64px (major) or 12px (minor). ----

type Unit = "year" | "month" | "day" | "hour" | "minute";
type Step = { interval: TimeInterval; ms: number; unit: Unit };

const every = (i: CountableTimeInterval, n: number) => i.every(n) as TimeInterval;
const STEPS: Step[] = [
  { interval: every(timeMinute, 15), ms: 15 * 60_000, unit: "minute" },
  { interval: every(timeMinute, 30), ms: 30 * 60_000, unit: "minute" },
  { interval: timeHour, ms: HOUR, unit: "hour" },
  { interval: every(timeHour, 3), ms: 3 * HOUR, unit: "hour" },
  { interval: every(timeHour, 6), ms: 6 * HOUR, unit: "hour" },
  { interval: every(timeHour, 12), ms: 12 * HOUR, unit: "hour" },
  { interval: timeDay, ms: DAY, unit: "day" },
  { interval: timeMonday, ms: 7 * DAY, unit: "day" },
  { interval: timeMonth, ms: YEAR / 12, unit: "month" },
  { interval: every(timeMonth, 3), ms: YEAR / 4, unit: "month" },
  { interval: every(timeMonth, 6), ms: YEAR / 2, unit: "month" },
  { interval: timeYear, ms: YEAR, unit: "year" },
  { interval: every(timeYear, 2), ms: 2 * YEAR, unit: "year" },
  { interval: every(timeYear, 5), ms: 5 * YEAR, unit: "year" },
  { interval: every(timeYear, 10), ms: 10 * YEAR, unit: "year" },
  { interval: every(timeYear, 20), ms: 20 * YEAR, unit: "year" },
  { interval: every(timeYear, 50), ms: 50 * YEAR, unit: "year" },
];

const MAJOR_PX = 64;
const MINOR_PX = 12;

export type Tick = { at: number; x: number; label?: string };
export type Ticks = { major: Tick[]; minor: Tick[]; context: Tick[] };

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", o);
const F = {
  year: fmt({ year: "numeric" }),
  month: fmt({ month: "short" }),
  dayNum: fmt({ day: "numeric" }),
  weekday: fmt({ weekday: "short", day: "numeric" }),
  time: fmt({ hour: "2-digit", minute: "2-digit", hour12: false }),
  monthYear: fmt({ month: "long", year: "numeric" }),
  date: fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" }),
};

function majorLabel(step: Step, d: Date) {
  if (step.unit === "year") return F.year.format(d);
  if (step.unit === "month") return F.month.format(d);
  if (step.unit === "day") return step.ms > DAY ? `${F.dayNum.format(d)} ${F.month.format(d)}` : F.weekday.format(d);
  return F.time.format(d);
}

// The row under the ticks: the next unit up (the year under months, the month under days, the
// date under hours). None above years.
function contextStep(step: Step): { interval: TimeInterval; format: (d: Date) => string } | null {
  if (step.unit === "month") return { interval: timeYear, format: (d) => F.year.format(d) };
  if (step.unit === "day") return { interval: timeMonth, format: (d) => F.monthYear.format(d) };
  if (step.unit === "hour" || step.unit === "minute") return { interval: timeDay, format: (d) => F.date.format(d) };
  return null;
}

export function ticksFor(v: View, width: number): Ticks {
  const perMs = width / (v.end - v.start);
  const x = (t: number) => (t - v.start) * perMs;
  const majorStep = STEPS.find((s) => s.ms * perMs >= MAJOR_PX) ?? STEPS.at(-1)!;
  const minorStep = STEPS.find((s) => s.ms * perMs >= MINOR_PX && s.ms < majorStep.ms) ?? null;
  const range = (i: TimeInterval) => i.range(new Date(v.start), new Date(v.end + 1));
  const major = range(majorStep.interval).map((d) => ({ at: +d, x: x(+d), label: majorLabel(majorStep, d) }));
  const majorAt = new Set(major.map((t) => t.at));
  const minor = minorStep ? range(minorStep.interval).filter((d) => !majorAt.has(+d)).map((d) => ({ at: +d, x: x(+d) })) : [];
  const ctx = contextStep(majorStep);
  const context = ctx
    ? [ctx.interval.floor(new Date(v.start)), ...range(ctx.interval)]
        .filter((d, i, all) => i === 0 || +d !== +all[0])
        .map((d) => ({ at: +d, x: x(+d), label: ctx.format(d) }))
    : [];
  return { major, minor, context };
}

// ---- Words for the header and the playhead ----

/** "1925 – 2026", "Mar 2025 – Feb 2026", "14 – 21 Oct 2025", "Tue 14 Oct, 09:00 – 18:00". */
export function rangeLabel(v: View) {
  const a = new Date(v.start);
  const b = new Date(v.end);
  const span = v.end - v.start;
  if (span >= 2 * YEAR) return `${F.year.format(a)} – ${F.year.format(b)}`;
  if (span >= 60 * DAY) return `${fmt({ month: "short", year: "numeric" }).format(a)} – ${fmt({ month: "short", year: "numeric" }).format(b)}`;
  if (span >= 2 * DAY) return `${fmt({ day: "numeric", month: "short" }).format(a)} – ${fmt({ day: "numeric", month: "short", year: "numeric" }).format(b)}`;
  return `${fmt({ weekday: "short", day: "numeric", month: "short" }).format(a)}, ${F.time.format(a)} – ${F.time.format(b)}`;
}

/** The playhead's date, as exact as the zoom: "1972", "Mar 1972", "Tue 14 Oct 2025 · 14:20". */
export function playheadLabel(t: number, span: number) {
  const d = new Date(t);
  if (span >= 10 * YEAR) return F.year.format(d);
  if (span >= 120 * DAY) return fmt({ month: "short", year: "numeric" }).format(d);
  if (span >= 3 * DAY) return fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d);
  return `${F.date.format(d)} · ${F.time.format(d)}`;
}
