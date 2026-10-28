// Explore's tags (Ika, 2026-10-28): 15 to 20 on every title and creator film, from one fixed
// list, so search, "For you" and a project's suggestions can match on how a piece looks, how it
// was shot, where, what it's about, its mood, how it was made and what it was made for. Some are
// worked out from the data (frame, region, decade, crew size, awards) or measured from the cover
// (cover-looks.json, scripts/measure-explore-covers.mjs); the rest are written by hand in
// tag-data.ts. Labels are sentence case and in production language.
import { findCreatorFilm } from "./creators";
import { findEntry, typeName } from "./made-in-africa";
import looks from "./cover-looks.json";
import { HAND_TAGS } from "./tag-data";

export type TagGroup = "look" | "camera" | "setting" | "subject" | "mood" | "craft" | "use" | "format";

export const GROUP_LABELS: Record<TagGroup, string> = {
  look: "Look",
  camera: "Camera",
  setting: "Setting",
  subject: "Subject",
  mood: "Mood",
  craft: "How it was made",
  use: "Made for",
  format: "Frame and origin",
};

const VOCABULARY: Record<TagGroup, Record<string, string>> = {
  look: {
    "black-and-white": "Black and white",
    "warm-palette": "Warm palette",
    "cool-palette": "Cool palette",
    "muted-colour": "Muted colour",
    "vivid-colour": "Vivid colour",
    "low-key": "Low-key lighting",
    "bright-airy": "Bright and airy",
    "natural-light": "Natural light",
    "golden-hour": "Golden hour",
    night: "Night",
    "high-contrast": "High contrast",
    "soft-light": "Soft light",
    "film-grain": "Film grain",
    neon: "Neon and practicals",
    painterly: "Painterly frames",
  },
  camera: {
    handheld: "Handheld",
    "slow-motion": "Slow motion",
    drone: "Drone shots",
    "locked-off": "Locked-off frames",
    tracking: "Tracking shots",
    "close-ups": "Close-ups",
    "wide-vistas": "Wide vistas",
    "fast-cutting": "Fast cutting",
    transitions: "Transitions",
    "long-takes": "Long takes",
    "car-rig": "Car rig",
    "shot-on-iphone": "Shot on iPhone",
    "shot-on-film": "Shot on film",
    "red-komodo": "RED Komodo",
    "sony-fx": "Sony FX cameras",
    "ai-shots": "AI-generated shots",
    archive: "Archive footage",
    miniatures: "Miniatures",
    "jump-cuts": "Jump cuts",
  },
  setting: {
    "city-streets": "City streets",
    studio: "Studio",
    interiors: "Interiors",
    home: "Home",
    nature: "Nature",
    mountains: "Mountains",
    desert: "Desert",
    water: "Sea and rivers",
    snow: "Snow",
    roads: "Roads and cars",
    museum: "Museums and galleries",
    "sports-ground": "Track and pitch",
    rural: "Rural",
    township: "Townships",
    office: "Office",
    transit: "Buses and trains",
    cafe: "Cafés and bars",
    school: "School",
    party: "Parties",
    "period-setting": "Period setting",
    "future-world": "Future world",
  },
  subject: {
    fashion: "Fashion",
    streetwear: "Streetwear",
    footwear: "Footwear",
    accessories: "Bags and accessories",
    eyewear: "Eyewear",
    beauty: "Beauty",
    sport: "Sport",
    football: "Football",
    music: "Music",
    dance: "Dance",
    "food-drink": "Food and drink",
    travel: "Travel",
    tech: "Tech and apps",
    cars: "Cars",
    youth: "Youth culture",
    family: "Family",
    friendship: "Friendship",
    love: "Love and romance",
    identity: "Identity",
    community: "Community",
    "mental-health": "Mental health",
    crime: "Crime",
    history: "History",
    myth: "Myth and faith",
    politics: "Politics",
    "coming-of-age": "Coming of age",
    women: "Women's stories",
    queer: "Queer stories",
    money: "Money and work",
    revenge: "Revenge",
    art: "Art",
    "online-culture": "Online culture",
  },
  mood: {
    playful: "Playful",
    moody: "Moody",
    nostalgic: "Nostalgic",
    intimate: "Intimate",
    energetic: "Energetic",
    calm: "Calm",
    tense: "Tense",
    dreamlike: "Dreamlike",
    raw: "Raw",
    luxurious: "Luxurious",
    gritty: "Gritty",
    joyful: "Joyful",
    melancholy: "Melancholy",
    bold: "Bold",
    uplifting: "Uplifting",
    mysterious: "Mysterious",
    "darkly-comic": "Darkly comic",
  },
  craft: {
    "spec-ad": "Spec ad",
    "one-person": "One-person crew",
    "small-crew": "Small crew",
    "full-crew": "Full crew",
    celebrity: "Celebrity talent",
    athletes: "Athletes",
    "street-casting": "Street casting",
    "non-actors": "Non-actors",
    ensemble: "Ensemble cast",
    movement: "Movement direction",
    "voice-over": "Voice-over",
    poetry: "Poetry",
    interviews: "Interviews",
    "practical-effects": "Practical effects",
    vfx: "VFX",
    "colour-grade": "Colour grade",
    "no-dialogue": "Little or no dialogue",
    "music-led": "Music-led",
    "product-shots": "Product close-ups",
    "set-design": "Set design",
    costume: "Costume and period design",
    "made-in-a-day": "Made in a day",
    adaptation: "Adaptation",
    "true-story": "True story",
    "genre-blend": "Genre blend",
    "local-language": "Local language",
    "award-winner": "Awards and festivals",
    collab: "Collaboration",
  },
  use: {
    "product-launch": "Product launch",
    "collection-drop": "Collection drop",
    "social-first": "Social-first",
    runway: "Runway and fashion week",
    magazine: "Magazine story",
    "brand-story": "Brand story",
    teaser: "Teaser",
    streaming: "Streaming",
    cinema: "Cinema release",
    tutorial: "Tutorial",
    "travel-diary": "Travel diary",
    portfolio: "Portfolio piece",
    "series-promo": "Series promo",
    announcement: "Announcement",
    "music-release": "Music release",
  },
  format: {
    vertical: "Vertical 9:16",
    "near-square": "Square or 4:5",
    "four-three": "4:3 frame",
    widescreen: "Widescreen",
    "feature-film": "Feature film",
    series: "Series",
    documentary: "Documentary",
    short: "Short",
    africa: "Africa",
    europe: "Europe",
    "north-america": "North America",
    asia: "Asia",
    "middle-east": "Middle East",
    oceania: "Oceania",
    "2020s": "2020s",
    "2010s": "2010s",
    "2000s": "2000s",
    "before-2000": "Before 2000",
  },
};

