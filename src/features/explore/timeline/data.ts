// Explore's library as Timeline items (EXPLORE_TIMELINE_SPEC.md §5): each title once, at the day
// it came out (release-dates.json, from scripts/build-explore-timeline-data.mjs). A title known
// only by its year sits mid-year, so it doesn't pile up on 1 January. Titles with no date are
// left out and counted ("undated").

import { LIBRARY, type LibraryItem } from "../library";
import { creatorFilms } from "../creators";
import { findEntry, typeName } from "../made-in-africa";
import { getFilmDetails } from "@/components/explore/film-details";
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
  open: LibraryItem["open"];
};

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

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
    return [{ id: it.key, title: it.title, format: sentence(formatOf(it.key)), at: at(d), precision: d.precision, image: it.image, grain: it.grain, aspect: it.aspect, open: it.open }];
  }).toSorted((a, b) => a.at - b.at);
  return items;
}

/** Library titles with no date, for the "undated" count. */
export const undatedCount = () => LIBRARY.length - timelineItems().length;
