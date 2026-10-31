"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FEED_STORIES, FEED_TOPICS, rankFeed, type FeedReader, type FeedTopic } from "@/features/explore/feed";
import { Button } from "@/components/ui/button";
import { Carousel, type CarouselCard } from "@/components/nia/carousel";
import { FilterChip } from "@/components/nia/filter-bar";
import { ExploreTabs } from "@/components/explore/explore-tabs";

// Explore's feed (Ika, 2026-10-31), as approved in the prototype: the top stories on the
// carousel, a chip per topic, the ranked list, and the open story beside it (below on phones):
// what it means for you, the numbers, a date to act on, the points in Nia's words, any table,
// and a link to the source. Ranked for the reader by the kinds of production in their projects
// (src/features/explore/feed.ts), read once in the browser; until then, for everyone.
const TOP = 5;
type Chip = "For you" | FeedTopic;

export function ExploreFeed({ now }: { now: number }) {
  const [reader, setReader] = useState<FeedReader>({ types: [] });
  useEffect(() => {
    let live = true;
    createClient()
      .from("projects")
      .select("production_type")
      .is("deleted_at", null)
      .limit(200)
      .then(({ data }) => {
        const types = [...new Set((data ?? []).flatMap((p) => (p.production_type ? [p.production_type as string] : [])))];
        if (live && types.length) setReader({ types });
      });
    return () => {
      live = false;
    };
  }, []);

  const ranked = useMemo(() => rankFeed(FEED_STORIES, reader, now), [reader, now]);
  const chips: Chip[] = ["For you", ...FEED_TOPICS.filter((t) => FEED_STORIES.some((s) => s.topic === t))];
  const [chip, setChip] = useState<Chip>("For you");
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = chip === "For you" ? ranked : ranked.filter((s) => s.topic === chip);
  const story = ranked.find((s) => s.id === openId) ?? shown[0] ?? ranked[0];
  const cards: CarouselCard[] = ranked.slice(0, TOP).map((s) => ({ name: s.id, src: s.cover, caption: s.headline, detail: `${s.topic} · ${s.source.outlet}` }));

  return (
    <div className="flex w-full flex-col gap-10 px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <ExploreTabs current="feed" />

      <section aria-labelledby="top-stories" className="flex flex-col items-center gap-2">
        <h1 id="top-stories" className="self-start text-h2 font-semibold tracking-tight text-foreground">
          Top stories
        </h1>
        {/* The ring is a fixed 476 wide; phones draw it smaller rather than cut it off. */}
        <div className="max-w-full py-4 max-sm:-my-10 max-sm:scale-[0.72]">
          <Carousel key={ranked[0].id} cards={cards} front={ranked[0].id} label="Top stories" onOpen={(c) => setOpenId(c.name)} />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <FilterChip key={c} on={chip === c} onClick={() => setChip(c)}>
            {c}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <ol aria-label="Stories" className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
          {shown.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={story.id === s.id}
                onClick={() => setOpenId(s.id)}
                className={cn(
                  "hover-sweep flex w-full gap-4 rounded-2xl border p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  story.id === s.id ? "border-foreground bg-secondary" : "border-border bg-card hover:bg-muted",
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

        <article aria-labelledby="story" className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 rounded-2xl border border-border bg-card p-5 md:sticky md:top-6 md:p-6">
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
              <div key={n.label} className="flex flex-col gap-0.5 rounded-xl bg-secondary p-3">
                <dt className="order-2 text-caption leading-snug text-muted-foreground">{n.label}</dt>
                <dd className="order-1 text-lead font-bold text-foreground tabular-nums">{n.value}</dd>
              </div>
            ))}
          </dl>
          {story.deadline && (
            <p className="flex items-start gap-2 rounded-xl border border-nia-blue/50 bg-nia-blue/10 p-3 text-small text-foreground">
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
                  <tr>
                    {story.table.head.map((h) => (
                      <th key={h} scope="col" className="px-3 py-2 font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {story.table.rows.map((r) => (
                    <tr key={r[0]} className="border-t border-border">
                      {r.map((c, i) => (
                        <td key={i} className={cn("px-3 py-2 text-foreground", i === 0 && "font-semibold")}>
                          {c}
                        </td>
                      ))}
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
