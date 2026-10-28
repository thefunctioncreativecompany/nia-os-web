// Matching Explore to a project and to a person (Ika, 2026-10-28), from the tags in tags.ts.
// A project asks for tags through its type, genres, deliverables' frame shapes, the words in its
// title, description, logline, usage and notes, and the tags of the references it already has.
// A person's taste comes from what they open, save and add to projects, and their profession.
// Every suggestion keeps the two strongest reasons it was picked, in plain words.
import { creatorFilms } from "./creators";
import { findEntry, madeInAfrica } from "./made-in-africa";
import { itemType, tagLabel, tagsFor } from "./tags";

export type ProjectSignals = {
  title?: string;
  description?: string;
  logline?: string;
  usage?: string;
  notes?: string;
  publication?: string;
  genres: string;
  productionType: string | null;
  /** Deliverables' frame shapes, e.g. "9:16". */
  frames?: (string | null)[];
};

/** Tag → how much this person leans to it, 0 to 1. */
export type Taste = Map<string, number>;

export type Match = { slug: string; score: number; reasons: string[] };

/** What Explore suggests from: creators' films first, then the Made in Africa titles. */
export const SUGGESTION_POOL: string[] = [...creatorFilms.map((f) => f.slug), ...madeInAfrica.map((e) => e.title.slug)];

const TYPE_TAGS: Record<string, string[]> = {
  Commercial: ["product-shots", "product-launch", "brand-story"],
  Campaign: ["brand-story", "collection-drop", "celebrity"],
  "Branded Content": ["brand-story", "social-first"],
  "Social Content": ["social-first", "vertical", "one-person"],
  "Fashion Film": ["fashion", "movement", "collection-drop"],
  Editorial: ["magazine", "fashion"],
  Lookbook: ["fashion", "collection-drop", "studio"],
  "Photo Shoot": ["fashion", "studio", "natural-light"],
  "Music Video": ["music", "music-led", "music-release"],
  "Short Film": ["portfolio", "intimate", "short"],
  Film: ["cinema", "feature-film"],
  "Feature Film": ["cinema", "feature-film"],
  "TV Series": ["series", "streaming"],
  "Web Series": ["series", "streaming", "social-first"],
  Documentary: ["documentary", "interviews", "true-story"],
  Trailer: ["teaser", "series-promo"],
  "Behind the Scenes": ["portfolio", "raw"],
  "Live Event": ["announcement", "energetic", "party"],
  Interview: ["interviews"],
  "Corporate Video": ["brand-story", "office", "interviews"],
  Podcast: ["interviews"],
  "Stage Production": ["dance", "music"],
};

const GENRE_TAGS: Record<string, string[]> = {
  Drama: ["intimate"],
  Action: ["energetic"],
  Comedy: ["playful", "darkly-comic"],
  Documentary: ["true-story", "interviews"],
  Horror: ["tense", "mysterious"],
  Thriller: ["tense", "crime"],
  Romance: ["love"],
  "Sci-Fi": ["future-world"],
  Musical: ["music", "dance"],
  Crime: ["crime"],
  Mystery: ["mysterious"],
  Fantasy: ["myth", "dreamlike"],
  Adventure: ["travel", "wide-vistas"],
  Historical: ["history", "period-setting"],
  Biography: ["true-story"],
  Family: ["family"],
  "Coming of Age": ["coming-of-age", "youth"],
  Experimental: ["dreamlike", "art"],
  Fashion: ["fashion"],
  Lifestyle: ["travel", "food-drink"],
  Sports: ["sport", "athletes"],
  Music: ["music"],
  Faith: ["myth"],
};

