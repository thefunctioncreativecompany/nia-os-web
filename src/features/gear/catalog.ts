// The gear catalogue (docs/GEAR_SPEC.md): Nia's reference list of production gear, by department
// and category (src/data/gear/taxonomy.json, ShareGrid's rental categories). Shapes, search and
// the reading of typed lines only: the catalogue itself is the gear_catalog table
// (20261128000000_gear.sql), searched on first use (search.ts), never sent to every page.

import taxonomy from "@/data/gear/taxonomy.json";

export type CatalogItem = {
  /** A readable key that never changes: "sony-fx3". */
  id: string;
  name: string;
  /** Empty for generic gear (a C-stand). */
  brand: string | null;
  department: string;
  category: string;
  kind: "branded" | "generic";
  /** Sizes, colours or lengths folded into this item: "6x6 to 20x20". */
  variants: string | null;
  /** A licensed picture, when there is one. */
  imageUrl: string | null;
};

/** Departments in the order a gear list reads, prep to wrap. */
export const GEAR_DEPARTMENTS: readonly string[] = taxonomy.departments.map((d) => d.name);

const CATEGORIES = new Map(taxonomy.departments.map((d) => [d.name, d.categories]));
export const categoriesOf = (department: string): readonly string[] => CATEGORIES.get(department) ?? [];
export const isDepartment = (v: string) => CATEGORIES.has(v);

// Gear typed without picking from the catalogue still lands in a department.
const DEPARTMENT_OF: [RegExp, string][] = [
  // Sound first: "Zoom H6" is a recorder, not a lens, and "monitor headphones" are headphones. A bare
  // "recorder" is left to Monitors & video (Ninja, Shogun); sound recorders go by their names.
  [/\b(mic|microphone|lav|lavalier|boom ?pole|shotgun|mixer|headphones?|blimp|xlr|walkie|radio|intercom|audio|(?:sound|field) recorder|zoom [hf]\d+n?|tascam|sound devices)\b/i, "Audio"],
  [/\b(lens|prime|zoom|anamorphic|extender|adapter|speed ?booster|macro|probe)\b|\b\d{1,3}(-\d{1,3})?mm\b/i, "Lenses"],
  [/\b(matte ?box|follow focus|filter|nd|pro-?mist|polari[sz]er|battery|v-?mount|cage|slate|clapper(?:board)?|timecode|light ?meter)\b/i, "Camera accessories"],
  [/\b(tripod|sticks|fluid head|hi-?hat|baby legs|slider|dolly|track|gimbal|ronin|steadicam|easyrig|jib|crane|monopod)\b/i, "Camera support"],
  [/\b(monitor|recorder|ninja|shogun|teradek|transmitter|wireless video|converter|teleprompter)\b/i, "Monitors & video"],
  [/\b(c-?stand|stand|clamp|apple box|wedge|sandbag|flag|net|floppy|frame|rag|silk|grid cloth|bounce|reflector|poly ?board|green ?screen|cart|rope)\b/i, "Grip"],
  [/\b(light|led|hmi|tungsten|fresnel|panel|tube|softbox|lantern|dome|skypanel|aputure|nanlite|kino|strobe|flash|speedlight|dimmer)\b/i, "Lighting"],
  [/\b(generator|power station|distro|extension|cable drum|stinger)\b/i, "Power & distribution"],
  [/\b(card|sd|cfexpress|cfast|xqd|ssd|hard drive|drive|reader|laptop|tether)\b/i, "Media & DIT"],
  [/\b(haze|hazer|fog|smoke|wind machine)\b/i, "Atmospherics & SFX"],
  [/\b(gel|diffusion|tape|paper backdrop|seamless)\b/i, "Expendables"],
  [/\b(camera|body|camcorder|gopro|fx3|fx6|fx9|alexa|red komodo|a7s|bmpcc)\b/i, "Cameras"],
  [/\b(drone|van|truck|vehicle)\b/i, "Drones & vehicles"],
];

/** The department for gear typed in words, when it wasn't picked from the catalogue. */
export const guessDepartment = (name: string) => DEPARTMENT_OF.find(([re]) => re.test(name))?.[1] ?? "Other";

const plain = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
const squash = (s: string) => plain(s).replace(/[\s.]+/g, "");

/** Catalogue items for a search, best first: every word must match (in the name, brand or
 * category, spaces and hyphens ignored, so "c stand" finds "C-Stand 40""), then names that start
 * with the search, whole-word matches, and shorter names lead. */
export function rankCatalog(items: CatalogItem[], query: string, limit = 20): CatalogItem[] {
  const words = plain(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  const q = squash(query);
  const scored: { item: CatalogItem; score: number }[] = [];
  for (const item of items) {
    const name = plain(item.name);
    const hay = `${name} ${plain(item.brand ?? "")} ${plain(item.category)}`;
    const hayWords = hay.split(" ");
    const haySquash = squash(hay);
    if (!words.every((w) => hayWords.some((h) => h.startsWith(w)) || haySquash.includes(w)) && !haySquash.includes(q)) continue;
    let score = 0;
    if (squash(item.name).startsWith(q)) score += 100;
    else if (squash(item.name).includes(q)) score += 60;
    score += words.filter((w) => name.split(" ").includes(w)).length * 10;
    score += words.filter((w) => name.split(" ").some((h) => h.startsWith(w))).length * 5;
    score -= item.name.length / 20;
    scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, limit).map((s) => s.item);
}

/** A line of a pasted gear list: what and how many. */
export type GearLine = { name: string; quantity: number };

/** Pasted lines, one item each: "2x C-stand", "2 C-stands", "Sony FX3, 1", "Sandbag x 10",
 * "Sandbags (6)". Sizes stay part of the name ("4x4 floppy", "12x12 full silk", "Aputure 600x"). */
export function parseGearLines(text: string): GearLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 200)
    .map((line) => {
      let quantity = 1;
      let name = line;
      // "4 x 4 floppy" opens with a size, not a count.
      const size = /^\d{1,3}\s*[x×]\s*\d{1,3}\b/i.test(name);
      const lead = size ? null : (name.match(/^(\d{1,3})\s*[x×]\s+(.+)$/i) ?? name.match(/^(\d{1,3})\s+([a-z].*)$/i));
      const tail = name.match(/^(.+?)\s*(?:[,\t;]\s*|\s[x×]\s*)(\d{1,3})$/i) ?? name.match(/^(.+?)\s*\((\d{1,3})\)$/);
      if (lead) {
        quantity = Number(lead[1]);
        name = lead[2];
      } else if (tail) {
        quantity = Number(tail[2]);
        name = tail[1];
      }
      return { name: name.trim().slice(0, 160), quantity: Math.min(Math.max(quantity, 1), 999) };
    })
    .filter((l) => l.name);
}
