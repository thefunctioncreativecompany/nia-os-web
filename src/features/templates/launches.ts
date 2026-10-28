// When each working template opened, and what it does for the person using it and for their
// team (Ika, 2026-10-28: make a big deal of new templates and the value they bring). Only
// templates that work in the editor are shown anywhere (catalog.ts); when another one is built,
// add it here with the day it goes live. For NEW_FOR_DAYS after that day it carries the gold
// "New" marker, leads the Templates page in "Just added" and is announced once on Home.
// The first set (FIRST_RELEASE) is what Nia opened with, so it's never marked new.

export type Launch = {
  /** The day it went live (YYYY-MM-DD). */
  launched: string;
  /** What it does for the person using it. */
  forYou: string;
  /** What it does for the rest of the crew or team. */
  forTeam: string;
};

export const FIRST_RELEASE = "2026-10-19";
export const NEW_FOR_DAYS = 30;

export const LAUNCHES: Record<string, Launch> = {
  D01: {
    launched: FIRST_RELEASE,
    forYou: "Put the day's call time, locations, shooting schedule and cast calls on one page, ready to send the night before.",
    forTeam: "Every department works from the same call time, address and schedule, so nobody arrives at the wrong place or hour.",
  },
  D03: {
    launched: FIRST_RELEASE,
    forYou: "Keep every crew member's position, phone and email in one list you can download or print.",
    forTeam: "Anyone on the project can find who to call in a department without asking around.",
  },
  D04: {
    launched: FIRST_RELEASE,
    forYou: "Bill a client with the line totals worked out in your currency, then mark the invoice paid.",
    forTeam: "Saved to the project, so producers can see what has been billed and what is still owed.",
  },
  D06: {
    launched: FIRST_RELEASE,
    forYou: "Plan each shot's type, angle and camera move scene by scene before the shoot day.",
    forTeam: "Camera, lighting and the 1st AD work through the same shot order, so set-ups are ready when they're called.",
  },
  D07: {
    launched: FIRST_RELEASE,
    forYou: "Write the notice for neighbours and businesses near a location: dates, times, parking and who to contact.",
    forTeam: "The location manager's details go out on every notice, so questions on the day reach one person.",
  },
  D08: {
    launched: FIRST_RELEASE,
    forYou: "Log each rented item with its serial number, vendor and the dates it goes out and comes back.",
    forTeam: "Camera, grip and production see what's still out, so nothing is returned late or lost at wrap.",
  },
  D10: {
    launched: FIRST_RELEASE,
    forYou: "Write a commercial or branded piece shot by shot, with what's heard beside what's seen.",
    forTeam: "Clients, the director and the editor read the same script, so approvals and the cut follow one plan.",
  },
  D13: {
    launched: FIRST_RELEASE,
    forYou: "Note each take's scene, shot, length and continuity details as you shoot.",
    forTeam: "Wardrobe, props and the editor can check what a scene looked like when it's picked up again.",
  },
  D14: {
    launched: FIRST_RELEASE,
    forYou: "Log every file and take from a card with a description, its length and whether to use it.",
    forTeam: "The editor starts from the takes marked to use instead of watching every clip.",
  },
};

const DAY = 24 * 60 * 60 * 1000;

/** Whether a template counts as new on `now`: opened after the first set, within NEW_FOR_DAYS. */
export function isFresh(code: string, now: number): boolean {
  const launch = LAUNCHES[code];
  if (!launch || launch.launched <= FIRST_RELEASE) return false;
  const since = now - Date.parse(`${launch.launched}T00:00:00Z`);
  return since >= 0 && since < NEW_FOR_DAYS * DAY;
}