const GROUP_OF = new Map<string, TagGroup>(
  (Object.keys(VOCABULARY) as TagGroup[]).flatMap((g) => Object.keys(VOCABULARY[g]).map((id) => [id, g] as const)),
);
const LABEL_OF = new Map<string, string>((Object.values(VOCABULARY) as Record<string, string>[]).flatMap((tags) => Object.entries(tags)));

export const isTag = (id: string) => LABEL_OF.has(id);
export const tagLabel = (id: string) => LABEL_OF.get(id) ?? id;
export const tagGroup = (id: string): TagGroup => GROUP_OF.get(id) ?? "format";
/** Every tag, for search suggestions and tests. */
export const ALL_TAGS = [...LABEL_OF.keys()];

const REGIONS: Record<string, string> = {
  "South Africa": "africa", Nigeria: "africa", Kenya: "africa", Senegal: "africa", Lesotho: "africa", Mauritania: "africa", Zambia: "africa",
  Sudan: "africa", Chad: "africa", "DR Congo": "africa", Egypt: "africa", Morocco: "africa", Ghana: "africa", Rwanda: "africa", Benin: "africa",
  Tunisia: "africa", "United Kingdom": "europe", Belgium: "europe", Netherlands: "europe", France: "europe", "United States": "north-america",
  Canada: "north-america", Japan: "asia", Taiwan: "asia", Indonesia: "asia", "United Arab Emirates": "middle-east", Lebanon: "middle-east",
  "Saudi Arabia": "middle-east", Australia: "oceania",
};
const era = (year: number | null) => (!year ? null : year >= 2020 ? "2020s" : year >= 2010 ? "2010s" : year >= 2000 ? "2000s" : "before-2000");
const frame = (aspect: number) => (aspect < 0.7 ? "vertical" : aspect < 1.2 ? "near-square" : aspect < 1.5 ? "four-three" : "widescreen");
const KIND: Record<string, string> = { film: "feature-film", series: "series", documentary: "documentary", short: "short" };

/** The tags worked out from an item's own data. */
function derived(slug: string): string[] {
  const film = findCreatorFilm(slug);
  if (film) {
    const n = film.credits.length;
    return [frame(film.aspect), film.country ? REGIONS[film.country] : null, era(Number(film.date.slice(0, 4))), n >= 12 ? "full-crew" : n >= 4 ? "small-crew" : null].filter(
      (t): t is string => !!t,
    );
  }
  const entry = findEntry(slug);
  if (!entry) return [];
  const t = entry.title;
  return [KIND[t.type], ...t.countries.map((c) => REGIONS[c]), era(t.year), t.recognition ? "award-winner" : null].filter((x): x is string => !!x);
}

const cache = new Map<string, string[]>();
/** An item's tags, hand-written first, then measured and worked out; each once. */
export function tagsFor(slug: string): string[] {
  const hit = cache.get(slug);
  if (hit) return hit;
  const measured = (looks as Record<string, string[]>)[slug] ?? [];
  const tags = [...new Set([...(HAND_TAGS[slug] ?? []), ...measured, ...derived(slug)])].filter(isTag);
  cache.set(slug, tags);
  return tags;
}

/** An item's tags by group, in the vocabulary's group order, for a film's page. */
export function groupedTags(slug: string): { group: TagGroup; label: string; tags: { id: string; label: string }[] }[] {
  const tags = tagsFor(slug);
  return (Object.keys(VOCABULARY) as TagGroup[])
    .map((group) => ({ group, label: GROUP_LABELS[group], tags: tags.filter((t) => tagGroup(t) === group).map((id) => ({ id, label: tagLabel(id) })) }))
    .filter((g) => g.tags.length);
}

/** The words a search can match for an item's tags. */
export const tagText = (slug: string) => tagsFor(slug).map(tagLabel).join(" ").toLowerCase();

/** The production type an item counts as, for matching a project's type. */
export function itemType(slug: string): string | null {
  const film = findCreatorFilm(slug);
  if (film) return film.type;
  const entry = findEntry(slug);
  return entry ? typeName(entry.title) : null;
}
