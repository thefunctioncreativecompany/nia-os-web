"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Carousel, type CarouselCard } from "@/components/nia/carousel";
import { FilterChip } from "@/components/nia/filter-bar";

// A prototype of Explore's feed (Ika, 2026-10-31), for review before it is built: Nia's own
// components and the Carousel, on sample stories from the links Ika sent. Every story is written
// in Nia's words and links out to its source; nothing is copied. Where a source can't be read
// from here (Deadline, Business Insider Africa), only its headline's facts are used and the rest
// is a placeholder in square brackets.

type Topic = "Incentives" | "Deals & funding" | "Creator economy" | "Africa" | "Festivals & awards";

type Story = {
  id: string;
  topic: Topic;
  headline: string;
  /** What it means for the person reading, in one line. */
  forYou: string;
  /** A few facts at a glance. */
  numbers: { value: string; label: string }[];
  /** A date to act on, when there is one. */
  deadline?: string;
  source: { outlet: string; href: string; date: string };
  /** Short points, in Nia's words. */
  points: string[];
  /** A few rows of detail, e.g. state by state. */
  table?: { head: string[]; rows: string[][] };
  cover: string;
  /** 0 to 1: how well it matches this person (profession, project types, places). */
  relevance: number;
  /** 0 to 1: money, rules or market size at stake. */
  impact: number;
  /** 0 to 1: how reliable and direct the source is. */
  importance: number;
  /** Days since it was published or updated. */
  age: number;
  /** Why it ranks where it does, in plain words. */
  why: string;
};

const STORIES: Story[] = [
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
    source: { outlet: "Greenslate", href: "https://greenslate.com/blog/state-by-state-film-tv-production-tax-credit-updates", date: "Updated 21 Oct 2026" },
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
    relevance: 0.8,
    impact: 0.95,
    importance: 0.85,
    age: 9,
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
    source: { outlet: "Greenslate", href: "https://greenslate.com/blog/state-by-state-film-tv-production-tax-credit-updates", date: "Updated 21 Oct 2026" },
    points: [
      "From 1 September 2026, stackable bonuses can raise the effective grant to 31% for qualifying productions.",
      "The criteria include post-production and crew payroll in the state.",
      "Texas allocated $300M every two years in 2025, building a $1.5B programme.",
    ],
    cover: "/feed/texas-31.svg",
    relevance: 0.6,
    impact: 0.8,
    importance: 0.8,
    age: 9,
    why: "A higher rate for crews and post-production in Texas",
  },
  {
    id: "compound-creative",
    topic: "Creator economy",
    headline: "CAA and TPG launch Compound Creative, a creator economy company",
    forYou: "A major agency and a major investor are building a company around creators. [What it offers creators and brands, from the article.]",
    numbers: [
      { value: "CAA × TPG", label: "Agency and investment firm" },
      { value: "[$—]", label: "[Money committed, from the article]" },
    ],
    source: { outlet: "Deadline", href: "https://deadline.com/2026/06/caa-tpg-launch-creator-economy-company-compound-creative-1236953040/", date: "June 2026" },
    points: ["[Who leads it.]", "[What it does for creators and brands.]", "[How much is behind it.]"],
    cover: "/feed/compound-creative.svg",
    relevance: 0.75,
    impact: 0.7,
    importance: 0.9,
    age: 130,
    why: "Big money moving into creator-led work like yours",
  },
  {
    id: "laditan-cannes",
    topic: "Africa",
    headline: "At Cannes Lions 2026, Google veteran Adetutu Laditan on the company she's building for Africa",
    forYou: "[What she is building and what it means for African creatives and brands, from the article.]",
    numbers: [
      { value: "Cannes Lions", label: "2026" },
      { value: "[—]", label: "[A figure from the article]" },
    ],
    source: { outlet: "Business Insider Africa", href: "https://africa.businessinsider.com/local/leaders/cannes-lions-2026-meet-google-veteran-adetutu-laditan-the-founder-building-africas/xbdcnml", date: "June 2026" },
    points: ["[What the company does.]", "[Who it is for.]", "[What she said at Cannes Lions.]"],
    cover: "/feed/laditan-cannes.svg",
    relevance: 0.7,
    impact: 0.55,
    importance: 0.7,
    age: 130,
    why: "African creative business, where many of your projects are made",
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
    source: { outlet: "Breakthrough Ventures", href: "https://breakvc.com/news/breakthrough-raises-debut-2-million-fund", date: "2 Feb 2026" },
    points: [
      "Founded by Stanford students Roman Scott and Itbaan Nafi.",
      "Backs early-stage, student-led companies, now from colleges across the US.",
      "Offers grants, possible investment, compute credits, legal help and mentors.",
    ],
    cover: "/feed/breakthrough-2m.svg",
    relevance: 0.15,
    impact: 0.3,
    importance: 0.5,
    age: 271,
    why: "Ranks low: it isn't about creative work",
  },
];

