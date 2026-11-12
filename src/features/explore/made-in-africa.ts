// Made in Africa (Ika, 2026-10-21): 50 African films and series in seven collections, each paired
// with a global title that shares its craft, plus "Explore all" for titles made elsewhere. Read
// from made-in-africa.json, the same file the seed script loads into Supabase, in the shapes
// src/lib/explore.ts returns, so the screens don't change when they switch to the database.

import { GENRES, PRODUCTION_TYPES, type ProductionType } from "@/lib/projects";
import type { Season, Title, Video } from "@/lib/explore";
import sources from "./cover-sources.json";
import stills from "./trailer-stills.json";
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
  /** Why someone starting out in the industry should know it (Hollywood Classics' essentials). */
  essential?: string;
  imdb_id?: string;
  /** Who suggested it for Explore (Ika, 2026-11-08: Mbali and Paballo's lists), for a credit to come. */
  suggested_by?: string;
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
// Until TMDB's licence allows posters (Ika, 2026-10-31), a title without one shows a still from
// its official trailer, the studio's own YouTube upload (scripts/trailer-stills.mjs).
const STILLS = stills as Record<string, { id: string; size: string; top: number; bottom: number; x: number }>;
const hasCover = (slug: string) => COVERS.has(slug) || slug in STILLS;

export const coverFor = (slug: string): string | null =>
  COVERS.has(slug)
    ? `/explore/made-in-africa/${slug}.jpg`
    : STILLS[slug]
      ? // Cropped of its black bars on our side; the frame in the address keeps caches right.
        `/api/explore-still/${STILLS[slug].id}-${STILLS[slug].size}/${slug}.jpg`
      : null;
/** The cover is a still from the official trailer, standing in for the poster. */
export const isTrailerStill = (slug: string) => !COVERS.has(slug) && slug in STILLS;
/** A trailer-still cover at the frame's own wide shape, black bars cut (Recently added's mosaic,
 * Ika, 2026-11-08), with its width ÷ height; null for a poster. YouTube's frames are 1280 × 720
 * unless the still says otherwise (older videos: 640 × 480). */
export function wideCoverFor(slug: string): { image: string; aspect: number } | null {
  const still = STILLS[slug] as { id: string; size: string; top?: number; bottom?: number; left?: number; right?: number; w?: number; h?: number } | undefined;
  if (COVERS.has(slug) || !still) return null;
  const width = (still.w ?? 1280) - (still.left ?? 0) - (still.right ?? 0);
  const height = (still.h ?? 720) - (still.top ?? 0) - (still.bottom ?? 0);
  return { image: `/api/explore-still/${still.id}-${still.size}-wide/${slug}.jpg`, aspect: width / height };
}
/** A title's card picture and shape (Ika, 2026-11-08, like creators' films): a poster stands tall;
 * a trailer still or cover image shows whole and wide, with its own width ÷ height, so nothing is
 * cropped. When a poster arrives (cover-sources.json) the card turns tall by itself. */
export function titleCover(slug: string): { image: string | null; aspect?: number } {
  const wide = wideCoverFor(slug);
  return wide ?? { image: coverFor(slug) };
}
/** The YouTube video a title's stand-in cover comes from, if it has one. */
export const stillVideoId = (slug: string) => (COVERS.has(slug) ? null : ((STILLS[slug] as { id?: string } | undefined)?.id ?? null));
/** What the stand-in still is from: "trailer", or the studio's own "clip" or "promo". */
export const stillKind = (slug: string) => (STILLS[slug] as { kind?: string } | undefined)?.kind ?? "trailer";
/** The cover's caption: the official video's own cover image, or a still from it. */
export const stillCaption = (slug: string) =>
  (STILLS[slug] as { cover?: boolean } | undefined)?.cover ? `Cover: the official ${stillKind(slug)}'s cover image.` : `Cover: a still from the official ${stillKind(slug)}.`;

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

const EVERY: Entry[] = (raw.titles as RawTitle[]).map((t, i) => {
  const collection = COLLECTIONS.get(t.collection)!;
  return { title: toTitle(t), collection, category: collection.category, pinnedSeason: t.pinned_season ?? null, grain: GRAINS[i % GRAINS.length] };
});
// Only titles with a cover are on Explore (Ika, 2026-10-29): the rest wait, data, tags and press
// kits kept, and appear by themselves once their cover is added (cover-sources.json and the
// image; scripts/find-title-assets.mjs fetches posters through the TMDB API when TMDB_API_KEY is
// set). Their pages answer "not found" until then.
const ENTRIES: Entry[] = EVERY.filter((e) => hasCover(e.title.slug));
/** Titles waiting for a cover before they appear on Explore. */
export const waitingForCover: string[] = EVERY.filter((e) => !hasCover(e.title.slug)).map((e) => e.title.slug);
/** Every title's slug, listed or waiting (for the tag checks). */
export const everyTitleSlug: string[] = EVERY.map((e) => e.title.slug);

/** Each category's name by its slug (search finds titles by it). */
export const CATEGORY_NAMES = new Map(raw.categories.map((c) => [c.slug, c.name] as const));

export const MADE_IN_AFRICA = raw.categories.find((c) => c.slug === "made-in-africa")!;

