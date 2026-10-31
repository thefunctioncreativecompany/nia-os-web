// Explore's feed (Ika, 2026-10-31): news that changes how productions are planned, paid for and
// sold (incentives, deals, the creator economy, Africa's creative business), ranked by how much
// it matters to this person, how much is at stake and how reliable the source is, with fresh
// news first. Every story is written in Nia's words and links to its source; nothing is copied
// and no scores are taken from anyone. Ika approves each story before it's added here; Copilot
// will later draft them as proposals for her to approve.
import type { PRODUCTION_TYPES } from "@/lib/projects";

export type FeedTopic = "Incentives" | "Deals & funding" | "Creator economy" | "Africa" | "Festivals & awards";
export const FEED_TOPICS: FeedTopic[] = ["Incentives", "Deals & funding", "Creator economy", "Africa", "Festivals & awards"];
type ProductionType = (typeof PRODUCTION_TYPES)[number];

export type FeedStory = {
  id: string;
  topic: FeedTopic;
  headline: string;
  /** What it means for the person reading, in one line. */
  forYou: string;
  /** A few facts at a glance. */
  numbers: { value: string; label: string }[];
  /** A date to act on, when there is one. */
  deadline?: string;
  /** `published` is a day (2026-10-21) or, when only the month is known, a month (2026-06). */
  source: { outlet: string; href: string; date: string; published: string };
  /** Short points, in Nia's words. */
  points: string[];
  /** A few rows of detail, e.g. state by state. */
  table?: { head: string[]; rows: string[][] };
  cover: string;
  /** 0 to 1: how many people making work on Nia it touches. */
  reach: number;
  /** 0 to 1: money, rules or market size at stake. */
  impact: number;
  /** 0 to 1: how reliable and direct the source is. */
  importance: number;
  /** The kinds of production it matters most to; a person with projects of these types sees it higher. */
  types: ProductionType[];
  /** Why it ranks where it does, in plain words. */
  why: string;
};

const SCREEN: ProductionType[] = ["Film", "Feature Film", "TV Series", "Web Series", "Short Film", "Documentary"];
const BRAND: ProductionType[] = ["Commercial", "Campaign", "Branded Content", "Social Content", "Music Video", "Fashion Film"];

