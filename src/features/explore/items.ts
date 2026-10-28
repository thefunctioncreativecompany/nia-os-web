// One shape for anything Explore can show as a card, save to a collection or add to a project's
// references: a Made in Africa title or a creator's film (Ika, 2026-10-21). Collections and
// references store the item's slug; this turns it back into a card.
import { coverFor, findEntry, metaLine, titleHref } from "./made-in-africa";
import { rankForProject, type ProjectSignals, type Taste } from "./match";
import { getFilm } from "@/components/explore/explore-data";
import { filmHref, getFilmDetails } from "@/components/explore/film-details";
import { creatorFilms, creatorHref, creatorImage, creatorYear, findCreatorFilm, leadCredit } from "./creators";

export type ExploreItem = {
  slug: string;
  kind: "title" | "creator" | "film";
  title: string;
  /** Who made it. */
  credit: string;
  /** "TV Series · 2020 · South Africa", "Commercial · 2024". */
  meta: string;
  image: string | null;
  grain: string;
  /** A small label on the card (a creator film's type). */
  badge?: string;
  /** A creator film's true shape (width ÷ height); its card keeps that shape. Posters have none
   * and show at the poster shape. */
  aspect?: number;
  href: (from?: "all" | "library") => string;
};

// Creator films have no grain of their own; these sit behind a picture while it loads.
const CREATOR_GRAINS = ["grain-2", "grain-5", "grain-8", "grain-11"] as const;

/** A press-kit film as an Explore item: `film-<id>`, so it can't clash with a title's slug. */
export const filmSlug = (id: string) => `film-${id}`;

export function exploreItem(slug: string): ExploreItem | null {
  if (slug.startsWith("film-")) {
    const id = slug.slice(5);
    const details = getFilmDetails(id);
    if (!details) return null;
    const film = getFilm(id);
    return {
      slug,
      kind: "film",
      title: film.title,
      credit: details.createdBy ?? film.director,
      meta: [details.kind, details.year, details.country].filter(Boolean).join(" · "),
      image: film.posterUrl,
      grain: "grain-3",
      href: () => filmHref(id),
    };
  }
  const entry = findEntry(slug);
  if (entry) {
    return {
      slug,
      kind: "title",
      title: entry.title.title,
      credit: entry.title.credit ?? metaLine(entry.title),
      meta: metaLine(entry.title),
      image: coverFor(slug),
      grain: entry.grain,
      href: (from) => titleHref(slug, from),
    };
  }
  const film = findCreatorFilm(slug);
  if (!film) return null;
  return {
    slug: film.slug,
    kind: "creator",
    title: film.title,
    credit: leadCredit(film),
    meta: [film.type, creatorYear(film), film.country].filter(Boolean).join(" · "),
    image: creatorImage(film),
    grain: CREATOR_GRAINS[creatorFilms.indexOf(film) % CREATOR_GRAINS.length],
    badge: film.type,
    aspect: film.aspect,
    href: (from) => creatorHref(film, from),
  };
}

export const creatorItems = (): ExploreItem[] => creatorFilms.map((f) => exploreItem(f.slug)!);

// Explore for a project page (Ika, 2026-10-28): every title and creator film scored against the
// project's type, genres, frames, words and references (match.ts), each with why it was picked.
export function suggestItemsForProject(
  signals: ProjectSignals,
  leaveOut: Set<string>,
  references: string[] = [],
  taste?: Taste,
  count = 12,
): { item: ExploreItem; reasons: string[] }[] {
  return rankForProject(signals, leaveOut, references, taste, count).flatMap((m) => {
    const item = exploreItem(m.slug);
    return item ? [{ item, reasons: m.reasons }] : [];
  });
}
