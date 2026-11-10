// Workflows (Ika, 2026-11-10; FEEDBACK B3, from Alvin: "people think in goals, not templates"):
// start from a goal and get a project with the documents that goal needs, as drafts ready to
// fill in. Three for each of the four groups Nia is for. Every document is a working template;
// none has more than five, the free plan's most per project (the tests check both).
import type { ProductionType } from "@/lib/projects";

export type Icp = "creators" | "filmmakers" | "photographers" | "studios";

export const ICPS: { id: Icp; label: string }[] = [
  { id: "creators", label: "Content creators" },
  { id: "filmmakers", label: "Filmmakers" },
  { id: "photographers", label: "Photographers" },
  { id: "studios", label: "Small studios" },
];

export type Workflow = {
  id: string;
  icp: Icp;
  /** The goal, as the person would say it. */
  name: string;
  /** What you end up with. */
  does: string;
  productionType: ProductionType;
  /** Template codes, in the order you'd fill them in. */
  templates: string[];
};

export const WORKFLOWS: Workflow[] = [
  // Content creators
  { id: "month-of-content", icp: "creators", name: "Plan a month of content", does: "A calendar for the month and a plan for each kind of video you'll post.", productionType: "Social Content", templates: ["G04", "D17", "D18", "D20", "D19"] },
  { id: "brand-deal", icp: "creators", name: "Deliver a brand deal", does: "The brief, the video plan, your deal tracker and the invoice, in one place.", productionType: "Branded Content", templates: ["G05", "D20", "G06", "D04"] },
  { id: "how-to-video", icp: "creators", name: "Film a how-to video", does: "The steps scripted, every shot listed and a log of your takes for the edit.", productionType: "Social Content", templates: ["D18", "D06", "D14"] },
  // Filmmakers
  { id: "short-film-prep", icp: "filmmakers", name: "Prep a short film", does: "From script breakdown to budget, shot list, crew list and the first call sheet.", productionType: "Short Film", templates: ["D05", "D02", "D06", "D03", "D01"] },
  { id: "shoot-day", icp: "filmmakers", name: "Run a shoot day", does: "The call sheet, the filming notice for neighbours, and logs for continuity, takes and kit.", productionType: "Film", templates: ["D24", "D07", "D13", "D14", "D08"] },
  { id: "develop-series", icp: "filmmakers", name: "Develop a series", does: "The series bible, a first episode broken down and a budget to pitch with.", productionType: "TV Series", templates: ["D11", "D05", "D02"] },
  // Photographers. "Editorial shoot" is the workflow designed first (the manifest's T01, Ika's
  // priority since October): its steps now map to the brief, pulls, shots, team and call sheet.
  { id: "client-photoshoot", icp: "photographers", name: "Plan a client photoshoot", does: "The brief, the shot list, the usage licence and the invoice.", productionType: "Photo Shoot", templates: ["G14", "G16", "G17", "D04"] },
  { id: "editorial-shoot", icp: "photographers", name: "Editorial shoot", does: "The brief, the pull sheet, the shot list, the team's contacts and the call sheet.", productionType: "Editorial", templates: ["G14", "G24", "G16", "D03", "D01"] },
  { id: "cover-event", icp: "photographers", name: "Cover an event", does: "The event brief, the must-have pictures, the usage licence and the invoice.", productionType: "Live Event", templates: ["G18", "G16", "G17", "D04"] },
  // Small production studios
  { id: "brand-campaign", icp: "studios", name: "Produce a brand campaign", does: "The social brief, the script, the budget, the shot list and the call sheet.", productionType: "Campaign", templates: ["G05", "D10", "D02", "D06", "D01"] },
  { id: "commercial", icp: "studios", name: "Make a commercial", does: "The script, the budget, the crew list, the detailed call sheet and the invoice.", productionType: "Commercial", templates: ["D10", "D02", "D03", "D24", "D04"] },
  { id: "documentary-shoot", icp: "studios", name: "Shoot a documentary", does: "The budget, the filming notice, the crew list, the call sheet and a log of what you shot.", productionType: "Documentary", templates: ["D02", "D07", "D03", "D01", "D14"] },
];

export const getWorkflow = (id: string) => WORKFLOWS.find((w) => w.id === id) ?? null;

/** The group a profession (from onboarding) belongs to; null when it could be any. */
export function icpFor(profession: string | null | undefined): Icp | null {
  if (!profession) return null;
  if (/photographer|styl|model|makeup|retouch/i.test(profession)) return "photographers";
  if (/creator|influencer|ugc|social|youtuber|streamer|podcast/i.test(profession)) return "creators";
  if (/producer|production (manager|company|coordinator)|agency|brand|marketing|creative director|studio|founder/i.test(profession)) return "studios";
  if (/direct|cinematograph|camera|editor|writer|gaffer|sound|colou?rist|design|script|\bad\b|dit/i.test(profession)) return "filmmakers";
  return null;
}
