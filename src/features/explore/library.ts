// Explore's whole library (Ika, 2026-10-21), for the Explore all canvas: every title on the
// platform, each once. Today that's Explore's films (explore-data.ts) and the Made in Africa list;
// user-generated projects join here later as another `kind`. Where a title is in both, the Made in
// Africa one wins, since it has a page of its own.
import { FILMS, grainFor } from "@/components/explore/explore-data";
import { allEntries, coverFor, metaLine, titleHref } from "./made-in-africa";

export type LibraryItem = {
  key: string;
  title: string;
  /** Who made it, or what it is ("TV Series · 2020 · South Africa"). */
  credit: string;
  image: string | null;
  /** The stand-in gradient when there's no picture. */
  grain: string;
  /** A title page to go to, or one of Explore's films to preview in its pop-up. */
  open: { kind: "page"; href: string } | { kind: "film"; filmId: string };
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const fromList: LibraryItem[] = allEntries.map((e) => ({
  key: `t:${e.title.slug}`,
  title: e.title.title,
  credit: e.title.credit ?? metaLine(e.title),
  image: coverFor(e.title.slug),
  grain: e.grain,
  open: { kind: "page", href: titleHref(e.title.slug, "library") },
}));
const listed = new Set(allEntries.map((e) => norm(e.title.title)));

const fromFilms: LibraryItem[] = FILMS.filter((f) => !listed.has(norm(f.title))).map((f) => ({
  key: `f:${f.id}`,
  title: f.title,
  credit: f.director,
  image: f.posterUrl ?? f.stillUrl ?? null,
  grain: grainFor(f.id),
  open: { kind: "film", filmId: f.id },
}));

// Explore's own films first, then the list, in its curated order.
export const LIBRARY: LibraryItem[] = [...fromFilms, ...fromList];