/** Hollywood Classics (Ika, 2026-10-29): 30 defining films, 1939 to 1979, in release order. */
export const HOLLYWOOD_CLASSICS = raw.categories.find((c) => c.slug === "hollywood-classics")!;
export const hollywoodClassics: Entry[] = ENTRIES.filter((e) => e.category === "hollywood-classics").toSorted((a, b) => (a.title.year ?? 0) - (b.title.year ?? 0));
/** Greatest TV (Ika approved the category, 2026-10-30; first titles 2026-11-08): series worth
 * studying, in release order. */
export const GREATEST_TV = raw.categories.find((c) => c.slug === "greatest-tv")!;
export const greatestTv: Entry[] = ENTRIES.filter((e) => e.category === "greatest-tv").toSorted((a, b) => (a.title.year ?? 0) - (b.title.year ?? 0));
export const GREATEST_TV_HREF = "/explore/greatest-tv";
/** Holiday classics (Ika, 2026-11-11): Christmas films and holiday specials, in release order. */
export const HOLIDAY_CLASSICS = raw.categories.find((c) => c.slug === "holiday-classics")!;
export const holidayClassics: Entry[] = ENTRIES.filter((e) => e.category === "holiday-classics").toSorted((a, b) => (a.title.year ?? 0) - (b.title.year ?? 0));
export const HOLIDAY_CLASSICS_HREF = "/explore/holiday-classics";

// Seasonal categories (Ika, 2026-11-11: Explore "should evolve with the context of the times, world
// events, major holidays… built into the platform"). A category with a `season` ("MM-DD" to
// "MM-DD", running over New Year when it ends earlier than it starts) leads By category while it's
// in season and steps out of the list when it isn't; its View all page always works. Add a moment
// (Black History Month, Africa Day, Halloween…) as a category with a season, once Ika approves it.
type SeasonWindow = { from: string; to: string };
const SEASONS = new Map((raw.categories as { slug: string; season?: SeasonWindow }[]).flatMap((c) => (c.season ? [[c.slug, c.season] as const] : [])));
/** The seasonal categories, and which of them are in season on `today` (YYYY-MM-DD). */
export function seasonOf(today: string): { seasonal: string[]; inSeason: string[] } {
  const md = today.slice(5, 10);
  const within = ({ from, to }: SeasonWindow) => (from <= to ? md >= from && md <= to : md >= from || md <= to);
  return { seasonal: [...SEASONS.keys()], inSeason: [...SEASONS].filter(([, s]) => within(s)).map(([slug]) => slug) };
}
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

/** Where Explore lives (also in paths.ts, for pages that need only the address). */
export { exploreHome } from "./paths";
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

/** Why each essential is worth knowing (Ika, 2026-10-29), shown on its page. */
export const essentialWhy = new Map((raw.titles as RawTitle[]).flatMap((t) => (t.essential ? [[t.slug, t.essential] as const] : [])));

// Each category's View all: its titles, collections and the filter choices they have.
export type CategoryKey = "made-in-africa" | "hollywood-classics" | "greatest-tv" | "holiday-classics";
export type CategoryView = {
  slug: CategoryKey;
  name: string;
  description: string;
  href: string;
  entries: Entry[];
  collections: Collection[];
  genres: string[];
  types: ProductionType[];
  countries: string[];
  years: { min: number; max: number };
};
function viewOf(slug: CategoryKey, href: string): CategoryView {
  const meta = raw.categories.find((c) => c.slug === slug)!;
  const entries = slug === "hollywood-classics" ? hollywoodClassics : slug === "greatest-tv" ? greatestTv : slug === "holiday-classics" ? holidayClassics : madeInAfrica;
  const yrs = entries.map((e) => e.title.year).filter((y): y is number => y !== null);
  return {
    slug,
    name: meta.name,
    description: meta.description,
    href,
    entries,
    collections: [...COLLECTIONS.values()].filter((c) => c.category === slug && entries.some((e) => e.collection.slug === c.slug)),
    genres: GENRES.filter((g) => entries.some((e) => e.title.genres.includes(g))),
    types: PRODUCTION_TYPES.filter((p) => entries.some((e) => typeName(e.title) === p)),
    countries: [...new Set(entries.flatMap((e) => e.title.countries))].sort((a, b) => a.localeCompare(b)),
    years: { min: Math.min(...yrs), max: Math.max(...yrs) },
  };
}
export const HOLLYWOOD_CLASSICS_HREF = "/explore/hollywood-classics";
export const categoryViews: Record<CategoryKey, CategoryView> = {
  "made-in-africa": viewOf("made-in-africa", "/explore/made-in-africa"),
  "hollywood-classics": viewOf("hollywood-classics", HOLLYWOOD_CLASSICS_HREF),
  "greatest-tv": viewOf("greatest-tv", GREATEST_TV_HREF),
  "holiday-classics": viewOf("holiday-classics", HOLIDAY_CLASSICS_HREF),
};

/** "Directed by" for films, "Created by" for series. */
export const creditTerm = (t: Title) => (t.type === "series" ? "Created by" : "Directed by");

const ADDED = new Map((raw.titles as RawTitle[]).map((t) => [t.slug, t.added]));
/** The day a title joined Explore (YYYY-MM-DD), if it's known. */
export const addedOn = (slug: string) => ADDED.get(slug);
/** Whether something that joined on `added` is still new on `today` (both YYYY-MM-DD): seven days. */
export function isNewOn(added: string | undefined, today: string): boolean {
  if (!added || !today) return false;
  const days = (Date.parse(today) - Date.parse(added)) / 86_400_000;
  return days >= 0 && days < 7;
}
