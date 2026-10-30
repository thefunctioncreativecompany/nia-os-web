// "Projects like this had…" (Ika, 2026-10-30; docs/design-program.md, "Explore models finished
// projects", step 2). The project's production profile is compared with finished work like it on
// Explore, and what it's missing becomes a short list of next steps, each opening the template or
// the field that fills it, ordered by the project's phase. Runs on the server: the browser gets the
// list, not Explore's data.
import { crewSize, profileOfProject, type ProductionProfile } from "@/lib/production-profile";
import { CREW_ROLES, type Project, type Stage } from "@/lib/projects";
import { rankForProject, type ProjectSignals } from "./match";
import { profileFor } from "./profiles";

export type GapItem = {
  key: "shoot-dates" | "deliverables" | "frames" | "crew" | "call-sheets" | "shotlist" | "crew-list" | "invoice";
  label: string;
  /** "0 of 2", "Not started", "Not set". */
  status: string;
  /** How far along, 0 to 1, for items counted in parts. */
  progress?: number;
  /** A line under the label, e.g. the roles most often credited. */
  detail?: string;
  action: { label: string; href: string };
  done: boolean;
};

export type ProjectGap = {
  items: GapItem[];
  /** The Explore items it was compared with, best match first. */
  comparedWith: string[];
};

// Templates that fill a gap (src/data/templates.manifest.json).
const CALL_SHEETS = ["D01", "D24"];
const SHOTLIST = "D06";
const CREW_LIST = "D03";
const INVOICE = "D04";

const PREP: Stage[] = ["Development", "Pre-Production"];
const AFTER: Stage[] = ["Post-Production", "Wrapped"];

// Roles a project can add in Crew & talent, leaving out cast, companies and songs.
const BEHIND_CAMERA = new Set<string>(CREW_ROLES.filter((r) => !["Talent", "Model", "Production Company", "Music", "Client Lead"].includes(r)));
const rolesOf = (p: ProductionProfile) => new Set(p.crew.map((c) => c.role).filter((r) => BEHIND_CAMERA.has(r)));

const median = (xs: number[]) => {
  const s = xs.toSorted((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : 0;
};

const signalsOf = (p: Project): ProjectSignals => ({
  title: p.title,
  description: p.description,
  logline: p.logline,
  usage: p.usage,
  notes: p.notes,
  publication: p.publication,
  genres: p.genres,
  productionType: p.productionType,
  frames: p.deliverables.map((d) => d.frame),
});

/** Finished work on Explore most like this project: matched by type, genres, frames and words. */
export function comparablesFor(project: Project, count = 6): ProductionProfile[] {
  return rankForProject(signalsOf(project), new Set(), [], undefined, 24)
    .filter((m) => m.score > 0)
    .flatMap((m) => profileFor(m.slug) ?? [])
    .slice(0, count);
}

/** What this project is missing next to finished work like it, in the order its phase needs. */
export function projectGap(project: Project, documents: { templateCode: string }[], comparables: ProductionProfile[]): ProjectGap {
  const profile = profileOfProject(project);
  const made = (codes: string[]) => documents.filter((d) => codes.includes(d.templateCode)).length;
  const template = (code: string, another = false) => `/templates/${code}?project=${project.id}${another ? "&another=1" : ""}`;
  const prep = PREP.includes(project.stage);
  const after = AFTER.includes(project.stage);
  const items: GapItem[] = [];

  if (!after) {
    items.push({
      key: "shoot-dates",
      label: "Shoot dates",
      status: profile.shootDays ? `${profile.shootDays} shoot ${profile.shootDays === 1 ? "day" : "days"}` : "Not set",
      action: { label: "Add shoot dates", href: "#details" },
      done: profile.shootDays !== null,
    });
  }

  const framed = project.deliverables.filter((d) => d.frame).length;
  if (!project.deliverables.length) {
    items.push({ key: "deliverables", label: "What you're handing over", status: "Not set", action: { label: "Add deliverables", href: "#details" }, done: false });
  } else if (framed < project.deliverables.length) {
    items.push({
      key: "frames",
      label: "A frame shape for each deliverable",
      status: `${framed} of ${project.deliverables.length}`,
      progress: framed / project.deliverables.length,
      action: { label: "Add frame shapes", href: "#details" },
      done: false,
    });
  }

  // Crew: only finished work that credits a crew says how many roles a production like this had.
  const crewed = comparables.filter((c) => crewSize(c) >= 3);
  if (!after && crewed.length >= 2) {
    const want = median(crewed.map((c) => rolesOf(c).size));
    const have = rolesOf(profile);
    const counts = new Map<string, number>();
    for (const c of crewed) for (const r of rolesOf(c)) if (!have.has(r)) counts.set(r, (counts.get(r) ?? 0) + 1);
    const missing = [...counts].toSorted((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => r);
    if (want > 0) {
      items.push({
        key: "crew",
        label: `About ${want} crew ${want === 1 ? "role" : "roles"}`,
        status: `${Math.min(have.size, want)} of ${want}`,
        progress: Math.min(1, have.size / want),
        detail: missing.length ? `Most often credited: ${missing.join(", ")}` : undefined,
        action: { label: "Add roles", href: "#crew" },
        done: have.size >= want,
      });
    }
  }

  if (!after) {
    const days = profile.shootDays ?? 1;
    const sheets = made(CALL_SHEETS);
    items.push({
      key: "call-sheets",
      label: days > 1 ? "A call sheet for each shoot day" : "A call sheet for the shoot",
      status: `${Math.min(sheets, days)} of ${days}`,
      progress: Math.min(1, sheets / days),
      action: { label: sheets ? "Add a call sheet" : days > 1 ? "Start call sheets" : "Start the call sheet", href: template(CALL_SHEETS[0], sheets > 0) },
      done: sheets >= days,
    });
    const shotlists = made([SHOTLIST]);
    items.push({
      key: "shotlist",
      label: "A shot list before the shoot",
      status: shotlists ? "Started" : "Not started",
      action: { label: "Start shotlist", href: template(SHOTLIST) },
      done: shotlists > 0,
    });
  }

  if (!after && project.crew.filter((c) => c.name.trim()).length >= 3) {
    const lists = made([CREW_LIST]);
    items.push({
      key: "crew-list",
      label: "A crew contact list",
      status: lists ? "Started" : "Not started",
      action: { label: "Start crew list", href: template(CREW_LIST) },
      done: lists > 0,
    });
  }

  if (after) {
    const invoices = made([INVOICE]);
    items.push({ key: "invoice", label: "An invoice", status: invoices ? "Started" : "Not started", action: { label: "Start invoice", href: template(INVOICE) }, done: invoices > 0 });
  }

  // In production the day's paperwork comes first; in prep, the plan does.
  const order: GapItem["key"][] = prep
    ? ["shoot-dates", "deliverables", "frames", "crew", "call-sheets", "shotlist", "crew-list"]
    : ["call-sheets", "crew-list", "shotlist", "crew", "shoot-dates", "deliverables", "frames", "invoice"];
  items.sort((a, b) => Number(a.done) - Number(b.done) || order.indexOf(a.key) - order.indexOf(b.key));
  return { items, comparedWith: comparables.map((c) => c.id) };
}