export const FEED_STORIES: FeedStory[] = [
  {
    id: "incentives-2026",
    topic: "Incentives",
    headline: "Which US states pay more to film in 2026",
    forYou: "Shooting in the US? Several states now return 30% or more of what you spend there. Check each cap before you lock locations.",
    numbers: [
      { value: "20–30%", label: "Federal credit proposed (24 Sep)" },
      { value: "30%", label: "Delaware's new transferable credit" },
      { value: "$20M", label: "Hawaii's new per-production cap" },
    ],
    deadline: "New York's independent film credit is open again, while funds last",
    source: { outlet: "Greenslate", href: "https://greenslate.com/blog/state-by-state-film-tv-production-tax-credit-updates", date: "Updated 21 Oct 2026", published: "2026-10-21" },
    points: [
      "A bipartisan bill introduced on 24 September would create a federal film incentive of 20% to 30%.",
      "Delaware signed a 30% transferable credit on in-state labour and spending, with $10M in funding.",
      "Wisconsin's film office is back: 30% on resident labour and local spend from 1 January 2026, $5M a year, $1M per project.",
      "Illinois extended its credit to 2038, up to 35% on in-state labour and vendors, plus 5% for certified green productions.",
      "Kentucky expects to hit its $75M annual cap for the first time this year.",
    ],
    table: {
      head: ["State", "What changed", "Rate or cap"],
      rows: [
        ["Federal", "Bill introduced 24 Sep 2026", "20–30%"],
        ["Delaware", "New credit signed", "30% · $10M fund"],
        ["Hawaii", "Local-hire bonus, higher caps", "+5% · $20M per production"],
        ["Illinois", "Extended to 2038", "Up to 35% (+5% green)"],
        ["New York", "Independent credit reopened 16 Sep", "Over $10M in costs"],
        ["Texas", "Stackable bonuses from 1 Sep", "Up to 31%"],
        ["Wisconsin", "Film office re-established", "30% · $5M a year"],
      ],
    },
    cover: "/feed/incentives-2026.svg",
    reach: 0.7,
    impact: 0.95,
    importance: 0.85,
    types: [...SCREEN, "Commercial"],
    why: "Money you can claim back, in places your projects could shoot",
  },
  {
    id: "texas-31",
    topic: "Incentives",
    headline: "Texas bonuses can now take a grant to 31%",
    forYou: "Productions that also do post-production and hire local crew in Texas can stack bonuses on top of the base grant.",
    numbers: [
      { value: "31%", label: "Top effective grant rate" },
      { value: "$1.5B", label: "Texas programme, over time" },
      { value: "1 Sep", label: "When the bonuses started" },
    ],
    source: { outlet: "Greenslate", href: "https://greenslate.com/blog/state-by-state-film-tv-production-tax-credit-updates", date: "Updated 21 Oct 2026", published: "2026-10-21" },
    points: [
      "From 1 September 2026, stackable bonuses can raise the effective grant to 31% for qualifying productions.",
      "The criteria include post-production and crew payroll in the state.",
      "Texas allocated $300M every two years in 2025, building a $1.5B programme.",
    ],
    cover: "/feed/texas-31.svg",
    reach: 0.5,
    impact: 0.8,
    importance: 0.8,
    types: [...SCREEN, "Commercial"],
    why: "A higher rate for crews and post-production in Texas",
  },
  {
    // Deadline can't be read from here, so this uses only what its headline and address say.
    id: "compound-creative",
    topic: "Creator economy",
    headline: "CAA and TPG launch Compound Creative, a creator economy company",
    forYou: "One of Hollywood's biggest talent agencies and a global investment firm are building a company around creators. The full story has what it offers.",
    numbers: [
      { value: "CAA × TPG", label: "Talent agency and investment firm" },
      { value: "June 2026", label: "Announced" },
    ],
    source: { outlet: "Deadline", href: "https://deadline.com/2026/06/caa-tpg-launch-creator-economy-company-compound-creative-1236953040/", date: "June 2026", published: "2026-06" },
    points: [
      "The new company is called Compound Creative.",
      "It is built for the creator economy: people who make and own their audience's content.",
    ],
    cover: "/feed/compound-creative.svg",
    reach: 0.6,
    impact: 0.7,
    importance: 0.9,
    types: [...BRAND, "Podcast"],
    why: "Big money moving into creator-led work",
  },
  {
    id: "breakthrough-2m",
    topic: "Deals & funding",
    headline: "Student accelerator Breakthrough Ventures raises a $2M debut fund",
    forYou: "For student founders: grants of up to $10,000 and investments of up to $50,000. Not aimed at creative work.",
    numbers: [
      { value: "$2M", label: "Debut fund" },
      { value: "$10K", label: "Grants, no equity" },
      { value: "$50K", label: "Possible investment" },
    ],
    source: { outlet: "Breakthrough Ventures", href: "https://breakvc.com/news/breakthrough-raises-debut-2-million-fund", date: "2 Feb 2026", published: "2026-02-02" },
    points: [
      "Founded by Stanford students Roman Scott and Itbaan Nafi.",
      "Backs early-stage, student-led companies, now from colleges across the US.",
      "Offers grants, possible investment, compute credits, legal help and mentors.",
    ],
    cover: "/feed/breakthrough-2m.svg",
    reach: 0.15,
    impact: 0.3,
    importance: 0.5,
    types: [],
    why: "Ranks low: it isn't about creative work",
  },
];

/** What Nia knows of the reader: the kinds of production in projects they can see. */
export type FeedReader = { types: string[] };

const DAY = 24 * 60 * 60 * 1000;
// Fresh news counts most; a story a month old counts about four fifths as much, a year old about
// a third (the half-life's effect is softened so a big story isn't buried in weeks).
const HALF_LIFE_DAYS = 30;
const SOFTEN = 0.35;
// A story about the kinds of work the reader makes moves this much closer to fully relevant.
const MATCH_LIFT = 0.5;

const publishedAt = (published: string) => Date.parse(published.length === 7 ? `${published}-15` : published);

export function ageInDays(story: FeedStory, now: number) {
  return Math.max(0, (now - publishedAt(story.source.published)) / DAY);
}

export function relevance(story: FeedStory, reader: FeedReader) {
  const matches = story.types.some((t) => reader.types.includes(t));
  return matches ? story.reach + (1 - story.reach) * MATCH_LIFT : story.reach;
}

/** Relevance counts most, then what's at stake, then the source; fresh news first. */
export function feedScore(story: FeedStory, reader: FeedReader, now: number) {
  const base = 0.45 * relevance(story, reader) + 0.35 * story.impact + 0.2 * story.importance;
  return base * Math.pow(0.5, ageInDays(story, now) / HALF_LIFE_DAYS) ** SOFTEN;
}

/** The time a request ranks against; the server reads it after `connection()`. */
export const feedNow = () => Date.now();

export function rankFeed(stories: FeedStory[], reader: FeedReader, now: number) {
  return stories.toSorted((a, b) => feedScore(b, reader, now) - feedScore(a, reader, now));
}