// Words in a project's own text and the tags they point to.
const WORDS: [RegExp, string[]][] = [
  [/\b(sneakers?|shoes?|trainers?|footwear|boots?)\b/, ["footwear"]],
  [/\b(bags?|handbags?|jewell?e?ry|watch(es)?|accessor(y|ies))\b/, ["accessories"]],
  [/\b(glasses|eyewear|sunglasses|optical)\b/, ["eyewear"]],
  [/\b(skincare|make-?up|beauty|cosmetics?|fragrance|perfume)\b/, ["beauty"]],
  [/\b(streetwear|hoodies?|t-shirts?)\b/, ["streetwear"]],
  [/\b(fashion|collection|apparel|clothing|designer|garments?|(ss|fw|aw)\d\d)\b/, ["fashion"]],
  [/\b(lookbook|drop|capsule)\b/, ["collection-drop"]],
  [/\b(launch|new product)\b/, ["product-launch"]],
  [/\b(runway|catwalk|fashion week)\b/, ["runway"]],
  [/\b(magazine|editorial|cover story)\b/, ["magazine"]],
  [/\b(football|soccer)\b/, ["football", "sport"]],
  [/\b(sports?|athletes?|running|runners?|gym|fitness|basketball|rugby|tennis)\b/, ["sport", "athletes"]],
  [/\b(music|songs?|single|album|artist|rapper|band)\b/, ["music", "music-led"]],
  [/\b(dance|dancers?|choreograph\w*)\b/, ["dance", "movement"]],
  [/\b(food|restaurant|chef|coffee|drinks?|cocktails?|café|cafe|recipe|matcha)\b/, ["food-drink", "cafe"]],
  [/\b(travel|trip|journey)\b/, ["travel", "travel-diary"]],
  [/\b(cars?|driving|road trip|motorbikes?|motorcycles?)\b/, ["cars", "roads"]],
  [/\b(app|tech|software|startup|gadgets?)\b/, ["tech"]],
  [/\biphone\b/, ["tech", "shot-on-iphone"]],
  [/\b(tiktok|reels?|instagram|ugc|social)\b/, ["social-first", "vertical"]],
  [/\b(family|mother|father|sisters?|brothers?)\b/, ["family"]],
  [/\b(love|romance|romantic|wedding|couple)\b/, ["love"]],
  [/\b(friends?|friendship)\b/, ["friendship"]],
  [/\b(school|students?|campus)\b/, ["school", "youth"]],
  [/\b(youth|teens?|teenagers?|young|gen z)\b/, ["youth"]],
  [/\b(crime|heist|gangs?|police|detective|murder)\b/, ["crime", "tense"]],
  [/\b(history|historical|period|heritage)\b/, ["history", "period-setting"]],
  [/\b(myth|folklore|spirits?|ancestors?|ancestral|faith|church)\b/, ["myth"]],
  [/\bnight\b/, ["night"]],
  [/\b(golden hour|sunset|sunrise)\b/, ["golden-hour"]],
  [/\b(black and white|black-and-white|b&w|monochrome)\b/, ["black-and-white"]],
  [/\b(slow[- ]?mo|slow motion)\b/, ["slow-motion"]],
  [/\bdrones?\b/, ["drone"]],
  [/\bhandheld\b/, ["handheld"]],
  [/\b(film stock|16mm|35mm|super 8|kodak)\b/, ["shot-on-film", "film-grain"]],
  [/\b(studio|backdrop|cyclorama)\b/, ["studio"]],
  [/\b(streets?|city|urban|downtown)\b/, ["city-streets"]],
  [/\b(beach|ocean|sea|river|lake|pool|water)\b/, ["water"]],
  [/\b(mountains?|hike|hiking)\b/, ["mountains", "nature"]],
  [/\b(desert|dunes?)\b/, ["desert"]],
  [/\b(snow|winter|ski)\b/, ["snow"]],
  [/\b(nature|forest|outdoors?|park|garden)\b/, ["nature"]],
  [/\b(museum|gallery|exhibition|art)\b/, ["museum", "art"]],
  [/\b(home|house|apartment|kitchen|bedroom)\b/, ["home", "interiors"]],
  [/\b(office|workplace|corporate)\b/, ["office"]],
  [/\b(party|club|rave)\b/, ["party"]],
  [/\b(township|kasi|soweto)\b/, ["township"]],
  [/\b(interviews?|testimonials?|talking heads?)\b/, ["interviews"]],
  [/\b(voice-?over|narrat\w*)\b/, ["voice-over"]],
  [/\b(poem|poetry|spoken word)\b/, ["poetry"]],
  [/\bspec\b/, ["spec-ad"]],
  [/\b(celebrity|celebrities|influencers?)\b/, ["celebrity"]],
  [/\b(luxury|premium|high-end|couture)\b/, ["luxurious"]],
  [/\b(moody|noir)\b/, ["moody", "low-key"]],
  [/\b(nostalgia|nostalgic|vintage|retro|y2k)\b/, ["nostalgic", "film-grain"]],
  [/\b(playful|fun|funny|comedy|humou?r)\b/, ["playful"]],
  [/\b(energetic|hype|high energy)\b/, ["energetic", "fast-cutting"]],
  [/\b(calm|quiet|minimal|minimalist)\b/, ["calm"]],
  [/\b(intimate|personal)\b/, ["intimate"]],
  [/\b(dream|dreamy|surreal|ethereal)\b/, ["dreamlike"]],
  [/\b(vfx|cgi|visual effects)\b/, ["vfx"]],
  [/\b(ai|kling|sora|generative)\b/, ["ai-shots"]],
  [/\b(product|packshots?|pack shots?|tabletop)\b/, ["product-shots"]],
  [/\b(mental health|anxiety|depression|grief)\b/, ["mental-health"]],
  [/\b(queer|lgbtq?\+?)\b/, ["queer"]],
  [/\b(women|woman|female|girls)\b/, ["women"]],
  [/\b(community|neighbourhood|neighborhood)\b/, ["community"]],
  [/\b(identity|culture)\b/, ["identity"]],
  [/\b(long takes?|oner|one take)\b/, ["long-takes"]],
  [/\btransitions?\b/, ["transitions"]],
  [/\b(tutorial|how-to)\b/, ["tutorial"]],
  [/\b(teaser|announcement|trailer)\b/, ["teaser", "announcement"]],
  [/\b(streaming|netflix|episodes?)\b/, ["streaming", "series"]],
  [/\b(cinema|theatrical|festival)\b/, ["cinema", "award-winner"]],
  [/\b(africa|african|lagos|johannesburg|joburg|cape town|nairobi|accra|dakar|durban)\b/, ["africa"]],
  [/\b(london|paris|amsterdam|berlin|antwerp|europe)\b/, ["europe"]],
  [/\b(new york|nyc|los angeles|toronto|america)\b/, ["north-america"]],
  [/\b(tokyo|japan|seoul|taiwan|bali|asia)\b/, ["asia"]],
  [/\b(dubai|abu dhabi|uae|riyadh)\b/, ["middle-east"]],
  [/\b(sydney|melbourne|australia|auckland)\b/, ["oceania"]],
];

