// One shape for a production, finished or not (Ika, 2026-10-30; docs/design-program.md,
// "Explore models finished projects"). Every Explore title is a picture of a finished project; a
// user's project is the same picture with parts missing. Projects, Explore's titles, its press-kit
// films and its creator films are all read into this shape, so they can be compared part by part
// and the gap between a project and finished work like it can be measured. When a field is added
// to projects or to Explore, add it here for both.
import { recognizeAspect } from "@/lib/aspect-ratios";
import { parseDay } from "@/lib/dates";
import { CREW_ROLES, type CrewMember, type CrewRole, type Deliverable, type ProductionType, type Project } from "@/lib/projects";

export type ProductionProfile = {
  /** Where it comes from: a user's project, or Explore's title, press-kit film or creator film. */
  source: "project" | "title" | "film" | "creator";
  /** The project's id, or the Explore item's slug. */
  id: string;
  title: string;
  type: ProductionType | null;
  genres: string[];
  /** Frame shapes as written on a call sheet: "16:9", "9:16". */
  frames: string[];
  year: number | null;
  /** Running time in minutes (a 30-second film is 0.5). */
  minutes: number | null;
  episodes: number | null;
  shootDays: number | null;
  /** People and companies by role, roles from CREW_ROLES where the job is the same. */
  crew: CrewMember[];
  client: string | null;
  agency: string | null;
  brand: string | null;
  deliverables: Deliverable[];
  release: { platform: string | null; recognition: string | null; pressKit: boolean };
};

/** The parts a finished production has, in plain words, for measuring what a project is missing. */
export const PROFILE_PARTS = {
  type: "Type",
  genres: "Genres",
  frames: "Frame",
  year: "Year",
  length: "Length",
  crew: "Crew",
  cast: "Cast",
  client: "Client",
  deliverables: "Deliverables",
  release: "Release",
} as const;
export type ProfilePart = keyof typeof PROFILE_PARTS;

const CAST: string[] = ["Talent", "Model"] satisfies CrewRole[];
// Credited, but not people on the crew: the company, and a song's credit.
const NOT_PEOPLE: string[] = ["Production Company", "Music"] satisfies CrewRole[];

/** Which parts this profile has filled in. */
export function filledParts(p: ProductionProfile): Set<ProfilePart> {
  const has: Record<ProfilePart, boolean> = {
    type: p.type !== null,
    genres: p.genres.length > 0,
    frames: p.frames.length > 0,
    year: p.year !== null,
    length: p.minutes !== null || p.episodes !== null || p.shootDays !== null,
    crew: crewSize(p) > 0,
    cast: p.crew.some((c) => CAST.includes(c.role)),
    client: Boolean(p.client || p.brand),
    deliverables: p.deliverables.length > 0,
    release: Boolean(p.release.platform || p.release.recognition || p.release.pressKit),
  };
  return new Set((Object.keys(has) as ProfilePart[]).filter((k) => has[k]));
}

/** How many people worked behind the camera (cast, companies and songs left out). */
export function crewSize(p: ProductionProfile): number {
  const names = p.crew
    .filter((c) => !CAST.includes(c.role) && !NOT_PEOPLE.includes(c.role))
    .flatMap((c) => c.name.split(/\s*,\s*|\s+&\s+/))
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
  return new Set(names).size;
}

