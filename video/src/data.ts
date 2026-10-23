// Made in Africa, read from the same file the web app and the Supabase seed use.
import sources from "../../src/features/explore/cover-sources.json";
import raw from "../../src/features/explore/made-in-africa.json";

type RawTitle = {
  slug: string;
  collection: string;
  title: string;
  type: "film" | "series" | "short" | "documentary";
  year?: number;
  countries: string[];
  recognition?: string;
  pair_with: string;
  study_note: string;
};

const TYPES = { film: "Film", series: "TV Series", short: "Short Film", documentary: "Documentary" } as const;
// Co-producing countries outside Africa, left out of the country count.
const NOT_AFRICA = new Set(["United States", "France"]);

export const collections = raw.collections
  .filter((c) => c.category === "made-in-africa")
  .map((c) => ({ slug: c.slug, name: c.name }));

const inCategory = new Set(collections.map((c) => c.slug));
export const titles = (raw.titles as RawTitle[]).filter((t) => inCategory.has(t.collection));

export const countFor = (collection: string) => titles.filter((t) => t.collection === collection).length;

const years = titles.map((t) => t.year).filter((y): y is number => y != null);
export const stats = {
  titles: titles.length,
  collections: collections.length,
  countries: new Set(titles.flatMap((t) => t.countries).filter((c) => !NOT_AFRICA.has(c))).size,
  from: Math.min(...years),
  to: Math.max(...years),
};

export const cover = (slug: string) => (slug in sources ? `explore/made-in-africa/${slug}.jpg` : null);
export const covers = titles.map((t) => cover(t.slug)).filter((c): c is string => c !== null);

export const metaLine = (t: RawTitle) => [TYPES[t.type], t.year, t.countries.join(" / ")].filter(Boolean).join(" · ");

export function title(slug: string) {
  const t = titles.find((x) => x.slug === slug);
  if (!t) throw new Error(`No Made in Africa title "${slug}"`);
  return t;
}