// Fresh news counts most; after about a month a story counts half as much.
const HALF_LIFE_DAYS = 30;
const scoreOf = (s: Story) => (0.45 * s.relevance + 0.35 * s.impact + 0.2 * s.importance) * Math.pow(0.5, s.age / HALF_LIFE_DAYS) ** 0.35;

const TOPICS: ("For you" | Topic)[] = ["For you", "Incentives", "Deals & funding", "Creator economy", "Africa", "Festivals & awards"];

export function FeedPrototype() {
  const ranked = useMemo(() => STORIES.toSorted((a, b) => scoreOf(b) - scoreOf(a)), []);
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("For you");
  const [open, setOpen] = useState(ranked[0].id);
  const shown = topic === "For you" ? ranked : ranked.filter((s) => s.topic === topic);
  const story = STORIES.find((s) => s.id === open)!;
  const cards: CarouselCard[] = ranked.map((s) => ({ name: s.id, src: s.cover, caption: s.headline, detail: `${s.topic} · ${s.source.outlet}` }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:px-8">
      <nav aria-label="Explore" className="flex gap-6 border-b border-border">
        <span className="pb-3 text-sm font-bold text-muted-foreground">Library</span>
        <span aria-current="page" className="border-b-2 border-gold pb-3 text-sm font-bold text-foreground">
          Feed
        </span>
      </nav>

      <section aria-labelledby="top-stories" className="flex flex-col items-center gap-2">
        <h1 id="top-stories" className="self-start text-h2 font-bold text-foreground">
          Top stories
        </h1>
        {/* The ring is a fixed 476 wide; phones draw it smaller rather than cut it off. */}
        <div className="max-w-full py-4 max-sm:-my-10 max-sm:scale-[0.72]">
          <Carousel cards={cards} front={ranked[0].id} label="Top stories" onOpen={(c) => setOpen(c.name)} />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <FilterChip key={t} on={topic === t} onClick={() => setTopic(t)}>
            {t}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <ol className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
          {shown.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setOpen(s.id)}
                className={cn(
                  "flex w-full gap-4 rounded-2xl border p-4 text-left outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                  open === s.id ? "border-foreground bg-secondary" : "border-border bg-white hover:bg-muted",
                )}
              >
                <span aria-hidden className="h-24 w-17 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${s.cover})` }} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-caption text-muted-foreground">
                    {s.topic} · {s.source.outlet} · {s.source.date}
                  </span>
                  <span className="text-base leading-snug font-bold text-foreground">{s.headline}</span>
                  <span className="line-clamp-2 text-small leading-normal text-foreground/80">{s.forYou}</span>
                  <span className="text-caption font-semibold text-muted-foreground">{s.why}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <article aria-labelledby="story" className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 rounded-2xl border border-border bg-white p-5 md:sticky md:top-6 md:p-6">
          <div className="flex flex-col gap-2">
            <span className="text-caption text-muted-foreground">
              {story.topic} · {story.source.date}
            </span>
            <h2 id="story" className="text-h3 leading-tight font-bold text-foreground">
              {story.headline}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/80">{story.forYou}</p>
          </div>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2">
            {story.numbers.map((n) => (
              <div key={n.label} className="flex flex-col gap-0.5 rounded-xl bg-muted p-3">
                <dt className="order-2 text-caption leading-snug text-muted-foreground">{n.label}</dt>
                <dd className="order-1 text-lead font-bold text-foreground tabular-nums">{n.value}</dd>
              </div>
            ))}
          </dl>
          {story.deadline && (
            <p className="flex items-start gap-2 rounded-xl border border-gold/50 bg-gold/10 p-3 text-small text-foreground">
              <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0" />
              {story.deadline}
            </p>
          )}
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-normal text-foreground/90">
            {story.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {story.table && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-small">
                <thead className="bg-nia-panel text-left text-muted-foreground">
                  <tr>{story.table.head.map((h) => <th key={h} className="px-3 py-2 font-bold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {story.table.rows.map((r) => (
                    <tr key={r[0]} className="border-t border-border">
                      {r.map((c, i) => <td key={i} className={cn("px-3 py-2", i === 0 && "font-semibold")}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <a href={story.source.href} target="_blank" rel="noreferrer">
                Read on {story.source.outlet} <ArrowUpRight aria-hidden data-icon="inline-end" />
              </a>
            </Button>
            <span className="text-caption text-muted-foreground">Summary written by Nia. The full story is the source&apos;s.</span>
          </div>
        </article>
      </div>
    </div>
  );
}
