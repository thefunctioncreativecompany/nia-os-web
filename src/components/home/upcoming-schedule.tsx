"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Clapperboard, Video } from "lucide-react";

import { parseDay, toDay } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/nia/side-panel";
import { ViewAll } from "@/components/nia/view-all";
import { setHomePanel, useHomePanel } from "@/components/home/home-panel";
import { UPCOMING_MAX, type UpcomingItem } from "@/features/schedule/shared";

type Row = { item: UpcomingItem; day: Date; at: number };

const noChange = () => () => {};

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/** "Today", "Tomorrow", or "Thu, Nov 20" (the year only when it isn't this year). */
function dayLabel(day: Date, today: Date) {
  const days = Math.round((new Date(day).setHours(0, 0, 0, 0) - today.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", ...(day.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }) });
}

/** A shoot's days: "3 shoot days" ahead of it, "Day 2 of 3" during it. */
function shootDays(start: Date, end: Date | null, today: Date) {
  const span = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
  const total = end ? span(start, end) : 1;
  if (total === 1) return "Shoot day";
  return today >= start ? `Day ${span(start, today)} of ${total}` : `${total} shoot days`;
}

/** Meetings by their start, a shoot on its first day (today, once it's under way); wrapped ones left out. */
function toRows(items: UpcomingItem[], today: Date): Row[] {
  return items
    .flatMap((item): Row[] => {
      if (item.kind === "meeting") {
        const start = new Date(item.startsAt);
        return [{ item, day: start, at: start.getTime() }];
      }
      const start = parseDay(item.start);
      const end = (item.end && parseDay(item.end)) || null;
      if (!start || (end ?? start) < today) return [];
      const day = start < today ? today : start;
      return [{ item, day, at: day.getTime() }];
    })
    .toSorted((a, b) => a.at - b.at);
}

// Home's Upcoming schedule (Ika, 2026-11-19; data from features/schedule/upcoming.ts): booked
// meetings and shoot days together, soonest first, each a tap from its project (a meeting opens in
// its panel). The first six here; View all opens the rest in the right panel. Shown in the
// person's own time zone, so it draws once the page is in the browser; nothing coming up, no section.
export function UpcomingSchedule({ items }: { items: UpcomingItem[] }) {
  // Today in the person's own time zone: only known in the browser (nothing drawn on the server).
  const day = useSyncExternalStore(
    noChange,
    () => toDay(new Date()),
    () => null,
  );
  const panel = useHomePanel();
  const today = day ? parseDay(day) : undefined;
  if (!today) return null;
  const rows = toRows(items, today);
  if (!rows.length) return null;

  return (
    <section aria-labelledby="upcoming" className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <h2 id="upcoming" className="text-subtitle font-semibold text-foreground">
          Upcoming schedule
        </h2>
        {rows.length > UPCOMING_MAX && <ViewAll onClick={() => setHomePanel("schedule")} className="ml-auto" />}
      </div>
      <ScheduleList rows={rows.slice(0, UPCOMING_MAX)} today={today} />
      {panel === "schedule" && (
        <div className="max-lg:[--preview-panel-w:100vw]">
          <SidePanel label="Upcoming schedule" onClose={() => setHomePanel(null)}>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-5 px-6 pt-6 pb-14 xl:px-9.5">
                <h2 className="text-h2 font-semibold tracking-tight text-foreground">Upcoming schedule</h2>
                <ScheduleList rows={rows} today={today} />
              </div>
            </div>
          </SidePanel>
        </div>
      )}
    </section>
  );
}

function ScheduleList({ rows, today }: { rows: Row[]; today: Date }) {
  return (
    <ul className="flex flex-col">
      {rows.map(({ item, day }) => {
        const meeting = item.kind === "meeting";
        const href = meeting ? `/projects/${item.projectId}?meeting=${item.id}` : `/projects/${item.projectId}`;
        const detail = meeting ? time(item.startsAt) : shootDays(parseDay(item.start)!, (item.end && parseDay(item.end)) || null, today);
        return (
          <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
            <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <span aria-hidden className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border">
                <span className="text-meta font-semibold text-muted-foreground">{day.toLocaleDateString(undefined, { month: "short" })}</span>
                <span className="text-lead leading-none font-semibold text-foreground tabular-nums">{day.getDate()}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {meeting ? <Video aria-hidden className="size-4 shrink-0 text-muted-foreground" /> : <Clapperboard aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="truncate">{meeting ? item.title : item.project}</span>
                </span>
                <span className="block truncate text-small text-muted-foreground">{[dayLabel(day, today), detail, meeting ? item.project : "Shoot"].join(" · ")}</span>
              </span>
            </Link>
            {meeting && item.meetLink && toDay(day) === toDay(today) && (
              <Button asChild variant="secondary" size="compact">
                <a href={item.meetLink} target="_blank" rel="noopener noreferrer" aria-label={`Join ${item.title} on Google Meet`}>
                  Join
                </a>
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
