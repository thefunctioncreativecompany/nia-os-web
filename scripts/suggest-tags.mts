// Explore's tagger (Ika, 2026-11-10, FEEDBACK EX5): drafts a new title's details and tags from
// TMDB, so every title is tagged the same way. For each title in a batch it reads TMDB (genres,
// keywords, story summary, director or creator, countries, IMDb id, runtime) and turns genres and
// keywords into Nia tags through the fixed rules below. Every tag is checked against the tag list
// (src/features/explore/tags.ts); anything else is dropped. The draft is then finished by hand
// (camera, light, how it was made: what keywords can't say) and checked before it goes live:
// AI and rules propose, a person decides. Run from the project root with the TMDB key loaded:
//   npx tsx scripts/suggest-tags.mts scripts/out/next-batch.json
// Writes scripts/out/tag-drafts.json.
import { readFileSync, writeFileSync } from "node:fs";

import { GENRES } from "../src/lib/projects";
import { isTag } from "../src/features/explore/tags";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) throw new Error("Load TMDB_API_KEY from .env.local first.");

// TMDB genres (films and TV) → Nia's genres (src/lib/projects.ts) and tags.
const GENRE_MAP: Record<string, { genre?: string; tags: string[] }> = {
  Action: { genre: "Action", tags: ["energetic", "bold"] },
  Adventure: { genre: "Adventure", tags: ["wide-vistas"] },
  "Action & Adventure": { genre: "Action", tags: ["energetic"] },
  Animation: { genre: "Animation", tags: [] },
  Comedy: { genre: "Comedy", tags: ["playful"] },
  Crime: { genre: "Crime", tags: ["crime", "gritty"] },
  Documentary: { genre: "Documentary", tags: ["interviews"] },
  Drama: { genre: "Drama", tags: [] },
  Family: { genre: "Family", tags: ["family"] },
  Kids: { genre: "Family", tags: ["family", "playful"] },
  Fantasy: { genre: "Fantasy", tags: ["myth", "dreamlike"] },
  "Sci-Fi & Fantasy": { genre: "Sci-Fi", tags: ["future-world"] },
  History: { genre: "Historical", tags: ["history", "period-setting", "costume"] },
  Horror: { genre: "Horror", tags: ["tense", "mysterious"] },
  Music: { genre: "Music", tags: ["music", "music-led"] },
  Mystery: { genre: "Mystery", tags: ["mysterious"] },
  Romance: { genre: "Romance", tags: ["love"] },
  "Science Fiction": { genre: "Sci-Fi", tags: ["future-world"] },
  Thriller: { genre: "Thriller", tags: ["tense"] },
  War: { genre: "Historical", tags: ["history", "period-setting", "tense"] },
  "War & Politics": { genre: "Historical", tags: ["history", "politics"] },
  Western: { genre: "Adventure", tags: ["period-setting", "wide-vistas"] },
};

// TMDB keywords → tags, first match per rule. Kept broad on purpose; the hand pass trims.
const KEYWORD_RULES: [RegExp, string[]][] = [
  [/new york|los angeles|chicago|london|paris|tokyo|seoul|metropolis|city|urban/, ["city-streets"]],
  [/outer space|space travel|astronaut|planet|spacecraft|space station|wormhole|black hole/, ["future-world", "vfx"]],
  [/dystopi|post-apocalyptic|cyberpunk|artificial intelligence|android|robot|time travel/, ["future-world"]],
  [/superhero|based on comic|marvel cinematic|super power/, ["vfx", "energetic"]],
  [/based on novel|based on book|based on comic|based on (a )?play|based on short story|remake/, ["adaptation"]],
  [/based on (a )?true story|biography|biographical|historical figure/, ["true-story"]],
  [/world war|nazi|holocaust|ancient rome|roman empire|19th century|18th century|medieval|victorian|1940s|1950s|1960s|1970s|cold war/, ["period-setting", "history"]],
  [/war|soldier|battle|army|military/, ["tense"]],
  [/heist|murder|serial killer|detective|police|gangster|mafia|drug|crime boss|robbery/, ["crime", "tense"]],
  [/prison|escape|jail/, ["crime", "tense"]],
  [/revenge|vengeance|retribution/, ["revenge"]],
  [/love|romance|lovers|forbidden love|wedding/, ["love"]],
  [/gay|lesbian|lgbt|homosexual|queer|bisexual/, ["queer"]],
  [/father|mother|son|daughter|siblings|brother|sister|family/, ["family"]],
  [/friendship|best friend/, ["friendship"]],
  [/coming of age|teenager|teen|adolescence/, ["coming-of-age", "youth"]],
  [/high school|boarding school|school|college|university/, ["school"]],
  [/pirate|sea|ocean|ship|island|underwater|sailing|boat/, ["water"]],
  [/desert/, ["desert"]],
  [/snow|winter|arctic|antarctic/, ["snow"]],
  [/mountain/, ["mountains"]],
  [/jungle|forest|wilderness|nature/, ["nature"]],
  [/money|wealth|poverty|class|capitalism|debt|rich|poor|game show|competition/, ["money"]],
  [/politic|government|president|senator|election|nuclear|atomic bomb/, ["politics"]],
  [/mental illness|insomnia|schizophreni|depression|psychiatr|trauma|grief/, ["mental-health"]],
  [/musician|singer|band|concert|music/, ["music"]],
  [/dance|dancer|ballet/, ["dance"]],
  [/sport|boxing|football|basketball|baseball|tennis|olympic|gladiator/, ["sport"]],
  [/car chase|racing|race car|road trip|car/, ["cars", "roads"]],
  [/christmas|holiday/, ["joyful", "family"]],
  [/supernatural|ghost|monster|demon|creature|alien/, ["mysterious", "tense"]],
  [/dream|surreal|subconscious|hallucinat/, ["dreamlike"]],
  [/survival|survivor|stranded/, ["raw", "tense"]],
  [/hacker|computer|internet|technology|social media/, ["tech"]],
  [/fashion|model|designer/, ["fashion"]],
  [/food|restaurant|chef|cooking/, ["food-drink"]],
  [/religion|faith|god|mythology|myth|legend/, ["myth"]],
  [/painter|painting|artist|art/, ["art"]],
  [/small town|village|farm|countryside|rural/, ["rural"]],
  [/suburb|neighborhood|house|home/, ["home"]],
  [/satire|dark comedy|black comedy/, ["darkly-comic"]],
  [/nostalgi|1980s|80s/, ["nostalgic"]],
];

