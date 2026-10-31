// What Explore all's quick view shows beside each title (Ika, 2026-10-30): what it is, a line
// about it and a few of its tags, from the same data as its page.
import { getFilmDetails } from "@/components/explore/film-details";
import { findCreatorFilm, creatorYear } from "./creators";
import { filmSlug } from "./items";
import type { LibraryItem } from "./library";
import { findEntry, metaLine } from "./made-in-africa";
import { tagLabel, tagsFor } from "./tags";

export type QuickFacts = { meta: string; note: string | null; tags: string[] };

/** The Explore slug behind a library item (`t:` title, `c:` creator film, `f:` press-kit film). */
export function slugOf(item: LibraryItem): string {
  const [kind, id] = [item.key.slice(0, 1), item.key.slice(2)];
  return kind === "c" ? `creator-${id}` : kind === "f" ? filmSlug(id) : id;
}

export function quickFacts(item: LibraryItem): QuickFacts {
  const slug = slugOf(item);
  const tags = tagsFor(slug).slice(0, 4).map(tagLabel);
  const entry = findEntry(slug);
  if (entry) return { meta: metaLine(entry.title), note: entry.title.study_note || entry.title.synopsis, tags };
  const creator = findCreatorFilm(slug);
  if (creator) return { meta: [creator.type, creatorYear(creator), creator.country].filter(Boolean).join(" · "), note: creator.summary, tags };
  const film = getFilmDetails(slug.replace(/^film-/, ""));
  if (film) return { meta: [film.kind, film.year, film.country].filter(Boolean).join(" · "), note: film.summary, tags };
  return { meta: "", note: null, tags };
}
