import { formatDay, parseDay } from "@/lib/dates";

// Shared by the project screens on the server and in the browser.

export const PRODUCTION_TYPES = [
  "Film",
  "TV Series",
  "Short Film",
  "Documentary",
  "Music Video",
  "Commercial",
  "Interview",
  "Behind the Scenes",
  "Photo Shoot",
  "Live Event",
  // Added for creators and brand work (Ika, 2026-10-23); the database list matches
  // (supabase/migrations/20261105010000_more_production_types.sql).
  "Feature Film",
  "Web Series",
  "Fashion Film",
  "Editorial",
  "Lookbook",
  "Campaign",
  "Branded Content",
  "Social Content",
  "Podcast",
  "Corporate Video",
  "Trailer",
  "Stage Production",
] as const;

// Figma "Genre Selector Dropdown".
export const GENRES = [
  "Drama",
  "Action",
  "Comedy",
  "Documentary",
  "Horror",
  "Thriller",
  "Romance",
  "Sci-Fi",
  "Animation",
  "Musical",
  // Added (Ika, 2026-10-23). Genres are free text in the database, so these need no migration.
  "Crime",
  "Mystery",
  "Fantasy",
  "Adventure",
  "Historical",
  "Biography",
  "Family",
  "Coming of Age",
  "Experimental",
  "Fashion",
  "Lifestyle",
  "Sports",
  "Music",
  "Faith",
] as const;

export const STAGES = [
  "Development",
  "Pre-Production",
  "In Production",
  "Post-Production",
  "Wrapped",
] as const;

export type ProductionType = (typeof PRODUCTION_TYPES)[number];
export type Stage = (typeof STAGES)[number];

export type Project = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  productionType: ProductionType | null;
  stage: Stage;
  productionDate: string;
  duration: string;
  director: string;
  writers: string;
  genres: string;
  stars: string;
  shootStart: string | null;
  shootEnd: string | null;
  client: string;
  agency: string;
  dueDate: string | null;
  deliverables: Deliverable[];
  notes: string;
  logline: string;
  usage: string;
  looks: number | null;
  publication: string;
  crew: CrewMember[];
  ownerId: string;
  shareToken: string | null;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
};

/** Something handed over at the end: "3 × 15s cutdown, 9:16". */
export type Deliverable = { what: string; count: number; frame: string | null };
/** A person on the production with their role; `userId` when they're on Nia. */
export type CrewMember = { role: string; name: string; userId?: string };

/** "20 stills", "1 × 60s film · 16:9". */
export const deliverableText = (d: Deliverable) => `${d.count > 1 ? `${d.count} × ` : ""}${d.what}${d.frame ? ` · ${d.frame}` : ""}`;

