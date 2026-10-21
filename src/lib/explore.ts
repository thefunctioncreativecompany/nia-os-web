// Explore data service (Ika's Made in Africa build guide, 2026-10-21). Screens only talk to these
// functions, never to Supabase directly, so adding sources (Wikidata, TMDB later) changes this file,
// not the screens. Pass in whichever Supabase client the caller already has (server or browser).
// Until the explore_ tables are created and seeded, Explore reads the same shapes from
// src/features/explore/made-in-africa.ts.

import type { SupabaseClient } from "@supabase/supabase-js";

export type Video = {
  provider: "youtube" | "vimeo";
  video_id: string;
  kind: "trailer" | "teaser" | "clip" | "promo" | "announcement";
  label: string | null;
  channel: string | null;
  is_official: boolean;
  is_primary: boolean;
  season_id: string | null;
};

export type Season = {
  id: string;
  number: number;
  label: string | null;
  year: number | null;
  synopsis: string | null;
  episode_count: number | null;
  videos: Video[];
};

export type Title = {
  id: string;
  slug: string;
  title: string;
  type: "film" | "series" | "short" | "documentary";
  /** From the projects' genre list (src/lib/projects.ts GENRES). */
  genres: string[];
  year: number | null;
  countries: string[];
  credit: string | null;
  platform: string | null;
  recognition: string | null;
  pair_with: string | null;
  study_note: string | null;
  synopsis: string | null;
  imdb_id: string | null;
  /** Film-level videos. */
  videos: Video[];
  /** Empty for films. */
  seasons: Season[];
};

export type CollectionRow = {
  slug: string;
  name: string;
  description: string | null;
  items: { title: Title; pinned_season_no: number | null }[];
};

const TITLE_SELECT = `
  id, slug, title, type, genres, year, countries, credit, platform, recognition,
  pair_with, study_note, synopsis, imdb_id,
  videos:explore_videos(provider, video_id, kind, label, channel, is_official, is_primary, season_id, sort_order),
  seasons:explore_seasons(id, number, label, year, synopsis, episode_count)
`;

type RawVideo = Video & { sort_order: number };
type RawTitle = Omit<Title, "videos" | "seasons"> & { videos: RawVideo[] | null; seasons: Omit<Season, "videos">[] | null };
type RawCollection = {
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  items: { pinned_season_no: number | null; sort_order: number; title: RawTitle | null }[];
};

function shapeTitle(raw: RawTitle): Title {
  const all = (raw.videos ?? []).toSorted((a, b) => a.sort_order - b.sort_order);
  const seasons = (raw.seasons ?? [])
    .map((s) => ({ ...s, videos: all.filter((v) => v.season_id === s.id) }))
    .sort((a, b) => a.number - b.number);
  return { ...raw, videos: all.filter((v) => !v.season_id), seasons };
}

/** Every collection in a category, in order, with its titles. */
export async function getCategory(db: SupabaseClient, slug = "made-in-africa"): Promise<CollectionRow[]> {
  const { data, error } = await db
    .from("explore_categories")
    .select(`
      collections:explore_collections(
        slug, name, description, sort_order,
        items:explore_collection_items(pinned_season_no, sort_order, title:explore_titles(${TITLE_SELECT}))
      )
    `)
    .eq("slug", slug)
    .single();
  if (error) throw error;

  return ((data as unknown as { collections: RawCollection[] }).collections ?? [])
    .toSorted((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      items: c.items
        // Unpublished titles come back empty under the access rules.
        .filter((i): i is typeof i & { title: RawTitle } => i.title !== null)
        .toSorted((a, b) => a.sort_order - b.sort_order)
        .map((i) => ({ title: shapeTitle(i.title), pinned_season_no: i.pinned_season_no })),
    }))
    .filter((c) => c.items.length > 0);
}

/** One title for the full-screen view. */
export async function getTitle(db: SupabaseClient, slug: string): Promise<Title | null> {
  const { data, error } = await db.from("explore_titles").select(TITLE_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? shapeTitle(data as unknown as RawTitle) : null;
}

/** The season to show first: ?season= in the address, else the collection's pin, else the latest. */
export function pickSeason(title: Title, requested?: number | null, pinned?: number | null): Season | null {
  if (!title.seasons.length) return null;
  const want = requested ?? pinned;
  return title.seasons.find((s) => s.number === want) ?? title.seasons[title.seasons.length - 1];
}

/** The hero video for a title or one of its seasons. */
export function primaryVideo(videos: Video[]): Video | null {
  return videos.find((v) => v.is_primary && v.kind === "trailer") ?? videos.find((v) => v.is_primary) ?? videos[0] ?? null;
}

/** The player, started (it only loads once Play is pressed). YouTube's privacy-enhanced player. */
export function embedUrl(v: Video): string {
  return v.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${v.video_id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : `https://player.vimeo.com/video/${v.video_id}?autoplay=1`;
}

/**
 * YouTube's own thumbnail for a video: "maxresdefault" (1280 wide, missing on some older uploads)
 * or "hqdefault" (480 wide, always there). Vimeo has none without its API.
 */
export function videoThumbnail(v: Video, size: "maxresdefault" | "hqdefault" = "hqdefault"): string | null {
  return v.provider === "youtube" ? `https://i.ytimg.com/vi/${v.video_id}/${size}.jpg` : null;
}

export function watchUrl(v: Video): string {
  return v.provider === "youtube" ? `https://www.youtube.com/watch?v=${v.video_id}` : `https://vimeo.com/${v.video_id}`;
}

/** "Trailer", "Teaser", or the video's own label ("US trailer", "Date announcement"). */
export function videoName(v: Video): string {
  return v.label ?? v.kind[0].toUpperCase() + v.kind.slice(1);
}

/** e.g. "Official trailer from Netflix on YouTube. Details curated by Nia." */
export function attribution(v: Video | null): string {
  if (!v) return "Details curated by Nia.";
  const what = v.kind === "trailer" && !v.label ? (v.is_official ? "Official trailer" : "Trailer") : videoName(v);
  const where = v.provider === "youtube" ? "YouTube" : "Vimeo";
  return `${what}${v.channel ? ` from ${v.channel}` : ""} on ${where}. Details curated by Nia.`;
}

export function imdbUrl(t: Title): string | null {
  return t.imdb_id ? `https://www.imdb.com/title/${t.imdb_id}/` : null;
}