// ── Credit roles ──────────────────────────────────────────────────────────────────────────────
// Explore's creator films credit the same jobs in many spellings (221 across 550 credits, taken
// from Instagram captions). Each spelling, in lower case, and the Crew & talent role it's the same
// job as. A credit naming several jobs ("Director, DOP and editor") is split on commas and "and"
// after the whole spelling is looked up, so "Hair and make-up" stays one job.
const SAME_JOB: Record<string, CrewRole> = {
  // Direction
  "director": "Director",
  "film director": "Director",
  "co-director": "Director",
  "co-director and fashion film": "Director",
  "1st ad": "Assistant Director",
  "2nd ad": "Assistant Director",
  "assistant director": "Assistant Director",
  "creative director": "Creative Director",
  "writer": "Writer",
  "screenplay": "Writer",
  "casting": "Casting",
  // Producing
  "producer": "Producer",
  "producers": "Producer",
  "co-producer": "Producer",
  "line producer": "Producer",
  "local producer": "Producer",
  "head of production": "Producer",
  "executive producer": "Executive Producer",
  "ep": "Executive Producer",
  "production": "Production Company",
  "production company": "Production Company",
  "production partner": "Production Company",
  "post house": "Production Company",
  "production manager": "Production Manager",
  "production supervisor": "Production Manager",
  "unit manager": "Production Manager",
  // Camera
  "dop": "Director of Photography",
  "dp": "Director of Photography",
  "video dop": "Director of Photography",
  "director of photography": "Director of Photography",
  "camera": "Camera Operator",
  "camera operator": "Camera Operator",
  "2nd camera operators": "Camera Operator",
  "videographer": "Camera Operator",
  "jib operator": "Camera Operator",
  "phantom operator": "Camera Operator",
  "drone": "Camera Operator",
  "1st ac": "Camera Assistant",
  "2nd ac": "Camera Assistant",
  "focus puller": "Camera Assistant",
  "camera trainee": "Camera Assistant",
  "loader": "Camera Assistant",
  "loaders": "Camera Assistant",
  "photographer": "Photographer",
  "gaffer": "Gaffer",
  // Art
  "production designer": "Production Designer",
  "art director": "Art Director",
  "art direction": "Art Director",
  "set design": "Set Designer",
  "set designer": "Set Designer",
  // Post
  "editor": "Editor",
  "editors": "Editor",
  "edit": "Editor",
  "offline": "Editor",
  "offline editor": "Editor",
  "online editor": "Editor",
  "online edit": "Editor",
  "colourist": "Colourist",
  "colour": "Colourist",
  "colour grade": "Colourist",
  "grade": "Colourist",
  "vfx": "VFX",
  "vfx supervisor": "VFX",
  "animation": "VFX",
  // Sound and music
  "sound": "Sound",
  "sound mixer": "Sound",
  "sound mix": "Sound",
  "sound mix and design": "Sound",
  "sound design": "Sound",
  "sound recordist": "Sound",
  "sound supervision": "Sound",
  "boom operator": "Sound",
  "audio mix": "Sound",
  "mix": "Sound",
  "final mix": "Sound",
  "foley": "Sound",
  "sfx": "Sound",
  "composer": "Composer",
  "composition": "Composer",
  "score": "Composer",
  "music": "Music",
  // Wardrobe, hair and make-up
  "stylist": "Stylist",
  "styling": "Stylist",
  "wardrobe": "Stylist",
  "hair and make-up": "Hair & Make-up",
  "hair": "Hair & Make-up",
  "hair stylist": "Hair & Make-up",
  "make-up": "Hair & Make-up",
  "make-up artist": "Hair & Make-up",
  "grooming": "Hair & Make-up",
  "beauty": "Hair & Make-up",
  "barber": "Hair & Make-up",
  // In front of the camera
  "talent": "Talent",
  "starring": "Talent",
  "featuring": "Talent",
  "cast": "Talent",
  "main cast": "Talent",
  "supporting cast": "Talent",
  "lead character": "Talent",
  "artist": "Talent",
  "athlete": "Talent",
  "narrator": "Talent",
  "voice-over": "Talent",
  "model": "Model",
  // The client's side
  "cmo": "Client Lead",
  "ceo": "Client Lead",
  "cbo": "Client Lead",
  "ceo and partner": "Client Lead",
  "brand manager": "Client Lead",
  "director of brand": "Client Lead",
  "director of client experience": "Client Lead",
};

// Credits that name who the work is for rather than someone on the crew.
const FOR_WHOM: Record<string, "client" | "agency" | "brand"> = {
  "client": "client",
  "brand": "brand",
  "brands": "brand",
  "label": "brand",
  "retailer": "brand",
  "partner": "brand",
  "agency": "agency",
};

// Credits that aren't a person on the crew or who it's for: suppliers, thanks, the work itself.
export const NOT_CREW = new Set([
  "artwork", "catering", "club", "equipment", "film", "hand printing", "licence", "location",
  "locations", "magazine", "poem", "production supplies", "series", "social team", "specialty props",
  "streamer", "thanks to",
]);

// Real crew jobs Crew & talent has no role for, kept as credited. Listed so that a new spelling
// shows up in the tests and gets a decision (map it, or add it here).
export const KEPT_AS_TYPED = new Set([
  "additional footage", "ai shots", "art assistant", "art assistants", "art pa", "assistant",
  "assistant art director", "assistant to ae", "bbe", "bbg", "brand strategist", "bts", "bts photo",
  "bts stills", "choreographer", "commercial coordinator", "concept lead", "construction",
  "creative assistant", "creative associate", "creator", "data", "digitech", "dit", "dolly grip",
  "driver", "electric", "founder", "graphic designer", "grip", "head of development",
  "hmu assistant", "intern styling assistant", "interviewer", "key grip", "key pa", "key production assistant",
  "lead construction", "lighting", "lighting assistant", "manicurist", "movement",
  "movement director", "pa", "pas", "photo assistant", "photo retouch", "post-production",
  "production assistant", "production assistants", "production coordinator",
  "rave production coordinator", "riggers", "runner", "runners", "seamstress", "senior strategist",
  "set build", "set dresser", "set pa", "sfx supervisors", "site medic", "spark trainee", "sparks",
  "strategy director", "stylist assistant", "styling assistant", "styling assistants", "swing",
  "titles", "truck pa", "unit", "video", "vt",
]);