type Item = { slug: string; title: string; year: number; type: string };

async function tmdb(path: string, params = "") {
  const r = await fetch(`https://api.themoviedb.org/3/${path}?api_key=${KEY}${params}`, { signal: AbortSignal.timeout(20000) });
  return r.ok ? r.json() : null;
}

const list: Item[] = JSON.parse(readFileSync(process.argv[2], "utf8"));
const drafts: Record<string, unknown> = {};
for (const t of list) {
  const kind = t.type === "series" ? "tv" : "movie";
  const yearParam = kind === "tv" ? `&first_air_date_year=${t.year}` : `&year=${t.year}`;
  const found = (await tmdb(`search/${kind}`, `&query=${encodeURIComponent(t.title)}${yearParam}`))?.results?.[0];
  if (!found) {
    console.log(`${t.slug}: not found on TMDB`);
    continue;
  }
  const d = await tmdb(`${kind}/${found.id}`, `&append_to_response=keywords,credits,external_ids`);
  const genreNames: string[] = d.genres.map((g: { name: string }) => g.name);
  const keywords: string[] = (d.keywords?.keywords ?? d.keywords?.results ?? []).map((k: { name: string }) => k.name.toLowerCase());
  const tags = new Set<string>();
  const genres = new Set<string>();
  for (const g of genreNames) {
    const m = GENRE_MAP[g];
    if (!m) continue;
    if (m.genre && (GENRES as readonly string[]).includes(m.genre)) genres.add(m.genre);
    m.tags.forEach((x) => tags.add(x));
  }
  // Whole words only ("sea" isn't in "senate", "art" isn't in "parent").
  const words = (re: RegExp) => new RegExp(`\\b(?:${re.source})s?\\b`);
  for (const [re, add] of KEYWORD_RULES) if (keywords.some((k) => words(re).test(k))) add.forEach((x) => tags.add(x));
  // How it was made, from the size of the production.
  const crew = d.credits?.crew?.length ?? 0;
  if (crew > 80 || (d.budget ?? 0) > 20_000_000) tags.add("full-crew");
  if ((d.credits?.cast?.length ?? 0) > 25) tags.add("ensemble");
  tags.add(kind === "tv" ? "streaming" : "cinema");
  const director = kind === "tv" ? d.created_by?.map((p: { name: string }) => p.name).join(" & ") : d.credits?.crew?.filter((p: { job: string }) => p.job === "Director").map((p: { name: string }) => p.name).join(" & ");
  const dropped = [...tags].filter((x) => !isTag(x));
  drafts[t.slug] = {
    tmdb: `${kind}/${found.id}`,
    title: d.title ?? d.name,
    year: (d.release_date ?? d.first_air_date ?? "").slice(0, 4),
    imdb_id: d.imdb_id ?? d.external_ids?.imdb_id ?? null,
    credit: director || null,
    countries: (d.production_countries ?? d.origin_country?.map((c: string) => ({ name: c })) ?? []).map((c: { name: string }) => c.name),
    genres: [...genres],
    runtime: d.runtime ?? d.episode_run_time?.[0] ?? null,
    seasons: d.number_of_seasons ?? null,
    overview: d.overview,
    keywords,
    suggested: [...tags].filter(isTag),
    ...(dropped.length ? { dropped } : {}),
  };
  console.log(`${t.slug}: ${(drafts[t.slug] as { suggested: string[] }).suggested.length} tags suggested, ${keywords.length} keywords`);
  await new Promise((r) => setTimeout(r, 300));
}
writeFileSync("scripts/out/tag-drafts.json", JSON.stringify(drafts, null, 1) + "\n");