/** A deliverable's frame ("9:16", "16:9", "4:5", "1:1", "4:3") as the frame tag it matches. */
export function frameTag(frame: string): string | null {
  const m = frame.match(/(\d+(?:\.\d+)?)\s*[:x×]\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const ratio = Number(m[1]) / Number(m[2]);
  return ratio < 0.7 ? "vertical" : ratio < 1.2 ? "near-square" : ratio < 1.5 ? "four-three" : "widescreen";
}

type Want = { weight: number; why: string };

/** "a commercial", "an editorial", "a TV series": the type in a sentence, acronyms kept. */
export function aType(type: string) {
  const words = type.split(" ").map((w) => (w.length > 1 && w === w.toUpperCase() ? w : w.toLowerCase())).join(" ");
  return `${/^[aeiou]/i.test(words) ? "an" : "a"} ${words}`;
}

/** The tags a project asks for, each with how much and why. */
export function projectWants(p: ProjectSignals, referenceSlugs: string[] = []): Map<string, Want> {
  const wants = new Map<string, Want>();
  const add = (tag: string, weight: number, why: string) => {
    const had = wants.get(tag);
    // A tag asked for in several ways counts a little more, and keeps its strongest reason.
    if (!had) wants.set(tag, { weight, why });
    else wants.set(tag, { weight: Math.max(had.weight, weight) + 0.5, why: weight > had.weight ? why : had.why });
  };
  if (p.productionType) for (const t of TYPE_TAGS[p.productionType] ?? []) add(t, 1.5, tagLabel(t));
  for (const g of p.genres.split(",").map((x) => x.trim()).filter(Boolean)) for (const t of GENRE_TAGS[g] ?? []) add(t, 1.5, tagLabel(t));
  for (const f of p.frames ?? []) {
    const t = f ? frameTag(f) : null;
    if (t) add(t, 2.5, `${tagLabel(t)}, like your deliverables`);
  }
  const text = [p.title, p.description, p.logline, p.usage, p.notes, p.publication].filter(Boolean).join(" ").toLowerCase();
  if (text) for (const [re, tags] of WORDS) if (re.test(text)) for (const t of tags) add(t, 2, tagLabel(t));
  // References: the tags they share count most.
  const counts = new Map<string, number>();
  for (const slug of referenceSlugs) for (const t of tagsFor(slug)) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const [t, n] of counts) if (n >= Math.max(1, Math.ceil(referenceSlugs.length / 2))) add(t, 1 + Math.min(n, 3) * 0.3, `${tagLabel(t)}, like your references`);
  return wants;
}

