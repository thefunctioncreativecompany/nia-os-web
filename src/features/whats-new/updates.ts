// What's new on Nia (Ika, 2026-11-01): when someone who has taken the tour takes it again, it shows
// what's changed since then, the updates most relevant to their kind of work first. Each update is
// weighted for the three groups the beta is for (CLAUDE.md, "Next week" 1): production (producers
// and production managers), fashion (photographers and fashion or editorial creatives) and
// creators (creators and brand content). Add an entry here when something people can use goes
// live; only what's switched on (src/lib/features.ts) belongs here.

import { PROFESSION_SECTORS } from "@/lib/onboarding";

export type Group = "production" | "fashion" | "creator";
export const GROUP_LABEL: Record<Group, string> = {
  production: "producers and production teams",
  fashion: "photographers and fashion creatives",
  creator: "creators and brand teams",
};

export type Update = {
  id: string;
  /** The day it went live (YYYY-MM-DD). */
  date: string;
  title: string;
  /** What it does for the person, in a sentence or two. */
  body: string;
  href: string;
  cta: string;
  /** Lucide icon name for its preview (FlatIcon). */
  icon: string;
  /** 0 to 1: how much it matters to each group. */
  weight: Record<Group, number>;
};

export const UPDATES: Update[] = [
  {
    id: "budget-breakdown",
    date: "2026-10-30",
    title: "Production Budget and Script Breakdown",
    body: "Cost the shoot above and below the line with a contingency and a worked-out total, and break a scene down into cast, props, wardrobe and more.",
    href: "/templates/D02",
    cta: "Open the Production Budget",
    icon: "Calculator",
    weight: { production: 1, fashion: 0.5, creator: 0.4 },
  },
  {
    id: "creator-templates",
    date: "2026-10-30",
    title: "Templates for creators",
    body: "GRWM, Day in my life, Product review, Tutorial and nine more: plan the hook, the shots and the post, with the platform and posting time picked, not typed.",
    href: "/templates",
    cta: "See the templates",
    icon: "Sparkles",
    weight: { production: 0.2, fashion: 0.5, creator: 1 },
  },
  {
    id: "template-tutorials",
    date: "2026-10-31",
    title: "A short tutorial for each template",
    body: "Each template shows what it's for and how to fill it in, in a few seconds, when you preview it and the first time you open it.",
    href: "/templates",
    cta: "Preview a template",
    icon: "CirclePlay",
    weight: { production: 0.7, fashion: 0.7, creator: 0.7 },
  },
  {
    id: "search",
    date: "2026-10-31",
    title: "Search that understands you",
    body: "Find projects, documents, files, templates and Explore from one search, even with a typo. Search Explore by look or mood, like natural light. On phones too.",
    href: "/home",
    cta: "Try search (⌘K)",
    icon: "Search",
    weight: { production: 0.6, fashion: 0.6, creator: 0.6 },
  },
  {
    id: "dark-mode",
    date: "2026-10-31",
    title: "Dark mode",
    body: "Nia now follows your device's light or dark setting. Choose one for good in Settings, General, Appearance.",
    href: "/settings/general",
    cta: "Open Appearance",
    icon: "Moon",
    weight: { production: 0.5, fashion: 0.5, creator: 0.5 },
  },
  {
    id: "explore-top-studio",
    date: "2026-10-31",
    title: "Top 10 and By studio on Explore",
    body: "See what people on Nia open, save and add to projects most, and browse titles by the studio behind them.",
    href: "/explore",
    cta: "Open Explore",
    icon: "Trophy",
    weight: { production: 0.6, fashion: 0.5, creator: 0.6 },
  },
  {
    id: "classics",
    date: "2026-10-31",
    title: "Over 80 more classics to study",
    body: "From the studio era to Black Panther, each with what to study, its official trailer and a press kit of reviews and interviews.",
    href: "/explore/hollywood-classics",
    cta: "Browse Hollywood Classics",
    icon: "Film",
    weight: { production: 0.7, fashion: 0.4, creator: 0.4 },
  },
  {
    id: "cast-crew",
    date: "2026-11-01",
    title: "Cast and crew on Explore",
    body: "Creators' films now show who made them. Open anyone to see their roles, their films and who they've worked with.",
    href: "/explore/creators",
    cta: "Browse creators' films",
    icon: "Users",
    weight: { production: 0.6, fashion: 0.9, creator: 0.9 },
  },
  {
    id: "project-cast-crew",
    date: "2026-11-01",
    title: "Cast & crew for each project",
    body: "Keep everyone on a production in one place: their role or character, how to reach them, their agent and union, their usual week, and whether they're confirmed.",
    href: "/projects",
    cta: "Open a project's Cast & crew",
    icon: "Users",
    weight: { production: 1, fashion: 0.7, creator: 0.5 },
  },
];

/** The group someone's profession belongs to (onboarding's sectors); production when unknown. */
export function groupFor(profession: string | null | undefined): Group {
  const sector = PROFESSION_SECTORS.find((s) => s.roles.includes(profession ?? ""))?.sector ?? "";
  if (/Creator|Enterprise|Talent/.test(sector)) return "creator";
  if (/Photography|Design, Styling/.test(sector)) return "fashion";
  return "production";
}

/** What's new since `since` (an ISO time), most relevant to the group first, then newest. Explore's
 * updates only for people who can open Explore (it's early access). */
export function whatsNew(since: string, group: Group, { explore = true, limit = 6 }: { explore?: boolean; limit?: number } = {}): Update[] {
  const day = since.slice(0, 10);
  return UPDATES.filter((u) => u.date > day && (explore || !u.href.startsWith("/explore")))
    .toSorted((a, b) => b.weight[group] - a.weight[group] || b.date.localeCompare(a.date))
    .slice(0, limit);
}
