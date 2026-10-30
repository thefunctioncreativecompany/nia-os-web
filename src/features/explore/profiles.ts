// Explore's titles, press-kit films and creator films as production profiles
// (src/lib/production-profile.ts), the same shape as a user's project, so a project can be
// compared with finished work like it (Ika, 2026-10-30). Only what Explore knows is filled in;
// the rest stays empty until Explore records it.
import { recognizeAspect } from "@/lib/aspect-ratios";
import { readCredits, type ProductionProfile } from "@/lib/production-profile";
import type { CrewMember } from "@/lib/projects";
import { FILMS, getFilm } from "@/components/explore/explore-data";
import { getFilmDetails } from "@/components/explore/film-details";
import { getPress } from "@/components/explore/press-coverage";
import { creatorFilms, creatorYear, findCreatorFilm, type CreatorFilm } from "./creators";
import { filmSlug } from "./items";
import { allEntries, findEntry, typeName, type Entry } from "./made-in-africa";

/** "Glenn Leyburn & Lisa Barros D'Sa", "A, B and C" → each name. */
const namesIn = (credit: string) => credit.split(/\s*,\s*|\s+&\s+|\s+and\s+/).map((n) => n.trim()).filter(Boolean);

/** A series credits who created it; a film, who directed it. */
const leadRole = (series: boolean) => (series ? "Creator" : "Director");

export function profileOfTitle(entry: Entry): ProductionProfile {
  const t = entry.title;
  const series = t.type === "series";
  const episodes = t.seasons.reduce((n, s) => n + (s.episode_count ?? 0), 0);
  return {
    source: "title",
    id: t.slug,
    title: t.title,
    type: typeName(t),
    genres: t.genres,
    frames: [],
    year: t.year,
    minutes: null,
    episodes: episodes || null,
    shootDays: null,
    crew: t.credit ? namesIn(t.credit).map((name) => ({ role: leadRole(series), name })) : [],
    client: null,
    agency: null,
    brand: null,
    deliverables: [],
    release: { platform: t.platform, recognition: t.recognition, pressKit: getPress(t.slug) !== null },
  };
}

/** A Top 10 press-kit film, by its id. */
export function profileOfFilm(id: string): ProductionProfile | null {
  const d = getFilmDetails(id);
  if (!d) return null;
  const film = getFilm(id);
  const series = d.kind !== "Film";
  const crew: CrewMember[] = [
    ...namesIn(d.createdBy ?? film.director).map((name) => ({ role: leadRole(series && Boolean(d.createdBy)), name })),
    ...d.starring.map((name) => ({ role: "Talent", name })),
  ];
  return {
    source: "film",
    id: filmSlug(id),
    title: film.title,
    type: series ? "TV Series" : "Film",
    genres: d.genres,
    frames: [],
    year: d.year,
    minutes: d.minutes ?? null,
    episodes: d.episodes ?? null,
    shootDays: null,
    crew,
    client: null,
    agency: null,
    brand: null,
    deliverables: [],
    release: { platform: null, recognition: null, pressKit: getPress(id) !== null },
  };
}

export function profileOfCreatorFilm(f: CreatorFilm): ProductionProfile {
  const { crew, client, agency, brand } = readCredits(f.credits);
  return {
    source: "creator",
    id: f.slug,
    title: f.title,
    type: f.type,
    genres: [],
    frames: [recognizeAspect(f.aspect).label],
    year: creatorYear(f),
    minutes: null,
    episodes: null,
    shootDays: null,
    crew,
    client,
    agency,
    brand: f.brand ?? brand,
    deliverables: [],
    release: { platform: "Instagram", recognition: null, pressKit: false },
  };
}

/** The profile of any Explore item by its slug (a title, `film-<id>` or `creator-<code>`). */
export function profileFor(slug: string): ProductionProfile | null {
  if (slug.startsWith("film-")) return profileOfFilm(slug.slice(5));
  const entry = findEntry(slug);
  if (entry) return profileOfTitle(entry);
  const film = findCreatorFilm(slug);
  return film ? profileOfCreatorFilm(film) : null;
}

/** Every Explore item Explore shows, as profiles. */
export const exploreProfiles = (): ProductionProfile[] => [
  ...allEntries.map(profileOfTitle),
  ...FILMS.flatMap((f) => profileOfFilm(f.id) ?? []),
  ...creatorFilms.map(profileOfCreatorFilm),
];