const isCrewRole = (r: string): r is CrewRole => (CREW_ROLES as readonly string[]).includes(r);

/** A credit's role split into the jobs it names, in lower case. */
export function roleParts(role: string): string[] {
  const whole = role.trim().toLowerCase();
  if (whole in SAME_JOB || whole in FOR_WHOM || NOT_CREW.has(whole) || KEPT_AS_TYPED.has(whole)) return [whole];
  return whole.split(/\s*,\s*|\s+and\s+/).filter(Boolean);
}

/** What a part of a credit's role is: a Crew & talent role, who it's for, kept as typed, not crew,
 * or unknown (a spelling nobody has decided on yet). */
export function classifyRolePart(part: string): CrewRole | "client" | "agency" | "brand" | "typed" | "not-crew" | "unknown" {
  if (part in SAME_JOB) return SAME_JOB[part];
  if (part in FOR_WHOM) return FOR_WHOM[part];
  if (NOT_CREW.has(part)) return "not-crew";
  if (KEPT_AS_TYPED.has(part)) return "typed";
  return isCrewRole(part) ? part : "unknown";
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Credits as written ("DOP: Jason Prins") into crew by Crew & talent role, and who it's for. */
export function readCredits(credits: { role: string; name: string }[]) {
  const crew: CrewMember[] = [];
  const forWhom: { client: string | null; agency: string | null; brand: string | null } = { client: null, agency: null, brand: null };
  for (const credit of credits) {
    const roles = new Set<string>();
    for (const part of roleParts(credit.role)) {
      const kind = classifyRolePart(part);
      if (kind === "client" || kind === "agency" || kind === "brand") forWhom[kind] ??= credit.name;
      else if (kind === "typed" || kind === "unknown") roles.add(capitalise(part));
      else if (kind !== "not-crew") roles.add(kind);
    }
    for (const role of roles) crew.push({ role, name: credit.name });
  }
  return { crew, ...forWhom };
}

// ── Projects ──────────────────────────────────────────────────────────────────────────────────

/** "3 minutes", "90 min", "1h 30", "60s" → minutes; null when it can't be read. */
export function parseMinutes(text: string): number | null {
  const t = text.toLowerCase();
  const h = t.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  const m = t.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/) ?? (h ? t.match(/(?:h|hr|hrs|hour|hours)\s*(\d+)\b/) : null);
  const s = t.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)\b/);
  if (!h && !m && !s) return null;
  return Number(h?.[1] ?? 0) * 60 + Number(m?.[1] ?? 0) + Number(s?.[1] ?? 0) / 60;
}

/** Shoot days from the project's shoot dates, counting both ends. */
export function shootDayCount(start: string | null, end: string | null): number | null {
  const a = start ? parseDay(start) : undefined;
  if (!a) return null;
  const b = (end && parseDay(end)) || a;
  return Math.round((b.getTime() - a.getTime()) / 864e5) + 1;
}

/** A frame as written on a deliverable ("9:16", "9x16") in its standard label. */
function frameLabel(frame: string): string | null {
  const m = frame.match(/(\d+(?:\.\d+)?)\s*[:x×]\s*(\d+(?:\.\d+)?)/);
  return m ? recognizeAspect(Number(m[1]), Number(m[2])).label : null;
}

const listOf = (text: string) => text.split(",").map((s) => s.trim()).filter(Boolean);

export function profileOfProject(p: Project): ProductionProfile {
  const year = p.shootStart ?? p.dueDate;
  return {
    source: "project",
    id: p.id,
    title: p.title,
    type: p.productionType,
    genres: listOf(p.genres),
    frames: [...new Set(p.deliverables.flatMap((d) => (d.frame ? [frameLabel(d.frame) ?? d.frame] : [])))],
    year: year ? Number(year.slice(0, 4)) : null,
    minutes: parseMinutes(p.duration),
    episodes: null,
    shootDays: shootDayCount(p.shootStart, p.shootEnd),
    crew: p.crew.filter((c) => c.name.trim()),
    client: p.client || null,
    agency: p.agency || null,
    brand: null,
    deliverables: p.deliverables,
    release: { platform: p.publication || null, recognition: null, pressKit: false },
  };
}
