// One shape for anything Explore can show as a card, save to a collection or add to a project's
// references: a Made in Africa title or a creator's film (Ika, 2026-10-21). Collections and
// references store the item's slug; this turns it back into a card.
import { coverFor, findEntry, metaLine, suggestForProject, titleHref } from "./made-in-africa";
import { creatorFilms, creatorHref, creatorImage, creatorYear, findCreatorFilm, leadCredit } from "./creators";

export type ExploreItem = {
  slug: string;
  kind: "title" | "creator";
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

export function exploreItem(slug: string): ExploreItem | null {
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

// Explore for a project page: Made in Africa titles by genre and type, and creators' films by type
// (a commercial or music video project gets commercials and music videos), best first.
export function suggestItemsForProject(project: { genres: string; productionType: string | null }, leaveOut: Set<string>, count = 12): ExploreItem[] {
  const titles = suggestForProject(project, leaveOut, count).map((e) => exploreItem(e.title.slug)!);
  const films = creatorFilms.filter((f) => !leaveOut.has(f.slug) && project.productionType === f.type).map((f) => exploreItem(f.slug)!);
  // Matching creators' films lead for the formats they're made in; titles follow.
  return [...films, ...titles].slice(0, count);
}