/** Explore for a project, best first, with why each one was picked. */
export function rankForProject(p: ProjectSignals, leaveOut: Set<string>, referenceSlugs: string[] = [], taste?: Taste, count = 12): Match[] {
  const wants = projectWants(p, referenceSlugs);
  const genres = new Set(p.genres.split(",").map((x) => x.trim()).filter(Boolean));
  return SUGGESTION_POOL.filter((slug) => !leaveOut.has(slug))
    .map((slug, i) => {
      const why: { w: number; text: string }[] = [];
      if (p.productionType && itemType(slug) === p.productionType) why.push({ w: 4, text: `Also ${aType(p.productionType)}` });
      const shared = (findEntry(slug)?.title.genres ?? []).filter((g) => genres.has(g));
      if (shared.length) why.push({ w: 3 * shared.length, text: shared.join(" and ") });
      for (const t of tagsFor(slug)) {
        const want = wants.get(t);
        if (want) why.push({ w: want.weight, text: want.why });
      }
      const personal = taste ? tagsFor(slug).reduce((sum, t) => sum + (taste.get(t) ?? 0), 0) * 0.4 : 0;
      const score = why.reduce((sum, x) => sum + x.w, 0) + personal;
      const reasons = [...new Set(why.toSorted((a, b) => b.w - a.w).map((x) => x.text))].slice(0, 2);
      return { slug, score, reasons, i };
    })
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, count)
    .map(({ slug, score, reasons }) => ({ slug, score, reasons }));
}

// What a profession tends to look for, so a new account's "For you" isn't empty.
const PROFESSION_TAGS: [RegExp, string[]][] = [
  [/photo/i, ["fashion", "magazine", "natural-light", "studio"]],
  [/styl|fashion|model|designer/i, ["fashion", "streetwear", "collection-drop"]],
  [/cinematograph|photography|camera|dop|\bdp\b|gaffer/i, ["slow-motion", "handheld", "colour-grade", "natural-light"]],
  [/editor|colou?rist|post/i, ["fast-cutting", "transitions", "colour-grade"]],
  [/producer|production manager|coordinator|assistant director/i, ["full-crew", "ensemble", "brand-story"]],
  [/director/i, ["intimate", "portfolio", "painterly"]],
  [/writer|screenwriter/i, ["adaptation", "true-story", "intimate"]],
  [/music|artist|composer|dj/i, ["music", "music-led", "music-release"]],
  [/creator|influencer|content|social/i, ["social-first", "shot-on-iphone", "travel-diary"]],
  [/brand|marketing|agency|creative director|strategist/i, ["brand-story", "product-launch", "social-first"]],
];

/**
 * A person's taste from what they did: added to a project counts most, then saved, then opened
 * (newest first counts more), plus a light nudge from their profession. Weights are scaled so the
 * strongest tag is 1.
 */
export function tasteFrom({ viewed = [], saved = [], referenced = [], profession = null }: { viewed?: string[]; saved?: string[]; referenced?: string[]; profession?: string | null }): Taste {
  const raw = new Map<string, number>();
  const bump = (slug: string, w: number) => {
    for (const t of tagsFor(slug)) raw.set(t, (raw.get(t) ?? 0) + w);
  };
  viewed.forEach((slug, i) => bump(slug, 1 / (1 + i / 20)));
  for (const slug of saved) bump(slug, 2);
  for (const slug of referenced) bump(slug, 3);
  if (profession) for (const [re, tags] of PROFESSION_TAGS) if (re.test(profession)) for (const t of tags) raw.set(t, (raw.get(t) ?? 0) + 2);
  const top = Math.max(0, ...raw.values());
  return new Map(top ? [...raw].map(([t, w]) => [t, w / top]) : []);
}

/** How well an item fits a person's taste: the mean of its tags' weights. */
export function tasteScore(slug: string, taste: Taste): number {
  const tags = tagsFor(slug);
  return tags.length ? tags.reduce((sum, t) => sum + (taste.get(t) ?? 0), 0) / tags.length : 0;
}

/** Items most like this one by shared tags (frame, region and decade count less). */
export function similarItems(slug: string, pool: string[], count = 10): string[] {
  const mine = new Set(tagsFor(slug));
  const light = new Set(["vertical", "near-square", "four-three", "widescreen", "2020s", "2010s", "2000s", "before-2000"]);
  return pool
    .filter((s) => s !== slug)
    .map((s, i) => ({ s, i, n: tagsFor(s).reduce((sum, t) => sum + (mine.has(t) ? (light.has(t) ? 0.3 : 1) : 0), 0) }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, count)
    .map((x) => x.s);
}

/** Every tag the matching refers to, for the tests. */
export const MAPPED_TAGS = [
  ...Object.values(TYPE_TAGS),
  ...Object.values(GENRE_TAGS),
  ...WORDS.map(([, tags]) => tags),
  ...PROFESSION_TAGS.map(([, tags]) => tags),
].flat();
