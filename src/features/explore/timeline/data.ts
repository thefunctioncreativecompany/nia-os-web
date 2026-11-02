// Explore's library as Timeline items (EXPLORE_TIMELINE_SPEC.md §5): each title once, at the day
// it came out (release-dates.json, from scripts/build-explore-timeline-data.mjs). A title known
// only by its year sits mid-year, so it doesn't pile up on 1 January. Titles with no date are
// left out and counted ("undated").

import { LIBRARY } from "../library";
import { creatorFilms } from "../creators";
import { essentialWhy, findEntry, typeName } from "../made-in-africa";
import { filmHref, getFilmDetails } from "@/components/explore/film-details";
import releaseDates from "../release-dates.json";

type Precision = "day" | "month" | "year";
const DATES = releaseDates as Record<string, { date: string; precision: Precision }>;

export type TimelineItem = {
  id: string;
  title: string;
  /** Shown above the title at the playhead: "Feature film", "Music video". */
  format: string;
  /** ms UTC: the release (or posting) day. */
  at: number;
  precision: Precision;
  image: string | null;
  grain: string;
  /** A creator film's shape (width ÷ height); posters have none. */
  aspect?: number;
  /** Which title leads a cluster: essentials first, then titles with a picture. */
  weight: number;
  href: string;
};

// "Feature Film" → "Feature film"; abbreviations stay ("TV series", "UGC").
const sentence = (s: string) =>
  s
    .split(" ")
    .map((w, i) => (i > 0 && w !== w.toUpperCase() ? w.toLowerCase() : w))
    .join(" ");

function dateKey(key: string) {
  const [kind, id] = [key.slice(0, 1), key.slice(2)];
  return kind === "t" ? id : kind === "f" ? `film-${id}` : `creator-${id}`;
}

function formatOf(key: string) {
  const [kind, id] = [key.slice(0, 1), key.slice(2)];
  if (kind === "t") {
    const entry = findEntry(id);
    return entry ? typeName(entry.title) : "Film";
  }
  if (kind === "f") return getFilmDetails(id)?.kind ?? "Film";
  return creatorFilms.find((f) => f.code === id)?.type ?? "Creator film";
}

function at(d: { date: string; precision: Precision }) {
  const [y, m, day] = d.date.split("-").map(Number);
  if (d.precision === "year") return Date.UTC(y, 6, 1);
  if (d.precision === "month") return Date.UTC(y, m - 1, 15);
  return Date.UTC(y, m - 1, day, 12);
}

let items: TimelineItem[] | null = null;
export function timelineItems(): TimelineItem[] {
  items ??= LIBRARY.flatMap((it) => {
    const d = DATES[dateKey(it.key)];
    if (!d) return [];
    const weight = (essentialWhy.has(it.key.slice(2)) ? 2 : 0) + (it.image ? 1 : 0);
    const href = it.open.kind === "page" ? it.open.href : filmHref(it.open.filmId);
    return [{ id: it.key, title: it.title, format: sentence(formatOf(it.key)), at: at(d), precision: d.precision, image: it.image, grain: it.grain, aspect: it.aspect, weight, href }];
  }).toSorted((a, b) => a.at - b.at);
  return items;
}

/** Library titles with no date, for the "undated" count. */
export const undatedCount = () => LIBRARY.length - timelineItems().length;

/** Made-up titles for the 5,000-title speed check (development only): real pictures, random days
 * from 1925 to today, seeded so every run is the same. */
export function mockItems(n: number): TimelineItem[] {
  const real = timelineItems();
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const [lo, hi] = [Date.UTC(1925, 0, 1), Date.UTC(2026, 9, 1)];
  return Array.from({ length: n }, (_, i) => {
    const r = real[i % real.length];
    // Weighted towards recent years, like a real library.
    const at = lo + (hi - lo) * Math.sqrt(rand());
    return { ...r, id: `mock-${i}`, title: `${r.title} (${i})`, at, precision: "day" as const, weight: Math.floor(rand() * 3) };
  }).toSorted((a, b) => a.at - b.at);
}

