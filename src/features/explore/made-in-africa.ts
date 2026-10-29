// Made in Africa (Ika, 2026-10-21): 50 African films and series in seven collections, each paired
// with a global title that shares its craft, plus "Explore all" for titles made elsewhere. Read
// from made-in-africa.json, the same file the seed script loads into Supabase, in the shapes
// src/lib/explore.ts returns, so the screens don't change when they switch to the database.

import { GENRES, PRODUCTION_TYPES, type ProductionType } from "@/lib/projects";
import type { Season, Title, Video } from "@/lib/explore";
import sources from "./cover-sources.json";
import raw from "./made-in-africa.json";

type RawVideo = Partial<Video> & Pick<Video, "provider" | "video_id">;
type RawTitle = {
  slug: string;
  collection: string;
  title: string;
  type: Title["type"];
  genres?: string[];
  year?: number;
  countries: string[];
  credit?: string;
  platform?: string;
  recognition?: string;
  /** Kept for a side-by-side compare feature to come (Ika, 2026-10-29); not shown for now. */
  pair_with: string;
  study_note: string;
  /** The day it joined Explore (YYYY-MM-DD), for "Recently added on Explore" (recent.ts). */
  added?: string;
  imdb_id?: string;
  pinned_season?: number;
  videos?: RawVideo[];
  seasons?: { number: number; label?: string; year?: number; episode_count?: number; videos?: RawVideo[] }[];
};

export type Collection = { slug: string; name: string; description: string };
/** A title as listed in a collection: its season pin and a stand-in look for when it has no cover. */
export type Entry = { title: Title; collection: Collection; pinnedSeason: number | null; grain: Grain; category: string };

// Every Made in Africa title's cover (Ika, 2026-10-21: official covers in high resolution), in
// public/explore/made-in-africa/<slug>.jpg, up to 1600 wide. Mami Wata, This Is Not a Burial,
// Shaka iLembe and DAM are the posters Ika supplied; the rest are each title's official poster
// from TMDB (sources in cover-sources.json, for the TMDB licence Explore needs before launch).
// A title without one shows a typographic poster.
const COVERS = new Set(Object.keys(sources));

export const coverFor = (slug: string): string | null => (COVERS.has(slug) ? `/explore/made-in-africa/${slug}.jpg` : null);

// Written out in full so Tailwind finds each class name in the code.
const GRAINS = [
  "grain-1", "grain-2", "grain-3", "grain-4", "grain-5", "grain-6",
  "grain-7", "grain-8", "grain-9", "grain-10", "grain-11", "grain-12",
] as const;
export type Grain = (typeof GRAINS)[number];

const video = (v: RawVideo, seasonId: string | null): Video => ({
  kind: "trailer",
  label: null,
  channel: null,
  is_official: true,
  is_primary: false,
  ...v,
  season_id: seasonId,
});

const toTitle = (t: RawTitle): Title => ({
  id: t.slug,
  slug: t.slug,
  title: t.title,
  type: t.type,
  genres: t.genres ?? [],
  year: t.year ?? null,
  countries: t.countries,
  credit: t.credit ?? null,
  platform: t.platform ?? null,
  recognition: t.recognition ?? null,
  pair_with: t.pair_with,
  study_note: t.study_note,
  synopsis: null,
  imdb_id: t.imdb_id ?? null,
  videos: (t.videos ?? []).map((v) => video(v, null)),
  seasons: (t.seasons ?? []).map((s): Season => {
    const id = `${t.slug}-s${s.number}`;
    return { id, number: s.number, label: s.label ?? null, year: s.year ?? null, synopsis: null, episode_count: s.episode_count ?? null, videos: (s.videos ?? []).map((v) => video(v, id)) };
  }),
});

const COLLECTIONS = new Map<string, Collection & { category: string }>(
  raw.collections.map((c) => [c.slug, { slug: c.slug, name: c.name, description: c.description, category: c.category }]),
);

const ENTRIES: (Entry & { category: string })[] = (raw.titles as RawTitle[]).map((t, i) => {
  const collection = COLLECTIONS.get(t.collection)!;
  return { title: toTitle(t), collection, category: collection.category, pinnedSeason: t.pinned_season ?? null, grain: GRAINS[i % GRAINS.length] };
});

/** When each title joined Explore, for the ones that say (recent.ts). */
export const titleAddedOn = new Map((raw.titles as RawTitle[]).flatMap((t) => (t.added ? [[t.slug, t.added] as const] : [])));

export const MADE_IN_AFRICA = raw.categories.find((c) => c.slug === "made-in-africa")!;

/** Hollywood Classics (Ika, 2026-10-29): 30 defining films, 1939 to 1979, in release order. */
export const HOLLYWOOD_CLASSICS = raw.categories.find((c) => c.slug === "hollywood-classics")!;
export const hollywoodClassics: Entry[] = ENTRIES.filter((e) => e.category === "hollywood-classics").toSorted((a, b) => (a.title.year ?? 0) - (b.title.year ?? 0));
/** The titles in the same category as this one, for "You may also like". */
export const sameCategory = (entry: Entry): Entry[] => ENTRIES.filter((e) => e.category === entry.category);

/** Made in Africa's titles, collection by collection, in the curated order. */
export const madeInAfrica: Entry[] = ENTRIES.filter((e) => e.category === "made-in-africa");

/** Made in Africa's collections, in order. */
export const madeInAfricaCollections: Collection[] = [...COLLECTIONS.values()].filter((c) => c.category === "made-in-africa");

export const allSlugs = ENTRIES.map((e) => e.title.slug);

/** Every title in the list, Made in Africa and the wider "Explore all" ones. */
export const allEntries: Entry[] = ENTRIES;

export function findEntry(slug: string): Entry | null {
  return ENTRIES.find((e) => e.title.slug === slug) ?? null;
}

/** Where Explore lives: the library once it opens, its preview until then. */
export const exploreHome = () => "/explore";
export const MADE_IN_AFRICA_HREF = "/explore/made-in-africa";
export const LIBRARY_HREF = "/explore/all";
/** A title's full-screen page; `from` brings its back link to View all ("all") or the whole library ("library"). */
export const titleHref = (slug: string, from?: "all" | "library") => `/explore/title/${slug}${from ? `?from=${from}` : ""}`;

// A title's type in the projects' production types, so Explore and projects use the same words.
const TYPES: Record<Title["type"], ProductionType> = { film: "Film", series: "TV Series", short: "Short Film", documentary: "Documentary" };

/** "TV Series · 2020 · South Africa". */
export function metaLine(t: Title) {
  return [TYPES[t.type], t.year, t.countries.join(" / ")].filter(Boolean).join(" · ");
}

export const typeName = (t: Title): ProductionType => TYPES[t.type];

// What View all can narrow by, in the projects' own lists and order (only values some title has).
export const GENRE_OPTIONS = GENRES.filter((g) => madeInAfrica.some((e) => e.title.genres.includes(g)));
export const TYPE_OPTIONS = PRODUCTION_TYPES.filter((p) => madeInAfrica.some((e) => typeName(e.title) === p));
export const COUNTRY_OPTIONS = [...new Set(madeInAfrica.flatMap((e) => e.title.countries))].sort((a, b) => a.localeCompare(b));
const years = madeInAfrica.map((e) => e.title.year).filter((y): y is number => y !== null);
export const YEAR_RANGE = { min: Math.min(...years), max: Math.max(...years) };

/** "Directed by" for films, "Created by" for series. */
export const creditTerm = (t: Title) => (t.type === "series" ? "Created by" : "Directed by");
