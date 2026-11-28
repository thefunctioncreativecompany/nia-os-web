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
    id: "comment-mentions",
    date: "2026-11-28",
    title: "@mention people in comments",
    body: "Type @ in a project's comments and pick someone on the project by name, username or email. They get a notification that opens the comment.",
    href: "/projects",
    cta: "Open your projects",
    icon: "chat",
    weight: { production: 0.85, fashion: 0.6, creator: 0.6 },
  },
  {
    id: "more-notifications",
    date: "2026-11-28",
    title: "Know when the production changes",
    body: "Nia tells you when a new document lands in a project, when the shoot dates, deliverables or budget change, and when someone adds you to a cast or crew, on your computer too.",
    href: "/settings/general",
    cta: "Check your notifications",
    icon: "chat",
    weight: { production: 0.9, fashion: 0.6, creator: 0.6 },
  },
  {
    id: "milestone-assignees",
    date: "2026-11-25",
    title: "Who's on each milestone",
    body: "Name someone from the crew as you add an action and it's theirs. View all shows every milestone by when it's due, with department, stage, priority and notes.",
    href: "/projects",
    cta: "Open your projects",
    icon: "flag",
    weight: { production: 0.9, fashion: 0.7, creator: 0.6 },
  },
  {
    id: "desktop-notifications",
    date: "2026-11-25",
    title: "Desktop notifications",
    body: "Turn them on in Settings and your computer tells you when someone shares a project with you, comments or asks for access, while Nia is open in the background.",
    href: "/settings/general",
    cta: "Turn them on",
    icon: "chat",
    weight: { production: 0.9, fashion: 0.7, creator: 0.7 },
  },
  {
    id: "reference-folders",
    date: "2026-11-25",
    title: "Reference folders",
    body: "Sort a project's references into folders like Lighting or Wardrobe: pictures, Explore titles and Instagram posts together. Open any one full screen with its note and where it came from.",
    href: "/projects",
    cta: "Open your projects",
    icon: "folder",
    weight: { production: 0.8, fashion: 0.9, creator: 0.8 },
  },
  {
    id: "desktop-app-offline",
    date: "2026-11-25",
    title: "Nia on your computer, documents offline",
    body: "Install Nia from Chrome or Edge (the install icon in the address bar) and it opens in its own window. Documents you open stay readable when the signal drops on set.",
    href: "/projects",
    cta: "Open your projects",
    icon: "folder",
    weight: { production: 0.9, fashion: 0.7, creator: 0.6 },
  },
  {
    id: "explore-franchises",
    date: "2026-11-21",
    title: "Franchises on Explore",
    body: "The Hunger Games, The Lord of the Rings, The Matrix, Shrek and Madagascar: every film and series has its own page, and each franchise gathers them in release order. Search a franchise's name to see them all.",
    href: "/explore/franchise/the-lord-of-the-rings",
    cta: "See The Lord of the Rings",
    icon: "cards",
    weight: { production: 0.5, fashion: 0.5, creator: 0.6 },
  },
  {
    id: "explore-search",
    date: "2026-11-19",
    title: "Search Explore by how it was made",
    body: "Search Explore by title, director, cast, look, camera, setting or mood, from Zendaya to golden hour, and narrow it with filters. Tap a tag on any title to find more made the same way.",
    href: "/explore",
    cta: "Search Explore",
    icon: "magnifier",
    weight: { production: 0.7, fashion: 0.9, creator: 0.9 },
  },
  {
    id: "upcoming-schedule",
    date: "2026-11-19",
    title: "Your upcoming schedule on Home",
    body: "Booked meetings and shoot days from all your projects in one list on Home, soonest first, with Join on the day of a meeting. View all opens the rest beside the page, and so does Activity.",
    href: "/home",
    cta: "Open Home",
    icon: "calendar",
    weight: { production: 0.9, fashion: 0.7, creator: 0.6 },
  },
  {
    id: "google-meet",
    date: "2026-11-19",
    title: "Book a Google Meet from a project",
    body: "Book a production meeting from a project's Meetings: Nia creates the Google Calendar event with a Meet link and sends the invites, and tells you who's busy before you book.",
    href: "/projects",
    cta: "Open a project",
    icon: "calendar",
    weight: { production: 0.95, fashion: 0.6, creator: 0.6 },
  },
  {
    id: "meetings",
    date: "2026-11-19",
    title: "Meeting notes on your projects",
    body: "Add notes from a production meeting, from Otter, Fireflies, Granola, Gemini, Zoom or Teams, to a project's Overview, with their sections and bullets kept. Change any point by typing, and send the action items to Key milestones in one tap.",
    href: "/projects",
    cta: "Open a project",
    icon: "memo",
    weight: { production: 1, fashion: 0.6, creator: 0.6 },
  },
  {
    id: "project-milestones",
    date: "2026-11-15",
    title: "Key milestones and actions",
    body: "Note the actions from a meeting and the milestones that matter, each with a date, on the project's Overview. Tick them off as they're done.",
    href: "/projects",
    cta: "Open a project",
    icon: "calendar",
    weight: { production: 1, fashion: 0.7, creator: 0.6 },
  },
  {
    id: "text-formatting-projects",
    date: "2026-11-15",
    title: "Bold, lists and links in your notes",
    body: "A project's description, notes and comments now take bold, italics, bullet and numbered lists and links, shown as you type.",
    href: "/projects",
    cta: "Open a project",
    icon: "memo",
    weight: { production: 0.8, fashion: 0.7, creator: 0.7 },
  },
  {
    id: "shot-list-from-pictures",
    date: "2026-11-15",
    title: "Shot lists from your references",
    body: "Drop your reference pictures on a shot list and each becomes a shot. Camera details wait under More detail until you need them, and the PDF shows the pictures.",
    href: "/templates/D06",
    cta: "Open the shot list",
    icon: "viewfinder",
    weight: { production: 0.9, fashion: 1, creator: 0.7 },
  },
  {
    id: "quick-add-people",
    date: "2026-11-15",
    title: "Add your crew in a line",
    body: "A name and a role are enough to start. Type @username or an email to bring in someone on Nia with their photo, or paste your whole crew list at once.",
    href: "/projects",
    cta: "Open a project",
    icon: "cards",
    weight: { production: 1, fashion: 0.8, creator: 0.6 },
  },
  {
    id: "by-festival",
    date: "2026-11-15",
    title: "By festival on Explore",
    body: "Cannes, the Berlinale, Toronto, Sundance, Venice and more: each festival opens the titles on Explore that screened or won there.",
    href: "/explore/festival/cannes",
    cta: "Open Cannes",
    icon: "seal",
    weight: { production: 0.6, fashion: 0.4, creator: 0.6 },
  },
  {
    id: "best-of-2026",
    date: "2026-11-15",
    title: "Best of 2026 on Explore",
    body: "The year's standouts in order, ranked by popularity, box office, festivals and what people open on Nia, from The Odyssey to Cannes winner La Bola Negra, each with its press kit.",
    href: "/explore/best-of-2026",
    cta: "Open Best of 2026",
    icon: "seal",
    weight: { production: 0.6, fashion: 0.5, creator: 0.7 },
  },
  {
    id: "project-tabs",
    date: "2026-11-12",
    title: "A new project page",
    body: "Your cover across the top, then tabs for crew, documents, references, comments and activity. Share and edit from the cover.",
    href: "/projects",
    cta: "Open a project",
    icon: "Clapperboard",
    weight: { production: 0.9, fashion: 0.9, creator: 0.8 },
  },
  {
    id: "comments",
    date: "2026-11-11",
    title: "Comments on projects and Explore",
    body: "Talk it through with your team under a project's description, and reply in threads. On Explore, anyone signed in can comment on a title.",
    href: "/projects",
    cta: "Open a project",
    icon: "MessageCircle",
    weight: { production: 0.8, fashion: 0.8, creator: 0.7 },
  },
  {
    id: "switch-accounts",
    date: "2026-11-11",
    title: "Switch between accounts",
    body: "Add another account from your profile menu and switch between them in one tap, without logging out. Back on the login page, continue as any account you've used here.",
    href: "/settings/profile",
    cta: "Open your profile",
    icon: "ArrowLeftRight",
    weight: { production: 0.6, fashion: 0.6, creator: 0.6 },
  },
  {
    id: "holiday-classics",
    date: "2026-11-11",
    title: "Holiday classics on Explore",
    body: "Fifteen Christmas films and holiday specials, from It's a Wonderful Life to Klaus and The Polar Express, each with its press kit.",
    href: "/explore/holiday-classics",
    cta: "Open Holiday classics",
    icon: "Snowflake",
    weight: { production: 0.6, fashion: 0.6, creator: 0.7 },
  },
  {
    id: "workflows",
    date: "2026-11-10",
    title: "Workflows",
    body: "Pick what you're making, like a client photoshoot, a month of content or a short film, and Nia sets up the project with the documents it needs, ready to fill in.",
    href: "/templates",
    cta: "See the workflows",
    icon: "Workflow",
    weight: { production: 0.9, fashion: 0.9, creator: 0.9 },
  },
  {
    id: "creator-planning-templates",
    date: "2026-11-10",
    title: "Content Calendar, Social Media Brief and Brand Deal Tracker",
    body: "Plan a month of posts, brief a campaign with its deliverables and rules, and keep every brand deal's fee, status and payment date in one list.",
    href: "/templates/G04",
    cta: "Open the Content Calendar",
    icon: "CalendarDays",
    weight: { production: 0.3, fashion: 0.5, creator: 0.95 },
  },
  {
    id: "photography-templates",
    date: "2026-11-10",
    title: "Five templates for photographers and stylists",
    body: "Photo Brief, Shot List (Photo), Event Brief, Usage License and Pull Sheet: plan a shoot, tick off each picture, track what was pulled and record what the client may do with the images.",
    href: "/templates/G14",
    cta: "Open the Photo Brief",
    icon: "Camera",
    weight: { production: 0.4, fashion: 1, creator: 0.5 },
  },
  {
    id: "explore-posters-studios",
    date: "2026-11-10",
    title: "Official posters and studios on Explore",
    body: "Explore titles now show their official posters, 36 more films and series have joined (Parasite, Oppenheimer, Squid Game), and you can browse by studio from the logos under Top 10.",
    href: "/explore",
    cta: "Open Explore",
    icon: "Clapperboard",
    weight: { production: 0.7, fashion: 0.5, creator: 0.5 },
  },
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
    title: "Search everything, even with a typo",
    body: "Find projects, documents, files, templates and Explore from one search. Search Explore by look or mood, like natural light. On phones too.",
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
    id: "greatest-tv",
    date: "2026-11-08",
    title: "Greatest TV, and more films to study",
    body: "A new Greatest TV shelf of sitcoms and drama series, all eight Harry Potter films, Chicago, Matilda and more, each with its cast and crew and a press kit.",
    href: "/explore/greatest-tv",
    cta: "Browse Greatest TV",
    icon: "Film",
    weight: { production: 0.6, fashion: 0.5, creator: 0.6 },
  },
  {
    id: "cast-crew",
    date: "2026-11-01",
    title: "Cast and crew on Explore",
    body: "Every film, series and creator film now shows who made it and who's in it. Open anyone to see their roles, their films and who they've worked with.",
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