/** "Nov 12, 2026 – Nov 14, 2026 · 3 shoot days", or one day. */
export function shootDatesText(start: string | null, end: string | null) {
  const a = start ? parseDay(start) : undefined;
  if (!start || !a) return "";
  const b = (end && parseDay(end)) || a;
  const n = Math.round((b.getTime() - a.getTime()) / 864e5) + 1;
  const range = !end || end === start ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`;
  return `${range} · ${n} shoot ${n === 1 ? "day" : "days"}`;
}

// Roles offered in Crew & talent (any other can be typed). Director, Writer and Talent hold the
// names that used to be Director, Writers and Stars.
export const CREW_ROLES = [
  "Director", "Producer", "Executive Producer", "Writer", "Director of Photography", "Camera Operator",
  "Gaffer", "Production Designer", "Art Director", "Editor", "Colourist", "Sound", "Composer",
  "Photographer", "Stylist", "Hair & Make-up", "Casting", "Production Manager", "Assistant Director",
  "Talent", "Model", "Creative Director", "Client Lead",
] as const;

// Details that fit some production types (Ika, 2026-10-23), beside the ones every project has.
export type TypeDetail = "logline" | "usage" | "looks" | "publication";
const STORY: ProductionType[] = ["Film", "Feature Film", "TV Series", "Web Series", "Short Film", "Documentary", "Trailer", "Stage Production"];
const BRAND: ProductionType[] = ["Commercial", "Campaign", "Branded Content", "Social Content", "Music Video", "Fashion Film", "Corporate Video"];
const STILLS: ProductionType[] = ["Photo Shoot", "Editorial", "Lookbook"];
export function typeDetails(type: ProductionType | null): TypeDetail[] {
  if (!type) return [];
  if (STORY.includes(type)) return ["logline"];
  if (BRAND.includes(type)) return ["usage"];
  if (STILLS.includes(type)) return ["looks", "publication"];
  return [];
}

// Production Info rows, in Figma order. `field` is the Project key; `column` the database one.
export const PRODUCTION_INFO = [
  { field: "productionDate", column: "production_date", label: "Date", placeholder: "e.g. July 2026", max: 80 },
  { field: "duration", column: "duration", label: "Duration", placeholder: "e.g. 3 minutes", max: 80 },
  { field: "director", column: "director", label: "Director", placeholder: "Who's directing", max: 200 },
  { field: "writers", column: "writers", label: "Writers", placeholder: "Names, separated by commas", max: 200 },
  { field: "genres", column: "genres", label: "Genres", placeholder: "e.g. Drama, Streaming", max: 200 },
  { field: "stars", column: "stars", label: "Stars", placeholder: "Lead cast", max: 300 },
] as const;

export type ProjectRole = "owner" | "editor" | "viewer";

export type ActivityItem = {
  id: number;
  projectId: string;
  projectTitle: string;
  actorName: string;
  isYou: boolean;
  action: string;
  detail: string;
  createdAt: string;
};

export const PROJECT_COLUMNS =
  "id, title, description, cover_url, production_type, stage, production_date, duration, director, writers, genres, stars, shoot_start, shoot_end, client, agency, due_date, deliverables, notes, logline, usage, looks, publication, crew, owner_id, share_token, updated_by_name, created_at, updated_at";

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  production_type: ProductionType | null;
  stage: Stage;
  production_date: string;
  duration: string;
  director: string;
  writers: string;
  genres: string;
  stars: string;
  shoot_start: string | null;
  shoot_end: string | null;
  client: string;
  agency: string;
  due_date: string | null;
  deliverables: Deliverable[] | null;
  notes: string;
  logline: string;
  usage: string;
  looks: number | null;
  publication: string;
  crew: CrewMember[] | null;
  owner_id: string;
  share_token: string | null;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
};

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverUrl: row.cover_url,
    productionType: row.production_type,
    stage: row.stage,
    productionDate: row.production_date,
    duration: row.duration,
    director: row.director,
    writers: row.writers,
    genres: row.genres,
    stars: row.stars,
    shootStart: row.shoot_start,
    shootEnd: row.shoot_end,
    client: row.client ?? "",
    agency: row.agency ?? "",
    dueDate: row.due_date,
    deliverables: Array.isArray(row.deliverables) ? row.deliverables : [],
    notes: row.notes ?? "",
    logline: row.logline ?? "",
    usage: row.usage ?? "",
    looks: row.looks,
    publication: row.publication ?? "",
    crew: Array.isArray(row.crew) ? row.crew : [],
    ownerId: row.owner_id,
    shareToken: row.share_token,
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// "2 hours ago", "Yesterday", "Jul 10".
export function timeAgo(iso: string, now: number) {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// The line under a project card: "Edited 2 hours ago • Kai Cenat".
export function projectMeta(project: Pick<Project, "createdAt" | "updatedAt" | "updatedByName">, now: number) {
  const edited = new Date(project.updatedAt).getTime() - new Date(project.createdAt).getTime() > 60_000;
  const when = edited
    ? `Edited ${timeAgo(project.updatedAt, now).toLowerCase()}`
    : `Created ${new Date(project.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  return project.updatedByName ? `${when} • ${project.updatedByName}` : when;
}

// What happened, in production language, for Recent Activity.
export function describeActivity(item: Pick<ActivityItem, "action" | "detail" | "projectTitle">) {
  const project = item.projectTitle || "Untitled project";
  switch (item.action) {
    case "created":
      return { verb: "created", object: project };
    case "renamed":
      return { verb: "renamed a project to", object: item.detail || "Untitled project" };
    case "updated":
      return { verb: "updated details for", object: project };
    case "cover_changed":
      return { verb: "changed the cover of", object: project };
    case "shared":
      return { verb: `shared ${project} with`, object: item.detail };
    case "unshared":
      return { verb: `removed ${item.detail || "someone"} from`, object: project };
    case "link_on":
      return { verb: "turned on the share link for", object: project };
    case "link_off":
      return { verb: "turned off the share link for", object: project };
    case "deleted":
      return { verb: "deleted", object: item.detail || project };
    // Documents and files (audit #9).
    case "doc_added":
      return { verb: `added ${item.detail || "a document"} to`, object: project };
    case "doc_removed":
      return { verb: `removed ${item.detail || "a document"} from`, object: project };
    case "doc_deleted":
      return { verb: `deleted ${item.detail || "a document"} from`, object: project };
    case "files_added":
      return { verb: `uploaded ${item.detail || "files"} to`, object: project };
    default:
      return { verb: "changed", object: project };
  }
}
