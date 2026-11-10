// The "Try" ideas in the navbar's search (NAVBAR_BUILD.md N4; Ika, 2026-11-10): one thing to
// search for, suited to the page you're on and to what you searched before, a new one each time
// the page changes (no timer: nothing loops). Plain functions, so they can be tested.
import { norm } from "@/lib/search";

export type Section = "home" | "projects" | "templates" | "explore";

/** Searches people in production make often: offered while nothing is typed. */
export const POPULAR = ["Call sheet", "Production budget", "Shotlist", "Invoice", "Natural light", "Music video"];

const DOCUMENTS = ["Call sheet", "Shotlist", "Production budget", "Invoice", "Crew contact list", "Filming notice"];
// Explore's ideas are tag labels (src/features/explore/tags.ts), so each one finds something.
export const EXPLORE_IDEAS = ["Natural light", "Handheld", "Golden hour", "Small crew", "Shot on film", "Set design", "Black and white"];

export const SECTION_IDEAS: Record<Section, string[]> = {
  home: DOCUMENTS,
  projects: DOCUMENTS,
  templates: ["Call sheet", "Shotlist", "Production budget", "Script breakdown", "Invoice", "Day in my life"],
  explore: EXPLORE_IDEAS,
};

/** The section a page belongs to, from its address. */
export function sectionOf(pathname: string): Section {
  if (pathname.startsWith("/explore")) return "explore";
  if (pathname.startsWith("/templates")) return "templates";
  if (pathname.startsWith("/projects")) return "projects";
  return "home";
}

/**
 * The idea to show: the section's list, up to three recent searches and (with Explore access) a
 * couple of Explore's, each once; `visit` (how many pages this tab has shown) picks which.
 */
export function pickIdea({ section, recent = [], exploreAccess, visit }: { section: Section; recent?: string[]; exploreAccess: boolean; visit: number }): string | null {
  const explore = new Set(EXPLORE_IDEAS.map(norm));
  const pool = [
    ...(section === "explore" && !exploreAccess ? SECTION_IDEAS.home : SECTION_IDEAS[section]),
    ...recent.slice(0, 3),
    ...(exploreAccess && section !== "explore" ? EXPLORE_IDEAS.slice(0, 2) : []),
  ];
  const seen = new Set<string>();
  const ideas = pool.filter((idea) => {
    const key = norm(idea.trim());
    if (!key || seen.has(key) || (!exploreAccess && explore.has(key))) return false;
    seen.add(key);
    return true;
  });
  return ideas.length ? ideas[Math.abs(Math.trunc(visit)) % ideas.length] : null;
}
