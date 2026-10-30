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
  // The creator templates (Ika, 2026-10-30): plan a piece of social content from hook to post.
  D15: {
    launched: "2026-10-30",
    forYou: "Plan a get-ready-with-me from the first three seconds to the post: products with prices and links, each step of the look with its timing, and when and where it goes up.",
    forTeam: "A brand, editor or manager sees every product you'll show and the posting plan before you film.",
  },
  D16: {
    launched: "2026-10-30",
    forYou: "Turn a topic into an explainer: the hook, numbered key points, the voiceover, the B-roll you need and the pacing beat by beat.",
    forTeam: "Whoever shoots B-roll or builds the graphics works from the same shot list and script.",
  },
  D17: {
    launched: "2026-10-30",
    forYou: "Map a day in your life before you film it: the schedule, the places, the shots and what you'll say over them.",
    forTeam: "Anyone filming with you knows where you'll be and when, and which shots each place needs.",
  },
  D18: {
    launched: "2026-10-30",
    forYou: "Break a tutorial into timed steps, with the kit, the screen recording notes, the voiceover and the thumbnail.",
    forTeam: "An editor can cut to the step order and add the on-screen notes without guessing.",
  },
  D19: {
    launched: "2026-10-30",
    forYou: "Shape a story: the hook, the arc, the key moments, cutaways and pacing, so it holds people to the end.",
    forTeam: "The editor gets the beats and the cutaways in order, with the music you had in mind.",
  },
  D20: {
    launched: "2026-10-30",
    forYou: "Review a product honestly: its details and price in your currency, the features, pros and cons, demo shots and your verdict out of 10.",
    forTeam: "Brands and managers see what you'll cover and the disclosure and links before it goes live.",
  },
  D21: {
    launched: "2026-10-30",
    forYou: "Plan a haul or unboxing: every product with its brand, price and link, the opening, first impressions and your favourites.",
    forTeam: "Affiliate links and prices sit in one list a manager or brand can check.",
  },
  D26: {
    launched: "2026-10-30",
    forYou: "Write a sketch with its premise, characters and who plays them, the script, props and a numbered shot list.",
    forTeam: "Everyone in the skit knows their character, lines and props before the camera rolls.",
  },
  D27: {
    launched: "2026-10-30",
    forYou: "Plan a cook-with-me: the dish, servings, prep and cook times, ingredients, timed steps, plating and nutrition.",
    forTeam: "Whoever shops, preps or films has the ingredient list and step order in front of them.",
  },
  D28: {
    launched: "2026-10-30",
    forYou: "Plan a workout video: the level and goal, each exercise with form notes, sets, reps and rest, and the cues you'll say.",
    forTeam: "A trainer, filmer or editor follows the same exercise order and timing.",
  },
  D29: {
    launched: "2026-10-30",
    forYou: "Plan a room or space tour in order, with the details to show, the styling, the light and the transitions.",
    forTeam: "Whoever films or styles the space follows the room order and knows which details matter.",
  },
  D30: {
    launched: "2026-10-30",
    forYou: "Collect your audience's questions, prepare the answers and set the order you'll take them in.",
    forTeam: "A manager or editor sees which questions you'll answer and the call to action at the end.",
  },
  D31: {
    launched: "2026-10-30",
    forYou: "Take on a trend with its original link and sound, your twist, the shot sequence and the beat timing.",
    forTeam: "Anyone filming with you hits the same beats, props and timing.",
  },
  D02: {
    launched: "2026-10-30",
    forYou: "Cost above the line, below the line and additional spend line by line, with each group's subtotal, a contingency you set and the grand total worked out in your currency.",
    forTeam: "Producers and the client see one number and what each department is getting, and the shares show where the money goes before anyone books crew or kit.",
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
